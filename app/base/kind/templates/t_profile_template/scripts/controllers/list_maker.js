/**
 * profile template controller
 * @memberof kindFramework
 * @ngdoc controller
 * @name profileCtrl
 * @param $scope {service} scope of profileCtrl
 * @param listService {service} inject listSercvice
 * @param KindProfileService {service} profile common module
 * @fires if when of $routeProvider is profile
 * @example ng-controller="profileCtrl"
 * @example 
 *    Module.config(function ($routeProvider) {
 *        $routeProvider
 *            .when('/profile', {
 *                controller: 'profileCtrl'
 *            })
*/
kindFramework.controller('profileCtrl', function($scope,listService,KindProfileService){
    $("#profileTabs").tabs();
    
    /**
     * remove list in profile list
     * @function removeList
     * @memberof profileCtrl
     * @param event {object} get event target
     * @example removeList(event object)
    */
    $scope.removeList = function(event){
        
        /**
         * get li element
         * @var li
         * @memberof profileCtrl
         */
        var li = $(event.target).parent().parent().parent();
        
        /**
         * get attribute 'data-idx' of li, this 'data-idx attribute is index of profile list
         * @var index
         * @memberof profileCtrl
         */
        var index = li.attr('data-idx');
        
        listService.treeData.splice(index,1);
    }
    
    
    /**
     * profile list show or hide
     * @function displayToggle
     * @memberof profileCtrl
     * @param event {object} get event target
     * @example displayToggle(event object)
    */
    $scope.displayToggle = function(event){
        
        /**
         * get ul element
         * @var ul
         * @memberof profileCtrl
         */
        var ul = $(event.target).parent().parent().parent().siblings("ul");
        ul.toggleClass("list_display");
    };
    
    /**
     * if click 'Add list' button, get profile and snapshot
     * @function clickAddList
     * @memberof profileCtrl
     * @example clickAddList()
    */
    $scope.clickAddList = function(){
        
        /**
         * profile data for get profile, snapshot
         * @var profileSettings
         * @memberof profileCtrl
         */
        var profileSettings = {
            cameraUrl :$scope.cameraUrl,
            echoSunapiServer:'55.101.78.176:5000',
            user:$scope.cameraId,
            password : $scope.cameraPassword,
        };
        
        
        
        /**
         * get promise data of profile list 
         * @var profileList
         * @memberof profileCtrl
         */
        KindProfileService.setDeviceConnectionInfo(profileSettings);
        var profileList = KindProfileService.getProfileList();
        
        
        profileList.then(function(value){
            var datas = value.VideoProfiles[0].Profiles;
            $scope.listData = listService.setList(datas,$scope.cameraUrl);
        },function(){
            console.log('empty response, check your input');   
        });
        
    };
});

