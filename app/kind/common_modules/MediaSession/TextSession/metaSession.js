var MetaSession = function (eventCallback) {
	var marker = 0,
		metaFrameStarted = false,
		metaDataFrame = null;

	function appendBuffer(buffer1, buffer2) {
		var tmp = new Uint8Array(buffer1.length + buffer2.length);
		tmp.set(buffer1, 0);
		tmp.set(buffer2, buffer1.length);
		return tmp;
	};

  function Constructor() {};

  Constructor.prototype = inheritObject(new RtpSession(), {
  	SendRtpData: function(rtspInterleaved, rtpHeader, rtpPayload) {
			if((rtpHeader[1] & 0x80) === 0x80) {
				marker = 1;
			} else {
				marker = 0;
			}

			if(metaFrameStarted === false) {
				if(marker === 1) {
					//current Meta data frame is complete. Send to Meta data Decoder
					eventCallback(rtpPayload);
				} else {
					//append data to Meta data frame
					metaDataFrame = new Uint8Array(rtpPayload.length);
					metaDataFrame.set(rtpPayload,0);
					metaFrameStarted = true;
				}
			} else {
				metaDataFrame  = appendBuffer(metaDataFrame,rtpPayload);

				if(marker === 1) {
					metaFrameStarted = false;
					eventCallback(metaDataFrame);
				}
			}		
		}
	});

	return new Constructor();
};