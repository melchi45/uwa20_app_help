"use strict";
kindFramework.controller('alertModalCtrl', function ($scope, $uibModalInstance, message, title, iconClass){  
    $scope.message = message;
    $scope.title = title;
    $scope.iconClass = iconClass;
    
    $scope.ok = function (){
        $uibModalInstance.close();        
    };
});