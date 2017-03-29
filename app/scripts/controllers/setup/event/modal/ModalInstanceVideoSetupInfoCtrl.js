'use strict';

kindFramework.controller('ModalInstanceVideoSetupInfoCtrl', ['$scope', '$rootScope', '$uibModalInstance', '$timeout', 'infoTableData',
  function ($scope, $rootScope, $uibModalInstance, $timeout, infoTableData) {

	$scope.tableDataOrder = [
		'mirror',
		'flip',
		'hallwayView',
		'videoOutput',
		'privacyMask'
	];

  	$scope.infoTableData = infoTableData;

    $scope.cancel = function() {
      $uibModalInstance.close();
    };
}]);