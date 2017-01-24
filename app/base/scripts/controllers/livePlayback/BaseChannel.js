function BaseChannel($scope, $timeout, $rootScope, LocalStorageService,
      LoggingService, CAMERA_TYPE, SunapiClient,PLAYBACK_TYPE,
      ModalManagerService, UniversialManagerService, CAMERA_STATUS, CameraService,
      $state, SearchDataModel, PlayDataModel, PlaybackInterface) {

    //Default viewMode
    $scope.viewModeTitle = null;
    $scope.viewModeIcon = null;
    $scope.viewMode = null;
    this.viewModeIndex = 0;
    $scope.channelPlace = ['show','left','right'];
    $scope.selectProfile = ['show'];
    $scope.channelLayout = (isPhone && CAMERA_TYPE === 'b2b') ? 4 : 1;
    $scope.isTransParent = isPhone;
    this.optionServiceType = ['WEB_SSM', 'WEB_IPOLIS', 'MOBILE_B2C', 'MOBILE_B2B'];
    $scope.connectedService = this.optionServiceType[UniversialManagerService.getServiceType()];
    var today = new Date();
    var NonPluginProfile = "PLUGINFREE";
    var NonPluginResolution = "1280x720";
    
    var layoutInfo = null,
        layoutWith = null;
    var PLAY_CMD = PLAYBACK_TYPE.playCommand;
    var playData = new PlayDataModel();
    var self = this;
    var playbackInterfaceService = PlaybackInterface;
    playData.setStatus(PLAY_CMD.LIVE);
    playData.setCurrentMenu('main');
    $scope.timelineController = {};

    var setNonPluginCookie = function(){
      document.cookie= "isNonPlugin=1; path=/";
      //console.log("[setNonPluginCookie] document.cookie = " +document.cookie);
    };
    setNonPluginCookie();    

    this.resetPlaySpeed  = function() {
      playData.setDefautPlaySpeed();
      $scope.playSpeed = playData.getPlaySpeed();
      LocalStorageService.setItem('playbackSpeed', $scope.playSpeed);
    };

    var setDefaultPlaybackData = function() {
      self.resetPlaySpeed();
      var searchData = new SearchDataModel();
      searchData.setRefreshHoldValues();
    };
    setDefaultPlaybackData();

    var checkValidUser = function() {
      self.disalbePlaybackButton();
      var currentUser = UniversialManagerService.getUserId();
      // playback only enable admin for web.
      if( currentUser !== 'admin' ) {
        domControls.disalbePlaybackButton = true;
      }
    };

    this.changeToDigitalZoom = function() {
      domControls.zoomMode = "Digital Zoom";
      UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM);
    };

    var changeToPTZ = function() {
      domControls.zoomMode = "PTZ";
      UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ);
    };

    var changeToDPTZ = function () {
      domControls.zoomMode = "Digital PTZ";
      UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.DIGITZL_PTZ);
      $timeout(function() { $scope.$apply(); } );
    };

    /**
     * GNB 메뉴 활성화 함수
     * 0 : Live 활성화, 1 : Playback 활성화
     */
    $scope.activeGNB = function(index){
      var menu = ['live', 'playback'];
      $("#cm_nav ul.cm_left li").removeClass("cm_active");
      $("#cm_nav ul.cm_left li.cm_" + menu[index]).addClass("cm_active");
    };
    
    var domControls = $scope.domControls = {
        selectedChannelName: "Network Camera",
        height: [0, 0, 0],
        enablePlayback: false,
        enableGotoButton: false,
        enableDetailView: false,
        zoomMode: "Digital Zoom",
        profileListChecked: false,
        visibilityLayoutButtons: false,
        visibilityGotoChannelPopup: false,
        visibilityFullScreen: false,
        visibilityFullStreaming: false,
        profileInfo: $scope.profileInfo,
        playerdata: $scope.playerdata,
        chanelViewCnt: 5,
        isPhone: isPhone,
        disalbePlaybackButton: false,
        togglemessage: "Live",
        togglePlayback: function() {
          switch(UniversialManagerService.getPlayMode())
          {
            case CAMERA_STATUS.PLAY_MODE.LIVE : // goto Playback Mode
              openPlaybackPage();
              break;
            case CAMERA_STATUS.PLAY_MODE.PLAYBACK : // goto Live Mode
              closePlaybackPage();
              break;
          }
        },
        closePlayback : function(){
          closePlaybackPage();
        },
        visibleFullScreen : function() {
          self.resetUI();
          domControls.visibilityFullStreaming = true;
        },
        visibleLayoutButtons: function() {
          self.resetUI();
          domControls.visibilityLayoutButtons = true;
        },
        visibleProfilePopup: function() {
          ModalManagerService.open(
            'profile',
            {
              'profileList': $scope.profileList,
              'profileInfo': $scope.profileInfo
            }
          );
        },
        // visibleFavoritePopup: function() {
        //   ModalManagerService.open(
        //     'bookmarkComment', 
        //     {comment : ''},
        //     function(fName) {
        //       PluginManageService.addFavorite(fName);
        //     }, function(err) {
        //       console.log(err);
        //     });
        // },
        visibleMainLiveCapturePopup: function($event) {
          if(navigator.appVersion.indexOf('Mac') === -1){
            var className = 'button-clicked';
            var target = $($event.currentTarget);
            if(!target.hasClass(className)){
              target.addClass(className);
              setTimeout(function(){
                target.removeClass(className);
              }, 200);
            }
          }
          CameraService.captureScreen();
        },
        visiblePasswordMessage: function(index) {
          ModalManagerService.open(
            'b2clogin',
            {'stepIndex' : index}
          );
        },
        changeZoomMode: function() {
          var successCallback = function(_zoomMode)
          {
            switch(_zoomMode)
            {
              case "Digital Zoom":
                  self.changeToDigitalZoom();
              break;
              case "PTZ":
                  changeToPTZ();
              break;
              case "Digital PTZ":
                changeToDPTZ();
              break;
            }
          };
          ModalManagerService.open(
            'ptzmode',
            {'zoomMode' : domControls.zoomMode},
            successCallback
          );
        },
        changeViewMode: function() {
          /**
           * If browser is full screen, view mode is only two 'fit' 'original ratio'.
           * or else, view mode is three 'fit' 'original ratio', 'original size'.
           */
          var maxViewMode = domControls.visibilityFullScreen ? 1 : 2;

          if(self.viewModeIndex === maxViewMode){
            self.viewModeIndex = 0;
          }else{
            self.viewModeIndex++;
          }
          $scope.viewMode = self.getViewModeCmd(self.viewModeIndex);

          if(typeof $scope.setChannelSize !== undefined){
            $scope.setChannelSize();
          }
        }
    };

    /**
    * convert page mode to playback
    * @name : openPlaybackPage
    */
    var openPlaybackPage = function() {
      $scope.activeGNB(1);

      self.selectChannelList();

      $rootScope.$emit('changeLoadingBar', true);
      //1. close Live Stream.
      var result = playbackInterfaceService.stopLive();
      if( result !== null) {
        $scope.playerdata = result;
      }

      self.setChannelState('PLAYBACK');
      $scope.timelineController.create();
      playbackInterfaceService.preparePlayback()
      .then(function(value){
        self.stopAllChannel();
        domControls.enablePlayback = true;
        UniversialManagerService.setPlayMode(CAMERA_STATUS.PLAY_MODE.PLAYBACK);
        playData.setStatus(PLAY_CMD.PLAYPAGE);
        $rootScope.$emit('changeLoadingBar', false);
      }, function(){
        $scope.activeGNB(0);
        self.stopAllChannel();
        $rootScope.$emit('changeLoadingBar', false);
        //re-play live
        var result = playbackInterfaceService.startLive($scope.profileInfo);
        if( result !== null) {
          $scope.playerdata = result;
        }
        $scope.timelineController.destroy();
        domControls.enablePlayback = false;
        playData.setStatus(PLAY_CMD.LIVE);
        UniversialManagerService.setPlayMode(CAMERA_STATUS.PLAY_MODE.LIVE);
        self.setChannelState('LIVE');
      });
      self.resetSetting();
      self.stopAllChannel();
    };

    /**
    * convert page mode to live
    * @name : closePlaybackPage
    */
    var closePlaybackPage = function() {
      $scope.activeGNB(0);
      setDefaultPlaybackData();
      UniversialManagerService.setPlayMode(CAMERA_STATUS.PLAY_MODE.LIVE);
      var playerData =  playbackInterfaceService.refreshLivePage();
      self.setChannelState('LIVE');
      self.applyLiveMedia(playerData);
      $scope.timelineController.destroy();
      self.resetUI();
      self.resetSetting();
    };

    checkValidUser();

    var setEnablePlayback = function() {
        var playMode = UniversialManagerService.getPlayMode();
        if(playMode === CAMERA_STATUS.PLAY_MODE.LIVE) $scope.domControls.enablePlayback = false;
        else if(playMode === CAMERA_STATUS.PLAY_MODE.PLAYBACK) $scope.domControls.enablePlayback = true;
    };
    setEnablePlayback();

    var cameraFunctionElements;
    var cameraFunctionCount;
    var touchZone = {'minX' : 0, 'maxX' : 0, 'minY' : 0, 'maxY' : 0 };
    
    $scope.channelPositionInfoCallback = function(info) {
      console.log("channelPositionInfoCallback information : " + JSON.stringify(info));
      layoutInfo = info;
      self.channelPositionInfo(info);
      if(typeof(cameraFunctionElements) === 'undefined') {
        cameraFunctionElements = angular.element(".camera-functions");
        cameraFunctionCount = cameraFunctionElements.length;
      }
      for(var i = 0; i < cameraFunctionCount; i++) {
        cameraFunctionElements[i].style.marginTop = info.height/2 + 10 + "px";
      }
    };

    $scope.playPlayback = function(command){
      var prevStatus = playData.getStatus();
      var results = null;
      if( ( prevStatus === PLAY_CMD.PAUSE || prevStatus === PLAY_CMD.STEPFORWARD || 
              prevStatus === PLAY_CMD.STEPBACKWARD ) && command === PLAY_CMD.PLAY ){
        command = PLAY_CMD.RESUME;
      }
      /**
       * if command is next,
       * checking if it is a valid time position or not and moving the playbar to the next event start time
       * will be done inside $scope.timelineController.jumpEvent(command);
       */
      playData.setStatus(command);
      if( command !== PLAY_CMD.PAUSE && command !== PLAY_CMD.STOP && command !== PLAY_CMD.NEXT && 
        command !== PLAY_CMD.BACKUP) {
        if( $scope.timelineController.isValidTimePosition() === false) {
          playData.setStatus(PLAY_CMD.STOP);
          $rootScope.$emit('playStatus', 'pause');
          return null;
        }
      }
      if( command === PLAY_CMD.PLAY) {
        results = playbackInterfaceService.play();
      }
      else if( command === PLAY_CMD.PAUSE) {
        results = playbackInterfaceService.pause();
      }
      else if( command === PLAY_CMD.RESUME) {
        results = playbackInterfaceService.resume();
        playData.setStatus(PLAY_CMD.PLAY);
      }
      else if( command === PLAY_CMD.STOP) {
        return playbackInterfaceService.stop();
      }
      else if( command === PLAY_CMD.SEEK) {
        playData.setStatus(PLAY_CMD.PLAY);
        results = playbackInterfaceService.seek();
      }
      else if( command === PLAY_CMD.INIT) {
        $scope.timelineController.goInit();
        results = playbackInterfaceService.seek();
      }
      else if( command === PLAY_CMD.PREV || command === PLAY_CMD.NEXT) {
        var outputs = $scope.timelineController.jumpEvent(command);
        if( outputs === false ) {
          var popupMessage = 'This is ' + (command===PLAY_CMD.PREV ? 'first' : 'last' ) +' event';
          ModalManagerService.open(
            'message',
            {'message' : popupMessage, 'buttonCount':0}
          );
          results = playbackInterfaceService.stop();
        }
        else {
          if( prevStatus === PLAY_CMD.PLAY) {
            results = playbackInterfaceService.seek();
          }
        }
      }
      else if( command === PLAY_CMD.STEPFORWARD || command === PLAY_CMD.STEPBACKWARD) {
        $scope.timelineController.resetTimeRange();
        results = playbackInterfaceService.stepPlay(command);
      }
      else if( command === PLAY_CMD.BACKUP ) {
        playbackInterfaceService.backup();
      }
      if( results !== null) {
        $timeout(function() {
          domControls.playerdata =results;
        });
        return results;
      }
    };

    $scope.setPlaySpeed = function(speed) {
      console.log("call playbackSpeed === "+speed);
      LocalStorageService.setItem('playbackSpeed', speed);
      playData.setPlaySpeed(speed);
      var result = playbackInterfaceService.applyPlaySpeed(speed);
      $scope.playSpeed = speed;
      if( result !== null) {
        domControls.playerdata = result;
      }
    };

    $scope.setTimelineView = function(timelineView) {
      $scope.timelineController.changeView(timelineView);
    };

    $scope.goChannelList = function() {
      $state.go('uni.channellist');
    };

    // Pinch event is different to event log with console.log
    // console.log pinchIn is augmentation(more big)
    $scope.pinchEvent = function(event) {
      self.pinchEventHandler(event);
    };

    $scope.pagingEvent = function(event) {
      self.pagingEventHandler(event);
    };

    $scope.touchEvent = function(event) {
      self.touchEventHandler(event);
    };

    $scope.pressEvent = function(event) {
      self.pressEventHandler(event);
    };

    $scope.operators = {
      changeChannelLayout: function(cnt) {
        self.changeLayout(cnt);
      },
      selectGotoChannel: function() {
        self.resetUI();
        domControls.enableGotoButton = true;
      },
    };

    $scope.directivCallbacks = {
      selectedGotoChannel: function(info) {
        self.selectedGoChannel(info);
        self.resetUI();
      },
      /******************************
      callback from channelContainer
      @param : info.clickedX, info.clickedY
      ******************************/
      openFullScreen: function(event, info) {
        self.openFullView(event,info);
      }
    };

    $timeout(self.init);

    $scope.visibilityViewMode = true;
    $scope.toggleLiveViewMode = function(event, data){
      console.log("toggleLiveViewMode", data);
      $scope.visibilityViewMode = data;
    };

    $scope.$watch('domControls.visibilityFullScreen', function(newVal, oldVal) {
      console.log("newVal :" + newVal + ", oldVal :" + oldVal);
      if(newVal !== oldVal && !newVal) {
        self.visibilityFullScreenFalse();

        $scope.toggleLiveViewMode(false, true);
      }
      $scope.toggleHide(newVal);

      self.revertSetting(newVal);
    });

    $scope.resetViewMode = function(){
      $scope.viewMode = 'originalratio';
      self.viewModeIndex = 0;
    };

    $rootScope.$saveOn('BaseChannel:resetViewMode', function() {
      $scope.resetViewMode();
    });

    this.toggleSettingBodyHeight = function(val){
      var wisenetBodyCls = 'wisenet-desktop-body';
      var body = $('body');

      if(val){
        body.removeClass(wisenetBodyCls);
      }else{
        if(!body.hasClass(wisenetBodyCls)){
            body.addClass(wisenetBodyCls);
        }
      }
    };
    this.getViewModeCmd = function(index){
      var cmd = [
        "originalratio",
        "fit",
        "originalsize"
      ];

      if(index > 2){
        return cmd[0];
      }else{
        return cmd[index];
      }
    };

    this.getViewModeTitle = function(viewMode){
      var viewModeStr = null;
      switch(viewMode){
          case self.getViewModeCmd(0):
            viewModeStr = "lang_Aspect_Ratio";
          break;
          case self.getViewModeCmd(1):
            viewModeStr = "lang_fit";
          break;
          case self.getViewModeCmd(2):
            viewModeStr = "lang_original_size";
          break;
      }

      return viewModeStr;
    }

    $rootScope.$saveOn('seek', function(event) {
      $scope.playPlayback(PLAY_CMD.SEEK);
    }, $scope);

    $rootScope.$saveOn('app/scripts/models/playback/PlayDataModel::stop', function(event) {
      $scope.playPlayback(PLAY_CMD.STOP);
    }, $scope);

    $rootScope.$saveOn("/script/controllers/livePlayback/channel::openPlaybackAfterAuth",
      function(event, data) {
        if( data === null ) return;
        $rootScope.$emit('changeLoadingBar', true);
          playbackInterfaceService.openPlaybackAfterAuth(data)
          .then(function(result){
            UniversialManagerService.setIsAuthunicating(true);
            $scope.timelineController.create();
            $rootScope.$emit('changeLoadingBar', false);
            console.log("openPlaybackAfterAuth success");
          }, function(error){
            UniversialManagerService.setIsAuthunicating(true);
            $rootScope.$emit('changeLoadingBar', false);
            playbackInterfaceService.showErrorPopup(error);
          });
    }, $scope);

    $rootScope.$saveOn("/script/controllers/livePlayback/channel::preparePlayback",
      function(event, data) {
        if( data === null ) return;
        $rootScope.$emit('changeLoadingBar', true);
          playbackInterfaceService.preparePlayback(data)
          .then(function(result){
            $rootScope.$emit('changeLoadingBar', false);
            $scope.timelineController.create();
            console.log("openPlaybackAfterAuth success");
          }, function(error){
            $rootScope.$emit('changeLoadingBar', false);
            playbackInterfaceService.showErrorPopup(error);
          });
    }, $scope);

    $rootScope.$saveOn('clearTimeline', function(event, data) {
      $scope.timelineController.clear();
    }, $scope);

    $rootScope.$saveOn('$locationChangeStart', function(event, next, current){
      if(current === null ) return;
      self.locationChange(next);
      playData.setStatus(PLAY_CMD.STOP);
      setDefaultPlaybackData();
    }, $scope);

    $scope.$on('$destroy', function() {
      if("destroy" in $scope.timelineController){
        $scope.timelineController.destroy();
      }
    });

    $scope.$on('swipeEvent', function(event, data){
      if (playData.getCurrentMenu() === 'full') return;
      if( data === 'panup'){
        if( UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.LIVE ){
          domControls.enableGotoButton = false;
          domControls.togglePlayback();
        }
      }
      else if(data === 'pandown'){
        if(UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK ){
          domControls.togglePlayback();
        }
      }
    });

    this.resetUI = function() {
        var searchData = new SearchDataModel();
        setEnablePlayback();
        $scope.domControls.enableGotoButton = false;
        $scope.domControls.visibilityLayoutButtons = false;
        $scope.domControls.visibilityGotoChannelPopup = false;
        $scope.domControls.visibilityFullScreen = false;
        $scope.domControls.visibilityFullStreaming = false;
        $scope.domControls.enableDetailView = false;
        UniversialManagerService.setViewMode(CAMERA_STATUS.VIEW_MODE.CHANNEL);
        $scope.domControls.profileInfo = $scope.profileInfo;
        $scope.domControls.playerdata = $scope.playerdata;
        $scope.domControls.togglemessage = "Live";
        searchData.setWebIconStatus(false);
        if($scope.domControls.enablePlayback) {
            playData.setStatus(PLAY_CMD.PLAYPAGE);
        } else {
            playData.setStatus(PLAY_CMD.LIVE);
        }
        searchData = null;
    };

    (function removeIsPluginSession(){
      try{
        if(window.sessionStorage !== undefined){
          if("isPlugin" in window.sessionStorage){
            console.log("from kind, isPlugin is removed.");
            delete window.sessionStorage.isPlugin;
            $rootScope.updateMonitoringPath();
          }
        }
      }catch(e){
        console.error("That isPlugin is removed have problem.", e);
      }
    })();   

    $rootScope.$saveOn('refreshLivePage', function(event, data) {
      if( data && UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.LIVE) {
        playbackInterfaceService.refreshLivePage();
        $scope.timelineController.destroy();
        $scope.domControls.enablePlayback = false;
        UniversialManagerService.setPlayMode(CAMERA_STATUS.PLAY_MODE.LIVE);
        self.resetUI();
      }
    }, $scope);

    $rootScope.$saveOn('app/scripts/controllers/livePlayback/channel.js :: resetPlaySpeed', function(event, data) {
      self.resetPlaySpeed();
    }, $scope);

    $rootScope.$saveOn('scripts/services/playbackClass/timelineService::changePlayStatus', function(event, data) {
      $scope.playPlayback(data);
    }, $scope);

    $rootScope.$saveOn(
      'scripts/controllers/livePlayback/BaseChannel.js::toggleLiveViewMode',
      $scope.toggleLiveViewMode, 
      $scope
    );
}

