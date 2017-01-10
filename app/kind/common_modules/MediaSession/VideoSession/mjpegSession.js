var MjpegSession = function () {
  var MARKERSOF0 = 0xc0; // start-of-frame, baseline scan
  var MARKERSOI = 0xd8; // start of image
  var MARKEREOI = 0xd9; // end of image
  var MARKERSOS = 0xda; // start of scan
  var MARKERDRI = 0xdd; // restart interval
  var MARKERDQT = 0xdb; // define quantization tables
  var MARKERDHT = 0xc4; // huffman tables
  var MARKERAPPFIRST = 0xe0;
  var MARKERAPPLAST = 0xef;
  var MARKERCOMMENT = 0xfe;
  var extensionHeaderLen;
  var decoder;
  var width,
    height;
  var decodedData = {
      frameData: null,
      timeStamp: null
    },
    timeData = {'timestamp': null, 'timezone': null};
  var lum_dc_codelens = [
    0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0
  ];
  var lum_dc_symbols = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
  ];
  var lum_ac_codelens = [
    0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d
  ];
  var lum_ac_symbols = [
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12,
    0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
    0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
    0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0,
    0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16,
    0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39,
    0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
    0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
    0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79,
    0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98,
    0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
    0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
    0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5,
    0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4,
    0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
    0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea,
    0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
    0xf9, 0xfa
  ];
  var chm_dc_codelens = [
    0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0
  ];
  var chm_dc_symbols = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
  ];
  var chm_ac_codelens = [
    0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77
  ];
  var chm_ac_symbols = [
    0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21,
    0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71,
    0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91,
    0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0,
    0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34,
    0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26,
    0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38,
    0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48,
    0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58,
    0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68,
    0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78,
    0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
    0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96,
    0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5,
    0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4,
    0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3,
    0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2,
    0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda,
    0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9,
    0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
    0xf9, 0xfa
  ];
  // The default 'luma' and 'chroma' quantizer tables, in zigzag order:
  var defaultQuantizers = [
    // luma table:
    16, 11, 12, 14, 12, 10, 16, 14,
    13, 14, 18, 17, 16, 19, 24, 40,
    26, 24, 22, 22, 24, 49, 35, 37,
    29, 40, 58, 51, 61, 60, 57, 51,
    56, 55, 64, 72, 92, 78, 64, 68,
    87, 69, 55, 56, 80, 109, 81, 87,
    95, 98, 103, 104, 103, 62, 77, 113,
    121, 112, 100, 120, 92, 101, 103, 99,
    // chroma table:
    17, 18, 18, 24, 21, 24, 47, 26,
    26, 47, 99, 66, 56, 66, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99
  ];

  function createHuffmanHeader(ptr, index, codelens, ncodes, symbols, nsymbols, tableNo, tableClass) {
    ptr[index] = 0xFF;
    index += 1;
    ptr[index] = MARKERDHT;
    index += 1;
    ptr[index] = 0;
    index += 1;
    /* length msb */
    ptr[index] = 3 + ncodes + nsymbols;
    index += 1;
    /* length lsb */
    ptr[index] = (tableClass << 4) | tableNo;
    index += 1;

    ptr.set(codelens, index);
    index += ncodes;
    ptr.set(symbols, index);
    index += nsymbols;
    return index;
  }

  function makeDefaultQtables(resultTables, Q) {
    var factor = Q;
    var q, i;

    if (Q < 1) factor = 1;
    else if (Q > 99) factor = 99;

    if (Q < 50) {
      q = 5000 / factor;
    } else {
      q = 200 - factor * 2;
    }

    for (i = 0; i < 128; i = i + 1) {
      var newVal = (defaultQuantizers[i] * q + 50) / 100;
      if (newVal < 1) newVal = 1;
      else if (newVal > 255) newVal = 255;
      resultTables[i] = newVal;
    }
  }

  var makeJPEGHeader = function (type, width, height, qtables, qtlen, dri) {
    var buf = new Uint8Array(new ArrayBuffer(1000));
    var index = 0;
    var ptr = buf;
    var numQtables = qtlen > 64 ? 2 : 1;
    var qtablesize = 0;

    // MARKER_SOI:
    ptr[index] = 0xFF;
    index += 1;
    ptr[index] = MARKERSOI;
    index += 1;
    ////console.log("makeJPEGHeader 1 Size:",index);

    // MARKER_APP_FIRST:
    ptr[index] = 0xFF;
    index += 1;
    ptr[index] = MARKERAPPFIRST;
    index += 1;
    ptr[index] = 0x00;
    index += 1;
    ptr[index] = 0x10;
    index += 1;
    ptr[index] = 0x4a;
    index += 1;
    ptr[index] = 0x46;
    index += 1;
    ptr[index] = 0x49;
    index += 1;
    ptr[index] = 0x46;
    index += 1;
    ptr[index] = 0x00;
    index += 1;
    ptr[index] = 0x01;
    index += 1;
    ptr[index] = 0x01;
    index += 1;
    ptr[index] = 0x00;
    index += 1;
    ptr[index] = 0x00;
    index += 1;
    ptr[index] = 0x01;
    index += 1;
    ptr[index] = 0x00;
    index += 1;
    ptr[index] = 0x01;
    index += 1;
    ptr[index] = 0x00;
    index += 1;
    ptr[index] = 0x00;
    index += 1;
    ////console.log("makeJPEGHeader 2 Size:",index);

    // MARKER_DRI:
    if (dri > 0) {
      ptr[index] = 0xFF;
      index += 1;
      ptr[index] = MARKERDRI;
      index += 1;
      ptr[index] = 0x00;
      index += 1;
      ptr[index] = 0x04;
      index += 1;
      ptr[index] = dri >> 8;
      index += 1;
      ptr[index] = dri;
      index += 1;
      ////console.log("makeJPEGHeader 3 Size:",index);
    }

    // MARKER_DQT (luma):
    var tableSize = (numQtables === 1) ? qtlen : qtlen / 2;
    ptr[index] = 0xFF;
    index += 1;
    ptr[index] = MARKERDQT;
    index += 1;
    ptr[index] = 0x00;
    index += 1;
    ptr[index] = tableSize + 3;
    index += 1;
    ptr[index] = 0x00;
    index += 1;
    ////console.log("makeJPEGHeader 4 Size:",index);

    ptr.set(qtables.subarray(0, tableSize), index);
    qtablesize += tableSize;
    index += tableSize;
    ////console.log("makeJPEGHeader 5 Size:",index);

    if (numQtables > 1) {
      tableSize = qtlen - qtlen / 2;
      // MARKER_DQT (chroma):
      ptr[index] = 0xFF;
      index += 1;
      ptr[index] = MARKERDQT;
      index += 1;
      ptr[index] = 0x00;
      index += 1;
      ptr[index] = tableSize + 3;
      index += 1;
      ptr[index] = 0x01;
      index += 1;
      ptr.set(qtables.subarray(qtablesize, qtablesize + tableSize), index);
      qtables += tableSize;
      index += tableSize;
      ////console.log("makeJPEGHeader 6 Size:",index);
    }

    // MARKER_SOF0:
    ptr[index] = 0xFF;
    index += 1;
    ptr[index] = MARKERSOF0;
    index += 1;
    ptr[index] = 0x00;
    index += 1;
    ptr[index] = 0x11;
    index += 1;
    ptr[index] = 0x08;
    index += 1;

    ptr[index] = (height >> 8);
    index += 1;
    ptr[index] = (height);
    index += 1; // number of lines (must be a multiple of 8)
    ptr[index] = (width >> 8);
    index += 1;
    ptr[index] = (width);
    index += 1; // number of columns (must be a multiple of 8)
    ptr[index] = 0x03;
    index += 1; // number of components
    ptr[index] = 0x01;
    index += 1; // id of component
    ptr[index] = type ? 0x22 : 0x21;
    index += 1; // sampling ratio (h,v)
    ptr[index] = 0x00;
    index += 1; // quant table id
    ptr[index] = 0x02;
    index += 1; // id of component
    ptr[index] = 0x11;
    index += 1; // sampling ratio (h,v)
    ptr[index] = numQtables == 1 ? 0x00 : 0x01;
    index += 1; // quant table id
    ptr[index] = 0x03;
    index += 1; // id of component
    ptr[index] = 0x11;
    index += 1; // sampling ratio (h,v)
    ptr[index] = 0x01;
    index += 1; // quant table id

    ////console.log("makeJPEGHeader 7 Size:",index);
    index = createHuffmanHeader(ptr, index, lum_dc_codelens, lum_dc_codelens.length,
      lum_dc_symbols, lum_dc_symbols.length, 0, 0);
    ////console.log("makeJPEGHeader 7.1 Size:",index);
    index = createHuffmanHeader(ptr, index, lum_ac_codelens, lum_ac_codelens.length,
      lum_ac_symbols, lum_ac_symbols.length, 0, 1);
    //// console.log("makeJPEGHeader 7.2 Size:",index);
    index = createHuffmanHeader(ptr, index, chm_dc_codelens, chm_dc_codelens.length,
      chm_dc_symbols, chm_dc_symbols.length, 1, 0);
    //// console.log("makeJPEGHeader 7.3 Size:",index);
    index = createHuffmanHeader(ptr, index, chm_ac_codelens, chm_ac_codelens.length,
      chm_ac_symbols, chm_ac_symbols.length, 1, 1);
    ////console.log("makeJPEGHeader 8 Size:",index);

    // MARKER_SOS:
    ptr[index] = 0xFF;
    index += 1;
    ptr[index] = MARKERSOS;
    index += 1;
    ptr[index] = 0x00;
    index += 1;
    ptr[index] = 0x0C;
    index += 1; // size of chunk
    ptr[index] = 0x03;
    index += 1; // number of components
    ptr[index] = 0x01;
    index += 1; // id of component
    ptr[index] = 0x00;
    index += 1; // huffman table id (DC, AC)
    ptr[index] = 0x02;
    index += 1; // id of component
    ptr[index] = 0x11;
    index += 1; // huffman table id (DC, AC)
    ptr[index] = 0x03;
    index += 1; // id of component
    ptr[index] = 0x11;
    index += 1; // huffman table id (DC, AC)
    ptr[index] = 0x00;
    index += 1; // start of spectral
    ptr[index] = 0x3F;
    index += 1; // end of spectral
    ptr[index] = 0x00;
    index += 1; // successive approximation bit position (high, low)

    ////console.log("makeJPEGHeader 9 Size:",index);
    var tmpheader = new Uint8Array(new ArrayBuffer(index));
    tmpheader.set(ptr.subarray(0, index), 0);

    var receiveMsg = String.fromCharCode.apply(null, tmpheader);
    ////console.log("JPEG Start Header",receiveMsg);
    return tmpheader;
  };

  function getspecialheadersize(rtpPayload) {
    var resultSpecialHeaderSize = 8;
    var Type = rtpPayload[extensionHeaderLen + 4];
    var Q = rtpPayload[extensionHeaderLen + 5];

    if (Type > 63) {
      resultSpecialHeaderSize += 4;
      //console.log("getspecialheadersize 1:",resultSpecialHeaderSize);
    }
    if (Q > 127) {
      var MBZ = rtpPayload[extensionHeaderLen + resultSpecialHeaderSize];
      if (MBZ === 0) {
        //console.log("getspecialheadersize 2:",resultSpecialHeaderSize);
        var Length = (rtpPayload[extensionHeaderLen + resultSpecialHeaderSize + 2] << 8 | rtpPayload[extensionHeaderLen + resultSpecialHeaderSize + 3]);
        // console.log("getspecialheadersize 3:",Length);
        resultSpecialHeaderSize += 4;
        resultSpecialHeaderSize += Length;
        //console.log("getspecialheadersize 4:",resultSpecialHeaderSize);
      }
    }
    return resultSpecialHeaderSize;
  }

  var createjpegheader = function (rtpPayload) {
    var exHeaderLen;
    var resultSpecialHeaderSize = 8;
    var Offset = (rtpPayload[extensionHeaderLen + 1] << 16 | rtpPayload[extensionHeaderLen + 2] << 8 | rtpPayload[extensionHeaderLen + 3]);
    var Type = rtpPayload[extensionHeaderLen + 4];
    var type = Type & 1;
    var Q = rtpPayload[extensionHeaderLen + 5];
    width = rtpPayload[extensionHeaderLen + 6] * 8;
    height = rtpPayload[extensionHeaderLen + 7] * 8;

    if (height === 0 || width === 0) { // special case
      //height = 256*8;
      if (rtpPayload[0] == '0xAB' && rtpPayload[1] == '0xAD') {
        exHeaderLen = 16;
        height = (rtpPayload[exHeaderLen + 9] << 8 | rtpPayload[exHeaderLen + 10]);
        width = (rtpPayload[exHeaderLen + 11] << 8 | rtpPayload[exHeaderLen + 12]);
      } else {
        height = (rtpPayload[9] << 8 | rtpPayload[10]);
        width = (rtpPayload[11] << 8 | rtpPayload[12]);
      }
    }

    var dri;
    var qtables = null;
    var qtlen = 0;
    if (Type > 63) {
      // Restart Marker header present
      /*
       0                   1                   2                   3
       0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |       Restart Interval        |F|L|       Restart Count       |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       */

      var RestartInterval = rtpPayload[extensionHeaderLen + resultSpecialHeaderSize] << 8 | rtpPayload[extensionHeaderLen + resultSpecialHeaderSize + 1];
      dri = RestartInterval;
      resultSpecialHeaderSize += 4;
      //console.log("createjpegheader-restart marker added");
    }

    if (Offset === 0) {
      if (Q > 127) {
        // Quantization Table header present
        /*
         0                   1                   2                   3
         0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
         +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
         |      MBZ      |   Precision   |             Length            |
         +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
         |                    Quantization Table Data                    |
         |                              ...                              |
         +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
         */
        var MBZ = rtpPayload[extensionHeaderLen + resultSpecialHeaderSize];
        if (MBZ === 0) {
          var Length = (rtpPayload[extensionHeaderLen + resultSpecialHeaderSize + 2] << 8 | rtpPayload[extensionHeaderLen + resultSpecialHeaderSize + 3]);
          resultSpecialHeaderSize += 4;
          qtlen = Length;
          qtables = new Uint8Array(new ArrayBuffer(Length));
          qtables.set(rtpPayload.subarray(extensionHeaderLen + resultSpecialHeaderSize, extensionHeaderLen + resultSpecialHeaderSize + Length), 0);
          resultSpecialHeaderSize += Length;
          //console.log("createjpegheader-Q Tables exist:",qtables.length);
        }
      }
    }

    if (qtlen === 0) {
      // A quantization table was not present in the RTP JPEG header,
      // so use the default tables, scaled according to the "Q" factor:
      qtlen = 128;
      qtables = new Uint8Array(new ArrayBuffer(qtlen));
      makeDefaultQtables(qtables, Q);
      //console.log("createjpegheader-Used Default Q Tables:",qtables.length);
    }
    // var jpgheder = makeJPEGHeader(type, width, height, qtables, qtlen, dri);
    return makeJPEGHeader(type, width, height, qtables, qtlen, dri);
  };

  var jpegFrame = new Uint8Array(1024 * 1024);
  var readLength = 0;
  var jpegDataSize;
  var curFrameSize = 0;
  var decodercallback;
  var frmCnt = 0;
  var totalFrameSize = 0;
  var specialHeaderSize = 0;
  var skipHeaderBytes = 0;
  var rtpTimeStamp = 0;
  var playback = false;
  var t0 = 0;
  var t1 = 0;
  var timegap = 0;
  var isSetStartTime = true;

  var channelId, NTPmsw, NTPlsw, startHeader, gmt, fragmentOffset, jpegStartHeader, jpegStartHeaderSize,
    fsynctime, data, payloadsize, marker, Type, ntpmsw, ntplsw;

  function Constructor() {
    self = this;
    decoder = new MJPEGDecoder();
  }

  Constructor.prototype = inheritObject(new RtpSession(), {
    init: function () {
      decoder.setIsFirstFrame(false);
      this.videoBufferList = new VideoBufferList();
    },
    SendRtpData: function (rtspInterleaved, rtpHeader, rtpPayload, isBackup) {
      channelId = rtspInterleaved[1];
      fsynctime = {};
      data = {};
      payloadsize = ((rtspInterleaved[2] << 8) + rtspInterleaved[3]) - 12; //RTP Header: 12 bytes
      if ((rtpHeader[1] & 0x80) === 0x80) {
        marker = 1;
        isSetStartTime = true;
        if (t0 != 0) {
          t1 = Date.now();
          timegap = t1 - t0;
        }
      } else {
        marker = 0;
        if (isSetStartTime) {
          t0 = Date.now();
        }
        isSetStartTime = false;
      }

      if (timegap > 300) //frame drop in case of packetize slow more than 300ms
        return;
      //console.log("rtp header byte",rtpHeader[0]);

      if ((rtpHeader[0] & 0x10) === 0x10) {
        //RTP Header Extension bit set
        if (rtpPayload[0] == '0xAB' && rtpPayload[1] == '0xAD') {
          extensionHeaderLen = 16; //16 byte Replay Extension header
          if (rtpPayload[extensionHeaderLen] == '0xFF' && rtpPayload[extensionHeaderLen + 1] == '0xD8') {
            extensionHeaderLen += ((rtpPayload[extensionHeaderLen + 2] << 8 | rtpPayload[extensionHeaderLen + 3]) * 4) + 4; //MJPEG extensionHeader
          }
          playback = true;
          startHeader = 4;
          // NTPmsw = new Uint8Array(new ArrayBuffer(4));
          // NTPmsw.set(rtpPayload.subarray(startHeader, startHeader + 4), 0);
          // ntpmsw = this.ntohl(NTPmsw);
          NTPmsw = rtpPayload.subarray(startHeader, startHeader + 4);

          startHeader += 4;
          // NTPlsw = new Uint8Array(new ArrayBuffer(4));
          // NTPlsw.set(rtpPayload.subarray(startHeader, startHeader + 4), 0);
          // ntplsw = this.ntohl(NTPlsw);
          NTPlsw = rtpPayload.subarray(startHeader, startHeader + 4);

          startHeader += 4;
          // microseconds = (this.ntohl(NTPlsw) / 0xffffffff) * 1000;
          fsynctime.seconds = ((this.ntohl(NTPmsw) - 0x83AA7E80) >>> 0);
          fsynctime.useconds = (this.ntohl(NTPlsw) / 0xffffffff) * 1000;

          startHeader += 2;
          // gmt = new Uint8Array(new ArrayBuffer(2));
          // gmt.set(rtpPayload.subarray(startHeader, startHeader + 2), 0);
          // gmt = (((gmt[0] << 8) | gmt[1]) << 16) >> 16;
          gmt = rtpPayload.subarray(startHeader, startHeader + 2);
          gmt = (((gmt[0] << 8) | gmt[1]) << 16) >> 16;

          timeData = {
            timestamp: fsynctime.seconds,
            timestamp_usec: fsynctime.useconds,
            timezone: gmt
          };

          if ((this.getFramerate() === 0 || this.getFramerate() === undefined) && (this.GetTimeStamp() != null || this.GetTimeStamp() !== undefined)) {
//            console.log("MJPEGSession::GetTimeStamp = " + this.GetTimeStamp().timestamp + ' ' + this.GetTimeStamp().timestamp_usec);
//            console.log("MJPEGSession::timestamp = " + timeData.timestamp + ' ' + timeData.timestamp_usec);
//            console.log("MJPEGSession:: diff timestamp = " + (timeData.timestamp - this.GetTimeStamp().timestamp));
//            console.log("MJPEGSession:: diff timestamp_usec = " + (timeData.timestamp_usec - this.GetTimeStamp().timestamp_usec));
//            console.log("MJPEGSession:: framerate = " + parseInt(1000/(((timeData.timestamp - this.GetTimeStamp().timestamp) == 0 ? 0 : 1000) + (timeData.timestamp_usec - this.GetTimeStamp().timestamp_usec))));
//            this.setFramerate(parseInt(1000/(((timeData.timestamp - this.GetTimeStamp().timestamp) == 0 ? 0 : 1000) + (timeData.timestamp_usec - this.GetTimeStamp().timestamp_usec))));
            this.setFramerate(Math.round(1000 / (((timeData.timestamp - this.GetTimeStamp().timestamp) == 0 ? 0 : 1000) + (timeData.timestamp_usec - this.GetTimeStamp().timestamp_usec))));
            console.log("MJPEGSession::frameRate = " + this.getFramerate());
          }
          this.SetTimeStamp(timeData);
          //this.rtpTimestampCbFunc(timeData);
        } else if (rtpPayload[0] == '0xFF' && rtpPayload[1] == '0xD8') {
          extensionHeaderLen = ((rtpPayload[2] << 8 | rtpPayload[3]) * 4) + 4; //MJPEG extensionHeader
        }
      } else {
        extensionHeaderLen = 0;
      }

      fragmentOffset = rtpPayload[extensionHeaderLen + 1] << 16 | rtpPayload[extensionHeaderLen + 2] << 8 | rtpPayload[extensionHeaderLen + 3];

      // rtpTimeStamp = new Uint8Array(new ArrayBuffer(4));
      // rtpTimeStamp.set(rtpHeader.subarray(4, 8), 0);
      // rtpTimeStamp = this.ntohl(rtpTimeStamp);
      rtpTimeStamp = this.ntohl(rtpHeader.subarray(4, 8));

      if (fragmentOffset === 0) {
        //start of MJPEG frame
        //Create JPEG Frame Header
        curFrameSize = 0;
        specialHeaderSize = getspecialheadersize(rtpPayload) + extensionHeaderLen;
        jpegDataSize = payloadsize - specialHeaderSize;
        jpegStartHeader = createjpegheader(rtpPayload);
        jpegStartHeaderSize = jpegStartHeader.length;

        // console.log("mjpegFrameBuilder- payloadsize: specialHeaderSize: startheaderSize:", payloadsize , specialHeaderSize,jpegStartHeaderSize);
        if (marker === 1) {
          totalFrameSize = jpegStartHeaderSize + jpegDataSize + 2;
          //jpegFrame = new Uint8Array(new ArrayBuffer(totalFrameSize));

          //Add JPEG Start Hedaer
          //Append JPEG Scan data
          jpegFrame.set(jpegStartHeader, 0);
          readLength += jpegStartHeaderSize;
          jpegFrame = this.appendBuffer(jpegFrame, rtpPayload.subarray(specialHeaderSize, payloadsize), readLength);
          readLength += payloadsize;
          //ADD EOL;
          jpegFrame[totalFrameSize - 2] = 0xFF;
          jpegFrame[totalFrameSize - 1] = 0xD9;
          frmCnt++;
          decodedData.frameData = null;
          if (isBackup !== true || playback !== true) {
            decoder.setResolution(width, height);
            decodedData.frameData = decoder.decode(jpegFrame.subarray(0, readLength));
          }
          decodedData.timeStamp = null;

          //call decoder callback
          if (playback == true) {
            timeData = (timeData.timestamp == null ? this.GetTimeStamp() : timeData);
            decodedData.timeStamp = timeData;
            // this.rtpBufferingCbFunc(jpegFrame.subarray(0, readLength), timeData, "jpeg", this.rtpPayloadCbFunc);
          }
          if (isBackup === true) {
            data.backupData = {
              'stream': jpegFrame.subarray(0, readLength),
              'width': width,
              'height': height,
              'codecType': 'mjpeg'
            };
            if (timeData.timestamp !== null && timeData.timestamp !== undefined) {
              data.backupData.timestamp_usec = timeData.timestamp_usec;
            } else {
              data.backupData.timestamp = (rtpTimeStamp / 90).toFixed(0);
            }
          }
          readLength = 0;
          data.decodedData = decodedData;
          return data;
        } else {
          totalFrameSize = jpegStartHeaderSize + jpegDataSize;
          if (jpegFrame.length == 0) {
            jpegFrame = new Uint8Array(1024 * 1024);
          }
          jpegFrame.set(jpegStartHeader, 0);
          readLength += jpegStartHeaderSize;
          jpegFrame = this.appendBuffer(jpegFrame, rtpPayload.subarray(specialHeaderSize, payloadsize), readLength);
          readLength += payloadsize - specialHeaderSize;
          //console.log("Partial JPEG frame");
        }
      } else {
        //skip specialHeader Bytes
        specialHeaderSize = 8 + extensionHeaderLen;
        Type = rtpPayload[extensionHeaderLen + 4];
        if (Type > 63) {
          specialHeaderSize += 4;
        }
        //console.log("mjpegFrameBuilder-2 payloadsize: specialHeaderSize:", payloadsize , specialHeaderSize);
        if (payloadsize < specialHeaderSize) {
          //We got only partail jpeg header
          skipHeaderBytes = specialHeaderSize - payloadsize;
          console.log("We got only partial JPEG Header this should not happen");
          return;
        } else {
          skipHeaderBytes = specialHeaderSize;
        }

        jpegDataSize = payloadsize - skipHeaderBytes;
        totalFrameSize = jpegDataSize;
        if (marker === 1) {
          totalFrameSize += 2;
        }
        // console.log("MJPEG Current frame size:",totalFrameSize);
        jpegFrame = this.appendBuffer(jpegFrame, rtpPayload.subarray(skipHeaderBytes, payloadsize), readLength);

        readLength += payloadsize - skipHeaderBytes;
        if (marker === 1) {
          jpegFrame[readLength + totalFrameSize - 2] = 0xFF;
          jpegFrame[readLength + totalFrameSize - 1] = 0xD9;
          //call decoder
          frmCnt++;
          decodedData.frameData = null;
          if (isBackup !== true || playback !== true) {
            decoder.setResolution(width, height);
            decodedData.frameData = decoder.decode(jpegFrame.subarray(0, readLength));
          }
          decodedData.timeStamp = null;

          //call decoder callback
          if (playback == true) {
            timeData = (timeData.timestamp == null ? this.GetTimeStamp() : timeData);
            decodedData.timeStamp = timeData;
            // this.rtpBufferingCbFunc(jpegFrame.subarray(0, readLength), timeData, "jpeg", this.rtpPayloadCbFunc);
          }
          if (isBackup === true) {
            data.backupData = {
              'stream': jpegFrame.subarray(0, readLength),
              'width': width,
              'height': height,
              'codecType': 'mjpeg'
            };
            if (timeData.timestamp !== null && timeData.timestamp !== undefined) {
              data.backupData.timestamp_usec = timeData.timestamp_usec;
            } else {
              data.backupData.timestamp = (rtpTimeStamp / 90).toFixed(0);
            }
          }
          readLength = 0;
          data.decodedData = decodedData;
          if (decodeMode !== "canvas") {
            data.decodeMode = "canvas";
          }
          return data;
        }
      }
    },
    bufferingRtpData: function (rtspInterleaved, rtpHeader, rtpPayload) {
      var channelId = rtspInterleaved[1];
      var NTPmsw, NTPlsw;
      var fsynctime = {};
      var data = {};
      var payloadsize = ((rtspInterleaved[2] << 8) + rtspInterleaved[3]) - 12; //RTP Header: 12 bytes
      var marker;
      if ((rtpHeader[1] & 0x80) === 0x80) {
        marker = 1;
        isSetStartTime = true;
        if (t0 != 0) {
          t1 = Date.now();
          timegap = t1 - t0;
        }
      } else {
        marker = 0;
        if (isSetStartTime) {
          t0 = Date.now();
        }
        isSetStartTime = false;
      }

      if (timegap > 300) //frame drop in case of packetize slow more than 300ms
        return;

      //console.log("rtp header byte",rtpHeader[0]);

      if ((rtpHeader[0] & 0x10) === 0x10) {
        //RTP Header Extension bit set
        if (rtpPayload[0] == '0xAB' && rtpPayload[1] == '0xAD') {
          extensionHeaderLen = 16; //16 byte Replay Extension header
          if (rtpPayload[extensionHeaderLen] == '0xFF' && rtpPayload[extensionHeaderLen + 1] == '0xD8') {
            extensionHeaderLen += ((rtpPayload[extensionHeaderLen + 2] << 8 | rtpPayload[extensionHeaderLen + 3]) * 4) + 4; //MJPEG extensionHeader
          }
          playback = true;

          var startHeader = 4;
          NTPmsw = new Uint8Array(new ArrayBuffer(4));
          NTPmsw.set(rtpPayload.subarray(startHeader, startHeader + 4), 0);

          ntpmsw = this.ntohl(NTPmsw);
          startHeader += 4;

          NTPlsw = new Uint8Array(new ArrayBuffer(4));
          NTPlsw.set(rtpPayload.subarray(startHeader, startHeader + 4), 0);

          ntplsw = this.ntohl(NTPlsw);
          startHeader += 4;
          var microseconds = (this.ntohl(NTPlsw) / 0xffffffff) * 1000;
          fsynctime.seconds = ((ntpmsw - 0x83AA7E80) >>> 0);
          fsynctime.useconds = microseconds;

          startHeader += 2;
          var gmt = new Uint8Array(new ArrayBuffer(2));
          gmt.set(rtpPayload.subarray(startHeader, startHeader + 2), 0);
          gmt = (((gmt[0] << 8) | gmt[1]) << 16) >> 16;

          timeData = {
            timestamp: fsynctime.seconds,
            timestamp_usec: fsynctime.useconds,
            timezone: gmt
          };
          //this.SetTimeStamp(timeData);
          //this.rtpTimestampCbFunc(timeData);
        } else if (rtpPayload[0] == '0xFF' && rtpPayload[1] == '0xD8') {
          extensionHeaderLen = ((rtpPayload[2] << 8 | rtpPayload[3]) * 4) + 4; //MJPEG extensionHeader
        }
      } else {
        extensionHeaderLen = 0;
      }

      var fragmentOffset = rtpPayload[extensionHeaderLen + 1] << 16 | rtpPayload[extensionHeaderLen + 2] << 8 | rtpPayload[extensionHeaderLen + 3];

      rtpTimeStamp = new Uint8Array(new ArrayBuffer(4));
      rtpTimeStamp.set(rtpHeader.subarray(4, 8), 0);
      rtpTimeStamp = this.ntohl(rtpTimeStamp);

      if (fragmentOffset === 0) {
        //start of MJPEG frame
        //Create JPEG Frame Header
        curFrameSize = 0;
        specialHeaderSize = getspecialheadersize(rtpPayload) + extensionHeaderLen;
        jpegDataSize = payloadsize - specialHeaderSize;
        var jpegStartHeader = createjpegheader(rtpPayload);
        var jpegStartHeaderSize = jpegStartHeader.length;

        // console.log("mjpegFrameBuilder- payloadsize: specialHeaderSize: startheaderSize:", payloadsize , specialHeaderSize,jpegStartHeaderSize);

        if (marker === 1) {
          totalFrameSize = jpegStartHeaderSize + jpegDataSize + 2;
          //jpegFrame = new Uint8Array(new ArrayBuffer(totalFrameSize));

          //Add JPEG Start Hedaer
          //Append JPEG Scan data
          jpegFrame.set(jpegStartHeader, 0);
          readLength += jpegStartHeaderSize;

          jpegFrame = this.appendBuffer(jpegFrame, rtpPayload.subarray(specialHeaderSize, payloadsize), readLength);
          readLength += payloadsize;
          //ADD EOL;
          jpegFrame[totalFrameSize - 2] = 0xFF;
          jpegFrame[totalFrameSize - 1] = 0xD9;
          frmCnt++;
          if (this.videoBufferList !== null) {
            this.videoBufferList.push(new Uint8Array(jpegFrame.subarray(0, readLength)), width, height, 'mjpeg', 'I', timeData);
          }
          readLength = 0;
        } else {
          totalFrameSize = jpegStartHeaderSize + jpegDataSize;

          if (jpegFrame.length == 0) {
            jpegFrame = new Uint8Array(1024 * 1024);
          }

          jpegFrame.set(jpegStartHeader, 0);
          readLength += jpegStartHeaderSize;

          jpegFrame = this.appendBuffer(jpegFrame, rtpPayload.subarray(specialHeaderSize, payloadsize), readLength);
          readLength += payloadsize - specialHeaderSize;

          //console.log("Partial JPEG frame");
        }
      } else {
        //skip specialHeader Bytes
        specialHeaderSize = 8 + extensionHeaderLen;
        var Type = rtpPayload[extensionHeaderLen + 4];
        if (Type > 63) {
          specialHeaderSize += 4;
        }
        //console.log("mjpegFrameBuilder-2 payloadsize: specialHeaderSize:", payloadsize , specialHeaderSize);
        if (payloadsize < specialHeaderSize) {
          //We got only partail jpeg header
          skipHeaderBytes = specialHeaderSize - payloadsize;
          console.log("We got only partial JPEG Header this should not happen");
          return;
        } else {
          skipHeaderBytes = specialHeaderSize;
        }

        jpegDataSize = payloadsize - skipHeaderBytes;
        totalFrameSize = jpegDataSize;
        if (marker === 1) {
          totalFrameSize += 2;
        }
        // console.log("MJPEG Current frame size:",totalFrameSize);

        jpegFrame = this.appendBuffer(jpegFrame, rtpPayload.subarray(skipHeaderBytes, payloadsize), readLength);

        readLength += payloadsize - skipHeaderBytes;
        if (marker === 1) {
          jpegFrame[readLength + totalFrameSize - 2] = 0xFF;
          jpegFrame[readLength + totalFrameSize - 1] = 0xD9;

          //call decoder
          frmCnt++;
          if (this.videoBufferList !== null) {
            this.videoBufferList.push(new Uint8Array(jpegFrame.subarray(0, readLength)), width, height, 'mjpeg', 'I', timeData);
          }
          readLength = 0;
        }
      }
    },
    stepForward: function () {
      if (this.videoBufferList !== null) {
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
            decoder.setResolution(width, height);
            data.frameData = decoder.decode(new Uint8Array(bufferNode.buffer));
            data.timeStamp = bufferNode.timeStamp;
            return data;
          }
        } else {
          return false;
        }
      }
    },
    stepBackward: function () {
      if (this.videoBufferList !== null) {
        //        console.log("stepBackward stepValue = BACKWARD, videoBufferList.length = " + videoBufferList._length + ", FrameNum = " + videoBufferList.getCurIdx());
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
          decoder.setResolution(width, height);
          data.frameData = decoder.decode(new Uint8Array(bufferNode.buffer));
          data.timeStamp = bufferNode.timeStamp;
          return data;
        }
      }
    }
  });

  return new Constructor();
};
