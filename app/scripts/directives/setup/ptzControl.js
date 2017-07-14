kindFramework.directive('ptzControl', function(Attributes, SunapiClient, $uibModal, $state, $timeout, COMMONUtils, $interval, CAMERA_STATUS, UniversialManagerService, $rootScope) {
  "use strict";
  return {
    restrict: 'E',
    scope: {
      ptzinfo: '=',
      quadrant: '='
    },
    templateUrl: './views/setup/common/ptzControl.html',
    link: function(scope) {
      var mAttr = Attributes.get("attr");
      scope.showPTZControlPreset = false;
      scope.showPTZControlPresetText = false;
      scope.showPTZControlHome = false;
      scope.showPTZControlAT = false;
      scope.showPTZControlBLC = false;
      scope.showPTZControlHLC = false;
      scope.disablePTZControlBLC = true;
      scope.disablePTZControlHLC = true;
      scope.showPTZControlBasicDPTZ = false;
      scope.showPTZControlFisheyeDPTZ = false;
      scope.showPTZControlEPTZ = false;
      scope.showPTZControlFocus = false;
      scope.DATFlag = false;
      scope.isShowPTZControl = false;
      scope.showZoomFocus = false;
      scope.showPTZControlBox = true;
      scope.ptzControlClass = '';
      scope.zoomPresetClass = '';
      scope.disablePosition = false;
      scope.autoTrackingFlag = false;

      var isPtzControlStart = false, IsDigitalPTZProfile = false;

      var initControlUI = function() {
        scope.showPTZControlPreset = false;
        scope.showPTZControlPresetText = false;
        scope.showPTZControlHome = false;
        scope.showPTZControlAT = false;
        scope.showPTZControlBLC = false;
        scope.showPTZControlHLC = false;
        scope.showPTZControlOSD = false;
        scope.disablePTZControlBLC = true;
        scope.disablePTZControlHLC = true;
        scope.showPTZControlFisheyeDPTZ = false;
        scope.showPTZControlEPTZ = false;
        scope.showPTZControlFocus = false;
        scope.isShowPTZControl = false;
        scope.showZoomFocus = false;
        scope.showPTZControlBox = true;
        scope.ptzControlClass = '';
        scope.zoomPresetClass = '';
        scope.disablePosition = false;
        scope.autoTrackingFlag = false;
        if (mAttr.ZoomOnlyModel) {
          scope.isShowPTZControl = true;
          scope.showZoomFocus = true;
          scope.showPTZControlBox = false;
          scope.showPTZControlFocus = false;
          if ($('.wn5-setup-section-article .ptz-control-viewer').length > 0) {
            scope.ptzControlClass = 'ptz-zoom-article-width';
          } else {
            scope.ptzControlClass = 'ptz-zoom-width';
          }
        } else if (mAttr.PTZModel) {
          scope.isShowPTZControl = true;
          scope.showPTZControlFocus = true;
        } else {
          if ($state.current.name === "setup.ptzSetup_dptzSetup") {
            scope.isShowPTZControl = (mAttr.ExternalPTZModel === false && IsDigitalPTZProfile === true);
          } else if ($state.current.name === "setup.ptzSetup_externalPtzSetup") {
            scope.isShowPTZControl = true;
          }
        }
      };

      (function wait() {
        if (!mAttr.Ready) {
          $timeout(function() {
            mAttr = Attributes.get();
            wait();
          }, 500);
        } else {
          initControlUI();
          if ($state.current.name === "setup.ptzSetup_dptzSetup") {
            if (mAttr.PTZModel) return true;
            SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', '',
              function(response) {
                var DEFAULT_CHANNEL = 0;
                IsDigitalPTZProfile = response.data.VideoProfiles[DEFAULT_CHANNEL].Profiles.some(function(element) {
                  if ('IsDigitalPTZProfile' in element) {
                    return element.IsDigitalPTZProfile;
                  }
                });
                scope.isShowPTZControl = (mAttr.ExternalPTZModel === false && IsDigitalPTZProfile === true);
              },
              function() {
                scope.isShowPTZControl = false;
              }, '', true);
          }
        }
      })();

      scope.$watch('ptzinfo', function(ptzinfo) {
        if (typeof ptzinfo !== 'undefined') {
          if (ptzinfo.type === 'preset') {
            //scope.showPTZControlPreset = true;
            scope.showPTZControlPresetText = true;
            scope.showPTZControlHome = true;
            scope.zoomPresetClass = 'zoompreset';
            scope.ptzControlClass = 'ptz-ui-width';
            //if(ptzinfo.disablePosition == true){
            //    scope.disablePosition = true;
            //} else {
            //    scope.disablePosition = false;
            //}
          } else if (ptzinfo.type === 'AT') {
            scope.ptzControlClass = 'ptz-ui-width';
            scope.zoomPresetClass = 'zoompreset';
            scope.showPTZControlAT = true;
            // autoTrackingList Data
            if (ptzinfo.isViewTrackingData) {
              if (!ptzinfo.TrackingAreas) ptzinfo.TrackingAreas = [];
              scope.TrackingAreas = angular.copy(ptzinfo.TrackingAreas);
              scope.autoTrackingFlag = ptzinfo.autoTrackingFlag;
              scope.selectTrackingArea = ptzinfo.selectTrackingArea;
            }

          } else if (ptzinfo.type === 'BLC' || ptzinfo.type === 'HLC') {
            if (mAttr.PTZModel) {
              if (ptzinfo.type === 'BLC') {
                scope.showPTZControlBLC = true;
                scope.showPTZControlHLC = false;
              } else {
                scope.showPTZControlBLC = false;
                scope.showPTZControlHLC = true;
              }
              scope.blcbox = {};
              scope.blcbox.select = 5;
              scope.blcbox.options = COMMONUtils.getArray(5, true);
              if (ptzinfo.disable === undefined || (ptzinfo.disable !== undefined && ptzinfo.disable === true)) {
                if (ptzinfo.type === 'BLC') {
                  scope.disablePTZControlBLC = true;
                  scope.disablePTZControlHLC = false;
                } else {
                  scope.disablePTZControlBLC = false;
                  scope.disablePTZControlHLC = true;
                }
              } else {
                if (ptzinfo.type === 'BLC') {
                  scope.disablePTZControlBLC = false;
                  scope.disablePTZControlHLC = true;
                } else {
                  scope.disablePTZControlBLC = true;
                  scope.disablePTZControlHLC = false;
                }
              }
              scope.ptzControlClass = 'w510';
            }
          } else if (ptzinfo.type === 'OSD') {
            if (mAttr.PTZModel) {
              scope.showPTZControlOSD = true;
              scope.ptzControlClass = 'w310';
            }
          } else if (ptzinfo.type === 'DPTZ') {
            scope.showPTZControlBasicDPTZ = true;
            scope.DATFlag = true;
          } else if (ptzinfo.type === 'EPTZ') {
            scope.showPTZControlEPTZ = true;
          } else if (ptzinfo.type === 'PTRZ') {
            scope.showPTZControlHome = true;
            scope.isShowPTZControl = true;
            scope.showPTZControlFocus = true;
          } else if (ptzinfo.type === 'presetZoom') {
            scope.showPTZControlPresetText = true;
            scope.showPTZControlHome = false;
            scope.zoomPresetClass = 'zoompreset';
            //if(ptzinfo.disablePosition == true){
            //    scope.disablePosition = true;
            //} else {
            //    scope.disablePosition = false;
            //}
          } else {
            initControlUI();
          }
        }
      });

      scope.blcAreaChange = function(mode, direction) {
        var data = {};
        data.mode = mode;
        data.direction = direction;
        data.step = scope.blcbox.select;
        if (scope.showPTZControlBLC) data.type = 'BLC';
        else data.type = 'HLC';
        scope.$emit('changeBlcArea', data);
      };

      scope.setNorthView = function() {
        COMMONUtils.ApplyConfirmation(setNorth);
      };

      function setNorth() {
        var html = '<div id="set_North" class="ptz-control_set-north">';
        html += '<i class="tui tui-wn5-north"></i>';
        html += '</div>';
        $('#sketchbook').append(html);

        var removeNorth = function() {
          $timeout(function() {
            $('#sketchbook').find('#set_North').remove();
          }, 1000);
        };
        var setData = {};
        setData.NorthDirection = '';
        SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=ptzsettings&action=set', setData,
          function() {
            removeNorth();
          },
          function() {
            removeNorth();
          }, '', true);
      }
      scope.$watch('showPTZControlOSD', function(value) {
        if (value === false) {
          $('#sketchbook').find('#set_North').remove();
        }
      });

      function ptzLimitCheck(data) {
        if (data > 100) {
          data = 100;
        } else if (data < -100) {
          data = -100;
        }

        return data;
      }

      scope.moveAutoTracking = function() {
        if (!scope.selectTrackingArea) return;
        var setData = {};
        setData.Mode = 'Move';
        setData.TrackingAreaID = scope.selectTrackingArea;
        SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=control', setData,
          function(response) {},
          function(errorData) {}, '', true);
      };

      scope.deleteAutoTracking = function() {
        if (!scope.selectTrackingArea) return;
        var setData = {};
        setData.Channel = 0;
        setData.TrackingAreaID = scope.selectTrackingArea;
        SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=remove', setData,
          function() {
            getAutoTracking();
          },
          function(errorData) {}, '', true);
      };

      scope.clickDigitalAutoTracking = function() {
        var setData = {};
        setData.Channel = 0;
        if (UniversialManagerService.getDigitalPTZ() === CAMERA_STATUS.DPTZ_MODE.DIGITAL_PTZ) {
          setData.Mode = 'Start';
        } else if (UniversialManagerService.getDigitalPTZ() === CAMERA_STATUS.DPTZ_MODE.DIGITAL_AUTO_TRACKING) {
          setData.Mode = 'Stop';
        }
        SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=digitalautotracking&action=control', setData,
          function(response) {},
          function(errorData) {}, '', true);
      };

      scope.clickAutoTracking = function() {
        var setData = {};
        setData.Channel = 0;
        if (scope.autoTrackingFlag === true) {
          scope.autoTrackingFlag = false;
          setData.Enable = 'False';
        } else {
          scope.autoTrackingFlag = true;
          setData.Enable = 'True';
        }
        SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=set', setData,
          function(response) {},
          function() {
            scope.autoTrackingFlag = (scope.autoTrackingFlag !== true);
          }, '', true);
      };

      function getAutoTracking() {
        var setData = {};
        SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=view', setData,
          function(response) {
            $timeout(function() {
              try {
                if (!response.data.AutoTracking[0].TrackingAreas) response.data.AutoTracking[0].TrackingAreas = [];
                scope.TrackingAreas = angular.copy(response.data.AutoTracking[0].TrackingAreas);
                scope.selectTrackingArea = '';
                scope.autoTrackingFlag = response.data.AutoTracking[0].Enable;
                scope.$emit('changeAutoTracking', response.data.AutoTracking[0].TrackingAreas);
              } catch (e) {}
            }, 100);
          },
          function() {
            $timeout(function() {
              try {
                scope.TrackingAreas = [];
                scope.selectTrackingArea = '';
                scope.autoTrackingFlag = false;
                scope.$emit('changeAutoTracking', scope.TrackingAreas);
              } catch (e) {}
            }, 100);
          }, '', true);
      }

      $rootScope.$saveOn('AutoTrackingStatus', function(event, obj) {
        switch (obj.type) {
          case "TrackingEnable":
            if (obj.value === 'false')
            {
              scope.autoTrackingFlag = false;
            }
            else
            {
              scope.autoTrackingFlag = true;
            }
            break;
        }
      });

      $rootScope.$saveOn('DigitalAutoTrackingStatus', function(event, obj) {
        switch (obj.type) {
          case "DigitalAutoTracking":
            if (obj.value === 'false') {
              scope.DATFlag = false;
              UniversialManagerService.setDigitalPTZ(CAMERA_STATUS.DPTZ_MODE.DIGITAL_PTZ);
            } else {
              scope.DATFlag = true;
              UniversialManagerService.setDigitalPTZ(CAMERA_STATUS.DPTZ_MODE.DIGITAL_AUTO_TRACKING);
            }
            scope.$digest();
            break;
        }
      });

      var ptzMoveBtn = $("#ptz-control_move-btn");
      var ptzControlBox = $("#ptz-control_box");
      var ptzControlSlider = $("#ptz-control_slider");
      ptzMoveBtn.unbind();
      ptzControlBox.unbind();
      ptzControlSlider.unbind();
      var isDrag = false;
      var isMove = false;
      var animateDuration = 50;
      // var PAN_RATIO = 1.205;
      // var TILT_RATIO = 1.755;
      var PAN_RATIO = 1.495;
      var TILT_RATIO = 1.790;
      var downTimer = null;
      var ptzJogTimer = null;
      var isJogUpdating = false;



       ptzMoveBtn.draggable({
        containment: "parent",
        revert: false,
        revertDuration: 100,
        drag: function() {
          isDrag = true;
          isMove = false;
          var offset = $(this).position();
          var xPos = (offset.left);
          var yPos = (offset.top);
          xPos *= PAN_RATIO;
          yPos *= TILT_RATIO;

          xPos = parseInt(xPos, 10) - 100;
          yPos = -(parseInt(yPos, 10) - 100);
          if (-4 < yPos && yPos < 4) yPos = 0;
          if (-2 < xPos && xPos < 2) xPos = 0;
          ptzJogMove(xPos, yPos);
        },
        stop: function() {
          if (!isDrag && !isMove) {} else {
            isDrag = false;
            isMove = false;
            var moveAreaWidth = ptzControlBox.width();
            var moveAreaHeight = ptzControlBox.height();
              ptzMoveBtn.animate({
              top: (moveAreaHeight / 2 - 12),
              left: (moveAreaWidth / 2 - 12)
            }, animateDuration, function() {
              ptzStop();
            });
          }
        }
      });
        ptzControlBox.mousedown(function(e) {
        if (isDrag || isMove || e.which !== 1)
          return;

        isMove = true;
        var jogWidth = ptzMoveBtn.width() / 2;

        var moveAreaPos = ptzControlBox.offset();
        var moveAreaWidth = ptzControlBox.width();
        var moveAreaHeight = ptzControlBox.height();
        var jogPos = ptzMoveBtn.offset();
        var jog_Left = jogPos.left + jogWidth;
        var jog_Top = jogPos.top + jogWidth;
        var xPos = e.pageX;
        var yPos = e.pageY;

        /** @namespace window.navigator.msPointerEnabled */
            if (window.navigator.msPointerEnabled) {
          if ($(window).scrollLeft() !== 0 && e.pageX === e.clientX) {
            xPos = xPos + $(window).scrollLeft();
          }
          if ($(window).scrollTop() !== 0 && e.pageY === e.clientY) {
            yPos = yPos + $(window).scrollTop();
          }
        }
        if (xPos <= (moveAreaPos.left + jogWidth))
          xPos = (moveAreaPos.left + jogWidth);
        else if (xPos >= (moveAreaWidth + moveAreaPos.left - jogWidth))
          xPos = moveAreaWidth + moveAreaPos.left - jogWidth;

        if (yPos <= (moveAreaPos.top + jogWidth))
          yPos = moveAreaPos.top + jogWidth;
        else if (yPos >= (moveAreaPos.top + moveAreaHeight - jogWidth))
          yPos = moveAreaPos.top + moveAreaHeight - jogWidth;

        xPos = xPos - jog_Left;
        yPos = jog_Top - yPos;
        if (-4 <= xPos && xPos <= 4) xPos = 0;
        if (-2 <= yPos && yPos <= 2) yPos = 0;

          ptzMoveBtn.animate({
          top: (moveAreaHeight / 2 - 12) - yPos,
          left: (moveAreaWidth / 2 - 12) + xPos
        }, animateDuration, function() {
          xPos *= PAN_RATIO;
          yPos *= TILT_RATIO;

          ptzJogMove(xPos, yPos);
          if (isMove === true) {
            clearTimeout(downTimer);
            downTimer = setTimeout(function() {
                ptzMoveBtn.trigger(e);
            }, animateDuration);
          }
        });
        e.preventDefault();
      });
        ptzMoveBtn.mouseup(function(e) {
            clearTimeout(downTimer);
            e.preventDefault();
            if (!isDrag && !isMove) {} else {
                isDrag = false;
                isMove = false;
                var moveAreaWidth = ptzControlBox.width();
                var moveAreaHeight = ptzControlBox.height();
                ptzMoveBtn.animate({
                    top: (moveAreaHeight / 2 - 12),
                    left: (moveAreaWidth / 2 - 12)
                }, animateDuration, function() {
                    ptzStop();
                });
            }
        });
        ptzControlBox.mouseup(function(e) {
        clearTimeout(downTimer);
        e.preventDefault();
        if (!isDrag && !isMove) {} else {
          isDrag = false;
          isMove = false;
          var moveAreaWidth = ptzControlBox.width();
          var moveAreaHeight = ptzControlBox.height();
            ptzMoveBtn.animate({
            top: (moveAreaHeight / 2 - 12),
            left: (moveAreaWidth / 2 - 12)
          }, animateDuration, function() {
            ptzStop();
          });
        }
      });

      function ptzJogMove(xPos, yPos) {
        var setData = {};
        setData.Channel = 0;
        setData.NormalizedSpeed = 'True';
        setData.Pan = ptzLimitCheck(xPos);
        setData.Tilt = ptzLimitCheck(yPos);
        setData.Zoom = 0;

        if (scope.showPTZControlFisheyeDPTZ === true) {
          setData.SubViewIndex = scope.quadrant.select;
        }

        if (ptzJogTimer === null) {
          makeJogTimer();
        }

        if (isJogUpdating === false) {
          isPtzControlStart = true;
          SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control', setData,
            function(response) {},
            function(errorData) {}, '', true);

          isJogUpdating = true;
        }
      }

        ptzControlSlider.slider({
        orientation: "vertical",
        min: -100,
        max: 100,
        value: 0,
        revert: true,
        slide: function(event, ui) {
          if (ptzJogTimer === null) {
            makeJogTimer();
          }

          if (isJogUpdating === false) {
            var setData = {};
            setData.Channel = 0;
            setData.NormalizedSpeed = 'True';
            setData.Zoom = ui.value;

            if (scope.showPTZControlFisheyeDPTZ === true) {
              setData.SubViewIndex = scope.quadrant.select;
            }

            isPtzControlStart = true;
            SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control', setData,
              function(response) {},
              function(errorData) {}, '', true);
            isJogUpdating = true;
          }

        },
        stop: function() {
            ptzControlSlider.slider('value', 0);
          ptzStop();
        }
      });

      var ptzContorlSliderHorizontalZoom = $("#ptz-control_slider-horizontal-zoom");
      ptzContorlSliderHorizontalZoom.unbind();

      ptzContorlSliderHorizontalZoom.slider({
        orientation: "horizontal",
        min: -100,
        max: 100,
        value: 0,
        revert: true,
        slide: function(event, ui) {
          if (ptzJogTimer === null) {
            makeJogTimer();
          }

          if (isJogUpdating === false) {
            var setData = {};
            setData.Channel = 0;
            setData.NormalizedSpeed = 'True';
            setData.Zoom = ui.value;

            isPtzControlStart = true;
            SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control', setData,
              function(response) {},
              function(errorData) {}, '', true);
            isJogUpdating = true;
          }

        },
        stop: function() {
           ptzContorlSliderHorizontalZoom.slider('value', 0);
          ptzStop();
        }
      });

      var ptzContorlSliderHorizontalFocus = $("#ptz-control_slider-horizontal-focus");

      ptzContorlSliderHorizontalFocus.unbind();

      ptzContorlSliderHorizontalFocus.slider({
        orientation: "horizontal",
        min: -100,
        max: 100,
        value: 0,
        revert: true,
        slide: function(event, ui) {
          if (ptzJogTimer === null) {
            makeJogTimer();
          }

          if (isJogUpdating === false) {
            var sliderVal = ui.value;
            if (sliderVal > 0) {
              scope.clickPtzFocus('Far');
            } else if (sliderVal < 0) {
              scope.clickPtzFocus('Near');
            }
            isJogUpdating = true;
          }

        },
        stop: function() {
          ptzContorlSliderHorizontalFocus.slider('value', 0);
          ptzStop();
        }
      });

      function makeJogTimer() {
        ptzJogTimer = $interval(function() {
          isJogUpdating = false;
        }, 100);
      }

      scope.clickPtzFocus = function(value) {
        var setData = {};
        setData.Channel = 0;
        if (value === 'Stop') {
          ptzStop();
        } else if (value === 'Auto') {
          setData.Mode = 'AutoFocus';

          SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=control', setData,
            function(response) {},
            function(errorData) {}, '', true);
        } else {
          setData.Focus = value;

          SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control', setData,
            function(response) {},
            function(errorData) {}, '', true);
          isPtzControlStart = true;
        }
      };

      scope.clickHomePosition = function(value) {
        var setData = {};
        if (value === 'Set') {
          SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=home&action=set', setData,
            function() {
              COMMONUtils.ShowInfo('lang_savingCompleted');
            },
            function(errorData) {}, '', true);
        } else {
          setData.Channel = 0;
          SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=home&action=control', setData,
            function(response) {},
            function(errorData) {}, '', true);
        }
      };

      scope.ptzControlZoom = function(value) {
        if (value === 'Stop') {
          if (UniversialManagerService.getDigitalPTZ() !== CAMERA_STATUS.DPTZ_MODE.DIGITAL_AUTO_TRACKING) {
            ptzStop();
          }
        } else {
          var setData = {};
          setData.Channel = 0;
          setData.NormalizedSpeed = 'True';
          setData.Zoom = value;

          if (scope.showPTZControlFisheyeDPTZ === true) {
            setData.SubViewIndex = scope.quadrant.select;
          }
          isPtzControlStart = true;
          SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control', setData,
            function(response) {},
            function(errorData) {}, '', true);
        }
      };

      function ptzStop() {
        if (ptzJogTimer !== null) {
          $interval.cancel(ptzJogTimer);
          ptzJogTimer = null;
        }
        if (!isPtzControlStart) return;
        var setData = {};
        setData.Channel = 0;
        setData.OperationType = 'All';
        if (scope.showPTZControlFisheyeDPTZ === true) {
          setData.SubViewIndex = scope.quadrant.select;
        }
        isPtzControlStart = false;
        SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=stop&action=control', setData,
          function(response) {},
          function(errorData) {}, '', true);
      }

      scope.showSetPreset = function() {
        var setData = {};
        SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=view', setData,
          function(response) {
            var mAttr = Attributes.get("attr");
            var modalInstance = $uibModal.open({
              templateUrl: 'views/setup/common/ptzPresetPopup.html',
              controller: 'ptzPresetCtrl',
              windowClass: 'modal-position-middle',
              resolve: {
                PresetData: function() {
                  var presets = [];
                  if (typeof response.data.PTZPresets !== 'undefined' && typeof response.data.PTZPresets[0].Presets !== 'undefined') {
                    presets = response.data.PTZPresets[0].Presets;
                  }
                  return {
                    'PTZPresets': presets,
                    'PTZPresetOptionsMaxValue': mAttr.PTZPresetOptions.maxValue
                  };
                }
              }
            });
            modalInstance.result.then(function(data) {
              if (data.PresetIdx && data.PresetName) {
                var addData = {};
                addData.Preset = data.PresetIdx;
                addData.Name = data.PresetName;

                SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=add', addData,
                  function() {
                    scope.$emit('changePTZPreset', data.PresetIdx);
                  },
                  function(errorData) {}, '', true);
              }
            }, function() {});
          },
          function(errorData) {}, '', true);
      };
    }
  };
});