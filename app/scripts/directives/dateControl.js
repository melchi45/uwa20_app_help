kindFramework.directive('dateControl', ['$rootScope','TimelineService','SearchDataModel',
  'PlayDataModel','PLAYBACK_TYPE','ModalManagerService','PlaybackInterface','$timeout',
  function($rootScope, TimelineService, SearchDataModel, PlayDataModel, PLAYBACK_TYPE,
    ModalManagerService, PlaybackInterface, $timeout) {
    'use strict';
    var searchedData = {};
    var pad = function(x){
      x *= 1;
      return x<10? "0"+x : x;
    };
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/livePlayback/directives/date-control.html',
      require:'^timeline',
      scope: {
        'items': '@',
        'control': '=',
        'eventChangeUnallowed':'=',
        'disableBackupIcon' : '=',
        'playbackBackup' : '='
      },
      controller: function($scope, $element) {
      },
      link: function(scope, element, attr, timelineCtrl) {
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
        moment.tz.add("Africa/Abidjan|LMT GMT|g.8 0|01|-2ldXH.Q|48e5");
        moment.tz.setDefault("Africa/Abidjan");
        var showDateString = function(dateObj) {
          scope.currentDate = dateObj.getFullYear()+"-"+pad(dateObj.getMonth()+1)+"-"+pad(dateObj.getDate());
        };
        var onChangeCurrentDate = function(current) {
          showDateString(current.date);
          timelineCtrl.changeOptions(current.date);
          if( current.startTime === undefined ) {
            current.startTime = "00:00:00";
          }
          if( current.endTime === undefined ) {
            current.endTime = "23:59:59";
          }
          var startTime = (current.startTime).split(":");
          var endTime = (current.endTime).split(":");
          var startWindow = moment.parseZone(
            current.date.getFullYear()+'-'+pad(current.date.getMonth()+1)+'-'+pad(current.date.getDate())+
            ' '+pad(startTime[0])+':'+pad(startTime[1])+':'+pad(startTime[2])+"+00:00");
          var endWindow = moment.parseZone(
            current.date.getFullYear()+'-'+pad(current.date.getMonth()+1)+'-'+pad(current.date.getDate())+
            ' '+pad(endTime[0])+':'+pad(endTime[1])+':'+pad(endTime[2])+"+00:00");
          searchData.setSelectedDate(current.date);
          timelineCtrl.changeTimelineView(startWindow, endWindow);
          timelineCtrl.clearTimeline();
          var searchInfo = {
            'startTime' : current.startTime,
            'endTime' : current.endTime,
            'date' : current.date,
            'eventList' : searchData.getEventTypeList(),
            'id': searchData.getOverlapId(),
          };

          $rootScope.$emit('changeLoadingBar', true);
          PlaybackInterface.requestEventSearch(searchInfo)
          .then(function() {
            $rootScope.$emit('changeLoadingBar', false);
          }, function(){
            $rootScope.$emit('changeLoadingBar', false);
          }); 
        };


        scope.control.changePlayingTime = function(hours, minutes, seconds){
          scope.playingTime.hours = pad(hours);
          scope.playingTime.minutes = pad(minutes);
          scope.playingTime.seconds = pad(seconds);
        };

        scope.control.changeCurrnetDate = function(current){
          showDateString(current.date);

          if( current.startTime === undefined ) {
            current.startTime = "00:00:00";
          }
          if( current.endTime === undefined ) {
            current.endTime = "23:59:59";
          }
        };

        scope.control.getSearchInfo = function(current){
          timelineCtrl.changeOptions(current.date);

          var startTime = (current.startTime).split(":");
          var endTime = (current.endTime).split(":");
          var startWindow = moment.parseZone(
            current.date.getFullYear()+'-'+pad(current.date.getMonth()+1)+'-'+pad(current.date.getDate())+
            ' '+pad(startTime[0])+':'+pad(startTime[1])+':'+pad(startTime[2])+'+00:00');
          var endWindow = moment.parseZone(
            current.date.getFullYear()+'-'+pad(current.date.getMonth()+1)+'-'+pad(current.date.getDate())+
            ' '+pad(endTime[0])+':'+pad(endTime[1])+':'+pad(endTime[2])+'+00:00');
          searchData.setSelectedDate(current.date);
          timelineCtrl.changeTimelineView(startWindow, endWindow);
          var channelId = searchData.getChannelId();

          var searchInfo = {
            'startTime' : current.startTime,
            'endTime' : current.endTime,
            'date' : current.date,
            'eventList' : searchData.getEventTypeList(),
            'id': searchData.getOverlapId(),
            'channel' : channelId
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

        scope.goPrevDay = function(event) {
          playData.setDefautPlaySpeed();
          playData.setStatus(PLAY_CMD.STOP);
          var targetDate = searchData.getSelectedDate();
          targetDate.setDate(targetDate.getDate()-1);
          searchData.setSelectedDate(targetDate);
          onChangeCurrentDate({'date':targetDate});
        };

        scope.goNextDay = function(event) {
          playData.setDefautPlaySpeed();
          playData.setStatus(PLAY_CMD.STOP);
          var targetDate = searchData.getSelectedDate();
          targetDate.setDate(targetDate.getDate()+1);
          searchData.setSelectedDate(targetDate);
          onChangeCurrentDate({'date':targetDate});
        };

        scope.goToday = function(event) {
          playData.setDefautPlaySpeed();
          playData.setStatus(PLAY_CMD.STOP);
          onChangeCurrentDate({'date':new Date()});
        };

        scope.onKeyDown = function(keyEvent) {
          if( keyEvent.which === 13 ) { // Enter
            scope.control.setTimebarPosition(scope.playingTime.hours, 
              scope.playingTime.minutes, scope.playingTime.seconds);
          }
        };
        var watchTime = scope.$watch(function(){return playData.getStartTime() || playData.getEndTime();},
          function(newVal, oldVal) {
            var startTime = playData.getStartTime();
            var endTime = playData.getEndTime();
            if( startTime === null || endTime === null ) return;
            scope.startTime = pad(startTime.getHours())+""+pad(startTime.getMinutes())+""+pad(startTime.getSeconds());
            if( endTime !== null || endTime !== undefined) {
              scope.endTime = pad(endTime.getHours())+""+pad(endTime.getMinutes())+""+pad(endTime.getSeconds());
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

        scope.$on('$destroy', function(){
          watchTime();
        });
      },
    };
  }
]);