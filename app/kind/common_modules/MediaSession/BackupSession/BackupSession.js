var BackupSession = function(_sendMessageCallback) {
	'use strict';
	var mainHeader;
	var file_info;
	var SIZE_OF_AVI_MAIN_HEADER = 64;
	var SIZE_OF_STREAM_HEADER = 64;
	var SIZE_OF_BITMAP_INFO = 48;
	var SIZE_OF_WAVE_FORMAT = 40;

	var HEADER_BYTES = 2048;
	var sendMessageCallback;
	function Constructor(_sendMessageCallback){
		mainHeader = {};
		file_info = null;
		sendMessageCallback = _sendMessageCallback;
		this.init();
	};

	var aviHeader = null;
	
	var WAVE_FORMAT_MULAW = 0x0007;
	
	var AVIF_WASCAPTUREFILE = 0x00010000;
	var AVIF_HASINDEX = 0x00000010;

	var videoFrame = {};
	var audioFrame = {};

	var isVideo = false,
			isAudio = false;

	var datatype;

	var videoHeader,
			videoFormat,
			buffer;
	
	var size;
	var is_audio_init = true;
	var is_video_init = true;
	var G7XX_SAMPLING_RATE = 8*1000;
	var AAC_SAMPLING_RATE = 16*1000;
	var G711_BITRATE = 64*1000;
	var AAC_BITRATE = 48*1000;

	var videoBackup;
	var audioBackup;
	var fileName = "";
	var isPlayback = true;

	var writeInt8 = function(val) {
		buffer[size]=val;
		size++;
	};

	var writeInt16 = function(val) {
		writeInt8(val & 0xFF);
		writeInt8( val >> 8 );
	};

	var writeInt32 = function(val) {
		writeInt8(val & 0xFF);
		writeInt8((val >> 8) & 0xFF);
		writeInt8((val >> 16) & 0xFF);
		writeInt8(val >> 24);
	};

	var writeString = function(str) {
		if( str === "" ) {
			size += 4;
		}
    for( var i=0 ; i< str.length ; i++) {
			buffer[size++] = str.charCodeAt(i);
		}
	};

	var writeMainHeader = function(mainHeader) {
		writeString(mainHeader.aviFourCC);
		writeInt32(mainHeader.aviBytesCount);
		writeInt32(mainHeader.aviMicroSecPerFrame);
		writeInt32(mainHeader.aviMaxBytesPerSec);
		writeInt32(mainHeader.aviPaddingGranularity);
		writeInt32(mainHeader.aviFlags);
		writeInt32(mainHeader.aviTotalFrames);
		writeInt32(0); //aviInitialFrames
		writeInt32(mainHeader.aviStreams);
		writeInt32(mainHeader.aviSuggestedBufferSize);
		writeInt32(mainHeader.aviWidth);
		writeInt32(mainHeader.aviHeight);
		writeInt32(0);
		writeInt32(0);
		writeInt32(0);
		writeInt32(0);
	};

	var writeStreamHeader = function(streamHeader) {
		writeString(streamHeader.aviFourCC);
		writeInt32(streamHeader.aviBytesCount);
		writeString(streamHeader.aviType);
		writeString(streamHeader.aviHandler);
		writeInt32(streamHeader.aviFlags);
		writeInt16(0);//aviPriority
		writeInt16(0);//aviLanguage
		writeInt32(0);//aviInitialFrames
		writeInt32(streamHeader.aviScale);
		writeInt32(streamHeader.aviRate);
		writeInt32(0);//aviStart
		writeInt32(streamHeader.aviLength);
		writeInt32(streamHeader.aviSuggestedBufferSize); //aviSuggestedBufferSize
		writeInt32(streamHeader.aviQuality);
		writeInt32(streamHeader.aviSampleSize);
		writeInt16(0);//0
		writeInt16(0);//0
		writeInt16(0);//0
		writeInt16(0);//0
	};

	var writeBitmapInfo = function(bitmapInfo) {
		writeString(bitmapInfo.FourCC);
		writeInt32(bitmapInfo.BytesCount);
		writeInt32(bitmapInfo.Size);
		writeInt32(bitmapInfo.Width);
		writeInt32(bitmapInfo.Height);
		writeInt16(bitmapInfo.Planes);
		writeInt16(bitmapInfo.BitCount);
		writeString(bitmapInfo.Compression);
		writeInt32(bitmapInfo.SizeImage);
		writeInt32(0);  //XPelsPerMeter
		writeInt32(0);	//YPelsPerMeter
		writeInt32(0);	//ClrUsed
		writeInt32(0);	//ClrImportant
	};

	var writeWaveFormatEx = function(waveFormatEx)
	{
		writeString(waveFormatEx.FourCC);
		writeInt32(waveFormatEx.BytesCount);
		writeInt16(waveFormatEx.FormatTag);
		writeInt16(waveFormatEx.Channels);
		writeInt32(waveFormatEx.SamplesPerSec);
		writeInt32(waveFormatEx.AvgBytesPerSec);
		writeInt16(waveFormatEx.BlockAlign);
		writeInt16(waveFormatEx.BitsPerSample);
		writeInt16(waveFormatEx.Size);
		writeInt16(waveFormatEx.AudioConfig);
		writeInt16(0);//Id
		writeInt32(0);//Flags
		writeInt16(0);//BlockSize
		writeInt16(0);//FramesPerBlock
		writeInt16(0);//CodecDelay
	};

	var getbuffersize = function() {
		if( !isVideo ) {
			return 128*1024;
		}
		return (videoFrame.width * videoFrame.height)/2;
	};

	Constructor.prototype = {
		init : function() {
			aviHeader = {};
			aviHeader.pos = 4;

			is_video_init = true;
			is_audio_init = true;
			isPlayback = false;
			
			videoBackup = new VideoBackup();
			audioBackup = new AudioBackup();

			fileName = "";
		},
		initAviHeader : function() {

		/* AVI main header */
			mainHeader = {};
			mainHeader.aviFourCC = "avih";
			mainHeader.aviBytesCount = 56;
			mainHeader.aviMicroSecPerFrame = 1000000 / videoFrame.framerate;
			mainHeader.aviMaxBytesPerSec = 0;
			mainHeader.aviPaddingGranularity = 0;
			var flag = AVIF_WASCAPTUREFILE | AVIF_HASINDEX;
			mainHeader.aviFlags = flag;
			mainHeader.aviStreams = 2;
			mainHeader.aviWidth = videoFrame.width;
			mainHeader.aviHeight = videoFrame.height;
			mainHeader.aviSuggestedBufferSize = getbuffersize();
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
		sendData : function(frameInfo, streamData) {
			var header;
			var size = 0, dummycount = 0;
			var needToAddDummy = false;
			if( frameInfo.type === 'video' ) {
				if( file_info === null && frameInfo.frameType !== 'I') return;
				this.setVideoFrameInfo(frameInfo);
				header = videoBackup.updateInfo(videoFrame, file_info, frameInfo.frameType);
				if( header === null ) {
					var error_code = videoBackup.getErrorCode();
					if( error_code < 0 ) {
						sendMessageCallback('backupResult', {'errorCode' : error_code, 'description' : 'backup'});
						this.endSession();
						return;
					}
				}
				if( streamData.length < videoBackup.getChunkPayloadSize()){
					needToAddDummy = true;
				}
				if( this.checkMaxSize() === false ) {
					if( videoBackup === null ) {return;}
					var videoIdxBuffer = videoBackup.getIdxBuffer();
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
				header = audioBackup.updateInfo(audioFrame, file_info, streamData, isPlayback);
				if( header === null ) {
					var error_code = audioBackup.getErrorCode();
					if( error_code < 0 ) {
						sendMessageCallback('backupResult', {'errorCode' : error_code, 'description' : 'backup'});
						this.endSession();
						return;
					}
				}
				if( this.checkMaxSize() === false ) {
					if( audioBackup === null ) {return;}
					var audioIdxBuffer = audioBackup.getIdxBuffer();
					sendMessageCallback('backup', {'target':'tailBody','data':audioIdxBuffer});
					file_info.tailSize += audioIdxBuffer.length;

					sendMessageCallback('backup', {'target':'body','data':header});
					var decodingStreamData = audioBackup.getDecodingStream();
					sendMessageCallback('backup', {'target':'body','data':decodingStreamData});
					if( frameInfo.codectype === 'AAC' &&
						streamData.length < audioBackup.getChunkPayloadSize()){
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
			if( !isPlayback && videoBackup.getDuration() >= 5*60 ) {
				sendMessageCallback('backupResult', {'errorCode' : 1, 'description' : 'backup'});
				this.endSession();
				return;
			}
		},
		setVideoFrameInfo : function(data) {
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
				this.initAviHeader();
				audioBackup.initHeader();
				sendMessageCallback('backupResult', {'errorCode' : 0, 'description' : 'backup'});
			}
			data = null;
		},
		setAudioFrameInfo : function(data) {
			audioFrame.codectype = data.codectype;
			if( data.codectype === 'G711' ) {
				audioFrame.audio_samplingrate = G7XX_SAMPLING_RATE;
				audioFrame.bitrate = G711_BITRATE;
			}
			else if( data.codectype === 'AAC' ) {
				audioFrame.audio_samplingrate = AAC_SAMPLING_RATE;
				audioFrame.bitrate = AAC_BITRATE;
			}
			else if( data.codectype === 'G726') {
				audioFrame.bitrate = data.bitrate*1000;
				audioFrame.audio_samplingrate = G7XX_SAMPLING_RATE;
			}
			audioFrame.PESsize = data.PESsize;
			if( file_info === null ) {
				file_info = {};
				file_info.pos = 4;
				file_info.tailSize = 0;
				this.initAviHeader();
				audioBackup.initHeader();
				sendMessageCallback('backupResult', {'errorCode' : 0, 'description' : 'backup'});
			}
			data = null;
		},
		writeAviHeader : function() {
			var idxlen = 8 + file_info.tailSize;
			file_info.file_size = HEADER_BYTES + file_info.pos - 4 + idxlen;
			size = 0;
			buffer = new Uint8Array(2048);
			var hdrlBytes = 4 + SIZE_OF_AVI_MAIN_HEADER+ 2 * (12 + SIZE_OF_STREAM_HEADER)	
			+ SIZE_OF_BITMAP_INFO + SIZE_OF_WAVE_FORMAT;
			mainHeader.aviTotalFrames = videoBackup.getTotalFrames();
			writeString("RIFF");
			writeInt32(file_info.file_size - 8);
			writeString("AVI ");///Be very carefull with this;

			writeString("LIST"); //top list
			writeInt32(hdrlBytes);
			writeString("hdrl");
			writeMainHeader(mainHeader);

			writeString("LIST"); //video list
			writeInt32(4 + 64 + 48);
			writeString("strl");
			writeStreamHeader(videoBackup.getVideoHeader());
			writeBitmapInfo(videoBackup.getVideoFormat());
			
			writeString("LIST");  //Audio list
			writeInt32(4+ SIZE_OF_STREAM_HEADER + SIZE_OF_WAVE_FORMAT );
			writeString("strl");
			writeStreamHeader(audioBackup.getAudioHeader());
			writeWaveFormatEx(audioBackup.getAudioFormat());

			writeString("JUNK");
			var njunk = HEADER_BYTES - size -4 -12;
			writeInt32(njunk);
			for (var i = 0; i < njunk; i++){
				writeInt8(0);
			}
			writeString( "LIST" );
			writeInt32(file_info.pos); //writeInt32(4);
			writeString("movi" );
			sendMessageCallback('backup', {'target':'mainHeader','data':buffer});
			buffer = null;
			size = 0;
		},
		writeAviTail : function() {
			buffer = new Uint8Array(8);
			size = 0;
			writeString("idx1");
			writeInt32(file_info.tailSize);
			sendMessageCallback('backup', {'target':'tailHeader','data':buffer});
			buffer = null;
			size = 0;
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
			videoBackup = null;
			audioBackup = null;
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
    			videoBackup.setResolution(target_width, target_height, videoFrame.framerate);
    		}
		},
	}

	return new Constructor(_sendMessageCallback);
};