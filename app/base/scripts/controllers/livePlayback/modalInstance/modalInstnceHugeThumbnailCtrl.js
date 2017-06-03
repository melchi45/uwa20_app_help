"use strict";

kindFramework.controller('ModalHugeThumbnailCtrl', ['$scope', '$rootScope', '$uibModalInstance', 'data',
  function($scope, $rootScope, $uibModalInstance, data) {

    $scope.name = data.channelName;

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $rootScope.$saveOn('allpopupclose', function() {
      $uibModalInstance.dismiss('cancel');
    }, $scope);

    var getSize = function() {
      var _size = ($(window).width() > $(window).height()) ? $(window).height() / 2 : $(window).width() / 2;

      return _size;
    };

    $scope.style = {
      "background-image": data.path,
      "background-size": "cover",
      "width": getSize(),
      "height": getSize(),
    }
  }
]);