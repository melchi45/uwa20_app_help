"use strict"; 

function KindStreamPlayer(configInfo, sunapiClient) {
  var channelId = configInfo.device.channelId;

  var connectionInfo = {
    protocol:'',
    server_address: '',
    port: 80
  };

  var profileInfo = {
    device: {
      cameraIp: '',
      user: '',
      password: ''
    },
    media: {
      type: 'live',
      requestInfo: {
        cmd: 'open',
        url: 'profile2',
        scale: 1
      },
      framerate:0,
      govLength:null,
      mode:null
    }
  };

  var callbackInfo = {
    close:null,
    error:null,
    time:null
  };

  var rtspClient;
  var workerManager;
  var setBufferingFunc = null;
  var isValidBackupCheck = null;

  function Constructor(configInfo) {
    isValidBackupCheck = null;
    var transportType = configInfo.media.transportType;
    
    workerManager = new WorkerManager();
    rtspClient = new RtspClient(configInfo.device.channelId, workerManager);
    rtspClient.SetSunapiClient(sunapiClient);
  }
    
  var open = function (info, audioOutStatus) {
    if(info !== null){
      connectionInfo.protocol = info.device.protocol;
      connectionInfo.server_address = info.device.server_address;
      connectionInfo.port = info.device.port;
      connectionInfo.ClientIPAddress = info.device.ClientIPAddress;

      profileInfo.device.cameraIp = info.device.cameraIp;
      profileInfo.device.user = info.device.user;
      profileInfo.device.password = info.device.password;

      profileInfo.media.type = info.media.type;
      profileInfo.media.requestInfo.cmd = info.media.requestInfo.cmd;
      profileInfo.media.requestInfo.url = info.media.requestInfo.url;
      profileInfo.media.requestInfo.scale = info.media.requestInfo.scale;
      profileInfo.media.framerate = info.media.framerate;
      profileInfo.media.govLength = info.media.govLength;
      profileInfo.media.mode = info.media.mode;

      if(info.media.audioOutStatus) {
        profileInfo.media.audioOutStatus = 'on';
      } else if(!info.media.audioOutStatus) {
        profileInfo.media.audioOutStatus = 'off';
      }

      if( info.media.type === 'backup') {
        isValidBackupCheck = false;
      }

      callbackInfo.error = info.callback.error;
      close();
      startStreaming();

      if( info.media.type === 'backup') {
        workerManager.backup('backupstart', info.device.captureName, info.callback.error);
        isValidBackupCheck = true;
      }
    }else{
      profileInfo.media.audioOutStatus = audioOutStatus;
      close();
      startStreaming();
    }
  };

  function startStreaming(){
    var ip = connectionInfo.server_address ? connectionInfo.server_address : info.device.cameraIp;
    var port = (connectionInfo.port == "") ? connectionInfo.port : (":"+ connectionInfo.port);
    var protocol = (connectionInfo.protocol == "http") ? "ws://" : "wss://";
    var rtspUrl = 'rtsp://'+profileInfo.device.user+':'+profileInfo.device.password+'@'+profileInfo.device.cameraIp+'/'+profileInfo.media.requestInfo.url;
    var address;
    var pathName = window.location.pathname;
    if (pathName !== "/") {
        pathName = pathName.replace("/index.html", "/");
        pathName = pathName.replace("/wmf", "")
    }

    if(((navigator.userAgent.indexOf("Trident") != -1) || (navigator.userAgent.indexOf("Edge") != -1)) && (ip.indexOf(':') != -1)) { // if IE,Edge and IPv6 addr
      var addr = ip + '' + port;
      addr = addr.replace(/:/gi, "-");
      addr = addr.replace(/::/gi, "--");
      addr = addr.replace("[", "");
      addr = addr.replace("]", "");
      addr = addr + ".ipv6-literal.net";
      address = protocol + addr + "/StreamingServer" + pathName;
    } else {
      address = protocol + ip + port + "/StreamingServer" + pathName;
    }
        
    var deviceInfo = {
      wsUrl:address,
      id:profileInfo.device.user,
      pw:profileInfo.device.password,
      rtspUrl: rtspUrl,
      mode: profileInfo.media.type,
      useragent: "UWC["+connectionInfo.ClientIPAddress+"]",
      audioOutStatus: profileInfo.media.audioOutStatus,
      ip:ip,
      channelId:channelId
    };
    rtspClient.SetDeviceInfo(deviceInfo);
    workerManager.init(deviceInfo);
    window.setTimeout(function(){
      console.log("Open ", channelId, "Channel!");
      rtspClient.Connect();
      rtspClient.SetErrorCallback(callbackInfo.error);
      workerManager.setCallback('error', callbackInfo.error);
      workerManager.SetDeviceInfo(deviceInfo);
      workerManager.setFPS(profileInfo.media.framerate);
      workerManager.setGovLength(profileInfo.media.govLength);
      workerManager.setLiveMode(profileInfo.media.mode);
    },500);
    
  }
    
  function close(info) {
    /*
    Todo :
    1. call setIsFirstFrame for video Decoder
    2. audio Listen close
    */
    console.log("Close ", channelId, "Channel!");
    rtspClient.Disconnect();
    if( isValidBackupCheck === true ) {
      workerManager.backup('check');
    }
    workerManager.terminate();
  }

  function terminate() {
    /*
    Todo :
    1. call setIsFirstFrame for video Decoder
    2. audio Listen close
    */
    profileInfo.media.requestInfo.cmd = 'close';
    rtspClient.ControlStream(profileInfo);
    rtspClient.Disconnect();
  }

  function resume(info) {
    workerManager.playbackResume();
    profileInfo.media.type = info.media.type;
    profileInfo.media.requestInfo.cmd = 'resume';
    profileInfo.media.requestInfo.url = "rtsp://"+profileInfo.device.cameraIp +":554" +"/"+info.media.requestInfo.url;
    profileInfo.media.needToImmediate = info.media.needToImmediate;
    rtspClient.ControlStream(profileInfo);
  }

  function pause(info) {
    workerManager.playbackPause();
    profileInfo.media.type = info.media.type;
    profileInfo.media.requestInfo.cmd = 'pause';
    profileInfo.media.requestInfo.url = "rtsp://"+profileInfo.device.cameraIp +":554" +"/"+info.media.requestInfo.url;
    rtspClient.ControlStream(profileInfo);
  }

  function speed(info) {
    var type = profileInfo.media.type;
    if (type === 'live') {
      console.log("speed is invalid command in live");
      return;
    }
    profileInfo.media.type = info.media.type;
    profileInfo.media.requestInfo.cmd = 'speed';
    profileInfo.media.requestInfo.scale = info.media.requestInfo.scale;
    profileInfo.media.requestInfo.url = "rtsp://"+profileInfo.device.cameraIp +":554" +"/"+info.media.requestInfo.url;
    rtspClient.ControlStream(profileInfo);

    playbackSpeed(info.media.requestInfo.scale);
  }

  function seek(info) {
    var type = profileInfo.media.type;

    if (type === 'live') {
      console.log(cmd, "is invalid command in live");
      return;
    }
    /*
    Todo : call webaudio flushBuffer
    webAudio.flushBuffer();
    */
    profileInfo.media.type = info.media.type;
    profileInfo.media.requestInfo.cmd = 'seek';
    profileInfo.media.requestInfo.scale = info.media.requestInfo.scale;
    profileInfo.media.requestInfo.url = "rtsp://"+profileInfo.device.cameraIp +":554" +"/"+info.media.requestInfo.url;
    rtspClient.ControlStream(profileInfo);    

    playbackSeek();
  }

  function stepRequest(info) {
    profileInfo.media.type = info.media.type;
    profileInfo.media.requestInfo.cmd = 'seek';
    profileInfo.media.requestInfo.scale = info.media.requestInfo.scale;
    profileInfo.media.requestInfo.url = "rtsp://"+profileInfo.device.cameraIp +":554" +"/"+info.media.requestInfo.url;
    rtspClient.ControlStream(profileInfo);
  }

  function backward() {
    workerManager.playbackBackward();
  }

  function forward() {
    workerManager.playbackForward();
  }

  function step(info) {
    profileInfo.media.type = info.media.type;
    profileInfo.media.requestInfo.cmd = 'seek';
    profileInfo.media.requestInfo.scale = info.media.requestInfo.scale;
    profileInfo.media.requestInfo.url = "rtsp://"+profileInfo.device.cameraIp +":554" +"/"+info.media.requestInfo.url;
    rtspClient.ControlStream(profileInfo);
  }

  function backup(info) {
    if( info.media.type === 'live' ) {
      workerManager.backup(info.media.requestInfo.cmd,
      info.device.captureName, info.callback.close, false);
      isValidBackupCheck = true;
    } else if( info.media.type === 'backup' ) {
      //TODO : open websocket
      open(info);
    }
  }

  function capture(info) {
    workerManager.capture(info.device.captureName);
  }
    
  function digitalZoom(info) {
    workerManager.digitalZoom(info.media.requestInfo.data);
  }
    
  function controlAudioIn(info) {
    var data = info.media.requestInfo.data;
    if(data === 'on' || data === 'off') {
      workerManager.controlAudioListen('onOff', data);
    } else {
      workerManager.controlAudioListen('volumn', data);
    }
  }

  function controlAudioOut(info) {
    var data = info.media.requestInfo.data;
    if(data === 'on' || data === 'off') {
      open(null, data);
      workerManager.controlAudioTalk('onOff', data);
    } else {
      workerManager.controlAudioTalk('volumn', data);
    }
  }

  function changeStackCount(info) {
    var data = info.media.requestInfo.data;
    data = parseInt(data, 10);
    workerManager.setStackCount(data);
  }

  function setCallback(dataArray) {
    workerManager.setCallback(dataArray[0], dataArray[1]);
    if (dataArray.length > 2) {
      workerManager.setCallbackData(dataArray);
    }
  }

  function timeStamp(dataArray) {
    workerManager.timeStamp(dataArray[0]);
  }

  function initVideo(dataArray) {
    workerManager.initVideo(dataArray[0]);
  }

  function playbackSpeed(dataArray) {
    workerManager.playbackSpeed(dataArray[0]);
  }

  function videoBuffering(dataArray) {
    workerManager.videoBuffering();
  }

  function setLiveMode(dataArray) {
    workerManager.setLiveMode(dataArray[0]);
  }

  function openFPSmeter(dataArray) {
    workerManager.openFPSmeter();
  }

  function closeFPSmeter(dataArray) {
    workerManager.closeFPSmeter();
  }

  function setFpsFrame(dataArray) {
    workerManager.setFpsFrame(dataArray[0]);
  }

  function playbackSeek(dataArray) {
    workerManager.playbackSeek();
  }

  function playToggle(dataArray) {
    workerManager.playToggle(dataArray[0]);
  }

  function setPlaybackservice(dataArray) {
    workerManager.setPlaybackservice(dataArray[0]);
  }

  Constructor.prototype = {
    decoderInit: function(codecType) {
      if (codecType === "h264") {
        /* Todo : call h264Decoder.init() */
      } else if (codecType === "h265") {
        /* Todo : call h265Decoder.init() */
      }
    },
    reassignCanvas: function () {
      workerManager.reassignCanvas();
    },
    setBufferingFunction:function(func) {
      setBufferingFunc = func;
    },
    setResizeCallback: function(callback) {
      workerManager.setResizeCallback(callback);
    },
    control: function (info) {
      var controlType = info.media.requestInfo.cmd;
            
      if (info === undefined){
        console.log('info is undefined!');
      }
      if (info.callback !== undefined && info.callback.error !== undefined) {
        rtspClient.SetErrorCallback(info.callback.error);
      }
      if (info.callback !== undefined && info.callback.close !== undefined) {
        //closeCallback = info.callback.close;
      }

      switch (controlType) {
        case 'open':
          open(info);
          break;
        case 'close':
          close(info);
          break;
        case 'terminate':
          terminate();
          break;
        case 'resume':
          resume(info);
          break;
        case 'pause':
          pause(info);
          break;
        case 'speed':
          speed(info);
          break;
        case 'seek':
          seek(info);
          break;
        case 'capture':
          capture(info);
          break;
        case 'dZoom':
          digitalZoom(info);
          break;
        case 'audioIn':
          controlAudioIn(info);
          break;
        case 'audioOut':
          controlAudioOut(info);
          break;
        case 'forward':
          forward();
          break;
        case 'backward':
          backward();
          break;
        case 'step':
          step(info);
          break;
        case 'backup':
        case 'backupstart':
        case 'backupstop':
          backup(info);
          break;
        case 'changeStackCount':
          changeStackCount(info);
          break;
        default:
          console.log('Not Supported Commnad');
          break;
      }
    },
    controlWorker: function(controlData) {
      var controlType = controlData.cmd;

      switch (controlType) {
        case 'setCallback':
          setCallback(controlData.data);
          break;
        case 'timeStamp':
          timeStamp(controlData.data);
          break;
        case 'initVideo':
          initVideo(controlData.data);
          break;
        case 'playbackSpeed':
          playbackSpeed(controlData.data);
          break;
        case 'videoBuffering':
          videoBuffering(controlData.data);
          break;
        case 'setLiveMode':
          setLiveMode(controlData.data);
          break;
        case 'openFPSmeter':
          openFPSmeter(controlData.data);
          break;
        case 'closeFPSmeter':
          closeFPSmeter(controlData.data);
          break;
        case 'setFpsFrame':
          setFpsFrame(controlData.data);
          break;
        case 'playbackSeek':
          playbackSeek(controlData.data);
          break;
        case 'playToggle':
          playToggle(controlData.data);
          break;
        case 'setPlaybackservice':
          setPlaybackservice(controlData.data);
          break;
        default:
          console.log("undefined command!");
          break;
      }
    }
  };
  /* Prototype Pattern*/

  return new Constructor(configInfo);
}