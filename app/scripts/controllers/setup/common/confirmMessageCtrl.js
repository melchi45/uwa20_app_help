kindFramework.controller('confirmMessageCtrl', function ($scope, $uibModalInstance, Message)
{  
    $scope.confirmMessage = Message;
    
    $scope.ok = function ()
    {
        $uibModalInstance.close();        
    };

    $scope.cancel = function ()
    {
        $uibModalInstance.dismiss();
    };
});

kindFramework.controller('errorMessageCtrl', function ($scope, $uibModalInstance, Message, Header)
{  
    $scope.headerMessage = Header;           
    
    $scope.errorMessage = Message;
    
    $scope.ok = function ()
    {
        $uibModalInstance.close();        
    };
});

kindFramework.controller('detailMessageCtrl', function ($scope, $uibModalInstance, Message,Header,$translate)
{  
    $scope.headerMessage = Header;

    $scope.confirmMessage = $translate.instant(Message);
    
    $scope.ok = function ()
    {
        $uibModalInstance.close();        
    };

    $scope.cancel = function ()
    {
        $uibModalInstance.dismiss();
    };
});