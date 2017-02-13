"use strict";

function RtpSession() {
	function Constructor() {}
	var rtpPayloadCbFunc = null,
		rtpBufferingCbFunc = null,
		rtpTimestampCbFunc = null,
		rtpOutputSizeCbFunc = null,
		interleavedID = null,
		timeData = null,
		frameRate = 0,
		videoBufferList = null;

	var currentGov = 0,
		calcGov = 0,
		govLength = null,
		dropTimeStart = 0,
		decodingTime = 0,
		dropCheckTime = 0,
		dropPer = 0,
		frameCount = 1,
		dropCount = 0,
		//throughPut = 0,
		throughPutGov = 0,
		decodeMode = "canvas";

	Constructor.prototype = {
		setFrameCallback: function(rtpPayloadCallbackFunc) {
			this.rtpPayloadCbFunc = rtpPayloadCallbackFunc;
		},
		setBufferingCallback: function(rtpBufferingCallbackFunc) {
			this.rtpBufferingCbFunc = rtpBufferingCallbackFunc;
		},
		setTimestampCallback: function(rtpTimestampCallbackFunc) {
			this.rtpTimestampCbFunc = rtpTimestampCallbackFunc;
		},
		setOutputSizeCallback: function(rtpOutputSizeCallbackFunc) {
			this.rtpOutputSizeCbFunc = rtpOutputSizeCallbackFunc;
		},
		setAACCodecInfo: function(info) {
		},
		SendRtpData: function(rtspinterleave, rtpheader, rtpPacketArray, isBackupCommand) {
		},
		bufferingRtpData: function(rtspinterleave, rtpheader, rtpPacketArray) {
		},
		stepForward: function(){
		},
		stepBackward: function(){
		},
		setBufferfullCallback: function(bufferFull){
			if(this.videoBufferList !== null){
				this.videoBufferList.setBufferFullCallback(bufferFull);
			}
		},
		getVideoBuffer: function(idx){
			if(this.videoBufferList !== null){
				return this.videoBufferList.searchNodeAt(idx);/*this.videoBufferList.getCurIdx()*/
			}
		},
		clearBuffer: function() {
			if(this.videoBufferList !== null){
				this.videoBufferList.clear();
			}
		},
		findCurrent: function() {
			if(this.videoBufferList !== null){
				this.videoBufferList.searchTimestamp(this.GetTimeStamp());
			}
		},
		findIFrame: function() {
			if(this.videoBufferList !== null){
				this.videoBufferList.findIFrame();
			}
		},
		SetRtpInterlevedID: function(interleavedID) {
			this.interleavedID = interleavedID;
		},
		SetTimeStamp: function(data) {
			this.timeData = data;
		},
		GetTimeStamp: function() {
			return this.timeData;
		},
		getRTPPacket: function(Channel, rtpPayload) {
		},
		calculatePacketTime: function(rtpTimeStamp) {
		},
		ntohl: function(buffer) {
			return (((buffer[0] << 24) + (buffer[1] << 16) +
							(buffer[2] << 8) + buffer[3]) >>> 0);
		},
		appendBuffer: function(currentBuffer, newBuffer, readLength) {
			var BUFFER_SIZE = 1024 * 1024;
			if ((readLength + newBuffer.length) >= currentBuffer.length) {
				var tmp = new Uint8Array(currentBuffer.length + BUFFER_SIZE);
				tmp.set(currentBuffer, 0);
				currentBuffer = tmp;
			}
			currentBuffer.set(newBuffer, readLength);
			return currentBuffer;
		},
		setFramerate: function(framerate) {
			if(0 < framerate && framerate !== undefined){
				frameRate = framerate;
				if(this.videoBufferList !== null){
					this.videoBufferList.setMaxLength(frameRate*6);
					this.videoBufferList.setBUFFERING(frameRate*4);
				}
			}
		},
		getFramerate: function() {
			return frameRate;
		},
		setGovLength: function(_govLength){
			govLength = _govLength;
		},
		getGovLength: function(){
			return govLength;
		},
		setDecodingTime: function(time) {
			decodingTime = time;
		},
		getDropPercent: function() {
			return dropPer;
		},
		getDropCount: function() {
			return dropCount;
		},
		initThroughPutGov: function(){
			dropTimeStart = 0,
			decodingTime = 0,
			dropCheckTime = 0,
			dropPer = 0,
			frameCount = 1,
			dropCount = 0,
			throughPutGov = 0;
			calcGov =0;
			currentGov =0;
			// console.log("init throughput gov !!!!");
		},
		setThroughPut: function(value) {
			var throughPut = value;
			if (currentGov !== 0) {
				throughPutGov = (throughPut / (frameRate/currentGov));
				//throughPutGov -= 4;
				// console.log("dropCheck::throughPut = " + throughPut + ", throughPutGov = " + throughPutGov + ", Gov = " + currentGov + ", fps = " + frameRate);
				return throughPutGov;
				
			}
		},
		dropCheck: function(frameType) {
			if (frameType == 'I') {
				currentGov = calcGov;
				calcGov = 1;
				return true;
			} else {
				calcGov++;
			}
			
			if (throughPutGov !== 0) {				
				// console.log("dropCheck::calcGov < throughPutGov = " + calcGov + " < " + throughPutGov.toFixed(2) + ", " + (calcGov < throughPutGov));
				if (calcGov < throughPutGov) {
					return true;
				} else {
					dropCount++;
					if (dropCount > 100000) {
						dropCount = 0;
					}
					return false;
				}
			} else {
				return true;
			}
		},
		isDrop: function(frameType, needDropCnt) {
		  if(this.getGovLength() == 0 || this.getGovLength() == null){
            if (frameType == 'I') {
              if(calcGov == 0){
                calcGov = 1;
			  } else {
                this.setGovLength(calcGov);
                // console.log("rtpSession::isDrop setGovLength " + calcGov);
			  }
            } else {
              calcGov+=1;
            }
		  } else if (frameType == 'I') {
            calcGov = 1;
          } else {
            calcGov+=1;
			if((this.getGovLength() - calcGov) < needDropCnt){
              // console.log("isDrop::this.getGovLength() - calcGov " + (this.getGovLength() - calcGov) + " needDropCnt = " + needDropCnt);
              return false;
			}
          }
          return true;
		},
		initStartTime: function() {
            this.firstDiffTime = 0;
            calcGov = 0;
		},
        freeBufferIdx: function(bufferIdx){
		}
	};	
	return new Constructor();
}
