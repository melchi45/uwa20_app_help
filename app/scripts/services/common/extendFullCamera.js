"use strict";
kindFramework
.directive("extendFullCamera",['kindStreamInterface','UniversialManagerService',
	function(kindStreamInterface,UniversialManagerService){
		return {
			require: '^fullCamera',
			url : '<div></div>',
			restrict: 'A',
			link:function(scope, element, attrs) {
        scope.closeFullScreen = function() {
        	scope.navigationInit();
        };
        scope.actions = {
        	controlAudio : function(data) {
        		kindStreamInterface.controlAudio(data);
        	}
        };
        
       	scope.afterActionCapture = function() {
          UniversialManagerService.setIsCaptured(false); // reset isCaptured
          UniversialManagerService.setIsCapturedScreen(true); // set isCapturedScreen
          kindStreamInterface.setResizeEvent();
	      };
			},
		};
}]);