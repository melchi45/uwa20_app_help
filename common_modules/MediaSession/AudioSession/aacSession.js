var AACSession = function () {
	var config,
	clockFreq,
	bitrate,
	rtpTimeStamp = 0,
	ADTs = new Uint8Array(7),
	count=0;
	function genADTSAAC(frameSize, payload) {
		var mChannels = 1;
		if (typeof(config) === 'string'){
			var FirstTwo_config = parseInt(config.substring(0,2),16);
			var LastTwo_config = parseInt(config.substring(2,4),16);
		} else {
			console.log("wrong type of config in SDP");
			return;
		}  

		var mAOT = FirstTwo_config >> 3;
		var freqIndex = ((FirstTwo_config & 0x07)<<1) | ((LastTwo_config & 0x80) >>7);

		ADTs[0] = 0xFF;
		ADTs[1] = 0xF9;
		ADTs[2] = (mAOT-1) << 6;
		ADTs[2] |= (freqIndex << 2);
		ADTs[2] |= mChannels  >> 2;
		ADTs[3] = mChannels << 6;
		ADTs[3] |= ((frameSize+7) & 0x1800 )>> 11;
		ADTs[4] = ((frameSize+7) & 0x07F8) >> 3;
		ADTs[5] = ((frameSize+7) & 0x07) << 5;
		ADTs[5] |= 0x01;
		ADTs[6] = 0x54;

		var ADTsAAC = new Uint8Array(ADTs.length + payload.length);
		ADTsAAC.set(ADTs, 0);
		ADTsAAC.set(payload, ADTs.length);
		return ADTsAAC;
	}

	function Constructor() {};

	Constructor.prototype = inheritObject(new RtpSession(), {
		SendRtpData: function(rtspInterleaved, rtpHeader, rtpPayload, isBackup) {
			var headerLen =4;
			var extensionHeaderLen = 0;
			var pktTime = {};
			var processedMessage;
			var channelId = rtspInterleaved[1];

			if (((rtpHeader[0] & 0x10)=== 0x10)){
				extensionHeaderLen = ((rtpPayload[2] << 8 | rtpPayload[3])*4) + 4;
			}		

			rtpTimeStamp = new Uint8Array(new ArrayBuffer(4));
			rtpTimeStamp.set(rtpHeader.subarray(4,8),0);         
			rtpTimeStamp = this.ntohl(rtpTimeStamp); 

			var frameSize = rtpPayload.length - (headerLen + extensionHeaderLen);
			var raw_payload = rtpPayload.subarray((headerLen + extensionHeaderLen), rtpPayload.length);
			
			var temp1 = raw_payload.subarray(0,2);
			
			
			if ((temp1[0] === 0xFF) && (temp1[1] & 0xF0 === 0xF0)){
				var data = {
					codec : 'AAC',
					bufferData : raw_payload,
					rtpTimeStamp: (rtpTimeStamp / 80).toFixed(0)
				}
				if( isBackup === true ) {
				data.streamData = raw_payload.subarray(7, raw_payload.length);
			}
				
			} else {
				var ADTsAAC = genADTSAAC(frameSize, raw_payload);
				var data = {
					codec : 'AAC',
					bufferData : ADTsAAC,
					rtpTimeStamp: (rtpTimeStamp / 80).toFixed(0)
				}
				if( isBackup === true ) {
				data.streamData = raw_payload;
			}
			}
			
			//this.rtpPayloadCbFunc(ADTsAAC);
			return data;
		},
		setCodecInfo: function(info) {
			console.log("Set codec info. for AAC");
			config = info.config;
			bitrate = info.bitrate;
			clockFreq = info.clockFreq;
		},
		getCodecInfo : function() {
			return {'bitrate' : bitrate,'clockFreq' : clockFreq};
		}
	});

	return new Constructor();
};

