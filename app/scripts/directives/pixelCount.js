kindFramework.directive('pixelCount', function(
  $timeout, kindStreamInterface, ExtendChannelContainerService, $rootScope, UniversialManagerService){
  "use strict";
  return {
    restrict: 'E',
    scope: false,
    template: "<canvas id='cm-livecanvas'></canvas>",
    link: function(scope, element, attrs){
      var cvs = $("#cm-livecanvas")[0],
      ctx = null,
      rotateCheck = false;

      function callback(x, y, width, height) {
        ctx.clearRect(0, 0, parseInt(cvs.width, 10), parseInt(cvs.height, 10));

        ctx.beginPath();
        ctx.rect(x, y, -width, -height);
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#0f0";
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
        ctx.font = "10pt Tahoma";
        ctx.fillStyle = "#0f0";

        ctx.clearRect(0, 0, parseInt(cvs.width, 10), parseInt(cvs.height, 10));
        ctx.fillText("0 x 0", 10, 21);

        var rotate = UniversialManagerService.getRotate();
        if (rotate === "90" || rotate === "270") {
          rotateCheck = true;
        }
      };

      scope.pixelCountSetSize = function(width, height) {
        cvs.width = width;
        cvs.height = height;
        scope.pixelCountInit();
      };

      $rootScope.$saveOn("pixelCount::setSize", function(event, width, height) {
        scope.pixelCountSetSize(width, height);
      });

      ExtendChannelContainerService.setPixelCounterService(callback);
    }
  };
});