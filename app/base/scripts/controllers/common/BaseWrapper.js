function BaseWrapper($rootScope, $scope, RESTCLIENT_CONFIG, MultiLanguage,
  ROUTE_CONFIG,Attributes,SessionOfUserManager,$uibModalStack) {

    var self=this;
    var unsettransparentbackground = function() {
      console.log("WrapperCtrl::unsettransparentbackground");
      if($('.body').css('background-color') !== undefined && $('body').css('background-color').indexOf('0, 0, 0, 0') !== -1 ) {
        $('body').css('background-color', 'rgb(255,255,255)');
      }
      if($('.main').css('background-color') !== undefined && $('.main').css('background-color').indexOf('0, 0, 0, 0') !== -1 ) {
        $('.main').css('background-color', 'rgb(255,255,255)');
      }
      if($('html').css('background-color') !== undefined && $('.main').css('background-color').indexOf('0, 0, 0, 0') !== -1 ) {
        $('.html').css('background-color', 'rgb(255,255,255)');
      }
    };

    $rootScope.eventCallBack = function (ev)
    {
        console.log(ev.type);
    };

    /* By Default point to plugin free viewer */
    $rootScope.monitoringPath = '';
    $rootScope.updateMonitoringPath = function(){
        if ( SessionOfUserManager.CheckPlugin() ) {
            $rootScope.monitoringPath = '../home/monitoring.cgi';
        }else{
            $rootScope.monitoringPath = '#/uni/channel';
        }
    };
    $rootScope.updateMonitoringPath();

    $scope.clientVersion = RESTCLIENT_CONFIG.clientVersion;

    $scope.currentLanguage = MultiLanguage.getCurrentLanguage();
    $scope.languages = MultiLanguage.getLanguages();

    $scope.changeLanguage = function (name)
    {
        $scope.currentLanguage = name;
        MultiLanguage.setLanguage(name);
    };

    $scope.gnvData = ROUTE_CONFIG.routes;

    $scope.displayAlert = function ()
    {
        if ($("body").attr('class') === "body-small")
        {
            $(".navbar-static-side").css('display', 'block');
        }
    };
    $scope.nonDisplayAlert = function ()
    {
        if ($("body").attr('class') === "body-small")
        {
            $(".navbar-static-side").css('display', 'none');
        }
    };

    $scope.$on('menureload', function(event, msg) {
      console.log(msg);
      $scope.$apply();
    });
    var menuList = {
      "form": "common",
      //Monitoring menus
      "profile": "common",
      "view": "common",
      "ptz": "common",
      //Playback
      "eventSearch": "common",
      "timeSearch": "common",
      //setup main menus
      "basic": "common",
      "ptzSetup": "NWC",
      "videoAudio": "common",
      "network": "common",
      "event": "common",
      "analytics": "common",
      "system": "common",
      //Basic Menus
      "videoProfile": "common",
      "record" : "common",
      "user": "NWC",
      "dateTime": "common",
      "ipPort": "common",
      "eventSetup": "NWC",
      //PTZ Menus
      "preset": "NWC",
      "presetZoom": "NWC",
      "ptzInfoSetup": "NWC",
      "sequence": "NWC",
      "ptLimit": "NWC",
      "autoTrack": "NWC",
      "rs485": "NWC",
      "dptzSetup": "NWC",
      //Audio & Video
      "videoSetup": "NWC",
      "dewarpSetup": "NWC",
      "audioSetup": "common",
      "cameraSetup": "NWC",
      "smartCodec": "NWC",
      "simpleFocus": "NWC",
      "externalPtzSetup": "NWC",
      "wiseStream":"NWC",
      "imageAlign": 'common',
      //Network
      "logServer": "NWC",
      "ddns": "common",
      "ipFiltering": "common",
      "ssl": "common",
      "x802": "common",
      "snmp": "common",
      "qos": "NWC",
      "autoIpConfigure": "NWC",
      //Event
      "ftpemail": "common",
      "storage": "NWC",
      "alarmoutput": "NWC",
      "alarminput": "NWC",
      "timeSchedule": "NWC",
      "tamperDetection": "NWC",
      "defocusDetection": "NWC",
      "motionDetection": "NWC",
      "videoAnalytics": "NWC",
      "faceDetection": "NWC",
      "audioDetection": "NWC",
      "nwDisconnection": "NWC",
      "autoTrackEvent": "NWC",
      "appEvent": "NWC",
      "frostDetection": "NWC",
      //Analytics Menus
      "motionDetection/v2":"NWC",
      "fogDetection": "NWC",
      "iva": "NWC",
      "soundClassification": "NWC",
      //System Menus
      "productinfo": "common",
      "upgradeReboot": "common",
      "systemlog": "common",
      "opensdk": "NWC",
      "status": "NWC",
      "taskmanager": "NWC",
      "openplatform":"NWC",
      "peoplecounting": "common",
      "queue": "common",
      "heatmap": "common",
      "setup": "common",
      "statistics": "common",
      "search": "common"
    };

    $scope.isShowMenu = function (id)
    {
      var retVal = false;

      var mAttr1 = Attributes.get("eventsources");
      var mAttr2 = Attributes.get("system");
      var mAttr = $.extend(mAttr1, mAttr2);

      var menuId = getId(id);

      if ((menuList[menuId] === mAttr.DeviceType) || (menuList[menuId] === 'common'))
      {
        if (menuId === "simpleFocus")
        {
            retVal = mAttr.SimpleFocus;
        }
        else if (menuId === "ptz" || menuId === "ptzInfoSetup" || menuId === "preset" || menuId === "sequence" || menuId === "ptLimit" || menuId === "autoTrack" || menuId === "autoTrackEvent")
        {
            if (menuId === "preset" || menuId === "sequence" || menuId === "autoTrack"){ // -> page change : ptzInfoSetup 
                retVal = false;
            } else {
                retVal = mAttr.PTZModel;
            }
        }
        else if (menuId === "rs485" || menuId === "rs485422")
        {
            if(menuId === "rs485"){
                if(mAttr.PTZModel == true && mAttr.RS422Support == false){
                    retVal = true;
                }else{
                    retVal = false;
                }
            }else{
                if(mAttr.PTZModel == true && mAttr.RS422Support == false){
                    retVal = false;
                }else{
                    retVal = true;
                }
            }
        }
        else if (menuId === "presetZoom")
        {
            retVal = mAttr.ZoomOnlyModel;
        }
        else if (menuId === "logServer")
        {
            retVal = mAttr.LogServerSupport;
        }
        else if (menuId === "externalPtzSetup")
        {
            retVal = mAttr.ExternalPTZModel;
        }
        else if (menuId === 'ptzSetup')
        {
            if(mAttr.isDigitalPTZ && (mAttr.MaxGroupCount >0))
            {
                if(mAttr.FisheyeLens)
                {
                    // PNF-9010 model doesn't have PTZ tab. DPTZ setup is in Basic Tab.
                    // WN5 models has PTZ tab, DPTZ setup is in PTZ tab
                    retVal = false;
                }
                else
                {
                    retVal = true;
                }
            }
            else
            {
                retVal = (mAttr.ExternalPTZModel || mAttr.PTZModel || mAttr.ZoomOnlyModel);
            }
        }
        else if (menuId === 'smartCodec')
        {
            retVal = (mAttr.MaxSmartCodecArea !== 0);
        }
        else if(menuId === 'wiseStream')
        {
            if(typeof mAttr.WiseStreamSupport === 'undefined' || mAttr.WiseStreamSupport === false)
            {
                return false;
            }
            else
            {
                return true;
            }
        }
        else if (menuId === "videoAnalytics")
        {
            if (mAttr.VideoAnalyticsSupport === true)
            {
                retVal = true;
            }
            else
            {
                retVal = false;
            }

        }
        else if (menuId === "imageAlign")
        {
          if(mAttr.MultiImager === true){
            retVal = true;
          }else{
            retVal = false;
          }
        }
        else if (menuId === "motionDetection")
        {
            if (mAttr.VideoAnalyticsSupport === false)
            {
                retVal = true;
            }
            else
            {
                retVal = false;
            }
        }
        else if (menuId === "upgradeReboot")
        {
            retVal = mAttr.FWUpdateSupport;
        }
        else if (menuId === "faceDetection")
        {
            retVal = mAttr.FaceDetectionSupport;
        }
        else if (menuId === "audioDetection")
        {
          if(mAttr.MaxAudioInput === 0 || mAttr.MaxAudioOutput === 0){
            retVal = false;
          } else {
            retVal = true;
          }
        }
        else if (menuId === "defocusDetection")
        {
            retVal = mAttr.DefocusDetectionSupport;
        }
        else if (menuId === "alarmoutput")
        {
            retVal = (mAttr.MaxAlarmOutput !== 0);
        }
        else if (menuId === "alarminput")
        {
            retVal = (mAttr.MaxAlarmInput !== 0);

            /** If Daynight mode is External, then Alarm Input should not be shown */
            if (mAttr.cameraCommandResponse !== undefined) {
                if (mAttr.cameraCommandResponse.DayNightMode === 'ExternalBW') {
                    retVal = false;
                }
            }
        }
        else if (menuId === "ftpemail")
        {
            if (mAttr.SMTPSupport || mAttr.FTPSupport)
            {
                retVal = true;
            }
        }
        else if (menuId === "taskmanager")
        {
            retVal = false;
        }
        else if (menuId === "opensdk" || menuId === "appEvent" || menuId === "openplatform")
        {
            retVal = mAttr.OpenSDKSupport;
        }
        else if (menuId === "dewarpSetup")
        {
            retVal = (mAttr.FisheyeLens === true) && (mAttr.profileViewModeType === undefined);
        }
        else if ( menuId === "dptzSetup")
        {
          if((mAttr.isDigitalPTZ === true) && (mAttr.MaxGroupCount > 0)){
            retVal = true;
          }
          else{
            retVal = false;
          }
        }
        else if (menuId === "peoplecounting" || menuId === "statistics")
        {
          if(mAttr.PeopleCount){
            retVal = true;
          }else{
            retVal = false;
          }
        }
        else if(menuId === "queue" || menuId === "statistics"){
          if(mAttr.QueueManagement){
            retVal = true;
          }else{
            retVal = false;
          }
        }
        else if(menuId === "heatmap" || menuId === "statistics"){
          if(mAttr.HeatMap){
            retVal = true;
          }else{
            retVal = false;
          }
        }
        else if(menuId === "snmp") {
            if (mAttr.SNMPVersion1 || mAttr.SNMPVersion2 || mAttr.SNMPVersion3 || mAttr.SNMPTrapEnable) {
                retVal = true;
            } else {
                retVal = false;
            }
        }
        else if(menuId === "audioSetup"){
          if(mAttr.MaxAudioInput === 0 || mAttr.MaxAudioOutput === 0){
            retVal = false;
          } else {
            retVal = true;
          }
        }
        else if(menuId === "storage"){
            if(mAttr.StorageEnable) {
                retVal = true;
            } else {
                retVal = false;
            }
        }
        else if(menuId === "soundClassification"){
          if(mAttr.MaxAudioInput === 0 || mAttr.MaxAudioOutput === 0){
            retVal = false;
          } else {
            retVal = true;
          }
        }
        else if(menuId === "record"){
          if(parseInt(mAttr.CGIVersion.replace(/\.{1,}/g,'')) >= 253){ //2.5.3 ���� �̻��� ��
            retVal = true;
          }else{
            retVal = false;
          }
        }
        else
        {
            retVal = true;
        }
      }
      else if ((menuId === undefined) || (menuList[menuId] === undefined))
      {
          //LogManager.error("Undefined Menu Fix it!", id);
      }

      return retVal;
    };
    function getId(id)
    {
      var newIds = null;
      var splitKey = "";

      if(id.indexOf('_') > -1){
        splitKey = '_';
      }else{
        splitKey = '.';
      }

      newIds = id.split(splitKey);
      newIds = newIds[newIds.length - 1];

      return newIds;
      /*
      var newIds = id.split('_');

      if (newIds.length === 2)
      {
          newIds = newIds[1];
          return newIds;
      }
      else
      {
          newIds = id;
      }

      newIds = newIds.split('.');

      if (newIds.length === 2)
      {
          newIds = newIds[1];
      }

      return newIds;
      */
    }

    $scope.isShowHeader = function (id)
    {
      if (id === undefined)
      {
          return true;
      }
      if (getId(id) === 'taskmanager')
      {
          return false;
      }
      return true;
    };

    $rootScope.$saveOn("$locationChangeStart", function(event, next, current) {
      try {
          $uibModalStack.dismissAll();
      } catch (e) {
      }
      var className = "is-login";
      var body = $('body');

      console.log("kind $locationChangeStart ", next.indexOf("login") !== -1);
      if (next.indexOf("login") !== -1) {
        if (!body.hasClass(className)) {
          body.addClass(className);
        }
      }
      else{
        if (body.hasClass(className)) {
          body.removeClass(className);
        }
      }
      $rootScope.$emit('scripts/controllers/common/wrapper.js::$locationChangeStart');
    }, $scope);

    $rootScope.$saveOn('$stateChangeStart', function (event, toState, toParams, fromState, fromParams)
    {
      /**
       * Temporary Comment
       * @auther Yongku Cho
       * @date 2016-02-23
       */

      self.stateChange(toState,fromState);
      var className = "is-login";
      var body = $('body');

      if (toState.name === "login")
      {
        if (!body.hasClass(className))
        {
            body.addClass(className);
        }
      }
      else
      {
        if (body.hasClass(className))
        {
            body.removeClass(className);
        }
      }
    }, $scope);

    $rootScope.$saveOn('unsettransparentbackground', function(event) {
      return unsettransparentbackground();
    }, $scope);
}

BaseWrapper.prototype.stateChange = function(toState,fromState){};

kindFramework
.controller('BaseWrapper', ['$rootScope', '$scope', 'RESTCLIENT_CONFIG',
  'MultiLanguage','ROUTE_CONFIG','Attributes','SessionOfUserManager', '$uibModalStack',
  BaseWrapper
]);