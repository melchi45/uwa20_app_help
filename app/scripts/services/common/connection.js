/*global workerManager*/
kindFramework
    .factory('ConnectionSettingService', ['LoggingService','RESTCLIENT_CONFIG', 'PLAYBACK_TYPE', 'ProfileCheckService', 'playbackStepService', 'UniversialManagerService',
     function(LoggingService, RESTCLIENT_CONFIG, PLAYBACK_TYPE, ProfileCheckService, playbackStepService, UniversialManagerService) {
    'use strict';
    if (RESTCLIENT_CONFIG.serverType === 'camera'){
        RESTCLIENT_CONFIG.digest.hostName = window.location.hostname;
        RESTCLIENT_CONFIG.digest.port = window.location.port;
        var loc_protocol = window.location.protocol;
        var splitProt =loc_protocol.split(":");
        RESTCLIENT_CONFIG.digest.protocol = splitProt[0];
    }

    var CAMERA_IP_ADDRESS = RESTCLIENT_CONFIG.digest.hostName;
    var STREAM_PORT = RESTCLIENT_CONFIG.digest.port;
    var PROTOCOL = RESTCLIENT_CONFIG.digest.protocol;
    var CLIENT_ADDRESS = RESTCLIENT_CONFIG.digest.ClientIPAddress;
    var PLAY_CMD = PLAYBACK_TYPE.playCommand;

    var logger = LoggingService.getInstance('ConnectionSettingService');    

    var cameraInfo = {
        id: "cam001",
        name: "CAM1",
        cameraUrl: CAMERA_IP_ADDRESS,
        user: "",
        password: "",
        supportMultiChannel : false,
    };

    var connectionSettings = {
        cameraUrl: "",
        echo_sunapi_server: CAMERA_IP_ADDRESS,
        user: "",
        password: "",
        rtspIp : RESTCLIENT_CONFIG.digest.rtspIp,
        rtspPort : RESTCLIENT_CONFIG.digest.rtspPort
    };

    var deviceInfo = {
        channelId:0,
        port:STREAM_PORT,
        server_address:CAMERA_IP_ADDRESS,
        protocol: PROTOCOL,
        cameraIp: "",
        user: "",
        password: "",
        captureName: "",
        ClientIPAddress:CLIENT_ADDRESS
    };

    var mediaInfo = {
      type:null,
      transportType:'rtsp',
      requestInfo:{
        cmd: null,
        url: null,
        scale: 1
      },
      framerate:0,
      audioOutStatus: false,
      needToImmediate : false,
      govLength: null
    };

    var callbacks = {
      time : null,
      error : null,
      close : null
    };


    var playerInfo = {
      device : deviceInfo,
      media : mediaInfo,
      callback : callbacks,
    };

    var isPlaybackAlive = false;
    var playbackId = null;

    var objectCopy = function(obj){
      return JSON.parse(JSON.stringify(obj));
    };

    var startPlayback = function(data, timeCallback, errorCallback, closeCallback){
      var playbackId = "";
      if( cameraInfo.supportMultiChannel === true ) {
        playbackId += data.channel + "/";
      }
      playbackId += "recording/"+data.time+"/OverlappedID="+data.id+"/play.smp";
      console.log("new playback url : "+playbackId);
      //TODO : playerInfo need to add channel filed ( data.channel )
      isPlaybackAlive = true;
      playerInfo.callback.time = timeCallback;
      playerInfo.callback.error = errorCallback;
      playerInfo.callback.close = closeCallback;
      playerInfo.media.type = 'playback';
      playerInfo.media.mode = 'canvas';
      playerInfo.media.requestInfo.cmd = 'open';
      playerInfo.media.requestInfo.url = playbackId;
      playerInfo.media.requestInfo.scale = 1;
      return playerInfo;
    };

    var getPlayerData = function(flag, data, timeCallback, errorCallback, closeCallback, mode) {
        if(flag === 'live') {
          if (ProfileCheckService.availableCheck(data) === true || mode === "video") {
            logger.log('get playerdata for live!');
            playerInfo.media = getMediaInfo('live', data, mode);
            logger.log(mediaInfo.type, mediaInfo.requestInfo);
            logger.log(deviceInfo.user);
          } else {
            errorCallback({
                errorCode: "996",
                description: "Not enough decoding for currnet profile, Change UWA profile",
                place: "connection.js"
            });
            return null;
          }
        }
        else{
          logger.error('Undefined flag to get playerdata!');
          return null;
        }
        playerInfo.callback.time = timeCallback;
        playerInfo.callback.error = errorCallback;
        playerInfo.callback.close = closeCallback;
        playerInfo.device.ClientIPAddress = RESTCLIENT_CONFIG.digest.ClientIPAddress;
        playerInfo.media.audioOutStatus = UniversialManagerService.isMicOn();
        if(data.EncodingType === "H264"){
          playerInfo.media.govLength = data.H264.GOVLength;
        }else if(data.EncodingType === "H265"){
          playerInfo.media.govLength = data.H265.GOVLength;
        }else{
          playerInfo.media.govLength = null;
        }
        return playerInfo;
    };

    var playbackBackup = function(data, fileName, callback) {
      var backupUrl = "";
      if( cameraInfo.supportMultiChannel === true ) {
        backupUrl += data.channel +"/";
      }
      backupUrl += "recording/"+data.time+"/OverlappedID="+data.id+"/backup.smp";
      //TODO : playerInfo need to add channel filed ( data.channel )
      playerInfo.callback.error = callback;
      playerInfo.device.captureName = fileName;
      playerInfo.media.type = 'backup';
      playerInfo.media.requestInfo.cmd = 'backup';
      playerInfo.media.requestInfo.url = backupUrl;
      console.log(playerInfo.media.requestInfo.url);
      return playerInfo;
    };

    var backupCommand = function(recordInfo) {
      //TODO : playerInfo need to add channel filed ( recordInfo.channel )
      playerInfo.media.type = 'live';
      playerInfo.media.requestInfo.cmd = 'backup'+ recordInfo.menu;
      if( recordInfo.menu === 'start' ) {
        playerInfo.callback.close = recordInfo.callback;
        playerInfo.device.captureName = recordInfo.fileName;
      }
      return playerInfo;
    };

    function getMediaInfo (flag, data, mode) {
        if(flag === 'live') {
          var info = {
            type:'live',
            transportType:'rtsp',
            requestInfo:{
              cmd: 'open',
              url: data.Name+'/media.smp',
              scale: 1
            },
            framerate: data.FrameRate,
            mode : (mode === undefined ? null : mode),
          };
          return info;
        }
        else if(flag === '') { return; }

        return null;
    }

    function getCurrentCommand() {
      return playerInfo.media.requestInfo.cmd;
    }

    var getConnectionSetting = function() {
        return connectionSettings;
    };

    var setConnectionInfo = function(data){
        cameraInfo.user = data.id;
        cameraInfo.password = data.password;

        connectionSettings.cameraUrl = cameraInfo.cameraUrl;
        connectionSettings.user = cameraInfo.user;
        connectionSettings.password = cameraInfo.password;
        

        playerInfo.device.user = cameraInfo.user;
        playerInfo.device.password = cameraInfo.password;
    };

    /**
    * send resume command
    * @name : applyResumeCommand
    * @argument : data - object of { time :string, id :int }
    */
    var applyResumeCommand = function(data) {
      var newUrl = "";
      if( cameraInfo.supportMultiChannel === true ) {
        newUrl += data.channel +"/";
      }
      newUrl += "recording/"+data.time+"/OverlappedID="+data.id+"/play.smp";
      playerInfo.media.type = 'playback';
      playerInfo.media.requestInfo.cmd = 'resume';
      playerInfo.media.requestInfo.url = newUrl;
      playerInfo.media.needToImmediate = data.needToImmediate;
      console.log("playback resume url : "+playerInfo.media.requestInfo.url);
      return playerInfo;
    };

    /**
    * send seek command
    * @name : applySeekCommand
    * @argument : data - object of { time :string, id :int }
    */
    var applySeekCommand = function(data){
      var newUrl = "";
      if( cameraInfo.supportMultiChannel === true ) {
        newUrl += data.channel +"/";
      }
      newUrl += "recording/"+data.time+"/OverlappedID="+data.id+"/play.smp";
      //workerManager.playbackSeek();
      playerInfo.media.type = 'playback';
      playerInfo.media.requestInfo.cmd = 'seek';
      playerInfo.media.requestInfo.url = newUrl;
      console.log("playback seek url : "+playerInfo.media.requestInfo.url);
      return playerInfo;
    };

    var applyStepCommand = function(cmd, data){
      var newUrl = "";
      if( cameraInfo.supportMultiChannel === true ) {
        newUrl += data.channel +"/";
      }
      newUrl += "recording/"+calcStepDateTime(data.time)+"/OverlappedID="+data.id+"/play.smp";
      playerInfo.media.requestInfo.cmd = cmd;
      if (cmd === "step")  {
        playerInfo.media.type = 'step';
        playerInfo.media.requestInfo.url = newUrl;
        playerInfo.media.requestInfo.scale = data.speed;
        playbackStepService.setRequestTime(data.time);
      }
      return playerInfo;
    };

    /**
    * send pause command
    * @name : applyPauseCommand
    */
    var applyPauseCommand = function(){
      playerInfo.media.type = 'playback';
      playerInfo.media.requestInfo.cmd = 'pause';
      return playerInfo;
    };

    /**
    * send speed command
    * @name : applyPlaySpeed
    * @argument: speed - speed value
    *          : data - object of { time :string, id :int }
    * @return : playerInfo structure
    */
    var applyPlaySpeed = function( speed, data) {
      var newUrl = "";
      if( cameraInfo.supportMultiChannel === true ) {
        newUrl += data.channel +"/";
      }
      newUrl += "recording/"+data.time+"/OverlappedID="+data.id+"/play.smp"; 
      //workerManager.playbackSpeed(speed);
      /*
      * If speed direction changed, send seek command instead of speed command.
      */
      if( playerInfo.media.requestInfo.scale * speed < 0 ) { //different direction.
        playerInfo.media.requestInfo.cmd = 'seek';
        playerInfo.media.requestInfo.url = newUrl;
        playerInfo.media.requestInfo.scale = speed;
      } else {
        var command = "speed";
        playerInfo.media.requestInfo.url = newUrl;
        playerInfo.media.requestInfo.cmd = command;
        playerInfo.media.requestInfo.scale = speed;       
      }
      console.log("playback speed url : "+playerInfo.media.requestInfo.url);

      return playerInfo;
    };

    var calcStepDateTime = function(time) {      
      var result = time;
      var date = time.substr(0,8);
      var calcTime = time.substr(8,6);

      var hour = calcTime.substr(0,2);
      var min = calcTime.substr(2,2);
      var sec = calcTime.substr(4,2);

      if (sec > 2) {
        result -= 2;
      } else {
        min = (min === 0 ? min = 59 : min -= 1);
        sec = (sec === 0 ? sec = 58 : sec = 59);
        result = date + hour;
        result += (min < 10 ? "0" + min : min);
        result += (sec < 10 ? "0" + sec : sec);
      }

      return result;
    };

    /**
    * Close playback seesion
    * @name: closePlaybackSession
    */
    var closePlaybackSession = function(){
      isPlaybackAlive = false;
      //re-set step flag
      playbackStepService.setSettingFlag(true);
      playerInfo.media.type = 'playback';
      playerInfo.media.requestInfo.cmd = 'close';
      playerInfo.media.requestInfo.scale = 1;
      playerInfo.media.requestInfo.url = playbackId;
      return playerInfo;
    };

    /**
    * Close websocket seesion
    * @name: closeStream
    */
    var closeStream = function(){
      playerInfo.media.requestInfo.cmd = 'close';
      return playerInfo;
    };

    /**
    * send command for step forward & step backward
    * @name : stepPlay
    * @argument : command must be PLAY_CMD.STEPFORWARD / PLAY_CMD.STEPBACKWARD (refer to playback_type.js)
    */
    var stepPlay = function(command, data) {
      if( command === PLAY_CMD.STEPFORWARD ) {
        playerInfo.media.requestInfo.cmd = 'forward';
        console.log("stePlay forward timeStamp - " + data.time);
        //playerInfo.media.requestInfo.scale++;  //to just changing playerInfo
      } else if( command === PLAY_CMD.STEPBACKWARD) {
        playerInfo.media.requestInfo.cmd = 'backward';
        console.log("stePlay backward timeStamp - " + data.time);
        //playerInfo.media.requestInfo.scale++;  //to just changing playerInfo
      } else {
        return null;
      }
      return playerInfo;
    };

    var SetRtspIpMac = function(rtspIp,macIp) {
      connectionSettings.rtspIp = playerInfo.device.cameraIp = RESTCLIENT_CONFIG.digest.rtspIp = rtspIp;
      RESTCLIENT_CONFIG.digest.macAddress = macIp;
    };

    var SetRtspPort = function(port) {
      connectionSettings.rtspPort = RESTCLIENT_CONFIG.digest.rtspPort = port;
    };

    /**
    * Set it is support multi channel or not
    * @function : SetMultiChannelSupport
    * @param : support is boolean value
    */
    var SetMultiChannelSupport = function(support) {
      cameraInfo.supportMultiChannel = support;
    };
    return {
        setConnectionInfo: setConnectionInfo,
        getPlayerData: getPlayerData,
        getConnectionSetting: getConnectionSetting,
        applySeekCommand : applySeekCommand,
        applyPauseCommand : applyPauseCommand,
        applyPlaySpeed : applyPlaySpeed,
        closePlaybackSession : closePlaybackSession,
        closeStream : closeStream,
        startPlayback : startPlayback,
        applyResumeCommand : applyResumeCommand,
        stepPlay : stepPlay,
        applyStepCommand : applyStepCommand,
        getCurrentCommand : getCurrentCommand,
        backupCommand : backupCommand,
        playbackBackup : playbackBackup,
        SetRtspPort : SetRtspPort,
        SetRtspIpMac : SetRtspIpMac,
        SetMultiChannelSupport : SetMultiChannelSupport
    };
}]);