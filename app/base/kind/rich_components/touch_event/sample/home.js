var kindFramework = angular.module('kindFramework', []);

kindFramework
.controller('HomeCtrl', ['$scope',function($scope) {
    $scope.changeUse = function(item){
        item.isUse = !item.isUse;
    };

    $scope.groups = [
        {
            name: 'Heading 1',
            childs: [
                {
                    name: 'Child 1',
                    isUse: false
                },
                {
                    name: 'Child 2',
                    isUse: true
                }
            ]
        },
        {
            name: 'Heading 2',
            childs: [
                {
                    name: 'Child 1',
                    isUse: false
                },
                {
                    name: 'Child 2',
                    isUse: true
                },
                {
                    name: 'Child 3',
                    isUse: false
                }
            ]
        }
    ];

    $scope.clickTap = function(){
        console.log("clickTap");
    };

    $scope.pressCallback = function(event){
        console.log(event);
    };
}]);