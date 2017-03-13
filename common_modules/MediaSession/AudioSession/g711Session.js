var G711Session = function () {
	var rtpTimeStamp = 0;
	var audioDecoder = null;
	var bitrate=0,
	clockFreq;
	

  function Constructor() {
  	audioDecoder = new G711AudioDecoder();
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

			// pktTime = rtspclient.GetPacketTimeStamp(channelId,rtpTimeStamp);
			//this.rtpPayloadCbFunc(processedMessage);
			var tBuffer = audioDecoder.decode(processedMessage);
			var data = {
				codec : 'G711',
				bufferData : tBuffer,
				rtpTimeStamp: (rtpTimeStamp / 80).toFixed(0)
			}
			if( isBackup === true ) {
				data.streamData = processedMessage;
			}
			return data;
		},
		setCodecInfo: function(info) {
			console.log("Set codec info. for G711");
			bitrate = info.bitrate;
			clockFreq = info.clockFreq;
		},
	});

	return new Constructor();
};