'use strict';
/**/
kindFramework
  .service('ExtendChannelContainerService', ['DigitalZoomService', 'DigitalPTZContorlService',
    'PTZContorlService', 'PTZ_TYPE', 'PixelCounterService', '$rootScope',
    function(DigitalZoomService, DigitalPTZContorlService,
      PTZContorlService, PTZ_TYPE, PixelCounterService, $rootScope) {
      var isPc = true;
      this.getIsPcValue = function() {
        return isPc;
      };
      this.setDigitalZoomService = function(mode) {
        var canvasElem = document.getElementById("cm-livecanvas");

        if (mode) {
          if (canvasElem !== null) {
            DigitalZoomService.deleteElementEvent(canvasElem);
            DigitalZoomService.setElementEvent(canvasElem);
          }
        } else {
          if (canvasElem !== null) {
            DigitalZoomService.deleteElementEvent(canvasElem);
          }
        }
      };

      this.setPixelCounterService = function(mode, callbackFunc) {
        var canvasElem = document.getElementById("cm-livecanvas");
        if (mode) {
          if (canvasElem !== null) {
            PixelCounterService.setElementEvent(canvasElem);
            PixelCounterService.setCallbackFunc(callbackFunc);
            $rootScope.$emit('livePTZControl:command', "pixelCount", true);
          }
        } else {
          if (canvasElem !== null) {
            PixelCounterService.deleteElementEvent(canvasElem);
          }
        }
      };

      this.setManualTrackingService = function(mode, callbackFunc) {
        var canvasElem = document.getElementById("cm-livecanvas");
        if (mode) {
          if (canvasElem !== null) {
            /* it blocked multi added eventlistener */

            canvasElem.removeEventListener('mouseup', callbackFunc);

            PTZContorlService.setMode(PTZ_TYPE.ptzCommand.TRACKING);
            PTZContorlService.setManualTrackingMode("True");

            canvasElem.addEventListener('mouseup', callbackFunc);
          }
        } else {
          if (canvasElem !== null) {
            PTZContorlService.setManualTrackingMode("False");
            canvasElem.removeEventListener('mouseup', callbackFunc);
          }
        }
      };

      this.enablePTZ = function(mode) {
        var canvasElem = document.getElementById("cm-livecanvas");
        if (canvasElem !== null) {
          PTZContorlService.deleteElementEvent(canvasElem);
          DigitalZoomService.deleteElementEvent(canvasElem);
          DigitalPTZContorlService.deleteElementEvent(canvasElem);
          if (mode === "PTZ") {
            PTZContorlService.setMode(PTZ_TYPE.ptzCommand.PTZ);
            PTZContorlService.setElementEvent(canvasElem);
          } else if (mode === "Digital PTZ") {
            DigitalPTZContorlService.setElementEvent(canvasElem);
          } else if (mode === "Digital Zoom") {
            //DigitalZoomService.setElementEvent(canvasElem);
          }
        }
      };

      this.executePTZ = function(cmd) {
        PTZContorlService.setMode(cmd);
        PTZContorlService.execute();

        if (cmd === PTZ_TYPE.ptzCommand.STOP) {
          PTZContorlService.setMode(cmd);
        }
      };

    }
  ]);