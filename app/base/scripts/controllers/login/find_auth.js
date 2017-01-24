"use strict";

kindFramework
    .controller('FindAuthCtrl', function($scope, FindAuthModel){
				var FindAuthModel = new FindAuthModel();
	
        $scope.infoMessage = '';
        $scope.setInfoMessage = function(msg){
            $scope.infoMessage = msg;
        };
    
        $scope.findRadio = {
            userId: true,
            password: false
        };
    
        $scope.changeFindUserId = function(){
            $scope.setInfoMessage(FindAuthModel.getFindIdMessage());
            
            $scope.findRadio = {
                userId: true,
                password: false
            };
        };
	
				$scope.changeFindUserId();
	
        $scope.changeFindPassword = function(){
            $scope.setInfoMessage(FindAuthModel.getFindPwdMessage());
            
            $scope.findRadio = {
                userId: false,
                password: true
            };
        };
    });