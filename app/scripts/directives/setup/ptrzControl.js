kindFramework.directive('ptrzControl', function(Attributes, SunapiClient, $uibModal, $state, $timeout, COMMONUtils, $interval, CAMERA_STATUS, UniversialManagerService, $rootScope) {
  "use strict";
  return {
    restrict: 'E',
    scope: {
      ptzinfo: '=',
      quadrant: '='
    },
    templateUrl: './views/setup/common/ptrzControl.html',
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

      var ptzMoveBtn = $("#ptrz-control_move-btn");
      var ptzControlBox = $("#ptrz-control_box");
      var ptzControlSlider = $("#ptrz-control_slider");

      ptzMoveBtn.unbind();
      ptzControlBox.unbind();
      ptzControlSlider.unbind();
      var isDrag = false;
      var isMove = false;
      var animateDuration = 50;
      // var PAN_RATIO = 1.205;
      // var TILT_RATIO = 1.755;
      var PAN_RATIO = 200 / (ptzControlBox.width() - ptzMoveBtn.width());
      var TILT_RATIO = 200 / (ptzControlBox.height() - ptzMoveBtn.height());
      var downTimer = null;
      var ptzJogTimer = null;
      var isJogUpdating = false;

       ptzMoveBtn.draggable({
        containment: "parent",
        revert: false,
        revertDuration: 100,
        drag: function(e, ui) {
          isDrag = true;
          isMove = false;
          var offset = $(this).position();

          var xRadius = 80 - ptzMoveBtn.width()/2,
              yRadius = 80 - ptzMoveBtn.height()/2,
              x = ui.position.left - xRadius,
              y = yRadius - ui.position.top,
              h = Math.sqrt(x*x + y*y);
          if (Math.floor(h) > Math.min(xRadius, yRadius)) {
              var ye = Math.round(yRadius * y / h), xe = Math.round(xRadius * x / h);
              if ((Math.abs(y) > Math.abs(ye)) || (Math.abs(x) > Math.abs(xe))) {
                  ui.position.left = xe + xRadius;
                  ui.position.top = yRadius - ye;
              }
          }

          var xPos = (offset.left);
          var yPos = (offset.top);
          xPos *= PAN_RATIO;
          yPos *= TILT_RATIO;

          xPos = parseInt(xPos, 10) - 100;
          yPos = -(parseInt(yPos, 10) - 100);
          if (100 < yPos && yPos < -100) yPos = 0;
          if (100 < xPos && xPos < -100) xPos = 0;
          scope.runPTR(xPos, yPos, 0);
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
              ptrStop();
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

          scope.runPTR(xPos, yPos, 0);
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
                    ptrStop();
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
            ptrStop();
          });
        }
      });

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
          ptrStop();
        }
      });

      function makeJogTimer() {
        ptzJogTimer = $interval(function() {
          isJogUpdating = false;
        }, 100);
      }

      scope.runPTR = function(pan, tilt, zoom) {
          var setData = {};
          setData.Channel = UniversialManagerService.getChannelId();

          setData.Pan = pan;
          setData.Tilt = tilt;
          setData.Rotate = zoom;

          if (ptzJogTimer === null) {
              makeJogTimer();
          }

          if (isJogUpdating === false) {
              isPtzControlStart = true;
              return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=ptr&action=control', setData,
                  function(response) {},
                  function(errorData) {
                      console.log(errorData);
                  }, '', true);

              isJogUpdating = true;
          }
      };

      scope.stopPTR = function(){
          ptrStop();
      };

      function setPtzControlArrow(degree) {
          // var ptrzControlBox = $("#ptrz-control_box");
          // ptrzControlBox.css('transform','rotate(' + degree + 'deg)');

          var hline = $("#ptrz-control_box-hline");
          var vline = $("#ptrz-control_box-vline");

          hline.css('transform','rotate(' + degree + 'deg)');
          vline.css('transform','rotate(' + degree + 'deg)');
      }

        var degree = 0;
      function getRotate(){
          degree += 30;
          setPtzControlArrow();
      }

      function ptrStop() {
        if (ptzJogTimer !== null) {
          $interval.cancel(ptzJogTimer);
          ptzJogTimer = null;
        }
        if (!isPtzControlStart) return;

        var setData = {};
        setData.Channel = UniversialManagerService.getChannelId();
        setData.Pan = 0;
        setData.Tilt = 0;
        setData.Rotate = 0;
        isPtzControlStart = false;

        SunapiClient.get('/stw-cgi/image.cgi?msubmenu=ptr&action=control', setData,
          function(response) {},
          function(errorData) {}, '', true);
      }
    }
  };
});