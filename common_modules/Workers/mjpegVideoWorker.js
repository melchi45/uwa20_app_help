'use strict';

importScripts('../Util/util.js',
	    '../MediaSession/rtpSession.js',
	    '../MediaSession/VideoSession/videoBuffer.js',
	    '../MediaSession/VideoSession/mjpegSession.js',
	    '../MediaSession/VideoSession/videoRtcpSession.js',
	    '../VideoDecoder/videoDecoder.js',
			'../VideoDecoder/videoDecoderMjpeg.js');

addEventListener('message', receiveMessage, false);

var videoRtpSessionsArray = [],
	sdpInfo = null,
	rtpSession = null,
	rtcpSession = null,
	decodeMode = "canvas";
var isBackupCommand = false,
	isStepPlay = false;
var framerate = 0;
var backupFrameInfo;
var videoCHID = -1;
var mjpegSession = null;

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
	  var dataInfo = videoRtpSessionsArray[videoCHID].SendRtpData(rtpdata.rtspInterleave, rtpdata.header, rtpdata.payload, isBackupCommand);
	  var mediaData;
	  var backupData = null;
	  if( dataInfo === null || dataInfo === undefined ) {
        mediaData = null;
        backupData = null;
        break;
      }
      else {
        mediaData = dataInfo.decodedData;
				if( dataInfo.decodeMode !== null && dataInfo.decodeMode !== undefined ) {
					decodeMode = dataInfo.decodeMode;
					sendMessage('setVideoTagMode', dataInfo.decodeMode);
				}

        if( dataInfo.backupData !== null && dataInfo.backupData !== undefined ) {
          backupData = cloneArray(dataInfo.backupData.stream);
        }

        if ( dataInfo.throughPut !== null && dataInfo.throughPut !== undefined) {
          sendMessage('throughPut', dataInfo.throughPut);
        }
      }
      if (mediaData !== null && mediaData !== undefined) {
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
	  } else if( message.data.command === 'stop' ) {
			console.log("..................backup Stop command receive");
			//to sync audioWorker & videoWorker end time.
			sendMessage('audioBackup', 'stop');
			isBackupCommand = false;
    }
	  break;
    case 'stepPlay':
      var ret =true;

      console.log("stepPlay videoCHID " + videoCHID);
      if (videoRtpSessionsArray[videoCHID] !== undefined) {

	  }
	  if( message.direction === 'forward') {
	    console.log("stepPlay Start forward receive");
	    isStepPlay = true;
        ret = videoRtpSessionsArray[videoCHID].stepForward();
	  } else if( message.direction === 'backward' ) {
	    console.log("stepPlay Start backward receive");
	    isStepPlay = true;
        ret = videoRtpSessionsArray[videoCHID].stepBackward();
	  } else if( message.data === 'playToggle') {
        isStepPlay = false;
        if (videoRtpSessionsArray[videoCHID] !== undefined){
		  videoRtpSessionsArray[videoCHID].clearBuffer();
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

 	if (data.sdpInfo[sdpIndex].codecName === 'JPEG') {
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