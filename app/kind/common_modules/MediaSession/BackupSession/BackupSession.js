var BackupSession = function(_sendMessageCallback) {
	'use strict';
	var file_info = null;

	var HEADER_BYTES = 2048;
	var sendMessageCallback = null;
	var videoFrame = {};
	var audioFrame = {};
	var isVideo = false, isAudio = false;
	var is_audio_init = true;
	var is_video_init = true;
	var G7XX_SAMPLING_RATE = 8*1000;
	var AAC_SAMPLING_RATE = 16*1000;
	var G711_BITRATE = 64*1000;
	var AAC_BITRATE = 48*1000;

	var createAviFile = null;
	var fileName = "";
	var isPlayback = false;

	var getbuffersize = function() {
		if( !isVideo ) {
			return 128*1024;
		}
		return (videoFrame.width * videoFrame.height)/2;
	};

	function Constructor(_sendMessageCallback){
		file_info = null;
		sendMessageCallback = _sendMessageCallback;
		this.init();
	};

	Constructor.prototype = {
		init : function() {
			is_video_init = true;
			is_audio_init = true;
			isPlayback = false;
		
			createAviFile = new AviFileWriter();

			fileName = "";
		},
		checkMaxSize : function() {
			//console.log("current size is :", (HEADER_BYTES + file_info.pos +file_info.tailSize + 4 )/1000000);
			if( (HEADER_BYTES + file_info.pos +file_info.tailSize + 4 )/1000000 > 500 ) {
				console.log('exceed maximun file size (500MB)');
				sendMessageCallback('backupResult', {'errorCode' : -4, 'description' : 'backup'});
				this.endSession();
				return true;
			}
			return false;
		},
		setVideoFrameInfo : function(data) {
			var isFirstFrame = false;
			if( videoFrame.codectype === undefined ) {
				isFirstFrame = true;
			}
			videoFrame.framerate = data.framerate*1;
			videoFrame.width = data.width*1;
			videoFrame.height = data.height*1;
			videoFrame.frameType = data.frameType;
			if( data.codectype === 'mjpeg') {
				videoFrame.codectype = 'MJPG';
			} else if( data.codectype === 'h264') {
				videoFrame.codectype = 'H264';
			} else if( data.codectype === 'h265') {
				videoFrame.codectype = 'HEVC';
			}
			videoFrame.PESsize = data.PESsize;
			videoFrame.src_input_ms = data.timestamp*1;
			if( data.timestamp_usec !== undefined ) {
				videoFrame.src_input_ms *= 1000;
				videoFrame.src_input_ms += Math.floor(data.timestamp_usec);
				videoFrame.src_input_ms = Math.floor(videoFrame.src_input_ms/10) * 10;
				if( isPlayback === false ) {
					isPlayback = true;
				}
			}
			if( file_info === null ) {
				file_info = {};
				file_info.pos = 4;
				file_info.tailSize = 0;
				sendMessageCallback('backupResult', {'errorCode' : 0, 'description' : 'backup'});
			}
			if( isFirstFrame === true ) {
				createAviFile.initHeader('video', videoFrame);
			}

			data = null;
		},
		setAudioFrameInfo : function(data) {
			var isFirstFrame = false;
			if( audioFrame.codectype === undefined ) {
				isFirstFrame = true;
			}
			audioFrame.codectype = data.codectype;
			if( data.codectype === 'G711' ) {
				audioFrame.audio_samplingrate = G7XX_SAMPLING_RATE;
				audioFrame.bitrate = G711_BITRATE;
			} else if( data.codectype === 'AAC' ) {
				audioFrame.audio_samplingrate = AAC_SAMPLING_RATE;
				audioFrame.bitrate = AAC_BITRATE;
			} else if( data.codectype === 'G726') {
				audioFrame.bitrate = data.bitrate*1000;
				audioFrame.audio_samplingrate = G7XX_SAMPLING_RATE;
			}
			audioFrame.PESsize = data.PESsize;
			if( file_info === null ) {
				file_info = {};
				file_info.pos = 4;
				file_info.tailSize = 0;
				sendMessageCallback('backupResult', {'errorCode' : 0, 'description' : 'backup'});
			}
			if( isFirstFrame === true ) {
				createAviFile.initHeader('audio');
			}
			data = null;
		},
		sendData : function(frameInfo, streamData) {
			var header = null;
			var needToAddDummy = false;
			if( frameInfo.type === 'video' ) {
				if( file_info === null && frameInfo.frameType !== 'I') return;
				this.setVideoFrameInfo(frameInfo);
				header = createAviFile.updateInfo(frameInfo.type, videoFrame, file_info);
				if( header === null ) {
					var errorCode = createAviFile.getErrorCode(frameInfo.type);
					if( errorCode < 0 ) {
						sendMessageCallback('backupResult', {'errorCode' : errorCode, 'description' : 'backup'});
						this.endSession();
						return;
					}
				}
				if( streamData.length < createAviFile.getChunkPayloadSize(frameInfo.type)){
					needToAddDummy = true;
				}
				if( this.checkMaxSize() === false ) {
					if( createAviFile === null ) {return;}
					var videoIdxBuffer = createAviFile.getIdxBuffer(frameInfo.type);
					sendMessageCallback('backup', {'target':'tailBody','data':videoIdxBuffer});
					file_info.tailSize += videoIdxBuffer.length;

					sendMessageCallback('backup', {'target':'body','data':header});
					sendMessageCallback('backup', {'target':'body','data':streamData});
					if( needToAddDummy ) {
						var dummyData = new Uint8Array(1);
						sendMessageCallback('backup', {'target':'body','data':dummyData});
						dummyData = null;
					}
					streamData = null;
					videoIdxBuffer = null;					
				}
				else {
					return;
				}
			}
			else if( frameInfo.type === 'audio' ) {
				//if( file_info === null ) return;
				this.setAudioFrameInfo(frameInfo);
				header = createAviFile.updateInfo(frameInfo.type, audioFrame, file_info);
				if( header === null ) {
					var errorCode = createAviFile.getErrorCode(frameInfo.type);
					if( errorCode < 0 ) {
						sendMessageCallback('backupResult', {'errorCode' : errorCode, 'description' : 'backup'});
						this.endSession();
						return;
					}
				}
				if( this.checkMaxSize() === false ) {
					if( createAviFile === null ) {return;}
					var audioIdxBuffer = createAviFile.getIdxBuffer(frameInfo.type);
					sendMessageCallback('backup', {'target':'tailBody','data':audioIdxBuffer});
					file_info.tailSize += audioIdxBuffer.length;

					sendMessageCallback('backup', {'target':'body','data':header});
					sendMessageCallback('backup', {'target':'body','data':streamData});
					if( frameInfo.codectype === 'AAC' &&
						streamData.length < createAviFile.getChunkPayloadSize(frameInfo.type)){
						var dummyData = new Uint8Array(1);
						sendMessageCallback('backup', {'target':'body','data':dummyData});
						dummyData = null;
					}
					audioIdxBuffer = null;
				}
				else {
					return;
				}
				streamData = null;
			}
			if( !isPlayback && createAviFile.getDuration() >= 5*60 ) {
				sendMessageCallback('backupResult', {'errorCode' : 1, 'description' : 'backup'});
				this.endSession();
				return;
			}
		},
		writeAviHeader : function() {
			var idxlen = 8 + file_info.tailSize;
			file_info.file_size = HEADER_BYTES + file_info.pos - 4 + idxlen;
			var aviHeader = createAviFile.makeAviHeader(file_info.file_size, file_info.pos);
			sendMessageCallback('backup', {'target':'mainHeader','data':aviHeader});
			aviHeader = null;
		},
		writeAviTail : function() {
			var tailHeader = createAviFile.makeAviTail(file_info.tailSize);
			sendMessageCallback('backup', {'target':'tailHeader','data':tailHeader});
			tailHeader = null;
		},
		endSession : function() {
			if( file_info === null ) {
				sendMessageCallback('backupResult', {'errorCode' : -3, 'description' : 'backup'});
				return;
			}
			this.convertValidResolution();
			this.writeAviHeader();
			this.writeAviTail();
			sendMessageCallback('backup', {'target':'save', 'data': this.getFileName()});
			sendMessageCallback('terminate');
			console.log("Save called");
			file_info = null;
			createAviFile = null;
		},
		getFileName : function() {
			if( fileName === "" ) {
				return this.makeFileName();
			}
			return fileName;
		},
		setFileName : function(name) {
			fileName = name;
		},
		makeFileName : function() {
			fileName = videoFrame.codectype + " " + videoFrame.width +"x"+videoFrame.height+" "+
				audioFrame.codectype;
			if( audioFrame.codectype === 'G726' ) {
				fileName += '_'+audioFrame.bitrate/1000;
			}
			var dt = new Date();
      fileName+="_"+dt.getFullYear() + "";
      fileName += (dt.getMonth() < 9 ? "0" + (dt.getMonth() +1) : (dt.getMonth() +1)) + "";
      fileName += (dt.getDate() < 10 ? "0" + dt.getDate() : dt.getDate()) + "_";
      fileName += (dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours()) + "";
      fileName += (dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes()) + "";
      fileName += (dt.getSeconds() < 10 ? "0" + dt.getSeconds() : dt.getSeconds());
      		dt = null;
			return fileName;
		},
		convertValidResolution : function() {
			var specialWidth = [192,368,608,1088,1472,1952,3008];
			var target_width = videoFrame.width;
			var target_height = videoFrame.height;
			var isDividedBy16_w = true, isDividedBy16_h = true;
			for(var i in specialWidth){
      			if(target_width === specialWidth[i])
        			isDividedBy16_w = false;
        		if(target_height === specialWidth[i])
        			isDividedBy16_h = false;
    		}
    		if( !isDividedBy16_w) {
    			target_width = target_width - 8;
    		}
    		if( !isDividedBy16_h ) {
    			target_height = target_height - 8;
    		}

    		if( target_width !== videoFrame.width || target_height !== videoFrame.height ) {
    			createAviFile.setResolution(target_width, target_height, videoFrame.framerate);
    		}
		}
	};

	return new Constructor(_sendMessageCallback);
};