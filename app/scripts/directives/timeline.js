kindFramework.directive('timeline', ['$filter', '$interval', '$timeout', '$rootScope',
  'PLAYBACK_TYPE', 'ModalManagerService', 'PlaybackInterface', 'SearchDataModel', 'TimelineService',
  'PlayDataModel','$q',
  function($filter, $interval, $timeout, $rootScope, PLAYBACK_TYPE, ModalManagerService,
    PlaybackInterface, SearchDataModel, TimelineService, PlayDataModel,$q) {
    'use strict';
    return {
      restrict: 'E',
      templateUrl: 'views/livePlayback/directives/timeline.html',
      scope: {
        'items': '@',
        'control': '=',
        'eventChangeUnallowed':'=',
        'disableBackupIcon' : '=',
        'playbackBackup' : '='
      },
      controller: function($scope, $element) {
        $element.attr('id', $scope.elementId);
        $scope.timelineControl = $scope.control || {};
        var searchData = new SearchDataModel();
        var PLAY_CMD = PLAYBACK_TYPE.playCommand;
        var playData = new PlayDataModel();
        var timelineCtrl = new TimelineService();
        var playbackInterfaceService = PlaybackInterface;
        $scope.visibility = {
          datepicker : false,
          backup : false
        };

        var updateTimelineText = function(list) {
          var eventList = searchData.getEventTypeList();
          if( eventList === null || eventList.length > 1  || eventList[0] ==='All') {
            for( var i=0 ; i< list.length; i ++ ) {
              list[i].eventType = playbackInterfaceService.getEventName(list[i].eventType);
            }
          }
          else {
            for( var i=0 ; i< list.length; i ++ ) {
              list[i].eventType = '';
            }
          }
          $scope.duplicateItems = list;
        };

        $scope.timelineControl.create = function(type) {
          //check element.
          timelineCtrl.createTimeline(type, $element, updateTimelineText);
        };

        $scope.timelineControl.redraw = function() {
          timelineCtrl.redraw();
        };

        $scope.timelineControl.clear = function() {
          $scope.duplicateItems = [];
          timelineCtrl.clearTimeline();
        };

        $scope.timelineControl.isValidTimePosition = function() {
          return timelineCtrl.isValidTimePosition();
        };

        $scope.timelineControl.timeValidation = {
          pattern: {
            hour: "^([0-1]{0,1}[0-9]{0,1}|[2]{1}[0-3]{1})$",
            minuteSecond: "^([0-5]{0,1}[0-9]{0,1})$"
          },
          blur: function($event){
            try{
              var self = $event.target;
              var val = self.value;

              if(val === ''){
                val = '00';
              }else{
                if(val.length === 1){
                  val = "0" + val;
                }
              }

              self.value = val;
            }catch(e){
              console.error(e);
            }
          },
          focus: function($event){
            try{
              $event.target.setSelectionRange(0, 2); 
            }catch(e){
              console.error(e);
            }
          }
        };

        /**
         * Timeline Mode는 총 4개가 있으며,
         * Timeline Mode가 바뀌면 UI 가 바뀐다.
         * playback, backup, datepicker, eventsorting 총 4개가 있다.
         */
        var timelineMode = [
          'playback',
          'backup',
          'datepicker',
          'eventsorting'
        ];

        $scope.timelineControl.currentTimelineMode = 'playback';

        $scope.timelineControl.changeTimelineMode = function(index){
          $scope.timelineControl.currentTimelineMode = timelineMode[index];
          if( index === 1 ) { // backup
            $scope.visibility.backup = true;
          }
          else if( index === 2 ) { // datepicker
            $scope.visibility.backup = false;
            $scope.timelineControl.showMenu();
          }
          else {
            $scope.visibility.backup = false;
          }
          if( index !== 1 ) {
            $rootScope.$emit('app/scripts/services/playbackClass::disableButton', false);
          }
        };

        $scope.timelineControl.toggleBackupState = function(){
          var mode = $scope.timelineControl.currentTimelineMode === 'playback' ? 1 : 0;
          $scope.timelineControl.changeTimelineMode(mode);
        };

        //This function will be defined in playbackDatepicker.js
        $scope.timelineControl.getSelectedDate = function(){};
        $scope.timelineControl.showMenu = function(){};

        //This function will be defined in dataControl.js
        $scope.timelineControl.changeCurrnetDate = function(dateobj){};
        $scope.timelineControl.getSearchInfo = function(){};
        $scope.timelineControl.changePlayingTime = function(){};

        //This function will be defined in playbackEventSorting.js
        $scope.timelineControl.getOverlapEvent = function(){};
        $scope.timelineControl.setOverlapEvent = function(){};

        //This function will be defined in playbackBackup.js
        $scope.timelineControl.getBackupDate = function(){};

        $scope.timelineControl.changePopupName = function() {
          var targetEvent = null;
          var eventList = searchData.getEventTypeList();
          if( eventList !== null && eventList.length === 1 ) {
             targetEvent = eventList[0];
          } else if(eventList !== null && eventList.length > 1) {
            targetEvent = 'All';
          }
          $scope.selectedEvent = playbackInterfaceService.getEventName(targetEvent);
        };

        $scope.timelineControl.submit = function(){
          var mode = 0;
          switch($scope.timelineControl.currentTimelineMode){
            case 'datepicker':
              var selectedDate = $scope.timelineControl.getSelectedDate();
              /* 달력 Validation이 실패 했을 때 */
              if(selectedDate === false){
                return;
              }
              $scope.timelineControl.changeCurrnetDate(selectedDate);
              var searchInfo = $scope.timelineControl.getSearchInfo(selectedDate);
              $rootScope.$emit('changeLoadingBar', true);
              PlaybackInterface.requestEventSearch(searchInfo)
              .then(function() {
                $rootScope.$emit('changeLoadingBar', false);
              }, function(){
                $scope.redraw();
                $rootScope.$emit('changeLoadingBar', false);
              }); 
            break;
            case 'eventsorting':
              var data = $scope.timelineControl.getOverlapEvent();
              var successCallback = function(data) {
                var inputData = {
                  'date':  searchData.getSelectedDate(),
                  'eventList' : data.selectedEvent,
                  'id' : data.selectedOverlap
                };

                $scope.timelineControl.changePopupName();
                //revert from/to time to default value.
                searchData.setRefreshHoldTimeValue();
                timelineCtrl.refreshTimelineView();
                $rootScope.$emit('changeLoadingBar', true);
                playbackInterfaceService.requestEventSearch(inputData)
                .then(function(){
                  $rootScope.$emit('changeLoadingBar', false);
                },function(){
                  $scope.redraw();
                  $rootScope.$emit('changeLoadingBar', false);
                });
              };

              successCallback(data);
            break;
            case 'backup':
              
              var backupTime = $scope.timelineControl.getBackupDate();
              if( backupTime !== null ) {
                playData.setPlaybackBackupTime(backupTime.currentDate, backupTime.startTime, backupTime.endTime);
                $rootScope.$emit('playbackBackup');
                $rootScope.$emit('changeLoadingBar', true);
              }
              mode = 1;
              timelineCtrl.resetTimeRange();
            break;
          }

          $scope.timelineControl.changeTimelineMode(mode);
        };

        $scope.timelineControl.cancel = function(){
          switch($scope.timelineControl.currentTimelineMode) {
            case 'backup':
            case 'datepicker':
            case 'eventsorting':
              timelineCtrl.resetTimeRange();
            break;
          }
          $scope.timelineControl.changeTimelineMode(0);
          $timeout(function(){
            timelineCtrl.redraw();
          });
        };

        /*
        * re-start selected Item
        * @name : goInit
        */
        $scope.timelineControl.goInit = function() {
          timelineCtrl.goInit();
        };

        /*
        * jump to next/prev item.
        * @name : jumpEvent
        * @param : newVal is PLAY_CMD.PREV or PLAY_CMD.NEXT ( refer to playback_type.js )
        */
        $scope.timelineControl.jumpEvent = function(newVal) {
          return timelineCtrl.jumpEvent(newVal);
        };

        /*
        * delete timeline and item set
        * @name : destroy
        */
        $scope.timelineControl.destroy = function() {
          timelineCtrl.destroy();
          $scope.duplicateItems = [];
        };

        /*
        * change window if changing from / to time (through ModalInstnceSearchCtrl.js)
        * @name : changeView
        * @param : timelineView - {'start' : "HH:mm:ss" , 'end' : "HH:mm:ss", 'date' : Date object}
        */
        $scope.timelineControl.changeView = function(timelineView) {
          timelineCtrl.changeOptions(timelineView.date);
          var currentDate = searchData.getSelectedDate();
          var startTime = timelineView.start.split(":");
          var endTime = timelineView.end.split(":");
          var startWindow = moment.parseZone(startTime+"+00:00");
          var endWindow = moment.parseZone(endTime + "+00:00");

          timelineCtrl.changeTimelineView(startWindow, endWindow);
        };

        $scope.timelineControl.resetTimeRange = function() {
          timelineCtrl.resetTimeRange();
        };

        $scope.timelineControl.setTimebarPosition = function(hour, minutes, seconds) {
          if( timelineCtrl.setTimebar(hour, minutes, seconds) === true ) {
            if( playData.getStatus() === PLAY_CMD.PAUSE ) {
              playData.setNeedToImmediate(true);
            }
          }
        };
      },
      link: function(scope, element, attr) {
        var PLAY_CMD = PLAYBACK_TYPE.playCommand;
        var playData = new PlayDataModel();
        var timelineCtrl = new TimelineService();
        var searchData = new SearchDataModel();
        scope.duplicateItems = [];
        var playbackInterfaceService = PlaybackInterface;

        scope.selectOneEvent = function(item) {
          timelineCtrl.selectOneEvent(scope.duplicateItems, item);
        };

        /*
        * If multiple event select or All selected, popup name show "All Event"
        * else, popup name show selected Event name
        * @name : changePopupName
        */

        scope.control.changePopupName();

        /**
        * Check current overlap & event status to open popup
        * @name : checkCurrentStatus
        */
        scope.checkCurrentStatus = function() {
          if(scope.eventChangeUnallowed === true) return;
          console.log("open Overlap menu");
          $rootScope.$emit('changeLoadingBar', true);
          playbackInterfaceService.checkCurrentStatus(searchData.getSelectedDate())
            .then(function(eventList) {
              $rootScope.$emit('changeLoadingBar', false);
              openOverlapEventPopup(eventList);
                /*.finally(function(result) {
                  $rootScope.$emit('changeLoadingBar', false);
                });*/
            }, function(error) {
              ModalManagerService.open(
                'message',
                {'message' : 'lang_timeout', 'buttonCount':1}
              );
              $rootScope.$emit('changeLoadingBar', false);
              console.log("get Current Status failed");
            });
        };

        var openOverlapEventPopup = function(eventList) {
          var recordedDate = searchData.getSelectedDate();
          /*
          * If open OverlapEvent popup, need to stop playback stream.
          */
          playData.setStatus(PLAY_CMD.STOP);
          var overlapId = searchData.getOverlapId();
          playData.setDefautPlaySpeed();
          //$rootScope.$emit('changeLoadingBar', false);
          scope.control.setOverlapEvent({ 
            'buttonCount': 1, 
            'selectedEvent' : searchData.getEventTypeList(), 
            'eventList':eventList, 
            'overlapList':overlapId,
            'recordedDate':recordedDate
          });

          scope.control.changeTimelineMode(3);
        };

        scope.onClick = function(event){
          timelineCtrl.selectTimeline(event);
          if( playData.getStatus() === PLAY_CMD.PAUSE ) {
            playData.setNeedToImmediate(true);
          }
        };

        scope.zoomTimeline = function(event) {
          if( event.type === 'pinchcancel' || event.type === 'pinchend') {
            timelineCtrl.enableToDraw();
          }
        };

        scope.swipeTimelie = function(event) {
            if( event.type === 'panend' || event.type === 'pancancel') {
              timelineCtrl.enableToDraw();
            }
        };

        var redrawTimeout = null;

        $(window).on("resize", function(){
          if( redrawTimeout  === null ) {
            redrawTimeout = $timeout(function(){
              timelineCtrl.redraw();
              $timeout.cancel(redrawTimeout);
              redrawTimeout = null;
            },500);
          }
        });

        scope.redraw = function() {
          timelineCtrl.redraw();
        };

        var watchPlayStatus = scope.$watch(function(){return playData.getStatus();}, function(newVal){
          if( newVal === null ) return;
          if( newVal ===  PLAY_CMD.STOP || newVal === PLAY_CMD.PAUSE ){
            timelineCtrl.stopCallback(true);
          }
          else if( newVal === PLAY_CMD.PLAY ){
            timelineCtrl.stopCallback(false);
          }
        });

        var watchEventList = scope.$watch(function(){ return searchData.getEventTypeList();}, function(oldVal, newVal) {
          if( oldVal !== newVal) {
            scope.control.changePopupName();
          }
        });

        $rootScope.$saveOn('updateItem', function(event, data){
          if(data === null) return;
          var timerange = null;
          if(typeof data === 'object') {
            timerange = data;
          }
          timelineCtrl.displayTimeline(timerange);
          $rootScope.$emit('app/scripts/directives/timeline.js::timelineDataCount', data);
        }, scope);

        $rootScope.$saveOn('itemSetDone', function() {
          console.log('item set done :::');
          $timeout(timelineCtrl.redraw);
        }, scope);

        /**
        * reset start & end time for event search.
        * 'refreshStartEndTime' event sent by playbackFunction.js
        */
        $rootScope.$saveOn('app/scripts/models/playback/PlayDataModel.js::changeSpeed', function(event, data) {
          if( data === null ) return;
          timelineCtrl.applyPlaySpeed(data);
        }, scope);

        $rootScope.$saveOn('app/scripts/services/playbackClass::setDefaultPlaybackMode', function(event, data){
          scope.timelineControl.changeTimelineMode(0);
        }, scope);

        scope.$on('$destroy', function(){
          $(window).off("resize");
          watchPlayStatus();
          watchEventList();
        });
      },
    };
  }
]);