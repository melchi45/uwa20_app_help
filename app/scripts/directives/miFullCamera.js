/*global Fisheye3D */
kindFramework.directive('miFullCamera', function(
  $timeout, kindStreamInterface
) {
  "use strict";
  return {
    restrict: 'E',
    scope: false,
    templateUrl: 'views/livePlayback/directives/mi-full-camera.html',
    link: function(scope, element, attrs) {
      var threeCanvas = null;
      scope.$parent.play3d = function() {
        console.log("play 3d");
        var live = null;
        live = document.getElementById("livecanvas");
        if (live === null || typeof live === "undefined") {
          live = document.getElementById("livevideo");
        }

        threeCanvas = new Fisheye3D();
        threeCanvas.init(live);
        threeCanvas.animate();
      };

      scope.$parent.stop3d = function() {
        console.log("stop 3d");
        threeCanvas.stop();
        threeCanvas = null;
      };
    },
  };
});