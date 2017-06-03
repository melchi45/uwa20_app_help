/*global setTimeout*/
kindFramework.directive('channelsWrapper', ['$rootScope', '$timeout',
  function($rootScope, $timeout) {
    "use strict";
    return {
      restrict: 'E',
      scope: {
        'getImage': '&',
        'selectedGotoChannel': '&',
        'openFullScreen': '&',
        'isShow': '=',
        'layout': '@',
        'height': '=',
        'enableGoto': '=',
        'zoomMode': '=',
        'playerdata': '=',
        'channelPositionInfoCallback': '&',
        'playPlayback': '&',
        'requestSelectedChannel': '&',

      },
      transclude: true,
      templateUrl: 'views/livePlayback/directives/channels-wrapper.html',
      controller: function($scope) {
        this.openFullScreen = function(event, info) {
          $scope.openFullScreen({
            'event': event,
            'info': info
          });
        };
        this.selectedGotoChannel = function(info) {
          $scope.selectedGotoChannel({
            'info': info
          });
        };
        this.playPlayback = function(cmd) {
          $scope.playPlayback({
            "command": cmd
          });
        };
        this.requestSelectedChannel = function(info) {
          $scope.requestSelectedChannel({
            'info': info
          });
        };
      },
      link: function(scope, element, attrs) {

        /******************************
        call changed element size
        case 1. resize window
        case 2. open navigation
        ******************************/
        scope.isTransParent = isPhone;

        var setElementHeight = function() {
          var elem = element[0];
          var style = element.children()[0].style;
          var width = elem.offsetWidth;
          var height = 0;
          var rect = elem.getClientRects()[0];
          //use fixed css value
          var info = {
            'scale': 0.64,
            'offset': -0.04,
            'margin': 0.06,
          };
          if (isPhone) {
            if (typeof(rect) === 'undefined') return;
            var body = angular.element('body')[0];
            var bodyWidth = body.clientWidth;
            var bodyHeight = body.clientHeight;
            var ratio = bodyHeight > bodyWidth ?
              bodyWidth / bodyHeight : bodyHeight / bodyWidth;
            height = width * ratio;
            info.scale = rect.width / bodyWidth;
            //info.offsetPx = (rect.top + height/2) - bodyHeight/2;
            //info.offset = info.offsetPx/bodyHeight;
          } else {
            var streamCanvas = element.find(".kind-stream-canvas")[0];
            height = width * (9 / 16);
            style.width = (width < 320 && width !== 0) ? 320 + "px" : 'initial';
          }
          info.height = (height > 10) ? height : 'initial';
          if (scope.isShow === 'show') scope.channelPositionInfoCallback({
            'info': info
          });
          if (height !== 0) style.height = info.height + "px";
        };

        /******************************
        case 1. resize window
        ******************************/
        scope.$on('resize::resize', function() {
          if (isPhone) {
            setElementHeight();
          }
        });

        $rootScope.$saveOn("resize channels-wrapper in channelsWrapper.js", function() {
          if (isPhone) {
            setElementHeight();
          }
        }, scope);

        /******************************
        watch one/four/nine/sixteen channles layout
        ******************************/
        // scope.$watch(function() { return scope.layout; }, function(newVal, oldVal) {
        //   if(newVal === oldVal) return false;
        //   $timeout(function() {
        //     scope.$apply();
        //   });
        // });

        // //Initialize
        // setTimeout( function() {
        //   scope.$apply();
        // }, 0);

        if (isPhone) {
          setElementHeight();
        }
      }
    };
  }
]);