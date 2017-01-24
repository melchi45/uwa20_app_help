'use strict';

kindFramework.controller('ModalInstncePresetListCtrl',
  ['$scope', '$rootScope', '$uibModalInstance', 'data', 'UniversialManagerService',
  function ($scope, $rootScope, $uibModalInstance, data, UniversialManagerService) {

    $scope.ModalList = data.list;
    $scope.homeAction = data.homeAction;
    $scope.buttonCount = typeof (data.buttonCount) === "undefined" ? 0 : data.buttonCount;
    if(UniversialManagerService.getViewModeType() === "QuadView") {
      $scope.addingEnabled = false;
      $scope.homeEnabled = false;
    } else {
      $scope.addingEnabled = true;
      $scope.homeEnabled = true;
    }

    $scope.addAction = function() {
      data.addAction();
      $uibModalInstance.close();
    };
    
    $scope.select = function (data){
      $uibModalInstance.close(data);
    };

    $scope.ok = function() {
      $uibModalInstance.close();
    }; 
     
    $rootScope.$saveOn('allpopupclose', function(event) {
      $uibModalInstance.dismiss('cancel');
    }, $scope);
}]);