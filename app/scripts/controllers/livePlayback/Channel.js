/**
 * Created by miju462.park on 2016-05-12.
 */
/* global setTimeout, cordova, clearInterval, setInterval, BaseChannel, workerManager */
kindFramework
.controller('ChannelCtrl',
  ['$controller', '$scope', '$timeout', '$q', '$rootScope', '$location','LocalStorageService',
  'ConnectionSettingService', 'LoggingService', 'kindStreamInterface',
  'DigitalZoomService', 'CAMERA_TYPE', 'SunapiClient','PLAYBACK_TYPE',
  'SessionOfUserManager', 'ModalManagerService', 'UniversialManagerService',
  'CAMERA_STATUS', 'Attributes', 'CameraService', '$translate', 'AccountService', 
  'MultiLanguage','$state', 'SearchDataModel', 'PlayDataModel','KindProfileService',
  'PlaybackInterface','playbackStepService', 'RESTCLIENT_CONFIG', 'BrowserService', 'ExtendChannelContainerService', 'COMMONUtils',
    function($controller, $scope, $timeout,  $q, $rootScope, $location, LocalStorageService,
      ConnectionSettingService, LoggingService,kindStreamInterface, DigitalZoomService, 
      CAMERA_TYPE, SunapiClient,PLAYBACK_TYPE, SessionOfUserManager, ModalManagerService, 
      UniversialManagerService, CAMERA_STATUS, Attributes, CameraService, $translate, 
      AccountService, MultiLanguage, $state, SearchDataModel, PlayDataModel, KindProfileService, 
      PlaybackInterface, playbackStepService, RESTCLIENT_CONFIG, BrowserService, ExtendChannelContainerService,COMMONUtils) {
    "use strict";

    var self = this;
    var sunapiAttributes = Attributes.get();  //--> not common.
    var defaultProfileID = 2; // H.264
    var logger = LoggingService.getInstance('ChannelCtrl');
    
    var playbackInterfaceService = PlaybackInterface;
    var StreamTagType = 'canvas';
    var pageData = {};
    $scope.sliderRefreshInProgress = false;
    var DEFAULT_CHANNEL=0;
    var cameraMicEnable = false;
    var videoLimitFPS = 3;
    var videoLimitSize = 1920 * 1080;
    var isLivePageConnect = true;
    var audioEncodingType = null;

    BaseChannel.prototype.resetSetting = function() {
      if(UniversialManagerService.isSpeakerOn()){
        $scope.channelBasicFunctions.speakerStatus = false;
        $scope.channelBasicFunctions.speakerVolume = 0;
      }
      if(UniversialManagerService.isMicOn()){
        $scope.channelBasicFunctions.micStatus = false;
        $scope.channelBasicFunctions.micVolume = 0;
      }
      $scope.resetViewMode();
      kindStreamInterface.setCanvasStyle($scope.viewMode); // when open playback, set view mode as prev mode
      playbackStepService.init();
      DigitalZoomService.init();
    };

    BaseChannel.prototype.applyLiveMedia = function(playerdata) {
      var timeCallback = function(){};
      var errorCallback = function(){};
      var closeCallback = function(){};
      
      if( playerdata !== null) {
        $scope.playerdata = playerdata;
        $timeout(function(){
          if(typeof($scope.profileInfo) !== 'undefined') {
            $scope.playerdata = ConnectionSettingService.getPlayerData('live', $scope.profileInfo, timeCallback, errorCallback, closeCallback);
            // $rootScope.$emit('changeLoadingBar', true);
          }
        });
      }      
    };

    BaseChannel.prototype.changeLayout = function(cnt) {
      $scope.domControls.selectedChannelName = cnt + " channels view";
      $scope.channelLayout = cnt;
      self.resetUI();
    };

    BaseChannel.prototype.openFullView = function(event, info) {

      if( UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK) {
        var playData = new PlayDataModel();
        playData.setCurrentMenu('full');
        var searchData = new SearchDataModel();
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
        $scope.$apply(function() {
          $rootScope.$emit('channel:reloadStreaming');
          $scope.resetViewMode();
          kindStreamInterface.setCanvasStyle($scope.viewMode); //when open full screen, reset view mode with delaying
        });
      });
      $rootScope.$emit('fullscreenOpened', [sunapiAttributes.MaxROICoordinateX, sunapiAttributes.MaxROICoordinateY]);
      // }
    };

    BaseChannel.prototype.init = function() {
      isLivePageConnect = true;
      KindProfileService.setDeviceConnectionInfo(ConnectionSettingService.getConnectionSetting());
    };

    BaseChannel.prototype.visibilityFullScreenFalse = function() {
      $rootScope.$emit('app/scripts/controllers/livePlayback/main.js::toggleOverlay', false);
      self.viewModeIndex = 0;
      self.changeToDigitalZoom();
    };

    BaseChannel.prototype.revertSetting = function(newVal) {
      this.toggleSettingBodyHeight(newVal);
      // $scope.resetViewMode();
      if(newVal === false) { // when full screen closed
        kindStreamInterface.setResizeEvent();
        $scope.resetViewMode();
        kindStreamInterface.setCanvasStyle($scope.viewMode);
      }
    };

    BaseChannel.prototype.locationChange = function(next) {
      isLivePageConnect = false;
      if(next.indexOf('setup') !== -1 || next.indexOf('basic_videoProfile') !== -1) {
        $rootScope.$emit('channelPlayer:command', 'stopLive', false);
        if(UniversialManagerService.isSpeakerOn()){
          $scope.channelBasicFunctions.speakerStatus = false;
          $scope.channelBasicFunctions.speakerVolume = 0;
        }
        if(UniversialManagerService.isMicOn()){
          $scope.channelBasicFunctions.micStatus = false;
          $scope.channelBasicFunctions.micVolume = 0;
        }
        // kindStreamInterface.setCanvasStyle('fit'); // when go to setup page, set view mode as fit
        DigitalZoomService.init();
      }

    };

    angular.extend(this, $controller('BaseChannelCtrl', {
      $scope:$scope, $timeout:$timeout, $rootScope:$rootScope, LocalStorageService:LocalStorageService,
      LoggingService:LoggingService, CAMERA_TYPE:CAMERA_TYPE, SunapiClient:SunapiClient, 
      PLAYBACK_TYPE:PLAYBACK_TYPE, ModalManagerService:ModalManagerService, UniversialManagerService:UniversialManagerService,
      CAMERA_STATUS:CAMERA_STATUS, CameraService:CameraService, $state:$state, SearchDataModel:SearchDataModel, 
      PlayDataModel:PlayDataModel, PlaybackInterface:PlaybackInterface
    }));

    $scope.channelBasicFunctions = {
      rec: false,
      pixelCount: false,
      speakerEnable: false,
      speakerStatus: false,
      speakerVolume: false,
      micEnable: false,
      micStatus: false,
      micVolume: false
    };
    // var isPTZAble = AccountService.isPTZAble() === true;

    $scope.changeWisenetCameraFunctions = function(){
      //ptzTypeCheck();

      // $scope.wisenetCameraFuntions[2].show = (sunapiAttributes.isDigitalPTZ ? (UniversialManagerService.getUserId() === 'admin') : AccountService.isPTZAble());
      // $scope.wisenetCameraFuntions[3].show = ((sunapiAttributes.DigitalAutoTrackingOptions !== undefined) && (UniversialManagerService.getUserId() === 'admin'));
      // $scope.wisenetCameraFuntions[4].show = (AccountService.isAlarmOutputAble() === true);
      // $scope.wisenetCameraFuntions[5].show = (AccountService.isAudioInAble() === true);
      // $scope.wisenetCameraFuntions[6].show = (AccountService.isAudioOutAble() === true);
    };

    $scope.alarmOutput = function(index, event) {
      UniversialManagerService.setAlarmOutput(index, !UniversialManagerService.getAlarmOutput(index));
      var sunapiURI = '/stw-cgi/io.cgi?msubmenu=alarmoutput&action=control&AlarmOutput.'+ (index+1) +'.State=';
      if(UniversialManagerService.getAlarmOutput(index) === true){
        sunapiURI += 'On';
        $(event.target).addClass('cm_on');
      }else{
        sunapiURI += 'Off';
        $(event.target).removeClass('cm_on');
      }

      console.log("channel::alarmOutput sunapiURI = " + sunapiURI);
      SunapiClient.get(sunapiURI, {}, function() {}, function() {}, '', true);
    };

    var alarmOutputCheck = function() {
      var sunapiURI = '/stw-cgi/eventstatus.cgi?msubmenu=eventstatus&action=check';
      var successCallback = function(response) {
        if(response.data.AlarmOutput !== undefined) {
          for(var i=0; i<Object.keys(response.data.AlarmOutput).length; i++) {
            UniversialManagerService.setAlarmOutput(i, response.data.AlarmOutput[i+1]);
            if (response.data.AlarmOutput[i+1]) {
              $('#output-' + i).addClass('cm_on');
            } else {
              $('output-' + i).removeClass('cm_on');
            }
          }
        }
      };

      SunapiClient.get(sunapiURI, {}, successCallback, function() {}, '', true);
    };

    var ptzTypeCheck = function() {
      var curProfile = UniversialManagerService.getProfileInfo();

      $scope.ExternalPTZModel = sunapiAttributes.ExternalPTZModel;
      $scope.PTZModel = sunapiAttributes.PTZModel;
      $scope.DigitalPTZ = curProfile.IsDigitalPTZProfile;

      if ($scope.PTZModel === true) {
        $scope.currentPtzType = CAMERA_STATUS.PTZ_MODE.OPTICAL;   //4
      } else if ($scope.ExternalPTZModel === true) {
        $scope.currentPtzType = CAMERA_STATUS.PTZ_MODE.EXTERNAL;  //1
      } else if ($scope.ExternalPTZModel === false && $scope.DigitalPTZ === true) {
        $scope.currentPtzType = CAMERA_STATUS.PTZ_MODE.DIGITAL;  //2
      } else {
        $scope.currentPtzType = CAMERA_STATUS.PTZ_MODE.NONE;  //0
      }

      UniversialManagerService.setIsPtzType($scope.currentPtzType);
      console.log("channel::ptzTypeCheck currentPtzType = " + $scope.currentPtzType);
    };

    var resetUICameraFunctions = function(){
      //$scope.wisenetCameraFuntions[3].class = 'tui tui-ch-live-ptz-tracking-auto';
    };

    $scope.$watch('viewMode', function(newVal, oldVal) {
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

    function GetFlipMirror() {
      return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', '',
        function (response) {
          UniversialManagerService.setRotate(response.data.Flip[0].Rotate);
        },
          function (errorData) {
          console.log(errorData);
      }, '', true);
    }

    function GetClientIP() {
      return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=getclientip&action=view',
      {},
      function(response) {
        $scope.ClientIPAddress = response.data.ClientIP;
        SessionOfUserManager.SetClientIPAddress($scope.ClientIPAddress);
      },
      function(errorData,errorCode) {
          console.error(errorData);
      }, '', true);
    }

    function GetLanguage() {
      return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=deviceinfo&action=view', '',
      function (Response) {
        $scope.currentLanguage = Response.data.Language;
        MultiLanguage.setLanguage($scope.currentLanguage);
        console.log("[Refresh] current language = " + $scope.currentLanguage);
      },
      function (errorData) {
        console.log(errorData);
      }, '', true);
    }

    function GetUserInfo() {
      return SunapiClient.get(
      '/stw-cgi/security.cgi?msubmenu=users&action=view', {},
      function(response) {
        setAccountData(response);
        $scope.changeWisenetCameraFunctions();
        $scope.showAlarmOutput = AccountService.isAlarmOutputAble();
      },
      function(errorData,errorCode) {
        console.error(errorData);
      },
      {}, true);
    }    

    function imageenhancementsView() {
      
      return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imageenhancements&action=view', '',
        function (response) {
            $scope.ImageEnhancements = response.data.ImageEnhancements[DEFAULT_CHANNEL];
            pageData.ImageEnhancements = angular.copy($scope.ImageEnhancements);
            initImageEnhancementSettings();
        },
        function (errorData) {
            //alert(errorData);
        }, '', true);
    }
   
    $scope.enableSharpness = function() {
      if (pageData.ImageEnhancements.SharpnessEnable)
        $scope.ImageEnhancements.SharpnessEnable = false;
      else
        $scope.ImageEnhancements.SharpnessEnable = true;
        $scope.imageenhancementsSet();
    };

    $scope.imageenhancementsSet = function() {
      var setData = {},
              ignoredKeys = [],
              changed = false;

      if (angular.equals(pageData.ImageEnhancements, $scope.ImageEnhancements)) {
              return;
      }

      if ($scope.ImageEnhancements.SharpnessEnable !== true) {
          ignoredKeys.push('SharpnessLevel');
      }

      changed = COMMONUtils.fillSetData(setData, $scope.ImageEnhancements, pageData.ImageEnhancements,
                  ignoredKeys, false);

      if (changed) {
          if (setData.hasOwnProperty('SharpnessEnable') || setData.hasOwnProperty('SharpnessLevel')) {
              setData.SharpnessEnable = $scope.ImageEnhancements.SharpnessEnable;
              if ($scope.ImageEnhancements.SharpnessEnable === true) {
                  setData.SharpnessLevel = $scope.ImageEnhancements.SharpnessLevel;
              }
          }

          return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imageenhancements&action=set', setData,
                  function (response) {
                      COMMONUtils.updatePageData($scope.ImageEnhancements, pageData.ImageEnhancements,
                                  ignoredKeys);
                  },
                  function (errorData) {
                      //alert(errorData);
                  }, '', true);
      }
    };

    function initExposureSliders() {
        if ($scope.Brightness !== undefined) {
            $scope.BrigntnesSliderOptions = {
                floor: $scope.Brightness.minValue,
                ceil: $scope.Brightness.maxValue,
                showSelectionBar: true,
                getSelectionBarColor: function () {
                    return sunapiAttributes.sliderEnableColor;
                },
                getPointerColor: function () {
                    return sunapiAttributes.sliderEnableColor;
                },
                step: 1,
                keyboardSupport: false
            };
        }
        if ($scope.SharpnessLevel !== undefined) {
            $scope.SharpnessSliderOptions = {
                floor: $scope.SharpnessLevel.minValue,
                ceil: $scope.SharpnessLevel.maxValue,
                showSelectionBar: true,
                getSelectionBarColor: function () {
                    return sunapiAttributes.sliderEnableColor;
                },
                getPointerColor: function () {
                    return sunapiAttributes.sliderEnableColor;
                },
                step: 1,
                keyboardSupport: false
            };
        }
        if ($scope.Saturation !== undefined) {
            $scope.SaturationSliderOptions = {
                floor: $scope.Saturation.minValue,
                ceil: $scope.Saturation.maxValue,
                showSelectionBar: true,
                getSelectionBarColor: function () {
                    return sunapiAttributes.sliderEnableColor;
                },
                getPointerColor: function () {
                    return sunapiAttributes.sliderEnableColor;
                },
                step: 1,
                keyboardSupport: false
            };
        }
        if ($scope.Contrast !== undefined) {
            $scope.ContrastSliderOptions = {
                floor: $scope.Contrast.minValue,
                ceil: $scope.Contrast.maxValue,
                showSelectionBar: true,
                getSelectionBarColor: function () {
                    return sunapiAttributes.sliderEnableColor;
                },
                getPointerColor: function () {
                    return sunapiAttributes.sliderEnableColor;
                },
                step: 1,
                keyboardSupport: false
            };
        }
        $scope.refreshSliders();

    }

    $scope.refreshSliders = function(timeOutValue) {
      console.log("$scope.sliderRefreshInProgress=",$scope.sliderRefreshInProgress);
        if ($scope.sliderRefreshInProgress === false) {
            $scope.sliderRefreshInProgress = true;

            $timeout(function () {
            $scope.$broadcast('rzSliderForceRender');
            $scope.$broadcast('reCalcViewDimensions');
            $scope.sliderRefreshInProgress = false;
            });

            if(typeof timeOutValue !== 'undefined')
            {
                $timeout(function () {
                $scope.$broadcast('rzSliderForceRender');
                $scope.$broadcast('reCalcViewDimensions');
                $scope.sliderRefreshInProgress = false;
                },timeOutValue);
            }
        }

        $timeout(function () {
            $scope.$digest();
        });
    };

    function initImageEnhancementSettings() {
        $scope.Brightness = sunapiAttributes.Brightness;
        $scope.SharpnessLevel = sunapiAttributes.SharpnessLevel;
        $scope.Saturation = sunapiAttributes.Saturation;
        $scope.Contrast = sunapiAttributes.Contrast;
        initExposureSliders();
    }

    $scope.reset = function() {
        //temp default value 
        var response = {};
        response.Brightness = 50;
        response.Saturation = 50;
        response.Contrast = 50;
        response.SharpnessEnable = true;
        response.SharpnessLevel = 16;
        $scope.ImageEnhancements = response;
        $scope.imageenhancementsSet();
    };
    

    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      var prevPage = fromState;
      var curPage = toState;
      var functionList = [];
      isLivePageConnect = true;

      functionList.push(GetFlipMirror);
      functionList.push(initImageEnhancementSettings);
      functionList.push(getRtspIpMac);
      functionList.push(getRtspPort);
      if(prevPage.url === "/login"){
        if(SessionOfUserManager.IsLoggedin()){
          if(SessionOfUserManager.GetClientIPAddress() === '127.0.0.1')
          {
            functionList.push(GetClientIP);
          }
          self.resetUI();
        }else{
          $state.go('login');
        }
      }
      else{
        if(SessionOfUserManager.IsLoggedin()){
          functionList.push(GetLanguage);
          $scope.connectedService = self.optionServiceType[UniversialManagerService.getServiceType()];
          var id = SessionOfUserManager.getUsername();
          var password = SessionOfUserManager.getPassword();
          ConnectionSettingService.setConnectionInfo({id:id, password:password});

          /**
           * When user refresh the browser, account is resetted.
           * So below lines is added.
           */
          functionList.push(GetUserInfo);
          if(SessionOfUserManager.GetClientIPAddress() === '127.0.0.1')
          {
            functionList.push(GetClientIP);
          }
          self.resetUI();
        }
        UniversialManagerService.setLiveStreamStatus(false);
      }
      $q.seqAll(functionList).then(
          function(){
            setProfileInfo();
            imageenhancementsView();
          },
          function(errorData){
            console.error(errorData);
          }
      );
    });

    $scope.$on('$destroy', function(){
      isLivePageConnect = false;
    });

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

    var getDefaultProfileIndex = function() {
      var DEFAULT_CHANNEL=0;
      return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofilepolicy&action=view', '',
        function (response) {
          defaultProfileID = response.data.VideoProfilePolicies[DEFAULT_CHANNEL].DefaultProfile;
        },
        function (errorData) {
          ModalManagerService.open('message', { 'buttonCount': 0, 'message': errorData } );
        },'', true);
    };

    function getProfileByIndex(_profilelist, _profileindex) {
      if(AccountService.isProfileAble()) {
        for(var i = 0; i < _profilelist.length; i++) { 
          if(_profilelist[i].Profile === _profileindex) {
            return _profilelist[i];
          }
        }
      } else {
        return _profilelist[0];
      }
    }

    function getProfileIndex(profile){
      for(var i = 0, len = $scope.profileList.length; i < len; i++){
        if($scope.profileList[i].Profile == profile){
          return i;
        }
      }
    }

    function checkStreamTagType(profile) {
      var resolution = profile.Resolution.split("x");
      var resolutionSize = resolution[0] * resolution[1];
      var rec = $(".cm_live-rec");
      if (resolutionSize > videoLimitSize && profile.EncodingType === "H264" && profile.FrameRate >= videoLimitFPS
        && BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.CHROME) {
        return 'video';
      } else {
        rec
          .removeClass("cm_disabled")
          .parent()
            .removeAttr("disabled");
        return 'canvas';
      }
    }

    function getRtspIpMac() {
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

    function getRtspPort() {
      return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=rtsp&action=view',
      {},
      function(response) {
        var rtspPort = response.data.Port;
        ConnectionSettingService.SetRtspPort(rtspPort);
      },
      function(errorData,errorCode) {
          console.error(errorData);
      }, '', true);
    }

    function startStreaming(_requestProfile, isReconnect) {
        if( isLivePageConnect === false ) return;
        var plugin = (UniversialManagerService.getStreamingMode() === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE) ? true:false;
        var ip = (plugin === true) ? RESTCLIENT_CONFIG.digest.hostName : RESTCLIENT_CONFIG.digest.rtspIp;
        var port = RESTCLIENT_CONFIG.digest.rtspPort;
        var profile = _requestProfile.Profile;
        var id = SessionOfUserManager.getUsername();
        var password = SessionOfUserManager.getPassword();
        var streamtagtype = StreamTagType;

        $scope.domControls.profileInfo = $scope.profileInfo = _requestProfile;
        $scope.selectedProfile = getProfileIndex(_requestProfile.Profile);
        UniversialManagerService.setProfileInfo($scope.profileInfo);

        setAudioInEnable();
        if(UniversialManagerService.isSpeakerOn()){
          if($scope.channelBasicFunctions.speakerEnable){
            $scope.channelBasicFunctions.speakerStatus = true;
          }else{
            $scope.channelBasicFunctions.speakerStatus = false;
          }
        }
        setAudioOutEnable(cameraMicEnable);

        streamtagtype = checkStreamTagType(_requestProfile);

        $rootScope.$emit('changeLoadingBar', true);
        $rootScope.$emit('channelPlayer:play', plugin, ip, port, profile, id, password, streamtagtype, liveStatusCallback, isReconnect);

        ptzTypeCheck();
        alarmOutputCheck();
    }
    $rootScope.$saveOn('channel:reloadStreaming', function() {
      if(BrowserService.OSDetect === BrowserService.OS_TYPES.MACINTOSH)
      {
          startStreaming(UniversialManagerService.getProfileInfo());
      }
    }, $scope);
    // $rootScope.$emit('channel:reloadStreaming');

    var xmlHttp = new XMLHttpRequest();

    function liveStatusCallback(code, data) {
      switch(code) {
        case 503:
          ModalManagerService.open('message', { 'buttonCount': 1, 'message': $translate.instant('lang_unavailable_live_service') } );
          break;
        case 504: //Rtsp Audio talk unavailable
          ModalManagerService.open('message', { 'buttonCount': 1, 'message': $translate.instant('lang_unavailable_talk_service') } );
          $scope.channelBasicFunctions.micStatus = false;
          break;
        case 996: //Change PLUGINFREE Profile.
          $scope.profileList = UniversialManagerService.getProfileList();
          startStreaming($scope.profileList[data]);
          break;
        case 999: //Try reconnection
          reconnect();
          break;
        default:
        break;
      }
    }

    var reconnectionTimeout = null;

    function reconnect(){
      if(reconnectionTimeout !== null)
      {
          $timeout.cancel(reconnectionTimeout);
      }

      reconnectionTimeout = $timeout(function(){
        if(RESTCLIENT_CONFIG.serverType === 'grunt'){
          getVideoProfile().then(
            function(response) { 
              startStreaming(getProfileByIndex($scope.profileList, $scope.profileInfo.Profile), true); 
            }, 
            function(errorData) { 
              reconnect();
              console.log(errorData); 
            }
          );
        }else{
          try{
            xmlHttp.open( "POST", "../../home/pw_change.cgi?checkpwd="+encodeURIComponent('check'), true); // false for synchronous request
            xmlHttp.send( null );
          }catch(e){
            reconnect();
          }
        }        
      },500);
    }

    xmlHttp.onreadystatechange = function(){
        if(this.readyState === 4){
            if(this.status == 200){
                if(xmlHttp.responseText == "OK"){
                    window.setTimeout(RefreshPage, 500);
                }else{
                  return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=interface&action=view',{},
                  function(response) {
                    var macIp = response.data.NetworkInterfaces[0].MACAddress;
                    if(macIp == RESTCLIENT_CONFIG.digest.macAddress){
                      getVideoProfile().then(
                        function(response) { 
                          startStreaming(getProfileByIndex($scope.profileList, $scope.profileInfo.Profile), true); 
                        },
                        function(errorData) { console.log(errorData); }
                      );
                    }else{
                      window.setTimeout(RefreshPage, 500);
                    }
                  },
                  function(errorData,errorCode) {
                      console.error(errorData);
                  }, '', true);
                }
            }else if(this.status == 401){
                var unAuthHtml = "<html><head><title>401 - Unauthorized</title></head><body><h1>401 - Unauthorized</h1></body></html>";
                document.write(unAuthHtml);
            }else if(this.status == 490){
                var blockHtml = "<html><head><title>Account Blocked</title></head><body><h1>You have exceeded the maximum number of login attempts, please try after some time.</h1></body></html>";                            
                document.write(blockHtml);
            }else{
              reconnect();
            }
        }
    }

    function RefreshPage() {
        window.location.reload(true);
    }    

    var getVideoProfile = function() {
      var DEFAULT_CHANNEL=0;
      return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', '',
        function (response) {
          var ProfileList = response.data.VideoProfiles[DEFAULT_CHANNEL].Profiles;
          if(ProfileList.length > 1 && ProfileList[1].IsDigitalPTZProfile !== undefined)
          {
            sunapiAttributes.isDigitalPTZ = true;
            $scope.changeWisenetCameraFunctions();
          }
          $scope.profileList = ProfileList;
          UniversialManagerService.setProfileList(ProfileList);
        },
        function (errorData) {
          // ModalManagerService.open('message', { 'buttonCount': 0, 'message': errorData } );
        },'', true);
    };

    var setAudioInEnable = function() {
      if(AccountService.isAudioInAble()){
        if(audioEncodingType === 'AAC'){
            if(BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.FIREFOX || BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.EDGE){
                $scope.channelBasicFunctions.speakerEnable = false;
            }else{
                $scope.channelBasicFunctions.speakerEnable = $scope.profileInfo.AudioInputEnable;    
            }
        }else{
            $scope.channelBasicFunctions.speakerEnable = $scope.profileInfo.AudioInputEnable;    
        }
        
      }else{
        $scope.channelBasicFunctions.speakerEnable = false;
      }
    };

    var setAudioOutEnable = function(isEnabled) {
      var browserType = navigator.userAgent.toLowerCase();
      
      if(BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.SAFARI){    //Safari
        if(UniversialManagerService.getStreamingMode() === CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE){
          UniversialManagerService.setIsAudioOutEnabled(false);
          $scope.channelBasicFunctions.micEnable = false;
        }else{
          UniversialManagerService.setIsAudioOutEnabled(isEnabled);
          $scope.channelBasicFunctions.micEnable = isEnabled;          
        }
      }else{
        if(BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.CHROME && $location.protocol() === 'http'){  //chrome && http
          UniversialManagerService.setIsAudioOutEnabled(false);
          $scope.channelBasicFunctions.micEnable = false;
        }else{
          UniversialManagerService.setIsAudioOutEnabled(isEnabled);
          $scope.channelBasicFunctions.micEnable = isEnabled;
        }
      }
    };

    var getAudioOutEnabled = function(){
      var DEFAULT_CHANNEL=0;
      return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=audiooutput&action=view', '',
        function (response) {
          var isEnabled = response.data.AudioOutputs[DEFAULT_CHANNEL].Enable;
          setAudioOutEnable(isEnabled);
          cameraMicEnable = isEnabled;
        },
        function (errorData) {
          ModalManagerService.open('message', { 'buttonCount': 0, 'message': errorData } );
        },'', true);
    };

    var getAudioInEncodingType = function(){
      var DEFAULT_CHANNEL=0;
      return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=audioinput&action=view', '',
        function (response) {
          audioEncodingType = response.data.AudioInputs[DEFAULT_CHANNEL].EncodingType;
        },
        function (errorData) {

        },'', true);      
    };

    var setProfileInfo = function(){
      $q.seqAll([getDefaultProfileIndex, getVideoProfile]).then(
            function(){
              console.info('video profile successfully set in live page');
              var RequestProfile = getProfileByIndex($scope.profileList, defaultProfileID);
              startStreaming(RequestProfile);
              if(sunapiAttributes.MaxAudioOutput !== undefined && sunapiAttributes.MaxAudioOutput !== 0) {
                switch(UniversialManagerService.getUserId())
                {
                  case "admin":
                    getAudioOutEnabled();
                    getAudioInEncodingType();
                  break;
                  case "guest":
                    setAudioOutEnable(AccountService.isAudioOutAble());
                  break;
                  default:
                    if(AccountService.isAudioOutAble())
                    {
                      getAudioOutEnabled();
                    }
                    else
                    {
                      setAudioOutEnable(AccountService.isAudioOutAble());
                    }
                    getAudioInEncodingType();
                  break;
                }
              }
            },
            function(errorData){
              console.error(errorData);
            }
        );    
    };

    $rootScope.$saveOn('channel:pixelCount', function(data) {
      if ($scope.channelBasicFunctions.pixelCount) {
        kindStreamInterface.setCanvasStyle($scope.viewMode);
      }
    });

    $timeout(function(){
      $scope.isMultiImager = sunapiAttributes.MultiImager;
      $scope.MI_openFullScreen = false;
    });    

    $scope.videotagMode = function(value) {
      var RequestProfile = UniversialManagerService.getProfileInfo();
      if (value === "canvas") {
        StreamTagType = 'canvas';
        startStreaming(RequestProfile);
      } else if (value === "video") {
        StreamTagType = 'video';
        startStreaming(RequestProfile);
      }
    };

    $scope.MI_toggleFullScreen = function(type){
      $scope.MI_openFullScreen = type;
      if (type === true) {
        $scope.play3d();
      } else {
        $scope.stop3d();
      }
    };    

    $rootScope.$saveOn('channelPlayer:stopped', function(event, _errorCode, _profileNumber, _stringmingMode) {
      if(_errorCode === 'NOT_AVAIALBE')
      {
        $scope.profileList = UniversialManagerService.getProfileList();
        var RequestProfile = getProfileByIndex($scope.profileList, _profileNumber);
        $scope.profileInfo = RequestProfile;
        UniversialManagerService.setProfileInfo(RequestProfile);
        var StreamingMode = UniversialManagerService.getStreamingMode();

        if(StreamingMode !== _stringmingMode)
        {
          $rootScope.$emit("channel:setPlugin");
        }
        else
        {
          startStreaming(RequestProfile);
        }
      } else if (_errorCode == "CHANGE_VIDEOTAG") {
        $scope.videotagMode('video');
      } else if (_errorCode == "CHANGE_DEFAULT_PROFILE") {
        //change default profile
      }
    },$scope); 
    
    $rootScope.$saveOn('newProfile', function(event, _requestProfile){
      newProfile(_requestProfile);
    }, $scope);

    function newProfile(_requestProfile){
      LocalStorageService.setItem('prevProfile', _requestProfile);
      UniversialManagerService.setProfileInfo(_requestProfile);
      if ($scope.profileInfo.Profile !== _requestProfile.Profile) {
        resetUICameraFunctions();
        self.changeToDigitalZoom();
        DigitalZoomService.init();
        startStreaming(_requestProfile);
        $scope.resetViewMode();
        kindStreamInterface.setCanvasStyle($scope.viewMode);
      }      
    }

    $scope.checkPlugin = function() {
      return UniversialManagerService.getStreamingMode() == CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE ? false : true;
    };

    $rootScope.$saveOn("channel:setPlugin", function() {
      var StreamingMode = UniversialManagerService.getStreamingMode();
      var RequestProfile = getProfileByIndex($scope.profileList, defaultProfileID);

      if(StreamingMode === CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE)
      {
        $(".cm_plugin-btn").addClass("cm_active");
        UniversialManagerService.setStreamingMode(CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE);
      }
      else
      {
        $(".cm_plugin-btn").removeClass("cm_active");
        if(BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.IE)
        {
          var MJPEGProfileID = 1;
          RequestProfile = getProfileByIndex($scope.profileList, MJPEGProfileID);
        }
        UniversialManagerService.setStreamingMode(CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE);
      }
      startStreaming(RequestProfile);
    }, $scope);

    $scope.changeProfile = function(profileIndex){
      newProfile($scope.profileList[profileIndex]);
    };

    $scope.channelSetFunctions = {
      show: false,
      ptz: false,
      fisheye: false,
      setup: false,
      status: false
    };

    $scope.executePTZ = function(cmd) {
      ExtendChannelContainerService.executePTZ(cmd);
    };

    $scope.togglePTZFunction = function() {
      console.log("togglePTZFunction = " + $scope.domControls.zoomMode);
      if ($scope.domControls.zoomMode == "Digital Zoom") {
        $scope.domControls.zoomMode = "PTZ";
      } else {
        $scope.domControls.zoomMode = "Digital Zoom";
      }
    };

    $scope.setChannelSize = function(){
      kindStreamInterface.setResizeEvent();
      kindStreamInterface.setCanvasStyle($scope.viewMode, $scope.channelSetFunctions.show);
    };

    $scope.changeSpeaker = function(){
      if($scope.channelBasicFunctions.speakerEnable){
        if(UniversialManagerService.isSpeakerOn()){
          $scope.channelBasicFunctions.speakerStatus = false;
        }else{
          $scope.channelBasicFunctions.speakerStatus = true;
        }        
      }
    };

    $scope.$watch('channelBasicFunctions.speakerStatus', function(newVal, oldVal){
      if(newVal === oldVal || oldVal === undefined)
        return;

      $rootScope.$emit('channelPlayer:command', 'speakerStatus', newVal);
    });

    $scope.$watch('channelBasicFunctions.speakerVolume', function(newVal, oldVal){
      if(newVal === oldVal)
        return;

      $rootScope.$emit('channelPlayer:command', 'speakerVolume', newVal);
    });

    $scope.changeMic = function(){
      if($scope.channelBasicFunctions.micEnable){
        if(UniversialManagerService.isMicOn()){
          $scope.channelBasicFunctions.micStatus = false;
        }else{
          $scope.channelBasicFunctions.micStatus = true;
        }
      }
    };

    $scope.$watch('channelBasicFunctions.micStatus', function(newVal, oldVal){
      if(newVal === oldVal)
        return;

       $rootScope.$emit('channelPlayer:command', 'micStatus', newVal);
    });

    $scope.$watch('channelBasicFunctions.micVolume', function(newVal, oldVal){
      if(newVal === oldVal)
        return;

      $rootScope.$emit('channelPlayer:command', 'micVolume', newVal);
    });    

    $timeout(function(){
      $("#cm_speaker-slider div").slider({
        min: 0,
        max: 5,
        step: 1,
        slide:function(event, ui){
          if(!$scope.channelBasicFunctions.speakerStatus){
            event.stopPropagation();
            return false;
          }
        },
        stop: function(event, ui){
          if(!$scope.channelBasicFunctions.speakerStatus){
            console.log("AudioInput is disabled.");
            return;
          }

          $scope.$apply(function(){
            $scope.channelBasicFunctions.speakerVolume = ui.value;    
          });
        }
      });

      $("#cm_mic-slider div").slider({
        min: 0,
        max: 5,
        step: 1,
        slide: function(event, ui){
          if(!$scope.channelBasicFunctions.micStatus){
            event.stopPropagation();
            return false;
          }
        },
        stop: function(event, ui){
          if(!$scope.channelBasicFunctions.micStatus){
            console.log("AudioOutput is disabled.");
            return;
          }

          $scope.$apply(function(){
            $scope.channelBasicFunctions.micVolume = ui.value;
          });
        }        
      });

      $scope.$apply(function(){
        $scope.channelBasicFunctions.speakerStatus = false;
        $scope.channelBasicFunctions.speakerVolume = 0;
        $scope.channelBasicFunctions.micStatus = false;
        $scope.channelBasicFunctions.micVolume = 0;
      });

      $(".cm_video-slider").each(function(i, self){
        $(self).find("div")
          .slider({
            min: 0,
            max: 5,
            step: 1
          });
      });
    });
}]);