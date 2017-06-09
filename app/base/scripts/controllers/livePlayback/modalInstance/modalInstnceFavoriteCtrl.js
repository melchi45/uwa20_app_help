kindFramework.controller('ModalInstnceFavoriteCtrl', ['$scope', '$rootScope', '$uibModalInstance',
  function($scope, $rootScope, $uibModalInstance) {
    'use strict';
    var FAVORITE_STEPS = ['input', 'message', 'option'];

    $scope.favoriteNote = null;
    $scope.favoriteStep = FAVORITE_STEPS[2];

    $scope.ok = function() {
      $uibModalInstance.close();
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $rootScope.$saveOn('allpopupclose', function() {
      $uibModalInstance.dismiss('cancel');
    }, $scope);
  },
]);