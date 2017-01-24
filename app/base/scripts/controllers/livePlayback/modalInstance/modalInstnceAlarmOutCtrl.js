kindFramework.controller('ModalInstnceAlarmOutCtrl',
  ['$scope', '$uibModalInstance', 'data', '$rootScope',
  function ($scope, $uibModalInstance, data, $rootScope) {

  $scope.alarmList = data.alarmList;
  $scope.keys = data.keys;

  $scope.selectAlarm = function(alarmIndex) {
    console.log(alarmIndex + " is selected");
    $uibModalInstance.close(alarmIndex);
  }
  
  $rootScope.$saveOn('allpopupclose', function(event) {
    $uibModalInstance.dismiss('cancel');
  }, $scope);
  
}]);