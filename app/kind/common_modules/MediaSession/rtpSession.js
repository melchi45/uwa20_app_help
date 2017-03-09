"use strict";

function RtpSession() {
	function Constructor() { this.decoder = null; }
	var rtpPayloadCbFunc = null,
		rtpBufferingCbFunc = null,
		rtpTimestampCbFunc = null,
		rtpOutputSizeCbFunc = null,
		interleavedID = null,
		timeData = null,
		frameRate = 0;

	var currentGov = 0,
		calcGov = 0,
		govLength = null,
		dropTimeStart = 0,
		decodingTime = 0,
		dropCheckTime = 0,
		dropPer = 0,
		frameCount = 1,
		dropCount = 0,
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
		setReturnCallback: function(RtpReturn) {
			this.rtpReturnCallback = RtpReturn;
		},
		setAACCodecInfo: function(info) {
		},
		SendRtpData: function(rtspinterleave, rtpheader, rtpPacketArray, isBackupCommand) {
		},
		bufferingRtpData: function(rtspinterleave, rtpheader, rtpPacketArray) {
		},
		stepForward: function(){
            if(this.videoBufferList !== null) {
                var bufferNode;
                var nextNode = this.videoBufferList.getCurIdx() + 1;
                if (nextNode <= this.videoBufferList._length) {
                    bufferNode = this.videoBufferList.searchNodeAt(nextNode);
                    if (bufferNode === null || bufferNode === undefined) {
                        return false;
                    } else {
                        var data = {};
                        this.SetTimeStamp(bufferNode.timeStamp);
                        if (bufferNode.codecType == "mjpeg") {
                            data.frameData = this.decoder.decode(new Uint8Array(bufferNode.buffer));
                        } else {
                            data.frameData = this.decoder.decode(bufferNode.buffer);
                        }
                        data.timeStamp = bufferNode.timeStamp;
                        return data;
                    }
                } else {
                    return false;
                }
            }
		},
		stepBackward: function(){
            if(this.videoBufferList !== null) {
                var bufferNode;
                var prevINode = this.videoBufferList.getCurIdx() - 1;
                while (prevINode > 0) {
                    bufferNode = this.videoBufferList.searchNodeAt(prevINode);
                    if (bufferNode.frameType === "I" || bufferNode.codecType == "mjpeg") {
                        break;
                    } else {
                        bufferNode = null;
                        prevINode--;
                    }
                }
                if (bufferNode === null || bufferNode === undefined) {
                    return false;
                } else {
                    var data = {};
                    this.SetTimeStamp(bufferNode.timeStamp);
                    if (bufferNode.codecType == "mjpeg") {
                        data.frameData = this.decoder.decode(new Uint8Array(bufferNode.buffer));
                    } else {
                        data.frameData = this.decoder.decode(bufferNode.buffer);
					}
                    data.timeStamp = bufferNode.timeStamp;
                    return data;
                }
            }
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
		initStartTime: function() {
			this.firstDiffTime = 0;
			calcGov = 0;
		}
	};	
	return new Constructor();
}
