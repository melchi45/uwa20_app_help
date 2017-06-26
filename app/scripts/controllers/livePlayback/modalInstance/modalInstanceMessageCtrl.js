'use strict';

kindFramework.controller('ModalInstnceMessageCtrl', ['$scope', '$rootScope',
  '$uibModalInstance', '$sce', 'data', '$timeout', 'UniversialManagerService',
  'CAMERA_STATUS', '$translate',
  function ($scope, $rootScope, $uibModalInstance, $sce, data, $timeout,
    UniversialManagerService, CAMERA_STATUS, $translate) {
    var TIMEOUT = 2000;
    var LOADING_OPTION = 2;
    $scope.data = data;

    if (typeof (data.isHtml) === 'undefined') {
      $scope.isHtml = false;
    } else {
      $scope.isHtml = true;
    }

    if (UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
      $scope.modalMessagePlaybackflag = true;
    } else {
      $scope.modalMessagePlaybackflag = false;
    }

    $scope.deliberatelyTrustDangerousSnippet = function () {
      return $sce.trustAsHtml($scope.data.message);
    };

    $scope.ok = function () {
      $uibModalInstance.close();
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.checkPlayback = function () {
      if (UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
        return "modal-bottom-bar-timeline";
      }
    };

    $rootScope.$saveOn('allpopupclose', function (event) {
      $uibModalInstance.dismiss('cancel');
    }, $scope);

    /**
     * $uibModalInstance�� ������������ 2���̻� ���� ��
     * $uibModalInstance.close() ����� ���������� ������� �ʴ´�.
     * �׷��� event.target�� ���� ����� �ݾ� �ش�.
     */
    function closeModal(event) {
      var target = $(event.target);
      if (target.hasClass('tui-loading-wrapper')) {
        target.
        parent().
        parent().
        parent().
        remove();
      } else if (target.hasClass('tui-close')) {
        target.
        parent().
        parent().
        parent().
        parent().
        parent().
        remove();
      }

      $('.modal-backdrop').remove();
      $uibModalInstance.close();
    }

    /**
     * buttonCount�� 2�� ���� Cancel ��ư�� �����ؾ� �ϱ� ������
     * ���� ó���� �Ѵ�.
     * Wisenet5������ ���� Message�� ��Ÿ���� ������� �ʰ�,
     * ���ο� �������� ����ϱ� ������
     * ���� modal�� ��Ÿ���� Reset ���ش�.
     */
    if (data.buttonCount < LOADING_OPTION) {
      $uibModalInstance.rendered.then(function () {
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
        var message = $scope.isHtml ? 
                    $scope.deliberatelyTrustDangerousSnippet() : 
                    $translate.instant(data.message);

        if (data.buttonCount === 1) {
          tuiLoadingCancel.on("click", closeModal);
          tuiLoadingWrapper.on("click", function (event) {
            if ($(event.target).hasClass('tui-loading-wrapper')) {
              closeModal(event);
            }
          });

          tuiLoadingWrapper.
            find(".tui-loading").
            append(tuiLoadingCancel);
        }

        tuiLoadingWrapper.
          find(".tui-loading-message").
          html(message);

        $('.modal-content > div').remove();
        $('.modal-content').append(tuiLoadingWrapper);

        $(".modal-dialog, .modal-content").
        addClass('modal-message');

        if (data.buttonCount <= 0) {
          tuiLoadingWrapper.find(".tui.tui-ch-live-info").remove();

          $timeout(function () {
            $uibModalInstance.close();
          }, TIMEOUT);
        }
      });
    }
  }
]);