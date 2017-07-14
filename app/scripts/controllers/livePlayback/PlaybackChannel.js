/**
 * Created by miju462.park on 2016-05-12.
 */
/* global setTimeout, clearInterval, setInterval, BaseChannel*/
kindFramework.controller(
  'PlaybackChannelCtrl', ['$controller', '$scope', '$timeout', '$q', '$rootScope', '$location', 
    'LocalStorageService', 'ConnectionSettingService', 'LoggingService', 'kindStreamInterface',
    'DigitalZoomService', 'CAMERA_TYPE', 'SunapiClient', 'PLAYBACK_TYPE',
    'SessionOfUserManager', 'ModalManagerService', 'UniversialManagerService',
    'CAMERA_STATUS', 'Attributes', 'CameraService', '$translate', 'AccountService',
    'MultiLanguage', '$state', 'SearchDataModel', 'PlayDataModel',
    'PlaybackInterface', 'playbackStepService', 'BACKUP_STATUS', 'RESTCLIENT_CONFIG', 
    'BrowserService', 'ExtendChannelContainerService', 'COMMONUtils',
    function($controller, $scope, $timeout, $q, $rootScope, $location, LocalStorageService,
      ConnectionSettingService, LoggingService, kindStreamInterface, DigitalZoomService,
      CAMERA_TYPE, SunapiClient, PLAYBACK_TYPE, SessionOfUserManager, ModalManagerService,
      UniversialManagerService, CAMERA_STATUS, Attributes, CameraService, $translate,
      AccountService, MultiLanguage, $state, SearchDataModel, PlayDataModel,
      PlaybackInterface, playbackStepService, BACKUP_STATUS, RESTCLIENT_CONFIG, BrowserService,
      ExtendChannelContainerService, COMMONUtils) {
      "use strict";

      var self = this;
      var sunapiAttributes = Attributes.get(); //--> not common.
      var PLAY_CMD = PLAYBACK_TYPE.playCommand;
      var searchData = new SearchDataModel();
      $scope.sliderRefreshInProgress = false;
      var waitingPlaybackPage = false;
      var isChannelPlayerInit = false;
      var isTimelineInit = false;
      $scope.pageController = {};
      $scope.playbackPage = {};

      var DEFAULT_VALUE = 0;
      var TIMEOUT = 500;
      var MIN_TO_SEC = 60;
      var SEC_TO_MS = 1000;

      BaseChannel.prototype.locationChange = function(next) {
        if (next.indexOf('playbackChannel') === -1) {
          if ($scope.domControls.enablePlayback === true) {
            if (UniversialManagerService.isSpeakerOn()) {
              $scope.speakerStatus = false;
              $scope.speakerVolumn = 0;
              UniversialManagerService.setSpeakerVol($scope.speakerVolumn);
              $rootScope.$emit('channelPlayer:command', 'speakerVolumn', $scope.speakerVolumn);

              UniversialManagerService.setSpeakerOn($scope.speakerStatus);
              $rootScope.$emit('channelPlayer:command', 'speakerStatus', $scope.speakerStatus);
            }
            // kindStreamInterface.setCanvasStyle('fit'); // when go to setup page, set view mode as fit
            kindStreamInterface.locChangeViewmode();
            DigitalZoomService.init();

            $rootScope.$emit("channelPlayer:command", "close");
            $scope.domControls.enablePlayback = false;
            $scope.pageController.closePlayback();
            var playData = new PlayDataModel();
            playData.setPlaybackEnable(false);
            UniversialManagerService.setPlayMode(CAMERA_STATUS.PLAY_MODE.LIVE);
            try {
              if ("destroy" in $scope.timelineController) {
                console.log("$scope.timelineController.destroy();");
                $scope.timelineController.destroy();
              }
            } catch (err) {
              $scope.timelineController.destroy();
            }
          }
        }
      };

      BaseChannel.prototype.openFullView = function() {
        if (UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
          var playData = new PlayDataModel();
          playData.setCurrentMenu('full');
          searchData.setWebIconStatus(true);
        }
        // else{
        // var plugin = (UniversialManagerService.getStreamingMode() === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE) ? true:false;
        // if (kindStreamInterface.managerCheck() || plugin) {
        self.changeToDigitalZoom();
        var zoomArray = DigitalZoomService.init();
        kindStreamInterface.changeDrawInfo(zoomArray);
        UniversialManagerService.setViewMode(CAMERA_STATUS.VIEW_MODE.DETAIL);
        $scope.domControls.visibilityFullScreen = true;
        // $timeout($scope.$apply());                                                 
        $timeout(function() {
          $rootScope.$emit('channel:reloadStreaming');
          $scope.resetViewMode();
          kindStreamInterface.setCanvasStyle($scope.viewMode); //when open full screen, reset view mode with delaying
        });
        $rootScope.$emit('fullscreenOpened', 
          [sunapiAttributes.MaxROICoordinateX, sunapiAttributes.MaxROICoordinateY]);
        // }
      };

      BaseChannel.prototype.visibilityFullScreenFalse = function() {
        $rootScope.$emit('app/scripts/controllers/livePlayback/main.js::toggleOverlay', false);
        self.viewModeIndex = 0;
        self.changeToDigitalZoom();
      };

      angular.extend(this, $controller('BaseChannelCtrl', {
        $scope: $scope,
        $timeout: $timeout,
        $rootScope: $rootScope,
        LocalStorageService: LocalStorageService,
        LoggingService: LoggingService,
        CAMERA_TYPE: CAMERA_TYPE,
        SunapiClient: SunapiClient,
        PLAYBACK_TYPE: PLAYBACK_TYPE,
        ModalManagerService: ModalManagerService,
        UniversialManagerService: UniversialManagerService,
        CAMERA_STATUS: CAMERA_STATUS,
        CameraService: CameraService,
        $state: $state,
        SearchDataModel: SearchDataModel,
        PlayDataModel: PlayDataModel,
        PlaybackInterface: PlaybackInterface,
      }));

      /*
       * 
       * @function : resetSetting
       */
      var resetSetting = function() {
        /*Web Viewer using timezone value.*/
        var playData = new PlayDataModel();
        playData.setEnableTimezone(true);
        if (UniversialManagerService.isSpeakerOn()) {
          UniversialManagerService.setSpeakerOn(false);
          UniversialManagerService.setSpeakerVol(DEFAULT_VALUE);
        }
        if (UniversialManagerService.isMicOn()) {
          UniversialManagerService.setMicOn(false);
          UniversialManagerService.setMicVol(DEFAULT_VALUE);
        }
        waitingPlaybackPage = false;
        isTimelineInit = false;
        isChannelPlayerInit = false;
      };

      /*
       * initialize for playback streaming
       * 
       * @function : initStreaming
       */
      var initStreaming = function() {
        var def = $q.defer();
        var channelId = UniversialManagerService.getChannelId();
        //1. close Live Stream.
        var playData = new PlayDataModel();
        playData.setPlaybackEnable(true);
        PlaybackInterface.stopLive();
        PlaybackInterface.preparePlayback(channelId).
          then(function(results) {
            def.resolve(results);
          }, function(err) {
            def.reject(err);
          });
        kindStreamInterface.setResizeEvent();
        kindStreamInterface.setCanvasStyle($scope.viewMode, 'Playback');
        //workerManager.initVideo(false);
        kindStreamInterface.controlWorker({
          'channelId': 0,
          'cmd': 'initVideo',
          'data': [false]
        });
        return def.promise;
      };

      /*
       * initialize Playback page ( create timeline, prepare playback stream )
       *
       * @function : initializePlaybackPage
       */
      var initializePlaybackPage = function() {
        var playData = new PlayDataModel();
        $rootScope.$emit('changeLoadingBar', true);
        $scope.pageController.channelSelector(sunapiAttributes.MaxChannel > 1);
        ConnectionSettingService.setMultiChannelSupport(sunapiAttributes.MaxChannel > 1);
        playData.setPlaybackEnable(true);
        initStreaming().
          then(function() {
            //Check Browser
            if (BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.FIREFOX ||
              BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.EDGE) {
              var optimizedMsg = $translate.instant('lang_msg_nonplugin_optimized_chrome');
              ModalManagerService.open(
                'message', {
                  'message': optimizedMsg,
                  'buttonCount': 0,
                }
              );
            }
          }, function() {});
        $scope.playbackPage.MaxAudioInput = sunapiAttributes.MaxAudioInput;
        $scope.domControls.enablePlayback = true;
        $scope.timelineController.create();
        $scope.timelineController.changeCurrnetDate({
          'date': searchData.getSelectedDate(),
        });

        UniversialManagerService.setPlayMode(CAMERA_STATUS.PLAY_MODE.PLAYBACK);
        playData.setStatus(PLAY_CMD.PLAYPAGE);
        playData.setTimelineMode(true);
      };

      $scope.channelSetFunctions = {
        show: false,
      };

      $scope.selectBackupTime = function() {
        $scope.timelineController.selectBackupTime();
      };

      $scope.setChannelSize = function() {
        kindStreamInterface.setResizeEvent();
        kindStreamInterface.setCanvasStyle($scope.viewMode, $scope.channelSetFunctions.show);
      };

      /*
       * @function : setAccountData
       * @param : response of '/stw-cgi/security.cgi?msubmenu=users&action=view'
       */
      var setAccountData = function(response) {
        var accountInfo = {};
        var data = response.data.Users;
        if (data.length > 0) { //admin, user
          accountInfo = data[0];
          UniversialManagerService.setUserId(data[0].UserID);
        } else { //guest
          accountInfo.UserID = 'guest';
          UniversialManagerService.setUserId('guest');
        }
        AccountService.setAccount(accountInfo);
        $rootScope.$emit('AccountInfoUpdated');
      };

      /*
       * get rtsp user data
       *
       * @function : getUserInfo
       */
      var getUserInfo = function() {
        return SunapiClient.get(
          '/stw-cgi/security.cgi?msubmenu=users&action=view', {},
          function(response) {
            setAccountData(response);
          },
          function(errorData) {
            console.error(errorData);
          }, {}, true);
      };

      /*
       * get ip address
       *
       * @function : getClientIP
       */
      var getClientIP = function() {
        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=getclientip&action=view', {},
          function(response) {
            $scope.ClientIPAddress = response.data.ClientIP;
            SessionOfUserManager.setClientIPAddress($scope.ClientIPAddress);
          },
          function(errorData) {
            console.error(errorData);
          }, '', true);
      };

      /*
       * get Mac address
       *
       * @function : getRtspIpMac
       */
      var getRtspIpMac = function() {
        return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=interface&action=view', {},
          function(response) {
            var rtspIp = response.data.NetworkInterfaces[0].IPv4Address;
            var macIp = response.data.NetworkInterfaces[0].MACAddress;
            ConnectionSettingService.setRtspIpMac(rtspIp, macIp);
          },
          function(errorData) {
            console.error(errorData);
          }, '', true);
      };

      /*
       * get rtsp port
       *
       * @function : getRtspPort
       */
      var getRtspPort = function() {
        return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=rtsp&action=view', {},
          function(response) {
            var rtspPort = response.data.Port;
            ConnectionSettingService.setRtspPort(rtspPort);
          },
          function(errorData) {
            console.error(errorData);
          }, '', true);
      };

      /*
       * get rtsp info for playback
       *
       * @function : getStreamingInfo
       * @
       */
      var getStreamingInfo = function() {
        getRtspIpMac();
        getRtspPort();
        if (SessionOfUserManager.isLoggedin()) {
          var id = SessionOfUserManager.getUsername();
          var password = SessionOfUserManager.getPassword();
          ConnectionSettingService.setConnectionInfo({
            id: id,
            password: password,
          });
          /**
           * When user refresh the browser, account is resetted.
           * So below lines is added.
           */
          getUserInfo();
          if (SessionOfUserManager.getClientIPAddress() === '127.0.0.1') {
            getClientIP();
          }
        }
        UniversialManagerService.setLiveStreamStatus(false);
      };

      /**
       * check get all sunapi attributes or not
       * @function : checkAttributes
       */
      var checkAttributes = function() {
        if (!sunapiAttributes.AttributeSectionReady) {
          $timeout(function() {
            sunapiAttributes = Attributes.get();
            checkAttributes();
          }, TIMEOUT);
        } else {
          getCurrentDate();
        }
      };

      /*
       * get current date of camera
       * 
       * @function : getCurrentDate
       */
      function getCurrentDate() {
        resetSetting();
        SunapiClient.get('/stw-cgi/system.cgi?msubmenu=date&action=view', {},
          function(response) {
            var currentDay = response.data.LocalTime.split(" ")[0];
            var current = new Date(currentDay);
            current.setTime(current.getTime() + 
              (current.getTimezoneOffset() * MIN_TO_SEC * SEC_TO_MS));
            searchData.setDefaultDate(current);
            initializePlaybackPage();
          },
          function() {}, '', true);
      }

      function getFlipMirror() {
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', '',
          function(response) {
            UniversialManagerService.setRotate(response.data.Flip);
          },
          function(errorData) {
            console.log(errorData);
          }, '', true);
      }

      // When connect to PlaybackChannel at first,
      $scope.$on('$stateChangeSuccess',
        function(event, toState, toParams, fromState) {
          getFlipMirror();
          console.log(fromState, " :->", toState);
          getStreamingInfo();
          self.resetUI();
          waitingPlaybackPage = true;
          if (waitingPlaybackPage === true && isTimelineInit === true &&
            isChannelPlayerInit === true) {
            checkAttributes();
          }
        }
      );

      $scope.$on('$destroy', function() {
        watchViewMode();
      });

      $rootScope.$saveOn('playbackBackup', function() {
        $scope.playPlayback(PLAY_CMD.BACKUP);
      }, $scope);

      $rootScope.$saveOn('enablePlayback', function(event, data) {
        $scope.domControls.enablePlayback = data;
        if (data === false) {
          $scope.pageController.closePlayback();
        }
      }, $scope);

      $rootScope.$saveOn('channelPlayer::initialized', function() {
        isChannelPlayerInit = true;
        if (waitingPlaybackPage === true && isTimelineInit === true &&
          isChannelPlayerInit === true) {
          checkAttributes();
        }
      }, $scope);

      $rootScope.$saveOn('timeline::initialized', function() {
        isTimelineInit = true;
        if (waitingPlaybackPage === true && isTimelineInit === true &&
          isChannelPlayerInit === true) {
          checkAttributes();
        }
      }, $scope);

      $rootScope.$saveOn("channel:setPlugin", function() {
        $scope.pageController.closePlayback();
        $rootScope.$emit("channelPlayer:command", "close");
        var StreamingMode = UniversialManagerService.getStreamingMode();
        if (StreamingMode === CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE) {
          $(".cm-plugin-btn").addClass("cm-active");
          UniversialManagerService.setStreamingMode(CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE);
        } else {
          $(".cm-plugin-btn").removeClass("cm-active");
          UniversialManagerService.setStreamingMode(CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE);
        }
        initializePlaybackPage();
      }, $scope);

      $rootScope.$saveOn('channel:reloadStreaming', function() {
        var playData = new PlayDataModel();
        if (BrowserService.OSDetect === BrowserService.OS_TYPES.MACINTOSH && 
          playData.getStatus() === PLAY_CMD.PLAY) {
          $scope.playPlayback(PLAY_CMD.STOP);
          playData.setStatus(PLAY_CMD.PLAY);
          $timeout(function() {
            $scope.timelineController.resetTimeRange();
            $scope.playPlayback(PLAY_CMD.PLAY);
          }, TIMEOUT);
        }
      }, $scope);

      /* Channel Selector Direction */
      $rootScope.$saveOn('channelSelector:selectChannel', function(event, index) {
        var playData = new PlayDataModel();
        UniversialManagerService.setChannelId(index);
        playData.setStatus(PLAY_CMD.STOP);
        $scope.timelineController.clear();
        PlaybackInterface.preparePlayback(index);
      }, $scope);

      $rootScope.$saveOn('channelSelector:changeQuadView', function(event, response) {
        console.log(response);
      }, $scope);

      var watchViewMode = $scope.$watch('viewMode', function(newVal) {
        console.log("kind ", newVal);
        if (newVal === null) {
          $scope.viewMode = self.getViewModeCmd(DEFAULT_VALUE);
          return;
        }
        // $scope.wisenetCameraFuntions[6].label = $scope.viewModeTitle = getViewModeTitle(newVal);
        // $scope.wisenetCameraFuntions[6].class = $scope.viewModeIcon = "tui-ch-live-view-" + newVal;
        $scope.viewModeIcon = "tui tui-ch-live-view-" + newVal;
        $scope.viewModeTitle = self.getViewModeTitle(newVal);
        kindStreamInterface.setCanvasStyle(newVal);
      });
    },
  ]);