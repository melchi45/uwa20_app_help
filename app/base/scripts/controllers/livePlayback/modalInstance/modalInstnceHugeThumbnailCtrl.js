"use strict";

kindFramework.controller('ModalHugeThumbnailCtrl',
	['$scope', '$rootScope', '$uibModalInstance', 'data', '$timeout',
	function ($scope, $rootScope, $uibModalInstance, data, $timeout) {

		$scope.name = data.channelName;

		$scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
	
		$rootScope.$saveOn('allpopupclose', function(event) {
			$uibModalInstance.dismiss('cancel');
		}, $scope);

		var getSize = function() {
			_size = ($(window).width() > $(window).height()) ? $(window).height()/2 : $(window).width()/2;

			return _size;
		}

		$scope.style = {
			"background-image" : data.path,
			"background-size" : "cover",
			"width" : getSize(),
			"height" : getSize(),
		}
}]);