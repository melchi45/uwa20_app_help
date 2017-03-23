var H264Session = function () {
	'use strict';
	var rtpTimeStamp = 0,
	inputLength = 0,
	RTPHeaderSize = 12,
	outputSize = 0,
	size_1M = 1024 * 1024,
	playback = false,
	limitResolution = false,
	inputBuffer = new Uint8Array(size_1M),
	PREFIX = new Uint8Array(4),
	SPSParser = new H264SPSParser(),
	curSize = 0,
	preInfo = null,
	preCodecInfo = null,
	decoder = null,
	NumDecodedFrame = 0,
	SumDecodingTime =0,
	gopTime = 0,
	privDecodingTime = 0,
	privIRtpTime = 0,
	diffTime = 0,
	rtpDiffTime = 0,
	frameDiffTime = 0,
	needDropCnt,
	criticalTime = 0,
	changeModeFlag = false,
	iFrameNum = 0,

	decodedData = {
		frameData: null,
		timeStamp: null,
		initSegmentData: null,
		mediaSample: null,
		dropPercent: 0,
		dropCount: 0,
		codecInfo: "",
		playback: false
	},
	timeData = {'timestamp': null, 'timezone': null},
	playbackVideoTagTempFrame = new Uint8Array(),
	playbackVideoTagTempSample = {};

	//initial segment test
	var sps_segment,
	pps_segment,
	initalSegmentFlag = false,
	initalMediaFrameFlag = false,
	width_segment,
	height_segment,
	initSegmentData,
	frame_time_stamp,
	MarkerCounter,
	mediaCounter,
	videoTagLimitSize = 1024 * 768;

	var width = 0, height = 0;
	var errorcheck = false;
	var errorIFrameNum = 0;
	var durationCorrection = 0;
	var preTimeStamp = null;
	var frameDuration = 0;

	//media segment test
	var segmentBuffer = new Uint8Array(size_1M),
	inputSegLength = 0;
	PREFIX[0] = '0x00';
	PREFIX[1] = '0x00';
	PREFIX[2] = '0x00';
	PREFIX[3] = '0x01';

	var setBuffer = function (buffer1, buffer2) {
		if ((inputLength + buffer2.length) > buffer1.length) {
			buffer1 = new Uint8Array(buffer1.length + size_1M);
		}

		buffer1.set(buffer2, inputLength);
		inputLength += buffer2.length;
		return buffer1;
	};

	function changeMode(mode) {
		if (mode !== decodeMode) {
			if (mode === "video") {
				decodeMode = "video";
			} else {
				decodeMode = "canvas";
				changeModeFlag = true;
				iFrameNum = 0;
				decodedData.frameData.firstFrame = true;
			}
		}
	}

	function Constructor() {
		decoder = H264Decoder(); //new H264Decoder();
	}

	Constructor.prototype = inheritObject(new RtpSession(), {
		init: function(mode){
			initalSegmentFlag = false;
			playback = false;
			decodeMode = mode;
			decoder.setIsFirstFrame(false);
			this.videoBufferList = new VideoBufferList();
			this.firstDiffTime = 0;
		},
		SendRtpData: function (rtspInterleaved, rtpHeader, rtpPayload, isBackup) {
			var HEADER = rtpHeader,
			PAYLOAD = null,
			channelId = rtspInterleaved[1],
			pktTime = {},
			extensionHeaderLen = 0,
			PaddingSize = 0,
			data = {};

			if ((rtpHeader[0] & 0x20) === 0x20) {
				PaddingSize = rtpPayload[rtpPayload.length - 1];
				console.log("H264Session::PaddingSize - " + PaddingSize);
			}

			if ((rtpHeader[0] & 0x10) === 0x10) {
				extensionHeaderLen = ((rtpPayload[2] << 8 | rtpPayload[3]) * 4) + 4;

				if (rtpPayload[0] == '0xAB' && rtpPayload[1] == '0xAD') {
					var startHeader = 4,
					NTPmsw = new Uint8Array(new ArrayBuffer(4)),
					NTPlsw = new Uint8Array(new ArrayBuffer(4)),
					gmt = new Uint8Array(new ArrayBuffer(2)),
					fsynctime = {'seconds': null, 'useconds': null},
					microseconds;

					NTPmsw.set(rtpPayload.subarray(startHeader, startHeader + 4), 0);
					startHeader += 4;
					NTPlsw.set(rtpPayload.subarray(startHeader, startHeader + 4), 0);
					startHeader += 6;
					gmt.set(rtpPayload.subarray(startHeader, startHeader + 2), 0);

					microseconds = (this.ntohl(NTPlsw) / 0xffffffff) * 1000;
					fsynctime.seconds = ((this.ntohl(NTPmsw) - 0x83AA7E80) >>> 0);
					fsynctime.useconds = microseconds;
					gmt = (((gmt[0] << 8) | gmt[1]) << 16) >> 16;

					timeData = {
						timestamp: fsynctime.seconds,
						timestamp_usec: fsynctime.useconds,
						timezone: gmt
					};

					if((this.getFramerate() === 0 || this.getFramerate() === undefined) && (this.GetTimeStamp() != null || this.GetTimeStamp() !== undefined)){
						this.setFramerate(Math.round(1000/(((timeData.timestamp - this.GetTimeStamp().timestamp) == 0 ? 0 : 1000) + (timeData.timestamp_usec - this.GetTimeStamp().timestamp_usec))));
						// console.log("H264Session::frameRate = " + this.getFramerate());
					}
					this.SetTimeStamp(timeData);
					playback = true;
				} else {
					playback = false;
					iFrameNum = 2;
				}
			}

			PAYLOAD = rtpPayload.subarray(extensionHeaderLen, rtpPayload.length - PaddingSize);
			rtpTimeStamp = this.ntohl(rtpHeader.subarray(4, 8));

			var nal_type = (PAYLOAD[0] & 0x1f);
			if (nal_type === 0) {
				console.info("H264Session::error nal_type = " + nal_type);
				errorcheck = true;
			}
			switch (nal_type) {
				default:
				inputBuffer = setBuffer(inputBuffer, PREFIX);
				inputBuffer = setBuffer(inputBuffer, PAYLOAD);
				break;
				// Fragmentation unit(FU)
				case 28:
				var start_bit = ((PAYLOAD[1] & 0x80) === 0x80),
				end_bit = ((PAYLOAD[1] & 0x40) === 0x40),
				fu_type = PAYLOAD[1] & 0x1f,
				payload_start_index = 2;
				if (start_bit == true && end_bit == false) {
					var new_nal_header = new Uint8Array(1);
					new_nal_header[0] = (PAYLOAD[0] & 0x60 | fu_type);
					inputBuffer = setBuffer(inputBuffer, PREFIX);
					inputBuffer = setBuffer(inputBuffer, new_nal_header);
					inputBuffer = setBuffer(inputBuffer, PAYLOAD.subarray(payload_start_index, PAYLOAD.length));
				} else {
					inputBuffer = setBuffer(inputBuffer, PAYLOAD.subarray(payload_start_index, PAYLOAD.length));
				}
				break;
				//SPS
				case 7:
				SPSParser.parse(PAYLOAD);
				var sizeInfo = SPSParser.getSizeInfo();
				curSize = sizeInfo.decodeSize;

				//Make initial segment whenever resolution is changed
				if (preInfo === null || preCodecInfo === null || preInfo.width !== sizeInfo.width || preInfo.height !== sizeInfo.height || preCodecInfo !== SPSParser.getCodecInfo()) {
					initalSegmentFlag = false;
					preInfo = sizeInfo;
					preCodecInfo = SPSParser.getCodecInfo();
					decoder.setIsFirstFrame(false);
				}

				width_segment = sizeInfo.width;
				height_segment = sizeInfo.height;
				width = width_segment;
				height = height_segment;

				inputBuffer = setBuffer(inputBuffer, PREFIX);
				inputBuffer = setBuffer(inputBuffer, PAYLOAD);
				sps_segment = PAYLOAD;
				break;
				//PPS
				case 8:
				inputBuffer = setBuffer(inputBuffer, PREFIX);
				inputBuffer = setBuffer(inputBuffer, PAYLOAD);
				pps_segment = PAYLOAD;
				break;
				//SEI
				case 6:
				break;
			}

			//check marker bit
			if ((HEADER[1] & 0x80) == 0x80) {
				var inputBufferSub=inputBuffer.subarray(0, inputLength);
				var frameType='';
				if (inputBufferSub[4] == 0x67) {
					frameType = 'I';
					if(this.firstDiffTime == 0){
						this.firstDiffTime =  (Date.now() - (rtpTimeStamp / 90).toFixed(0));
						needDropCnt = 0;
					} else {
						frameDiffTime = Math.round(((rtpTimeStamp / 90).toFixed(0) - privIRtpTime) / this.getGovLength());
						privIRtpTime = (rtpTimeStamp / 90).toFixed(0);
						needDropCnt =  (Date.now() - privIRtpTime) - this.firstDiffTime;
						if(needDropCnt > 5000){
							if(playback === false)
							{
								data.error = {
									errorCode: "997",
									description: "Delay time is too long",
									place: "h264Session.js"
								};
								console.log("h264Session::Delay time is too long 997 error ");
								return data;
							}
						}
						needDropCnt = (needDropCnt > 0) ? Math.round(needDropCnt/frameDiffTime) : 0;
					}
				} else {
					frameType = 'P';
				}

				//var inputSegBufferSub;
				if (isBackup && changeModeFlag == false) {
					data.backupData = {
						'stream': new Uint8Array(inputBufferSub),
						'frameType': frameType,
						'width'  :width,
						'height' : height,
						'codecType' : 'h264'
					};
					if (timeData.timestamp !== null && timeData.timestamp !== undefined) {
						data.backupData.timestamp_usec = timeData.timestamp_usec;
					} else {
						data.backupData.timestamp = (rtpTimeStamp / 90).toFixed(0);
					}
				}

				if (preTimeStamp === null && playback === true) {
					preTimeStamp = (1000*timeData.timestamp) + timeData.timestamp_usec;
					return null;
				} else {
					var curTimeStamp = (1000*timeData.timestamp) + timeData.timestamp_usec;
					frameDuration = Math.abs(curTimeStamp - preTimeStamp) * 10;
					preTimeStamp = curTimeStamp;
				}

				if (decodeMode == "canvas") {
					if (outputSize !== curSize) {
						outputSize = curSize;
						decoder.setOutputSize(outputSize);
					}
					//inputBufferSub = inputBuffer.subarray(0, inputLength);
					//frameType = (inputBufferSub[4] == 0x67) ? 'I' : 'P';
					if (changeModeFlag == true && frameType == 'P') {
						inputLength = 0;
						return null;
					} else if (changeModeFlag == true) {
						changeModeFlag = false;
					}

					if (frameType == 'I' && iFrameNum < 2) {
						iFrameNum++;
					}

					decodedData.frameData = null;

					if( isBackup !== true || playback !== true) {
						decodedData.frameData = decoder.decode(inputBufferSub);
					}

					decodedData.timeStamp = null;
					inputLength = 0;
					if (playback == true) {
						timeData = (timeData.timestamp == null ? GetTimeStamp() : timeData);
						decodedData.timeStamp = timeData;
					}
				} else {
					var inputSegBufferSub;
					if (!initalSegmentFlag) {
						initalSegmentFlag = true;

						var info = {
							id: 1,
							width: width_segment,
							height: height_segment,
							type: 'video',
							profileIdc: SPSParser.getSpsValue("profile_idc"),
							profileCompatibility: 0,
							levelIdc: SPSParser.getSpsValue("level_idc"),
							sps: [sps_segment],
							pps: [pps_segment],
							time_scale: 1000,
							fps: (playback == true ? 30 : this.getFramerate())
						};
						decodedData.initSegmentData = initSegment([info]);
						decodedData.codecInfo = SPSParser.getCodecInfo();
					} else {
						decodedData.initSegmentData = null;
					}
					if (frameType === 'I'){
						var h264parameterLength = sps_segment.length + pps_segment.length + 8;
						inputSegBufferSub = inputBufferSub.subarray(h264parameterLength, inputBufferSub.length);
					} else {
						inputSegBufferSub = inputBufferSub.subarray(0, inputBufferSub.length);
					}

					var segSize = inputSegBufferSub.length - 4;

					inputSegBufferSub[0] = (segSize & 0xFF000000) >>> 24;
					inputSegBufferSub[1] = (segSize & 0xFF0000) >>> 16;
					inputSegBufferSub[2] = (segSize & 0xFF00) >>> 8;
					inputSegBufferSub[3] = (segSize & 0xFF);

					var framerate = this.getFramerate();
					var sample = {
						duration: Math.round((1 / framerate) * 1000),
						size: inputSegBufferSub.length,
						frame_time_stamp: null, //added
						frame_duration: null, //added
					};

					if (!playback) {
						decodedData.frameData = new Uint8Array(inputSegBufferSub);
						decodedData.mediaSample = sample;
						// inputLength = 0;
					} else {
						if (isBackup === false) {
							sample.frame_time_stamp = (1000*timeData.timestamp) + timeData.timestamp_usec;

							if (initalMediaFrameFlag == true) {
								playbackVideoTagTempFrame = new Uint8Array(inputSegBufferSub);
								playbackVideoTagTempSample = sample;
								initalMediaFrameFlag = false;
							} else if (initalMediaFrameFlag == false) {
								var preFrameTime = playbackVideoTagTempSample.frame_time_stamp;
								var curFrameTime = sample.frame_time_stamp;
								playbackVideoTagTempSample.frame_duration = 10*Math.abs(curFrameTime - preFrameTime);
								if (playbackVideoTagTempSample.frame_duration > 30000){
									playbackVideoTagTempSample.frame_duration =330;
								}

								decodedData.frameData = new Uint8Array(playbackVideoTagTempFrame);
								decodedData.mediaSample = playbackVideoTagTempSample;
								mediaCounter++;
								playbackVideoTagTempFrame = new Uint8Array(inputSegBufferSub);
								playbackVideoTagTempSample = sample;
							}
						}
						timeData = (timeData.timestamp == null ? GetTimeStamp() : timeData);
						decodedData.timeStamp = timeData;
					}
					inputLength = 0;
				}

				var size = width * height;
				if (playback === true) {
					if (size > videoTagLimitSize) {
						if (frameDuration < 5000) {
							changeMode("video");
							data.decodeMode = "video";
						} else {
							changeMode("canvas");
							data.decodeMode = "canvas";
						}
					} else {
						changeMode("canvas");
						data.decodeMode = "canvas";
					}
				}

				decodedData.playback = playback;
				data.decodedData = decodedData;

				if (errorcheck === true ) {
					if (frameType === 'I') {
						errorIFrameNum++;
					}

					if (errorIFrameNum  === 2) {
						errorIFrameNum = 0;
						errorcheck = false;
					}
					console.info("H264Session::stop");
					return null;
				}

				return data;
			}
		},
		freeBufferIdx: function(bufferIdx){
			decoder.freeBuffer(bufferIdx);
		},
		bufferingRtpData: function(rtspInterleaved, rtpHeader, rtpPayload) {
			if (decodeMode === "video") {
				decodeMode = "canvas";
			}

			var HEADER = rtpHeader,
			PAYLOAD = null,
			channelId = rtspInterleaved[1],
			pktTime = {},
			extensionHeaderLen = 0,
			PaddingSize = 0;
			var data = {};

			if ((rtpHeader[0] & 0x20) === 0x20) {
				PaddingSize = rtpPayload[rtpPayload.length - 1];
				console.log("H264Session::PaddingSize - " + PaddingSize);
			}

			if ((rtpHeader[0] & 0x10) === 0x10) {
				extensionHeaderLen = ((rtpPayload[2] << 8 | rtpPayload[3]) * 4) + 4;

				if (rtpPayload[0] == '0xAB' && rtpPayload[1] == '0xAD') {
					var startHeader = 4,
					NTPmsw = new Uint8Array(new ArrayBuffer(4)),
					NTPlsw = new Uint8Array(new ArrayBuffer(4)),
					gmt = new Uint8Array(new ArrayBuffer(2)),
					fsynctime = {'seconds': null, 'useconds': null},
					microseconds;

					NTPmsw.set(rtpPayload.subarray(startHeader, startHeader + 4), 0);
					startHeader += 4;
					NTPlsw.set(rtpPayload.subarray(startHeader, startHeader + 4), 0);
					startHeader += 6;
					gmt.set(rtpPayload.subarray(startHeader, startHeader + 2), 0);

					microseconds = (this.ntohl(NTPlsw) / 0xffffffff) * 1000;
					fsynctime.seconds = ((this.ntohl(NTPmsw) - 0x83AA7E80) >>> 0);
					fsynctime.useconds = microseconds;
					gmt = (((gmt[0] << 8) | gmt[1]) << 16) >> 16;

					timeData = {
						timestamp: fsynctime.seconds,
						timestamp_usec: fsynctime.useconds,
						timezone: gmt
					};

					//          this.SetTimeStamp(timeData);
					//this.rtpTimestampCbFunc(timeData);
					// console.log("H264Session::timestamp = " + fsynctime.seconds +" "+ fsynctime.useconds);
					playback = true;
				}
			}

			PAYLOAD = rtpPayload.subarray(extensionHeaderLen, rtpPayload.length - PaddingSize);
			rtpTimeStamp = new Uint8Array(new ArrayBuffer(4));
			rtpTimeStamp.set(rtpHeader.subarray(4, 8), 0);
			rtpTimeStamp = this.ntohl(rtpTimeStamp);

			var nal_type = (PAYLOAD[0] & 0x1f);

			switch (nal_type) {
				default:
				if (decodeMode == "canvas") {
					inputBuffer = setBuffer(inputBuffer, PREFIX);
					inputBuffer = setBuffer(inputBuffer, PAYLOAD);
				} else {
					segmentBuffer = setMediaSegment(segmentBuffer, PREFIX);
					segmentBuffer = setMediaSegment(segmentBuffer, PAYLOAD);
				}
				break;
				// Fragmentation unit(FU)
				case 28:
				var start_bit = ((PAYLOAD[1] & 0x80) === 0x80),
				end_bit = ((PAYLOAD[1] & 0x40) === 0x40),
				fu_type = PAYLOAD[1] & 0x1f,
				payload_start_index = 2;

				if (start_bit == true && end_bit == false) {
					var new_nal_header = new Uint8Array(1);
					new_nal_header[0] = (PAYLOAD[0] & 0x60 | fu_type);

					if (decodeMode == "canvas") {
						inputBuffer = setBuffer(inputBuffer, PREFIX);
						inputBuffer = setBuffer(inputBuffer, new_nal_header);
						inputBuffer = setBuffer(inputBuffer, PAYLOAD.subarray(payload_start_index, PAYLOAD.length));
					} else {
						segmentBuffer = setMediaSegment(segmentBuffer, PREFIX);
						segmentBuffer = setMediaSegment(segmentBuffer, new_nal_header);
						segmentBuffer = setMediaSegment(segmentBuffer, PAYLOAD.subarray(payload_start_index, PAYLOAD.length));
					}
				} else {
					if (decodeMode == "canvas") {
						inputBuffer = setBuffer(inputBuffer, PAYLOAD.subarray(payload_start_index, PAYLOAD.length));
					} else {
						segmentBuffer = setMediaSegment(segmentBuffer, PAYLOAD.subarray(payload_start_index, PAYLOAD.length));
					}
				}
				break;
				//SPS
				case 7:
				SPSParser.parse(PAYLOAD);
				var sizeInfo = SPSParser.getSizeInfo();
				curSize = sizeInfo.decodeSize;
				width_segment = sizeInfo.width;
				height_segment = sizeInfo.height;

				if (playback) {
					var limitSize = 1280 * 720;
					limitResolution = false;
					// console.log("h264 resolution in sps = width : " + sizeInfo.width + ", height : " + sizeInfo.height);
					if (curSize > limitSize) {
						limitResolution = true;
					}
				}

				inputBuffer = setBuffer(inputBuffer, PREFIX);
				inputBuffer = setBuffer(inputBuffer, PAYLOAD);
				sps_segment = PAYLOAD;
				break;
				//PPS
				case 8:
				inputBuffer = setBuffer(inputBuffer, PREFIX);
				inputBuffer = setBuffer(inputBuffer, PAYLOAD);
				pps_segment = PAYLOAD;
				break;
				//SEI
				case 6:
				break;
			}
			//      console.log((HEADER[1] & 0x80) == 0x80);
			//check marker bit
			if ((HEADER[1] & 0x80) == 0x80) {
				if (outputSize !== curSize) {
					outputSize = curSize;
					decoder.setOutputSize(outputSize);

					if (!initalSegmentFlag && decodeMode != "canvas") {
						initalSegmentFlag = true;

						var info = {
							id: 1,
							width: width_segment,
							height: height_segment,
							type: 'video',
							profileIdc: SPSParser.getSpsValue("profile_idc"),
							profileCompatibility: 0,
							levelIdc: SPSParser.getSpsValue("level_idc"),
							sps: [sps_segment],
							pps: [pps_segment],
							time_scale: 1000,
							fps: this.getFramerate()
						};
						decodedData.initSegmentData = initSegment([info]);
						decodedData.codecInfo = SPSParser.getCodecInfo();
					}
					width = width_segment;
					height = height_segment;
				}

				var stepBufferSub = new Uint8Array(inputBuffer.subarray(0, inputLength));

				if(this.videoBufferList !== null){
					//          console.log('h264 push stepBufferSub.length = '+ stepBufferSub.length);
					this.videoBufferList.push(stepBufferSub, width, height, 'h264', (stepBufferSub[4] == 0x67) ? 'I' : 'P', timeData);
				}
				inputLength = 0;
			}
		},
		stepForward: function(){
			if(this.videoBufferList !== null) {
				//        console.log("streamDrawer::drawFrame stepValue = FORWARD, videoBufferList.length = " + videoBufferList._length + ", FrameNum = " + videoBufferList.getCurIdx());
				var bufferNode;
				var nextNode = this.videoBufferList.getCurIdx() + 1;
				if (nextNode <= this.videoBufferList._length) {
					bufferNode = this.videoBufferList.searchNodeAt(nextNode);
					if (bufferNode === null || bufferNode === undefined) {
						return false;
					} else {
						var data = {};
						this.SetTimeStamp(bufferNode.timeStamp);
						data.frameData = decoder.decode(bufferNode.buffer);
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
					data.frameData = decoder.decode(bufferNode.buffer);
					data.timeStamp = bufferNode.timeStamp;
					return data;
				}
			}
		},
		findIFrame: function() {
			if(this.videoBufferList !== null) {
				var bufferNode = this.videoBufferList.findIFrame();
				if (bufferNode === null || bufferNode === undefined) {
					return false;
				} else {
					var data = {};
					this.SetTimeStamp(bufferNode.timeStamp);
					data.frameData = decoder.decode(bufferNode.buffer);
					data.timeStamp = bufferNode.timeStamp;
					return data;
				}
			}
		},
		setInitSegment: function() {
			initalSegmentFlag = false;
			preInfo = null;
			preCodecInfo = null;
		}
	});

return new Constructor();
};