/* global SketchManager, setInterval, clearInterval, getClientIP */
"use strict";
kindFramework
    .directive('liveChart', ['$rootScope','$location','sketchbookService','SessionOfUserManager','ConnectionSettingService','kindStreamInterface', 'SunapiClient', 'PTZ_TYPE', 'Attributes', '$timeout', '$interval',
        function($rootScope, $location, sketchbookService, SessionOfUserManager, ConnectionSettingService, kindStreamInterface, SunapiClient, PTZ_TYPE, Attributes, $timeout, $interval){
            return{
                restrict:"E",
                replace: true,
                templateUrl: "./views/setup/common/liveChart.html",
                scope:{
                    liveChartOptions:"="
                },
                link:function(scope, elem){
                    var mAttr = Attributes.get();
                    var margin = {top: 35, right: 27, bottom: 40, left: 40};
                    var limit = 100;
                    var duration = 100;
                    var now = new Date(Date.now() - duration);
                    var DataQueue = [];
                    var svg;
                    var previous_data = 0;
                    var timer_promise = null;
                    var threshold;

                    var SliderWidth = 140;
                    /////  UI Style Calculate
                    elem[0].style.width = scope.liveChartOptions.width + SliderWidth + "px";
                    elem[0].style.height = scope.liveChartOptions.height + "px";

                    elem.find('div')[0].style.height = scope.liveChartOptions.ceil + 1 + "px";
                    elem.find('div')[0].style.width = (scope.liveChartOptions.width  - margin.right) + "px";
                    elem.find('div')[0].style.top = margin.top + "px";
                    elem.find('div')[0].style.left = (margin.left - margin.right + 2) + "px";

                    elem.find('div')[1].style.width = (scope.liveChartOptions.width) + "px";
                    // /////  UI Style Calculate

                    function changeGraphColor(){
                        var Percentage = getPercentage(scope.liveChartOptions.ThresholdLevel, scope.liveChartOptions.ceil, scope.liveChartOptions.floor) + "%";

                        svg.selectAll("stop")
                            .data([
                                {offset: "0%", color: "#d2d2d2"},
                                {offset: Percentage, color: "#d2d2d2"},
                                {offset: Percentage, color: "#f37321"},
                                {offset: "100%", color: "#f37321"}
                            ]);
                        svg.selectAll("stop").attr("offset", function(d) { return d.offset; });
                    }

                    function OnThresholdBarChange()
                    {
                        $("#ThresholdBar").animate({marginTop: parseInt(scope.liveChartOptions.ceil - scope.liveChartOptions.ThresholdLevel) + "px"}, 0);
                        threshold.attr("y1", scope.liveChartOptions.ceil - scope.liveChartOptions.ThresholdLevel + margin.top);
                        threshold.attr("x2", scope.liveChartOptions.width - margin.right);
                        threshold.attr("y2", scope.liveChartOptions.ceil - scope.liveChartOptions.ThresholdLevel + margin.top);
                        changeGraphColor();
                    }

                    scope.levelPattern = mAttr.OnlyNumStr;
                    scope.liveSliderProperty =
                    {
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
                        updateCallback: function(data){
                            scope.liveSliderModel.data = data;
                            scope.liveChartOptions.ThresholdLevel = data;
                            OnThresholdBarChange();
                        }
                    };

                    function getPercentage(data, ceil, floor){
                        return Math.ceil( (data-floor) / (ceil-floor) * 100 );
                    }

                    var xScale = d3.time.scale()
                        .domain([now - (limit - 2), now - duration])    //  X축 처음값과 끝값 범위
                        .range([0, scope.liveChartOptions.width]);

                    var yScale = d3.scale.linear()
                        .domain([0, scope.liveChartOptions.ceil])
                        .range([scope.liveChartOptions.ceil, 0]);

                    var line = d3.svg.line()
                        .interpolate("linear")
                        .x(function (d, i) {
                            return xScale(now - (limit - 1 - i) * duration);
                        })
                        .y(function (d) {
                            // Add Exception
                            if (isNaN(d)) {
                                d = 0;
                            }
                            return yScale(d);
                        });

                    svg = d3.select(".graph").append("svg");

                    //Y 축
                    var Yaxis = svg.append("g")
                        .attr("class", "y axis")
                        .attr("transform", "translate(" + (scope.liveChartOptions.width - margin.right) + " , " + margin.top + ")")
                        .call(d3.svg.axis().scale(yScale).orient("right"));


                    threshold = svg.append("g").append("line")
                        .attr("x1", scope.liveChartOptions.floor)
                        .attr("y1", scope.liveChartOptions.ceil - scope.liveChartOptions.ThresholdLevel + margin.top)
                        .attr("x2", scope.liveChartOptions.width - margin.right)
                        .attr("y2", scope.liveChartOptions.ceil - scope.liveChartOptions.ThresholdLevel + margin.top)
                        .attr("class", "zeroline");

                    var paths = svg.append('g')
                        .attr('class', 'data');

                    var graphData = {
                        value: 0,
                        color: '#f37321',
                        data: d3.range(limit).map(function() {
                            return 0;
                        })
                    };

                    graphData.path = paths.append('path')
                        .data([graphData.data])
                        .attr('class', ' group')
                        .style('stroke', 'url(#temperature-gradient)');

                    var Percentage = getPercentage(scope.liveChartOptions.ThresholdLevel, scope.liveChartOptions.ceil, scope.liveChartOptions.floor) + '%';

                    svg.append("linearGradient")
                        .attr("id", "temperature-gradient")
                        .attr("gradientUnits", "userSpaceOnUse")
                        .attr("x1", 0).attr("y1", yScale(scope.liveChartOptions.floor))
                        .attr("x2", 0).attr("y2", yScale(scope.liveChartOptions.ceil))
                        .selectAll("stop")
                        .data([
                            {offset: "0%", color: "#d2d2d2"},
                            {offset: Percentage, color: "#d2d2d2"},
                            {offset: Percentage, color: "#f37321"},
                            {offset: "100%", color: "#f37321"}
                        ])
                        .enter().append("stop")
                        .attr("offset", function(d) { return d.offset; })
                        .attr("stop-color", function(d) { return d.color; });

                    var DataProcessing = $interval(function(){
                        now = new Date();

                        // Shift domain
                        if(DataQueue.length > 0)
                        {
                            $timeout.cancel(timer_promise);
                            previous_data = Number(DataQueue[0]);
                            DataQueue.shift();
                            graphData.data.push(previous_data);
                        }
                        else
                        {
                            if(timer_promise)
                            {
                                if(timer_promise.inspect().state === 'rejected')
                                {
                                    timer_promise = $timeout(function(){
                                        previous_data = 0;
                                    },1000);
                                }
                            }
                            DataQueue.shift();
                            graphData.data.push(previous_data);
                        }

                        xScale.domain([(now - (limit - 2) * duration), (now - duration)]);
                        graphData.path.attr('d', line).attr('transform', 'translate(' + (-1 * margin.left + 5) +','+ margin.top + ')');
                        graphData.data.shift();

                        paths.transition()
                            .duration(duration)
                            .ease('bais')
                            .attr('transform', 'translate(' + (scope.liveChartOptions.width - 400) +')');

                    },duration);

                    scope.$on("$destroy", function(){
                        $interval.cancel(DataProcessing);
                    });

                    function reSizeChart(){
                        Yaxis.attr("transform", "translate(" + (scope.liveChartOptions.width-margin.right) + " , " + margin.top + ")");
                        OnThresholdBarChange();
                    }

                    //Chart Option Changed
                    scope.$watch("liveChartOptions", function(newValue, oldValue) {
                        if(newValue.width !== oldValue.width)
                        {
                            reSizeChart();
                        }

                        if(newValue.height !== oldValue.height)
                        {
                            reSizeChart();
                        }

                        if(newValue.floor !== oldValue.floor)
                        {
                            scope.liveSliderProperty.floor = newValue.floor;
                            yScale.range([scope.liveChartOptions.ceil, scope.liveChartOptions.floor]);
                        }

                        if(newValue.ceil !== oldValue.ceil)
                        {
                            scope.liveSliderProperty.ceil = newValue.ceil;
                            yScale.range([scope.liveChartOptions.ceil, scope.liveChartOptions.floor]);
                        }

                        if(newValue.ThresholdLevel !== oldValue.ThresholdLevel)
                        {
                            scope.liveSliderModel.updateCallback(newValue.ThresholdLevel);
                        }
                    },true);

                    scope.liveChartOptions.EnqueueData = function(data){
                        if(!isNaN(data))
                        {
                            DataQueue.push(data);
                        }
                    };

                    scope.$on('liveChartDataClearAll', function(){
                        var graphData_index = graphData.data.length;
                        while(graphData_index--) {
                            graphData.data[graphData_index] = 0;
                        }
                        DataQueue.splice(0,DataQueue.length);
                    },true);
                }
            };
        }]);