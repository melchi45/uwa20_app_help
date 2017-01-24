/*global cordova, clearTimeout, setTimeout*/
kindFramework.directive('fullCamera', ['$q', 'DisplayService',
  'CAMERA_TYPE', 'PLAYBACK_TYPE','PTZ_TYPE','UniversialManagerService', 
  'CAMERA_STATUS', '$rootScope', '$timeout','PlayDataModel','PTZContorlService', 'kindStreamInterface',
function($q, DisplayService,CAMERA_TYPE,PLAYBACK_TYPE,PTZ_TYPE,
  UniversialManagerService, CAMERA_STATUS, $rootScope, $timeout,
  PlayDataModel, PTZContorlService, kindStreamInterface) {
  'use strict';
  return {
    restrict: 'E',
    replace: 'true',
    scope: {
      'visibility': '=',
      'enablePlayback': '@',
      'profileInfo': '=',
      'toggleNavOverlay': '&',
      'playPlayback':'&',
      'setPlaySpeed':'&',
      'setTimelineView' :'&',
      'playSpeed' :'=',
      'isLoading' : '='
    },
    templateUrl: 'views/livePlayback/directives/full-camera.html',
    controller: function($scope) {
      $scope.B2CProfileList = [{'Name': 'High'}, {'Name' : 'Middle'}, {'Name': 'Low'}];
      this.playPlayback = function(command){
        var results = $scope.playPlayback(command);
        var PLAY_CMD = PLAYBACK_TYPE.playCommand;
        if(command.command === PLAY_CMD.PLAY) {
          if( isPhone || isPhone === false && results !== null )
            $scope.domControls.hiddenFunctions();
        }
      };
      this.setPlaySpeed = function(speed) {
        $scope.setPlaySpeed(speed);
        $scope.playSpeed = speed.speed;
      };
      this.setTimelineView = function(timelineView) {
        $scope.setTimelineView(timelineView);
      };
      $scope.optionServiceType = ['WEB_SSM', 'WEB_IPOLIS', 'MOBILE_B2C', 'MOBILE_B2B'];
      $scope.connectedService = $scope.optionServiceType[UniversialManagerService.getServiceType()];    
      $scope.ptzKeepDzoom = false;
      $scope.ptzKeepAzoom = false;
    },
    link: function(scope, element, attrs) {
      scope.playControl = {};
      scope.ptzControl = {};
      scope.digitalZoom = {};
      
      var currentDate = null;
      var visibleCameraFunctions = function() {
       scope.toggleNavOverlay({val:true});
        domControls.visibilityPlaybackControl = false;
        domControls.visibilityFullScreenFuntions = true;
        domControls.visibilityDetailSlides = false;
      };
      var visiblePlaybackFunctions = function() {
       scope.toggleNavOverlay({val:true});
        domControls.visibilityFullScreenFuntions = false;
        domControls.visibilityPlaybackControl = true;
        scope.digitalZoom.visibility = false;
        var playData = new PlayDataModel();
        playData.setTimelineEnable(true);
      };

      var domControls = scope.domControls = {
        visibilityFullScreenFuntions: false,
        visibilityPlaybackControl: false,
        visibilityDetailSlides: false,
        resetUI: function() {
          domControls.visibilityDetailSlides = false;
        },
        closeScreen: function() {

          var playData = new PlayDataModel();
          var display = new DisplayService();
          display.closeFullScreen();
          playData.setCurrentMenu('main');
          scope.visibility = false;
          domControls.resetUI();
          if( scope.playControl.updatePlayIcon !== undefined ) {
            scope.playControl.updatePlayIcon(scope.enablePlayback==='true'? true : false);
          }
          UniversialManagerService.setViewMode(CAMERA_STATUS.VIEW_MODE.CHANNEL);
          scope.closeFullScreen();
          if(PTZContorlService.getManualTrackingMode() === "True") {
            PTZContorlService.setManualTrackingMode("False");
          }
          if(PTZContorlService.getAutoTrackingMode() === "True") {
            PTZContorlService.setAutoTrackingMode("False");
          }

          $timeout(function(){
            $rootScope.$emit('channel:reloadStreaming');
            $rootScope.$emit('BaseChannel:resetViewMode');
            kindStreamInterface.setCanvasStyle('originalratio');

            if($("#live-ptz").length){
              var dis = $("#live-ptz").css("display");
              if(dis !== "none") {
                $rootScope.$emit('channel:setLivePTZControl', true);
              }
            }
          });
        },
        visibleFunctions: function() {
          if(scope.enablePlayback === 'true') {
            visiblePlaybackFunctions();
          }
          else {
            if(scope.digitalZoom.mouseMoveCheck) {
              scope.digitalZoom.mouseMoveCheck = false;
              // return;
            }
            if(scope.ptzControl.ptzControlMode) {
              if(scope.ptzControl.ptzAreaZoomMode){
                return;
              }
              if(PTZContorlService.getManualTrackingMode() === "False") {
                scope.ptzControl.ptzMenuVisibility = !scope.ptzControl.ptzMenuVisibility;
              }
            }else {
              visibleCameraFunctions();
            }     
          }
        },
        hiddenFunctions: function() {
          var playData = new PlayDataModel();
         scope.toggleNavOverlay({val:false});
          domControls.visibilityFullScreenFuntions = false;
          domControls.visibilityPlaybackControl = false;
          domControls.resetUI();
          if( playData.getCurrentMenu() === 'main' ) {
            playData.setTimelineEnable(true);
          } else {
            playData.setTimelineEnable(false);
          }
        },
        showBackScreen: function() {
          return domControls.visibilityFullScreenFuntions || domControls.visibilityPlaybackControl;
        },
      };
			
			$rootScope.$saveOn(
				"app/scripts/directives/fullCamera.js::hiddenFunctions",
				domControls.hiddenFunctions, 
				scope
			);
      var actions = scope.actions = {
        zoomModeChange: function() {
          if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM) {
            UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ);
          } 
          else if(UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ)
          {
            UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM);
          }
        },
      };

      
     var touchAction;
     var lastTouchData;
     var TOUCH_TIME_INTERVAL = 400;
      scope.fullCameraTapEvent = function(event) {
				console.log("kind fullCameraTapEvent");
        if(event.changedPointers[0].target.id === "full-screen-channel" ||
            event.changedPointers[0].target.id === "playback-controls" ||
            event.changedPointers[0].target.id === "full-screen-block") {

        if(angular.element('.side-nav-wrapper').hasClass('nav-opened')) {
          $rootScope.$emit("toggleNavOpened", false);
          return;
        }
        scope.toggleNavOverlay({val:true});
         var now = event.timeStamp;
         var delta = now - lastTouchData;
         if(touchAction !== null) clearTimeout(touchAction);
           lastTouchData = now;
					console.log("tap setTimeout");
           touchAction = setTimeout(function(e){
               clearTimeout(touchAction);
               touchAction = null;
                if(domControls.visibilityFullScreenFuntions || domControls.visibilityPlaybackControl) {
                  domControls.hiddenFunctions();
                } else {
                  domControls.visibleFunctions();
                }
                $timeout(function() {
                  scope.$apply();
                });
                console.log("tap");
            }, TOUCH_TIME_INTERVAL, [event]);
          lastTouchData = now;
        }

        if(event.changedPointers[0].target.id === "full-screen-channel") {
          if(scope.ptzControl.ptzControlMode) {
            if(PTZContorlService.getManualTrackingMode() === "True") {
              var canvas = document.querySelector(".kind-stream-canvas");
              var xPos = event.changedPointers[0].clientX;
              var yPos = event.changedPointers[0].clientY;
              xPos = xPos - canvas.offsetLeft;
              yPos = yPos - canvas.offsetTop;
              if(xPos < 0 || yPos < 0 || xPos > canvas.offsetWidth || yPos > canvas.offsetHeight) { // out of frame
                return;
              } else {
                var rotate = UniversialManagerService.getRotate();
                if(rotate === '90' || rotate === '270') {
                  xPos = Math.ceil(xPos*(10000 / canvas.offsetHeight));
                  yPos = Math.ceil(yPos*(10000 / canvas.offsetWidth));
                } else {
                  xPos = Math.ceil(xPos*(10000 / canvas.offsetWidth));
                  yPos = Math.ceil(yPos*(10000 / canvas.offsetHeight));
                }
                PTZContorlService.execute([xPos, yPos]);
              }
            }
          }
        }
      };

      scope.fullCameraDoubleTouchEvent = function(event) {
        if(event.target.id === "full-screen-channel" ||
            event.target.id === "playback-controls" ||
            event.target.id === "full-screen-block" ||
            typeof event.fullButton !== undefined) {
            scope.ptzControl.ptzMenuVisibility = false;
            scope.ptzControl.ptzControlMode = false;
					
          closeFullScreen();

          console.log("double tap");
					if(touchAction !== null){
						console.log("tap clearTimeout");
						clearTimeout(touchAction);
					}
        }
      };

      $rootScope.$saveOn("fullCamera:closeFullscreenButton", function(event, e) {
        $timeout(function(){
          if (scope.ptzControl.ptzControlMode === true) {
            scope.ptzControl.closePTZMode();
          }
          scope.toggleNavOverlay({
            val: false
          });
          domControls.closeScreen();
          scope.fullSize = scope.windowSize;
          scope.windowSize = undefined;
        });
      }, scope);

      function closeFullScreen(){
        scope.$broadcast('closeDetailMenu');
        domControls.closeScreen();

        $timeout(function(){
          $rootScope.$emit("resize channels-wrapper in channelsWrapper.js");
        });
      }

      /**
       * 플러그인에서 Full screen 닫기를 접근 하기 위해 bind을 해준다.
       * @example
       *   $("#full-screen-channel").trigger("closefullscreen");
       */
      $timeout(function(){
        $("#full-screen-channel").bind("closefullscreen", closeFullScreen);
      });

      scope.$watch(function() { return scope.visibility; },
        function() {
          if(scope.visibility) {
            domControls.visibleFunctions();
            currentDate = new Date();
            $timeout(function() {
              scope.$apply();
            });
          }  else {
            domControls.resetUI();
            if( typeof (scope.ptzControl.stopAreaZoom) !== "undefined") {
              scope.ptzControl.stopAreaZoom();
            }
            if( typeof(scope.playControl.reset) !== "undefined") {
              scope.playControl.reset();
            }
          }
      });

      function resizeHandler(event) {
        if(!scope.visibility) return;
        
        // if(scope.windowSize !== undefined) {
          // if(scope.windowSize > window.innerWidth * window.innerHeight) {
            if(UniversialManagerService.getIsCaptured() && !!window.chrome && !!window.chrome.webstore) { // check if full screen closed by capture and if chrome
              scope.afterActionCapture();
              return;
            }
            /**
             * 아래 부터는 Full Screen 에서 Detail View로 이동할 때
             * 실행되는 로직이다.
             */
            event.stopPropagation();

            /**
             * window.onresize 시에는 $digest가 되지 않아
             * scope가 view에 반영이 되지 않은 이슈가 있다.
             * $scope.$apply()는 에러가 발생할 수 있는 리스트가 있기 때문에
             * $timeout을 통해서 $digest를 한다.
             */

            $timeout(function(){
              if (scope.ptzControl.ptzControlMode === true) {
                scope.ptzControl.closePTZMode();
              }
              scope.toggleNavOverlay({
                val: false
              });
              domControls.closeScreen();
              scope.fullSize = scope.windowSize;
              scope.windowSize = undefined;
            });
          // }
        // }
      }
      
      $rootScope.$saveOn('fullscreenOpened', function(event, args) {
        scope.maxWidth = args[0];
        scope.maxHeight = args[1];

        scope.windowSize = window.innerWidth * window.innerHeight; // save full screen size
      });

      $(window).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function(evt) {
          var state = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement;
          if(!state){
            resizeHandler(evt);
          }
      });
    },
  };
}]);