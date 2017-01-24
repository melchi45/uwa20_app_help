'use strict';
kindFramework.controller('modalInstnceLogoutCtrl',
  ['$scope', '$rootScope', '$uibModalInstance', 'data',
  function ($scope, $rootScope, $uibModalInstance, data) {

  $scope.ok = function() {
    $uibModalInstance.close();
  };  

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };
  
  $rootScope.$saveOn('allpopupclose', function(event) {
    $uibModalInstance.dismiss('cancel');
  }, $scope);
}]);