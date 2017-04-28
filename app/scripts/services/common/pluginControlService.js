"use strict";
kindFramework
.service('PluginControlService', ['$rootScope', '$timeout', 'Attributes', 'SunapiClient', 'UniversialManagerService', '$interval',
  'kindStreamInterface', 'ModalManagerService', '$translate', 'CAMERA_STATUS', 'EventNotificationService', 'PlayDataModel', 'PTZContorlService', 'PTZ_TYPE', 'RESTCLIENT_CONFIG',
  function($rootScope, $timeout, Attributes, SunapiClient, UniversialManagerService, $interval, 
    kindStreamInterface, ModalManagerService, $translate, CAMERA_STATUS, EventNotificationService, PlayDataModel, PTZContorlService, PTZ_TYPE, RESTCLIENT_CONFIG){
    var sunapiAttributes = Attributes.get();  //--> not common.
    var pluginElement = null,
        rtspIP = null,
        rtspPort = null,
        userID = null,
        password = null,
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
      rtspIP = RESTCLIENT_CONFIG.digest.hostName;
      rtspPort = _port;
      userID = _id;
      password = _password;
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
                  if(sunapiAttributes.MaxChannel > 1) {
                    pluginElement.SetWMDInitialize(Number(UniversialManagerService.getChannelId()), 1, "WebCamJSONEvent");
                  }
                  pluginElement.SetUserFps(fps);
                  pluginElement.PlayLiveStream(rtspIP, Number(rtspPort), Number(currentProfile-1), userID, '', '');
                  $rootScope.$emit('changeLoadingBar', false);
                  $(pluginElement).removeClass("cm-visibility-hidden");
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
      if(PlugInPromise !== null) {
        $timeout.cancel(PlugInPromise);
        PlugInPromise = null;
      }
      if(pluginElement !== null && pluginElement !== undefined ){
        $(pluginElement).css("border", "3px solid transparent");
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
        var checkMic = pluginElement.StartTalk('');
        if(parseInt(checkMic,10) !== 1){
          liveStatusCallback(504);    //Talk service unavailable
        }
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
          if(sunapiAttributes.MaxChannel > 1) {
            pluginElement.SetWMDInitialize(Number(UniversialManagerService.getChannelId()), 1, "WebCamJSONEvent");
          }
          pluginElement.SetUserFps(30);
          pluginElement.OpenRecordStream(rtspIP, Number(rtspPort), userID, '', '', overlappedID, playbackTime, '', playbackMode);
          $rootScope.$emit('changeLoadingBar', false);
          $(pluginElement).removeClass("cm_vn");
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
      rtspIP = RESTCLIENT_CONFIG.digest.hostName;
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
      rtspIP = RESTCLIENT_CONFIG.digest.hostName;
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
      playdata.setDefautPlaySpeed();
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

    this.setManualTrackingMode = function(_mode)
    {
      try {
          if(pluginElement !== null && pluginElement !== undefined){
              // jshint ignore:line
              if(_mode !== true && _mode !== false)
              {
                  throw new Error(300, "Argument Error");
                  return;
              }

              if(_mode)
              {
                  pluginElement.SetManualTrackingModeOnOff(1);
              }
              else
              {
                  pluginElement.SetManualTrackingModeOnOff(0);
              }
              console.log("pluginControlService::setManualTrackingMode() ===>" + _mode + " Manual Tracking");
          }
          else
          {
              throw new Error(400, "PlugIn Element is empty");
          }
      }catch (e)
      {
          console.log(e.message);
      }
    };

    this.setAreaZoomMode = function(_mode)
    {
      try{
          if(pluginElement !== null && pluginElement !== undefined){
              // jshint ignore:line
              if(_mode !== true && _mode !== false)
              {
                  throw new Error(300, "Argument Error");
                  return;
              }

              if(_mode)
              {
                  pluginElement.SetAreaZoomOnOff(1);
              }
              else
              {
                  pluginElement.SetAreaZoomOnOff(0);
              }
              console.log("pluginControlService::setAreaZoomMode() ===>" + _mode + " Area Zoom");
          }
          else
          {
              throw new Error(400, "PlugIn Element is empty");
          }
      }catch(e)
      {
          console.log(e.message);
      }
    };

    this.setAreaZoomAction = function(_command)
    {
      try{
          switch (_command)
          {
              case '1X':
                  PTZContorlService.getPTZAreaZoomURI("1x");
                  break;
              case 'Prev':
                  PTZContorlService.getPTZAreaZoomURI("prev");
                  break;
              case 'Next':
                  PTZContorlService.getPTZAreaZoomURI("next");
                  break;
          }
      }catch(e)
      {
          console.log(e.message);
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
        case 13 :  //for AreaZoom, PT & Zoom are IDLE
          $rootScope.$emit('PTZMoveStatus', {type: 'MoveStatus:PanTilt', value:'IDLE'});
          $rootScope.$emit('PTZMoveStatus', {type: 'MoveStatus:Zoom', value:'IDLE'});
          break;
        case 14 :                                              //QueueManagement : status == 10  ==> Level : High, status : false
          data.type = 'Queue';                                 //                  status == 11  ==> Level : High, status : true
          data.value = (status % 10 === 0) ? 'false': 'true';  //                  status == 20  ==> Level : Middle, status : false
          data.eventId = parseInt((status / 10), 10);          //                  status == 21  ==> Level : Middle, status : true
          break;
        case 15 :
          data.type = 'AutoTracking';
          $rootScope.$emit('AutoTrackingStatus', {type: 'AutoTracking', value: data.value});
          break;
      }

      EventNotificationService.updateEventStatus(data);
    }

    function runManualTracking(xPos, yPos)
    {
        var pluginElement = document.getElementsByTagName("channel_player")[0].getElementsByTagName("object")[0];

        PTZContorlService.setMode(PTZ_TYPE.ptzCommand.TRACKING);
        PTZContorlService.setManualTrackingMode("True");

        if(xPos >=0  && yPos >= 0) {
            var rotate = UniversialManagerService.getRotate();
            if(rotate === '90' || rotate === '270') {
                xPos = Math.ceil(xPos*(10000 / pluginElement.offsetHeight));
                yPos = Math.ceil(yPos*(10000 / pluginElement.offsetWidth));
            } else {
                xPos = Math.ceil(xPos*(10000 / pluginElement.offsetWidth));
                yPos = Math.ceil(yPos*(10000 / pluginElement.offsetHeight));
            }
            PTZContorlService.execute([xPos, yPos]);
        }
    }

    function runAreaZoom(Pos1, Pos2)
    {
      var setData = {};
      var pluginElement = document.getElementsByTagName("channel_player")[0].getElementsByTagName("object")[0];

      var LengthPos1 = String(Pos1).length;
      var LengthPos2 = String(Pos2).length;
      setData.X1 = parseInt(Number(Pos1) / 10000);
      setData.Y1 = Number(String(Pos1).substring(LengthPos1-3, LengthPos1));

      setData.X2 = parseInt(Number(Pos2) / 10000);
      setData.Y2 = Number(String(Pos2).substring(LengthPos2-3, LengthPos2));

      setData.TileWidth = pluginElement.offsetWidth;
      setData.TileHeight = pluginElement.offsetHeight;

      PTZContorlService.setPTZAreaZoom("start");
      PTZContorlService.runPTZAreaZoom(setData.X1, setData.Y1, setData.X2, setData.Y2, setData.TileWidth, setData.TileHeight);
    }

    var reconnectionTimeout = null;
    window.WebCamEvent = function(evId, lp, rp) {
      $timeout(function(){
        _WebCamEvent(evId, lp, rp);
      },0);
    };
    function _WebCamEvent(evId, lp, rp) {
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
        case 311: //AreaZoom
            runAreaZoom(lp, rp);
            break;
        case 312: //Manual Tracking
            runManualTracking(lp, rp);
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
          switch(rp)
          {
            case 0:  // RTSP Live Stream is connected
              //ManualTracking is Always On for PTZ model
              if(sunapiAttributes.PTZModel)
              {
                $rootScope.$emit('channelPlayer:command', 'manualTracking', true);
              }
              break;
            case 1:
              if( timelineCallback !== null ) {
                pluginElement.PlayRecordStream(playbackTime, '', playSpeed);
                if( playbackCallback !== null ) {
                  playbackCallback({'errorCode':"200"});
                }
              }
              break;
            case 3:
              pluginElement.StartBackupRecording(sunapiAttributes.ModelName+"_"+playbackTime, playbackTime, '');
              break;
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

    window.WebCamJSONEvent = function(ch, evId, sdata) {  //Mutl-directional Plugin webEvent
        setTimeout(function () {
            _WebCamJSONEvent(ch, evId, sdata);
        }, 0)
    };
    function _WebCamJSONEvent(ch, evId, sdata) {
      console.log("WebCamJSONEvent ch, evId, sdata => ", ch, evId, sdata);

      var jsonData = null;
      
      try{
        jsonData = JSON.parse(sdata);   //safari
      }catch(e){
        jsonData = sdata;               //ie
      }
      
      switch(evId) {
          case 100:
              if (viewMode == '4ch') {
                  viewer_mode_change(1, ch);
              } else {
                  viewer_mode_change(4, ch);
              }                
              break;
          case 101:   //Instant recording start
              if( backupCallback !== null ) {
                  console.log("ErrorCallback Receive : Instant recording start");
                  backupCallback({'errorCode' : 0});
              }
              break;
          case 102:   //Instant recording end
              /*  jsonData
                  {
                      type: 종료type
                  }
              */
              if( backupCallback !== null ) {
                  console.log("ErrorCallback Receive : Instant recording end");
                  backupCallback({'errorCode' : 1});
                  backupCallback = null;
              }
              break;
          case 103:   //Instant recording error
              /*  jsonData
                  {
                      type: 종료type
                  }
              */                
              if( backupCallback !== null ) {
                  console.log("ErrorCallback Receive : Instant recording has error");
                  backupCallback({'errorCode' : 1});
                  backupCallback = null;
              }
              break;
          case 104:   //Playback Backup start
              if( backupCallback !== null ) {
                  console.log("ErrorCallback Receive : Playback backup start");
                  $rootScope.$emit('changeLoadingBar', true);
                  backupCallback({'errorCode' : 0, 'description' : 'backup'});
              }
              break;
          case 105:   //Playback Backup end
              /*  jsonData
                  {
                      type: 종료type
                  }
              */                
              if( backupCallback !== null ) {
                  console.log("ErrorCallback Receive : Playback backup end");
                  backupCallback({'errorCode' : 1, 'description' : 'backup'});
                  backupCallback = null;
              }
              break;
          case 106:   //Playback Backup Error
              /*  jsonData
                  {
                      type: 종료type
                  }
              */                
              if( backupCallback !== null ) {
                  console.log("ErrorCallback Receive : Playback backup occurs error");
                  if(jsonData.type === 13 ) { //HT_CALLBACK_AVI_END_FILE_NO_SIZE
                      backupCallback({'errorCode' : -3, 'description' : 'backup'});
                  }
                  else {
                      backupCallback({'errorCode' : -1, 'description' : 'backup'});
                  }
                  backupCallback = null;
              }
              break;
          case 301:   //Event Notification
              /*  jsonData
                  {
                      data: Metadata,
                      type: metadata type
                  }
              */
              // updatePluginEventNotification(lp, rp);
              break;
          case 311:   //AreaZoom
              /*  jsonData
                  {
                      x1: x1 좌표,
                      y1: y1 좌표,
                      x2: x2 좌표,
                      y2: y2 좌표
                  }
              */                
              // runAreaZoom(lp, rp);
              break;
          case 312:   //Manual Tracking
              /*  jsonData
                  {
                      x1: x1 좌표,
                      y1: y1 좌표   
                  }
              */
              // runManualTracking(lp, rp);
              break;
          case 351:   //playback timestamp
              /*  jsonData
                  {
                      gmp: GMP Data,
                      time: timeStamp
                  }
              */
              if( timelineCallback !== null ) {
                timelineCallback({'timezone':jsonData.gmp,'timestamp':jsonData.time}, stepFlag !== undefined ? stepFlag : undefined);
              }
              break;
          case 352:   //streaming resolution info
              /*  jsonData
                  {
                      width: 1920,
                      height: 1080
                  }
              */                
              // if(reconnectionTimeout !== null)
              // {
              //     $timeout.cancel(reconnectionTimeout);
              //     $rootScope.$emit('changeLoadingBar', false);
              //     ModalManagerService.close();
              // }

              pluginElement.width = jsonData.width;
              pluginElement.height = jsonData.height;
              var viewMode = UniversialManagerService.getViewModeType();
              kindStreamInterface.setCanvasStyle(viewMode);
              break;
          case 400:   //rtsp connection success
              /*  jsonData
                  {
                      retrycnt: 접속 횟수,
                      type: 연결 타입
                  }
              */
              if( jsonData.type === 1 ) {
                  if( timelineCallback !== null ) {
                    pluginElement.PlayRecordStream(playbackTime, '', playSpeed);
                    if( playbackCallback !== null ) {
                        playbackCallback({'errorCode':"200"});
                    }              
                  }
              }
              else if( jsonData.type === 3 ) {
                  pluginElement.StartBackupRecording(sunapiAttributes.ModelName+"_"+playbackTime, playbackTime, '');
              }
              break;
          case 401:   //rtsp unauthorized(401)
              /*  jsonData
                  {
                      retrycnt: 접속 횟수,
                      type: 연결 타입
                  }
              */                
              $timeout(function(){
                if( jsonData.type === 0 ) {
                  rtspDigestAuth('live');
                  $timeout(function() {
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
                } else if( jsonData.type === 1 || jsonData.type === 3) {
                  rtspDigestAuth('playback');
                } else if( jsonData.type === 2 ) {
                  rtspDigestAuth('audioTalk');
                }
              },100);
              break;
          case 402:   //rtsp disconnection(5초간 미수신시)
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
          case 403:   //Rtsp 사용자 계정 블록?
              /*  jsonData
                  {
                      retrycnt: 접속 횟수,
                      type: 연결 타입
                  }
              */
              break;
          case 404:   //Rtsp not found(404)
              /*  jsonData
                  {
                      retrycnt: 접속 횟수,
                      type: 연결 타입
                  }
              */                    
              break;
          case 405:   //Rtsp client error
              /*  jsonData
                  {
                      retrycnt: 접속 횟수,
                      type: 연결 타입
                  }
              */                    
              break;
          case 455:   //Call invalid rtsp method 
              break;                    
          case 457:   //Rtsp range error
              break;                    
          case 503:   //Rtsp service not available(503)
              /*  jsonData
                  {
                      retrycnt: 접속 횟수,
                      type: 연결 타입
                  }
              */                
              if( UniversialManagerService.getPlayMode() === CAMERA_STATUS.PLAY_MODE.PLAYBACK){
                  if( playbackCallback !== null ) {
                      playbackCallback({'errorCode' : "503"});
                  }
              }else{
                  if(jsonData.type == 2){
                      liveStatusCallback(504);  //Talk service unavailable
                  }else{
                      liveStatusCallback(503);
                  }
              }
              break;
          case 600:   //Step busy event 
              /*  jsonData
                  {
                      busy: true/false
                  }
              */                
              // $rootScope.$emit('changeLoadingBar', (lp == 0 ? false : true));
              $rootScope.$emit('changeLoadingBar', jsonData.busy);
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