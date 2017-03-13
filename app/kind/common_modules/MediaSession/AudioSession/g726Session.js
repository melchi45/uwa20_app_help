var G726Session = function (bit) {
	var	rtpTimeStamp = 0;
	var audioDecoder = null;
	var g726_bits = bit;
	var bitrate = 0, clockFreq = 0;

  function Constructor() {
  	audioDecoder = new G726xAudioDecoder(g726_bits);
  };

  Constructor.prototype = inheritObject(new RtpSession(), {
  	SendRtpData: function(rtspInterleaved, rtpHeader, rtpPayload, isBackup) {
			var headerLen =4;
			var extensionHeaderLen = 0;
			if (((rtpHeader[0] & 0x10)=== 0x10)){
				extensionHeaderLen = ((rtpPayload[2] << 8 | rtpPayload[3])*4) + 4;
			}
			var pktTime = {};
			var processedMessage = rtpPayload.subarray(extensionHeaderLen, rtpPayload.length);
			var channelId = rtspInterleaved[1];

			rtpTimeStamp = new Uint8Array(new ArrayBuffer(4));
			rtpTimeStamp.set(rtpHeader.subarray(4,8),0);         
			rtpTimeStamp = this.ntohl(rtpTimeStamp); 

			var tBuffer = audioDecoder.decode(processedMessage);
			//convert integer to float number between -1 and 1
			var jsData = new Float32Array(tBuffer.length);
			for (var i = 0, tBuffer_length = tBuffer.length; i < tBuffer_length; i++) {
				/* var a1 = pcmData[i]/Math.pow(2,15);
				var a2 = Math.round(a1*100000) / 100000;
				jsData[i] = a2; */
				jsData[i] = tBuffer[i] / Math.pow(2,15)
			}
			
			var data = {
				codec : 'G726',
				bufferData : jsData,
				rtpTimeStamp: (rtpTimeStamp / 80).toFixed(0)
			}
			if( isBackup === true ) {
				data.bitrate = g726_bits;
				data.streamData = processedMessage;
			}
			return data;
		},
		setCodecInfo : function(info) {
			console.log("Set codec info. for G726");
			bitrate = info.bitrate;
			clockFreq = info.clockFreq;
		},
	});

	return new Constructor();
};