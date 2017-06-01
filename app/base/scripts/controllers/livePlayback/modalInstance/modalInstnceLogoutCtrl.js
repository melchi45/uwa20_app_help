'use strict';
kindFramework.controller('modalInstnceLogoutCtrl',
  ['$scope', '$rootScope', '$uibModalInstance', 
  function ($scope, $rootScope, $uibModalInstance) {

  $scope.ok = function() {
    $uibModalInstance.close();
  };  

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
  
  $rootScope.$saveOn('allpopupclose', function() {
    $uibModalInstance.dismiss('cancel');
  }, $scope);
}]);