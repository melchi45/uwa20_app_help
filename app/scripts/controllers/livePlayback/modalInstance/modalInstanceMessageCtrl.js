'use strict';

kindFramework.controller('ModalInstnceMessageCtrl', ['$scope', '$rootScope', '$uibModalInstance', '$sce', 'data', '$timeout', 'UniversialManagerService', 'CAMERA_STATUS', '$translate',
  function($scope, $rootScope, $uibModalInstance, $sce, data, $timeout, UniversialManagerService, CAMERA_STATUS, $translate) {

    $scope.data = data;

    if (typeof(data.isHtml) === 'undefined') {
      $scope.isHtml = false;
    } else {
      $scope.isHtml = true;
    }

    if (UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
      $scope.modalMessagePlaybackflag = true;
    } else {
      $scope.modalMessagePlaybackflag = false;
    }

    $scope.deliberatelyTrustDangerousSnippet = function() {
      return $sce.trustAsHtml($scope.data.message);
    };

    $scope.ok = function() {
      $uibModalInstance.close();
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.checkPlayback = function() {
      if (UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
        return "modal-bottom-bar-timeline";
      }
    };

    $rootScope.$saveOn('allpopupclose', function(event) {
      $uibModalInstance.dismiss('cancel');
    }, $scope);

    /**
     * $uibModalInstance가 비정상적으로 2개이상 열릴 때
     * $uibModalInstance.close() 기능이 정상적으로 실행되지 않는다.
     * 그래서 event.target을 통해 모달을 닫아 준다.
     */
    function closeModal(event) {
      var target = $(event.target);
      if (target.hasClass('tui-loading-wrapper')) {
        target
          .parent()
          .parent()
          .parent()
          .remove();
      } else if (target.hasClass('tui-close')) {
        target
          .parent()
          .parent()
          .parent()
          .parent()
          .parent()
          .remove();
      }

      $('.modal-backdrop').remove();
      $uibModalInstance.close();
    };

    /**
     * buttonCount가 2일 때는 Cancel 버튼이 존재해야 하기 때문에
     * 예외 처리를 한다.
     * Wisenet5에서는 기존 Message의 스타일을 사용하지 않고,
     * 새로운 디자인을 사용하기 때문에
     * 기존 modal의 스타일을 Reset 해준다.
     */
    if (data.buttonCount < 2) {
      $uibModalInstance.rendered.then(function() {
        var templateHtml = [
          '<div class="tui-loading-wrapper">',
          '<div class="tui-loading">',
          '<span class="tui tui-ch-live-info"></span>',
          '<span class="tui-loading-message"></span>',
          '</div>',
          '</div>'
        ];
        var tuiLoadingWrapper = $(templateHtml.join(''));
        var tuiLoadingCancel = $('<span class="tui tui-close"></span>');
        var message = $scope.isHtml ? deliberatelyTrustDangerousSnippet() : $translate.instant(data.message);

        if (data.buttonCount === 1) {
          tuiLoadingCancel.on("click", closeModal);
          tuiLoadingWrapper.on("click", function(event) {
            if ($(event.target).hasClass('tui-loading-wrapper')) {
              closeModal(event);
            }
          });

          tuiLoadingWrapper
            .find(".tui-loading")
            .append(tuiLoadingCancel);
        }

        tuiLoadingWrapper
          .find(".tui-loading-message")
          .html(message);

        $('.modal-content > div').remove();
        $('.modal-content').append(tuiLoadingWrapper);

        $(".modal-dialog, .modal-content").
          addClass('modal-message');

        if (data.buttonCount <= 0) {
          tuiLoadingWrapper.find(".tui.tui-ch-live-info").remove();

          $timeout(function() {
            $uibModalInstance.close();
          }, 2000);
        }
      });
    }
  }
]);