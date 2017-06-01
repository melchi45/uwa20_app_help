'use strict';
kindFramework.controller('ModalInstnceMobilePresetCtrl',
  ['$scope', '$uibModalInstance', 'data', '$rootScope',
  function ($scope, $uibModalInstance, data, $rootScope) {

  $scope.presetList = data.presetList;
  $scope.selectedPreset = -1;

  $scope.selectPreset = function(presetIndex) {
    console.log(presetIndex + " is selected");
    $uibModalInstance.close(presetIndex);
  };
  
  $rootScope.$saveOn('allpopupclose', function() {
    $uibModalInstance.dismiss('cancel');
  }, $scope);

}]);