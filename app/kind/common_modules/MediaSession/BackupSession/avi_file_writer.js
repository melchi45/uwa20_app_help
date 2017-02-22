var AviFileWriter = function() {
  "use strict";
  var createVideoHeader;
  var createAudioHeader;
  function Constructor() {
    createVideoHeader = new VideoHeader();
    createAudioHeader = new AudioHeader();
  }

  Constructor.prototype = inheritObject(new AviFormatWriter(), {
    /**
    * @function : initHeader
    * @param : type is 'video' or 'audio'
    *        : frameInfo is videoFrame in BackupSession.js
    */
    initHeader : function(type, frameInfo) {
      if( type === 'video' ) {
        this.initMainHeader(frameInfo);
        createVideoHeader.initHeader(frameInfo); 
        createAudioHeader.initHeader();
      }
      else {
        createAudioHeader.initHeader();
      }
    },
    /**
    * @function : updateInfo
    * @param : type is 'video' or 'audio'
    *        : frameInfo & file_info is variables in BackupSession.js 
    */
    updateInfo : function(type, frameInfo, file_info) {
      if( type === 'video' ) {
        return createVideoHeader.updateInfo(frameInfo, file_info);
      }
      return createAudioHeader.updateInfo(frameInfo, file_info);
    },
    /**
    * @function : getErrorCode
    * @param : type is 'video' or 'audio'
    */
    getErrorCode : function(type) {
      if( type === 'video' ) {
        return createVideoHeader.getErrorCode();
      }
      return createAudioHeader.getErrorCode();
    },
    /**
    * @function : getChunkPayloadSize
    * @param : type is 'video' or 'audio'
    */
    getChunkPayloadSize : function(type) {
      if( type === 'video') {
        return createVideoHeader.getChunkPayloadSize();
      }
      return createAudioHeader.getChunkPayloadSize();
    },
    /**
    * @function : getIdxBuffer
    * @param : type is 'video' or 'audio'
    */
    getIdxBuffer : function(type) {
      if( type === 'video' ) {
        return createVideoHeader.getIndexBuffer();
      }
      return createAudioHeader.getIndexBuffer();
    },
    /**
    * @function : getDuration
    */
    getDuration : function() {
      return createVideoHeader.getDuration();
    },
    /**
    * @function : makeAviHeader
    */
    makeAviHeader : function(fileSize, filePos) {
      var mainHeader = this.getMainHeader();
      mainHeader.aviTotalFrames = createVideoHeader.getTotalFrames();
      this.setMainHeader(mainHeader);
      this.writeAviMainHeader(fileSize);
      this.appendBuffer(createVideoHeader.getVideoHeader());
      this.appendBuffer(createAudioHeader.getAudioHeader());
      return this.writeJunk(filePos);
    },
    /**
    * @function : makeAviTail
    */
    makeAviTail : function(tailSize) {
      return this.writeAviTailHeader(tailSize);
    },
    /**
    * @function : setResolution
    */  
    setResolution : function(w, h, fps) {
      createVideoHeader.setResolution(w, h, fps);
    }
  });
  return new Constructor();
}