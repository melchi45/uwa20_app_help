/* global sessionStorage */
"use strict";

kindFramework.controller('QMStatisticsCtrl', function(
  $q,
  $scope,
  $uibModal,
  $timeout,
  $state,
  $translate,
  $window,
  Attributes,
  ConnectionSettingService,
  pcSetupService,
  pcModalService,
  SunapiClient,
  QmModel
) {
  //Playerdata for Video
  $scope.playerdata = null;
  $scope.pageLoaded = false;
  $scope.checkSearching = false;

  $scope.sketchinfo = {};
  $scope.coordinates = [];

  var mAttr = Attributes.get();
  var qmModel = new QmModel();
  $scope.lang = qmModel.getStLang();

  $scope.queueData = {};
  $scope.queueData.dataLoad = false;

  var chartColor = {
    default: '#ddd',
    selected: '#399',
  };
  var graphTypes = ["average", "cumulative"];
  var graphDateTypes = ["today", "weekly", "search"];

  var channel = 0;

  var cameraLocalTime = {
    data: '',
    set: function(localTime) {
      var deferred = $q.defer();

      pcSetupService.getCameraLocalTime(
        function(localTime) {
          cameraLocalTime.data = localTime;
          deferred.resolve(true);
        },
        function(failData) {
          deferred.reject(false);
        }
      );

      return deferred.promise;
    },
    getDateObj: function() {
      return new Date(cameraLocalTime.data);
    },
  };

  function getAttributes() {
    var defer = $q.defer();

    defer.resolve("success");
    return defer.promise;
  }

  function setMaxResolution() {
    return pcSetupService.setMaxResolution(mAttr.EventSourceOptions);
  }

  $scope.areaColor = [
    {
      color: "#238bc1",
    },
    {
      color: "#ff6633",
    },
    {
      color: "#32ac3a",
    },
  ];
  $scope.previewSection = {
    coordinates: [],
    goToSetup: function() {
      $state.go("setup.statistics_queue_setup");
    },
    init: function() {
      //sketchinfo
      $scope.sketchinfo = {
        shape: 1,
        color: 0,
        maxNumber: 3,
        useEvent: false,
        workType: 'qmArea',
        modalId: "./views/setup/common/confirmMessage.html",
      };

      //coordinates
      var datas = $scope.queueData.Queues;
      for (var ii = 0; ii < datas.length; ii++) {
        var points = [];
        var data = datas[ii].Coordinates;
        for (var jj = 0; jj < data.length; jj++) {
          points.push([data[jj].x, data[jj].y]);
        }

        $scope.coordinates.push({
          isSet: true,
          enable: datas[ii].Enable,
          points: points,
          textInCircle: (ii + 1) + '',
          areaColor: $scope.areaColor[ii].color,
        });
      }
    },
  };

  function changeFormatForGraph(_timeForamtForGraph, dateFormat) {
    var timeForamtForGraph = _timeForamtForGraph;
    timeForamtForGraph += ""; //Change Type
    var stringCut = {
      year: {
        start: 0,
        count: 4,
      },
      month: {
        start: 4,
        count: 2,
      },
      date: {
        start: 6,
        count: 2,
      },
      hours: {
        start: 8,
        count: 2,
      },
    };
    var year = timeForamtForGraph.substr(stringCut.year.start, stringCut.year.count);
    var month = timeForamtForGraph.substr(stringCut.month.start, stringCut.month.count);
    var date = timeForamtForGraph.substr(stringCut.date.start, stringCut.date.count);
    var hours = timeForamtForGraph.substr(stringCut.hours.start, stringCut.hours.count);

    var returnVal = null;

    switch (dateFormat) {
      case "Hourly":
        returnVal = hours + ":00";
        break;
      case "Daily":
      case "Weekly":
        returnVal = month + "/" + date;
        break;
      case "Monthly":
        returnVal = year + "-" + month;
        break;
    }

    return returnVal;
  }

  function changeYAxisFormat(data) {
    function isFloat(xx) {
      return typeof(xx, 'Number') && !!(xx % 1);
    }

    /* tickFormat이 비정상일 때 null 처리 */
    if (isFloat(data) || data < 0) {
      return null;
    }
    var digitCheck = {
      single: 10,
      double: 100,
    };
    var format = {
      lessThan100: 2,
      moreThan100: 3,
    };

    var num = 1;
    if ( !(data < digitCheck.single) ) {
      num = data < digitCheck.double ? format.lessThan100 : format.moreThan100;
    }
    return d3.format('.' + num + 's')(data);
  }

  $scope.graphSection = {
    chartConfig: {
      deepWatchData: false,
    },
    average: {
      today: {
        options: {},
        data: [],
        xAxisData: [],
      },
      weekly: {
        options: {},
        data: [],
        xAxisData: [],
      },
      search: {
        options: {},
        data: [],
        xAxisData: [],
      },
    },
    cumulative: {
      today: {
        options: {},
        data: [],
        xAxisData: [],
      },
      weekly: {
        options: {},
        data: [],
        xAxisData: [],
      },
      search: {
        options: {},
        data: [],
        xAxisData: [],
      },
    },
    setData: function(data, dateType, type) {
      $scope.graphSection[type][dateType].data = data;
      $timeout(function() {
        if (type === graphTypes[0]) {
          if (typeof $scope.graphSection[type][dateType].options.chart.legend !== "undefined") {
            $scope.graphSection[type][dateType].options.chart.legend.dispatch.legendClick({
              seriesIndex: 0,
            });
          }
        }
      });
    },
    update: function() {
      for (var tt = 0; tt < graphTypes.length; tt++) {
        var type = graphTypes[tt];
        for (var dd = 0; dd < graphDateTypes.length; dd++) {
          var dateType = graphDateTypes[dd];
          var api = $scope.graphSection[type][dateType].options.chart.api;
          if (api !== null) {
            $scope.graphSection[type][dateType].options.chart.api.update();
          }
        }
      }
    },
    setXAxisData: function(data, dateType, type) {
      $scope.graphSection[type][dateType].xAxisData = data;
    },
    selectChartItem: function(parentClass, chartData, item) {
      item.disabled = true;

      var seriesIndex = item.seriesIndex;
      if (typeof seriesIndex === "undefined") {
        seriesIndex = item.values[0].series;
      }

      d3.selectAll(parentClass + ' .nv-series-' + seriesIndex).each(function() {
        this.parentNode.appendChild(this);
      });

      for (var ii = 0, len = chartData.length; ii < len; ii++) {
        var color = ii === seriesIndex ? chartColor.selected : chartColor.default;
        chartData[ii].color = color;
      }
    },
    resizeHandle: function() {
      $scope.graphSection.update();
    },
    bindResize: function() {
      angular.element($window).bind(
        'resize',
        $scope.graphSection.resizeHandle
      );
    },
    unbindResize: function() {
      angular.element($window).unbind(
        'resize',
        $scope.graphSection.resizeHandle
      );
    },
    init: function() {
      var deferred = $q.defer();
      var gs = $scope.graphSection;
      var promises = [];

      var failCallback = function(errorData) {
        console.error(errorData);
        deferred.reject("Fail");
      };
      var todayAverage = function() {
        return gs.getGraph(graphDateTypes[0], graphTypes[0]);
      };
      var todayCumulative = function() {
        return gs.getGraph(graphDateTypes[0], graphTypes[1]);
      };
      var weeklyAverage = function() {
        return gs.getGraph(graphDateTypes[1], graphTypes[0]);
      };
      var weeklyCumulative = function() {
        return gs.getGraph(graphDateTypes[1], graphTypes[1]);
      };

      promises.push(gs.setChartOptions);
      promises.push(todayAverage);
      promises.push(todayCumulative);
      promises.push(weeklyAverage);
      promises.push(weeklyCumulative);

      if (promises.length > 0) {
        $q.seqAll(promises).then(
          function() {
            gs.bindResize();
            deferred.resolve("Success");
          },
          failCallback
        );
      }

      return deferred.promise;
    },
    setChartOptions: function() {
      var deferred = $q.defer();
      var gs = $scope.graphSection;

      var commonOptions = {
        chart: {
          height: 300,
          margin: {
            bottom: 20,
            left: 40,
          },
          x: function(dd) {
            return dd[0];
          },
          clipEdge: true,
          api: null,
          useInteractiveGuideline: true,
          xAxis: {
            showMaxMin: true,
            tickFormat: null,
          },
          yAxis: {
            showMaxMin: true,
            tickFormat: changeYAxisFormat,
          },
          showLegend: true,
          yDomain: [0, 1],
        },
      };

      var eachChartOptions = {
        average: {
          type: 'lineChart',
          useVoronoi: false,
          transitionDuration: 500,
          dispatch: {
            renderEnd: function() {
              console.log("renderEnd");
            },
          },
          legend: {},
        },
        cumulative: {
          type: 'multiBarChart',
          duration: 500,
          stacked: false,
          showControls: false,
        },
      };

      graphTypes.forEach(function(type, tt) {
        graphDateTypes.forEach(function(dateType, dd) {
          gs[type][dateType].options = angular.copy(commonOptions);
          //tickFormat
          gs[type][dateType].options.chart.xAxis.tickFormat = function(index) {
            var data = gs[type][dateType].xAxisData[index];
            var resultInterval = gs[type][dateType].data[0].resultInterval;
            return changeFormatForGraph(data, resultInterval);
          };
          gs[type][dateType].options.chart.y = function(data) {
            if (gs[type][dateType].options.chart.yDomain[1] < data[1]) {
              gs[type][dateType].options.chart.yDomain[1] = data[1];
            }
            return data[1];
          };
          for (var kk in eachChartOptions[type]) {
            gs[type][dateType].options.chart[kk] = eachChartOptions[type][kk];
            if (type === graphTypes[0] && kk === "legend") {
              gs[type][dateType].options.chart[kk] = {
                dispatch: {
                  legendClick: function(item) {
                    gs.selectChartItem(
                      '.pc-realtime-graph-today',
                      gs.average[dateType].data,
                      item
                    );
                  },
                },
              };
            }
          }
        });
      });

      deferred.resolve("Success");
      return deferred.promise;
    },
    getGraph: function(dateType, type) {
      var deferred = $q.defer();

      function successCallback(_data) {
        var data = _data;
        data = data.data;

        var xAxisData = [];
        var allChartData = [];
        var tableData = {
          rules: [],
          timeTable: [],
        };
        
        $scope.graphSection[type][dateType].options.chart.yDomain = [0, 1];
        $scope.resultSection.setXAxisFormat(data[0].resultInterval);

        for (var ii = 0, len = data.length; ii < len; ii++) {
          var self = data[ii];

          var key = $scope.queueData.Queues[self.name - 1].Name;
          if (type === graphTypes[1]) {
            key = key + ' - ' + $translate.instant($scope.lang.graph[self.direction.toLowerCase()]);
          }

          var chartData = {
            key: key,
            values: [],
            seriesIndex: ii,
            resultInterval: self.resultInterval,
          };

          if (type === graphTypes[0]) {
            chartData.color = ii === 0 ? chartColor.selected : chartColor.default;
            chartData.area = true;
          }

          var queueName = $scope.queueData.Queues[data[ii].name - 1].Name;
          var langDirection = $scope.lang.graph[data[ii].direction.toLowerCase()];
          langDirection = $translate.instant(langDirection);

          var tableKey = queueName + ' - ' + langDirection;
          tableData.rules[ii] = [];
          tableData.rules[ii].push(tableKey);
          var sum = 0;
          for (var jj = 0, jLen = self.results.length; jj < jLen; jj++) {
            var resultSelf = self.results[jj];
            chartData.values.push([jj, resultSelf.value]);
            xAxisData[jj] = resultSelf.timeStamp;

            tableData.rules[ii].push(resultSelf.value);
            sum += resultSelf.value;

            if (ii === 0) {
              var time = changeFormatForGraph(resultSelf.timeStamp, self.resultInterval);
              tableData.timeTable.push(time);
            }
          }

          allChartData.push(chartData);
          tableData.rules[ii].push(sum);
        }

        $scope.graphSection.setData(allChartData, dateType, type);
        $scope.graphSection.setXAxisData(xAxisData, dateType, type);

        var dateTypeCheckIndex = 2;
        if (dateType === graphDateTypes[dateTypeCheckIndex]) {
          if (type === graphTypes[1]) {
            var oldTableData = $scope.resultSection.getTableData().rules;
            oldTableData.reverse();
            oldTableData.forEach(function(rule, ii) {
              tableData.rules.unshift(rule);
            });
          }
          $scope.resultSection.setTable(tableData);
        }

        deferred.resolve("Success");
      }

      function failCallback(failData) {
        deferred.reject("Fail");
        console.error(failData);
      }

      if (dateType === graphDateTypes[0]) {
        qmModel.
          getTodayGraphData(type).
          then(successCallback, failCallback);
      } else if (dateType === graphDateTypes[1]) {
        qmModel.
          getWeeklyGraphData(type).
          then(successCallback, failCallback);
      } else {
        var dateForm = $scope.pcConditionsDateForm;
        var toCalenderTimeStamp = dateForm.toCalender.getTime();
        var fromCalenderTimeStamp = dateForm.fromCalender.getTime();

        var searchOptions = {
          fromDate: fromCalenderTimeStamp,
          toDate: toCalenderTimeStamp,
        };

        var checkList = {};
        var typeArr = type === graphTypes[0] ? ["average"] : ["medium", "high"];

        typeArr.forEach(function(typeSelf, ii) {
          var arr = [];
          $("input[type='checkbox'][id^='qm-search-" + typeSelf + "-']:checked").
            each(function(jj, self) {
              var index = parseInt($(self).attr("data-index"), 10);
              arr.push(index);
            });

          if (arr.length > 0) {
            checkList[typeSelf] = arr;
          }
        });

        if (Object.keys(checkList).length === 0) {
          deferred.resolve("NoData");
        } else {
          $scope.resultSection.viewGraph[type] = true;
          qmModel.
            getSearchGraphData(type, searchOptions, checkList).
            then(successCallback, failCallback);
        }
      }

      return deferred.promise;
    },
  };

  $scope.searchSection = {
    start: function() {
      var deferred = $q.defer();
      var gs = $scope.graphSection;
      var promises = [];

      $scope.resultSection.view = false;
      $scope.resultSection.viewGraph[graphTypes[0]] = false;
      $scope.resultSection.viewGraph[graphTypes[1]] = false;
      $scope.resultSection.resetTableData();

      var failCallback = function(errorData) {
        console.error(errorData);
        deferred.reject("Fail");
      };
      var dateTypeCheckIndex = 2;
      var searchAverage = function() {
        return gs.getGraph(graphDateTypes[dateTypeCheckIndex], graphTypes[0]);
      };
      var searchCumulative = function() {
        return gs.getGraph(graphDateTypes[dateTypeCheckIndex], graphTypes[1]);
      };

      promises.push(searchAverage);
      promises.push(searchCumulative);

      if (promises.length > 0) {
        $q.seqAll(promises).then(
          function() {
            $scope.resultSection.view = true;
            $timeout(function() {
              gs.resizeHandle();
            });
            deferred.resolve("Success");
          },
          failCallback
        );
      }

      return deferred.promise;
    },
  };

  function exportSuccessCallback(data) {
    var specialHeaders = [];
    specialHeaders[0] = {};
    specialHeaders[0].Type = 'Content-Type';
    specialHeaders[0].Header = 'application/json';

    var dateForm = $scope.pcConditionsDateForm;
    var toCalenderTimeStamp = dateForm.toCalender;
    var fromCalenderTimeStamp = dateForm.fromCalender;

    var changeFormat = function(dateObj) {
      var year = dateObj.getFullYear();
      var month = dateObj.getMonth() + 1;
      var day = dateObj.getDate();
      var hour = dateObj.getHours();
      var minute = dateObj.getMinutes();
      var second = dateObj.getSeconds();

      var singleDigitCheck = 10;
      month = month < singleDigitCheck ? "0" + month : month;
      day = day < singleDigitCheck ? "0" + day : day;
      hour = hour < singleDigitCheck ? "0" + hour : hour;
      minute = minute < singleDigitCheck ? "0" + minute : minute;
      second = second < singleDigitCheck ? "0" + second : second;

      var str = [
        year,
        '-',
        month,
        '-',
        day,
        ' ',
        hour,
        ':',
        minute,
        ':',
        second,
      ];

      return str.join('');
    };

    var postData = {
      'fileTitle': data.title,
      'fileDesc': data.description,
      'fileName': data.fileName,
      'fileType': data.extension,
      'countandzone': $scope.lang.queueManagement,
      'period': changeFormat(fromCalenderTimeStamp) + ' - ' + changeFormat(toCalenderTimeStamp),
      'currentDateStr': changeFormat(new Date()),
      'searchResultData': {
        "format": "",
        "recCnt": "",
        "curOffset": "0",
        "recInfo": [],
      },
    };

    var format = $scope.resultSection.getXAxisFormat();
    format = format.replace(format[0], format[0].toUpperCase()) + 's';
    postData.searchResultData.format = format;

    var recInfo = [];
    var resultTableData = $scope.resultSection.getTableData();

    postData.searchResultData.recCnt = resultTableData.timeTable.length + "";

    for (var ii = 0, len = resultTableData.timeTable.length; ii < len; ii++) {
      var recInfoItem = {};
      recInfoItem.time = resultTableData.timeTable[ii];
      //Zero index is always rule name.
      for (var jj = 0, jLen = resultTableData.rules.length; jj < jLen; jj++) {
        var name = resultTableData.rules[jj][0];
        recInfoItem[name] = resultTableData.rules[jj][ii + 1] + "";
      }

      recInfo.push(recInfoItem);
    }

    postData.searchResultData.recInfo = recInfo;

    //searchResultData have to be string.
    postData.searchResultData = JSON.stringify(postData.searchResultData);

    var encodedta = encodeURI(JSON.stringify(postData));

    var url = "/home/exportToExcel.cgi?dumy=" + new Date().getTime();
    SunapiClient.file(url,
      function(response) {
        var filename = postData.fileName + '.' + postData.fileType;
        var contentType = 'text/plain';
        var success = false;
        var blob = null;
        if (postData.fileType === '.xlsx') {
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }
        try {
          console.log("Trying SaveBlob method ...");

          blob = new Blob([response.data], {
            type: contentType,
          });
          if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, filename);
          } else {
            var saveBlob = navigator.webkitSaveBlob || navigator.mozSaveBlob || navigator.saveBlob;
            if (typeof saveBlob === "undefined") {
              throw "Not supported";
            }
            saveBlob(blob, filename);
          }
          console.log("SaveBlob succeded");
          success = true;
        } catch (ex) {
          console.log("SaveBlob method failed with the exception: ", ex);
        }

        if (!success) {
          var urlCreator = window.URL || window.webkitURL || window.mozURL || window.msURL;
          if (urlCreator) {
            var link = document.createElement('a');
            if ('download' in link) {
              try {
                console.log("Trying DownloadLink method ...");

                blob = new Blob([response.data], {
                  type: contentType,
                });
                var url = urlCreator.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute("download", filename);

                var event = document.createEvent('MouseEvents');
                var tr = true;
                var fls = false;
                event.
                initMouseEvent('click', tr, tr, window, 1, 0, 0, 0, 0, fls, fls, fls, fls, 0, null);
                link.dispatchEvent(event);

                console.log("Succeeded File Export");
                success = true;
              } catch (ex) {
                console.log("DownloadLink method failed with exception: ", ex);
              }
            }
            if (!success) {
              try {
                console.log("Trying DownloadLink method with WindowLocation ...");
                blob = new Blob([response.data], {
                  type: contentType,
                });
                var reader = new FileReader();
                var downloadText = function() {
                  var text = reader.result;
                  var form = document.createElement('form');
                  var input = document.createElement('input');
                  var input2 = document.createElement('input');
                  var iframe = document.createElement('iframe');

                  form.action = '/home/setup/imagedownload.cgi';
                  form.method = 'POST';
                  form.id = 'captureForm';

                  input.type = 'hidden';
                  input.name = 'backupfileData';
                  input.id = 'backupfileData';
                  input.value = text;

                  input2.type = 'hidden';
                  input2.name = 'fileName';
                  input2.id = 'fileName';
                  input2.value = filename;

                  form.appendChild(input);
                  form.appendChild(input2);

                  iframe.style.display = 'none';
                  iframe.name = 'captureFrame';
                  iframe.id = 'captureFrame';
                  iframe.width = '0px';
                  iframe.height = '0px';

                  form.target = 'captureFrame';
                  document.body.appendChild(iframe);
                  document.body.appendChild(form);

                  form.submit();

                  var captureFrame = $('#' + iframe.id);
                  var captureForm = $('#' + form.id);
                  captureFrame.unbind();
                  var time = 1000;
                  setTimeout(function() {
                    captureFrame.unbind();
                    captureForm.remove();
                    captureFrame.remove();
                  }, time);
                };
                reader.readAsText(blob);
                reader.onload = downloadText;
                console.log("DownloadLink method with WindowLocation succeeded");
                success = true;
              } catch (ex) {
                console.log("DownloadLink method with WindowLocation failed with exception: ", ex);
              }
            }
          }
        }

        if (!success) {
          console.log("No methods worked for saving the arraybuffer, Using Resort window.open");
          var httpPath = '';
          window.open(httpPath, '_blank', '');
        }
      },
      function(errorData) {
        console.log(errorData);
      }, $scope, encodedta, specialHeaders);
  }

  $scope.resultSection = {
    view: false,
    show: function() {
      $scope.resultSection.showResults = true;
    },
    hide: function() {
      $scope.resultSection.showResults = false;
    },
    viewGraph: {
      average: false,
      cumulative: false,
    },
    noResults: false,
    tableData: {
      rules: [],
      timeTable: [],
    },
    setTable: function(data) {
      $scope.resultSection.tableData = data;
    },
    getTableData: function() {
      return $scope.resultSection.tableData;
    },
    resetTableData: function() {
      $scope.resultSection.tableData = {
        rules: [],
        timeTable: [],
      };
    },
    getReport: function() {
      pcModalService.openReportForm().then(
        exportSuccessCallback,
        function() {
          console.log("Fail Report");
        }
      );
    },
    xAxisFormat: '',
    setXAxisFormat: function(resultInterval) {
      var format = '';
      switch (resultInterval) {
        case 'Hourly':
          format = 'hour';
          break;
        case 'Daily':
          format = 'day';
          break;
        case 'Monthly':
          format = 'month';
          break;
      }

      $scope.resultSection.xAxisFormat = format;
    },
    getXAxisFormat: function() {
      return $scope.resultSection.xAxisFormat;
    },
  };

  function showVideo() {
    var getData = {};
    return SunapiClient.get(
      '/stw-cgi/image.cgi?msubmenu=flip&action=view', getData, 
      function(response) {
        var viewerWidth = 640;
        var viewerHeight = 360;
        var maxWidth = mAttr.MaxROICoordinateX;
        var maxHeight = mAttr.MaxROICoordinateY;
        var rotate = response.data.Flip[0].Rotate;
        var flip = response.data.Flip[0].VerticalFlipEnable;
        var mirror = response.data.Flip[0].HorizontalFlipEnable;
        var adjust = mAttr.AdjustMDIVRuleOnFlipMirror;
        $scope.videoinfo = {
          width: viewerWidth,
          height: viewerHeight,
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          flip: flip,
          mirror: mirror,
          support_ptz: false,
          rotate: rotate,
          adjust: adjust,
          currentPage: 'Queue',
        };
      }, function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function getPercent(val, max) {
    var maxPercent = 100;
    return (val / max) * maxPercent;
  }

  function getPeopleData(id) {
    var max = $scope.queueData.Queues[id].MaxPeople;
    var high = $scope.queueData.Queues[id].QueueLevels[0].Count;
    var midCalc = 2;
    var mid = Math.ceil(high / midCalc);

    return {
      max: max,
      high: high,
      mid: mid,
    };
  }

  var gaugeTimer = {
    timer0: null,
    timer1: null,
    timer2: null,
  };
  $scope.queueLevelSection = {
    maxArr: {},
    start: function(id) {
      $scope.queueLevelSection.change(id);
      
      var time = 1000;
      gaugeTimer['timer' + id] = setInterval(function() {
        $scope.queueLevelSection.change(id);
      }, time);
    },
    stop: function(id) {
      var name = 'timer' + id;
      if (gaugeTimer[name] !== null) {
        clearInterval(gaugeTimer[name]);
        gaugeTimer[name] = null;
      }
    },
    change: function(id) {
      var successCallback = function(response) {
        var queue = response[0].Count;
        var data = getPeopleData(id);
        var parent = $("#qm-bar-" + id);

        var colorList = ["#2beddb", "#0dd8eb", "#57ed06", "#0ec20e", "#ffab33", "#ff5400"];

        var maxPercent = 100;
        parent.find(".qm-bar-mask").css({
          width: (maxPercent - getPercent(queue, data.max)) + "%",
        });

        //Bar 2
        var startColor = null;
        var endColor = null;
        var colorListIndex = {
          mid: {
            start: 0,
            end: 1,
          },
          high: {
            start: 2,
            end: 3,
          },
          max: {
            start: 4,
            end: 5,
          },
        };
        if (queue < data.mid) {
          startColor = colorList[colorListIndex.mid.start];
          endColor = colorList[colorListIndex.mid.end];
        } else if (queue < data.high) {
          startColor = colorList[colorListIndex.high.start];
          endColor = colorList[colorListIndex.high.end];
        } else {
          startColor = colorList[colorListIndex.max.start];
          endColor = colorList[colorListIndex.max.end];
        }

        parent.find(".qm-bar").css({
          // background: colorName,
          // background: "-webkit-linear-gradient(left, " + startColor + ", " + endColor + ")",
          // background: "-o-linear-gradient(right, " + startColor + ", " + endColor + ")",
          // background: "-moz-linear-gradient(right, " + startColor + ", " + endColor + ")",
          background: "linear-gradient(to right, " + startColor + ", " + endColor + ")",
        });
      };

      var failCallback = function(failData) {
        console.error(failData);
      };

      qmModel.checkData({
        Channel: channel,
        QueueIndex: (id + 1),
      }).then(successCallback, failCallback);
    },
  };

  $scope.init = function() {
    var deferred = $q.defer();
    /**
     * When page is setted newly, Scroll of Browser have to set the top.
     */
    $('.main.setup-wrapper').scrollTop(0);

    if (setMaxResolution() === false) {
      console.error("Getting Maxinum Resolution of Video is Wrong!");
    }

    var failCallback = function(errorData) {
      console.error(errorData);
      deferred.reject("Fail");
    };

    var resizeGraph = function() {
      var time = 100;
      setTimeout(function() {
        $scope.graphSection.resizeHandle();
      }, time);
    }

    qmModel.initModel().then(
      function() {
        qmModel.getData().then(
          function(data) {
            $scope.queueData = data;
            $scope.queueData.dataLoad = true;

            //Search
            $scope.pcConditionsDateForm.init(
              function() {
              },
              failCallback
            );
            if (data.Enable === true) {
              // Queue Level(Start graph)
              var guageIndex = {
                first: 0,
                second: 1,
                third: 2,
              };
              $scope.queueLevelSection.start(guageIndex.first);
              $scope.queueLevelSection.start(guageIndex.second);
              $scope.queueLevelSection.start(guageIndex.third);
              // Preview
              $scope.previewSection.init();
              //Graph
              $scope.graphSection.init().then(
                function() {
                  resizeGraph();
                  deferred.resolve("Success");
                },
                failCallback
              )
            } else {
              deferred.resolve("Success");
            }
          },
          failCallback
        );
      },
      failCallback
    );

    return deferred.promise;
  };

  /* Destroy Area Start
  ------------------------------------------ */
  $scope.$on("$destroy", function() {
    // asyncInterrupt = true;
    // if(modalInstance !== null){
    // 	modalInstance.close();
    // 	modalInstance = null;
    // }
  });

  /* Queue management Search page를 벗어 날 때 */
  $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
    if (fromState.controller === 'QMStatisticsCtrl') {
      var guageIndex = {
        first: 0,
        second: 1,
        third: 2,
      };
      $scope.graphSection.unbindResize();
      $scope.queueLevelSection.stop(guageIndex.first);
      $scope.queueLevelSection.stop(guageIndex.second);
      $scope.queueLevelSection.stop(guageIndex.third);
      qmModel.cancelSearch();
    }
  });

  /* Destroy Area End
  ------------------------------------------ */
  function view() {
    var failCallback = function(errorData) {
      console.log(errorData);
      $scope.pageLoaded = true;
    };

    showVideo().
      then(
        function() {
          $scope.init().
            then(
              function() {
                $scope.pageLoaded = true;
              },
              failCallback
            );
        },
        failCallback
      );
  }

  $scope.view = view;

  (function wait() {
    $timeout(function() {
      if (!mAttr.Ready) {
        var time = 500;
        $timeout(function() {
          mAttr = Attributes.get();
          wait();
        }, time);
      } else {
        getAttributes().finally(function() {
          view();
        });
      }
    });
  })();
});