BaseChannel.prototype.disalbePlaybackButton = function(){};
BaseChannel.prototype.selectChannelList = function(){};
BaseChannel.prototype.setChannelState = function(state){};
BaseChannel.prototype.stopAllChannel = function(){};
BaseChannel.prototype.resetSetting = function(){};
BaseChannel.prototype.applyLiveMedia = function(playerdata){};
BaseChannel.prototype.channelPositionInfo = function(info){};
BaseChannel.prototype.pinchEventHandler = function(event){};
BaseChannel.prototype.pagingEventHandler = function(event){};
BaseChannel.prototype.touchEventHandler = function(event){};
BaseChannel.prototype.pressEventHandler = function(event){};
BaseChannel.prototype.changeLayout = function(cnt){};
BaseChannel.prototype.openFullView = function(event, info){};
BaseChannel.prototype.init = function(){};
BaseChannel.prototype.visibilityFullScreenFalse = function(){};
BaseChannel.prototype.locationChange = function(next){};
BaseChannel.prototype.selectedGoChannel = function(info){};
BaseChannel.prototype.revertSetting = function(newVal) {};

kindFramework
.controller('BaseChannelCtrl', ['$scope', '$timeout', '$rootScope', 'LocalStorageService',
    'LoggingService', 'CAMERA_TYPE', 'SunapiClient','PLAYBACK_TYPE',
    'ModalManagerService', 'UniversialManagerService', 'CAMERA_STATUS', 'CameraService',
    '$state', 'SearchDataModel', 'PlayDataModel', 'PlaybackInterface', BaseChannel
]);
