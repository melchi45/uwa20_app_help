kindFramework.controller('ModalInstnceProfileCtrl',
  ['$scope', '$rootScope', '$uibModalInstance', 'data',
  function ($scope, $rootScope, $uibModalInstance, data) {
  'use strict';
  $scope.profileList = angular.copy(data.profileList); //Must be deep-copied to maintain profile list
  $scope.selected = angular.copy(data.profileInfo); //Must be deep-copied.

  $scope.selectProfile = function(profile) {
    $uibModalInstance.close(angular.copy(profile));
  };
  
  $rootScope.$saveOn('allpopupclose', function(event) {
    $uibModalInstance.dismiss('cancel');
  }, $scope);
  
}]);