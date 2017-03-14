/**
 * View
 * <live-playback-channel-selector>
 * </live-playback-channel-selector>
 *
 * Controller
 * $rootScope.$saveOn("channelSelector:selectChannel", function(event, index){
 *    console.log(index);
 * }, $scope);
 */
kindFramework.directive('channelSelector', function($rootScope) {
    "use strict";
    return {
        restrict: 'E',
        replace: true,
        scope: true,
        templateUrl: 'views/common/directives/channel_selector.html',
        link: function(scope, element, attrs){
            scope.channelSelector = {
                selectedChannel: 0,
                selectChannel: function(index){
                    $rootScope.$emit("channelSelector:selectChannel", index);
                    scope.channelSelector.selectedChannel = index;
                }
            };   
        }
    };
});

/**
 * View
 * <live-playback-channel-selector>
 * </live-playback-channel-selector>
 *
 * Quad view 버튼 사용시
 * <live-playback-channel-selector use-quad-view="true">
 * </live-playback-channel-selector>
 *
 * Controller
 * $rootScope.$saveOn("channelSelector:selectChannel", function(event, index){
 *    console.log(index);
 * }, $scope);
 *
 * $rootScope.$saveOn("channelSelector:changeQuadView", function(event){
 *    //Go to Quad mode
 * }, $scope);
 */
kindFramework.directive('livePlaybackChannelSelector', function($rootScope) {
    "use strict";
    return {
        restrict: 'E',
        replace: true,
        scope: true,
        templateUrl: 'views/livePlayback/directives/live-playback-channel-selector.html',
        link: function(scope, element, attrs){
            scope.livePlaybackChannelSelector = {
                useQuadView: attrs.useQuadView === 'true',
                changeQuadView: function(){
                    $rootScope.$emit("channelSelector:changeQuadView", true);
                }
            };   
        }
    };
});


/**
 * View
 * info 버튼 사용시 use-info="true" 를 추가 하시면 됩니다.`
 * <setup-channel-selector>
     * </setup-channel-selector>
 *
 * <setup-channel-selector use-info="true">
 * </setup-channel-selector>
 *
 * Controller
 * $rootScope.$saveOn("channelSelector:selectChannel", function(event, index){
 *    console.log(index);
 * }, $scope);
 *
 * $rootScope.$saveOn("channelSelector:showInfo", function(event){
 *    //Open popup
 * }, $scope);
 */


kindFramework.directive('setupChannelSelector', function($rootScope){
    "use strict";

    return {
        restrict: 'E',
        replace: true,
        scope: true,
        templateUrl: 'views/setup/common/setup_channel_selector.html',
        link: function(scope, element, attrs){
            scope.setupChannelSelector = {
                useInfo: attrs.useInfo === 'true',
                showInfo: function(){
                    $rootScope.$emit("channelSelector:showInfo", true);
                }
            };


        }
    };
});