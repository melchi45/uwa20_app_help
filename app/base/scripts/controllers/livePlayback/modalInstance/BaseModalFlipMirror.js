'use strict';
function BaseModalFlipMirror($scope,$rootScope,UniversialManagerService,
	CAMERA_STATUS,ModalManagerService,$uibModalInstance) {
  $scope.isNormal = false;
  $scope.isMirror = false;
  $scope.isFlip = false;
  $scope.isFlipMirror = false;

  $scope.selectFlipMirror = function(Angle){
    if(UniversialManagerService.getPlayStatus() === CAMERA_STATUS.PLAY_STATUS.STOP)
    {
      ModalManagerService.open('message', { 'buttonCount': 0, 'message': "lang_appNotRunning" } );
      $uibModalInstance.dismiss();
      return;
    }
    switch(Angle){
      case 'normal': //normal
        if($scope.isNormal === true) { return; }
        console.log("Trying Set to Normal");
      break;
      case 'flip': //flip
        if($scope.isFlip === true) { return; }
        console.log("Trying Set to Flip");
      break;
      case 'mirror': //mirror
        if($scope.isMirror === true) { return; }
        console.log("Trying Set to Mirror");
      break;
      case 'flip_mirror': //flip_mirror
        if($scope.isFlipMirror === true) { return; }
        console.log("Trying Set to Flip Mirror");
    }
    $rootScope.$emit('changeLoadingBar', true);
    this.flipMirror(Angle);
  };

  $rootScope.$saveOn('allpopupclose', function() {
    $uibModalInstance.dismiss();
  }, $scope);
}
BaseModalFlipMirror.prototype.flipMirror = function(){};

kindFramework.controller('BaseModalFlipMirror',['$scope','$rootScope',
	'UniversialManagerService','CAMERA_STATUS','ModalManagerService',
	'$uibModalInstance',BaseModalFlipMirror
]);
