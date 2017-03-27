function AudioBackup() {
	"use strict";

	var AviIndexEntry;
	var AviVideoHeader;

	var videoHeader;
	var backup_framerate;

    var aviIndexEntry;
    var chunkHeader;
	var audioHeader;
	var audioFormat;
    var SIZE_OF_CHUNK_HEADER = 8;
    var SIZE_OF_AVI_INDEX_ENTRY = 16;

	var SIZE_OF_WAVE_FORMAT = 40;
    var SIZE_OF_STREAM_HEADER = 64;
	var MEDIASUBTYPE_RAW_AAC1 = 0x00FF;
	var AAC_PER_SAMPLE = 1024;
	var AAC_FORMAT_SIZE = 2;
	var AAC_BUF_SIZE = 8192;
  var BIAS   =  0x84,
  SIGN_BIT  =  0x80, /* Sign bit for a A-law byte. */
  QUANT_MASK = 0xf,  /* Quantization field mask. */
  NSEGS    =   8,   /* Number of A-law segments. */
  SEG_SHIFT =  4,   /* Left shift for segment number. */
  SEG_MASK  =  0x70;  /* Segment field mask. */

  var WAVE_FORMAT_MULAW = 0x0007;

  var AUDIO_G711 = 0;
  var AUDIO_G726 = 1;
  var AUDIO_AAC = 2;

  var buffer;
  var size;

  var decoding_stream = null;
  var decoding_stream_size = 0;
  var error_case;
	
	function Constructor() {
		audioHeader = {};
		audioFormat = {};
    aviIndexEntry = {};
    chunkHeader = {};
    size = 0;
		backup_framerate = 0;
    error_case = 0;
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

  function writeChunkHeader(ChunkHeader) {
    buffer = new Uint8Array(SIZE_OF_CHUNK_HEADER);
    size = 0;
    writeString(buffer, ChunkHeader.fourcc);
    writeInt32(buffer, ChunkHeader.payloadsize);
  }

  function makeAudioConfig(samplerate, channels) {
    //AAC supported maximum 48kbps.

    // .....001 1....... = 48000
    // .....010 0....... = 44100
    // .....010 1....... = 32000
    // .....011 0....... = 24000
    // .....100 0....... = 16000
    // .....101 1....... =  8000

    // ........ .000 1... = 1 channel
    // ........ .001 0... = 2 channels
    // ........ .001 1... = 3 channels
    // ........ .010 0... = 4 channels
    // ........ .010 1... = 5 channels
    // ........ .011 0... = 6 channels
    // ........ .011 1... = 8 channels
    var bitcnt = 0;

    switch (samplerate) {
        case 48000: bitcnt |= 0x8001; break;
        case 44100: bitcnt |= 0x0002; break;
        case 32000: bitcnt |= 0x8002; break;
        case 24000: bitcnt |= 0x0003; break;
        case 16000: bitcnt |= 0x0004; break;
        case  8000: bitcnt |= 0x8005; break;
        default:
            return 0;
    }

    switch (channels) {
        case 1: bitcnt |= 0x0800; break;
        case 2: bitcnt |= 0x1000; break;
        case 3: bitcnt |= 0x1800; break;
        case 4: bitcnt |= 0x2000; break;
        case 5: bitcnt |= 0x2800; break;
        case 6: bitcnt |= 0x3000; break;
        case 8: bitcnt |= 0x3800; break;
        default:
            return 0;
    }
    //0x0010 : AAC-LC
    return (bitcnt | 0x0010);
  }

	Constructor.prototype = {
    initHeader : function() {
      audioHeader.aviFourCC = "strh";
      audioHeader.aviBytesCount = SIZE_OF_STREAM_HEADER-8;
      audioHeader.aviQuality = -1;
      audioHeader.aviType="";
      audioHeader.aviFlags = 0;
      audioHeader.aviInitialFrames = 0;
      audioHeader.aviHandler="";
      audioHeader.aviScale = 0;
      audioHeader.aviRate = 0;
      audioHeader.aviSuggestedBufferSize = 0;
      audioHeader.aviLength = 0;
      audioHeader.aviSampleSize = 0;

      audioFormat.FourCC = "strf";
      audioFormat.BytesCount = SIZE_OF_WAVE_FORMAT - 8;
      audioFormat.Channels = 1;
      audioFormat.FormatTag = 0;
      audioFormat.SamplesPerSec = 0;
      audioFormat.AvgBytesPerSec = 0;
      audioFormat.BitsPerSample = 0;
      audioFormat.BlockAlign = 0;
      audioFormat.Size = 0;
      audioFormat.AudioConfig = 0;
    },
    checkAudioFrameInfo : function(audioFrame, file_info ) {
      if( file_info.audio_init === undefined || file_info.audio_init === false ) {
        if( audioFrame.codectype === 'AAC' ) {
          this.settingAAC(audioFrame, file_info);
        }
        else if(audioFrame.codectype === 'G711') {
          this.settingG711(audioFrame, file_info);
        }
        else if( audioFrame.codectype ==='G726') {
          this.settingG726(audioFrame, file_info);
        }
        file_info.audio_init = true;
        file_info.audio_strn = 0;
        file_info.audio_bytes = 0;
        file_info.codectype = audioFrame.codectype;
        file_info.bitrate = audioFrame.bitrate;
        file_info.sampling_rate = audioFrame.audio_samplingrate;
        return 0;
      }
      else {
        if( file_info.codectype !== audioFrame.codectype ) {
          return -1;
        }
        if( file_info.bitrate !== audioFrame.bitrate ) {
          return -1;
        }
        if( file_info.sampling_rate !== audioFrame.audio_samplingrate ) {
          return -1;
        }
      }
      return 0;
    },
    settingAAC : function(audioFrame, file_info) {
      audioHeader.aviQuality = 0;
      audioHeader.aviType = "auds";
      audioHeader.aviFlags = 1;
      audioHeader.aviInitialFrames = 0;
      audioHeader.aviScale = AAC_PER_SAMPLE;
      audioHeader.aviRate = audioFrame.audio_samplingrate;
      audioHeader.aviSuggestedBufferSize = AAC_BUF_SIZE;

      var audioConfiguration = makeAudioConfig(audioFrame.audio_samplingrate, 1);
      audioFormat.FormatTag = MEDIASUBTYPE_RAW_AAC1;
      audioFormat.SamplesPerSec = audioFrame.audio_samplingrate;
      audioFormat.AvgBytesPerSec = audioFormat.Channels*(audioFrame.bitrate/8);
      audioFormat.BitsPerSample = 16;
      audioFormat.BlockAlign = AAC_PER_SAMPLE;
      audioFormat.Size = AAC_FORMAT_SIZE;
      audioFormat.AudioConfig = audioConfiguration;
    },
    settingG711 : function(audioFrame, file_info) {
      audioHeader.aviQuality = 0;
      audioHeader.aviType = "auds";
      audioHeader.aviScale = 1;
      audioHeader.aviRate = 8000;
      audioHeader.aviSuggestedBufferSize = 8000;
      
      audioFormat.FormatTag = WAVE_FORMAT_MULAW;
      audioFormat.SamplesPerSec = 8000;
      audioFormat.AvgBytesPerSec = 8000;
      audioFormat.BitsPerSample = 8;
      audioFormat.BlockAlign = 1;

      audioHeader.aviSampleSize = this.avi_sampsize();
    },
    settingG726 : function(audioFrame, file_info) {
      audioHeader.aviType = "auds";
      audioHeader.aviScale = 1;
      audioHeader.aviSampleSize = 2;
      if( audioFrame.bitrate === 16000 ) {
        audioFormat.AvgBytesPerSec = audioHeader.aviRate = 2000;
        audioFormat.BitsPerSample = 2 ;
      }
      else if( audioFrame.bitrate === 24000 ) {
        audioFormat.AvgBytesPerSec = audioHeader.aviRate = 3000;
        audioFormat.BitsPerSample = 3;
      }
      else if(audioFrame.bitrate === 32000 ) {
        audioFormat.AvgBytesPerSec = audioHeader.aviRate = 4000;
        audioFormat.BitsPerSample = 4;
      }
      else if(audioFrame.bitrate === 40000 ) {
        audioFormat.AvgBytesPerSec = audioHeader.aviRate = 5000;
        audioFormat.BitsPerSample = 5;
      }
      audioFormat.FormatTag = 0x0045;
      audioFormat.aviSuggestedBufferSize = audioHeader.aviRate; 
      audioFormat.SamplesPerSec = 8000;
      audioFormat.BlockAlign = 1;
      
    },
		updateInfo : function(audioFrame, file_info, streamData){
			var size = audioFrame.PESsize;
      if( size % 2 !== 0 ) {
          size += 1;
      }
      var decodingSize = 0;
      aviIndexEntry.flag = 0x10;
      aviIndexEntry.chid = '01wb';
      if( this.checkAudioFrameInfo(audioFrame, file_info) !== 0 ){
        error_case = -1;
        console.log("check Audio Frame info failed!!!!!");
        return null;
      }
      decoding_stream = streamData;
      decoding_stream_size = size;
      decodingSize = decoding_stream_size;
      if( audioFrame.codectype === 'AAC' ) {
        this.settingAAC(audioFrame, file_info);
        audioHeader.aviLength = ++file_info.audio_strn;
        
      } else if( audioFrame.codectype === 'G711' || audioFrame.codectype === 'G726') {
        if( audioFrame.codectype === 'G711') {
          this.settingG711(audioFrame, file_info);
        }
        else {
          this.settingG726(audioFrame, file_info);
        } 
        file_info.audio_bytes += decodingSize;
        audioHeader.aviLength =  file_info.audio_bytes / this.avi_sampsize();
      }

      aviIndexEntry.offset = file_info.pos;
      aviIndexEntry.size = decoding_stream_size;
      aviIndexEntry.dummycount = 0;

      file_info.pos = aviIndexEntry.offset + SIZE_OF_CHUNK_HEADER + decoding_stream_size;
      chunkHeader.fourcc = aviIndexEntry.chid;
      chunkHeader.payloadsize = decoding_stream_size;
      writeChunkHeader(chunkHeader);
      return buffer;
    },
    avi_sampsize : function() {
      var s = Math.floor( ( audioFormat.BitsPerSample + 7 ) /8 ) * audioFormat.Channels;
      if( s === 0 ) {
        s = 1;
      }
      return s;
    },
		getAudioHeader : function() {
			return audioHeader;
		},
		getAudioFormat : function() {
			return audioFormat;
		},
    getIndexEntry : function() {
      return aviIndexEntry;
    },
    getChunkPayloadSize : function() {
      return chunkHeader.payloadsize;
    },
    getDecodingStream : function() {
      return decoding_stream;
    },
    getErrorCode : function() {
      return error_case;
    },
    getIdxBuffer : function() {
      var idxBuffer = new Uint8Array(SIZE_OF_AVI_INDEX_ENTRY);
      size = 0;
      writeString(idxBuffer, aviIndexEntry.chid);
      writeInt32(idxBuffer, aviIndexEntry.flag);
      writeInt32(idxBuffer, aviIndexEntry.offset);
      writeInt32(idxBuffer, aviIndexEntry.size);
      return idxBuffer;     
    }
	};
	return new Constructor();
};