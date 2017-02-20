"use strict";

/**
* Parent class for videoBackup & audioBackup
*/
function AviFormatWriter() {
  function Constructor(){
    this.bufferIndex = 0;
    this.errorCase = 0;
    this.buffer = [];
    this.aviHeader = {};
    this.mainHeader = {};
    this.streamHeader = {};
    this.streamFormat = {};
    this.aviIndexEntry = {};
    this.chunkHeader = {};
    this.aviHeader.pos = 4;
  }

  var HEADER_BYTES = 2048;
  var SIZE_OF_CHUNK_HEADER = 8;
  var SIZE_OF_AVI_INDEX_ENTRY = 16;
  var AVIF_WASCAPTUREFILE = 0x00010000;
  var AVIF_HASINDEX = 0x00000010;
  var SIZE_OF_AVI_MAIN_HEADER = 64;
  var SIZE_OF_STREAM_HEADER = 64;
  var SIZE_OF_BITMAP_INFO = 48;
  var SIZE_OF_WAVE_FORMAT = 40;
  var WAVE_FORMAT_MULAW = 0x0007;

  Constructor.prototype = {
    /**
    * @function : setBuffer
    * @param : _buffer is new Array
    */
    setBuffer : function(_buffer) {
      this.buffer = _buffer;
      this.bufferIndex = 0;
    },
    /**
    * write Int8 data
    * @function : writeInt8
    * @param : val is a data for writing
    */
    writeInt8 : function(val) {
      this.buffer[this.bufferIndex] = val;
      this.bufferIndex++;
    },
    /**
    * write Int16 data
    * @function : writeInit16
    * @param : val is a data for writing
    */
    writeInt16 : function(val) {
      this.writeInt8(val & 0xFF);
      this.writeInt8(val >> 8 );
    },
    /**
    * write Int32 data
    * @function : writeInt32
    * @param : val is a data for writing
    */
    writeInt32 : function(val) {
      this.writeInt8(val & 0xFF);
      this.writeInt8((val >> 8) & 0xFF);
      this.writeInt8((val >> 16) & 0xFF);
      this.writeInt8(val >> 24);
    },
    /**
    * write string data
    * @function : writeString
    * @param : str is a data for writing
    */
    writeString : function(str) {
      if( str === "" ) {
        this.bufferIndex += 4;
      }
      for( var i=0 ; i< str.length ; i++) {
        this.buffer[this.bufferIndex++] = str.charCodeAt(i);
      }
    },
    /**
    * write chunk Header to buffer
    * @function : writeString
    * @param : str is a data for writing
    */
    writeChunkHeader : function(dummyCount) {
      if( dummyCount === undefined || dummyCount === null ) {
        dummyCount = 0;
      }
      this.setBuffer(new Uint8Array(SIZE_OF_CHUNK_HEADER + SIZE_OF_CHUNK_HEADER*dummyCount));
      for( var i=0 ; i< dummyCount ; i++ ) {
        this.writeString(this.chunkHeader.fourcc);
        this.writeInt32(0);
      }
      this.writeString(this.chunkHeader.fourcc);
      this.writeInt32(this.chunkHeader.payloadsize);
    },
    /**
    * initialize avi main Header
    * @function : initMainHeader
    */
    initMainHeader : function(frameInfo) {
      //AVI main header
      this.mainHeader.aviFourCC = "avih";
      this.mainHeader.aviBytesCount = 56;
      this.mainHeader.aviMicroSecPerFrame = 1000000 / frameInfo.framerate;
      this.mainHeader.aviMaxBytesPerSec = 0;
      this.mainHeader.aviPaddingGranularity = 0;
      var flag = AVIF_WASCAPTUREFILE | AVIF_HASINDEX;
      this.mainHeader.aviFlags = flag;
      this.mainHeader.aviStreams = 2;
      this.mainHeader.aviWidth = frameInfo.width;
      this.mainHeader.aviHeight = frameInfo.height;
      this.mainHeader.aviSuggestedBufferSize = 128*1024;
    },
    updateInfo : function(frameInfo, fileInfo, streamData) {},
    /**
    * @function : getStreamHeader
    * @return : streamHeader
    */
    getStreamHeader : function() {
      return this.streamHeader;
    },
    /**
    * @function : setStreamHeader
    */
    setStreamHeader : function(streamHeader) {
      this.streamHeader = streamHeader;
    },
    /**
    * @function : getStreamFormat
    * @return : streamFormat
    */    
    getStreamFormat : function() {
      return this.streamFormat;
    },
    /**
    * @function : setStreamFormat
    */
    setStreamFormat : function(streamFormat) {
      this.streamFormat = streamFormat;
    },
    /**
    * @function : appendBuffer
    */
    appendBuffer : function(buffer) {
      this.buffer.set(buffer, this.bufferIndex);
      this.bufferIndex += buffer.length;
    },
    /**
    * make index buffer & return it
    * @function : getIndexBuffer
    */
    getIndexBuffer : function() {
      this.setBuffer(new Uint8Array(SIZE_OF_AVI_INDEX_ENTRY * (1+this.aviIndexEntry.dummycount)));
      for( var i=this.aviIndexEntry.dummycount ; i> 0 ; i-- ) {
        this.writeString(this.aviIndexEntry.chid);
        this.writeInt32(this.aviIndexEntry.flag);
        this.writeInt32(this.aviIndexEntry.offset - SIZE_OF_CHUNK_HEADER*this.aviIndexEntry.dummycount);
        this.writeInt32(0);
      }
      this.writeString(this.aviIndexEntry.chid);
      this.writeInt32(this.aviIndexEntry.flag);
      this.writeInt32(this.aviIndexEntry.offset);
      this.writeInt32(this.aviIndexEntry.size); 
      return this.buffer;
    },

    /**
    * write Avi Main Header
    * @function : writeMainHeader
    */
    writeMainHeader : function() {
      this.writeString(this.mainHeader.aviFourCC);
      this.writeInt32(this.mainHeader.aviBytesCount);
      this.writeInt32(this.mainHeader.aviMicroSecPerFrame);
      this.writeInt32(this.mainHeader.aviMaxBytesPerSec);
      this.writeInt32(this.mainHeader.aviPaddingGranularity);
      this.writeInt32(this.mainHeader.aviFlags);
      this.writeInt32(this.mainHeader.aviTotalFrames);
      this.writeInt32(0); //aviInitialFrames
      this.writeInt32(this.mainHeader.aviStreams);
      this.writeInt32(this.mainHeader.aviSuggestedBufferSize);
      this.writeInt32(this.mainHeader.aviWidth);
      this.writeInt32(this.mainHeader.aviHeight);
      this.writeInt32(0);
      this.writeInt32(0);
      this.writeInt32(0);
      this.writeInt32(0);
    },
    /**
    * Write Stream Header
    * @function : writeStreamHeader
    */
    writeStreamHeader : function() {
      this.writeString(this.streamHeader.aviFourCC);
      this.writeInt32(this.streamHeader.aviBytesCount);
      this.writeString(this.streamHeader.aviType);
      this.writeString(this.streamHeader.aviHandler);
      this.writeInt32(this.streamHeader.aviFlags);
      this.writeInt16(0);//aviPriority
      this.writeInt16(0);//aviLanguage
      this.writeInt32(0);//aviInitialFrames
      this.writeInt32(this.streamHeader.aviScale);
      this.writeInt32(this.streamHeader.aviRate);
      this.writeInt32(0);//aviStart
      this.writeInt32(this.streamHeader.aviLength);
      this.writeInt32(this.streamHeader.aviSuggestedBufferSize); //aviSuggestedBufferSize
      this.writeInt32(this.streamHeader.aviQuality);
      this.writeInt32(this.streamHeader.aviSampleSize);
      this.writeInt16(0);//0
      this.writeInt16(0);//0
      this.writeInt16(0);//0
      this.writeInt16(0);//0      
    },
    /**
    * @function : writeBitmapInfo
    */
    writeBitmapInfo : function() {
      this.writeString(this.streamFormat.FourCC);
      this.writeInt32(this.streamFormat.BytesCount);
      this.writeInt32(this.streamFormat.Size);
      this.writeInt32(this.streamFormat.Width);
      this.writeInt32(this.streamFormat.Height);
      this.writeInt16(this.streamFormat.Planes);
      this.writeInt16(this.streamFormat.BitCount);
      this.writeString(this.streamFormat.Compression);
      this.writeInt32(this.streamFormat.SizeImage);
      this.writeInt32(0);  //XPelsPerMeter
      this.writeInt32(0);  //YPelsPerMeter
      this.writeInt32(0);  //ClrUsed
      this.writeInt32(0);  //ClrImportant
    },
    /**
    * @function : writeWaveFormatEx
    */ 
    writeWaveFormatEx : function() {
      this.writeString(this.streamFormat.FourCC);
      this.writeInt32(this.streamFormat.BytesCount);
      this.writeInt16(this.streamFormat.FormatTag);
      this.writeInt16(this.streamFormat.Channels);
      this.writeInt32(this.streamFormat.SamplesPerSec);
      this.writeInt32(this.streamFormat.AvgBytesPerSec);
      this.writeInt16(this.streamFormat.BlockAlign);
      this.writeInt16(this.streamFormat.BitsPerSample);
      this.writeInt16(this.streamFormat.Size);
      this.writeInt16(this.streamFormat.AudioConfig);
      this.writeInt16(0);//Id
      this.writeInt32(0);//Flags
      this.writeInt16(0);//BlockSize
      this.writeInt16(0);//FramesPerBlock
      this.writeInt16(0);//CodecDelay
    },
    /**
    * @function : writeAviMainHeader
    */ 
    writeAviMainHeader : function(fileSize) {
      this.setBuffer(new Uint8Array(2048));
      var hdrlBytes = 4 + SIZE_OF_AVI_MAIN_HEADER+ 2 * (12 + SIZE_OF_STREAM_HEADER) 
                    + SIZE_OF_BITMAP_INFO + SIZE_OF_WAVE_FORMAT;
      this.writeString("RIFF");
      this.writeInt32(fileSize - 8);
      this.writeString("AVI ");///Be very carefull with this;

      this.writeString("LIST"); //top list
      this.writeInt32(hdrlBytes);
      this.writeString("hdrl");
      this.writeMainHeader(this.mainHeader);
    },
    /**
    * @function : getVideoHeader
    */ 
    getVideoHeader : function() {
      this.setBuffer(new Uint8Array(31*4));
      this.writeString("LIST"); //video list
      this.writeInt32(4 + 64 + 48);
      this.writeString("strl");
      this.writeStreamHeader();
      this.writeBitmapInfo();
      return this.buffer;
    },
    /**
    * @function : getAudioHeader
    */ 
    getAudioHeader : function() {
      this.setBuffer(new Uint8Array(29*4));
      this.writeString("LIST");  //Audio list
      this.writeInt32(4+ SIZE_OF_STREAM_HEADER + SIZE_OF_WAVE_FORMAT );
      this.writeString("strl");
      this.writeStreamHeader();
      this.writeWaveFormatEx();
      return this.buffer;
    },
    /**
    * @function : writeJunk
    */
    writeJunk : function(pos) {
      this.writeString("JUNK");
      var njunk = HEADER_BYTES - this.bufferIndex -4 -12;
      this.writeInt32(njunk);
      for (var i = 0; i < njunk; i++) {
        this.writeInt8(0);
      }
      this.writeString( "LIST" );
      this.writeInt32(pos); //writeInt32(4);
      this.writeString("movi" );
      return this.buffer;
    },
    /**
    * @function : writeAviTailHeader
    * @return : tail buffer
    */
    writeAviTailHeader : function(tailSize) {
      this.setBuffer(new Uint8Array(8));
      this.writeString("idx1");
      this.writeInt32(tailSize);
      return this.buffer;
    },
    /**
    * @function : getMainHeader
    */
    getMainHeader : function() {
      return this.mainHeader;
    },
    /**
    * @function : setMainHeader
    */
    setMainHeader : function(mainHeader) {
      this.mainHeader = mainHeader;
    },
    /**
    * @function : getIndexEntry
    * @return : aviIndexEntry
    */
    getIndexEntry : function() {
      return this.aviIndexEntry;
    },
    /**
    * @function : setIndexEntry
    */
    setIndexEntry : function(aviIndexEntry) {
      this.aviIndexEntry = aviIndexEntry;
    },
    /**
    * @function : setChunkHeader
    */
    setChunkHeader : function(chunkHeader) {
      this.chunkHeader = chunkHeader;
    },
    /**
    * @function : getChunkPayloadSize
    */
    getChunkPayloadSize : function() {
      return this.chunkHeader.payloadsize;
    },
    /**
    * set error code value
    * @function : SetErrorCode
    * @param : errorCode is matched by BACKUP_STATUS (refers to backup_status.js)
    */
    setErrorCode : function(errorCode) {
      this.errorCase = errorCode;
    },
    /**
    * @function : getErrorCode
    */
    getErrorCode : function() {
      return this.errorCase;
    },
    /**
    * @function : getTotalFrames
    */
    getTotalFrames : function() {
      return this.streamHeader.aviLength;
    },
    /**
    * @function : getDuration
    */
    getDuration : function() {
      var fps = this.streamHeader.aviRate / 1000;
      return ( this.streamHeader.aviLength / fps );
    },
    /**
    * @function : setResolution
    * @param : w is width , h is height, fps is fps value
    */
    setResolution : function(w, h, fps) {
      this.streamHeader.aviRight = this.streamHeader.width = w;
      this.streamHeader.aviBottom = this.streamHeader.height = h;
      this.streamHeader.aviSuggestedBufferSize = Math.floor((w*h)/2);

      this.streamFormat.Width = w;
      this.streamFormat.Height = h;
      this.streamFormat.SizeImage = ( w * h * fps );
    },
    /**
    * @function : getAviSampleSize
    */
    getAviSampleSize : function() {
      var s = Math.floor( ( this.streamFormat.BitsPerSample + 7 ) /8 ) * this.streamFormat.Channels;
      if( s === 0 ) {
        s = 1;
      }
      return s;
    }
  };
  return new Constructor();
}
