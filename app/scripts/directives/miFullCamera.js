kindFramework.directive('miFullCamera', function(
 $timeout, UniversialManagerService
 ){
  "use strict";
  return {
    restrict: 'E',
    scope: false,
    templateUrl: 'views/livePlayback/directives/mi-full-camera.html',
    link: function(scope, element, attrs){
      var threeCanvas = null;
      scope.$parent.play3d = function() {
        console.log("play 3d");
        var live = null;
        if (UniversialManagerService.getVideoMode() === "video") {
          live = document.getElementById("livevideo");
        } else {
          live = document.getElementById("livecanvas");
        }
        
        // live = document.getElementById("livecanvas");
        // if (live == null || live == undefined) {
        //  live = document.getElementById("livevideo");
        // }

        if (threeCanvas === null){
          var isWallMode = scope.fisheyeMode === scope.fisheyeModeList[0]? true : false;
          threeCanvas = new Fisheye3D(isWallMode);
          threeCanvas.init(live,document.getElementById( 'mi-full-camera' ));
          threeCanvas.start();
        }
      };

      scope.$parent.stop3d = function() {
        console.log("stop 3d");
        threeCanvas.stop();
        threeCanvas = null;
      }
    }
  };
});
