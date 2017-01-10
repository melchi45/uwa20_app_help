'use strict';

kindFramework.controller('ModalInstnceMessageCtrl',
  ['$scope', '$rootScope', '$uibModalInstance', '$sce', 'data', '$timeout','UniversialManagerService', 'CAMERA_STATUS', '$translate',
  function ($scope, $rootScope, $uibModalInstance, $sce, data, $timeout, UniversialManagerService, CAMERA_STATUS, $translate) {

    $scope.data = data;

    if(typeof(data.isHtml) === 'undefined') {
      $scope.isHtml = false;
    } else {
      $scope.isHtml = true;
    }

    if(UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
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

    $scope.checkPlayback = function(){
      if(UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
        return "modal-bottom-bar-timeline";
      }
    };

    $rootScope.$saveOn('allpopupclose', function(event) {
      $uibModalInstance.dismiss('cancel');
    }, $scope);

    /**
     * buttonCount가 2일 때는 Cancel 버튼이 존재해야 하기 때문에
     * 예외 처리를 한다.
     * Wisenet5에서는 기존 Message의 스타일을 사용하지 않고,
     * 새로운 디자인을 사용하기 때문에
     * 기존 modal의 스타일을 Reset 해준다.
     */

    if(data.buttonCount < 2){
      $uibModalInstance.rendered.then(function(){
        var transformReset = 'translate(0,0)';
        var transitionReset = 'initial';
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

        if(data.buttonCount === 1){
          tuiLoadingCancel.on("click", $uibModalInstance.close);
          tuiLoadingWrapper.on("click", function(event){
            if($(event.target).hasClass('tui-loading-wrapper')){
              $uibModalInstance.close(); 
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

        $(".modal-dialog, .modal-content")
          .css({
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            transform: transformReset,
            '-moz-transform': transformReset,
            '-webkit-transform': transformReset,
            '-o-transform': transformReset,
            transition: transitionReset,
            '-moz-transition': transitionReset,
            '-webkit-transition': transitionReset,
            '-o-transition': transitionReset,
            'background-color': 'initial'
          });

        if( data.buttonCount <= 0){
          tuiLoadingWrapper.find(".tui.tui-ch-live-info").remove();
          
          $timeout(function() {
            $uibModalInstance.close();
          }, 2000);
        }
      });
    }
}]);