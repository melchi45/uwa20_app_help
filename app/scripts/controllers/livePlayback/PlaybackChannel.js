/**
 * Created by miju462.park on 2016-05-12.
 */
/* global setTimeout, cordova, clearInterval, setInterval, BaseChannel, workerManager*/
kindFramework
.controller('PlaybackChannelCtrl',
  ['$controller', '$scope', '$timeout', '$q', '$rootScope', '$location','LocalStorageService',
  'ConnectionSettingService', 'LoggingService', 'kindStreamInterface',
  'DigitalZoomService', 'CAMERA_TYPE', 'SunapiClient','PLAYBACK_TYPE',
  'SessionOfUserManager', 'ModalManagerService', 'UniversialManagerService',
  'CAMERA_STATUS', 'Attributes', 'CameraService', '$translate', 'AccountService', 
  'MultiLanguage','$state', 'SearchDataModel', 'PlayDataModel','KindProfileService',
  'PlaybackInterface','playbackStepService', 'BACKUP_STATUS', 'RESTCLIENT_CONFIG', 'BrowserService', 'ExtendChannelContainerService', 'COMMONUtils',
    function($controller, $scope, $timeout,  $q, $rootScope, $location, LocalStorageService,
      ConnectionSettingService, LoggingService,kindStreamInterface, DigitalZoomService, 
      CAMERA_TYPE, SunapiClient,PLAYBACK_TYPE, SessionOfUserManager, ModalManagerService, 
      UniversialManagerService, CAMERA_STATUS, Attributes, CameraService, $translate, 
      AccountService, MultiLanguage, $state, SearchDataModel, PlayDataModel, KindProfileService, 
      PlaybackInterface, playbackStepService, BACKUP_STATUS, RESTCLIENT_CONFIG, BrowserService, ExtendChannelContainerService,COMMONUtils) {
    "use strict";

    var self = this;
    var sunapiAttributes = Attributes.get();  //--> not common.
    var defaultProfileID = 2; // H.264
    var logger = LoggingService.getInstance('ChannelCtrl');
    var PLAY_CMD = PLAYBACK_TYPE.playCommand;
    var searchData = new SearchDataModel();
    var playbackInterfaceService = PlaybackInterface;
    var pageData = {};
    $scope.sliderRefreshInProgress = false;
    var DEFAULT_CHANNEL=0;
    var waitingPlaybackPage = false;
    var isChannelPlayerInit = false;
    var isTimelineInit = false;
    $scope.pageController = {};

    BaseChannel.prototype.locationChange = function(next) {
      if( next.indexOf('playbackChannel') === -1 ) {
        if( $scope.domControls.enablePlayback === true ) {
          if(UniversialManagerService.isSpeakerOn()){
            $scope.speakerStatus = false;
            $scope.speakerVolumn = 0;
            UniversialManagerService.setSpeakerVol($scope.speakerVolumn);
            $rootScope.$emit('channelPlayer:command', 'speakerVolumn', $scope.speakerVolumn); 
            
            UniversialManagerService.setSpeakerOn($scope.speakerStatus);
            $rootScope.$emit('channelPlayer:command', 'speakerStatus', $scope.speakerStatus);
          }
          kindStreamInterface.setCanvasStyle('fit'); // when go to setup page, set view mode as fit
          DigitalZoomService.init();
        
          $rootScope.$emit("channelPlayer:command", "close");
          $scope.domControls.enablePlayback = false;
          $scope.pageController.closePlayback();
          UniversialManagerService.setPlayMode(CAMERA_STATUS.PLAY_MODE.LIVE);
          try {
            if("destroy" in $scope.timelineController){
              console.log("$scope.timelineController.destroy();");
              $scope.timelineController.destroy();
            }
          }catch(e){
            $scope.timelineController.destroy();
          }
          playbackInterfaceService = null;
        }
      }
    };

    BaseChannel.prototype.openFullView = function(event, info) {

      if( UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
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
      $rootScope.$emit('fullscreenOpened', [sunapiAttributes.MaxROICoordinateX, sunapiAttributes.MaxROICoordinateY]);
      // }
    };

    BaseChannel.prototype.visibilityFullScreenFalse = function() {
      $rootScope.$emit('app/scripts/controllers/livePlayback/main.js::toggleOverlay', false);
      self.viewModeIndex = 0;
      self.changeToDigitalZoom();
    };

    BaseChannel.prototype.init = function() {
      KindProfileService.setDeviceConnectionInfo(ConnectionSettingService.getConnectionSetting());      
    };
    angular.extend(this, $controller('BaseChannelCtrl', {
      $scope:$scope, $timeout:$timeout, $rootScope:$rootScope, LocalStorageService:LocalStorageService,
      LoggingService:LoggingService, CAMERA_TYPE:CAMERA_TYPE, SunapiClient:SunapiClient, 
      PLAYBACK_TYPE:PLAYBACK_TYPE, ModalManagerService:ModalManagerService, UniversialManagerService:UniversialManagerService,
      CAMERA_STATUS:CAMERA_STATUS, CameraService:CameraService, $state:$state, SearchDataModel:SearchDataModel, 
      PlayDataModel:PlayDataModel, PlaybackInterface:PlaybackInterface
    }));

    var resetSetting = function() {
      /*Web Viewer using timezone value.*/
      var playData = new PlayDataModel();
      playData.setEnableTimezone(true);
      if(UniversialManagerService.isSpeakerOn()){
        UniversialManagerService.setSpeakerOn(false);
        UniversialManagerService.setSpeakerVol(0);
      }
      if(UniversialManagerService.isMicOn()){
        UniversialManagerService.setMicOn(false);
        UniversialManagerService.setMicVol(0);
      }
    };

    var goToPlaybackPage = function() {
      var playData = new PlayDataModel();

      $rootScope.$emit('changeLoadingBar', true);

      //1. close Live Stream.
      
      PlaybackInterface.stopLive();

      PlaybackInterface.preparePlayback()
      .then(function() {
        //Check Browser
        if( BrowserService.BrowserDetect == BrowserService.BROWSER_TYPES.FIREFOX ||
          BrowserService.BrowserDetect == BrowserService.BROWSER_TYPES.EDGE ) {
          ModalManagerService.open(
            'message',
            {'message':"Optimized for Chrome Browser", 'buttonCount':0}
          );  
        }
      }, function() {
      });
      $scope.domControls.enablePlayback = true;
      $scope.timelineController.create();
      $scope.timelineController.changeCurrnetDate({'date':searchData.getSelectedDate()});
      
      UniversialManagerService.setPlayMode(CAMERA_STATUS.PLAY_MODE.PLAYBACK);
      playData.setStatus(PLAY_CMD.PLAYPAGE);
      playData.setTimelineMode(true);

      kindStreamInterface.setResizeEvent();
      kindStreamInterface.setCanvasStyle($scope.viewMode, 'Playback');
      workerManager.initVideo(false);

    };

    $scope.channelSetFunctions = {
      show: false
    };

    $scope.selectBackupTime = function() {
      $scope.timelineController.selectBackupTime();
    };

    $scope.setChannelSize = function(){
      kindStreamInterface.setResizeEvent();
      kindStreamInterface.setCanvasStyle($scope.viewMode, $scope.channelSetFunctions.show);
    };

    var setAccountData = function(response){
        var accountInfo = {};
        var data = response.data.Users;

        if(data.length > 0 ){       //admin, user
            accountInfo = data[0];
            UniversialManagerService.setUserId(data[0].UserID);
        }else{                      //guest
            accountInfo.UserID = 'guest';
            UniversialManagerService.setUserId('guest');
        }
        AccountService.setAccount(accountInfo);
        $rootScope.$emit('AccountInfoUpdated');
    };

    var getUserInfo = function() {
      return SunapiClient.get(
      '/stw-cgi/security.cgi?msubmenu=users&action=view', {},
      function(response) {
        setAccountData(response);
      },
      function(errorData,errorCode) {
        console.error(errorData);
      },
      {}, true);
    };    
    
    var getClientIP = function() {
      return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=getclientip&action=view',
      {},
      function(response) {
        $scope.ClientIPAddress = response.data.ClientIP;
        SessionOfUserManager.SetClientIPAddress($scope.ClientIPAddress);
      },
      function(errorData,errorCode) {
          console.error(errorData);
      }, '', true);
    };

    var getRtspIpMac = function() {
      return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=interface&action=view',
      {},
      function(response) {
        var rtspIp = response.data.NetworkInterfaces[0].IPv4Address;
        var macIp = response.data.NetworkInterfaces[0].MACAddress;
        ConnectionSettingService.SetRtspIpMac(rtspIp,macIp);
      },
      function(errorData,errorCode) {
          console.error(errorData);
      }, '', true);
    }

    var getRtspPort = function() {
      return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=rtsp&action=view',
      {},
      function(response) {
        var rtspPort = response.data.Port;
        ConnectionSettingService.SetRtspPort(rtspPort);
      },
      function(errorData,errorCode) {
          console.error(errorData);
      }, '', true);
    };
    
    $scope.$on('$stateChangeSuccess', 
      function(event, toState, toParams, fromState, fromParams){
        var prevPage = fromState;
        var curPage = toState;
        console.log(prevPage," :->", curPage);
        $timeout(self.init);
        self.resetUI();
        getRtspIpMac();
        getRtspPort();
        if(SessionOfUserManager.IsLoggedin()){
          var id = SessionOfUserManager.getUsername();
          var password = SessionOfUserManager.getPassword();
          ConnectionSettingService.setConnectionInfo({id:id, password:password});
          /**
           * When user refresh the browser, account is resetted.
           * So below lines is added.
           */
          getUserInfo();
          if(SessionOfUserManager.GetClientIPAddress() === '127.0.0.1')
          {
            getClientIP();
          }
          self.resetUI();
        }
        UniversialManagerService.setLiveStreamStatus(false);
        waitingPlaybackPage = true;
      }
    );

    $scope.$on('$destroy', function() {
      watchViewMode();
    });

    $rootScope.$saveOn('playbackBackup', function(event, data) {
      $scope.playPlayback(PLAY_CMD.BACKUP);
    }, $scope);

    $rootScope.$saveOn('enablePlayback', function(event, data) {
      $scope.domControls.enablePlayback = data;
      if( data === false )  {
        $scope.pageController.closePlayback();
      }
    }, $scope);

    function showPlaybackPage() {
      resetSetting();
      waitingPlaybackPage = false;
      SunapiClient.get('/stw-cgi/system.cgi?msubmenu=date&action=view', {},
        function(response) {
          var currentDay = response.data.LocalTime.split(" ")[0];
          var current = new Date(currentDay);
          current.setTime(current.getTime() + current.getTimezoneOffset()*60*1000);
          searchData.setDefaultDate(current);
          goToPlaybackPage();
        },
        function(errorDate){
        }, '', true);      
    }

    $rootScope.$saveOn('channelPlayer::initialized', function(event, data) {
      isChannelPlayerInit = true;
      if( waitingPlaybackPage === true && isTimelineInit === true) {
        showPlaybackPage();
      }
    }, $scope);

    $rootScope.$saveOn('timeline::initialized', function(event, data) {
      isTimelineInit = true;
      if( waitingPlaybackPage === true && isChannelPlayerInit === true) {
        showPlaybackPage();
      }
    }, $scope);

    $rootScope.$saveOn("channel:setPlugin", function() {
        $scope.pageController.closePlayback();
        $rootScope.$emit("channelPlayer:command", "close");
        var StreamingMode = UniversialManagerService.getStreamingMode();
        if(StreamingMode === CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE)
        {
            $(".cm_plugin-btn").addClass("cm_active");
            UniversialManagerService.setStreamingMode(CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE);
        }
        else
        {
            $(".cm_plugin-btn").removeClass("cm_active");
            UniversialManagerService.setStreamingMode(CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE);
        }
        goToPlaybackPage();
    }, $scope);

    $rootScope.$saveOn('channel:reloadStreaming', function() {
      var playData = new PlayDataModel();
      if(BrowserService.OSDetect === BrowserService.OS_TYPES.MACINTOSH && playData.getStatus() === PLAY_CMD.PLAY )
      {
        $scope.playPlayback(PLAY_CMD.PAUSE);
        $timeout(function(){
          $scope.playPlayback(PLAY_CMD.RESUME);
        });
      }
    }, $scope);

    var watchViewMode = $scope.$watch('viewMode', function(newVal, oldVal) {
      console.log("kind ", newVal);
      if(newVal === null){
        $scope.viewMode = self.getViewModeCmd(0);
        return;
      }
      // $scope.wisenetCameraFuntions[6].label = $scope.viewModeTitle = getViewModeTitle(newVal);
      // $scope.wisenetCameraFuntions[6].class = $scope.viewModeIcon = "tui-ch-live-view-" + newVal;
      $scope.viewModeIcon = "tui tui-ch-live-view-" + newVal;
      $scope.viewModeTitle = self.getViewModeTitle(newVal);
      kindStreamInterface.setCanvasStyle(newVal);
    });
}]);