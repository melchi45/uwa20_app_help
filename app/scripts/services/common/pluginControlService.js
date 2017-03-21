"use strict";
kindFramework
.service('PluginControlService', ['$rootScope', '$timeout', 'Attributes', 'SunapiClient', 'UniversialManagerService', '$interval',
  'kindStreamInterface', 'ModalManagerService', '$translate', 'CAMERA_STATUS', 'EventNotificationService', 'PlayDataModel',
  function($rootScope, $timeout, Attributes, SunapiClient, UniversialManagerService, $interval, 
    kindStreamInterface, ModalManagerService, $translate, CAMERA_STATUS, EventNotificationService, PlayDataModel){
    var sunapiAttributes = Attributes.get();  //--> not common.
    var pluginElement = null,
        rtspIP = null,
        rtspPort = null,
        userID = null,
        currentProfile = null;
    var backupCallback = null;
    var PlugInPromise = null;
    var playbackPromise = null;
    var playbackTime = '';
    var overlappedID = 0;
    var timelineCallback = null;
    var playbackCallback = null;
    var playSpeed = 1;
    var _self = this;
    var stepFlag = undefined;
    var playbackMode = 1;
    var liveStatusCallback = null;

    var windowEvent = window.attachEvent || window.addEventListener,
        beforeUnloadEvt = window.attachEvent ? 'onbeforeunload' : 'beforeunload'; 

    windowEvent(beforeUnloadEvt, function(e) {
      _self.stopStreaming();
    });

    this.startPluginStreaming = function(pluginObj, _ip, _port, _profile, _id, _password, statusCallback) {
      pluginElement = pluginObj;
      rtspIP = _ip;
      rtspPort = _port;
      userID = _id;
      currentProfile = _profile;
      liveStatusCallback = statusCallback;

      var resolution = UniversialManagerService.getProfileInfo().Resolution.split("x");
      pluginElement.width = parseInt(resolution[0], 10);
      pluginElement.height = parseInt(resolution[1], 10);
      
      var fps = UniversialManagerService.getProfileInfo().FrameRate;

      EventNotificationService.setBorderElement($(pluginElement), 'live');

      if(PlugInPromise !== null)
      {
        // pluginElement.PlayLiveStream 실행 도 중 Profile 변경 요청이 들어올 경우
        $timeout.cancel(PlugInPromise);
      }

      function startPlay(){
          if(reconnectionTimeout !== null)
          {
              $timeout.cancel(reconnectionTimeout);
          }

          PlugInPromise = $timeout(function(){
              try{
                  pluginElement.SetUserFps(fps);
                  pluginElement.PlayLiveStream(rtspIP, Number(rtspPort), Number(currentProfile-1), userID, '', '');
                  $rootScope.$emit('changeLoadingBar', false);
                  $(pluginElement).removeClass("cm_vn");
                  console.log("pluginControlService::startPluginStreaming() ===> PlugIn Streaming Started");
              }catch(err){
                  console.log("pluginControlService::startPluginStreaming() ===> PlugIn is loading...");
                  startPlay();
              }
          },500);
      }
      startPlay();
    };



    this.stopStreaming = function()
    {
      if(pluginElement !== null && pluginElement !== undefined ){
        if(UniversialManagerService.isSpeakerOn()){
          pluginElement.StopAudio();
        }
        if(UniversialManagerService.isMicOn()){
          pluginElement.StopTalk();
        }
        var pluginDestroyMode = 3;
        pluginElement.CloseStream();
        pluginElement.ChangeMode(pluginDestroyMode);
        if( backupCallback !== null ) {
          backupCallback({'errorCode' : 1}); // Instant recording end
          backupCallback = null;
        }
        pluginElement = null;
        console.log("pluginControlService::stopStreaming() ===> Plugin Streaming Stopped");
      }
    };

    this.startAudioListen = function()
    {
      if(pluginElement !== null && pluginElement !== undefined){
        pluginElement.SetVolume(0);
        pluginElement.StartAudio();
        console.log("pluginControlService::startAudioListen() ===> Plugin Audio Started");
      }      
    };

    this.stopAudioListen = function()
    {
      if(pluginElement !== null && pluginElement !== undefined){
        pluginElement.StopAudio();
        console.log("pluginControlService::stopAudioListen() ===> Plugin Audio stop");
      }
    };
    
    this.setAudioVolume = function(command)
    {
      if(pluginElement !== null && pluginElement !== undefined){
        pluginElement.SetVolume(command);
        console.log("pluginControlService::setAudioVolume() ===> Plugin Audio volume changed to " + command);
      }
    };

    this.startAudioTalk = function(){
      if(pluginElement !== null && pluginElement !== undefined){
        pluginElement.StartTalk('');
        // var vol = UniversialManagerService.getMicVol() * 20;
        // pluginElement.SetAudioTalkVolume(vol);
        console.log("pluginControlService::startAudioTalk() ===> Plugin Audio talk Started");
      }
    };

    this.stopAudioTalk = function(){
      if(pluginElement !== null && pluginElement !== undefined){
        pluginElement.StopTalk();
        console.log("pluginControlService::stopAudioTalk() ===> Plugin Audio talk Stop");
      }            
    };

    this.setAudioTalkVolume = function(command)
    {
      if(pluginElement !== null && pluginElement !== undefined){
        var vol = command * 20;
        pluginElement.SetAudioTalkVolume(vol);
        console.log("pluginControlService::setAudioTalkVolume() ===> Plugin Audio talk volume changed to " + command);
      }
    };    

    this.capture = function()
    {
      var strPath = pluginElement.SaveSnapShotNoDialog(MakeRecordFileName());
      console.log("pluginControlService::capture() ===> ");
      return strPath;
    };

    this.pixcelCount = function(command) {
      var rotate = UniversialManagerService.getRotate();
      var resolution = UniversialManagerService.getProfileInfo().Resolution.split("x");
      var width = parseInt(resolution[0], 10);
      var height = parseInt(resolution[1], 10);

      if(rotate === '90' || rotate === '270') {
        width = parseInt(resolution[1], 10);
        height = parseInt(resolution[0], 10);
      }

      pluginElement.SetPixelCounterOnOff_WH((command.cmd == true ? 1 : 0), parseInt(width), parseInt(height));
      console.log("pluginControlService::pixcelCount() ===> ");
    };
    /* Playback interface */
    function openStream() {
      PlugInPromise = $timeout(function(){
        try{
          pluginElement.SetUserFps(30);
          pluginElement.OpenRecordStream(rtspIP, Number(rtspPort), userID, '', '', overlappedID, playbackTime, '', playbackMode);
          $rootScope.$emit('changeLoadingBar', false);
          console.log("pluginControlService::startPlayback() ===> PlugIn playback Started");       
        }catch(err){
          console.log("pluginControlService::startPlayback() ===> PlugIn is loading...");
          openStream();
        }  
      },500);
    }

    this.startPlayback = function(pluginObj, data, _timelineCallback, errorCallback){

      pluginElement = pluginObj;

      pluginElement.width = 0;
      pluginElement.height = 0;

      playbackTime = data.time;
      rtspIP = data.rtspIP;
      rtspPort = data.rtspPort;
      userID = data.userID;
      playSpeed = 1;
      playbackMode = 1;

      overlappedID = Number(data.id);
      timelineCallback = _timelineCallback;
      playbackCallback = errorCallback;

      openStream();
    };

    this.startPlaybackBackup = function(pluginObj, data, errorCallback ) {

      pluginElement = pluginObj;
      pluginElement.width = 0;
      pluginElement.height = 0;

      playbackTime = data.time;
      rtspIP = data.rtspIP;
      rtspPort = data.rtspPort;
      userID = data.userID;
      playbackMode = 3;

      overlappedID = Number(data.id);
      timelineCallback = null;
      backupCallback = errorCallback;

      openStream();
    };

    this.applyResumeCommand = function(data) {
      if( pluginElement !== null && pluginElement !== undefined) {
        pluginElement.ResumeRecordStreamImmediate(data.time, data.needToImmediate);
        console.log("pluginControlService::applyResumeCommand() ===> data time: " + data.time);
      }
    };

    this.applyStepCommand = function(data) {
      var playdata = new PlayDataModel();
      var time = playdata.getCurrentPosition();

      if( pluginElement !== null && pluginElement !== undefined) {
        pluginElement.StepRecordStream((data === "forward" ? 1 : 2), time);
        stepFlag = true;
        console.log("pluginControlService::applyStepCommand() ===> direction: " + data);
      }
    };    

    this.applySeekCommand = function(data) {
      if( pluginElement !== null && pluginElement !== undefined) {
        pluginElement.PlayRecordStream(data.time,'',playSpeed);
        console.log("pluginControlService::applySeekCommand() ===> data time: " + data.time + "playSpeed" + playSpeed);
      }
    };

    this.applyPauseCommand = function() {
      pluginElement.PauseRecordStream();
      console.log("pluginControlService::applyPauseCommand()");
    };

    this.applyPlaySpeed = function(speed, data) {
      playSpeed = Number(speed);
      pluginElement.ChangePlaySpeed(Number(speed));
      console.log("pluginControlService::applyPlaySpeed() ===> speed: " + speed);
    };

    this.closePlaybackSession = function(){
      if( pluginElement !== null && pluginElement !== undefined) {
        if(UniversialManagerService.isSpeakerOn()){
          pluginElement.StopAudio();
        }
        pluginElement.CloseStream();
        timelineCallback = null;
        playbackCallback = null;
        pluginElement = null;
        console.log("pluginControlService::closePlaybackSession()");
      }
    };

    function leadingZeros(n, digits) 
    {
      var zero = '';
      n = n.toString();
      if (n.length < digits) {
          for (var i = 0; i < digits - n.length; i++)
              zero += '0';
      }
      return zero + n;
    }

    function MakeRecordFileName()
    {
      var date = new Date();
      var defaultFilename = sunapiAttributes.ModelName + "_" + 
      leadingZeros(date.getFullYear(), 4) + 
      leadingZeros(date.getMonth() + 1, 2) + 
      leadingZeros(date.getDate(), 2) + 
      leadingZeros(date.getHours(), 2) + 
      leadingZeros(date.getMinutes(), 2) + 
      leadingZeros(date.getSeconds(), 2);

      return defaultFilename;
    }

    this.startRecord = function(_callback)
    {
      if(pluginElement !== null && pluginElement !== undefined){
        backupCallback = _callback;
        // jshint ignore:line
        pluginElement.StartLocalRecording(MakeRecordFileName());
        console.log("pluginControlService::startRecord() ===> Start record");
      }
    };

    this.stopRecord = function(_callback)
    {
      if(pluginElement !== null && pluginElement !== undefined){
        // jshint ignore:line
        console.info(pluginElement);
        pluginElement.StopLocalRecording();
        console.log("pluginControlService::stopRecord() ===> Stop record");
      }
    };

    function updatePluginEventNotification(eventType, status){
      var data = {
        type:'',
        value: false,
        eventId: null
      };

      data.value = (status === 0) ? 'false': 'true';
      switch(eventType){
        case 1 : data.type = 'MotionDetection';
          break;
        case 2 : data.type = 'VideoAnalytics';
          break;
        case 3 : data.type = 'TamperingDetection';
          break;
        case 4 : data.type = 'FaceDetection';
          break;
        case 5 : data.type = 'DefocusDetection';
          break;
        case 6 : data.type = 'Fog';
          break;                    
        case 7 : data.type = 'AudioDetection';
          break;          
        case 8 : data.type = 'SoundClassification';
          break;
        case 9 : data.type = 'DigitalInput';
          break;
        case 10 : data.type = 'DigitalAutoTracking';
          break;           
        case 11 :                                      //alarm output : status == 10  ==> alarm ID : 1, status : true
          data.type = 'Relay';                         //alarm output : status == 11  ==> alarm ID : 1, status : false
          data.value = (status % 10 === 0) ? 'false': 'true';
          data.eventId = parseInt((status / 10), 10);
          break;
        case 12 : data.type = 'NetworkDisconnection';
          break;
        case 14 :                                              //QueueManagement : status == 10  ==> Level : High, status : false
          data.type = 'Queue';                                 //                  status == 11  ==> Level : High, status : true
          data.value = (status % 10 === 0) ? 'false': 'true';  //                  status == 20  ==> Level : Middle, status : false
          data.eventId = parseInt((status / 10), 10);          //                  status == 21  ==> Level : Middle, status : true
          break;          
      }

      EventNotificationService.updateEventStatus(data);
    }

    var reconnectionTimeout = null;
    window.WebCamEvent = function(evId, lp, rp) {
      $timeout(function(){window._WebCamEvent(evId, lp, rp);},0);
    };
    window._WebCamEvent = function(evId, lp, rp) {
      console.log("Plugin WebEvent callback =======> EventID :"+ evId +" Lparam : " + lp + "  Rparam : " + rp);
      switch(evId) {
        case 100:
          break;
        case 101: //Instant recording start
          if( backupCallback !== null ) {
            console.log("ErrorCallback Receive : Instant recording start");
            backupCallback({'errorCode' : 0});
          }
          break;
        case 102: //Instant recording end
          if( backupCallback !== null ) {
            console.log("ErrorCallback Receive : Instant recording end");
            backupCallback({'errorCode' : 1});
            backupCallback = null;
          }
          break;
        case 103: //Instant recording error
          if( backupCallback !== null ) {
            console.log("ErrorCallback Receive : Instant recording has error");
            backupCallback({'errorCode' : 1});
            backupCallback = null;
          }
          break;
        case 104: // Playback Backup start
          if( backupCallback !== null ) {
            console.log("ErrorCallback Receive : Playback backup start");
            $rootScope.$emit('changeLoadingBar', true);
            backupCallback({'errorCode' : 0, 'description' : 'backup'});
          }
          break;
        case 105: //Playback Backup end
          if( backupCallback !== null ) {
            console.log("ErrorCallback Receive : Playback backup end");
            backupCallback({'errorCode' : 1, 'description' : 'backup'});
            backupCallback = null;
          }
          break;
        case 106: //Playback Backup Error
          if( backupCallback !== null ) {
            console.log("ErrorCallback Receive : Playback backup occurs error");
            if(lp === 13 ) { //HT_CALLBACK_AVI_END_FILE_NO_SIZE
              backupCallback({'errorCode' : -3, 'description' : 'backup'});
            }
            else {
              backupCallback({'errorCode' : -1, 'description' : 'backup'});
            }
            backupCallback = null;
          }
          break;
        case 301: //Event Notification
          updatePluginEventNotification(lp, rp);
          break;
        case 351:
          if( timelineCallback !== null ) {
              timelineCallback({'timezone':lp,'timestamp':rp}, stepFlag !== undefined ? stepFlag : undefined);
          }
          break;
        case 352:
          if(reconnectionTimeout !== null)
          {
            $timeout.cancel(reconnectionTimeout);
            $rootScope.$emit('changeLoadingBar', false);
            ModalManagerService.close();
          }

          pluginElement.width = lp;
          pluginElement.height = rp;
          var viewMode = UniversialManagerService.getViewModeType();
          kindStreamInterface.setCanvasStyle(viewMode);
          break;
        case 400:
          if( rp === 1 ) {
            if( timelineCallback !== null ) {
              pluginElement.PlayRecordStream(playbackTime, '', playSpeed);
              if( playbackCallback !== null ) {
                playbackCallback({'errorCode':"200"});
              }              
            }
          }
          else if( rp === 3 ) {
            pluginElement.StartBackupRecording(sunapiAttributes.ModelName+"_"+playbackTime, playbackTime, '');
          }
          break;
        case 401:
          $timeout(function(){
            if( rp === 0 ) {
              rtspDigestAuth('live');
              $timeout(function(){
                if(UniversialManagerService.isSpeakerOn()){
                  _self.startAudioListen();
                  _self.setAudioVolume(UniversialManagerService.getSpeakerVol());
                }
                if(UniversialManagerService.isMicOn()){
                  _self.startAudioTalk();
                }
                if (UniversialManagerService.getPixelCount()) {
                  _self.pixcelCount({cmd:true});
                }
              },500);
            }
            else if( rp === 1 || rp === 3) {
              rtspDigestAuth('playback');
            }else if( rp === 2 ){
              rtspDigestAuth('audioTalk');
            }
          },100);
          break;
        case 402:
          console.log("402 error :: try reconnect");
          pluginElement.CloseStream();
          if(reconnectionTimeout !== null)
          {
              $timeout.cancel(reconnectionTimeout);
          }

          reconnectionTimeout = $timeout(liveStatusCallback, 5000, false, 999);

          $rootScope.$emit('changeLoadingBar', true);
          updatePluginEventNotification(12, 1);
          // $rootScope.$emit("pluginControlService:updateEvent", data);        
          break;
        case 503:
          if( UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK){
            if( playbackCallback !== null ) {
              playbackCallback({'errorCode' : "503"});
            }
          }else{
            if(rp == 2){
              liveStatusCallback(504);  //Talk service unavailable
            }else{
              liveStatusCallback(503);
            }
          }
          break;
        case 600:
          $rootScope.$emit('changeLoadingBar', (lp == 0 ? false : true));
          break;
      }
    };

    function rtspDigestAuth(mode){
      var getData = {};

      getData.Method = 'OPTIONS';
      
      if(mode === 'audioTalk'){
        getData.Realm = "iPOLiS";
        getData.Nonce = pluginElement.GetNonceAudioTalk();
      }else{
        getData.Realm = pluginElement.GetRealm();
        getData.Nonce = pluginElement.GetNonce();  
      }
      
      getData.Uri = encodeURIComponent(pluginElement.GetRtspUrl());

      SunapiClient.get('/stw-cgi/security.cgi?msubmenu=digestauth&action=view', getData,
        function(response) {
          var responseValue = response.data.Response;
          switch(mode){
            case 'live':
              var fps = UniversialManagerService.getProfileInfo().FrameRate;
              pluginElement.SetUserFps(fps);
              pluginElement.PlayLiveStream(rtspIP, Number(rtspPort), Number(currentProfile-1), userID, '', responseValue);
              break;
            case 'playback':
              pluginElement.SetUserFps(30);
              pluginElement.OpenRecordStream(rtspIP, Number(rtspPort), userID, '', responseValue, overlappedID, playbackTime, '', playbackMode);            
              break;
            case 'audioTalk':
              pluginElement.StartTalk(responseValue);
              break;
          }

        },
        function(errorData,errorCode) {
          console.error(errorData);
        },'',true);                            
    }
}]);