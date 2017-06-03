kindFramework.directive('miFullCamera', function(
  $timeout, kindStreamInterface
) {
  "use strict";
  return {
    restrict: 'E',
    scope: false,
    templateUrl: 'views/livePlayback/directives/mi-full-camera.html',
    link: function(scope, element, attrs) {
      var three_canvas = null;
      scope.$parent.play3d = function() {
        console.log("play 3d");
        var live = null;
        live = document.getElementById("livecanvas");
        if (live === null || live === undefined) {
          live = document.getElementById("livevideo");
        }

        three_canvas = new Fisheye3D();
        three_canvas.init(live);
        three_canvas.animate();
      };

      scope.$parent.stop3d = function() {
        console.log("stop 3d");
        three_canvas.stop();
        three_canvas = null;
      };
    }
  };
});