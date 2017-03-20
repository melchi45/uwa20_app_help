kindFramework.directive('overlayCanvas', function(
  $timeout, kindStreamInterface, ExtendChannelContainerService, $rootScope, UniversialManagerService, PTZContorlService, PTZ_TYPE){
  "use strict";
  return {
    restrict: 'E',
    scope: false,
    template: "<canvas id='cm-livecanvas'></canvas>",
    link: function(scope, element, attrs){
      var cvs = $("#cm-livecanvas")[0],
      ctx = null,
      rotateCheck = false;

      function callbackPixelCount(x, y, width, height) {
        ctx.clearRect(0, 0, parseInt(cvs.width, 10), parseInt(cvs.height, 10));

        ctx.beginPath();
        ctx.rect(x, y, -width, -height);
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#0f0";
        ctx.font = "10pt Tahoma";
        ctx.fillStyle = "#0f0";
        ctx.stroke();

        var resolution = UniversialManagerService.getProfileInfo().Resolution.split("x");

        var textX = (width > 0 ? x - width : x) + 7;
        var textY = (height > 0 ? y - height : y) + 20;

        width = Math.floor((resolution[rotateCheck ? 1: 0] * width) / cvs.clientWidth);
        height = Math.floor((resolution[rotateCheck ? 0: 1] * height) / cvs.clientHeight);

        ctx.fillText(Math.abs(width) + " x " + Math.abs(height), textX, textY);
      }      

      scope.pixelCountInit = function(){
        ctx = cvs.getContext("2d");

        ctx.clearRect(0, 0, parseInt(cvs.width, 10), parseInt(cvs.height, 10));
        ctx.font = "10pt Tahoma";
        ctx.fillStyle = "#0f0";
        ctx.fillText("0 x 0", 10, 21);

        var rotate = UniversialManagerService.getRotate();
        if (rotate === "90" || rotate === "270") {
          rotateCheck = true;
        }
      };

      function callbackManualTracking (event) {
          if(event.target.id !== "cm-livecanvas") return;

          //마우스 오른쪽 버튼만 허용
          if(event.button != 2) return;

          PTZContorlService.setMode(PTZ_TYPE.ptzCommand.TRACKING);
          PTZContorlService.setManualTrackingMode("True");
          $rootScope.$emit('livePTZControl::command', "manualTracking", true);

          var canvas = document.getElementsByTagName("channel_player")[0].getElementsByTagName("canvas")[0];
          var xPos = event.offsetX;
          var yPos = event.offsetY;

          if(xPos >=0  && yPos >= 0) {
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

      $rootScope.$saveOn("overlayCanvas::setSize", function(event, width, height) {
          cvs.width = width;
          cvs.height = height;
      });

      $rootScope.$saveOn("overlayCanvas::command", function(event, mode, boolEnable) {
          switch (mode)
          {
              case "pixelCount" :
                 PTZContorlService.setPTZAreaZoom("off");
                 PTZContorlService.deleteElementEvent(cvs);

                 ExtendChannelContainerService.setPixelCounterService(boolEnable, callbackPixelCount);
                 scope.pixelCountInit();
                 $rootScope.$emit('livePTZControl::command', "pixelCount", boolEnable);
                break;
              case "manualTracking" :
                 ExtendChannelContainerService.setManualTrackingService(boolEnable, callbackManualTracking);
                break;
              case "areaZoomMode":
                 ExtendChannelContainerService.setPixelCounterService(false, callbackManualTracking);
                 scope.pixelCountInit();

                 if(boolEnable)
                 {
                    PTZContorlService.setPTZAreaZoom("on");
                    PTZContorlService.setElementEvent(cvs);
                 }
                 else
                 {
                    PTZContorlService.setPTZAreaZoom("off");
                    PTZContorlService.deleteElementEvent(cvs);
                 }
                break;
          }
      });
    }
  };
});