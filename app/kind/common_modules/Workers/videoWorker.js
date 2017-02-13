'use strict';

importScripts('../Util/hashMap.js',
			'../Util/h264SPSParser.js',
			'../Util/h265SPSParser.js',
			'../Util/util.js',
			'../Util/mp4GeneratorTemp.js',
			'../MediaSession/rtpSession.js',
            '../MediaSession/VideoSession/videoBuffer.js',
			'../MediaSession/VideoSession/h264Session.js',
			'../MediaSession/VideoSession/h265Session.js',
			'../MediaSession/VideoSession/mjpegSession.js',
			'../MediaSession/VideoSession/videoRtcpSession.js',
			'../VideoDecoder/videoDecoder.js',
			'../VideoDecoder/videoDecoderFFMPEG303.js',
			'../VideoDecoder/videoDecoderH264.js',
			'../VideoDecoder/videoDecoderH265.js',
			'../VideoDecoder/videoDecoderMjpeg.js');

addEventListener('message', receiveMessage, false);

var videoRtpSessionsArray = [],
	videoRtcpSessionsArray = [],
	sdpInfo = null,
	rtpSession = null,
	rtcpSession = null,
	decodeMode = "canvas";
var isBackupCommand = false,
	isStepPlay = false,
    isForward = true;
var framerate = 0;
var govLength = null;
var backupFrameInfo;
var videoCHID = -1;
var h264Session = null,
	h265Session = null,
	mjpegSession = null;

