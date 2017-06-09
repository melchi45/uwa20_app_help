kindFramework.directive('dateControl', ['$rootScope', 'TimelineService', 'SearchDataModel',
  'PlayDataModel', 'PLAYBACK_TYPE', 'ModalManagerService', 'PlaybackInterface', '$timeout',
  'UniversialManagerService',
  function($rootScope, TimelineService, SearchDataModel, PlayDataModel, PLAYBACK_TYPE,
    ModalManagerService, PlaybackInterface, $timeout, UniversialManagerService) {
    'use strict';
    var MIN_DOUBLE_FIGURES = 10;
    var pad = function(input) {
      var target = input*1;
      return target < MIN_DOUBLE_FIGURES ? "0" + target : target;
    };
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/livePlayback/directives/date-control.html',
      require: '^timeline',
      scope: {
        'items': '@',
        'control': '=',
        'eventChangeUnallowed': '=',
        'disableBackupIcon': '=',
        'playbackBackup': '=',
      },
      link: function(scope) {
        $rootScope.$emit('timeline::initialized');
        scope.currentDate = '';
        scope.playingTime = {
          hours: '00',
          minutes: '00',
          seconds: '00',
        };
        scope.blockTimeInput = false;
        var timelineCtrl = new TimelineService();
        var searchData = new SearchDataModel();
        var playData = new PlayDataModel();
        var PLAY_CMD = PLAYBACK_TYPE.playCommand;
        var KEYCODE = {ENTER : 13};
        moment.tz.add("Africa/Abidjan|LMT GMT|g.8 0|01|-2ldXH.Q|48e5");
        moment.tz.setDefault("Africa/Abidjan");
        var showDateString = function(dateObj) {
          scope.currentDate = dateObj.getFullYear() + "-" + pad(dateObj.getMonth() + 1) + "-" + pad(dateObj.getDate());
        };
        var parsingTime = function(date, start, end) {
          var startTime = start.split(":");
          var endTime = end.split(":");
          var startTimeString='', endTimeString='';
          startTimeString = endTimeString = date.getFullYear() + '-' + pad(date.getMonth() + 1) + 
            '-' + pad(date.getDate())+' ';
          for ( var idx = 0; idx < startTime.length; idx++ ) {
            startTimeString += pad(startTime[idx]);
            endTimeString += pad(endTime[idx]);
            if ( idx !== startTime.length-1 ) {
              startTimeString += ':';
            }
          }
          startTimeString += "+00:00";
          endTimeString += "+00:00";
          var results = {
            'startWindow':moment.parseZone( startTimeString ),
            'endWindow':moment.parseZone( endTimeString ),
          };
          return results;
        };
        var onChangeCurrentDate = function(current) {
          showDateString(current.date);
          timelineCtrl.changeOptions(current.date);
          if (typeof current.startTime === "undefined") {
            current.startTime = "00:00:00";
          }
          if (typeof current.endTime === "undefined") {
            current.endTime = "23:59:59";
          }
          var windows = parsingTime (current.date, current.startTime, current.endTime);
          searchData.setSelectedDate(current.date);
          timelineCtrl.changeTimelineView(windows.startWindow, windows.endWindow);
          timelineCtrl.clearTimeline();
          var searchInfo = {
            'startTime': current.startTime,
            'endTime': current.endTime,
            'date': current.date,
            'eventList': searchData.getEventTypeList(),
            'id': searchData.getOverlapId(),
          };

          $rootScope.$emit('changeLoadingBar', true);
          PlaybackInterface.requestEventSearch(searchInfo).
            then(function() {
              $rootScope.$emit('changeLoadingBar', false);
            }, function() {
              $rootScope.$emit('changeLoadingBar', false);
            });
        };


        scope.control.changePlayingTime = function(hours, minutes, seconds) {
          scope.playingTime.hours = pad(hours);
          scope.playingTime.minutes = pad(minutes);
          scope.playingTime.seconds = pad(seconds);
        };

        scope.control.changeCurrnetDate = function(current) {
          showDateString(current.date);

          if (typeof current.startTime === "undefined") {
            current.startTime = "00:00:00";
          }
          if (typeof current.endTime === "undefined") {
            current.endTime = "23:59:59";
          }
        };

        scope.control.getSearchInfo = function(current) {
          timelineCtrl.changeOptions(current.date);
          var windows = parsingTime(current.date, current.startTime, current.endTime);
          searchData.setSelectedDate(current.date);
          timelineCtrl.changeTimelineView(windows.startWindow, windows.endWindow);
          var channelId = UniversialManagerService.getChannelId();

          var searchInfo = {
            'startTime': current.startTime,
            'endTime': current.endTime,
            'date': current.date,
            'eventList': searchData.getEventTypeList(),
            'id': searchData.getOverlapId(),
            'channel': channelId,
          };

          return searchInfo;
        };

        scope.control.startBackup = function() {
          playData.setPlaybackBackupTime(searchData.getSelectedDate(), scope.startTime, scope.endTime);
          $rootScope.$emit('playbackBackup');
        };

        scope.visibleSearchPopup = function(event) {
          event.srcEvent.preventDefault();
          event.srcEvent.stopPropagation();

          playData.setStatus(PLAY_CMD.STOP);
          playData.setDefautPlaySpeed();

          var mode = scope.control.currentTimelineMode === 'backup' ? 4 : 2;
          $rootScope.$emit('channelSelector:off', true);
          $rootScope.$emit('app/scripts/services/playbackClass::disableButton', true);
          scope.control.changeTimelineMode(mode);

          /*var successCallback = function(data) {
            onChangeCurrentDate(data);
          };
          var data = {
            'selectedStartTime' : searchedData.startTime,
            'selectedEndTime' : searchedData.endTime,
            'selectedData' : searchedData.selectedDate,
          };

          if(scope.timelineMode === 'backup'){
            data.buttonName = 'lang_ok';
          }*/
          /*
           * If open Search popup, need to stop playback stream.
           */
          /*playData.setStatus(PLAY_CMD.STOP);
          playData.setDefautPlaySpeed();
          $rootScope.$emit('changeLoadingBar', false);
          ModalManagerService.open(
            'search',
            data,
            successCallback
          );*/
        };

        scope.goPrevDay = function() {
          playData.setDefautPlaySpeed();
          playData.setStatus(PLAY_CMD.STOP);
          var targetDate = searchData.getSelectedDate();
          targetDate.setDate(targetDate.getDate() - 1);
          searchData.setSelectedDate(targetDate);
          onChangeCurrentDate({
            'date': targetDate,
          });
        };

        scope.goNextDay = function() {
          playData.setDefautPlaySpeed();
          playData.setStatus(PLAY_CMD.STOP);
          var targetDate = searchData.getSelectedDate();
          targetDate.setDate(targetDate.getDate() + 1);
          searchData.setSelectedDate(targetDate);
          onChangeCurrentDate({
            'date': targetDate,
          });
        };

        scope.goToday = function() {
          playData.setDefautPlaySpeed();
          playData.setStatus(PLAY_CMD.STOP);
          onChangeCurrentDate({
            'date': new Date(),
          });
        };

        scope.onKeyDown = function(keyEvent) {
          if (keyEvent.which === KEYCODE.ENTER) { // Enter
            scope.control.setTimebarPosition(scope.playingTime.hours,
              scope.playingTime.minutes, scope.playingTime.seconds);
          }
        };
        var watchTime = scope.$watch(function() {
          return playData.getStartTime() || playData.getEndTime();
        }, function() {
          var startTime = playData.getStartTime();
          var endTime = playData.getEndTime();
          if (startTime === null || endTime === null) {
            return;
          }
          scope.startTime = pad(startTime.getHours()) + "" + pad(startTime.getMinutes()) + "" + pad(startTime.getSeconds());
          if (endTime !== null || typeof endTime !== "undefined") {
            scope.endTime = pad(endTime.getHours()) + "" + pad(endTime.getMinutes()) + "" + pad(endTime.getSeconds());
          }
        });

        $rootScope.$saveOn('updateTimebar', function(event, timePosition) {
          $timeout(function() {
            scope.playingTime.hours = pad(timePosition.hours);
            scope.playingTime.minutes = pad(timePosition.minutes);
            scope.playingTime.seconds = pad(timePosition.seconds);
          });
        }, scope);

        $rootScope.$saveOn('blockTimebarInputField', function(event, data) {
          scope.blockTimeInput = data;
        }, scope);

        scope.$on('$destroy', function() {
          watchTime();
        });
      },
    };
  },
]);