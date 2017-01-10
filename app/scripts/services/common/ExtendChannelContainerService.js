'use strict';
/**/
kindFramework
.service('ExtendChannelContainerService', 
	['DigitalZoomService', 'DigitalPTZContorlService',
	'PTZContorlService','PTZ_TYPE', 'PixelCounterService',
	function(DigitalZoomService, DigitalPTZContorlService,
		PTZContorlService, PTZ_TYPE, PixelCounterService){
		var isPc = true;
		this.getIsPcValue = function() {
			return isPc;
		};
		this.setDigitalZoomService = function() {
      var canvasElem = document.getElementById("livecanvas");
      if (canvasElem !== null) {
        DigitalZoomService.deleteElementEvent(canvasElem);
        DigitalZoomService.setElementEvent(canvasElem);
      }
		};

    this.setPixelCounterService = function(callbackFunc) {
      var canvasElem = document.getElementById("cm_livecanvas");
      if (canvasElem !== null) {
        PixelCounterService.deleteElementEvent(canvasElem);
        PixelCounterService.setElementEvent(canvasElem);
        PixelCounterService.setCallbackFunc(callbackFunc);
      }
    };

		this.enablePTZ = function(mode) {
      var canvasElem = document.getElementById("livecanvas");
      if (canvasElem !== null) {
        PTZContorlService.deleteElementEvent(canvasElem);
        DigitalZoomService.deleteElementEvent(canvasElem);
        DigitalPTZContorlService.deleteElementEvent(canvasElem);
        if (mode === "PTZ") {
          PTZContorlService.setMode(PTZ_TYPE.ptzCommand.PTZ);
          PTZContorlService.setElementEvent(canvasElem);
        } 
        else if (mode === "Digital PTZ")
        {
          DigitalPTZContorlService.setElementEvent(canvasElem);
        }
        else if(mode === "Digital Zoom")
        {
          DigitalZoomService.setElementEvent(canvasElem);
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

}]);