function receiveMessage(event) {
  var message = event.data;
  switch(message.type) {
  case 'bufferFree':
    videoRtpSessionsArray[videoCHID].freeBufferIdx(message.data);
    break;
  case 'sdpInfo':
    sdpInfo = message.data;
    framerate= 0;
    setVideoRtpSession(sdpInfo);
    break;
  case 'rtpData':
    if(isStepPlay == true) {
      buffering(message);
      break;
    }
    videoCHID = message.data.rtspInterleave[1];
    if (videoRtpSessionsArray[videoCHID] !== undefined) {
	  var rtpdata = message.data;
      var mediaData,
		  backupData;
	  var dataInfo = videoRtpSessionsArray[videoCHID].SendRtpData(rtpdata.rtspInterleave, rtpdata.header, rtpdata.payload, isBackupCommand);
	  if( dataInfo === null || dataInfo === undefined ) {
        mediaData = null;
        backupData = null;
        break;
      } else if (dataInfo.error !== undefined) {
      	sendMessage('error', dataInfo.error);
      	break;
      } else {
        mediaData = dataInfo.decodedData;
        if( dataInfo.decodeMode !== null && dataInfo.decodeMode !== undefined ) {
          decodeMode = dataInfo.decodeMode;
          sendMessage('setVideoTagMode', dataInfo.decodeMode);
		}
        if( dataInfo.backupData !== null && dataInfo.backupData !== undefined ) {
          backupData = cloneArray(dataInfo.backupData.stream);
          dataInfo.backupData.stream = null;
        }
        if ( dataInfo.throughPut !== null && dataInfo.throughPut !== undefined) {
          sendMessage('throughPut', dataInfo.throughPut);
        }
      }
      if (mediaData !== null && mediaData !== undefined) {
	    	if (mediaData.playback !== null && mediaData.playback !== undefined) {
					sendMessage('playbackFlag', mediaData.playback);
	    	}
	    if (mediaData.frameData !== null && decodeMode == "canvas") {
		  if(mediaData.frameData.firstFrame == true){
		    sendMessage('firstFrame', mediaData.frameData.firstFrame);
		    break;
          }
		  var frameInfo = {
			'bufferIdx': mediaData.frameData.bufferIdx,
		    'width': mediaData.frameData.width,
		    'height': mediaData.frameData.height,
		    'codecType': mediaData.frameData.codecType,
		    'frameType': mediaData.frameData.frameType,
		    'timeStamp': null
		  };
          if (mediaData.timeStamp !== null && mediaData.timeStamp !== undefined) {
		    //sendMessage('time', mediaData.timeStamp);
		    frameInfo.timeStamp = mediaData.timeStamp;
		  }
		  sendMessage('decodingTime', mediaData.frameData.decodingTime);
		  sendMessage('videoInfo', frameInfo);
		  if (mediaData.frameData.data !== undefined && mediaData.frameData.data !== null) {
		  	sendMessage('canvasRender', mediaData.frameData.data);
          }
		} else if (mediaData.frameData !== null && decodeMode == "video") {
          if (mediaData.initSegmentData !== null) {
            sendMessage('codecInfo', mediaData.codecInfo);
            sendMessage('initSegment', mediaData.initSegmentData);
          }
          sendMessage('videoTimeStamp', mediaData.timeStamp);
          if (mediaData.frameData.length > 0) {
            sendMessage('mediaSample', mediaData.mediaSample);
            sendMessage('videoRender', mediaData.frameData);
          }
	    } else {
          sendMessage('drop', dataInfo.decodedData);
	    }
	  }
      if (isBackupCommand && backupData !== null && backupData !== undefined ) {
        backupFrameInfo = {
          'type' : 'video',
          'framerate' : framerate === 0 ? 60 : framerate,
          "width" : dataInfo.backupData.width,
          "height" : dataInfo.backupData.height,
          "codectype" : dataInfo.backupData.codecType,
          "PESsize" : backupData.length,
          "frameType":dataInfo.backupData.frameType === undefined ? 'I' : dataInfo.backupData.frameType
        };
	    if( mediaData.timeStamp !== undefined && mediaData.timeStamp !== null ) {
	  	  //In case of playback backup
		  backupFrameInfo.timestamp = mediaData.timeStamp.timestamp;
		  backupFrameInfo.timestamp_usec = dataInfo.backupData.timestamp_usec;
	    }
	    else {
	  	  //In case of Instant recording
	  	  backupFrameInfo.timestamp = dataInfo.backupData.timestamp;
	    }
        sendMessage('backup', {'frameinfo':backupFrameInfo, 'streamData':backupData});
      }
    }
    break;
	case 'backup':
	  // console.log("vodeo worker receive backup command");
	  if( message.data.command === 'start') {
			console.log("....................backup Start command receive");
			isBackupCommand = true;
			sendMessage('audioBackup', 'start');
	  } else if( message.data.command === 'stop' ) {
			console.log("..................backup Stop command receive");
			//to sync audioWorker & videoWorker end time.
			sendMessage('audioBackup', 'stop');
			isBackupCommand = false;
    }
	  break;
    case 'stepPlay':
      var ret =true;
      // console.log("stepPlay videoCHID " + videoCHID);
      if (videoRtpSessionsArray[videoCHID] !== undefined) {
	  }
	  if( message.direction === 'forward') {
	    // console.log("stepPlay Start forward receive");
	    isStepPlay = true;
        isForward = true;
        ret = videoRtpSessionsArray[videoCHID].stepForward();
	  } else if( message.direction === 'backward' ) {
	    // console.log("stepPlay Start backward receive");
	    isStepPlay = true;
        isForward = false;
        ret = videoRtpSessionsArray[videoCHID].stepBackward();
	  } else if( message.data === 'playToggle') {
        isStepPlay = false;
        if (videoRtpSessionsArray[videoCHID] !== undefined){
		  videoRtpSessionsArray[videoCHID].clearBuffer();
		}
	  } else if( message.data === 'playbackResume') {
        isStepPlay = false;
        if (videoRtpSessionsArray[videoCHID] !== undefined){
          videoRtpSessionsArray[videoCHID].clearBuffer();
          videoRtpSessionsArray[videoCHID].initStartTime();
        }
	  } else if( message.data === 'playbackPause') {
//		  isStepPlay = true;
      } else if( message.data === 'playbackSeek') {
        if (videoRtpSessionsArray[videoCHID] !== undefined){
          videoRtpSessionsArray[videoCHID].clearBuffer();
          if (videoRtpSessionsArray[videoCHID].setInitSegment !== undefined) {
          	videoRtpSessionsArray[videoCHID].setInitSegment();
          }
        }
      } else if( message.data === 'findIFrame') {
        if (videoRtpSessionsArray[videoCHID] !== undefined){
	      ret = videoRtpSessionsArray[videoCHID].findIFrame(isForward);
	    }
	  }
	  if(ret == false){
        if (videoRtpSessionsArray[videoCHID] !== undefined){
          videoRtpSessionsArray[videoCHID].clearBuffer();
		}
        sendMessage('stepPlay', 'needBuffering');
	  }else if(ret == true) {
	  }else {
	  	var frameInfo = {
	  	  'bufferIdx': null,//ret.frameData.bufferIdx,
		  'width': ret.frameData.width,
		  'height': ret.frameData.height,
		  'codecType': ret.frameData.codecType,
		  'frameType': ret.frameData.frameType,
		  'timeStamp': null
	    };

	  	if (ret.timeStamp !== null && ret.timeStamp !== undefined) {
		  //sendMessage('time', ret.timeStamp);
		  frameInfo.timeStamp = ret.timeStamp;
        }

		sendMessage('videoInfo', frameInfo);
		sendMessage('canvasRender', ret.frameData.data);
	  }
	  break;
	case 'speed':
      // console.log("speed::fps = " + message.data);
      break;
  case 'rtpDataArray':
  	for (var i = 0; i < message.data.length; i++) {
  		receiveMessage({'type':'rtpData', 'data':message.data[i]});
  	}
  	break;
	default:
      break;
  }
}

