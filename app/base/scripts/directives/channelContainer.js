/*global clearTimeout, setTimeout*/
kindFramework.directive('channelContainer', ['$rootScope', '$window','PLAYBACK_TYPE','PTZ_TYPE',
  'SearchDataModel','PlayDataModel','ExtendChannelContainerService','$timeout',
  function($rootScope,$window,PLAYBACK_TYPE, PTZ_TYPE,
    SearchDataModel, PlayDataModel,ExtendChannelContainerService, $timeout) {
    "use strict";
    return {
      require: '^channelsWrapper',
      restrict: 'E',
      replace: true,
      scope: {
        'enableGoto': '=',
        'zoomMode': '=',
        'playerdata': '=',
        'isShow': '=',
      },
      templateUrl: 'views/livePlayback/directives/channel-container.html',
      link: function(scope, element, attrs, wrapperController) {
        /******************************
        at double click/touch
        callback full screen caller controller
        ******************************/
        scope.isTransParent = isPhone;
        scope.disableButton = false;
        var PLAY_CMD = PLAYBACK_TYPE.playCommand;
        scope.play = function() {
          if( playback.status === 'play') return;
          playback.status = 'play';
          playback.changeButtonVisible();
          wrapperController.playPlayback(PLAY_CMD.PLAY);
        };
        scope.pause = function() {
          if( playback.status === 'pause') return;
          playback.status = 'pause';
          playback.changeButtonVisible();
		      wrapperController.playPlayback(PLAY_CMD.PAUSE);
        };
        var playback = {
          playButton: angular.element(element).find('button.button-play'),
          pauseButton: angular.element(element).find('button.button-pause'),
          status: 'stop',
          changeButtonVisible: function() {
            switch(playback.status) {
              case 'play':
                angular.element(playback.playButton).css('display', 'none');
                angular.element(playback.pauseButton).css('display', 'inline-block');
                break;
              case 'pause':
                angular.element(playback.playButton).css('display', 'inline-block');
                angular.element(playback.pauseButton).css('display', 'none');
                break;
              case 'stop':
                angular.element(playback.playButton).css('display', 'inline-block');
                angular.element(playback.pauseButton).css('display', 'none');
                break;
            }
          },
        };

        //set initial status.
        playback.changeButtonVisible();

        /******************************
        select current channel for gotochannel
        @channel : temporary
        ******************************/
        scope.selectedChannel = function(event) {
          event.preventDefault();
          var mousePosition = event.pointers[0];
          var info ={
            'clickedX': mousePosition.clientX,
            'clickedY': mousePosition.clientY
          };
          wrapperController.selectedGotoChannel(info);
        };

        var searchData = new SearchDataModel();

        /******************************
        watch enable playback mode
        ******************************/
        scope.$watch(function() { return searchData.getWebIconStatus(); }, function(newVal, oldVal) {
          if( newVal === null || newVal === oldVal) return;
          scope.enablePlayback = newVal;
        });
        /*
        * Check playback status and sync for changing play button
        */ 
        $rootScope.$saveOn('app/scripts/models/playback/PlayDataModel::changeButtonStatus', function(event, data) {
          if( playback.status === data ) return;
          if( data === 'stop' ) {
            playback.status = data;
            playback.changeButtonVisible();
          }
          else if( data === 'play') {
            playback.status = data;
            playback.changeButtonVisible();
          }
        }, scope);

        $rootScope.$saveOn('app/scripts/services/playbackClass::disableButton', function(event, data) {
          if( scope.disableButton !== data ) {
            scope.disableButton = data;
          }
        }, scope);
        /******************************
        interaction events handlers.........
        todo: want to change service or directive
        ******************************/
        var touchAction;
        scope.doubleTapcallBack = function(event) {
          console.log("KIND TOUCH DOUBLE TAP");
          if(scope.isShow !== 'show') return;
          if(event.target.tagName === "DIV" || event.target.tagName === "CANVAS" || typeof event.fullButton !== undefined) {
            if(event.clientX !== undefined){
              var info ={
                'clickedX': event.clientX,
                'clickedY': event.clientY
              };
            }else{
              var info ={
                'clickedX': 0,
                'clickedY': 51
              };
            }
            openFullScreen(event, info);
            clearTimeout(touchAction);
          }
        };

        $rootScope.$saveOn("channelContainer:openFullscreenButton", function(event, e) {
          scope.doubleTapcallBack(e);
        }, scope);

        function openFullScreen(){
          scope.displayInfo = "full-screen";
          wrapperController.openFullScreen.apply(wrapperController, arguments);
        }

        /**
         * 플러그인에서 Full screen 열기를 접근 하기 위해 bind을 해준다.
         * @example
         *   $(".channel-container").trigger("openfullscreen");
         */
        // $timeout(function(){
        //   $('.channel-container').bind("openfullscreen", openFullScreen);
        // });
        
        var lastTouchData;
        var TOUCH_TIME_INTERVAL = 400;
        scope.tapCallback = function(event){
          var playData = new PlayDataModel();
          console.log("KIND TOUCH TAP");
          // if( playData.getStatus() === PLAY_CMD.LIVE ) return;
          if(scope.isShow !== 'show') return;
          if(event.target.tagName === "DIV" || event.target.tagName === "CANVAS") {
            if( isPhone ){
              var now = event.timeStamp;
              var delta = now - lastTouchData;
              if(touchAction !== null) clearTimeout(touchAction);
              if(delta < TOUCH_TIME_INTERVAL && delta>0){
                //scope.doubleTapcallBack(event);
              }
              else{
                lastTouchData = now;
                touchAction = setTimeout(function(e){
                  console.log("KIND TOUCH TAP TOUCHACTION");
                  clearTimeout(touchAction);
                  touchAction = null;
  								var mousePosition = event.pointers[0];
  								var mouseInfo = {
  									'clickedX' : mousePosition.clientX,
  									'clickedY' : mousePosition.clientY
  								};
  								wrapperController.requestSelectedChannel(mouseInfo);
                  console.log("tap and status = "+playData.getStatus());
                }, TOUCH_TIME_INTERVAL, [event]);
              }      
              lastTouchData = now;
            }
          }
        };


        scope.$watch(function(){ return scope.zoomMode; },
        function(newVal) {
          ExtendChannelContainerService.enablePTZ(newVal);
        });
        scope.isPc = ExtendChannelContainerService.getIsPcValue();
        ExtendChannelContainerService.setDigitalZoomService();
      }
    };
}]);