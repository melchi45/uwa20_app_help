'use strict';

kindFramework.controller('modalInstnceStatusCtrl',
  ['$scope', '$rootScope', '$uibModalInstance', 'data',
  function ($scope, $rootScope, $uibModalInstance, data) {
    $scope.profileInfoList = data.profileInfoList;
    $scope.userList = data.userList;

    $scope.buttonCount = typeof (data.buttonCount) === "undefined" ? 0 : data.buttonCount;
    $scope.ok = function() {
      $uibModalInstance.close();
    };

	$rootScope.$saveOn('allpopupclose', function(event) {
		$uibModalInstance.dismiss('cancel');
	}, $scope);
}]);