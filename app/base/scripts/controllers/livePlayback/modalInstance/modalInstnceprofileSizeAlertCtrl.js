'use strict';
kindFramework.controller('modalInstnceprofileSizeAlertCtrl',
  ['$scope', '$rootScope', '$uibModalInstance', 'data',
  function ($scope, $rootScope, $uibModalInstance, data) {

    $scope.buttonCount = typeof (data.buttonCount) === "undefined" ? 0 : data.buttonCount;
    $scope.ok = function() {
      $uibModalInstance.close();
    };

  $rootScope.$saveOn('allpopupclose', function(event) {
    $uibModalInstance.dismiss('cancel');
  }, $scope);
}]);