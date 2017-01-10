function VideoBackup() {
	"use strict";

	var aviIndexEntry;
	var chunkHeader;
	var videoHeader;
	var videoFormat;
	var backup_framerate;
	var buffer;
	var size;
	var dummycount;
	var SIZE_OF_CHUNK_HEADER = 8;
	var SIZE_OF_AVI_INDEX_ENTRY = 16;
	var error_case;
	var count = 0;
	
	function Constructor() {
		aviIndexEntry = {};
		chunkHeader = {};
		backup_framerate = 0;
		videoHeader = {};
		videoFormat = {};
		size = 0;
		error_case = 0;
		count = 0;
	};

	var writeInt8 = function(buffer, val) {
		buffer[size]=val;
		size++;
	};

	var writeInt16 = function(buffer, val) {
		writeInt8(buffer,val & 0xFF);
		writeInt8(buffer,val >> 8 );
	};

	var writeInt32 = function(buffer, val) {
		writeInt8(buffer,val & 0xFF);
		writeInt8(buffer,(val >> 8) & 0xFF);
		writeInt8(buffer,(val >> 16) & 0xFF);
		writeInt8(buffer,val >> 24);
	};

	var writeString = function(buffer, str) {
    for( var i=0 ; i< str.length ; i++) {
			buffer[size++] = str.charCodeAt(i);
		}
	};

	function writeChunkHeader(ChunkHeader, dummycount) {
		buffer = new Uint8Array(SIZE_OF_CHUNK_HEADER + SIZE_OF_CHUNK_HEADER*dummycount);
		size = 0;
		for( var i=0 ; i< dummycount ; i++ ) {
			writeString(buffer, ChunkHeader.fourcc);
			writeInt32(buffer, 0);
		}
		writeString(buffer, ChunkHeader.fourcc);
		writeInt32(buffer, ChunkHeader.payloadsize);
	}

	Constructor.prototype = {
		initHeader : function(videoFrame) {
			/* Video stream header */
			videoHeader.aviFourCC = "strh";
			videoHeader.aviBytesCount = 56;
			videoHeader.aviType = "vids";
			videoHeader.aviHandler = videoFrame.codectype;
			videoHeader.aviFlags = 0;
			videoHeader.aviSuggestedBufferSize =Math.floor((videoFrame.width*videoFrame.height)/2);
			videoHeader.aviRight = videoFrame.width;
			videoHeader.aviBottom = videoFrame.height;
			videoHeader.aviScale = 1000;
			videoHeader.aviRate = 1000 * videoFrame.framerate;
			videoHeader.aviQuality = -1;
			videoHeader.aviSampleSize = 0;

			/* Video stream format */
			videoFormat.FourCC = "strf";
			videoFormat.BytesCount = 40;
			videoFormat.Size = 40;
			videoFormat.Width = videoFrame.width;
			videoFormat.Height = videoFrame.height;
			videoFormat.Planes = 1;
			videoFormat.BitCount = 24;
			videoFormat.SizeImage = (videoFrame.width * videoFrame.height * videoFrame.framerate);
			videoFormat.Compression = videoHeader.aviHandler;
		},
		updateInfo : function(videoFrame, file_info, frameType, isPlayback){
			var size = videoFrame.PESsize;
			if( size % 2 !== 0 ) {
				size += 1;
			}

			if( frameType === 'I' ) {
				aviIndexEntry.flag = 0x10;
			}
			else {
				aviIndexEntry.flag = 0x00;
			}
			aviIndexEntry.chid = '00dc';

			var rate = (1000/videoFrame.framerate).toFixed(1);

			if( file_info.video_init === undefined || file_info.video_init === false ) {
				this.initHeader(videoFrame);
				videoHeader.width = videoFrame.width;
				videoHeader.height = videoFrame.height;
				videoHeader.compressor = videoFrame.codectype;
				file_info.last_ms = videoFrame.src_input_ms;
				backup_framerate = videoFrame.framerate;
				// m_backup_end_info = 0;
				file_info.video_init = true;
				file_info.frameCount = 0;
			}
			else {
				// CHECK ERROR CASE ...........
				if( videoHeader.compressor !== videoFrame.codectype ) {
					error_case = -1;//BACKUP_STATUS.CODEC_CHANGED
					console.log("!!!!Backup Codec CHanged, backup must be stop.....!");
					return null;
				}
				if( videoHeader.width !== videoFrame.width || videoHeader.height !== videoFrame.height ) {
					error_case = -2;//BACKUP_STATUS.PROFILE_CHANGED
					console.log("[Video Profile] change stop!!!");
					return null;
				}
			}

			//file_info.last_ms = Math.floor(file_info.last_ms/10)*10;
			var diff = 0;
			if( videoFrame.src_input_ms === 0 || file_info.last_ms === 0 ||
					videoFrame.src_input_ms <= (file_info.last_ms + rate ) )
			{
				dummycount = 0;
			}
			else
			{
				diff = (videoFrame.src_input_ms - file_info.last_ms - rate ) / rate;
				dummycount = Math.floor(diff);
				
				if(dummycount === 0 && Math.floor((videoFrame.src_input_ms - file_info.last_ms -rate )/(rate/2)) )
				{
					dummycount = 1;
				}
				if( diff < 0 ) dummycount = 0;
			}
			//console.log("[", ++count,"][rate : ", rate,"] [videoFrame:", videoFrame.src_input_ms, "] [file_info.last_ms:",file_info.last_ms, "] [dummycount:", dummycount,"] [diff:",diff,"]");
			//console.log(dummycount);
			//console.log(videoFrame.src_input_ms);
			if(dummycount > 200 + 10)
			{
				console.log("Backup long distance... dummy count:%d, need to reset!", dummycount);
				dummycount = 0;
				file_info.last_ms = 0;
			}
			if( file_info.last_ms === 0 || Math.round(diff) < dummycount || diff < 0 ) {
				videoHeader.last_ms = videoFrame.src_input_ms;
				file_info.last_ms = videoFrame.src_input_ms;
			}
			else {
				videoHeader.last_ms += (rate*(dummycount+1)).toFixed(1)*1;
				file_info.last_ms += (rate*(dummycount+1)).toFixed(1)*1;
			}
			
			aviIndexEntry.offset = file_info.pos;
			aviIndexEntry.size = 0;
			if( videoHeader.aviLength === undefined ) {
				videoHeader.aviLength = 0;
			}
			
			aviIndexEntry.dummycount = dummycount;
			for (var i = 0; i < dummycount; i ++)
			{
				videoHeader.aviLength++;
				aviIndexEntry.offset += SIZE_OF_CHUNK_HEADER;
			}
			videoHeader.aviLength++;
			aviIndexEntry.size = size;

			file_info.pos = aviIndexEntry.offset + SIZE_OF_CHUNK_HEADER + size;

			chunkHeader.fourcc = "00dc";
			chunkHeader.payloadsize = size;
			writeChunkHeader(chunkHeader, dummycount);
			return buffer;
		},
		getTotalFrames : function() {
			return videoHeader.aviLength;
		},
		getVideoHeader : function() {
			return videoHeader;
		},
		getVideoFormat : function() {
			return videoFormat;
		},
		getIndexEntry : function() {
			return aviIndexEntry;
		},
		getChunkPayloadSize : function() {
			return chunkHeader.payloadsize;
		},
		getErrorCode : function() {
			return error_case;
		},
		getDuration : function() {
			var fps = videoHeader.aviRate/1000;
			return (videoHeader.aviLength/fps);
		},
		getIdxBuffer : function() {
			var IdxBufferSize = SIZE_OF_AVI_INDEX_ENTRY * (1+aviIndexEntry.dummycount);
			var idxBuffer = new Uint8Array(IdxBufferSize);
			size = 0;
			for( var i=aviIndexEntry.dummycount ; i> 0 ; i-- ) {
				writeString(idxBuffer, aviIndexEntry.chid);
				writeInt32(idxBuffer, aviIndexEntry.flag);
				writeInt32(idxBuffer, aviIndexEntry.offset - SIZE_OF_CHUNK_HEADER*dummycount);
				writeInt32(idxBuffer, 0);
			}
			writeString(idxBuffer, aviIndexEntry.chid);
			writeInt32(idxBuffer, aviIndexEntry.flag);
			writeInt32(idxBuffer, aviIndexEntry.offset);
			writeInt32(idxBuffer, aviIndexEntry.size);
			return idxBuffer;
		},
		setResolution : function(w,h,fps) {
			videoHeader.aviRight = videoHeader.width = w;
			videoHeader.aviBottom = videoHeader.height = h;
			videoHeader.aviSuggestedBufferSize =Math.floor((w*h)/2);

			videoFormat.Width = w;
			videoFormat.Height = h;
			videoFormat.SizeImage = (w * h * fps);
		}

	};
	return new Constructor();
};