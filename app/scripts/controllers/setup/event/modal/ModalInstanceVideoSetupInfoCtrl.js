'use strict';

kindFramework.controller('ModalInstanceVideoSetupInfoCtrl', ['$scope', '$rootScope', '$uibModalInstance', '$timeout',
  function ($scope, $rootScope, $uibModalInstance, $timeout) {

    $scope.cancel = function() {
      $uibModalInstance.close();
    };
}]);