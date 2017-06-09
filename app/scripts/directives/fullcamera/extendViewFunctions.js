"use strict";
kindFramework.
  directive("extendViewFunctions", ['DigitalZoomService', 'UniversialManagerService',
    'kindStreamInterface', 'PTZContorlService', 'DigitalPTZContorlService',
    'CAMERA_STATUS', 'PTZ_TYPE', 'ModalManagerService', '$translate', 'SequenceModel',
    function(DigitalZoomService, UniversialManagerService, kindStreamInterface,
      PTZContorlService, DigitalPTZContorlService, CAMERA_STATUS, PTZ_TYPE, ModalManagerService,
      $translate, SequenceModel) {
      return {
        require: '?viewFunctions',
        url: '<div></div>',
        restrict: 'A',
        link: function(scope) {
          var presetRefresh = function() {
            scope.ptzAction.presetRefresh();
          };
          var ptzModeList = PTZ_TYPE.ptzCommand;
          var areaX = null;
          var areaY = null;
          var areaCanvas = document.getElementById("areaCanvas");
          var fullDiv = document.getElementById('full-screen-channel');
          var context = areaCanvas.getContext("2d");
          var sequenceModel = new SequenceModel();
          /* jshint ignore:start */
          fullDiv.addEventListener('mousewheel', function(event) {
            if (!scope.domControls.visibilityFullScreenFuntions && !scope.domControls.visibilityPlaybackControl) {

              if (UniversialManagerService.getZoomMode() === CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM) {
                if (kindStreamInterface.managerCheck()) {
                  var zoomArray = DigitalZoomService.eventHandler(event, "mousewheel", null);
                  var zoomLevel = 1.0 + 2.415 + zoomArray[2];

                  if (zoomLevel == 1.0) {
                    scope.digitalZoom.visibility = false;
                  } else {
                    scope.digitalZoom.visibility = true;
                  }
                  if (scope.digitalZoom.level == zoomLevel.toFixed(2)) {
                    return;
                  } else if (scope.digitalZoom.level > zoomLevel.toFixed(2)) {
                    scope.digitalZoom.navigation.width += 2;
                    scope.digitalZoom.navigation.height += 2;
                  } else {
                    scope.digitalZoom.navigation.width -= 2;
                    scope.digitalZoom.navigation.height -= 2;
                  }

                  scope.digitalZoom.navigation = getNavigationLocation(zoomArray);

                  scope.$applyAsync(function() {
                    scope.digitalZoom.level = zoomLevel.toFixed(2);
                    scope.digitalZoom.areaStyle.left = scope.digitalZoom.navigation.left + '%';
                    scope.digitalZoom.areaStyle.top = scope.digitalZoom.navigation.top + '%';
                    scope.digitalZoom.areaStyle.width = scope.digitalZoom.navigation.width + '%';
                    scope.digitalZoom.areaStyle.height = scope.digitalZoom.navigation.height + '%';
                  });

                  kindStreamInterface.changeDrawInfo(zoomArray);
                }
              } else if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ) {
                if (ptzModeList.PTZ === PTZContorlService.getMode()) {
                  PTZContorlService.eventHandler(event, "mousewheel", null);
                }
              } else if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.DIGITZL_PTZ) {
                DigitalPTZContorlService.eventHandler(event, "mousewheel", null);
              }
            }
          }, false);

          fullDiv.addEventListener('mousedown', function(event) {
            scope.digitalZoom.curLocation = [event.clientX, event.clientY];
            if (!scope.domControls.visibilityFullScreenFuntions && !scope.domControls.visibilityPlaybackControl) {
              if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM) {
                scope.digitalZoom.mouseDownCheck = true;
                DigitalZoomService.eventHandler(event, "mousedown", null);
              } else if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ) {
                PTZContorlService.eventHandler(event, "mousedown", null);
                if (ptzModeList.AREAZOOM === PTZContorlService.getMode()) {
                  scope.ptzControl.ptzAreaZoomMode = true;
                  areaX = event.clientX;
                  areaY = event.clientY;
                }
              } else if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.DIGITZL_PTZ) {
                DigitalPTZContorlService.eventHandler(event, "mousedown", null);
              }
            }
          });

          fullDiv.addEventListener('mousemove', function(event) {
            if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM) {
              if (scope.digitalZoom.mouseDownCheck && kindStreamInterface.managerCheck()) {
                var zoomArray = DigitalZoomService.eventHandler(event, "mousemove", fullDiv);
                kindStreamInterface.changeDrawInfo(zoomArray);

                scope.digitalZoom.navigation = getNavigationLocation(zoomArray);

                scope.$applyAsync(function() {
                  scope.digitalZoom.areaStyle.left = scope.digitalZoom.navigation.left + '%';
                  scope.digitalZoom.areaStyle.top = scope.digitalZoom.navigation.top + '%';
                });
              }
            } else if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ) {
              PTZContorlService.eventHandler(event, "mousemove", fullDiv);
              if (ptzModeList.AREAZOOM === PTZContorlService.getMode() && scope.ptzControl.ptzAreaZoomMode) {
                var width = event.clientX - areaX;
                var height = event.clientY - areaY;
                context.clearRect(0, 0, event.target.clientWidth, event.target.clientHeight);
                context.strokeRect(areaX, areaY, width, height);
              }
            } else if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.DIGITZL_PTZ) {
              DigitalPTZContorlService.eventHandler(event, "mousemove", fullDiv);
            }
          });

          fullDiv.addEventListener('mouseup', function(event) {
            if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM) {
              scope.digitalZoom.mouseDownCheck = false;
              DigitalZoomService.eventHandler(event, "mouseup", null);
            } else if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ) {
              PTZContorlService.eventHandler(event, "mouseup", null);
              if (ptzModeList.AREAZOOM === PTZContorlService.getMode()) {
                context.clearRect(0, 0, event.target.clientWidth, event.target.clientHeight);
                scope.ptzControl.ptzAreaZoomMode = false;
              }
            } else if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.DIGITZL_PTZ) {
              DigitalPTZContorlService.eventHandler(event, "mouseup", null);
            }
            var moveX;
            var moveY;
            if (scope.digitalZoom.curLocation !== undefined) {
              moveX = Math.abs(scope.digitalZoom.curLocation[0] - event.clientX);
              moveY = Math.abs(scope.digitalZoom.curLocation[1] - event.clientY);

              if (moveX > 5 || moveY > 5) {
                scope.digitalZoom.mouseMoveCheck = true;
              }
            }
          });

          fullDiv.addEventListener('mouseleave', function(event) {
            if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM) {
              scope.digitalZoom.mouseDownCheck = false;
              DigitalZoomService.eventHandler(event, "mouseleave", null);
            } else if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ) {
              PTZContorlService.eventHandler(event, "mouseleave", null);
            } else if (UniversialManagerService.getZoomMode() == CAMERA_STATUS.ZOOM_MODE.DIGITZL_PTZ) {
              DigitalPTZContorlService.eventHandler(event, "mouseleave", null);
            }
          });

          /* jshint ignore:end */

          var getNavigationLocation = function(zoomArray) {
            var level = ((scope.digitalZoom.level - 1) * 100) / 5;
            var zoomMoveMax = (level * 2) + 3;
            var naviMoveMax = level * 2;
            var zoomCalcX = (zoomArray[0].toFixed(2) * 100) + zoomMoveMax;
            var zoomCalcY = (zoomArray[1].toFixed(2) * 100) + zoomMoveMax;
            var zoomScale = (zoomMoveMax * 2) / naviMoveMax;
            var naviX = zoomCalcX / zoomScale;
            var naviY = zoomCalcY / zoomScale;
            scope.digitalZoom.navigation.left = (naviMoveMax - naviX);
            scope.digitalZoom.navigation.top = naviY;

            return scope.digitalZoom.navigation;
          };

          var presetAddCallBack = function(values) {
            if (values.action === 'add') {
              PTZContorlService.ptzSetting(values, presetRefresh);
            } else {
              ModalManagerService.open('message', {
                  'buttonCount': 2,
                  'message': "해당 프리셋이 이미 저장되어 있습니다. 덮어쓰겠습니까?"
                },
                function() {
                  PTZContorlService.ptzSetting(values, presetRefresh);
                }
              );
            }
          };


          scope.presetListCallback = function(result) {
            if (result.PTZPresets === undefined) {
              ModalManagerService.open('message', {
                'buttonCount': 1,
                'message': $translate.instant('lang_NoListFound')
              });
            } else {
              var list = [];
              var presetFunc = function(value) {
                PTZContorlService.execute(value);
              };
              for (var index = 0; index < result.PTZPresets[0].Presets.length; index++) {
                list[index] = {
                  'name': result.PTZPresets[0].Presets[index].Name,
                  'action': presetFunc,
                  'value': result.PTZPresets[0].Presets[index].Preset,
                };
              }
              var homeAction = function() {
                PTZContorlService.ptzSetting({
                  'action': 'home'
                });
              };
              var addAction = function() {
                ModalManagerService.open('presetadd', {
                  'list': list,
                  'buttonCount': 2
                }, presetAddCallBack);
              };
              ModalManagerService.open('presetlist', {
                'buttonCount': 1,
                'list': list,
                'homeAction': homeAction,
                'addAction': addAction
              });
            }
          };

          scope.swingListCallback = function(result) {
            var list = [];
            if (scope.ptzControl.isPlay === true) {
              sequenceModel.setCurrentMode("Stop");
              PTZContorlService.extendExecute();
              scope.ptzControl.isPlay = false;
            }
            sequenceModel.changeMenu('swing');
            var swingFunc = function(value) {
              sequenceModel.setCurrentMode(value);
              PTZContorlService.extendExecute();
              scope.ptzControl.isPlay = true;
            };
            list = [{
              'name': $translate.instant(PTZ_TYPE.swingMode.PAN),
              'action': swingFunc,
              'value': 'Pan'
            }, {
              'name': $translate.instant(PTZ_TYPE.swingMode.TILT),
              'action': swingFunc,
              'value': 'Tilt'
            }, {
              'name': $translate.instant(PTZ_TYPE.swingMode.PANTILT),
              'action': swingFunc,
              'value': 'PanTilt'
            }];
            ModalManagerService.open('liveList', {
              'buttonCount': 0,
              'list': list
            });
          };
          scope.groupListCallback = function(result) {
            var list = [];
            if (scope.ptzControl.isPlay === true) {
              sequenceModel.setCurrentMode("Stop");
              PTZContorlService.extendExecute();
              scope.ptzControl.isPlay = false;
            }
            sequenceModel.changeMenu('group');
            var groupFunc = function(value) {
              sequenceModel.setCurrentIndex(value);
              sequenceModel.setCurrentMode("Start");
              PTZContorlService.extendExecute();
              scope.ptzControl.isPlay = true;
            };
            var maxGroup = PTZContorlService.getMaxGroup();
            var groupPrefix = $translate.instant('lang_group');
            for (var index = 1; index <= maxGroup; index++) {
              list.push({
                'name': groupPrefix + ' ' + index,
                'action': groupFunc,
                'value': index,
              });
            }
            ModalManagerService.open('liveList', {
              'buttonCount': 0,
              'list': list
            });
          };
          scope.tourListCallback = function(result) {
            var list = [];
            if (scope.ptzControl.isPlay === true) {
              sequenceModel.setCurrentMode("Stop");
              PTZContorlService.extendExecute();
              scope.ptzControl.isPlay = false;
            }
            sequenceModel.changeMenu('tour');
            var tourFunc = function(value) {
              sequenceModel.setCurrentIndex(value);
              sequenceModel.setCurrentMode("Start");
              PTZContorlService.extendExecute();
              scope.ptzControl.isPlay = true;
            };
            var maxTour = PTZContorlService.getMaxTour();
            var tourPrefix = $translate.instant('lang_tour');
            for (var index = 1; index <= maxTour; index++) {
              list.push({
                'name': tourPrefix + ' ' + index,
                'action': tourFunc,
                'value': index,
              });
            }
            ModalManagerService.open('liveList', {
              'buttonCount': 0,
              'list': list
            });
          };

          scope.traceListCallback = function(result) {
            var list = [];
            if (scope.ptzControl.isPlay === true) {
              sequenceModel.setCurrentMode("Stop");
              PTZContorlService.extendExecute();
              scope.ptzControl.isPlay = false;
            }
            sequenceModel.changeMenu('trace');
            var traceFunc = function(value) {
              sequenceModel.setCurrentIndex(value);
              sequenceModel.setCurrentMode("Start");
              PTZContorlService.extendExecute();
              scope.ptzControl.isPlay = true;
            };
            var tracePrefix = $translate.instant('lang_trace');
            var maxTrace = PTZContorlService.getMaxTrace();
            for (var index = 1; index <= maxTrace; index++) {
              list.push({
                'name': tracePrefix + ' ' + index,
                'action': traceFunc,
                'value': index,
              });
            }
            ModalManagerService.open('liveList', {
              'buttonCount': 0,
              'list': list
            });
          };


          scope.navigationInit = function() {
            if (kindStreamInterface.managerCheck()) {
              var zoomArray = DigitalZoomService.init();
              kindStreamInterface.changeDrawInfo(zoomArray);
              scope.digitalZoom.navigation.left = 0;
              scope.digitalZoom.navigation.top = 0;
              scope.digitalZoom.navigation.width = 100;
              scope.digitalZoom.navigation.height = 100;
              scope.digitalZoom.level = 1;
              scope.digitalZoom.areaStyle.left = scope.digitalZoom.navigation.left + '%';
              scope.digitalZoom.areaStyle.top = scope.digitalZoom.navigation.top + '%';
              scope.digitalZoom.areaStyle.width = scope.digitalZoom.navigation.width + '%';
              scope.digitalZoom.areaStyle.height = scope.digitalZoom.navigation.height + '%';
              scope.digitalZoom.visibility = false;
            }
          };

          scope.ptzAction = {
            preset: function() {
              PTZContorlService.setMode(ptzModeList.PRESET);
              PTZContorlService.getSettingList(scope.presetListCallback);
            },
            swing: function() {
              PTZContorlService.setMode(ptzModeList.SWING);
              scope.swingListCallback();
            },
            group: function() {
              PTZContorlService.setMode(ptzModeList.GROUP);
              scope.groupListCallback();
            },
            tour: function() {
              PTZContorlService.setMode(ptzModeList.TOUR);
              scope.tourListCallback();
            },
            trace: function() {
              PTZContorlService.setMode(ptzModeList.TRACE);
              scope.traceListCallback();
            },
            tracking: function() {
              PTZContorlService.setMode(ptzModeList.TRACKING);
              ModalManagerService.open('tracking');
            },
            autoFocus: function() {
              PTZContorlService.setMode(ptzModeList.AUTOFOCUS);
              PTZContorlService.execute();
              PTZContorlService.setMode(ptzModeList.PTZ);
            },
            near: function() {
              PTZContorlService.setMode(ptzModeList.NEAR);
              scope.ptzKeepDzoom = false;
              scope.ptzKeepAzoom = false;
              PTZContorlService.execute();
            },
            far: function() {
              PTZContorlService.setMode(ptzModeList.FAR);
              scope.ptzKeepDzoom = false;
              scope.ptzKeepAzoom = false;
              PTZContorlService.execute();
            },
            zoomIn: function() {
              PTZContorlService.setMode(ptzModeList.ZOOMIN);
              scope.ptzKeepDzoom = false;
              scope.ptzKeepAzoom = false;
              PTZContorlService.execute();
            },
            zoomOut: function() {
              PTZContorlService.setMode(ptzModeList.ZOOMOUT);
              scope.ptzKeepDzoom = false;
              scope.ptzKeepAzoom = false;
              PTZContorlService.execute();
            },
            digitalZoom: function() {
              if (UniversialManagerService.getZoomMode() === CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM) {
                PTZContorlService.setMode(ptzModeList.PTZ);
                scope.ptzKeepDzoom = false;
                UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ);
              } else if (UniversialManagerService.getZoomMode() === CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ) {
                PTZContorlService.setMode(ptzModeList.NONE);
                scope.ptzKeepDzoom = true;
                scope.ptzKeepAzoom = false;
                UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM);
              }
            },
            areaZoom: function() {
              if (PTZContorlService.getMode() === ptzModeList.AREAZOOM) {
                scope.ptzKeepAzoom = false;
                PTZContorlService.setPTZAreaZoom("off");
              } else {
                scope.ptzKeepAzoom = true;
                scope.ptzKeepDzoom = false;
                areaCanvas.setAttribute('width', fullDiv.clientWidth);
                areaCanvas.setAttribute('height', fullDiv.clientHeight);
                PTZContorlService.setPTZAreaZoom("on");
              }
            },
            areaZoom1x: function() {
              PTZContorlService.getPTZAreaZoomURI("1x");
            },
            areaZoomPrev: function() {
              PTZContorlService.getPTZAreaZoomURI("prev");
            },
            areaZoomNext: function() {
              PTZContorlService.getPTZAreaZoomURI("next");
            },
            stopAreaZoom: function() {
              PTZContorlService.setPTZAreaZoom("off");
            },
            stopSequence: function() {
              scope.ptzControl.isPlay = false;
              var mode = PTZContorlService.getMode();
              if (mode === ptzModeList.SWING || mode === ptzModeList.TRACE ||
                mode === ptzModeList.GROUP || mode === ptzModeList.TOUR) {
                sequenceModel.setCurrentMode("Stop");
                PTZContorlService.extendExecute();
              } else {
                PTZContorlService.execute("Stop");
                PTZContorlService.setMode(ptzModeList.PTZ);
              }
            },
            presetRefresh: function() {
              PTZContorlService.setMode(ptzModeList.PRESET);
              PTZContorlService.getSettingList(scope.presetListCallback);
            }
          };
          scope.ptzAfterAction = {
            near: function() {
              PTZContorlService.setMode(ptzModeList.STOP);
              PTZContorlService.execute();
              PTZContorlService.setMode(ptzModeList.PTZ);
            },
            far: function() {
              PTZContorlService.setMode(ptzModeList.STOP);
              PTZContorlService.execute();
              PTZContorlService.setMode(ptzModeList.PTZ);
            },
            zoomIn: function() {
              PTZContorlService.setMode(ptzModeList.STOP);
              PTZContorlService.execute();
              PTZContorlService.setMode(ptzModeList.PTZ);
            },
            zoomOut: function() {
              PTZContorlService.setMode(ptzModeList.STOP);
              PTZContorlService.execute();
              PTZContorlService.setMode(ptzModeList.PTZ);
            },
          };
        },
      };
    }
  ]);