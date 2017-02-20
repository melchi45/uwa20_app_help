var VideoHeader = function() {
	"use strict";
	var chunkHeader;
	var dummycount;
	var SIZE_OF_CHUNK_HEADER = 8;
	
	function Constructor() {
	}

  	Constructor.prototype = inheritObject(new AviFormatWriter(), {
	  	/**
	  	* initialize video header
	  	* @function : initHeader
	  	* @param : videoFrame is in BackupSession.js
	  	*/
	    initHeader : function(videoFrame) {
			/* Video stream header */
			var videoHeader = {}, videoFormat = {};
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
			this.setStreamHeader(videoHeader);

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
			this.setStreamFormat(videoFormat);
			},

	    /**
	    * update frame info to avi format
	    * @function : updateInfo
	    */
		updateInfo : function(videoFrame, file_info){
			var videoHeader = this.getStreamHeader();
			if(videoHeader.last_ms === undefined ) {
				videoHeader.last_ms = 0;
			}
			var aviIndexEntry = this.getIndexEntry();
			var size = videoFrame.PESsize;
			if( size % 2 !== 0 ) {
				size += 1;
			}

			if( videoFrame.frameType === 'I' ) {
				aviIndexEntry.flag = 0x10;
			}
			else {
				aviIndexEntry.flag = 0x00;
			}
			aviIndexEntry.chid = '00dc';

			var rate = (1000/videoFrame.framerate).toFixed(1);
			if( typeof rate === 'string'){
				rate *= 1;
			}

			if( file_info.video_init === undefined || file_info.video_init === false ) {
				this.initHeader(videoFrame);
				videoHeader.width = videoFrame.width;
				videoHeader.height = videoFrame.height;
				videoHeader.compressor = videoFrame.codectype;
				file_info.last_ms = videoFrame.src_input_ms;
				// m_backup_end_info = 0;
				file_info.video_init = true;
				file_info.frameCount = 0;
			}
			else {
				// CHECK ERROR CASE ...........
				if( videoHeader.compressor !== videoFrame.codectype ) {
	      			this.setErrorCode(-1); //BACKUP_STATUS.CODEC_CHANGED
					console.error("!!!!Backup Codec CHanged, backup must be stop.....!");
					return null;
				}
				if( videoHeader.width !== videoFrame.width || videoHeader.height !== videoFrame.height ) {
					this.setErrorCode(-2); //BACKUP_STATUS.PROFILE_CHANGED
					console.error("[Video Profile] change stop!!!");
					return null;
				}
			}

			//file_info.last_ms = Math.floor(file_info.last_ms/10)*10;
			var diff = 0;
			if( videoFrame.src_input_ms === 0 || file_info.last_ms === 0 ||
					videoFrame.src_input_ms <= (file_info.last_ms + rate ) ) {
				dummycount = 0;
			} else {
				diff = (videoFrame.src_input_ms - file_info.last_ms - rate ) / rate;
				dummycount = Math.floor(diff);
				
				if(dummycount === 0 && Math.floor((videoFrame.src_input_ms - file_info.last_ms -rate )/(rate/2)) ) {
					dummycount = 1;
				}
				if( diff < 0 ) dummycount = 0;
			}
			//console.log("[", ++count,"][rate : ", rate,"] [videoFrame:", videoFrame.src_input_ms, "] [file_info.last_ms:",file_info.last_ms, "] [dummycount:", dummycount,"] [diff:",diff,"]");
			//console.log(dummycount);
			//console.log(videoFrame.src_input_ms);
			if(dummycount > 200 + 10) {
				console.log("Backup long distance... dummy count:%d, need to reset!", dummycount);
				dummycount = 0;
				file_info.last_ms = 0;
			}
			if( file_info.last_ms === 0 || Math.round(diff) < dummycount || diff < 0 ) {
				videoHeader.last_ms = videoFrame.src_input_ms;
				file_info.last_ms = videoFrame.src_input_ms;
			} else {
				videoHeader.last_ms += (rate*(dummycount+1)).toFixed(1)*1;
				file_info.last_ms += (rate*(dummycount+1)).toFixed(1)*1;
			}
			
			aviIndexEntry.offset = file_info.pos;
			aviIndexEntry.size = 0;
			if( videoHeader.aviLength === undefined ) {
				videoHeader.aviLength = 0;
			}
			
			aviIndexEntry.dummycount = dummycount;
			for (var i = 0; i < dummycount; i ++) {
				videoHeader.aviLength++;
				aviIndexEntry.offset += SIZE_OF_CHUNK_HEADER;
			}
			videoHeader.aviLength++;
			aviIndexEntry.size = size;

			file_info.pos = aviIndexEntry.offset + SIZE_OF_CHUNK_HEADER + size;

			this.chunkHeader.fourcc = "00dc";
			this.chunkHeader.payloadsize = size;
			this.writeChunkHeader(dummycount);
			this.setStreamHeader(videoHeader);
			this.setIndexEntry(aviIndexEntry);
			this.setChunkHeader(this.chunkHeader);
			return this.buffer;
		}
  	});
	return new Constructor();
};