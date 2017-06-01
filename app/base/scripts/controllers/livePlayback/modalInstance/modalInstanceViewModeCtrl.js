kindFramework.controller('ModalInstanceViewModeCtrl',
  ['$scope', '$rootScope', '$uibModalInstance', 'data',
  function ($scope, $rootScope, $uibModalInstance, data) {
	'use strict';
	$scope.viewModeList = data.viewModeList;
		
  $scope.selectViewMode = function(viewModeName) {
    $uibModalInstance.close(viewModeName);
  };
  
  $rootScope.$saveOn('allpopupclose', function() {
    $uibModalInstance.dismiss('cancel');
  }, $scope);
  
}]);