function setVideoRtpSession(data) {
	videoRtpSessionsArray = [];
	isStepPlay = false;
  for(var sdpIndex = 0; sdpIndex < data.sdpInfo.length; sdpIndex++) {
	rtpSession = null;
	decodeMode = data.decodeMode;

	if (data.sdpInfo[sdpIndex].codecName === 'H264') {
		if(h264Session === null){
			h264Session = H264Session();
		}
    rtpSession = h264Session;
    rtpSession.init(data.decodeMode);
	  rtpSession.setFramerate(data.sdpInfo[sdpIndex].Framerate);
	  rtpSession.setGovLength(data.govLength);
	  rtpSession.initThroughPutGov();
	 
	  rtpSession.setBufferfullCallback(BufferFullCallback);
	} else if (data.sdpInfo[sdpIndex].codecName === 'H265') {
		if(h265Session === null){
			h265Session = H265Session();
		}
	  rtpSession = h265Session;
	  rtpSession.init();
	  rtpSession.setFramerate(data.sdpInfo[sdpIndex].Framerate);
	  rtpSession.setGovLength(data.govLength);
	  rtpSession.initThroughPutGov();
	  rtpSession.setBufferfullCallback(BufferFullCallback);
	} else if (data.sdpInfo[sdpIndex].codecName === 'JPEG') {
      if(mjpegSession === null){
        mjpegSession = MjpegSession();
      }
	  rtpSession = mjpegSession;
	  rtpSession.init();
	  rtpSession.setBufferfullCallback(BufferFullCallback);
	}

	if( data.sdpInfo[sdpIndex].Framerate !== undefined ) {
	  framerate = data.sdpInfo[sdpIndex].Framerate;
	}
	if (rtpSession !== null) {
	  // rtpSession.setTimestampCallback(timestampCallbackFunc);
	  // rtpSession.setBufferingCallback(bufferingCallback);
		videoCHID = data.sdpInfo[sdpIndex].RtpInterlevedID;
		videoRtpSessionsArray[videoCHID] = rtpSession;
  	}
  }
}

function buffering(message){
	videoCHID = message.data.rtspInterleave[1];
	if (videoRtpSessionsArray[videoCHID] !== undefined) {
		videoRtpSessionsArray[videoCHID].bufferingRtpData(message.data.rtspInterleave, message.data.header, message.data.payload);
	}
}

function BufferFullCallback(){
	videoRtpSessionsArray[videoCHID].findCurrent();
	sendMessage('stepPlay', 'BufferFull');
}

function sendMessage(type, data) {
  var event = {
	'type':type,
	'data':data
  };

  if (type == 'canvasRender' || type == 'videoRender') {/* || type == 'checkBuffer'*/
	postMessage(event, [data.buffer]);
  }else {
	postMessage(event);
  }
}