kindFramework.controller('confirmMessageCtrl', function ($scope, $uibModalInstance, Message, $timeout)
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

    $uibModalInstance.opened.then(function(){
        $timeout(function () {
            $scope.$digest();
        });
    });
});

kindFramework.controller('errorMessageCtrl', function ($scope, $uibModalInstance, Message, Header, $timeout)
{  
    $scope.headerMessage = Header;           
    
    $scope.errorMessage = Message;
    
    $scope.ok = function ()
    {
        $uibModalInstance.close();        
    };

    $uibModalInstance.opened.then(function(){
        $timeout(function () {
            $scope.$digest();
        });
    });
});

kindFramework.controller('detailMessageCtrl', function ($scope, $uibModalInstance, Message,Header,$translate, $timeout)
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

    $uibModalInstance.opened.then(function(){
        $timeout(function () {
            $scope.$digest();
        });
    });
});