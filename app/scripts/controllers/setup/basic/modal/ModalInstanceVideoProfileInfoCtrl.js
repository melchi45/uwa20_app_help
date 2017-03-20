'use strict';

kindFramework.controller('ModalInstanceVideoProfileInfoCtrl', ['$scope', '$rootScope', '$uibModalInstance', '$timeout',
  function ($scope, $rootScope, $uibModalInstance, $timeout) {

    $scope.cancel = function() {
      $uibModalInstance.close();
    };
}]);