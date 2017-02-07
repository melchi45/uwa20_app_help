var H265Session = function () {
  'use strict';
  var rtpTimeStamp = 0,
    inputLength = 0,
    RTPHeaderSize = 12,
    size_1M = 1024 * 1024,
    playback = false,
    limitResolution = false,
    outputSize = 0,
    curSize = 0,
    inputBuffer = new Uint8Array(size_1M),
    PREFIX = new Uint8Array(4),
    SPSParser = new H265SPSParser(),
    decoder = null,
    NumDecodedFrame = 0,
    SumDecodingTime =0,
    gopTime = 0,
    privDecodingTime = 0,
    diffTime = 0,
    criticalTime = 0,
    privIRtpTime = 0,
    rtpDiffTime = 0,
    // firstDiffTime = 0,
    frameDiffTime = 0,
    needDropCnt,

    decodedData = {
      frameData: null,
      timeStamp: null
    },
    timeData = {'timestamp': null, 'timezone': null
  };
  var width = 0, height = 0;

  PREFIX[0] = '0x00';
  PREFIX[1] = '0x00';
  PREFIX[2] = '0x00';
  PREFIX[3] = '0x01';

  var setBuffer = function(buffer1, buffer2) {
    if ((inputLength + buffer2.length) > buffer1.length) {
      buffer1 = new Uint8Array(buffer1.length + size_1M);
    }

    buffer1.set(buffer2, inputLength);
    inputLength += buffer2.length;
    return buffer1;
  };

  function Constructor() {
    decoder = H265Decoder();
  }

  Constructor.prototype = inheritObject(new RtpSession(), {
    init: function(){
      decoder.setIsFirstFrame(false);
      this.videoBufferList = new VideoBufferList();
      this.firstDiffTime = 0;
    },
    SendRtpData: function(rtspInterleaved, rtpHeader, rtpPayload, isBackup) {
	  // var beforeDepacketizing = Date.now();
      var HEADER = rtpHeader,
        PAYLOAD = null,
        timeData = {'timestamp': null, 'timezone': null},
        channelId = rtspInterleaved[1],
        pktTime = {},
        extensionHeaderLen = 0,
        PaddingSize = 0;
      var data = {};

      if (rtspInterleaved[0] !== 0x24) {
        console.log("H265Session::it is not valid interleave header (RTSP over TCP)");
        return;
      } else if ((rtpHeader[0] & 0x0F) === 0x0F) {
        console.log("H265Session::There is additional CSRC which is not handled in this version");
        return;
      } else if ((rtpHeader[0] & 0x20) === 0x20) {
        PaddingSize = rtpPayload[rtpPayload.length - 1];
        console.log("H265Session::PaddingSize - " + PaddingSize);
      }

      //Extension bit check in RTPHeader
      if ((rtpHeader[0] & 0x10) === 0x10) {
        extensionHeaderLen = ((rtpPayload[2] << 8 | rtpPayload[3]) * 4) + 4;

        //Playback check
        if (rtpPayload[0] == '0xAB' && rtpPayload[1] == '0xAD') {        
          var startHeader = 4,
            NTPmsw = new Uint8Array(new ArrayBuffer(4)),
            NTPlsw = new Uint8Array(new ArrayBuffer(4)),
            gmt = new Uint8Array(new ArrayBuffer(2)),
            fsynctime = {'seconds':null, 'useconds':null},
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

          timeData = {timestamp: fsynctime.seconds, timestamp_usec : fsynctime.useconds,
            timezone: gmt};

          if((this.getFramerate() === 0 || this.getFramerate() === undefined) && (this.GetTimeStamp() != null || this.GetTimeStamp() !== undefined)){
//            console.log("H265Session::GetTimeStamp = " + this.GetTimeStamp().timestamp + ' ' + this.GetTimeStamp().timestamp_usec);
//            console.log("H265Session::timestamp = " + timeData.timestamp + ' ' + timeData.timestamp_usec);
//            console.log("H265Session:: diff timestamp = " + (timeData.timestamp - this.GetTimeStamp().timestamp));
//            console.log("H265Session:: diff timestamp_usec = " + (timeData.timestamp_usec - this.GetTimeStamp().timestamp_usec));
//            console.log("H265Session:: framerate = " + parseInt(1000/(((timeData.timestamp - this.GetTimeStamp().timestamp) == 0 ? 0 : 1000) + (timeData.timestamp_usec - this.GetTimeStamp().timestamp_usec))));
//            this.setFramerate(parseInt(1000/(((timeData.timestamp - this.GetTimeStamp().timestamp) == 0 ? 0 : 1000) + (timeData.timestamp_usec - this.GetTimeStamp().timestamp_usec))));
            this.setFramerate(Math.round(1000/(((timeData.timestamp - this.GetTimeStamp().timestamp) == 0 ? 0 : 1000) + (timeData.timestamp_usec - this.GetTimeStamp().timestamp_usec))));
            // console.log("H265Session::frameRate = " + this.getFramerate());
          }
          this.SetTimeStamp(timeData);
          //this.rtpTimestampCbFunc(timeData);
          playback = true;
        }
      }

      PAYLOAD = rtpPayload.subarray(extensionHeaderLen, rtpPayload.length - PaddingSize);
      // rtpTimeStamp = new Uint8Array(new ArrayBuffer(4));
      // rtpTimeStamp.set(rtpHeader.subarray(4, 8), 0);
      // rtpTimeStamp = this.ntohl(rtpTimeStamp);
      rtpTimeStamp = this.ntohl(rtpHeader.subarray(4, 8));

      var nal_type = (PAYLOAD[0] >> 1) & 0x3f;

      switch (nal_type) {
        default:
          inputBuffer = setBuffer(inputBuffer, PREFIX);
          inputBuffer = setBuffer(inputBuffer, PAYLOAD);
          break;
        // Fragmentation unit(FU)
        case 49:
          var start_bit = ((PAYLOAD[2] & 0x80) === 0x80),
            end_bit = ((PAYLOAD[2] & 0x40) === 0x40),
            fu_type = PAYLOAD[2] & 0x3f,
            payload_start_index = 3,
            payloadTemp = PAYLOAD.subarray(payload_start_index, PAYLOAD.length);

          if (start_bit == true && end_bit == false) {
            var new_nal_header = new Uint8Array(2);
            new_nal_header[0] = (PAYLOAD[0] & 0x81) | (fu_type << 1);
            new_nal_header[1] = PAYLOAD[1];

            inputBuffer = setBuffer(inputBuffer, PREFIX);
            inputBuffer = setBuffer(inputBuffer, new_nal_header);
            inputBuffer = setBuffer(inputBuffer, PAYLOAD.subarray(payload_start_index, PAYLOAD.length));
          } else {
            inputBuffer = setBuffer(inputBuffer, PAYLOAD.subarray(payload_start_index, PAYLOAD.length));
          }
          break;
        //SPS
        case 33:
          var resolution = SPSParser.parse(PAYLOAD);
          curSize = resolution.width * resolution.height;
          if (playback && !isBackup) {
            var limitSize = 1280 * 720;
            limitResolution = false;
            //console.log("h265 resolution in sps = width : " + resolution.width + ", height : " + resolution.height);
            if (curSize > limitSize) {
              limitResolution = true;
              data.error = {
                errorCode: "998",
                description: "Resolution is too big",
                place: "h265Session.js"
              };
              return data;
            }
          }
          inputBuffer = setBuffer(inputBuffer, PREFIX);
          inputBuffer = setBuffer(inputBuffer, PAYLOAD);
          //if( isBackup === true) {
            width = resolution.width;
            height = resolution.height;
          //}
          break;
      } //end of switch(nal_type)
      //case 48 Remove because not use more

      //check marker bit
      var frameType='';
      if ((HEADER[1] & 0x80) === 0x80) {
		  // var DepacketizingTime = Date.now() - beforeDepacketizing;
        if (outputSize !== curSize) {
          outputSize = curSize;
          decoder.setOutputSize(outputSize);
        }

        var inputBufferSub = inputBuffer.subarray(0, inputLength);
        if (inputBufferSub[4] == 0x40) {
          frameType = 'I';
          // gopTime = Date.now();
          // diffTime = 0;
          // criticalTime = 0;
          // privDecodingTime = 0;
          if(this.firstDiffTime == 0){
            this.firstDiffTime =  (Date.now() - (rtpTimeStamp / 90).toFixed(0));
            needDropCnt = 0;
          } else {
            // rtpDiffTime = (rtpTimeStamp / 90).toFixed(0) - privIRtpTime;
            // frameDiffTime = rtpDiffTime/this.getGovLength();
            frameDiffTime = Math.round(((rtpTimeStamp / 90).toFixed(0) - privIRtpTime) / this.getGovLength());
            privIRtpTime = (rtpTimeStamp / 90).toFixed(0);
            // console.log("H264Session:: DiffTime = " + (this.firstDiffTime - (Date.now() - (rtpTimeStamp / 90).toFixed(0))) + " frameDiffTime = " + frameDiffTime);
            needDropCnt =  (Date.now() - privIRtpTime) - this.firstDiffTime;
            if(needDropCnt > 5000){
              if(playback === false) {
                data.error = {
                  errorCode: "997",
                  description: "Delay time is too long",
                  place: "h265Session.js"
                };
                return data;
              }
            }
            needDropCnt = (needDropCnt > 0) ? Math.round(needDropCnt/frameDiffTime) : 0;
          }
          // console.log("H265Session:: needDropCnt = " + needDropCnt);
        } else {
          frameType = 'P';
          // diffTime = Date.now() - gopTime;
          // criticalTime = ((this.getGovLength()-1) *1000)/this.getFramerate();// - privDecodingTime;
        }

//        frameType = (inputBufferSub[4] == 0x40) ? 'I' : 'P';
        decodedData.frameData = null;
        if( isBackup !== true || playback !== true ) {
          //if (this.dropCheck(frameType) || playback !== true) {
          // if (this.dropCheck(frameType)) {
          //   decodedData.frameData = decoder.decode(inputBufferSub);
          //   if (decodedData.frameData.decodingTime !== undefined) {
          //     privDecodingTime = decodedData.frameData.decodingTime;
          //
          //       NumDecodedFrame++;
          //     SumDecodingTime = SumDecodingTime + decodedData.frameData.decodingTime+ DepacketizingTime;
          //
			//   	if (SumDecodingTime > 1000){
			// 		var diff = this.getFramerate() - NumDecodedFrame;
			// 		if (diff > 0) {
			// 			data.throughPut = this.setThroughPut(NumDecodedFrame);
			// 		}
			// 		NumDecodedFrame = 0;
			// 		SumDecodingTime = 0;
			// 	}
			// }
          //
          // } else {
            //decodedData.dropPercent = this.getDropPercent();
            // decodedData.dropCount = this.getDropCount();
          // }
          // if( diffTime <= criticalTime ) {
          //   decodedData.frameData = decoder.decode(inputBufferSub);
//            privDecodingTime = decodedData.frameData.decodingTime;
//           } else {
//            console.log("H265Session:: diffTime = " + diffTime + " criticalTime = " + criticalTime );
//           }

          // if (this.isDrop(frameType, needDropCnt)) {
            decodedData.frameData = decoder.decode(inputBufferSub);
          // }
        }

        decodedData.timeStamp = null;
        inputLength = 0;
        if (playback == true) {
          timeData = (timeData.timestamp == null ? this.GetTimeStamp() : timeData);
          decodedData.timeStamp = timeData;
        }
        if( isBackup ) {
          data.backupData = {
            'stream' : inputBufferSub,
            'frameType' : frameType,
            'width' : width,
            'height' : height,
            'codecType' : 'h265'
          };
          if( timeData.timestamp !== null && timeData.timestamp !== undefined ) {
            data.backupData.timestamp_usec = timeData.timestamp_usec;
          }
          else {
            data.backupData.timestamp = (rtpTimeStamp/90).toFixed(0);
          }
        }
        data.decodedData = decodedData;
        if (decodeMode !== "canvas") {
          data.decodeMode = "canvas";
        }

        return data;
      }
    },
    freeBufferIdx: function(bufferIdx){
      decoder.freeBuffer(bufferIdx);
    },
    bufferingRtpData: function(rtspInterleaved, rtpHeader, rtpPayload) {
      var HEADER = rtpHeader,
          PAYLOAD = null,
          channelId = rtspInterleaved[1],
          pktTime = {},
          extensionHeaderLen = 0,
          PaddingSize = 0;
      var data = {};

      if (rtspInterleaved[0] !== 0x24) {
        console.log("H265Session::it is not valid interleave header (RTSP over TCP)");
        return;
      } else if ((rtpHeader[0] & 0x0F) === 0x0F) {
        console.log("H265Session::There is additional CSRC which is not handled in this version");
        return;
      } else if ((rtpHeader[0] & 0x20) === 0x20) {
        PaddingSize = rtpPayload[rtpPayload.length - 1];
        console.log("H265Session::PaddingSize - " + PaddingSize);
      }

      //Extension bit check in RTPHeader
      if ((rtpHeader[0] & 0x10) === 0x10) {
        extensionHeaderLen = ((rtpPayload[2] << 8 | rtpPayload[3]) * 4) + 4;

        //Playback check
        if (rtpPayload[0] == '0xAB' && rtpPayload[1] == '0xAD') {
          var startHeader = 4,
              NTPmsw = new Uint8Array(new ArrayBuffer(4)),
              NTPlsw = new Uint8Array(new ArrayBuffer(4)),
              gmt = new Uint8Array(new ArrayBuffer(2)),
              fsynctime = {'seconds':null, 'useconds':null},
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

          timeData = {timestamp: fsynctime.seconds, timestamp_usec : fsynctime.useconds,
            timezone: gmt};

//          this.SetTimeStamp(timeData);
          //this.rtpTimestampCbFunc(timeData);

          // console.log("H265Session::timestamp = " + fsynctime.seconds +" "+ fsynctime.useconds);
          playback = true;
        }
      }

      PAYLOAD = rtpPayload.subarray(extensionHeaderLen, rtpPayload.length - PaddingSize);

      rtpTimeStamp = new Uint8Array(new ArrayBuffer(4));
      rtpTimeStamp.set(rtpHeader.subarray(4, 8), 0);
      rtpTimeStamp = this.ntohl(rtpTimeStamp);

      var nal_type = (PAYLOAD[0] >> 1) & 0x3f;

      switch (nal_type) {
        default:
          inputBuffer = setBuffer(inputBuffer, PREFIX);
          inputBuffer = setBuffer(inputBuffer, PAYLOAD);
          break;
          // Fragmentation unit(FU)
        case 49:
          var start_bit = ((PAYLOAD[2] & 0x80) === 0x80),
              end_bit = ((PAYLOAD[2] & 0x40) === 0x40),
              fu_type = PAYLOAD[2] & 0x3f,
              payload_start_index = 3,
              payloadTemp = PAYLOAD.subarray(payload_start_index, PAYLOAD.length);

          if (start_bit == true && end_bit == false) {
            var new_nal_header = new Uint8Array(2);
            new_nal_header[0] = (PAYLOAD[0] & 0x81) | (fu_type << 1);
            new_nal_header[1] = PAYLOAD[1];

            inputBuffer = setBuffer(inputBuffer, PREFIX);
            inputBuffer = setBuffer(inputBuffer, new_nal_header);
            inputBuffer = setBuffer(inputBuffer, PAYLOAD.subarray(payload_start_index, PAYLOAD.length));
          } else {
            inputBuffer = setBuffer(inputBuffer, PAYLOAD.subarray(payload_start_index, PAYLOAD.length));
          }
          break;
          //SPS
        case 33:
          var resolution = SPSParser.parse(PAYLOAD);
          curSize = resolution.width * resolution.height;
          if (playback) {
            var limitSize = 1280 * 720;
            limitResolution = false;
            // console.log("h265 resolution in sps = width : " + resolution.width + ", height : " + resolution.height);
            if (curSize > limitSize) {
              limitResolution = true;
            }
          }
          inputBuffer = setBuffer(inputBuffer, PREFIX);
          inputBuffer = setBuffer(inputBuffer, PAYLOAD);
          width = resolution.width;
          height = resolution.height;
          break;
      } //end of switch(nal_type)
      //case 48 Remove because not use more

      //check marker bit
      var frameType='';
      if ((HEADER[1] & 0x80) === 0x80) {
        if (outputSize !== curSize) {
          outputSize = curSize;
          decoder.setOutputSize(outputSize);
        }

        var stepBufferSub = new Uint8Array(inputBuffer.subarray(0, inputLength));

        if(this.videoBufferList !== null){
          this.videoBufferList.push(stepBufferSub, width, height, 'h265', (stepBufferSub[4] == 0x40) ? 'I' : 'P', timeData);
        }
        inputLength = 0;
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
    }
  });

  return new Constructor();
};