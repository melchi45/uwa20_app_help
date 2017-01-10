'use strict';

importScripts('../MediaSession/rtpSession.js',
			'../MediaSession/AudioSession/audioTalkSession.js',
			'../AudioEncoder/audioEncoderG711.js',
			'../Util/util.js');

addEventListener('message', receiveMessage, false);

var audioTalkSession = null;

function receiveMessage(event) {
  var message = event.data;
  switch(message.type){
  	case 'sdpInfo':
      setAudioTalkSession(message.data.sdpInfo);
	  break;
		case 'getRtpData' :
		  var rtpPacket = audioTalkSession.getRTPPacket(message.data);
		  sendMessage('rtpData', rtpPacket);
	  break;
	  case 'sampleRate':{
	  	if(audioTalkSession !== null){
	  		audioTalkSession.setSampleRate(message.data);
	  	}
	  }
	  break;
  }
}

function setAudioTalkSession(sdpInfo){
  for(var sdpIndex = 0; sdpIndex < sdpInfo.length; sdpIndex++){
		if(sdpInfo[sdpIndex].trackID.search('trackID=t') !== -1){
	      audioTalkSession = new AudioTalkSession(sdpInfo[sdpIndex].RtpInterlevedID);
		}
  }
}

function sendMessage(type, data) {
  var event = {
	'type':type,
	'data':data
  };

  postMessage(event, [data.buffer]);
}