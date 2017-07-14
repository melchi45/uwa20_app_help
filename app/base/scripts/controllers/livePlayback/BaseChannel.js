function BaseChannel($scope, $timeout, $rootScope, LocalStorageService,
  LoggingService, CAMERA_TYPE, SunapiClient, PLAYBACK_TYPE,
  ModalManagerService, UniversialManagerService, CAMERA_STATUS, CameraService,
  $state, SearchDataModel, PlayDataModel, PlaybackInterface) {

  //Default viewMode
  $scope.viewModeTitle = null;
  $scope.viewModeIcon = null;
  $scope.viewMode = null;
  this.viewModeIndex = 0;
  $scope.channelPlace = ['show', 'left', 'right'];
  $scope.selectProfile = ['show'];
  $scope.channelLayout = (isPhone && CAMERA_TYPE === 'b2b') ? 4 : 1;
  $scope.isTransParent = isPhone;
  this.optionServiceType = ['WEB_SSM', 'WEB_IPOLIS', 'MOBILE_B2C', 'MOBILE_B2B'];
  $scope.connectedService = this.optionServiceType[UniversialManagerService.getServiceType()];

  var PLAY_CMD = PLAYBACK_TYPE.playCommand;
  var playData = new PlayDataModel();
  var self = this;
  var playbackInterfaceService = PlaybackInterface;
  playData.setStatus(PLAY_CMD.LIVE);
  playData.setCurrentMenu('main');
  $scope.timelineController = {};
  var TIMEOUT = 200;
  var VIEW_MODE = ["originalratio", "fit", "originalsize" ];
  var MARGIN = 10, HALF = 2;

  var setNonPluginCookie = function() {
    document.cookie = "isNonPlugin=1; path=/";
    //console.log("[setNonPluginCookie] document.cookie = " +document.cookie);
  };
  setNonPluginCookie();

  this.resetPlaySpeed = function() {
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
    if (currentUser !== 'admin') {
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

  var changeToDPTZ = function() {
    domControls.zoomMode = "Digital PTZ";
    UniversialManagerService.setZoomMode(CAMERA_STATUS.ZOOM_MODE.DIGITZL_PTZ);
    $timeout(function() {
      $scope.$apply();
    });
  };

  /**
   * GNB 메뉴 활성화 함수
   * 0 : Live 활성화, 1 : Playback 활성화
   */
  $scope.activeGNB = function(index) {
    var menu = ['live', 'playback'];
    $("#cm-nav ul.cm-left li").removeClass("cm-active");
    $("#cm-nav ul.cm-left li.cm-" + menu[index]).addClass("cm-active");
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
    togglePlayback: function() {},
    closePlayback: function() {},
    visibleFullScreen: function() {
      self.resetUI();
      domControls.visibilityFullStreaming = true;
    },
    visibleLayoutButtons: function() {
      self.resetUI();
      domControls.visibilityLayoutButtons = true;
    },
    visibleProfilePopup: function() {
      ModalManagerService.open(
        'profile', {
          'profileList': $scope.profileList,
          'profileInfo': $scope.profileInfo,
        }
      );
    },
    visibleMainLiveCapturePopup: function($event) {
      if (navigator.appVersion.indexOf('Mac') === -1) {
        var className = 'button-clicked';
        var target = $($event.currentTarget);
        if (!target.hasClass(className)) {
          target.addClass(className);
          setTimeout(function() {
            target.removeClass(className);
          }, TIMEOUT);
        }
      }
      CameraService.captureScreen();
    },
    changeZoomMode: function() {
      var successCallback = function(_zoomMode) {
        switch (_zoomMode) {
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
        'ptzmode', {
          'zoomMode': domControls.zoomMode,
        },
        successCallback
      );
    },
    changeViewMode: function() {
      /**
       * If browser is full screen, view mode is only two 'fit' 'original ratio'.
       * or else, view mode is three 'fit' 'original ratio', 'original size'.
       */
      var maxViewMode = domControls.visibilityFullScreen ? 
        (VIEW_MODE.length-1)-1 : (VIEW_MODE.length-1);

      if (self.viewModeIndex === maxViewMode) {
        self.viewModeIndex = 0;
      } else {
        self.viewModeIndex++;
      }
      $scope.viewMode = self.getViewModeCmd(self.viewModeIndex);

      if (typeof $scope.setChannelSize !== "undefined") {
        $scope.setChannelSize();
      }
    },
  };

  checkValidUser();

  var setEnablePlayback = function() {
    var playMode = UniversialManagerService.getPlayMode();
    if (playMode === CAMERA_STATUS.PLAY_MODE.LIVE) { 
      $scope.domControls.enablePlayback = false; 
    } else if (playMode === CAMERA_STATUS.PLAY_MODE.PLAYBACK) { 
      $scope.domControls.enablePlayback = true; 
    }
  };
  setEnablePlayback();

  var cameraFunctionElements = null;
  var cameraFunctionCount = -1;

  $scope.channelPositionInfoCallback = function(info) {
    console.log("channelPositionInfoCallback information : " + JSON.stringify(info));
    self.channelPositionInfo(info);
    if (cameraFunctionElements === null ) {
      cameraFunctionElements = angular.element(".camera-functions");
      cameraFunctionCount = cameraFunctionElements.length;
    }
    for (var idx = 0; idx < cameraFunctionCount; idx++) {
      cameraFunctionElements[idx].style.marginTop = (info.height / HALF) + MARGIN + "px";
    }
  };

  function mapKeys (obj, keyMapping) {
    var mapped = {};
    for (var key in keyMapping) {
      mapped[obj[key]] = keyMapping[key];
    }
    return mapped;
  }

  $scope.playPlayback = function(_command) {
    var command = _command;
    var playCommandToFunctionMap = mapKeys(PLAY_CMD, {
      PLAY : playbackInterfaceService.play,
      PAUSE : playbackInterfaceService.pause,
      RESUME : playbackInterfaceService.resume,
      STOP : playbackInterfaceService.stop,
      SEEK : playbackInterfaceService.seek,
      INIT : playbackInterfaceService.seek,
      BACKUP : playbackInterfaceService.backup,
    });
    var prevStatus = playData.getStatus();
    var results = null;
    if ((prevStatus === PLAY_CMD.PAUSE || prevStatus === PLAY_CMD.STEPFORWARD ||
        prevStatus === PLAY_CMD.STEPBACKWARD) && command === PLAY_CMD.PLAY) {
      command = PLAY_CMD.RESUME;
    }
    /**
     * if command is next,
     * checking if it is a valid time position or not and moving the playbar to the next event start time
     * will be done inside $scope.timelineController.jumpEvent(command);
     */
    playData.setStatus(command);
    if (command !== PLAY_CMD.PAUSE && command !== PLAY_CMD.STOP && command !== PLAY_CMD.NEXT &&
      command !== PLAY_CMD.BACKUP) {
      if ($scope.timelineController.checkCurrentTimeIsValid() === false) {
        playData.setStatus(PLAY_CMD.STOP);
        $rootScope.$emit('playStatus', 'pause');
        return null;
      }
    }
    if ( playCommandToFunctionMap.hasOwnProperty(command)) {
      if ( command === PLAY_CMD.SEEK) {
        playData.setStatus(PLAY_CMD.PLAY);
      } else if ( command === PLAY_CMD.INIT) {
        $scope.timelineController.goInit();
      }
      var func = playCommandToFunctionMap[command];
      results = func.call(playbackInterfaceService);
    }
    if (command === PLAY_CMD.PREV || command === PLAY_CMD.NEXT) {
      var outputs = $scope.timelineController.jumpEvent(command);
      if (outputs === false) {
        var popupMessage = 'This is ' + (command === PLAY_CMD.PREV ? 'first' : 'last') + ' event';
        ModalManagerService.open(
          'message', {
            'message': popupMessage,
            'buttonCount': 0,
          }
        );
        results = playbackInterfaceService.stop();
      } else {
        if (prevStatus === PLAY_CMD.PLAY) {
          results = playbackInterfaceService.seek();
        }
      }
    } else if (command === PLAY_CMD.STEPFORWARD || command === PLAY_CMD.STEPBACKWARD) {
      $scope.timelineController.resetTimeRange();
      results = playbackInterfaceService.stepPlay(command);
    }
    if ( command === PLAY_CMD.RESUME) {
      playData.setStatus(PLAY_CMD.PLAY);
    }
    if (results !== null) {
      $timeout(function() {
        domControls.playerdata = results;
      });
      return results;
    }

  };

  $scope.setPlaySpeed = function(speed) {
    console.log("call playbackSpeed === " + speed);
    LocalStorageService.setItem('playbackSpeed', speed);
    playData.setPlaySpeed(speed);
    var result = playbackInterfaceService.applyPlaySpeed(speed);
    $scope.playSpeed = speed;
    if (result !== null) {
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
      self.openFullView(event, info);
    },
  };

  $timeout(self.init);

  $scope.visibilityViewMode = true;
  $scope.toggleLiveViewMode = function(event, data) {
    console.log("toggleLiveViewMode", data);
    $scope.visibilityViewMode = data;
  };

  $scope.$watch('domControls.visibilityFullScreen', function(newVal, oldVal) {
    console.log("newVal :" + newVal + ", oldVal :" + oldVal);
    if (newVal !== oldVal && !newVal) {
      self.visibilityFullScreenFalse();

      $scope.toggleLiveViewMode(false, true);
    }
    $scope.toggleHide(newVal);

    self.revertSetting(newVal);
  });

  $scope.resetViewMode = function() {
    $scope.viewMode = 'originalratio';
    self.viewModeIndex = 0;
  };

  $rootScope.$saveOn('BaseChannel:resetViewMode', function() {
    $scope.resetViewMode();
  });

  this.toggleSettingBodyHeight = function(val) {
    var wisenetBodyCls = 'wisenet-desktop-body';
    var body = $('body');

    if (val) {
      body.removeClass(wisenetBodyCls);
    } else {
      if (!body.hasClass(wisenetBodyCls)) {
        body.addClass(wisenetBodyCls);
      }
    }
  };
  this.getViewModeCmd = function(index) {
    var cmd = [
      "originalratio",
      "fit",
      "originalsize",
    ];

    var MAX_INDEX = cmd.length-1;
    if (index > MAX_INDEX) {
      return cmd[0];
    } else {
      return cmd[index];
    }
  };

  this.getViewModeTitle = function(viewMode) {
    var viewModeStr = null;
    switch (viewMode) {
      case 'originalratio':
        viewModeStr = "lang_Aspect_Ratio";
        break;
      case 'fit':
        viewModeStr = "lang_fit";
        break;
      case 'originalsize':
        viewModeStr = "lang_original_size";
        break;
    }

    return viewModeStr;
  }

  $rootScope.$saveOn('seek', function() {
    $scope.playPlayback(PLAY_CMD.SEEK);
  }, $scope);

  $rootScope.$saveOn('app/scripts/models/playback/PlayDataModel::stop', function() {
    $scope.playPlayback(PLAY_CMD.STOP);
  }, $scope);

  $rootScope.$saveOn("/script/controllers/livePlayback/channel::openPlaybackAfterAuth",
    function(event, data) {
      if (data === null) { 
        return; 
      }
      $rootScope.$emit('changeLoadingBar', true);
      playbackInterfaceService.openPlaybackAfterAuth(data).
        then(function() {
          UniversialManagerService.setIsAuthunicating(true);
          $scope.timelineController.create();
          $rootScope.$emit('changeLoadingBar', false);
          console.log("openPlaybackAfterAuth success");
        }, function(error) {
          UniversialManagerService.setIsAuthunicating(true);
          $rootScope.$emit('changeLoadingBar', false);
          playbackInterfaceService.showErrorPopup(error);
        });
    }, $scope);

  $rootScope.$saveOn('clearTimeline', function() {
    $scope.timelineController.clear();
  }, $scope);

  $rootScope.$saveOn('$locationChangeStart', function(event, next, current) {
    if (current === null) { 
      return; 
    }
    self.locationChange(next);
    playData.setStatus(PLAY_CMD.STOP);
    setDefaultPlaybackData();
  }, $scope);

  $scope.$on('$destroy', function() {
    if ("destroy" in $scope.timelineController) {
      $scope.timelineController.destroy();
    }
  });

  $scope.$on('swipeEvent', function(event, data) {
    if (playData.getCurrentMenu() === 'full') {
      return;
    }
    if (data === 'panup') {
      if (UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.LIVE) {
        domControls.enableGotoButton = false;
        domControls.togglePlayback();
      }
    } else if (data === 'pandown') {
      if (UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
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
    if ($scope.domControls.enablePlayback) {
      playData.setStatus(PLAY_CMD.PLAYPAGE);
    } else {
      playData.setStatus(PLAY_CMD.LIVE);
    }
    searchData = null;
  };

  (function removeIsPluginSession() {
    try {
      if (typeof window.sessionStorage !== "undefined") {
        if ("isPlugin" in window.sessionStorage) {
          console.log("from kind, isPlugin is removed.");
          delete window.sessionStorage.isPlugin;
          $rootScope.updateMonitoringPath();
        }
      }
    } catch (err) {
      console.error("That isPlugin is removed have problem.", err);
    }
  })();

  $rootScope.$saveOn('app/scripts/controllers/livePlayback/channel.js :: resetPlaySpeed', 
    function() {
      self.resetPlaySpeed();
    }, $scope);

  $rootScope.$saveOn('scripts/services/playbackClass/timelineService::changePlayStatus', 
    function(event, data) {
      $scope.playPlayback(data);
    }, $scope);

  $rootScope.$saveOn(
    'scripts/controllers/livePlayback/BaseChannel.js::toggleLiveViewMode',
    $scope.toggleLiveViewMode,
    $scope
  );
}

BaseChannel.prototype.disalbePlaybackButton = function() {};
BaseChannel.prototype.selectChannelList = function() {};
BaseChannel.prototype.setChannelState = function(state) {};
BaseChannel.prototype.stopAllChannel = function() {};
BaseChannel.prototype.resetSetting = function() {};
BaseChannel.prototype.applyLiveMedia = function(playerdata) {};
BaseChannel.prototype.channelPositionInfo = function(info) {};
BaseChannel.prototype.pinchEventHandler = function(event) {};
BaseChannel.prototype.pagingEventHandler = function(event) {};
BaseChannel.prototype.touchEventHandler = function(event) {};
BaseChannel.prototype.pressEventHandler = function(event) {};
BaseChannel.prototype.changeLayout = function(cnt) {};
BaseChannel.prototype.openFullView = function(event, info) {};
BaseChannel.prototype.init = function() {};
BaseChannel.prototype.visibilityFullScreenFalse = function() {};
BaseChannel.prototype.locationChange = function(next) {};
BaseChannel.prototype.selectedGoChannel = function(info) {};
BaseChannel.prototype.revertSetting = function(newVal) {};

kindFramework.
  controller('BaseChannelCtrl', ['$scope', '$timeout', '$rootScope', 'LocalStorageService',
    'LoggingService', 'CAMERA_TYPE', 'SunapiClient', 'PLAYBACK_TYPE',
    'ModalManagerService', 'UniversialManagerService', 'CAMERA_STATUS', 'CameraService',
    '$state', 'SearchDataModel', 'PlayDataModel', 'PlaybackInterface', BaseChannel,
  ]);