/* global SketchManager, setInterval, clearInterval, getClientIP */
kindFramework
    .directive('livePlaybackCommon', ['$timeout',
    function($timeout){
    'use strict';
    return{
        restrict: 'E',
        scope: false,
        templateUrl: './views/livePlayback/directives/live-playback-common.html',
        link:function(scope, elem, attrs){
        }
    };
}]);