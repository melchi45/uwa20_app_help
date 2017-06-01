"use strict";

kindFramework.
  controller('FindAuthCtrl', function($scope, FindAuthModel){
				var findAuthModel = new FindAuthModel();
	
        $scope.infoMessage = '';
        $scope.setInfoMessage = function(msg){
            $scope.infoMessage = msg;
        };
    
        $scope.findRadio = {
            userId: true,
            password: false
        };
    
        $scope.changeFindUserId = function(){
            $scope.setInfoMessage(findAuthModel.getFindIdMessage());
            
            $scope.findRadio = {
                userId: true,
                password: false
            };
        };
	
				$scope.changeFindUserId();
	
        $scope.changeFindPassword = function(){
            $scope.setInfoMessage(findAuthModel.getFindPwdMessage());
            
            $scope.findRadio = {
                userId: false,
                password: true
            };
        };
    });