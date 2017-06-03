/*global kindStreamModule, clearTimeout, setTimeout, presetSetupControl*/
kindFramework.directive('liveFunctions', ['Attributes', 'CameraService', 'PTZ_TYPE', 'CAMERA_STATUS',
  'UniversialManagerService', '$timeout', 'AccountService', 'ModalManagerService', '$rootScope',
  'ExtendLiveFunctionsService', 'DigitalPTZContorlService', '$translate',
  function(Attributes, CameraService, PTZ_TYPE, CAMERA_STATUS,
    UniversialManagerService, $timeout, AccountService, ModalManagerService, $rootScope,
    ExtendLiveFunctionsService, DigitalPTZContorlService, $translate) {
    'use strict';
    return {
      templateUrl: 'views/livePlayback/directives/fullcamera/live-functions.html',
      require: '^fullCamera',
      scope: {
        'isLoading': '=',
      },
      link: function(scope, element, attributes) {
        var ServiceTypeList = ['WEB_SSM', 'WEB_IPOLIS', 'MOBILE_B2C', 'MOBILE_B2B'];
        var ClientServiceType = UniversialManagerService.getServiceType();
        scope.connectedService = ServiceTypeList[ClientServiceType];
        scope.visibilityDetailMenu = false;
        scope.functionSlide = {
          'option': {
            nowrap: true,
          },
          'slides': [],
          'style': {
            'width': '20%',
          },
        };

        var clickButton = function(event) {
          if (navigator.appVersion.indexOf('Mac') > 0) {
            return;
          }
          var target = event.target;
          if (target.nodeName !== "BUTTON") {
            target = target.parentNode;
          }

          target = $(target);
          var className = 'button-clicked';
          if (!target.hasClass(className)) {
            target.addClass(className);

            $timeout(function() {
              target.removeClass(className);
            }, 200);
          }
        };
        // scope.viewMode = 'fit'; //'fit', 'originalratio', 'originalsize'
        // scope.viewModeicon = 'tui-ch-live-view-' + scope.viewMode;
        var sunapiAttributes = Attributes.get();
        var functionslides = {
          '0': [{
              'label': 'Capture',
              'action': function(event) {
                clickButton(event);
                CameraService.captureScreen();
              },
              'class': 'tui-ch-live-capture',
              'show': true,
            },
            {
              'label': 'Audio listen',
              'action': function(event) {
                clickButton(event);
              },
              'class': 'tui-audio-detection',
              'show': true,
            },
            {
              'label': 'Favorite',
              'action': function(event) {
                clickButton(event);
              },
              'class': 'tui-favorite',
              'show': true,
            },
            {
              'label': 'Preset',
              'action': function(event) {
                CameraService.PresetList();
              },
              'class': 'tui-ch-live-preset',
              'show': true,
            },
            {
              'label': 'Flip mirror',
              'action': function(event) {
                clickButton(event);
                CameraService.flipMirror();
              },
              'class': 'tui-ch-live-flip',
              'show': true,
            },
            {
              'label': 'Near',
              'action': function(event) {
                clickButton(event);
                //presetSetupControl.startMakePreset();
              },
              'class': 'tui-near',
              'show': true,
            },
            {
              'label': 'Far',
              'action': function(event) {
                clickButton(event);
              },
              'class': 'tui-far',
              'show': true,
            },
            {
              'label': 'Information',
              'action': function(event) {
                clickButton(event);
                CameraService.channelInfo();
              },
              'class': 'tui-ch-live-info',
              'show': true,
            },
          ],
          '1': [{
              'label': 'lang_profile', // 1. 프로파일
              'action': function(event) {
                clickButton(event);
                CameraService.getProfileList();
              },
              'class': 'tui-profile',
              'show': true,
            },
            {
              'label': 'lang_capture', // 2. 캡춰
              'action': function(event) {
                clickButton(event);
                CameraService.captureScreen();
              },
              'class': 'tui-ch-live-capture',
              'show': true,
            },
            {
              'label': 'lang_PTZ', // 3. PTZ
              'action': function(event) {
                clickButton(event);
                changeZoomMode();
              },
              'class': 'tui-ptz',
              'show': AccountService.isPTZAble() || (sunapiAttributes.profileBasedDPTZ && (UniversialManagerService.getUserId() === 'admin')),
            },
            {
              'label': 'lang_preset',
              'class': 'tui-ch-live-ptz-preset',
              'action': function(event) {
                clickButton(event);
                DigitalPTZContorlService.getSettingList(presetListCallback, 'preset');
              },
              // 'show': sunapiAttributes.isDigitalPTZ && UniversialManagerService.getZoomMode() === CAMERA_STATUS.ZOOM_MODE.DIGITZL_PTZ,
              'show': false,
            },
            {
              'label': 'lang_group',
              'class': 'tui-ch-live-ptz-group',
              'action': function(event) {
                clickButton(event);
                DigitalPTZContorlService.getSettingList(groupListCallback, 'group');
              },
              // 'show': sunapiAttributes.isDigitalPTZ && UniversialManagerService.getZoomMode() === CAMERA_STATUS.ZOOM_MODE.DIGITZL_PTZ,
              'show': false,
            },
            {
              'label': 'lang_digital_auto_tracking', // 3. PTZ
              'action': function(event) {
                clickButton(event);
                CameraService.digitalAutoTracking();
              },
              'class': 'tui tui-ch-live-ptz-tracking-auto',
              'show': ((sunapiAttributes.DigitalAutoTrackingOptions !== undefined) && (UniversialManagerService.getUserId() === 'admin')),
            },
            {
              'label': 'lang_alarmOutput', // 4. 알람아웃 on/off
              'action': function(event) {
                clickButton(event);
                CameraService.alarmOut();
              },
              'class': 'tui-alarm-output',
              'show': (AccountService.isAlarmOutputAble() === true),
            },
            {
              'label': 'lang_audio', // 5. 스피커 volume
              'action': function(event) {
                clickButton(event);
                CameraService.speaker();
              },
              'class': 'tui-speaker',
              'show': (AccountService.isAudioInAble() === true),
            },
            {
              'label': 'Mic', //6. 마이크 volume
              'action': function(event) {
                clickButton(event);
                CameraService.mic();
              },
              'class': 'tui-mic',
              'show': (AccountService.isAudioOutAble() === true),
            }
            /*,
                              {
                                'label': 'lang_mode', //7. 영상 mode
                                'action': function(event) {
            											clickButton(event);
            											
                                  if (scope.viewMode == 'fit'){
            												scope.viewMode = 'originalratio';
            											}else if(scope.viewMode == 'originalratio'){
            												scope.viewMode = 'fit';
            											}
            											
            											var target = event.target;
            											if(target.tagName === "BUTTON"){
            												target = target.querySelector('i');
            											}
            											target.className = 'tui tui-ch-live-view-' + scope.viewMode;
            											
                                  CameraService.changeViewMode(scope.viewMode);
                                },
                                'class': 'tui-ch-live-view-fit',
                                'show': true,
                              },*/
          ],
          '2': [{
              'label': 'PTZ', // 3. PTZ
              'action': function(event) {
                event.preventDefault();
                if (UniversialManagerService.getPlayStatus() !== CAMERA_STATUS.PLAY_STATUS.PLAYING) {
                  ModalManagerService.open('message', {
                    'buttonCount': 0,
                    'message': "lang_appNotRunning"
                  });
                  return;
                }
                clickButton(event);
                CameraService.toggleZoomMode();
                var INDEX_SLIDE_PTZ = 0;
                togglePTZSlide(
                  functionslides[ClientServiceType],
                  INDEX_SLIDE_PTZ
                );
                lineUpFunctions(functionslides[CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE]);
              },
              'class': 'tui-ptz',
              'show': true,
            },
            {
              'label': 'Preset',
              'action': function(event) {
                event.preventDefault();
                if (UniversialManagerService.getPlayStatus() !== CAMERA_STATUS.PLAY_STATUS.PLAYING) {
                  ModalManagerService.open('message', {
                    'buttonCount': 0,
                    'message': "lang_appNotRunning"
                  });
                  return;
                }
                clickButton(event);
                CameraService.PresetList();
              },
              'class': 'tui-ch-live-preset',
              'show': true,
            },
            {
              'label': 'Capture',
              'action': function(event) {
                clickButton(event);
                event.preventDefault();
                CameraService.captureScreen();
              },
              'class': 'tui-ch-live-capture',
              'show': true,
            },
            {
              'label': 'Profile',
              'action': function(event) {
                clickButton(event);
                event.preventDefault();
                CameraService.b2cProfileList();
              },
              'class': 'tui-profile',
              'show': true,
            },
            {
              'label': 'Live setup',
              'action': function(event) {
                clickButton(event);
                event.preventDefault();
                lineUpFunctions(functionslidesDetails[ClientServiceType]);
                scope.visibilityDetailMenu = true;
              },
              'class': 'tui-setup',
              'show': true,
            },
          ],
          '3': [{
              'label': 'Capture',
              'action': function(event) {
                clickButton(event);
                CameraService.captureScreen();
                event.preventDefault();
              },
              'class': 'tui-ch-live-capture',
              'show': true,
            },
            {
              'label': 'Flip mirror',
              'action': function(event) {
                clickButton(event);
                CameraService.flipMirror();
                event.preventDefault();
              },
              'class': 'tui-ch-live-flip',
              'show': true,
            },
            {
              'label': 'Profile',
              'action': function(event) {
                clickButton(event);
                CameraService.cameraInfo();
                event.preventDefault();
              },
              'class': 'tui-profile',
              'show': true,
            },
            {
              'label': 'Ratio',
              'action': function(event) {
                clickButton(event);
                var INDEX_SLIDE_RATIO = 3;
                CameraService.aspectFit();
                toggleRatioSlide(
                  functionslides[CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE],
                  INDEX_SLIDE_RATIO
                );
                lineUpFunctions(functionslides[CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE]);
              },
              'class': 'tui-ch-live-view-originalratio',
              'show': true,
            },
            {
              'label': 'PTZ', // 3. PTZ
              'action': function(event) {
                clickButton(event);
                event.preventDefault();
                lineUpFunctions(functionslidesDetails[ClientServiceType]);
                scope.visibilityDetailMenu = true;
                ExtendLiveFunctionsService.setPTZMode(true);
              },
              'class': 'tui-ptz',
              'show': true,
            },
          ]
        };

        var functionslidesDetails = {
          '2': [{
              'label': 'Flip mirror',
              'action': function(event) {
                clickButton(event);
                event.preventDefault();
                CameraService.flipMirror();
              },
              'class': 'tui-ch-live-flip',
              'show': true,
            },
            {
              'label': 'Ratio',
              'action': function(event) {
                clickButton(event);
                event.preventDefault();
                var INDEX_SLIDE_RATIO = 1;
                if (UniversialManagerService.getPlayStatus() !== CAMERA_STATUS.PLAY_STATUS.PLAYING) {
                  ModalManagerService.open('message', {
                    'buttonCount': 0,
                    'message': "lang_appNotRunning"
                  });
                  return;
                }
                CameraService.aspectFit();
                toggleRatioSlide(
                  functionslidesDetails[CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE],
                  INDEX_SLIDE_RATIO
                );
                lineUpFunctions(functionslidesDetails[CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE]);
              },
              'class': 'tui-ch-live-view-originalratio',
              'show': true,
            },
          ],
          '3': [{
              'label': 'Preset',
              'action': function(event) {
                clickButton(event);
                CameraService.PresetList();
              },
              'class': 'tui-ch-live-preset',
              'show': true,
            },
            {
              'label': 'Alarm out',
              'action': function(event) {
                clickButton(event);
                CameraService.alarmOut();
              },
              'class': 'tui-alarm-output',
              'show': true,
            },
          ]

        };
        var changeToDigitalZoom = function() {

        }

        var changeToPTZ = function() {
          zoomMode = "PTZ";
        };

        var changeToDPTZ = function() {
          zoomMode = "Digital PTZ";
          $timeout(function() {
            $scope.$apply();
          });
        };

        var changeZoomMode = function() {
          var zoomMode = null;

          switch (UniversialManagerService.getZoomMode()) {
            case CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM:
              zoomMode = "Digital Zoom";
              break;
            case CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ:
              zoomMode = "PTZ";
              break;
            case CAMERA_STATUS.ZOOM_MODE.DIGITZL_PTZ:
              zoomMode = "Digital PTZ";
              break;
          }

          var successCallback = function(_zoomMode) {
            switch (_zoomMode) {
              case "Digital Zoom":
                UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM);
                $rootScope.$emit('app/scripts/directives/fullcamera/viewFunctions.js::toggleNavigation', true);
                resetDPTZMenu();
                DigitalPTZContorlService.setIsOn(false);
                break;
              case "PTZ":
                UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ);
                $rootScope.$emit('app/scripts/directives/fullcamera/viewFunctions.js::ptz', true);
                break;
              case "Digital PTZ":
                UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.DIGITZL_PTZ);
                $rootScope.$emit('app/scripts/directives/fullcamera/viewFunctions.js::toggleNavigation', false);
                if (sunapiAttributes.FisheyeLens === true) {
                  resetDPTZMenu();
                  DigitalPTZContorlService.setIsOn(true);
                }
                break;
            }
          };
          ModalManagerService.open(
            'ptzmode', {
              'zoomMode': zoomMode
            },
            successCallback
          );
        }

        function resetDPTZMenu() {
          if (UniversialManagerService.getZoomMode() === CAMERA_STATUS.ZOOM_MODE.DIGITZL_PTZ) {
            setFunctionSlideShow(functionslides[ClientServiceType], 3, true);
            setFunctionSlideShow(functionslides[ClientServiceType], 4, true);
            lineUpFunctions(functionslides[ClientServiceType]);
          } else {
            setFunctionSlideShow(functionslides[ClientServiceType], 3, false);
            setFunctionSlideShow(functionslides[ClientServiceType], 4, false);
            lineUpFunctions(functionslides[ClientServiceType]);
          }
          if (DigitalPTZContorlService.getIsOn() !== null) {
            DigitalPTZContorlService.removeDot();
            DigitalPTZContorlService.runDPTZ('stopSequenceAll');
            DigitalPTZContorlService.removeBtn(null, 'all');
          }
        }

        var setFunctionSlideShow = function(slide, index, value) {
          slide[index].show = value;
        };

        var toggleRatioSlide = function(slide, index) {
          if (slide[index].label === 'Ratio') {
            slide[index].label = 'OriginalSize';
            slide[index].class = 'tui-ch-live-view-originalsize';
          } else if (slide[index].label === 'OriginalSize') {
            slide[index].label = 'Ratio';
            slide[index].class = 'tui-ch-live-view-originalratio';
          }
          $timeout(function() {
            scope.$apply();
          });
        };

        var togglePTZSlide = function(slide, index) {
          if (slide[index].label === 'PTZ') {
            slide[index].label = 'DigitalZoom';
            slide[index].class = 'tui-ch-live-digitalzoom';
          } else if (slide[index].label === 'DigitalZoom') {
            slide[index].label = 'PTZ';
            slide[index].class = 'tui-ptz';
          }
          $timeout(function() {
            scope.$apply();
          });
        };

        var lineUpFunctions = function(functionsList) {
          $timeout(function() {
            scope.$apply(function() {
              var MAXIMUM_COUNT_ICON_SLIDES;
              var slideIndex, slideCount, itemCount, totalItemCount;
              if (scope.functionSlide.slides === undefined) {
                scope.functionSlide.slides = [];
              }

              if (isPhone) {
                MAXIMUM_COUNT_ICON_SLIDES = 4;
              } else {
                MAXIMUM_COUNT_ICON_SLIDES = 8;
              }

              for (var itemIndex = 0, slideIndex = 0, totalItemCount = 0; itemIndex < functionsList.length; slideIndex++) {
                if (scope.functionSlide.slides[slideIndex] === undefined) {
                  scope.functionSlide.slides[slideIndex] = [];
                }

                for (itemCount = 0;
                  (itemCount < functionsList.length) && (itemIndex < functionsList.length) && (itemCount < MAXIMUM_COUNT_ICON_SLIDES); itemIndex++) {
                  if (functionsList[itemIndex].show === true) {
                    if (scope.functionSlide.slides[slideIndex][itemCount] === undefined) {
                      scope.functionSlide.slides[slideIndex][itemCount] = [];
                    }

                    scope.functionSlide.slides[slideIndex][itemCount] = angular.copy(functionsList[itemIndex]);
                    itemCount++;
                    totalItemCount++;
                  }
                }
                scope.functionSlide.slides[slideIndex].splice(itemCount, scope.functionSlide.slides[slideIndex].length - itemCount);
              }

              slideCount = Math.ceil(totalItemCount / MAXIMUM_COUNT_ICON_SLIDES);

              scope.functionSlide.slides.splice(slideCount, scope.functionSlide.slides.length - slideCount);

              if (sunapiAttributes.PTZModel === true) {
                if (scope.functionSlide.slides[0] !== undefined && scope.functionSlide.slides[0][3] !== undefined) {
                  scope.functionSlide.slides[0][4] = scope.functionSlide.slides[0][3];
                  scope.functionSlide.slides[0][3] = {
                    label: "PTZ Control",
                    action: function() {
                      var dis = $("#live-ptz").css("display");
                      if (dis === "none") {
                        $rootScope.$emit('channel:setLivePTZControl', true);
                      } else {
                        $rootScope.$emit('channel:setLivePTZControl', false);
                      }
                    },
                    class: "tui-ptz live-ptz_icon-2",
                    show: true
                  };
                }
              }

              scope.functionSlide.style.width = 1 / scope.functionSlide.slides[0].length * 100 + '%';
            });
          });
        };

        scope.closeDetailMenu = function() {
          lineUpFunctions(functionslides[ClientServiceType]);
          scope.visibilityDetailMenu = false;

          if (ExtendLiveFunctionsService.getPTZMode()) {
            ExtendLiveFunctionsService.setPTZMode(false);
            var INDEX_SLIDE_PTZ = 0;
            togglePTZSlide(
              functionslides[ClientServiceType],
              INDEX_SLIDE_PTZ
            );
          }
        };

        var resetOrientation = function() {
          if (angular.element(document).width() > angular.element(document).height()) {
            UniversialManagerService.setOrientation(CAMERA_STATUS.ORIENTATION.LANDSCAPE);
            switch (UniversialManagerService.getServiceType()) {
              case CAMERA_STATUS.WEB_APP_TYPE.SSM_MOBILE:
                break;
              case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB:
                break;
              case CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE:
                var INDEX_SLIDE_RATIO = 1;
                setFunctionSlideShow(functionslidesDetails[CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE], INDEX_SLIDE_RATIO, true);
                break;
              case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE:
                var INDEX_SLIDE_RATIO = 3;
                setFunctionSlideShow(functionslides[CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE], INDEX_SLIDE_RATIO, true);
                break;
            }
          } else {
            UniversialManagerService.setOrientation(CAMERA_STATUS.ORIENTATION.PORTRAIT);
            switch (UniversialManagerService.getServiceType()) {
              case CAMERA_STATUS.WEB_APP_TYPE.SSM_MOBILE:
                break;
              case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB:
                break;
              case CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE:
                var INDEX_SLIDE_RATIO = 1;
                setFunctionSlideShow(functionslidesDetails[CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE], INDEX_SLIDE_RATIO, false);
                break;
              case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE:
                var INDEX_SLIDE_RATIO = 3;
                setFunctionSlideShow(functionslides[CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE], INDEX_SLIDE_RATIO, false);
                break;
            }
          }
        };

        var presetListCallback = function(result) {
          if (result.PTZPresets === undefined) {
            ModalManagerService.open('message', {
              'buttonCount': 1,
              'message': 'lang_NoListFound'
            });
          } else {
            var list = [];
            var presetFunc = function(value) {
              DigitalPTZContorlService.runDPTZ('preset', value);
            };
            for (var index = 0; index < result.PTZPresets[0].Presets.length; index++) {
              list[index] = {
                'name': result.PTZPresets[0].Presets[index].Name,
                'action': presetFunc,
                'value': result.PTZPresets[0].Presets[index].Preset,
              };
            }
            var homeAction = function() {};
            var addAction = function() {};
            ModalManagerService.open('presetlist', {
              'buttonCount': 1,
              'list': list,
              'homeAction': homeAction,
              'addAction': addAction
            });
          }
        };

        var groupListCallback = function(result) {

          if (result.PTZGroups === undefined) {
            ModalManagerService.open('message', {
              'buttonCount': 1,
              'message': 'lang_NoListFound'
            });
          } else {
            var groups = result.PTZGroups[0].Groups;
            var list = [];
            var groupPrefix = $translate.instant('lang_group');
            var groupFunc = function(value) {
              DigitalPTZContorlService.runDPTZ('group', value);
            };
            for (var i = 1; i <= groups.length; i++) {
              list.push({
                'name': groupPrefix + ' ' + i,
                'action': groupFunc,
                'value': i,
              });
            }
            ModalManagerService.open('liveList', {
              'buttonCount': 0,
              'list': list
            });
          }
        };

        lineUpFunctions(functionslides[ClientServiceType]);
        resetOrientation();

        $rootScope.$saveOn('newProfile', function(event, data) {
          resetDPTZMenu();
        }, scope);

        scope.$on('resize::resize', function() {
          resetOrientation();
          resetDPTZMenu();
          if (scope.visibilityDetailMenu) {
            lineUpFunctions(functionslidesDetails[ClientServiceType]);
          } else {
            lineUpFunctions(functionslides[ClientServiceType]);
          }
        });

        scope.$on('closeDetailMenu', function() {
          scope.closeDetailMenu();
        });

        $rootScope.$saveOn('AccountInfoUpdated', function(event) {
          functionslides[ClientServiceType][2].show = AccountService.isPTZAble() || (sunapiAttributes.profileBasedDPTZ && (UniversialManagerService.getUserId() === 'admin'));
          functionslides[ClientServiceType][3].show = false;
          functionslides[ClientServiceType][4].show = false;
          functionslides[ClientServiceType][5].show = ((sunapiAttributes.DigitalAutoTrackingOptions !== undefined) && (UniversialManagerService.getUserId() === 'admin'));
          functionslides[ClientServiceType][6].show = (AccountService.isAlarmOutputAble() === true);
          functionslides[ClientServiceType][7].show = (AccountService.isAudioInAble() === true);
          functionslides[ClientServiceType][8].show = (AccountService.isAudioOutAble() === true);
        });

        $rootScope.$saveOn('resetVisibility', function(event, selected_channel_index) {
          switch (UniversialManagerService.getServiceType()) {
            case CAMERA_STATUS.WEB_APP_TYPE.SSM_MOBILE:
              break;
            case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB:
              break;
            case CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE:
              var INDEX_SLIDE_PTZ = 0;
              var INDEX_SLIDE_PRESET = 1;
              if (ExtendLiveFunctionsService.supportPTZ(selected_channel_index) === CAMERA_STATUS.PTZ_CAPABILITY.NOT_SUPPORT) {
                setFunctionSlideShow(functionslides[CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE], INDEX_SLIDE_PTZ, false);
                setFunctionSlideShow(functionslides[CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE], INDEX_SLIDE_PRESET, false);
              } else {
                setFunctionSlideShow(functionslides[CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE], INDEX_SLIDE_PTZ, true);
                setFunctionSlideShow(functionslides[CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE], INDEX_SLIDE_PRESET, true);
              }
              if (UniversialManagerService.getRatio() === CAMERA_STATUS.RATIO.ORIGINAL) {
                UniversialManagerService.setRatio(CAMERA_STATUS.RATIO.ASPECT);
                var INDEX_SLIDE_RATIO = 1;
                toggleRatioSlide(
                  functionslidesDetails[CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE],
                  INDEX_SLIDE_RATIO
                );
              }
              resetOrientation();
              lineUpFunctions(functionslides[ClientServiceType]);
              break;
            case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE:
              ExtendLiveFunctionsService.supportPTZ().then(
                function(res) {
                  var INDEX_SLIDE_PTZ = 4;
                  if (res === CAMERA_STATUS.PTZ_CAPABILITY.NOT_SUPPORT) {
                    setFunctionSlideShow(functionslides[CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE], INDEX_SLIDE_PTZ, false);
                  } else {
                    setFunctionSlideShow(functionslides[CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE], INDEX_SLIDE_PTZ, true);
                  }
                  if (UniversialManagerService.getRatio() === CAMERA_STATUS.RATIO.ORIGINAL) {
                    UniversialManagerService.setRatio(CAMERA_STATUS.RATIO.ASPECT);
                    var INDEX_SLIDE_RATIO = 3;
                    toggleRatioSlide(
                      functionslides[CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE],
                      INDEX_SLIDE_RATIO
                    );
                  }
                  resetOrientation();
                  lineUpFunctions(functionslides[ClientServiceType]);
                },
                function(error) {
                  console.log(error);
                }
              );
              break;
          }
        }, scope);
      },
    };
  }
]);