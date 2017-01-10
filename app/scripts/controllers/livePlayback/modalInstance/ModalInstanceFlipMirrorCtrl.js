'use strict';
kindFramework
.controller('ModalInstnceFlipMirrorCtrl',['$controller','$scope','$rootScope',
	'UniversialManagerService','CAMERA_STATUS','ModalManagerService',
	'$uibModalInstance',
	function($controller,$scope,$rootScope,UniversialManagerService,
	CAMERA_STATUS,ModalManagerService,$uibModalInstance){
		var self = this;

		BaseModalFlipMirror.prototype.flipMirror = function(Angle){
      $rootScope.$emit('changeLoadingBar', false);
      $uibModalInstance.close();		
		};

		angular.extend(this, $controller('BaseModalFlipMirror',{
			$scope:$scope, $rootScope:$rootScope, UniversialManagerService:UniversialManagerService,
			CAMERA_STATUS:CAMERA_STATUS, ModalManagerService:ModalManagerService,
			$uibModalInstance:$uibModalInstance
		}));

}]);