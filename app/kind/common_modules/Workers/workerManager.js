"use strict";

var workerManager = new WorkerManager();

function WorkerManager() {
  //Workers
  var usePlaybackDrawer = false,
  videoWorker = null,
  audioWorker = null,
  backupWorker = null,
  audioTalkWorker = null;

  //Renderers
  var videoRenderer = null,
  audioRenderer = null,
  audioTalker = null;

  //callbacks
  var resizeCallback = null,
  timeStampCallback = null,
  sendAudioTalkCallback = null,
  stepRequestCallback = null,
  updateEventCallback = null,
  backupCallback = null,
  setVideoModeCallback = null,
  loadingBarCallback = null,
  errorCallback = null;

  var browser = BrowserDetect();

  //video
  var videoInfo,
  SDPInfo = null,
  frameRate = 0,
  govLength = null,
  isTalkService = false,
  isPaused = true,
  decodeMode = "canvas",
  videoMS = null,
  initSegmentData,
  mediaSegmentData,
  mediaInfo = {
    id: 1,
    samples: null,
    baseMediaDecodeTime: 0
  },
  mediaSegmentNum = 0,
  mediaFrameSize = 0,
  mediaFrameData,
  sequenseNum = 1,
  videoElement = null,
  stepFlag = false,
  playerMode = null,
  playbackService = null,
  codecInfo = "",
  videoElem = null,
  canvasElem = null,
  throughPutGOV = 30,
  videoTimeStamp = null,
  videoTagPlayFlag = false,
  normalNumBox = (browser !== "chrome" ? 10 : 4),
  speedNumBox = 1,
  speed = 1,
  numBox = normalNumBox,
  modeChangeFlag = false,
  preNumBox = 0;

  var mediaSegmentCount =0;
  var initSegmentFlag = false;
  var prebaseMediaDecodeTime =0,
    curbaseMediaDecoderTime =0;  

  //audio
  var audioCodec = null;

  //backup
  var fileMaker = null;
  var fisheye3D = null;
  var isPlaybackBackup = false;

  //fps
  var start_time = 0,
  play_count = 0,
  fps_count = 1000,
  fps_spanElement = null,
  count_spanElement = null,
  fps_div = null;

  var mjpegStackCount = 0,
    messageArray = new Array();

  var metaSession = null;
  var metaDataParser = null;

  function Constructor() {
    isPaused = true;
  }

  function GetInitializationSegment() {
    return initSegmentData;
  }

  function videoSizeCallback() {
    $(window).trigger('resize');
    loadingBarCallback(false);
    videoTagPlayFlag = true;
  }

  function closeBackupWorker() {
    // console.log("someone want to close backup worker");
    var event = {
    'type' : 'backup',
    'data' : {
      'command':'stop'
      }
    };
    if(videoWorker) videoWorker.postMessage(event);
    //to sync audioWorker & videoWorker end time.
    //if(audioWorker) audioWorker.postMessage(event);
    //if(backupWorker) backupWorker.postMessage(event);
    if( videoWorker === null && audioWorker === null ) {
      if(backupWorker) backupWorker.postMessage(event);
    }
    isPlaybackBackup = false;
  }

  function videoWorkerMessage(event) {
    var message = event.data;
    var idx = 0;

    switch (message.type) {
      case 'canvasRender':
        audioStart(0, "currentTime");
        draw(message.data);
        play_count++;
        if (start_time === 0) {
          start_time =  performance.now();
        } else {
          count_spanElement.html(" Count fps : " + (fps_count - play_count));
          if( (play_count % fps_count) === 0 ) {
            var next_time = performance.now();
            var diff_time = (next_time - start_time)/1000;
            fps_spanElement.html(" Average fps : " + (play_count/diff_time).toFixed(2));
            start_time = next_time;
            play_count = 0;
          }
        }
        break;
      case 'initSegment':
          // var blob = new Blob([initSegmentData], {type: "application/octet-stream"});
          // saveAs(blob, "initSegmentData.m4s");

    		  initSegmentData = message.data;
          createVideoMS();
        break;
      case 'mediaSample':
        if( mediaInfo.samples == null) {
          mediaInfo.samples = new Array(numBox);
        }
        
        if(message.data.frame_time_stamp == null) {
          message.data.frame_duration = Math.round(1000/frameRate);
        }

        if (speed !== 1) {
          message.data.frame_duration = 1000/Math.abs(speed);			
        }

        mediaInfo.samples[mediaSegmentNum++] = message.data;
        curbaseMediaDecoderTime += message.data.frame_duration;

        if(mediaInfo.samples[0].frame_duration > 500 && mediaInfo.samples[0].frame_duration <= 3000){
          numBox = 1;
        } else{
          switch(browser){
            case 'firefox' : 
            case 'edge' : 
            case 'safari' :
              numBox = 10;
              break;
            default :
              numBox = 4;
          }
        }

        if(preNumBox !== numBox) {
          normalNumBox = numBox;
          initVideo(false);
        }
        preNumBox = numBox;

        break;
     case 'videoRender':
        var tempBuffer = new Uint8Array(message.data.length + mediaFrameSize);

        if (mediaFrameSize !== 0) {
          tempBuffer.set(mediaFrameData);
        }

        tempBuffer.set(message.data, mediaFrameSize);
        mediaFrameData = tempBuffer;
        mediaFrameSize = mediaFrameData.length;

        if (mediaSegmentNum % numBox == 0 && mediaSegmentNum !== 0) {
          if (mediaInfo.samples[0].frame_duration !== null) {
            if (sequenseNum == 1){
              mediaInfo.baseMediaDecodeTime = 0;
            } else {
              mediaInfo.baseMediaDecodeTime = prebaseMediaDecodeTime;
            }
            prebaseMediaDecodeTime = curbaseMediaDecoderTime;
          } else {
            mediaInfo.baseMediaDecodeTime = Math.round(1000/frameRate)*numBox*(sequenseNum - 1);
          } 
          
          mediaSegmentData = mediaSegment(sequenseNum, [mediaInfo], mediaFrameData, mediaInfo.baseMediaDecodeTime);
          sequenseNum++;
          mediaSegmentNum = 0;
          mediaFrameData = null;
          mediaFrameSize = 0;

          // if(mediaSegmentCount <5) {
          //   var blob2 = new Blob([mediaSegmentData], {type: "application/octet-stream"});
          //   saveAs(blob2, "mediaSegmentData"+ (sequenseNum-1) + ".m4s");
          //   mediaSegmentCount++;
          //   console.log("media Segment Count is", mediaSegmentCount);
          // }

          if (videoMS !== null) {
            videoMS.setMediaSegment(mediaSegmentData);
          } else if (initSegmentFlag === false) {
            console.log("workerManager::videoMS error!! recreate videoMS");
            createVideoMS();
          }
        }
        break;
      case 'decodingTime':
        // if(divPerfomanceTest !== null && message.data !== undefined){
        //   if(span.innerHTML.length > 10000){
        //     span.innerHTML = "";
        //   }
        //   span.innerHTML = "decodingTime = " + message.data.toFixed(2);

        //   if(divPerfomanceTest.scrollTop === divPerfomanceTest.scrollHeight-269 || divPerfomanceTest.scrollHeight < 300){
        //     divPerfomanceTest.scrollTop = divPerfomanceTest.scrollHeight;
        //   }
        // }
        break;
      case 'videoInfo':
        videoInfo = message.data;
        break;
      case 'time':
        //timeStampCallback(message.data);
        break;
      case 'videoTimeStamp':
        videoTimeStamp = message.data;
    		if (videoMS !== null && videoTimeStamp != null){
    			//videoMS.setvideoTimeStamp(message.data);
				videoMS.setvideoTimeStamp(videoTimeStamp);
    		}
        break;
      case 'firstFrame':
        videoRenderer.initStartTime();
        if( videoRenderer.setFPS !== undefined ) {
          videoRenderer.setFPS(frameRate);
        }
        break;
      case 'backup':
        if( backupWorker ) {
          backupWorker.postMessage(message);
        }
        break;
      //to sync audioWorker & videoWorker end time.
      case 'audioBackup' :
        var stopMessage = {
          'type' : 'backup',
          'data' : {
            'command':'stop'
            }
        };
        if( message.data === 'start' ) {
          if( audioWorker ) {
            stopMessage.data.command = 'start';
            audioWorker.postMessage(stopMessage);
          }
        }
        else {
          if( audioWorker){
            audioWorker.postMessage(stopMessage);
          }
          if (backupWorker) {
            backupWorker.postMessage(stopMessage);
          }
        }
        break;
      case 'drop':
        break;
      case 'codecInfo':
        codecInfo = message.data;
        if (videoMS !== null) {
          videoMS.setCodecInfo(codecInfo);
        }
        break;
      case 'stepPlay':{
        switch (message.data) {
          case 'needBuffering':
            stepFlag = true;
            stepRequestCallback("request", playbackService);
            break;
          case 'BufferFull':
            stepFlag = false;
            stepRequestCallback("complete");
            if(modeChangeFlag){
              var message = {
                'type': 'stepPlay',
                'data': 'findIFrame'
              };
              videoWorker.postMessage(message);
              videoRenderer.initStartTime();
              modeChangeFlag = false;
            }
            break;
        }
        break;
      }
      case 'setVideoTagMode':
        Constructor.prototype.setLiveMode(message.data);
        break;
      case 'playbackFlag':
        if (videoMS !== null) {
          videoMS.setPlaybackFlag(message.data);
        }
        break;
      case 'throughPut':
        throughPutGOV = message.data;
        if (videoRenderer !== null)  {
          videoRenderer.setThroughPut(throughPutGOV);
        }
        break;
      case 'error':
        if (errorCallback !== null) {
          errorCallback(message.data);
        }
        break;
      default:
        console.log("workerManager::videoWorker unknown data = " + message.data);
        break;
    }
  }

  function draw(frameData) {
    if (frameData !== null && videoRenderer !== null)  {
      if (videoInfo.codecType == "mjpeg") {
        videoRenderer.drawMJPEG(frameData, videoInfo.width, videoInfo.height, videoInfo.codecType, videoInfo.frameType, videoInfo.timeStamp);
      } else {
        videoRenderer.draw(frameData, videoInfo.width, videoInfo.height, videoInfo.codecType, videoInfo.frameType, videoInfo.timeStamp);
      }
    }
  }

  var preVolume = 0;
  var initVideoTimeStamp = 0;
  function audioWorkerMessage(event){
    var message = event.data;
    
    switch(message.type){
      case 'render':
      if( isPlaybackBackup === true ) 
        break;
      if (audioCodec !== message.codec) {
        if(audioRenderer !== null){
          preVolume = audioRenderer.GetVolume();
          initVideoTimeStamp = audioRenderer.getInitVideoTimeStamp();
          audioRenderer.terminate();
        }
        if (message.codec === "AAC") {
          if(browser === 'edge' || browser === 'firefox'){
            audioRenderer = null;
            if (errorCallback !== null) {
              errorCallback({'errorCode' : '777'});
            }
          }else{
            audioRenderer = new AudioPlayerAAC();  
          }
        } else {
          audioRenderer = new AudioPlayerGxx();
        }

        if(audioRenderer !== null){
          audioRenderer.setInitVideoTimeStamp(initVideoTimeStamp);
          if(!audioRenderer.audioInit(preVolume)){
            audioRenderer = null;
          }
        }

        audioCodec = message.codec;
      }

      if(audioRenderer !== null){
        audioRenderer.BufferAudio(message.data, message.rtpTimeStamp);
      }
      break;
      case 'backup':
      if( backupWorker ) {
        backupWorker.postMessage(message);
      }
      break;
    }
  }

  function backupWorkerMessage(event) {
  	var message = event.data;
  	switch(message.type) {
      case 'backup':
        if( fileMaker !== null )
          fileMaker.processMessage(message.data.target, message.data.data);
        break;
      case 'backupResult':
        if( backupCallback !== undefined && backupCallback !== null ) {
          backupCallback(message.data);
          if( message.data.errorCode !== 0 ) {
            closeBackupWorker();
          } 
        } else {
          closeBackupWorker();
        }
        break;
      case 'backupClose':
      //if( isPlaybackBackup === true ) {
        closeBackupWorker();
        if( backupCallback !== undefined && backupCallback !== null ) {
          backupCallback({'errorCode':1,'description':'backup'});//BACKUP_STATUS.STOP
        }
      //}
        break;
      case 'terminate':
        if( playerMode === 'backup') {
          if (videoWorker) {
            videoWorker.terminate();
            videoWorker = null;
          } 
          if (audioWorker) {
            audioWorker.terminate();
            audioWorker = null;
          }             
        }
        fileMaker = null;
        backupWorker = null;
        backupCallback = null;
        break;
  	}
  }

  function audioTalkWorkerMessage(event) {
    var message = event.data;
    switch (message.type){
      case 'rtpData' :
        sendAudioTalkCallback(message.data);
        break;
    }
  }

  function sendAudioTalkBuffer(buffer) {
    var message = {
      'type': 'getRtpData',
      'data': buffer
    };
    audioTalkWorker.postMessage(message);
  }

  function bufferFullCallback() {
    stepRequestCallback("complete");
    stepFlag = false;
  }

  function initVideo(speedMode) {
    if (videoMS !== null) {
      videoMS.close();
      videoMS = null;
    }
    numBox = (speedMode == false ? normalNumBox : speedNumBox);
    mediaInfo.samples = new Array(numBox);
    initSegmentFlag = false;
    sequenseNum = 1;
    mediaSegmentData = null;
    mediaSegmentNum = 0;
    mediaFrameData = null;
    mediaFrameSize = 0;
  }

  function checkChangeMode() {
    if (decodeMode !== "canvas") {
      Constructor.prototype.setLiveMode("canvas");
      modeChangeFlag = true;
    }
  }

  function createVideoMS() {
    initSegmentFlag = true;
    videoTagPlayFlag = false;

    if (videoMS === null) {
      videoMS = VideoMediaSource();
      videoMS.setCodecInfo(codecInfo);
      videoMS.setInitSegmentFunc(GetInitializationSegment);
      videoMS.setVideoSizeCallback(videoSizeCallback);
      videoMS.init(videoElem);
      videoMS.setSpeedPlay(speed);
    } else {
      var element = videoMS.getVideoElement();
      videoMS.setInitSegment();
    }
    videoMS.setAudioStartCallback(audioStart);
  }

  function audioStart(videoTime, timeStatus){
    if(audioRenderer !== null){
      audioRenderer.setBufferingFlag(videoTime, timeStatus);
    }
  }

	Constructor.prototype = {
    init: function(mode) {
      var userAgent = window.navigator.userAgent;
      if(userAgent.indexOf('Trident/') !== -1){
        videoWorker = new Worker('./kind/common_modules/Workers/mjpegVideoWorker.js');
      }else{
        videoWorker = new Worker('./kind/common_modules/Workers/videoWorker.js');
      }
      audioWorker = new Worker('./kind/common_modules/Workers/audioWorker.js');

      videoWorker.onmessage = videoWorkerMessage;
      audioWorker.onmessage = audioWorkerMessage;
      if(usePlaybackDrawer){
        if(mode === 'live') {
          videoRenderer = new LiveDrawer(0);
        } else {
          videoRenderer = new PlaybackDrawer(0);
          videoRenderer.setBufferFullCallback(bufferFullCallback);
        }
      }else {
        videoRenderer = new KindDrawer(0);
      }

      videoRenderer.setResizeCallback(resizeCallback);
      count_spanElement = $("#count-fps");
      fps_spanElement = $("#span-fps");
      fps_div = $("#fpsdiv");

      fps_div.hide();

      // console.log("workerManager::init() : ");
    },
    sendFreeBufferIdx: function(bufferIdx) {
      var message = {
        'type': 'bufferFree',
        'data': bufferIdx
      };
      videoWorker.postMessage(message);
    },
    sendSdpInfo: function(sdpInfo, aacCodecInfo, _isTalkService) {
      var message = {
        'type': 'sdpInfo',
        'data': {
          'sdpInfo': sdpInfo,
          'aacCodecInfo': aacCodecInfo,
          'decodeMode': decodeMode,
          'govLength' : govLength
        }
      };
      isTalkService = _isTalkService;
      metaDataParser = new MetaDataParser(updateEventCallback);
      metaSession = new MetaSession(metaDataParser.parse);

      videoWorker.postMessage(message);
      audioWorker.postMessage(message);

      if(isTalkService){
        try {
          window.AudioContext = window.AudioContext ||
                                window.webkitAudioContext ||
                                window.mozAudioContext    ||
                                window.oAudioContext      ||
                                window.msAudioContext;

          audioTalkWorker = new Worker('./kind/common_modules/Workers/audioTalkWorker.js');
          audioTalkWorker.onmessage = audioTalkWorkerMessage;
          if(audioTalker === null){
            audioTalker = new Talk();
            audioTalker.init();
            audioTalker.setSendAudioTalkBufferCallback(sendAudioTalkBuffer);
          }
          var sampleRate = audioTalker.initAudioOut();
          audioTalkWorker.postMessage(message);
          message = {
            'type': 'sampleRate',
            'data': sampleRate
          };
          audioTalkWorker.postMessage(message);
        } catch (error) {
          isTalkService = false;
          console.error("Web Audio API is not supported in this web browser! : " + error);
          return;
        }
      }
      audioCodec = null;
/*
      if(audioRenderer != null){
        audioRenderer.audioInit();
      }
*/
      initSegmentFlag = false;
      SDPInfo = sdpInfo;
      // console.log("workerManager::sendSdpInfo()");
      // console.log(SDPInfo);
    },
    sendRtpData: function(rtspinterleave, rtpheader, rtpPacketArray) {
      var mediaType = rtspinterleave[1];
      var idx = parseInt(mediaType / 2, 10);
      var message = {
          'type': 'rtpData', 
          'data': {
              'rtspInterleave': rtspinterleave,
              'header': rtpheader,
              'payload': rtpPacketArray
        }
      };

      switch (SDPInfo[idx].codecName) {
        case 'H264':
        case 'H265': {
          //console.log("workerManager::sendRtpData()");
          if( videoWorker ) videoWorker.postMessage(message);
          break;
        }
        case 'JPEG':
          messageArray.push(message);
          if (mjpegStackCount >= 10 || (rtpheader[1] & 0x80) === 0x80) {
            var sendMessage = {
              'type': 'rtpDataArray', 
              'data': messageArray
            }

            if( videoWorker ) videoWorker.postMessage(sendMessage);

            messageArray = [];
            mjpegStackCount = 0;
          } else {
            mjpegStackCount++;
          }
          break;
        case 'G.711':
        case 'G.726-16':
        case 'G.726-24':
        case 'G.726-32':
        case 'G.726-40':
        case 'mpeg4-generic': {
          if(!stepFlag){
            if( audioWorker )audioWorker.postMessage(message);
          }
          break;
        }
        case 'MetaData' :{
          metaSession.SendRtpData(rtspinterleave,rtpheader,rtpPacketArray);
          break;
        }
        default:
      }
    },
    setCallback: function(type, func) {
      switch (type) {
        case 'timeStamp':
          timeStampCallback = func;
          break;
        case 'resize':
          resizeCallback = func;
          break;
        case 'audioTalk':
          sendAudioTalkCallback = func;
          break;
        case 'stepRequest':
          stepRequestCallback = func;
          break;
        case 'metaEvent':
          updateEventCallback = func;
          break;
        case 'videoMode':
          setVideoModeCallback = func;
          break;
        case 'loadingBar':
          loadingBarCallback = func;
          break;
        case 'error':
          errorCallback  = func;
        default:
          console.log("workerManager::setCallback() : type is unknown");
          break;
      }
    },
    capture: function(filename) {
      if (decodeMode == "canvas") {
        videoRenderer.capture(filename);
      } else {
        videoMS.capture(filename);
      }
    },
    SetDeviceInfo: function(deviceInfo) {
      playerMode = deviceInfo.mode;
    },
    setFPS: function(fps) {
      frameRate = fps == 0 ? 30 : fps;
      if (decodeMode === "video") {
        normalNumBox = (fps === 30 ? 4 : 2);
      }
      initVideo(speed === 1 ? false : true);
    },
    setGovLength: function(gov){
      govLength = gov;
    },
    setLiveMode: function(mode) {
      if (setVideoModeCallback !== null) {
        setVideoModeCallback(mode);
      }

      decodeMode = (mode == null ? "canvas" : mode);
      canvasElem = document.getElementById("livecanvas");
      videoElem = document.getElementById("livevideo");
      $(".video-display-none").removeClass('video-display-none');
      if (decodeMode == "video") {
        $(canvasElem).addClass('video-display-none');
      } else if (decodeMode == "canvas") {
        $(videoElem).parent().addClass('video-display-none');
        initVideo(false);
      }
    },
    controlAudioListen: function(cmd, data){
      switch(cmd){
        case 'onOff':{
          if (data === 'on') {
            if (audioRenderer !== null) {
              audioRenderer.Play();
            }
          } else {
            preVolume = 0;              
            if (audioRenderer !== null) {
              audioRenderer.Stop();
            }
          }
        } break;
        case 'volumn':{
          preVolume = data;
          if (audioRenderer !== null) {
            audioRenderer.ControlVolumn(data);
          }
        } break;
      }
    },
    controlAudioTalk: function(cmd, data){
      if (audioTalker !== null) {
        switch(cmd){
          case 'onOff':{
            if (data === 'on') {
              //audioTalker.initAudioOut();
            } else {
              audioTalker.stopAudioOut();
            }
          } break;
          case 'volumn':{
            audioTalker.controlVolumnOut(data);
          } break;
        }
      }
    },
    reassignCanvas: function(){
      if (videoRenderer !== null) {
        videoRenderer.reassignCanvas();
      }
    },
    setResizeCallback: function(callback){
      videoRenderer.setResizeCallback(callback);
    },
    digitalZoom: function(zoomData) {
      if (videoRenderer !== null) {
        videoRenderer.digitalZoom(zoomData);
      }
    },
    playbackForward: function() {
      checkChangeMode();

      if(usePlaybackDrawer){
        if (videoRenderer.forward() == false) {
          videoRenderer.videoBuffering();
          stepRequestCallback("request", playbackService);
          stepFlag = true;
        } else {
          timeStampCallback(videoRenderer.getFrameTimestamp(), true);
        }
      } else {
        videoWorker.postMessage({'type': 'stepPlay', 'direction': 'forward'});
      }
    },
    playbackBackward: function() {
      checkChangeMode();

      if(usePlaybackDrawer){
        if (videoRenderer.backward() == false) {
          videoRenderer.videoBuffering();
          stepRequestCallback("request", playbackService);
          stepFlag = true;
        } else {
          timeStampCallback(videoRenderer.getFrameTimestamp(), true);
        }
      } else {
        videoWorker.postMessage({'type': 'stepPlay', 'direction': 'backward'});
      }
    },
    playbackPause: function() {
      isPaused = true;
      // console.log("workerManager::playbackPause isPaused " + isPaused);
      if(usePlaybackDrawer){
        if (videoRenderer !== null) {
          videoRenderer.playToggle();
        }
      } else {
        videoWorker.postMessage({'type': 'stepPlay', 'data': 'playbackPause'});
      }
    },
    playbackResume: function() {
      isPaused = false;
      // console.log("workerManager::playbackResume isPaused " + isPaused);
      if(usePlaybackDrawer){
        if (videoRenderer !== null) {
          videoRenderer.playToggle();
        }
      } else {
        videoWorker.postMessage({'type': 'stepPlay', 'data': 'playbackResume'});
      }
    },
  	playbackSeek: function() {
      if(videoMS !== null ) {
        videoMS.pause();
        videoMS.setTimeStampInit();
      }

      initVideo(speed);
      videoWorker.postMessage({'type': 'stepPlay', 'data': 'playbackSeek'});
  	},
    videoBuffering: function() {
      if(usePlaybackDrawer){
        if (videoRenderer !== null) {
          videoRenderer.videoBuffering();
        }
      }
    },
    playToggle: function() {
      isPaused = !isPaused;
      // console.log("workerManager::playToggle isPaused " + isPaused);
      if(usePlaybackDrawer){
        if (videoRenderer !== null) {
          videoRenderer.playToggle();
        }
      } else {
        videoWorker.postMessage({'type': 'stepPlay', 'data': 'playToggle'});
      }
    },
    playbackSpeed: function(info) {
      if(usePlaybackDrawer){
        if (videoRenderer !== null) {
          videoRenderer.fastPlay(info);
        }
      }
      speed = info;
      // console.log("workerManager::playbackSpeed speed = " + speed);
      if (decodeMode == "video" && videoMS !== null) {
        if (speed == 1) {
          videoMS.setSpeedPlay(false);
          initVideo(false);
        } else {
          videoMS.setSpeedPlay(true);
          initVideo(true);
        }
      }
    },
    setPlaybackservice: function(obj) {
      playbackService = obj;
    },
    backup : function(menu, fileName, callback, isPlayback) {
      if( fileMaker === null ) {
        fileMaker = new FileMaker();
      }
      if( menu === 'check' ) {
        if( backupWorker === null ) return;
        var checkEvent = {
          'type' : 'backup',
          'data' : {
            'command':'check'
          }
        };
        backupWorker.postMessage(checkEvent);
      }
      else if( menu === 'backupstart' ) {
        if (backupWorker) {
          // console.log("backupWorker already exists");
        } else {
          backupWorker = new Worker('./kind/common_modules/Workers/backupWorker.js');
          backupWorker.onmessage = backupWorkerMessage;
          backupCallback = callback;
        }
        var startEvent = {
          'type' : 'backup',
          'data' : {
            'command':'start',
            'filename' : fileName
          }
        };
        if( isPlayback !== false ) {
          isPlaybackBackup = true;
        }
        backupWorker.postMessage(startEvent);
        videoWorker.postMessage(startEvent);
        //audioWorker.postMessage(startEvent);
      }
      else if( menu === 'backupstop' ) {
        closeBackupWorker();
        if( backupCallback !== undefined && backupCallback !== null ) {
          backupCallback({'errorCode':1,'description':'backup'});//BACKUP_STATUS.STOP
        }
      }
    },
    timeStamp: function(time) {
      if (timeStampCallback && time !== null) {
        timeStampCallback(time, isPaused);
      }
    },
    initVideo: function(speedMode) {
      initVideo(speedMode);
    },
    openFPSmeter: function() {
      if (fps_div !== null)
        fps_div.show();
    },
    closeFPSmeter: function() {
      if (fps_div !== null)
        fps_div.hide();
    },
    setFpsFrame: function(num) {
      fps_count = num;
      play_count = 0;
      start_time = 0;
    },
    terminate: function() {
      if( playerMode !== 'backup' ) {
        if (videoWorker) {
          videoWorker.terminate();
          videoWorker = null;
        }
        if (audioWorker) {
          audioWorker.terminate();
          audioWorker = null;
        }       
      }
      if (audioTalkWorker)  audioTalkWorker.terminate();
      if (audioTalker) {
        audioTalker.terminate();
        audioTalker = null;
      }
      // if (backupWorker) backupWorker.terminate();
      if (videoRenderer) videoRenderer.terminate();
      if (audioRenderer) audioRenderer.terminate();
      videoRenderer = null;
      isPaused = true;
    }
  };

  return new Constructor();
}
