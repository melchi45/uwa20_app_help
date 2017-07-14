/* global setInterval, clearInterval */
"use strict";
kindFramework.
  directive('liveChart', ['$rootScope', '$location', 'sketchbookService', 'SessionOfUserManager', 'ConnectionSettingService', 'kindStreamInterface', 'SunapiClient', 'PTZ_TYPE', 'Attributes', '$timeout', '$interval',
    function($rootScope, $location, sketchbookService, SessionOfUserManager, ConnectionSettingService, kindStreamInterface, SunapiClient, PTZ_TYPE, Attributes, $timeout, $interval) {
      return {
        restrict: "E",
        replace: true,
        templateUrl: "./views/setup/common/liveChart.html",
        scope: {
         /**
          * @param {Numer} ceil liveSlider.liveSliderProperty.ceil
          * @param {Numer} floor liveSlider.liveSliderProperty.floor
          * @param {Boolean} showInputBox liveSlider.liveSliderProperty.showInputBox
          * @param {Boolean} disabled liveSlider.liveSliderProperty.disabled
          * @param {Function} onEnd liveSlider.liveSliderProperty.onEnd
          * @param {Number} ThresholdLevel thresholdLevel value, Controller에서 $watch해서 사용함
          * @param {Number} width Chart 가로 사이즈
          * @param {Number} height Chart 세로 사이즈
          * @param {Function} EnqueueData Queue에 데이터를 넣음
          */
          liveChartOptions: "="
        },
        link: function(scope, elem) {
          var mAttr = Attributes.get();
          var margin = {
            top: 35,
            right: 27,
            bottom: 40,
            left: 40
          };
          var limit = 100;
          var duration = 70;
          var now = new Date(Date.now() - duration);
          var DataQueue = [];
          var svg = null;
          var previousData = 0;
          var timerPromise = null;
          var threshold = null;
          var dataprocessingPromise = null;
          var stopPromise = null;

          var graphBorder = elem.find('div')[0];
          var graph = elem.find("div")[1];

          var SliderWidth = 140;
          var COLOR = {
            GRAY: "#d2d2d2",
            POINT: "#f37321"
          };
          /////  UI Style Calculate
          elem[0].style.width = scope.liveChartOptions.width + SliderWidth + "px";
          elem[0].style.height = scope.liveChartOptions.height + "px";

          graphBorder.style.height = scope.liveChartOptions.ceil + 1 + "px";
          graphBorder.style.width = (scope.liveChartOptions.width - margin.right) + "px";
          graphBorder.style.top = margin.top + "px";
          graphBorder.style.left = (margin.left - margin.right + 2) + "px";

          graph.style.width = (scope.liveChartOptions.width) + "px";
          // /////  UI Style Calculate

          function changeGraphColor() {
            svg.
              selectAll("stop").
              data(getChartData());
            svg.selectAll("stop").attr("offset", function(d) {
              return d.offset;
            });
          }

          function OnThresholdBarChange() {
            $("#ThresholdBar").animate({
              marginTop: parseInt(scope.liveChartOptions.ceil - scope.liveChartOptions.ThresholdLevel) + "px"
            }, 0);
            threshold.attr("y1", scope.liveChartOptions.ceil - scope.liveChartOptions.ThresholdLevel + margin.top);
            threshold.attr("x2", scope.liveChartOptions.width - margin.right);
            threshold.attr("y2", scope.liveChartOptions.ceil - scope.liveChartOptions.ThresholdLevel + margin.top);
            changeGraphColor();
          }

          scope.levelPattern = mAttr.OnlyNumStr;
          scope.liveSliderProperty = {
            ceil: scope.liveChartOptions.ceil,
            floor: scope.liveChartOptions.floor,
            showSelectionBar: true,
            vertical: true,
            showInputBox: scope.liveChartOptions.showInputBox,
            disabled: scope.liveChartOptions.disabled,
            onEnd: scope.liveChartOptions.onEnd
          };
          scope.liveSliderModel = {
            data: scope.liveChartOptions.ThresholdLevel,
            updateCallback: function(data) {
              scope.liveSliderModel.data = data;
              scope.liveChartOptions.ThresholdLevel = data;
              OnThresholdBarChange();
            }
          };

          function getPercentage(data, ceil, floor) {
            return Math.ceil((data - floor) / (ceil - floor) * 100);
          }

          function getChartData(){
            var percentage = getPercentage(
              scope.liveChartOptions.ThresholdLevel,
              scope.liveChartOptions.ceil,
              scope.liveChartOptions.floor) + '%';

            return [
              {
                offset: "0%",
                color: COLOR.GRAY
              },
              {
                offset: percentage,
                color: COLOR.GRAY
              },
              {
                offset: percentage,
                color: COLOR.POINT
              },
              {
                offset: "100%",
                color: COLOR.POINT
              }
            ];
          }

          var xScale = d3.time.scale().
            domain([now - (limit - 2), now - duration]). //  X축 처음값과 끝값 범위
            range([0, scope.liveChartOptions.width]);

          var yScale = d3.scale.linear().
            domain([0, scope.liveChartOptions.ceil]).
            range([scope.liveChartOptions.ceil, 0]);

          var line = d3.svg.line().
            interpolate("linear").
            x(function(d, i) {
              return xScale(now - (limit - 1 - i) * duration);
            }).
            y(function(_d) {
              // Add Exception
              var d = _d;
              if (isNaN(d)) {
                d = 0;
              }
              return yScale(d);
            });

          svg = d3.select(".graph").append("svg");

          //Y 축
          var Yaxis = svg.append("g").
            attr("class", "y axis").
            attr("transform", "translate(" + (scope.liveChartOptions.width - margin.right) + " , " + margin.top + ")").
            call(d3.svg.axis().scale(yScale).orient("right"));


          threshold = svg.append("g").append("line").
            attr("x1", scope.liveChartOptions.floor).
            attr("y1", scope.liveChartOptions.ceil - scope.liveChartOptions.ThresholdLevel + margin.top).
            attr("x2", scope.liveChartOptions.width - margin.right).
            attr("y2", scope.liveChartOptions.ceil - scope.liveChartOptions.ThresholdLevel + margin.top).
            attr("class", "zeroline");

          var paths = svg.append('g').attr('class', 'data');

          var graphData = {
            value: 0,
            color: COLOR.POINT,
            data: d3.range(limit).map(function() {
              return 0;
            })
          };

          graphData.path = paths.append('path').
            data([graphData.data]).
            attr('class', ' group').
            style('stroke', 'url(#temperature-gradient)');

          svg.append("linearGradient").
            attr("id", "temperature-gradient").
            attr("gradientUnits", "userSpaceOnUse").
            attr("x1", 0).
            attr("y1", yScale(scope.liveChartOptions.floor)).
            attr("x2", 0).
            attr("y2", yScale(scope.liveChartOptions.ceil)).
            selectAll("stop").
            data(getChartData()).
            enter().append("stop").
            attr("offset", function(d) {
              return d.offset;
            }).
            attr("stop-color", function(d) {
              return d.color;
            });

          paths.transition().
            duration(duration).
            ease('bais').
            attr('transform', 'translate(' + (scope.liveChartOptions.width - 400) + ')');

          function run() {
            now = new Date();

            // Shift domain
            if (DataQueue.length > 0) {
              $timeout.cancel(timerPromise);
              previousData = Number(DataQueue[0]);
              DataQueue.shift();
              graphData.data.push(previousData);
            } else {
              if (timerPromise) {
                if (timerPromise.inspect().state === 'rejected') {
                  timerPromise = $timeout(function() {
                    previousData = 0;
                  }, 1000);
                }
              }
              DataQueue.shift();
              graphData.data.push(previousData);
            }

            xScale.domain([(now - (limit - 2) * duration), (now - duration)]);
            graphData.path.attr('d', line).attr('transform', 'translate(' + (-1 * margin.left + 5) + ',' + margin.top + ')');
            graphData.data.shift();
          }

          dataprocessingPromise = $interval(run, duration);

          function reSizeChart() {
            Yaxis.attr("transform", "translate(" + (scope.liveChartOptions.width - margin.right) + " , " + margin.top + ")");
            paths.transition().attr('transform', 'translate(' + (scope.liveChartOptions.width - 400) + ')');
            OnThresholdBarChange();
          }

          //Chart Option Changed
          scope.$watch("liveChartOptions", function(newValue, oldValue) {
            if (newValue.width !== oldValue.width) {
              reSizeChart();
            }

            if (newValue.height !== oldValue.height) {
              reSizeChart();
            }

            if (newValue.floor !== oldValue.floor) {
              scope.liveSliderProperty.floor = newValue.floor;
              yScale.range([scope.liveChartOptions.ceil, scope.liveChartOptions.floor]);
            }

            if (newValue.ceil !== oldValue.ceil) {
              scope.liveSliderProperty.ceil = newValue.ceil;
              yScale.range([scope.liveChartOptions.ceil, scope.liveChartOptions.floor]);
            }

            if(newValue.disabled !== oldValue.disabled) {
              scope.liveSliderProperty.disabled = newValue.disabled;
            }

            if (newValue.ThresholdLevel !== oldValue.ThresholdLevel) {
              scope.liveSliderModel.updateCallback(newValue.ThresholdLevel);
            }
          }, true);

          scope.liveChartOptions.EnqueueData = function(data) {
            if (!isNaN(data)) {
              DataQueue.push(data);
            }
          };

          scope.$on('liveChartDataClearAll', function() {
            var graphDataIndex = graphData.data.length;
            while (graphDataIndex--) {
              graphData.data[graphDataIndex] = 0;
            }
            DataQueue.splice(0, DataQueue.length);
          }, true);

          scope.$on('liveChartStop', function() {
            if (dataprocessingPromise !== null) {
              scope.$broadcast('liveChartDataClearAll');
              if(stopPromise === null)
              {
                  stopPromise = $timeout(function() {
                      $interval.cancel(dataprocessingPromise);
                      dataprocessingPromise = null;
                      stopPromise = null;
                  }, 200);
              }
            }
          }, true);

          scope.$on('liveChartStart', function() {
            if (dataprocessingPromise === null) {
              if(stopPromise !== null)
              {
                $timeout(function(){
                    dataprocessingPromise = $interval(run, duration);
                },200);
              }
              else
              {
                  dataprocessingPromise = $interval(run, duration);
              }
            }
          }, true);

          scope.$on("$destroy", function() {
            $interval.cancel(dataprocessingPromise);
          }, true);
        }
      };
    }
  ]);