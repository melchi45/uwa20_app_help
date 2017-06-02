"use strict";
kindFramework.controller('addSlaveModalCtrl', function ($scope, $uibModalInstance)
{  
    $scope.confirmTitle = 'Add Slave';
    $scope.ip = '';
    $scope.id = '';
    $scope.pw = '';
    $scope.ipTypeEnum = [
        'IPV4',
        'IPV6'
    ];
    $scope.ipType = $scope.ipTypeEnum[0];
    $scope.port = '';

    $scope.ok = function (){
        var arr = [
            'ip',
            'id',
            'pw'
        ];

        var errClass = ' has-error';
        var i = 0;
        var elem = null;
        var parent = null;
        var key = '';
        //trim
        for(i = 0; i < arr.length; i++){
            key = arr[i];
            var tmpVal = $scope[key].trim();
            elem = document.getElementById("pc-confirm-report-" + key);
            parent = elem.parentNode;
            parent.className = parent.className.replace(errClass, '');

            $scope[key] = tmpVal;
            elem.value = tmpVal;
        }

        var isOk = true;
        for(i = 0; i < arr.length; i++){
            key = arr[i];
            if($scope[key] === ''){
                elem = document.getElementById("pc-confirm-report-" + key);
                parent = elem.parentNode;
                parent.className = parent.className + errClass;
                isOk = false;
            }
        }

        if(isOk === false){
            return;
        }

        $uibModalInstance.close({
            ip: $scope.ip,
            id: $scope.id,
            pw: $scope.pw,
            ipType: $scope.ipType,
            port: $scope.port === '' ? 80 : $scope.port
        });        
    };

    $scope.cancel = function (){
        $uibModalInstance.dismiss();
    };
});