/**
* streaming template controller
* @memberof kindFramework
* @ngdoc controller
* @name streamingCtrl
* @param $scope {service} scope of streamingCtrl
* @param kindStreamInterface {service} kind Stream module injection
* @fires if when of $routeProvider is streaming
* @example ng-controller="streamingCtrl"
* @example 
*    Module.config(function ($routeProvider) {
*        $routeProvider
*            .when('/streaming', {
*                controller: 'streamingCtrl'
*            })
*/
kindFramework.controller('streamingCtrl', function($scope, kindStreamInterface){

    $("#tabs").tabs();

/**
 * have array data for stream play
 * @var channelId
 * @memberof streamingCtrl
 */
    $scope.playerdata = [];
    
    angular.element("kind-stream:first-child .kind-stream-canvas").addClass("active");
/**
 * have stream channel
 * @var channelId
 * @memberof streamingCtrl
 */
    $scope.channelId = 0;
    
    angular.element(".kind-stream-canvas").bind("click",function(){
        angular.element(".kind-stream-canvas.active").removeClass('active');
        angular.element(this).addClass("active");
        $scope.channelId = angular.element("#section-video-wrap canvas").index(this);
    });
    
/**
 * this function for play stream
 * @function clickConnectButton
 * @memberof streamingCtrl
 * @example clickConnectButton() in streamingCtrl controller scope
*/
    $scope.clickConnectButton = function () {
        
/**
 * this is stream play data for play stream
 * @var changeplayerdata
 * @memberof streamingCtrl
 */
        var changeplayerdata = {
            channelId: $scope.channelId,
            server_address:"55.101.78.176:5000",
            rtspUrl: $scope.streamingInfo,
            width: $scope.streamingWidth,
            height: $scope.streamingHeight
        };
        
        $scope.playerdata[$scope.channelId] = changeplayerdata;
    }
    
/**
 * this function for stop stream
 * @function clickDisConnectButton
 * @memberof streamingCtrl
 * @example clickDisConnectButton() in streamingCtrl controller scope
*/
    $scope.clickDisConnectButton = function(){
        kindStreamInterface.stop($scope.channelId);
    }
    
    
});



