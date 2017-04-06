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
        'control': '=',
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

        /*
        * Callback function called by when selecting timeline item.
        *
        * @function : updateTimelineText
        * @param : list is type of Object ( containing selected item info )
        */
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

        /*
        * create timeline
        *
        * @function : create
        */
        $scope.timelineControl.create = function() {
          //check element.
          timelineCtrl.createTimeline($element, updateTimelineText);
        };

        /*
        * redraw timeline
        *
        * @function : redraw
        */
        $scope.timelineControl.redraw = function() {
          timelineCtrl.redraw();
        };

        /*
        * reset timeline ( clear data & set default view )
        *
        * @function : clear
        */
        $scope.timelineControl.clear = function() {
          $scope.duplicateItems = [];
          timelineCtrl.clearTimeline();
        };

        /*
        * check current timebar is valid
        *
        * @function : checkCurrentTimeIsValid
        */
        $scope.timelineControl.checkCurrentTimeIsValid = function() {
          return timelineCtrl.checkCurrentTimeIsValid();
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
         * Timeline Mode�� �� 4���� ������,
         * Timeline Mode�� �ٲ��� UI �� �ٲ���.
         * playback, backup, datepicker, eventsorting �� 4���� �ִ�.
         */
        var timelineMode = [
          'playback',
          'backup',
          'datepicker',
          'eventsorting'
        ];

        $scope.timelineControl.currentTimelineMode = 'playback';

        /*
        * change timeline mode 
        *
        * @function : changeTimelineMode
        * @param : index is type of Int
        */
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

        /*
        * determine event sorting buttons' name 
        *
        * @function : changePopupName
        */
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

        /*
        * ok button click event action
        *
        * @function : submit
        */
        $scope.timelineControl.submit = function(){
          var mode = 0;
          switch( $scope.timelineControl.currentTimelineMode ) {
            case 'datepicker':
              var selectedDate = $scope.timelineControl.getSelectedDate();
              /* �޷� Validation�� ���� ���� �� */
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
                timelineCtrl.redraw();
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
                  timelineCtrl.redraw();
                  $rootScope.$emit('changeLoadingBar', false);
                });
              };
              successCallback(data);
            break;
            case 'backup':
              var backupTime = $scope.timelineControl.getBackupDate();
              if( backupTime !== null ) {
                playData.setPlaybackBackupTime(backupTime.currentDate, backupTime.startTime, 
                                                backupTime.endTime);
                $rootScope.$emit('playbackBackup');
                $rootScope.$emit('changeLoadingBar', true);
              }
              mode = 1;
              timelineCtrl.resetTimeRange();
            break;
          }

          $rootScope.$emit('channelSelector:on', true);
          $rootScope.$emit('app/scripts/services/playbackClass::disableButton', false);
          $scope.timelineControl.changeTimelineMode(mode);
        };

        /*
        * cancel button click event action
        *
        * @function : cancel
        */
        $scope.timelineControl.cancel = function(){
          switch($scope.timelineControl.currentTimelineMode) {
            case 'backup':
            case 'datepicker':
            case 'eventsorting':
              timelineCtrl.resetTimeRange();
            break;
          }
          $rootScope.$emit('channelSelector:on', true);
          $rootScope.$emit('app/scripts/services/playbackClass::disableButton', false);
          $scope.timelineControl.changeTimelineMode(0);
          $timeout(function(){
            timelineCtrl.redraw();
          });
        };

        /*
        * re-start selected Item
        * @function : goInit
        */
        $scope.timelineControl.goInit = function() {
          timelineCtrl.goInit();
        };

        /*
        * jump to next/prev item.
        * @function : jumpEvent
        * @param : newVal is PLAY_CMD.PREV or PLAY_CMD.NEXT ( refer to playback_type.js )
        */
        $scope.timelineControl.jumpEvent = function(newVal) {
          return timelineCtrl.jumpEvent(newVal);
        };

        /*
        * delete timeline and item set
        * @function : destroy
        */
        $scope.timelineControl.destroy = function() {
          timelineCtrl.destroy();
          $scope.duplicateItems = [];
        };

        /*
        * re-calcurating timerange
        * @function : resetTimeRange
        */
        $scope.timelineControl.resetTimeRange = function() {
          timelineCtrl.resetTimeRange();
        };

        /*
        * change timebar position
        * @function : setTimebarPosition
        * @param : hour, minutes, seconds is type of init
        */
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

        scope.control.changePopupName();

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

          $rootScope.$emit('channelSelector:off', true);
          $rootScope.$emit('app/scripts/services/playbackClass::disableButton', true);
          scope.control.changeTimelineMode(3);
        };

        /**
        * Check current overlap & event status to open popup
        * @function : checkCurrentStatus
        */
        scope.checkCurrentStatus = function() {
          // console.log("open Overlap menu");
          $rootScope.$emit('changeLoadingBar', true);
          playbackInterfaceService.checkCurrentStatus(searchData.getSelectedDate())
            .then(function(eventList) {
              $rootScope.$emit('changeLoadingBar', false);
              openOverlapEventPopup(eventList);
            }, function(error) {
              ModalManagerService.open(
                'message',
                {'message' : 'lang_timeout', 'buttonCount':1}
              );
              $rootScope.$emit('changeLoadingBar', false);
              console.log("get Current Status failed");
            });
        };

        scope.onClick = function(event){
          timelineCtrl.selectTimeline(event);
          if( playData.getStatus() === PLAY_CMD.PAUSE ) {
            playData.setNeedToImmediate(true);
          }
        };

        /*
        * pinch event handler
        * @function : zoomTimeline
        */
        scope.zoomTimeline = function(event) {
          if( event.type === 'pinchcancel' || event.type === 'pinchend') {
            timelineCtrl.enableToDraw();
          }
        };

        /*
        * swipe event handler
        * @function : swipeTimelie
        */
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

        var watchPlayStatus = scope.$watch(
          function() {
            return playData.getStatus();
          }, function(newVal){
            if( newVal === null ) return;
            if( newVal ===  PLAY_CMD.STOP || newVal === PLAY_CMD.PAUSE ) {
              timelineCtrl.stopCallback(true);
            }
            else if( newVal === PLAY_CMD.PLAY ) {
              timelineCtrl.stopCallback(false);
            }
        });

        var watchEventList = scope.$watch(
          function() { 
            return searchData.getEventTypeList();
          }, function(oldVal, newVal) {
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
          $timeout(timelineCtrl.redraw);
        }, scope);

        /**
        * reset start & end time for event search.
        * 'refreshStartEndTime' event sent by playbackFunction.js
        */
        $rootScope.$saveOn('app/scripts/models/playback/PlayDataModel.js::changeSpeed', 
          function(event, data) {
            if( data === null ) return;
            timelineCtrl.applyPlaySpeed(data);
        }, scope);

        $rootScope.$saveOn('app/scripts/services/playbackClass::setDefaultPlaybackMode', 
          function(event, data){
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