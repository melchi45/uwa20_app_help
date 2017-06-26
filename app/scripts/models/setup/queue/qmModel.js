/* global setTimeout */
"use strict";

kindFramework.factory('QmModel', function($q, $translate, $interval, pcSetupService) {
  var QueueModel = function() {
    if (!(this instanceof QueueModel)) {
      return new QueueModel();
    }

    var channelIndex = 0;
    var interruptMessage = "interrupt with cancel";
    this.getInterruptMessage = function() {
      return interruptMessage;
    };

    var lang = {
      queueManagement: 'lang_queue_management',
      searchTitle: 'lang_search',
      setupTitle: 'lang_setup',
      enable: 'lang_enable_queue',
      realTime: {
        occupancy: 'lang_occupancy',
        button: 'lang_setup',
        message: 'lang_msg_delete_all_data',
      },
      graph: {
        today: 'lang_today',
        weekly: 'lang_weekly',
        averagePeople: 'lang_average_people',
        cumulative: 'lang_total_time',
        sec: 'lang_sec',
        average: 'lang_average',
        high: 'lang_high',
        medium: 'lang_medium',
      },
      search: {
        title: 'lang_search',
        button: 'lang_search',
        area: {
          title: 'lang_area',
          averageTitle: 'lang_average',
          peopleTitle: 'lang_people',
          totalTitle: 'lang_total_time',
          mediumTitle: 'lang_medium',
          highTitle: 'lang_high',
        },
      },
      results: {
        title: 'lang_results',
        noResults: 'lang_msg_no_result',
        button: 'lang_download',
        table: {
          queue: 'lang_queue',
          sum: 'lang_sum',
        },
      },
      setupTabTitle: {
        configuration: 'lang_configuration',
        calibration: 'lang_calibration',
      },
      areaList: {
        title: 'lang_area',
        no: 'lang_num',
        name: 'lang_name',
      },
      queueUndefined: {
        disable: '',
        noRule: '',
      },
      queueEvent: {
        title: 'lang_queue_event',
      },
      queueEventLevel: {
        title: 'lang_level_of_detection',
        people: 'lang_people',
        max: 'lang_maximumSize',
        high: 'lang_high',
        medium: 'lang_medium',
      },
      queueEventDuration: {
        title: '',
        high: 'lang_high',
        medium: 'lang_medium',
        sec: 'lang_sec',
        message: 'lang_msg_queue_events',
      },
      calibration: {
        message: '',
      },
    };

    (function langInit() {
      var langMsgPleaseEnable = $translate.instant('lang_msg_please_enable');
      var langQueueManagement = $translate.instant(lang.queueManagement);
      lang.queueUndefined.disable = langMsgPleaseEnable.replace('%1', langQueueManagement);
      
      var langMsgNorule = $translate.instant('lang_msg_norule');
      var langMsgAddrule = $translate.instant('lang_msg_addrule');
      var langSetup = $translate.instant('lang_setup');
      lang.queueUndefined.noRule = langMsgNorule + ' ' + langMsgAddrule.replace('%1', langSetup);

      var langMinimumDuration = $translate.instant('lang_minimum_duration');
      var langSec = $translate.instant('lang_sec');
      lang.queueEventDuration.title = langMinimumDuration + ' (' + langSec + ')';

      var langMsgCalibrationGuide1 = $translate.instant('lang_msg_calibration_guide_1');
      var langMsgCalibrationGuide2 = $translate.instant('lang_msg_calibration_guide_2');
      langMsgCalibrationGuide2 = langMsgCalibrationGuide2.replace('%1', langQueueManagement);
      lang.calibration.message = langMsgCalibrationGuide1 + ' ' + langMsgCalibrationGuide2;
    })();

    this.getStLang = function() {
      return lang;
    };

    var eventSourcesCgi = {
      queue: {
        view: function(successCallback, failCallback) {
          pcSetupService.requestSunapi({
            cgi: 'eventsources',
            msubmenu: 'queuemanagementsetup',
            action: 'view',
            data: {},
            successCallback: successCallback,
            failCallback: failCallback,
          });
        },
        set: function(data, successCallback, failCallback) {
          pcSetupService.requestSunapi({
            cgi: 'eventsources',
            msubmenu: 'queuemanagementsetup',
            action: 'set',
            data: data,
            successCallback: successCallback,
            failCallback: failCallback,
          });
        },
        add: function(data, successCallback, failCallback) {
          pcSetupService.requestSunapi({
            cgi: 'eventsources',
            msubmenu: 'queuemanagementsetup',
            action: 'add',
            data: data,
            successCallback: successCallback,
            failCallback: failCallback,
          });
        },
        update: function(data, successCallback, failCallback) {
          pcSetupService.requestSunapi({
            cgi: 'eventsources',
            msubmenu: 'queuemanagementsetup',
            action: 'update',
            data: data,
            successCallback: successCallback,
            failCallback: failCallback,
          });
        },
        remove: function(successCallback, failCallback, _data) {
          var data = _data;
          if (!data) {
            data = {};
          }
          pcSetupService.requestSunapi({
            cgi: 'eventsources',
            msubmenu: 'queuemanagementsetup',
            action: 'remove',
            data: data,
            successCallback: successCallback,
            failCallback: failCallback,
          });
        },
        check: function(successCallback, failCallback, _data) {
          var data = _data;
          if (!data) {
            data = {};
          }
          pcSetupService.requestSunapi({
            cgi: 'eventsources',
            msubmenu: 'queuemanagementsetup',
            action: 'check',
            data: data,
            successCallback: successCallback,
            failCallback: failCallback,
          });
        },
      },
      sourceoptions: {
        view: function(successCallback, failCallback) {
          pcSetupService.requestSunapi({
            cgi: 'eventsources',
            msubmenu: 'sourceoptions',
            action: 'view',
            data: {},
            successCallback: successCallback,
            failCallback: failCallback,
          });
        },
      },
    };

    var eventRulesCgi = {
      scheduler: {
        view: function(successCallback, failCallback) {
          pcSetupService.requestSunapi({
            cgi: 'eventrules',
            msubmenu: 'scheduler',
            action: 'view',
            data: {
              Type: 'QueueManagement',
            },
            successCallback: successCallback,
            failCallback: failCallback,
          });
        },
        set: function(data, successCallback, failCallback) {
          data.Type = 'QueueManagement';
          pcSetupService.requestSunapi({
            cgi: 'eventrules',
            msubmenu: 'scheduler',
            action: 'set',
            data: data,
            successCallback: successCallback,
            failCallback: failCallback,
          });
        },
      },
    };

    var recordingCgi = {
      control: function(data, successCallback, failCallback) {
        pcSetupService.requestSunapi({
          cgi: 'recording',
          msubmenu: 'queuesearch',
          action: 'control',
          data: data,
          successCallback: successCallback,
          failCallback: failCallback,
        });
      },
      view: function(data, successCallback, failCallback) {
        pcSetupService.requestSunapi({
          cgi: 'recording',
          msubmenu: 'queuesearch',
          action: 'view',
          data: data,
          successCallback: successCallback,
          failCallback: failCallback,
        });
      },
    };

    var cameraLocalTime = {
      data: '',
      set: function(localTime) {
        cameraLocalTime.data = localTime;
      },
      getDateObj: function() {
        return new Date(cameraLocalTime.data);
      },
    };

    this.initModel = function() {
      var deferred = $q.defer();
      pcSetupService.getCameraLocalTime(
        function(localTime) {
          cameraLocalTime.set(localTime);
          deferred.resolve();
        },
        function(errorData) {
          deferred.reject(errorData);
        }
      );

      return deferred.promise;
    };

    function addZero(_data) {
      var data = _data;
      var maxData = 10;
      if (data < maxData) {
        data = "0" + data;
      }

      return data;
    }

    function getSunapiDateFormat(timeStamp) {
      var day = new Date(timeStamp);
      var year = day.getFullYear();
      var month = addZero(day.getMonth() + 1);
      var date = addZero(day.getDate());
      var hours = addZero(day.getHours());
      var minutes = addZero(day.getMinutes());
      var seconds = addZero(day.getSeconds());

      var dateFormat = [
        year,
        '-',
        month,
        '-',
        date,
        'T',
        hours,
        ':',
        minutes,
        ':',
        seconds,
        'Z',
      ];

      return dateFormat.join('');
    }

    var timeRag = /([0-9:]{8})/g;
    var removeTime = function(str) {
      return str.replace(timeRag, '00:00:00');
    };

    var setLastTime = function(str) {
      return str.replace(timeRag, '23:59:59');
    };

    this.getData = function() {
      var deferred = $q.defer();

      function successCallback(_data) {
        var data = _data;
        data = data.data.QueueManagementSetup[0];
        deferred.resolve(data);
      }

      function failCallback(data) {
        deferred.reject(data);
      }

      eventSourcesCgi.queue.view(successCallback, failCallback);

      return deferred.promise;
    };

    this.setData = function(data) {
      var deferred = $q.defer();

      function successCallback(successData) {
        deferred.resolve(successData);
      }

      function failCallback(failData) {
        deferred.reject(failData);
      }

      eventSourcesCgi.queue.set(data, successCallback, failCallback);

      return deferred.promise;
    };

    this.checkData = function(data) {
      var deferred = $q.defer();

      function successCallback(_successData) {
        var successData = _successData;
        successData = successData.data.QueueCount[0].Queues;

        deferred.resolve(successData);
      }

      function failCallback(failData) {
        deferred.reject(failData);
      }

      eventSourcesCgi.queue.check(successCallback, failCallback, data);

      return deferred.promise;
    };

    this.getEventActionData = function() {
      var deferred = $q.defer();

      function successCallback(_data) {
        var data = _data;
        data = data.data.QueueManagement[0];
        deferred.resolve(data);
      }

      function failCallback(data) {
        deferred.reject(data);
      }

      eventRulesCgi.scheduler.view(successCallback, failCallback);

      return deferred.promise;
    };

    this.setEventActionData = function(data) {
      var deferred = $q.defer();

      function successCallback(successData) {
        deferred.resolve(successData);
      }

      function failCallback(failData) {
        deferred.reject(failData);
      }

      eventRulesCgi.scheduler.set(data, successCallback, failCallback);

      return deferred.promise;
    };

    var searchToken = null;
    var graphType = ["average", "cumulative"];

    var getSearchData = function(searchOptions, type, checkList) {
      var deferred = $q.defer();

      var searchControl = recordingCgi.control;
      var searchView = recordingCgi.view;

      function failCallback(errorData) {
        // errorData = interruptMessage;
        deferred.reject(errorData);
      }

      function controlSuccessCallback(response) {
        searchToken = response.data.SearchToken;
        requestSearchView();
      }

      function requestSearchView() {
        searchView(
          {
            Type: 'Status',
            SearchToken: searchToken,
          },
          viewStatusSuccessCallback,
          failCallback
        );
      }

      function viewStatusSuccessCallback(response) {
        if (response.data.Status === "Completed") {
          searchView(
            {
              Type: 'Results',
              SearchToken: searchToken,
            },
            viewResultSuccessCallback,
            failCallback
          );
        } else {
          requestSearchView();
        }
      }

      function viewResultSuccessCallback(_response) {
        var response = _response;
        response = response.data;
        var resultInterval = response.ResultInterval;
        var queueResults = response.QueueResults;
        var responseData = {
          resultInterval: resultInterval,
          data: [],
        };

        for (var i = 0, len = queueResults.length; i < len; i++) {
          var queueSelf = queueResults[i];
          var data = {
            name: queueSelf.Queue,
            direction: null,
            results: null,
            resultInterval: resultInterval,
          };

          if (type === graphType[0]) {
            if (checkList) {
              if (checkList.average.indexOf(i) === -1) {
                continue;
              }
            }
            data.direction = type;
            data.results = fillterResults(queueSelf.AveragePeopleResult, resultInterval);

            responseData.data.push(data);
          } else {
            var queueLevels = queueSelf.QueueLevels;
            for (var jj = 0; jj < queueLevels.length; jj++) {
              if (checkList) {
                var checkListKey = queueLevels[jj].Level.toLowerCase();
                if (typeof checkList[checkListKey] === "undefined" || checkList[checkListKey].indexOf(i) === -1) {
                  continue;
                }
              }
              data.direction = queueLevels[jj].Level;
              data.results = fillterResults(queueLevels[jj].CumulativeTimeResult, resultInterval);

              responseData.data.push(angular.copy(data));
            }
          }
        }

        searchToken = null;
        deferred.resolve(responseData);
      }

      function fillterResults(results, resultInterval) {
        var fillterData = [];

        var changeDateObj = function(_str) {
          var str = _str;
          str = str.replace('T', ' ').replace('Z', '');
          str = str.split(' ');
          str[0] = str[0].split('-');
          str[1] = str[1].split(':');

          var n2 = 2;
          str = new Date(
            str[0][0],
            str[0][1] - 1,
            str[0][n2],
            str[1][0],
            str[1][1],
            str[1][n2]
          );

          return str;
        };

        /**
         * Graph format is <Full Year><Month><Date><Hours><Minutes><Seconds>
         * 2014-07-11 11:23:32 => 20140711112332
         */
        var changeFormatForGraph = function(dateObj) {
          var year = dateObj.getFullYear();
          var month = addZero(dateObj.getMonth() + 1);
          var date = addZero(dateObj.getDate());
          var hours = addZero(dateObj.getHours());
          var minutes = addZero(dateObj.getMinutes());
          var seconds = addZero(dateObj.getSeconds());

          var str = [
            year,
            month,
            date,
            hours,
            minutes,
            seconds,
          ];

          return parseInt(str.join(''));
        };

        var fromDate = changeDateObj(searchOptions.FromDate);
        var toDate = changeDateObj(searchOptions.ToDate);

        var ii = 0;
        var len = 0;
        var data = {};

        switch (resultInterval) {
          case "Hourly":
            for (ii = 0, len = results.length; ii < len; ii++) {
              data = {};
              fromDate.setHours(ii);
              data.timeStamp = changeFormatForGraph(fromDate);
              data.value = parseInt(results[ii]);
              fillterData.push(data);
            }
            break;
          case "Daily":
          case "Weekly":
            for (ii = 0, len = results.length; ii < len; ii++) {
              data = {};

              if (ii === 0) {
                data.timeStamp = changeFormatForGraph(fromDate);
              } else {
                fromDate.setDate(fromDate.getDate() + 1);
                data.timeStamp = changeFormatForGraph(fromDate);
              }

              data.value = parseInt(results[ii]);
              fillterData.push(data);

              if (
                fromDate.getFullYear() === toDate.getFullYear() &&
                fromDate.getMonth() === toDate.getMonth() &&
                fromDate.getDate() === toDate.getDate()
              ) {
                break;
              }
            }
            break;
          case "Monthly":
            for (ii = 0, len = results.length; ii < len; ii++) {
              data = {};

              if (
                fromDate.getFullYear() === toDate.getFullYear() &&
                fromDate.getMonth() === toDate.getMonth()
              ) {
                break;
              }

              if (ii === 0) {
                data.timeStamp = changeFormatForGraph(fromDate);
              } else {
                fromDate.setMonth(fromDate.getMonth() + 1);
                data.timeStamp = changeFormatForGraph(fromDate);
              }

              data.value = parseInt(results[ii]);
              fillterData.push(data);
            }
            break;
        }

        return fillterData;
      }

      searchOptions.Channel = channelIndex;
      searchOptions.Mode = 'Start';
      var ii = 1;
      var maxI = 3;
      if (type === graphType[0]) {
        for (ii = 1; ii <= maxI; ii++) {
          searchOptions["Queue." + ii + ".AveragePeople"] = 'True';
        }
      } else {
        for (ii = 1; ii <= maxI; ii++) {
          searchOptions["Queue." + ii + ".Level.High.CumulativeTime"] = 'True';
          searchOptions["Queue." + ii + ".Level.Medium.CumulativeTime"] = 'True';
        }
      }

      searchControl(
        searchOptions,
        controlSuccessCallback,
        failCallback
      );

      return deferred.promise;
    };

    this.getTodayGraphData = function(type) {
      var nowDate = getSunapiDateFormat(cameraLocalTime.getDateObj().getTime());
      var searchOptions = {};

      searchOptions.FromDate = removeTime(nowDate);
      searchOptions.ToDate = setLastTime(nowDate);

      return getSearchData(searchOptions, type);
    };

    this.getWeeklyGraphData = function(type) {
      var newDate = cameraLocalTime.getDateObj();
      var nowDate = getSunapiDateFormat(newDate.getTime());
      var fromDate = null;
      var searchOptions = {};

      var n6 = 6;
      newDate.setDate(newDate.getDate() - n6);

      var minY = 2000;
      if (newDate.getFullYear() < minY) {
        newDate.setYear(minY);
        newDate.setMonth(0);
        newDate.setDate(1);
      }

      fromDate = getSunapiDateFormat(newDate.getTime());

      searchOptions.FromDate = removeTime(fromDate);
      searchOptions.ToDate = setLastTime(nowDate);

      return getSearchData(searchOptions, type);
    };

    this.getSearchGraphData = function(type, options, checkList) {
      var searchOptions = {
        FromDate: removeTime(getSunapiDateFormat(options.fromDate)),
        ToDate: getSunapiDateFormat(options.toDate),
      };

      return getSearchData(searchOptions, type, checkList);
    };

    this.cancelSearch = function() {
      if (searchToken === null) {
        return;
      }

      recordingCgi.control({
        Mode: 'Cancel',
        SearchToken: searchToken,
      }, function(response) {
        console.log("Search is canceled.");
      }, function(errorData) {
        console.error(errorData);
      });
    };

  };

  return QueueModel;
});