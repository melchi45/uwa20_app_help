/*global setTimeout, workerManager*/
kindFramework
  .directive('playbackPage', ['$rootScope', '$filter', '$timeout', 'PlaybackInterface',
    'PLAYBACK_TYPE', 'ModalManagerService', 'CameraService', 'playbackStepService',
    'CAMERA_TYPE', 'SearchDataModel', 'PlayDataModel', 'UniversialManagerService',
    'kindStreamInterface', 'CAMERA_STATUS', 'BrowserService', '$compile',
    function($rootScope, $filter, $timeout, PlaybackInterface, PLAYBACK_TYPE,
      ModalManagerService, CameraService, playbackStepService, CAMERA_TYPE,
      SearchDataModel, PlayDataModel, UniversialManagerService, kindStreamInterface,
      CAMERA_STATUS, BrowserService, $compile) {
      "use strict";
      return {
        templateUrl: 'views/livePlayback/directives/playback-page.html',
        scope: {
          'visibilityFullScreen': '=',
          'enablePlayback': '=',
          'changeViewMode': '&',
          'viewMode': '=',
          'viewModeTitle': '=',
          'viewModeIcon': '=',
          'playPlayback': '&',
          'toggleNavOverlay': '&',
          'setPlaySpeed': '&',
          'timelineController': '=',
          'pageController': '=',
          'maxAudioInput': '=',
          'turnOnChannelSelector': '=',
        },
        controller: function($scope) {
          var selectorDirective = null;
          if ($scope.pageController) {
            /**
             * create <live-playback-channel-selector> directives for multi channel
             * @function : channelSelector
             * @param : mode is boolean type.
             */
            $scope.pageController.channelSelector = function(mode) {
              if (mode === true && selectorDirective === null) {
                var childScope = $scope.$new();
                selectorDirective = $compile('<live-playback-channel-selector class="playback-channel-selector"></live-playback-channel-selector>');
                $('#pb-channel-holder').append(selectorDirective(childScope)).append('<div class="cm-vline"></div>');
              } else {
                $('#pb-channel-holder').remove();
              }
            }
          }
        },
        link: function(scope) {
          var searchData = new SearchDataModel();
          var playData = new PlayDataModel();
          var waitChangePlaySpeed = false;
          var delayOpenPopup = false;
          var block = {
            scenario: false,
            browser: false,
          };
          scope.disableButton = false;
          scope.disableSpeedIcon = true;
          scope.disableStepIcon = true;
          scope.disableBackupIcon = true;
          var TIMEOUT = 2000;
          var SPEED_LIST = {'FB8':-8, 'FB4':-4, 'FB2' : -2, 'FB1':-1, 
            'FF1':1, 'FF2':2, 'FF4':4, 'FF8':8};
          var listInfo = [];

          var initPlaySpeedList = function() {
            var list = [SPEED_LIST.FB8, SPEED_LIST.FB4, SPEED_LIST.FB2, SPEED_LIST.FB1, 
              SPEED_LIST.FF1, SPEED_LIST.FF2, SPEED_LIST.FF4, SPEED_LIST.FF8];
            for (var idx = 0; idx < list.length; idx++) {
              listInfo[idx] = {
                'name': 'x' + list[idx],
                'value': list[idx],
                'notAnOption': false,
              };
            }
          };
          initPlaySpeedList();
          var setButtonStatus = function(scenario, browser) {
            block.scenario = scenario;
            block.browser = browser;
            if (block.scenario || block.browser) {
              scope.disableButton = true;
            } else {
              scope.disableButton = false;
            }
          };
          var PLAY_CMD = PLAYBACK_TYPE.playCommand;
          var playback = scope.playback = {
            isPlay: playData.getStatus() === PLAY_CMD.PLAY,
            visibilitySpeedPopup: false,
            play: function() {
              if (scope.disableButton === true) {
                return;
              }
              $rootScope.$emit('changeLoadingBar', false);
              $rootScope.$emit('blockTimebarInputField', true);
              playback.isPlay = scope.disableStepIcon = true;
              scope.playPlayback({
                "command": PLAY_CMD.PLAY,
              });
              $timeout(function() {
                kindStreamInterface.setCanvasStyle(scope.viewMode);
              });
            },
            pause: function() {
              playback.isPlay = scope.disableStepIcon = false;
              $rootScope.$emit('blockTimebarInputField', false);
              scope.playPlayback({
                "command": PLAY_CMD.PAUSE,
              });
            },
            stepForward: function() {
              if (scope.disableStepIcon === true) {
                return;
              }
              playback.isPlay = false;
              $rootScope.$emit('blockTimebarInputField', false);
              $rootScope.$emit('channelPlayer:command', 'step', 'forward');
            },
            stepBackward: function() {
              if (scope.disableStepIcon === true) {
                return;
              }
              playback.isPlay = false;
              $rootScope.$emit('blockTimebarInputField', false);
              $rootScope.$emit('channelPlayer:command', 'step', 'backward');
            },
            visibleSpeedPopup: function(event) {
              event.srcEvent.preventDefault();
              var openSpeedPopup = function() {
                ModalManagerService.open(
                  'list', {
                    'buttonCount': 0,
                    'list': playback.getSpeeds(),
                    'selectedItem': playData.getPlaySpeed()
                  },
                  successCallback
                );
                delayOpenPopup = false;
              };
              var successCallback = function(data) {
                scope.playSpeed = data.value;
                scope.setPlaySpeed({
                  "speed": scope.playSpeed,
                });
                waitChangePlaySpeed = true;
                setTimeout(function() {
                  waitChangePlaySpeed = false;
                  if (delayOpenPopup) {
                    openSpeedPopup();
                  }
                }, TIMEOUT);
              };
              if (playData.getStatus() === PLAY_CMD.PLAY) {
                if (waitChangePlaySpeed === false) {
                  openSpeedPopup();
                } else {
                  delayOpenPopup = true;
                }
              } else {
                $rootScope.$emit('changeLoadingBar', false);
                ModalManagerService.open('message', {
                  'buttonCount': 0,
                  'message': "lang_no_video_played",
                });
                return;
              }
            },
            getSpeeds: function() {
              return listInfo;
            },
            captureScreen: function() {
              if (playData.getStatus() === PLAY_CMD.PLAY) {
                CameraService.captureScreen();
              } else {
                $rootScope.$emit('changeLoadingBar', false);
                ModalManagerService.open('message', {
                  'buttonCount': 0,
                  'message': "lang_no_video_played",
                });
                return;
              }
            },
            backup: function() {
              if (scope.disableBackupIcon === true) {
                return;
              }
              scope.timelineController.changeTimelineMode(1);
              setButtonStatus(true, block.browser);
            },
            changeSpeaker: function() {
              if (UniversialManagerService.isSpeakerOn()) {
                changeSpeakerStatus(false);
              } else {
                changeSpeakerStatus(true);
              }
            },
            speakerStatus: false,
            speakerVolumn: 0,
          };

          scope.selectSpeedList = playback.getSpeeds();
          scope.playback.speed = SPEED_LIST.FF1;

          scope.selectSpeedChanged = function() {
            scope.setPlaySpeed({
              "speed": scope.playback.speed,
            });
            waitChangePlaySpeed = true;
            scope.disableSpeedIcon = true;
            setTimeout(function() {
              scope.disableSpeedIcon = false;
            }, TIMEOUT);
          };

          if (scope.pageController) {
            scope.pageController.closePlayback = function() {
              console.log("_______close playback");

              UniversialManagerService.setPlayMode(CAMERA_STATUS.PLAY_MODE.LIVE);
              scope.timelineController.destroy();
              playData.setDefautPlaySpeed();
              playData.setPlaybackEnable(false);
              searchData.setRefreshHoldValues();
              if (UniversialManagerService.isSpeakerOn()) {
                changeSpeakerStatus(false);
              }
            };
          }

          var changeSpeakerStatus = function(status, volumn) {
            if (typeof status !== "undefined" && status !== null) {
              scope.playback.speakerStatus = status;
              speakerSlider.slider("option", "disabled", !status);
              UniversialManagerService.setSpeakerOn(status);
              $rootScope.$emit('channelPlayer:command', 'speakerStatus', status);
            }
            if (typeof volumn !== "undefined") {
              scope.playback.speakerVolumn = volumn;
              UniversialManagerService.setSpeakerVol(volumn);
              $rootScope.$emit('channelPlayer:command', 'speakerVolume', volumn);
            }
          };
          var speakerSlider = null;

          $timeout(function() {
            speakerSlider = $("#cm-speaker-slider div");
            speakerSlider.slider({
              orientation: "horizontal",
              range: "min",
              min: 0,
              max: 5,
              step: 1,
              value: 0,
              disabled: true,
              slide: function(event, ui) {
                scope.$apply(function() {
                  if (UniversialManagerService.isSpeakerOn()) {
                    changeSpeakerStatus(null, ui.value);
                  }
                });
              },
              stop: function(event, ui) {
                /*if(!$scope.profileInfo.AudioInputEnable){
                  console.log("AudioInput is disabled.");
                  return;
                }*/

                scope.$apply(function() {
                  scope.playback.speakerVolumn = ui.value;
                });
              },
            });
          });

          var rearrangeSpeed = function() {
            var lastIndexPoint = listInfo.length - 1;
            if (scope.playback.speed === listInfo[0].value) {
              scope.playback.speed = listInfo[1].value;
              scope.selectSpeedChanged();
            } else if (scope.playback.speed === listInfo[lastIndexPoint].value) {
              scope.playback.speed = listInfo[lastIndexPoint - 1].value;
              scope.selectSpeedChanged();
            }
          };

          var watchStatus = scope.$watch(function() {
            return playData.getStatus();
          }, function(newVal) {
            if (newVal === PLAY_CMD.PLAY) {
              scope.playback.isPlay = scope.disableStepIcon = true;
              scope.disableSpeedIcon = false;
            } else if (newVal === PLAY_CMD.STOP || newVal === PLAY_CMD.PAUSE || newVal === PLAY_CMD.PLAYPAGE) {
              scope.playback.isPlay = scope.disableStepIcon = false;
              if (newVal === PLAY_CMD.STOP || newVal === PLAY_CMD.PLAYPAGE) {
                scope.disableSpeedIcon = true;
                scope.disableStepIcon = true;
              } else if (newVal === PLAY_CMD.PAUSE) {
                scope.disableSpeedIcon = true;
              }
            }
          });

          $rootScope.$saveOn('playStatus', function(event, data) {
            if (scope.playback.isPlay !== false && data === 'pause') {
              scope.playback.isPlay = scope.disableStepIcon = false;
            }
          }, scope);

          $rootScope.$saveOn('app/scripts/services/playbackClass/PlaybackInterface.js::limitSpeed',
            function(event, isLimitSpeed) {
              var lastIndexPoint = listInfo.length - 1;
              if (isLimitSpeed === true) {
                /**-8x, 8x not supported */
                listInfo[0].notAnOption = true;
                listInfo[lastIndexPoint].notAnOption = true;
                rearrangeSpeed();
              } else {
                listInfo[0].notAnOption = false;
                listInfo[lastIndexPoint].notAnOption = false;
              }
            }, scope);

          var watchStepStatus = scope.$watch(function() {
            return playbackStepService.getSettingFlag();
          }, function(newVal, oldVal) {
            if (newVal !== oldVal) {
              scope.disableStepIcon = scope.playback.isPlay;
            }
          });

          $rootScope.$saveOn('app/scripts/directives/channelPlayer.js:step', function(event, data) {
            scope.playPlayback((data === "forward" ? {
              "command": PLAY_CMD.STEPFORWARD,
            } : {
              "command": PLAY_CMD.STEPBACKWARD,
            }));
          }, scope);

          $rootScope.$saveOn('app/scripts/services/playbackClass::disableButton', function(event, data) {
            if (block.scenario !== data) {
              setButtonStatus(data, block.browser);
            }
          }, scope);

          $rootScope.$saveOn('app/scripts/directives/channelPlayer.js:disablePlayback', function(event, data) {
            if (data === true) {
              setButtonStatus(block.scenario, true);
              scope.disableBackupIcon = true;
            } else {
              setButtonStatus(block.scenario, false);
            }
          }, scope);

          $rootScope.$saveOn('app/script/services/playbackClass/timelineService.js::stepInit', function() {
            //workerManager.videoBuffering();
            kindStreamInterface.controlWorker({
              'channelId': 0,
              'cmd': 'videoBuffering',
              'data': [],
            });

            if (typeof scope.initStepService !== "undefined") {
              scope.initStepService();
            }
          }, scope);

          $rootScope.$saveOn('app/scripts/models/playback/PlayDataModel.js::changeSpeed', function(event, data) {
            if (data !== scope.playback.speed) {
              scope.playback.speed = data;
            }
          }, scope);

          /**
           * If there is no any recording data, then disabled backup icon
           */
          $rootScope.$saveOn('app/scripts/directives/timeline.js::timelineDataCount', function(event, data) {
            if (block.browser === true) {
              return;
            }
            if (data > 0) {
              scope.disableBackupIcon = false;
              if (UniversialManagerService.getStreamingMode() === CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE &&
                typeof(document.createElement('a').download) === "undefined") {
                scope.disableBackupIcon = true;
              }
            } else {
              scope.disableBackupIcon = true;
            }
          }, scope);

          scope.$on('$destroy', function() {
            watchStatus();
            watchStepStatus();
          });

          scope.openFullscreenButton = function(event) {
            event.fullButton = true;
            $rootScope.$emit('channelContainer:openFullscreenButton', event);
          };

          scope.closeFullscreenButton = function(event) {
            event.fullButton = true;
            $rootScope.$emit('fullCamera:closeFullscreenButton', event);
          };

          scope.showMenuContent = true;
          scope.toggleShowMenuContent = function() {
            scope.showMenuContent = !scope.showMenuContent;
            console.log(scope.showMenuContent);

            if (scope.showMenuContent === true) {
              angular.element('#cm-video').removeClass('smaller');
            } else {
              angular.element('#cm-video').addClass('smaller');
            }

            kindStreamInterface.setCanvasStyle(scope.viewMode, scope.showMenuContent);
          };
        },
      };
    },
  ]);