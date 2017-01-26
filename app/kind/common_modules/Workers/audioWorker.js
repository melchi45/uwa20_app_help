'use strict';

importScripts('../MediaSession/rtpSession.js', 
			'../MediaSession/AudioSession/g711Session.js',
			'../MediaSession/AudioSession/g726Session.js',
			'../MediaSession/AudioSession/aacSession.js',
			'../MediaSession/VideoSession/videoRtcpSession.js',
			'../AudioDecoder/audioDecoder.js',
			'../AudioDecoder/audioDecoderG711.js',
			'../AudioDecoder/audioDecoderG726x.js',
			'../AudioDecoder/audioDecoderG726_16.js',
			'../AudioDecoder/audioDecoderG726_24.js',
			'../AudioDecoder/audioDecoderG726_32.js',
			'../AudioDecoder/audioDecoderG726_40.js',
			'../Util/audioUtil.js',
			'../Util/util.js');

addEventListener('message', receiveMessage, false);

var audioRtpSessionsArray = [];
var sdpInfo = null;
var rtpSession = null;
var rtcpSession = null;
var isBackupCommand = false;
var frameInfo = {};

function receiveMessage(event) {
  var message = event.data;

  switch(message.type) {
	case 'sdpInfo':
	  sdpInfo = message.data.sdpInfo;
	  var aacCodecInfo = message.data.aacCodecInfo;
	  setAudioRtpSession(sdpInfo,aacCodecInfo);
	  break;
	case 'rtpData':
	  var channelID = message.data.rtspInterleave[1];
	  if(audioRtpSessionsArray[channelID] !== undefined){
		var rtpdata = message.data;
		var frameData = audioRtpSessionsArray[channelID].SendRtpData(rtpdata.rtspInterleave, rtpdata.header, rtpdata.payload, isBackupCommand);
		var backupData = null;
		if( frameData !== null && frameData !== undefined &&
	      frameData.streamData !== null && frameData.streamData !== undefined ) {
		  backupData = cloneArray(frameData.streamData);
		  frameData.streamData = null;
		}
		sendMessage('render',frameData);

		if (isBackupCommand && backupData !== null && backupData !== undefined) {
		  var frameinfo = {
			"type" : 'audio',
			"bitrate" : frameData.bitrate,
			"codectype" : frameData.codec,
			"PESsize" : backupData.length
		  };
		  sendMessage('backup', {'frameinfo':frameinfo, 'streamData':backupData});
		}
	  }
	  break;
	case 'backup':
     // console.log("audio backupworker receive backup command");
	  if( message.data.command === 'start') {
			console.log("start audioBackup");
			isBackupCommand = true;
	  } else if( message.data.command === 'stop' ) {
	  	console.log("stop audioBackup");
			isBackupCommand = false;
    }
	  break;
	default:
	  break;
  }
}

function setAudioRtpSession(sdpInfo,aacCodecInfo){
  var SDPInfo = sdpInfo;

  for(var sdpIndex = 0; sdpIndex < sdpInfo.length; sdpIndex++){
	if(SDPInfo[sdpIndex].trackID.search('trackID=t') == -1){
      rtpSession = null;
      switch(SDPInfo[sdpIndex].codecName){
        case 'G.711' :
		  rtpSession = new G711Session();
          break;
        case 'G.726-16' : case 'G.726-24' : case 'G.726-32' : case 'G.726-40' :
		  var bit = parseInt(SDPInfo[sdpIndex].codecName.substr(6,2));
		  rtpSession = new G726Session(bit);
		  break;
		case 'mpeg4-generic' :
		  rtpSession = new AACSession();
		  rtpSession.setCodecInfo(aacCodecInfo);
		  break;
	  }

	  var channelID = SDPInfo[sdpIndex].RtpInterlevedID;
      audioRtpSessionsArray[channelID] = rtpSession;
      //rtcpSession = null;
	  //rtcpSession = new RtcpSession(SDPInfo[sdpIndex].ClockFreq);
	  //audioRtcpSessionsArray.push(rtcpSession);
	}
  }
}

function sendMessage(type, data) {
  var event = {
	'type':type,
	'codec':data.codec,
	'data':data.bufferData,
	'rtpTimeStamp':data.rtpTimeStamp
  };

  if (type == 'render') {
	postMessage(event, [data.bufferData.buffer]);
} else if( type === 'backup' ) {
	var backupMessage = {
      'type' : type,
	  'data' : data
	};
	postMessage(backupMessage);
  } else {
	postMessage(event);
  }
}