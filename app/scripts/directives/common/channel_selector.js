kindFramework.directive('channelSelector', function($rootScope) {
    "use strict";
    return {
        restrict: 'E',
        replace: true,
        scope: true,
        templateUrl: 'views/common/directives/channel_selector.html',
        link: function(scope, element, attrs){
            var selectChannel = attrs.selectChannel;
            
            scope.channelSelector = {
                selectChannel: function(index){
                    $rootScope.$emit("channelSelector:selectChannel", index);
                },
                changeQuadView: function(){
                    $rootScope.$emit("channelSelector:changeQuadView", true);
                }
            };   
        }
    };
});