/**
 * snapshot template controller
 * @memberof kindFramework
 * @ngdoc controller
 * @name snapshotCtrl
 * @param $scope {service} scope of snapshotCtrl
 * @param listService {service} inject listSercvice
 * @param KindProfileService {service} profile common module
 * @fires if when of $routeProvider is snapshot
 * @example ng-controller="snapshotCtrl"
 * @example 
 *    Module.config(function ($routeProvider) {
 *        $routeProvider
 *            .when('/snapshot', {
 *                controller: 'snapshotCtrl'
 *            })
*/
kindFramework.controller('snapshotCtrl', function($scope,listService,KindProfileService){
    $("#snapshotTabs").tabs();
    
    
    
    
    /**
     * if click 'Show Snapshot' button
     * @function clickAddList
     * @memberof snapshotCtrl
     * @example clickAddList()
    */
    $scope.clickAddList = function(){
        
        /**
         * snapshot data for get image src
         * @var snapshotData
         * @memberof snapshotCtrl
         */
        $scope.snapshotData = {
            cameraUrl :$scope.cameraUrl,
            echo_sunapi_server:'55.101.78.176:5000',
            user:$scope.cameraId,
            password : $scope.cameraPassword,
        };
        
    };
});

        
