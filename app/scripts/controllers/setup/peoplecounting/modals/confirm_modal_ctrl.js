"use strict";
kindFramework.controller('confirmModalCtrl', function($scope, $uibModalInstance, message, title) {
  $scope.message = message;
  $scope.title = title;

  $scope.ok = function() {
    $uibModalInstance.close();
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss();
  };
});