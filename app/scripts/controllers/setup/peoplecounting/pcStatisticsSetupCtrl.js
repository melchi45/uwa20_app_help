/* global sessionStorage, Blob */
"use strict";
kindFramework.controller('PCStatisticsCtrl',
  function(
    $scope,
    $state,
    $timeout,
    $q,

    $uibModal,
    $interval,
    $window,

    PcSetupModel,
    pcModalService,
    pcSetupService,

    SunapiClient,
    ConnectionSettingService,
    kindStreamInterface,
    SessionOfUserManager,
    Attributes
  ) {
    /*
    When page is unloaded, $scope.init have not to run.
    So asyncInterrupt is created.
    */
    var asyncInterrupt = false;

    var mAttr = Attributes.get();

    var chartColor = {
      default: '#ddd',
      selected: '#399'
    };

    var pcSetupModel = new PcSetupModel();
    $scope.lang = pcSetupModel.getStLang();

    $scope.pageLoaded = false;

    //Playerdata for Video
    $scope.playerdata = null;

    $scope.coordinates = [];
    $scope.sketchinfo = {};

    /* RealTime Area Start 
    ------------------------------------------ */
    $scope.realTimeSection = {
      dropDownState: false,
      toggleDropDown: function(val) {
        if (typeof val !== "undefined") {
          $scope.realTimeSection.dropDownState = val;
        } else {
          $scope.realTimeSection.dropDownState = !$scope.realTimeSection.dropDownState;

          //When real time is displaied, Graph is broken so resizeHandle have to called.
          if ($scope.realTimeSection.dropDownState === false) {
            $timeout($scope.graphSection.resizeHandle);
          }
        }
      },
      isDisabledAllRule: false, //true is hide, false is show
      isPeopleCountDisabled: false,
      setUndefinedRule: function() {
        $scope.realTimeSection.isDisabledAllRule = true;
      },
      resetUndefinedRule: function() {
        $scope.realTimeSection.isDisabledAllRule = false;
      },
      setDisabledPeoplecountStatus: function() {
        $scope.realTimeSection.isPeopleCountDisabled = true;
        $scope.realTimeSection.setUndefinedRule();
      },
      resetDisabledPeoplecountStatus: function() {
        $scope.realTimeSection.isPeopleCountDisabled = false;
        $scope.realTimeSection.resetUndefinedRule();
      },
      goToSetup: function() {
        $state.go("setup.statistics_peoplecounting_setup");
      },
      counting: {
        /*{
        	lineIndex: index,
        	name: name,
        	inCount: inCount,
        	outCount: outCount
        }*/
        todayRuleData: [],
        setTodayRuleData: function(data) {
          $scope.realTimeSection.counting.todayRuleData = data;
        },
        polling: {
          timer: null,
          start: function() {
            $scope.realTimeSection.counting.polling.timer = $interval(function() {
              pcSetupModel.getCurrentCountingData().then(function(data) {
                for (var i = 0, len = data.length; i < len; i++) {
                  var item = data[i];

                  if ($scope.realTimeSection.counting.todayRuleData[i].enable === true) {
                    $scope.realTimeSection.counting.todayRuleData[i].inCount = item.inCount;
                    $scope.realTimeSection.counting.todayRuleData[i].outCount = item.outCount;
                  }
                }
              }, function(errorCode) {
                console.error(errorCode);
              });
            }, 3000);
          },
          stop: function() {
            if ($scope.realTimeSection.counting.polling.timer !== null) {
              $interval.cancel($scope.realTimeSection.counting.polling.timer);
            }
          }
        }
      }
    };

    /* RealTime Area End 
    ------------------------------------------ */

    /**
     * Maxinum size have to set for Line Patiner
     */
    function setMaxResolution() {
      return pcSetupService.setMaxResolution(mAttr.EventSourceOptions);
    }
    /* Initialize Start
    ------------------------------------------ */
    $scope.init = function() {
      var deferred = $q.defer();

      try {
        $('.main.setup-wrapper').scrollTop(0);
      } catch (e) {
        console.error(e);
      }
      if (setMaxResolution() === false) {
        console.error("Getting Maxinum Resolution of Video is Wrong!");
      }

      var todayRuleData = [];
      var todayXAxisData = [];

      var failCallback = function(errorData) {
        deferred.reject(errorData);
      };

      function getDeviceNameSuccessCallback(data) {
        var conditionsRule = [];

        pcSetupModel.
        getTodayGraphData().
        then(getTodayGraphDataSuccessCallback, failCallback);

        //set master info
        conditionsRule[0] = {
          isMaster: true,
          name: data,
          rulesName: []
        };

        for (var i = 0, len = todayRuleData.length; i < len; i++) {
          conditionsRule[0].rulesName[todayRuleData[i].lineIndex - 1] = todayRuleData[i].name;
        }

        $scope.conditionsSection.setRule(conditionsRule);
      }

      function getWeekGraphDataCallback(data) {
        var weekChartData = [];
        var weekXAxisData = [];
        var isHourly = data.resultInterval === "Hourly";

        for (var i = 0, len = data.length; i < len; i++) {
          var self = data[i];

          var chartData = {
            key: self.name + ' - ' + self.direction,
            values: [],
            color: i === 0 ? chartColor.selected : chartColor.default,
            area: true
          };

          for (var j = 0, jLen = self.results.length; j < jLen; j++) {
            var resultSelf = self.results[j];
            chartData.values.push([j, resultSelf.value]);

            if (isHourly === false) {
              weekXAxisData[j] = resultSelf.timeStamp;
            }
          }

          weekChartData.push(chartData);
        }

        if (isHourly === true) {
          weekXAxisData = todayXAxisData;
        }

        $scope.graphSection.week.setData(weekChartData);
        $scope.graphSection.week.setXAxisData(weekXAxisData, isHourly);

        deferred.resolve('Success');

        if (todayRuleData.length > 0) {
          $scope.realTimeSection.counting.polling.start();
        }
      }

      function getTodayGraphDataSuccessCallback(data) {
        pcSetupModel.
        getWeekGraphData().
        then(getWeekGraphDataCallback, failCallback);

        var todayChartData = [];

        for (var i = 0, len = data.length; i < len; i++) {
          var self = data[i];

          var chartData = {
            key: self.name + ' - ' + self.direction,
            values: [],
            color: i === 0 ? chartColor.selected : chartColor.default,
            area: true
          };

          for (var j = 0, jLen = self.results.length; j < jLen; j++) {
            var resultSelf = self.results[j];
            chartData.values.push([j, resultSelf.value]);
            todayXAxisData[j] = resultSelf.timeStamp;
          }

          todayChartData.push(chartData);
        }

        $scope.graphSection.today.setData(todayChartData);
        $scope.graphSection.today.setXAxisData(todayXAxisData);
      }

      function getRuleInfoSuccessCallback(data) {
        if (asyncInterrupt === true) return;

        //If people count is disabled.
        if (data.Enable === false) {
          $scope.realTimeSection.setDisabledPeoplecountStatus();
          deferred.resolve('Peoplecount is disabled.');
          return;
        }

        //Counting Rule Validation
        var haveRule = false;
        var haveNameOfLine = false;

        for (var i = 0, len = data.Lines.length; i < len; i++) {
          if (data.Lines[i].Enable === true) {
            haveRule = true;
          }

          if (data.Lines[i].Name !== '') {
            haveNameOfLine = true;
          }
        }

        if (haveNameOfLine === true) {
          //Draw Graph
          pcSetupModel
            .getDeviceName()
            .then(getDeviceNameSuccessCallback, failCallback);
        } else {
          deferred.resolve('No Name');
        }

        if (haveRule === false) {
          $scope.realTimeSection.setUndefinedRule();
          return;
        }

        //Draw Line of Counting Rule in Video

        for (var i = 0, len = data.Lines.length; i < len; i++) {
          var self = data.Lines[i];
          var inCount = self.Enable === true ? self.InCount : '';
          var outCount = self.Enable === true ? self.OutCount : '';

          todayRuleData.push({
            lineIndex: self.LineIndex,
            name: self.Name,
            inCount: inCount,
            outCount: outCount,
            enable: self.Enable
          });

          if (self.Enable === true) {
            $scope.coordinates.push({
              isSet: true,
              enable: true,
              points: [
                [self.Coordinates[0].x, self.Coordinates[0].y],
                [self.Coordinates[1].x, self.Coordinates[1].y],
              ],
              direction: self.Mode === "LeftToRightIn" ? 0 : 1,
              textInCircle: self.LineIndex + 1
            });
          }
        }

        if ($scope.coordinates.length > 0) {
          $scope.sketchinfo = {
            workType: 'peoplecount',
            maxNumber: 2,
            maxArrow: 'R',
            color: 0,
            useEvent: false,
            minLineLength: 120
          };
        }

        //Set Line of Counting Rule in Table
        $scope.realTimeSection.counting.setTodayRuleData(todayRuleData);
      }

      //Display Counting Rule

      pcSetupModel.initModel().then(function() {
        pcSetupModel.getRuleInfo()
          .then(
            getRuleInfoSuccessCallback,
            function() {
              $scope.realTimeSection.setUndefinedRule();
            }
          );
      }, failCallback);

      return deferred.promise;
    };

    /* Initialize End
    ------------------------------------------ */

    /* Conditions Start
    ------------------------------------------ */
    function exportSuccessCallback(data) {
      /*--------------------- Start report file export ---------------- */
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

        month = month < 10 ? "0" + month : month;
        day = day < 10 ? "0" + day : day;
        hour = hour < 10 ? "0" + hour : hour;
        minute = minute < 10 ? "0" + minute : minute;
        second = second < 10 ? "0" + second : second;

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
          second
        ];

        return str.join('');
      };

      var postData = {
        'fileTitle': data.title,
        'fileDesc': data.description,
        'fileName': data.fileName,
        'fileType': data.extension,
        'countandzone': 'People Counting',
        'period': changeFormat(fromCalenderTimeStamp) + ' - ' + changeFormat(toCalenderTimeStamp),
        'currentDateStr': changeFormat(new Date()),
        'searchResultData': {
          "format": "",
          "recCnt": "",
          "curOffset": "0",
          "recInfo": []
        }
      };

      var format = $scope.resultSection.getXAxisFormat();
      format = format.replace(format[0], format[0].toUpperCase()) + 's';
      postData.searchResultData.format = format;

      var recInfo = [];
      var resultTableData = $scope.resultSection.getTableData();

      postData.searchResultData.recCnt = resultTableData.timeTable.length + "";

      for (var i = 0, len = resultTableData.timeTable.length; i < len; i++) {
        var recInfoItem = {};
        recInfoItem.time = resultTableData.timeTable[i];
        //Zero index is always rule name.
        for (var j = 0, jLen = resultTableData.rules.length; j < jLen; j++) {
          var name = resultTableData.rules[j][0];
          recInfoItem[name] = resultTableData.rules[j][i + 1] + "";
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
          if (postData.fileType === '.xlsx') {
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          }
          try {
            console.log("Trying SaveBlob method ...");

            var blob = new Blob([response.data], {
              type: contentType
            });
            if (navigator.msSaveBlob) {
              navigator.msSaveBlob(blob, filename);
            } else {
              var saveBlob = navigator.webkitSaveBlob || navigator.mozSaveBlob || navigator.saveBlob;
              if (saveBlob === undefined) {
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

                  var blob = new Blob([response.data], {
                    type: contentType
                  });
                  var url = urlCreator.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute("download", filename);

                  var event = document.createEvent('MouseEvents');
                  event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
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
                  var blob = new Blob([response.data], {
                    type: contentType
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

                    var interval;
                    var captureFrame = $('#' + iframe.id);
                    var captureForm = $('#' + form.id);
                    captureFrame.unbind();
                    interval = setTimeout(function() {

                      captureFrame.unbind();
                      captureForm.remove();
                      captureFrame.remove();
                    }, 1000);
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
            var httpPath = ''; //It should be modified.
            window.open(httpPath, '_blank', '');
          }
        },
        function(errorData) {
          console.log(errorData);
        }, $scope, encodedta, specialHeaders); //End of SunapiClient.file
      /*--------------------- End report file export ---------------- */
    }
    $scope.conditionsSection = {
      /**
       * Item Format of rule
       * @example
       * {
       * 	//If it is true, It is master. 
       * 	//If it is false, It is slave. 
       * 	isMaster: true,
       * 	name: '',
       * 	rulesName: []
       * }
       */
      rule: [],
      setRule: function(data) {
        $scope.conditionsSection.rule = data;
      },
      getCameraName: function() {
        return $scope.conditionsSection.rule[0].name;
      },
      ruleModel: {},
      getReport: function() {
        pcModalService.openReportForm().then(
          exportSuccessCallback,
          function() {
            console.log("Fail Report");
          }
        );
      },
      isSearching: false, //Searching Validation
      getResults: function() {
        if ($scope.conditionsSection.isSearching === true) return;

        $scope.conditionsSection.isSearching = true;
        var dateForm = $scope.pcConditionsDateForm;
        if (dateForm.validate() === false) {
          $scope.conditionsSection.isSearching = false;
          return;
        }

        $scope.resultSection.hide();

        /**
         * Rule Validation and this section have dependency with DOM.
         */
        var checkboxs = document.querySelectorAll('#pc-search-rule input[type="checkbox"]');
        var isCheckboxOk = false;

        var searchOptions = {
          fromDate: '',
          toDate: '',
          lines: {}
        };

        for (
          var checkboxIndex = 0,
            checkboxLen = checkboxs.length; checkboxIndex < checkboxLen; checkboxIndex++) {

          if (checkboxs[checkboxIndex].checked === true) {
            var splitedName = checkboxs[checkboxIndex].getAttribute('name').split('_');
            isCheckboxOk = true;
            if (typeof searchOptions.lines[splitedName[1]] !== "object") {
              searchOptions.lines[splitedName[1]] = { in: false,
                out: false
              };
            }

            searchOptions.lines[splitedName[1]][splitedName[2]] = true;
          }
        }

        if (isCheckboxOk === false) {
          pcModalService.openAlert({
            title: $scope.lang.modal.alert,
            message: $scope.lang.modal.selectCamera
          });

          $scope.conditionsSection.isSearching = false;
          return;
        }

        var dateForm = $scope.pcConditionsDateForm;
        var toCalenderTimeStamp = dateForm.toCalender.getTime();
        var fromCalenderTimeStamp = dateForm.fromCalender.getTime();
        var secondSelectOptions = dateForm.secondSelectOptions;
        var firstSelectOptions = dateForm.firstSelectOptions;

        searchOptions.fromDate = fromCalenderTimeStamp;
        searchOptions.toDate = toCalenderTimeStamp;

        pcSetupModel
          .getSearchResults(searchOptions)
          .then(function(data) {
            $scope.resultSection.setXAxisFormat(data.resultInterval);

            var haveResults = false;

            var chartData = [];
            var resultXAxisData = [];
            var tableData = {
              cameraName: $scope.conditionsSection.getCameraName(),
              timeTable: [],
              rules: []
            };

            var tableTimeFormat = $scope.resultSection.getXAxisFormat();

            var haveTimeTable = false;

            for (var i = 0, len = data.length; i < len; i++) {
              var self = data[i];
              var ruleData = [];

              var chartItem = {
                key: self.name + ' - ' + self.direction,
                values: [],
                color: i === 0 ? chartColor.selected : chartColor.default,
                area: true
              };

              ruleData.push(self.name + ' - ' + self.direction);

              var resultSum = 0;
              for (var j = 0, jLen = self.results.length; j < jLen; j++) {
                var resultSelf = self.results[j];
                var value = resultSelf.value;
                var timeStamp = resultSelf.timeStamp;
                var tableTimeData = null;

                if (value > 0) {
                  haveResults = true;
                }
                //For Table
                ruleData.push(value);
                resultSum += value;

                if (haveTimeTable === false) {
                  tableTimeData = changeFormatForGraph(timeStamp, tableTimeFormat);
                  tableData.timeTable.push(tableTimeData);
                }

                //For Chart
                chartItem.values.push([j, value]);
                resultXAxisData[j] = timeStamp;
              }

              ruleData.push(resultSum);

              //For Table
              tableData.rules.push(ruleData);
              if (haveTimeTable === false) {
                haveTimeTable = true;
              }

              //For Chart
              chartData.push(chartItem);
            }

            if (haveResults === true) {
              $scope.graphSection.result.setData(chartData);
              $scope.graphSection.result.setXAxisData(resultXAxisData);
              $scope.resultSection.setTable(tableData);
              $timeout($scope.graphSection.result.update);
              $scope.resultSection.noResults = false;
            } else {
              $scope.resultSection.noResults = true;
            }

            $scope.resultSection.show();
            $scope.conditionsSection.isSearching = false;

            //UI is rendered and scroll is moved.
            setTimeout(function() {
              try {
                $('.main.setup-wrapper').scrollTop($('.wrapper.wrapper-content').height());
              } catch (e) {
                console.error(e);
              }
            });
          }, function(errorData) {
            console.log(errorData);
          });
      }
    };

    /* Conditions Area End 
    ------------------------------------------ */

    /* Graph Start
    ------------------------------------------ */
    function changeFormatForGraph(timeForamtForGraph, dateFormat) {
      timeForamtForGraph += ""; //Change Type
      var year = timeForamtForGraph.substr(0, 4);
      var month = timeForamtForGraph.substr(4, 2);
      var date = timeForamtForGraph.substr(6, 2);
      var hours = timeForamtForGraph.substr(8, 2);
      var minutes = timeForamtForGraph.substr(10, 2);
      var seconds = timeForamtForGraph.substr(12, 2);

      var returnVal = null;

      switch (dateFormat) {
        case "hour":
          returnVal = hours + ":00";
          break;
        case "day":
          returnVal = month + "/" + date;
          break;
        case "month":
          returnVal = year + "-" + month;
          break;
      }

      return returnVal;
    }

    /**
     * Y 축이 계속적으로 길이가 증가되면 언젠가는 overflow가 발생하기 때문에
     * 그래프의 Y 축은 SI Prefixes를 사용하여 포맷을 변경한다.
     * @refer https://github.com/d3/d3-format#locale_formatPrefix
     * @refer https://en.wikipedia.org/wiki/Metric_prefix#List_of_SI_prefixes
     */
    function changeYAxisFormat(data) {
      function isFloat(x) {
        return typeof(x, 'Number') && !!(x % 1);
      }

      /* tickFormat이 비정상일 때 null 처리 */
      if (isFloat(data) || data < 0) return null;

      var num = data < 10 ? 1 : data < 100 ? 2 : 3;
      return d3.format('.' + num + 's')(data);
    }

    $scope.graphSection = {
      chartConfig: {
        deepWatchData: false
      },
      today: {
        options: {
          chart: {
            type: 'lineChart',
            height: 300,
            margin: {
              // top: 20,
              // right: 0,
              bottom: 20,
              left: 40
            },
            x: function(d) {
              return d[0];
            },
            y: function(d) {
              if ($scope.graphSection.today.options.chart.yDomain[1] < d[1]) {
                $scope.graphSection.today.options.chart.yDomain[1] = d[1];
              }
              return d[1];
            },
            useVoronoi: false,
            clipEdge: true,
            transitionDuration: 500,
            useInteractiveGuideline: true,
            xAxis: {
              tickFormat: function(index) {
                var data = $scope.graphSection.today.xAxisData[index];
                return changeFormatForGraph(data, 'hour');
              }
            },
            yAxis: {
              showMaxMin: true,
              tickFormat: changeYAxisFormat
            },
            dispatch: {
              renderEnd: function() {
                console.log("renderEnd");
              }
            },
            showLegend: true,
            //Event of Legend
            legend: {
              dispatch: {
                legendClick: function(item) {
                  $scope.graphSection.selectChartItem(
                    '.pc-realtime-graph-today',
                    $scope.graphSection.today.data,
                    item
                  );
                }
              }
            },
            yDomain: [0, 1]
          }
        },
        data: [],
        setData: function(data) {
          $scope.graphSection.today.options.chart.yDomain = [0, 1];
          $scope.graphSection.today.data = data;
          $timeout(function() {
            $scope.graphSection.today.options.chart.legend.dispatch.legendClick({
              seriesIndex: 0
            });
          });
        },
        api: null,
        update: function() {
          if ($scope.graphSection.today.api !== null) {
            $scope.graphSection.today.api.update();
          }
        },
        xAxisData: [],
        setXAxisData: function(data) {
          $scope.graphSection.today.xAxisData = data;
        },
        getXAxisData: function() {
          return $scope.graphSection.today.xAxisData;
        }
      },
      week: {
        options: {
          chart: {
            type: 'lineChart',
            height: 300,
            margin: {
              // top: 20,
              // right: 0,
              bottom: 20,
              left: 40
            },
            x: function(d) {
              return d[0];
            },
            y: function(d) {
              if ($scope.graphSection.week.options.chart.yDomain[1] < d[1]) {
                $scope.graphSection.week.options.chart.yDomain[1] = d[1];
              }
              return d[1];
            },
            useVoronoi: false,
            clipEdge: true,
            transitionDuration: 500,
            useInteractiveGuideline: true,
            xAxis: {
              tickFormat: function(index) {
                var data = $scope.graphSection.week.xAxisData[index];
                var mode = $scope.graphSection.week.isHourly === true ? 'hour' : 'day';
                return changeFormatForGraph(data, mode);
              }
            },
            yAxis: {
              showMaxMin: true,
              tickFormat: changeYAxisFormat
            },
            showLegend: true,
            //Event of Legend
            legend: {
              dispatch: {
                legendClick: function(item) {
                  $scope.graphSection.selectChartItem(
                    '.pc-realtime-graph-week',
                    $scope.graphSection.week.data,
                    item
                  );
                }
              }
            },
            yDomain: [0, 1]
          }
        },
        data: [],
        setData: function(data) {
          $scope.graphSection.week.options.chart.yDomain = [0, 1];
          $scope.graphSection.week.data = data;
          $timeout(function() {
            $scope.graphSection.week.options.chart.legend.dispatch.legendClick({
              seriesIndex: 0
            });
          });
        },
        api: null,
        update: function() {
          if ($scope.graphSection.week.api !== null) {
            $scope.graphSection.week.api.update();
          }
        },
        xAxisData: [],
        isHourly: false,
        setXAxisData: function(data, isHourly) {
          $scope.graphSection.week.xAxisData = data;
          $scope.graphSection.week.isHourly = isHourly;
        },
        getXAxisData: function() {
          return $scope.graphSection.week.xAxisData;
        }
      },
      result: {
        options: {
          chart: {
            type: 'lineChart',
            height: 380,
            margin: {
              // top: 20,
              right: 30, //Due to x axis hidden
              bottom: 20,
              left: 40
            },
            x: function(d) {
              return d[0];
            },
            y: function(d) {
              if ($scope.graphSection.result.options.chart.yDomain[1] < d[1]) {
                $scope.graphSection.result.options.chart.yDomain[1] = d[1];
              }
              return d[1];
            },
            useVoronoi: false,
            clipEdge: true,
            transitionDuration: 500,
            useInteractiveGuideline: true,
            xAxis: {
              tickFormat: function(index) {
                /**
                 * @refer: https://github.com/d3/d3-time-format
                 */
                return changeFormatForGraph(
                  $scope.graphSection.result.xAxisData[index],
                  $scope.resultSection.getXAxisFormat()
                );
              }
            },
            yAxis: {
              showMaxMin: true,
              tickFormat: changeYAxisFormat
            },
            showLegend: true,
            //Event of Legend
            legend: {
              dispatch: {
                legendClick: function(item) {
                  $scope.graphSection.selectChartItem(
                    '.pc-results-graph',
                    $scope.graphSection.result.data,
                    item
                  );
                }
              }
            },
            yDomain: [0, 1]
          }
        },
        data: [],
        setData: function(data) {
          $scope.graphSection.result.options.chart.yDomain = [0, 1];
          $scope.graphSection.result.data = data;
          $timeout(function() {
            $scope.graphSection.result.options.chart.legend.dispatch.legendClick({
              seriesIndex: 0
            });
            setTimeout($scope.graphSection.resizeHandle, 500);
          });
        },
        api: null,
        update: function() {
          if ($scope.graphSection.result.api !== null) {
            $scope.graphSection.result.api.update();
          }
        },
        xAxisData: [],
        setXAxisData: function(data) {
          $scope.graphSection.result.xAxisData = data;
        },
        getXAxisData: function() {
          return $scope.graphSection.result.xAxisData;
        }
      },
      selectChartItem: function(parentClass, chartData, item) {
        item.disabled = true;

        var seriesIndex = item.seriesIndex;
        if (seriesIndex === undefined) {
          seriesIndex = item.values[0].series;
        }

        d3.selectAll(parentClass + ' .nv-series-' + seriesIndex).each(function() {
          this.parentNode.appendChild(this);
        });

        for (var i = 0, len = chartData.length; i < len; i++) {
          var color = i === seriesIndex ? chartColor.selected : chartColor.default;
          chartData[i].color = color;
        }
      },
      resizeHandle: function() {
        $scope.graphSection.today.update();
        $scope.graphSection.week.update();
        $scope.graphSection.result.update();
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
        $scope.graphSection.bindResize();
      }
    };

    $scope.graphSection.init();

    /* Graph End
    ------------------------------------------ */

    /* Results Start
    ------------------------------------------ */
    $scope.resultSection = {
      showResults: false,
      show: function() {
        $scope.resultSection.showResults = true;
      },
      hide: function() {
        $scope.resultSection.showResults = false;
      },
      noResults: false,
      tableData: {},
      setTable: function(data) {
        $scope.resultSection.tableData = data;
      },
      getTableData: function() {
        return $scope.resultSection.tableData;
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
      }
    };
    /* Results End
    ------------------------------------------ */

    /* Destroy Area Start
    ------------------------------------------ */
    $scope.$on("$destroy", function() {
      $scope.graphSection.unbindResize();
      pcModalService.close();
      $scope.realTimeSection.counting.polling.stop();
      pcSetupModel.cancelSearch();
      asyncInterrupt = true;
    });
    /* Destroy Area End
    ------------------------------------------ */

    function view() {
      function resizeGraph() {
        setTimeout(function() {
          $scope.graphSection.resizeHandle();
        }, 100);
      }

      function errorCallback(errorData) {
        //When search is cancel
        if (errorData === pcSetupModel.getInterruptMessage()) {
          return;
        } else {
          $scope.pageLoaded = true;
          resizeGraph();
          console.log(errorData);
        }
      }

      showVideo().then(function() {
        $scope.pcConditionsDateForm.init(function() {
          $scope.init().then(function() {
            $scope.pageLoaded = true;
            /*
            because Chart is broken, 
            resizeing have to run after DOM Rendering.
            */
            resizeGraph();
          }, errorCallback);
        }, errorCallback);
      }, errorCallback);
    }

    function showVideo() {
      var getData = {};
      return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData, function(response) {
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
          currentPage: 'PeopleCount'
        };
      }, function(errorData) {
        console.log(errorData);
      }, '', true);
    }

    /*function set(){

    }*/

    // $scope.submit = set;
    $scope.view = view;

    (function wait() {
      if (!mAttr.Ready) {
        $timeout(function() {
          mAttr = Attributes.get();
          wait();
        }, 500);
      } else {
        view();
      }
    })();
  });