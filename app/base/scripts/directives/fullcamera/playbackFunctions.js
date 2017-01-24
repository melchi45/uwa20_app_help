/*global setTimeout*/
kindFramework
.directive('playbackFunctions', ['$rootScope', '$filter', '$timeout','PlaybackInterface',
  'PLAYBACK_TYPE', 'ModalManagerService','CameraService',
  'CAMERA_TYPE', 'SearchDataModel', 'PlayDataModel', 'UniversialManagerService',
    function ($rootScope, $filter,$timeout, PlaybackInterface, PLAYBACK_TYPE, 
      ModalManagerService, CameraService,CAMERA_TYPE,
      SearchDataModel, PlayDataModel, UniversialManagerService) {
      "use strict";
    var optionServiceType = ['WEB_SSM', 'WEB_IPOLIS', 'MOBILE_B2C', 'MOBILE_B2B'];
    var searchedData = {};
    var speedData = {};
    return {
        templateUrl: 'views/livePlayback/directives/fullcamera/playback-functions.html',
        require: '^fullCamera',
        scope: {
          'control' :'=',
          'playPlayback':'&',
          'toggleNavOverlay': '&',
          'playSpeed' : '=',
        },
        controller : function($scope) {
        },
        link: function(scope, element, attributes, fullCameraCtrl) {
          var defaultViewMode = 'originalratio';
          var defaultViewIcon = 'tui-ch-live-view-'+defaultViewMode;
          var searchData = new SearchDataModel();
          var playData = new PlayDataModel();
          var waitChangePlaySpeed = false;
          var delayOpenPopup = false;
          scope.playControl = scope.control || {};
          scope.connectedService = optionServiceType[UniversialManagerService.getServiceType()];
          scope.disableButton = false;
          var playbackInterfaceService = PlaybackInterface;
          scope.listenAudio = function() {
            ModalManagerService.open('slider', {'tag': 'speaker', 'buttonCount': 0, 'timeSections': ['0', '1', '2', '3', '4', '5']});
          };
          scope.captureScreen = function() {
            if(playData.getStatus() === PLAY_CMD.PLAY) {
              CameraService.captureScreen();
            } else {
              $rootScope.$emit('changeLoadingBar', false);
              ModalManagerService.open('message', { 'buttonCount': 0, 'message': "lang_no_video_played" } );
              return;
            }
          };
          var domControls = scope.domControls = {
            visibilityFullScreenFuntions: false,
            visibilityPlaybackControl: false,
          };
          var PLAY_CMD = PLAYBACK_TYPE.playCommand;
          var playback = scope.playback = {
            isPlay: playData.getStatus() === PLAY_CMD.PLAY? true : false,
            visibilitySpeedPopup: false,
            reset: function() {
              playback.isPlay = playData.getStatus() === PLAY_CMD.PLAY? true : false;
              playback.visibilitySpeedPopup = false;
              scope.viewMode.mode = defaultViewMode;
              scope.viewMode.icon = defaultViewIcon;
            },
            goPre: function() {
              fullCameraCtrl.playPlayback({"command":PLAY_CMD.PREV});
            },
            goNext : function(){
              fullCameraCtrl.playPlayback({"command":PLAY_CMD.NEXT});
            },
            play: function() {
              $rootScope.$emit('changeLoadingBar', false);
              playback.isPlay = true;
              fullCameraCtrl.playPlayback({"command":PLAY_CMD.PLAY});
            },
            pause: function() {
              playback.isPlay = false;
              fullCameraCtrl.playPlayback({"command":PLAY_CMD.PAUSE});
            },
            goInit: function() {
              fullCameraCtrl.playPlayback({"command":PLAY_CMD.INIT});
            },
            stepForward : function() {
              playback.isPlay = false;
              fullCameraCtrl.playPlayback({"command":PLAY_CMD.STEPFORWARD});
            },
            stepBackward : function() {
              playback.isPlay = false;
              fullCameraCtrl.playPlayback({"command":PLAY_CMD.STEPBACKWARD});
            },
            visibleSearchPopup: function(event) {
                
                event.srcEvent.preventDefault();
                event.srcEvent.stopPropagation();
                
              var successCallback = function(data) {
                fullCameraCtrl.setTimelineView({"timelineView":{
                  'start' :data.startTime, 
                  "end":data.endTime,
                  'date' : new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate())}
                });
                var searchInfo = {
                  'startTime' : data.startTime,
                  'endTime' : data.endTime,
                  'date' : data.date,
                  'eventList' : searchData.getEventTypeList(),
                  'id': searchData.getOverlapId(),
                };
                playbackInterfaceService.requestEventSearch(searchInfo);
              };
              /*
              * If open Search popup, need to stop playback stream.
              */
              playData.setStatus(PLAY_CMD.STOP);
              playData.setDefautPlaySpeed();
              $rootScope.$emit('changeLoadingBar', false);
              ModalManagerService.open(
                'search',
                {
                  'selectedStartTime' : searchedData.startTime,
                  'selectedEndTime' : searchedData.endTime,
                  'selectedData' : searchedData.selectedDate,
                },
                successCallback
              );
            },
            visibleSpeedPopup: function(event) {
              event.srcEvent.preventDefault();
              var openSpeedPopup = function() {
                ModalManagerService.open(
                  'list',
                  { 'buttonCount' : 0, 'list' : playback.getSpeeds(), 'selectedItem': playData.getPlaySpeed()},
                  successCallback
                );
                delayOpenPopup = false;
              };
              var successCallback = function(data){
                scope.playSpeed = data.value
                fullCameraCtrl.setPlaySpeed({"speed":scope.playSpeed});
                waitChangePlaySpeed = true;
                setTimeout(function() {
                  waitChangePlaySpeed = false;
                  if( delayOpenPopup ) {
                    openSpeedPopup();
                  }
                }, 2000);
              };
              if(playData.getStatus() === PLAY_CMD.PLAY){
                if( waitChangePlaySpeed === false) {
                  openSpeedPopup();
                 }
                 else {
                  delayOpenPopup = true;
                 }
              } else {
                $rootScope.$emit('changeLoadingBar', false);
                ModalManagerService.open('message', { 'buttonCount': 0, 'message': "lang_no_video_played" } );
                return;
              }
            },
            getSpeeds: function() {
              var list = [-8,-4,-2,-1,1,2,4,8];
              var listInfo = [];
              for(var i = 0; i < list.length; i++){
                listInfo[i] = { 'name': 'x' + list[i],
                                'value': list[i]
                              };
              }
              return listInfo;
            }
          };

          var viewMode = scope.viewMode = {
            mode : defaultViewMode,
            icon : defaultViewIcon,
            changeMode : function() {
              if( viewMode.mode === 'fit' ) {
                viewMode.mode = 'originalratio';
              }
              else if( viewMode.mode === 'originalratio') {
                viewMode.mode = 'fit';
              }
              viewMode.icon = 'tui tui-ch-live-view-'+ viewMode.mode;
              CameraService.changeViewMode(viewMode.mode);
            }
          };

          scope.playControl.updatePlayIcon = function(enablePlayback) {
            playbackInterfaceService.updatePlayIcon(enablePlayback);
          };

          scope.playControl.reset = function() {
            playback.reset();
          };

          scope.playControl.addBookmark = function() {
            if(scope.addBookmark !== undefined) {
              scope.addBookmark();
            }
          };

          scope.$watch(function(){return playData.getStatus();}, function(newVal, oldVal){
            if( newVal === PLAY_CMD.PLAY ){
              scope.playback.isPlay = true;
            }
            else if( newVal === PLAY_CMD.STOP || newVal === PLAY_CMD.PAUSE || newVal === PLAY_CMD.PLAYPAGE ){
              scope.playback.isPlay = false;
            }
          });

          $rootScope.$saveOn('playStatus', function(event, data){
            if( scope.playback.isPlay !== false && data === 'pause' ){
              scope.playback.isPlay = false;
            }
          }, scope);

          $rootScope.$saveOn('updateTimebar', function(event, data) {
            $timeout(function() {
              scope.displayTime = $filter('date')(data, 'yyyy/MM/dd HH:mm:ss');
            });
          }, scope);
          $rootScope.$saveOn('app/scripts/models/playback/PlayDataModel.js::changeSpeed', function(event, data) {
            if( scope.playSpeed !== data ) {
              scope.playSpeed = data;
              fullCameraCtrl.setPlaySpeed({"speed":scope.playSpeed});
            }
          }, scope);
          $rootScope.$saveOn('app/scripts/services/playbackClass::disableButton', function(event, data) {
            if( scope.disableButton !== data ) {
              scope.disableButton = data;
            }
          }, scope);
          $rootScope.$saveOn('app/script/services/playbackClass/timelineService.js::stepInit', function() {
            if(scope.initStepService !== undefined) {
              scope.initStepService();
            }
          }, scope);
        }
    };
}]);