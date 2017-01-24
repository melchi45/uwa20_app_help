'use strict';


kindFramework.directive('loadingBar', function() {
	return {
		restrict: 'E',
		transclude: true,
		replace: true,
		scope: {
			isLoading: '='
		},
		templateUrl: 'views/livePlayback/directives/loadingBar_template.html',
		link: function(scope, element, attr) {
			scope.$watch('isLoading', function(newVal, oldVal) {
				console.log('loadingBar ::', oldVal, '>>>', newVal);
			});
		}
	};
});