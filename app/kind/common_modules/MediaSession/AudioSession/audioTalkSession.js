var AudioTalkSession = function (channel) {
	var rtspheader,
		rtpheader,
		rtpHeaderSize = 12,
		rtspHeaderSize = 4,
		sequenceNum = 0xFFDE,   //random start sequence number
		timestamp,
		ssrcId = Math.floor((Math.random() * 1000000) + 1),
		rtpPacket,
		channelID = null,
		audioEncoder = new G711AudioEncoder();

	var intToByteArrayHtoN = function(value,len,bytearray,lastpos) {
		var byteval;
		for ( index = lastpos; index > (lastpos-len); index = index - 1) {
			byteval = value & 0xff;
			bytearray[index] = byteval;
			value = (value - byteval) / 256 ;
		}

	};

  function Constructor(channel) {
  	channelID = channel;
  };

  Constructor.prototype = inheritObject(new RtpSession(), {	
  	setSampleRate: function(_sampleRate){
  		audioEncoder.setSampleRate(_sampleRate);
  	},
		getRTPPacket: function(buffer) {
			var rtpPayload = audioEncoder.encode(buffer);
			var payloadSize;
			var index = 0, byteval;

			rtspheader = new Uint8Array(new ArrayBuffer(4));
			rtspheader[0] = 0x24;
			rtspheader[1] = channelID;
			payloadSize = rtpHeaderSize + rtpPayload.length;

			intToByteArrayHtoN(payloadSize,2,rtspheader,3);       

			//form rtp header
			rtpheader = new Uint8Array(new ArrayBuffer(12));
			rtpheader[0] = 0x80;
			rtpheader[1] = 0x80;//marker & Payload Type
			//sequence number
			sequenceNum += 1; 
			intToByteArrayHtoN(sequenceNum,2,rtpheader,3);

			//timestamp
			timestamp = new Date();
			intToByteArrayHtoN(timestamp,4,rtpheader,7);

			//ssrc
			intToByteArrayHtoN(ssrcId,4,rtpheader,11);  

			rtpPacket = new Uint8Array(new ArrayBuffer(rtpHeaderSize +rtpPayload.length+4));
			rtpPacket.set(rtspheader,0);
			rtpPacket.set(rtpheader,rtspHeaderSize);
			rtpPacket.set(rtpPayload,rtspHeaderSize+rtpHeaderSize);

			return rtpPacket;
		}
	});

	return new Constructor(channel);
};