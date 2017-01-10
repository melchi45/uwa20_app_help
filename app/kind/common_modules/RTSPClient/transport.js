/* global Uint8Array, ArrayBuffer, FileReader, WebSocket */
var Transport = function (serverAddr) {
  "use strict";
  var module = {};
  var websock = null;
  var rtspCallback;
  var rtpCallback;

  //rtp packet data buffer
  var rtpPacketArray;
  //rtsp response buffer
  var RTSPResArray;
  //partial rtp pcaket data buffer
  var partialRtpPacketArray;
  //partial rtsp response buffer
  var partialRTSPResArray;
  //rtsp interleave header
  var rtspinterleave;
  //rtp header
  var rtpheader;

  //current socket buffer position
  var curpos = 0;
  var partialCurpos = 0;
   
  var totalsockData =  0;
  var sockDataRead = 0;
  var sockDataRemaining = 0;

  var IsPartialRTPData = false;
  var IsPartialRTSPData = false;

  var RTPPacketTotalSize = 0;
  var RTPPacketBytesRead = 0;
  var RTPPacketRemaningBytes =  0;
  var RTPDataRemaningBytes = 0;
  var RTSPDataRead = 0;
  var rtspmsgcnt = 0;
  var rtppcktcnt = 0;

  var IsDescribe = false;
  var describekey = false;
  var tempBuffer = null;
  var tempBufferLen = 0;
  var connectionCallback = null;

  var stringToUint8Array = function (inputString) {
    var stringLength = inputString.length;
    var outputUint8Array = new Uint8Array(new ArrayBuffer(stringLength));

    for (var i = 0; i < stringLength; i++) {
        outputUint8Array[i] = inputString.charCodeAt(i);
    }
    return outputUint8Array;
  };

 //   var u16toInteger = function (inputArray) {
 //       return inputArray[0] * 256 + inputArray[1];
 //   };
  var PreceiveUint8 = new Uint8Array();
  var ReadSocketData = function(receiveBlobMsg) {
    var receiveUint8 = new Uint8Array(receiveBlobMsg);
    //Append the new received socket data
	var tmp = PreceiveUint8;
    PreceiveUint8 = new Uint8Array(tmp.length + receiveUint8.length);
	PreceiveUint8.set(tmp, 0);
	PreceiveUint8.set(receiveUint8, tmp.length);
		
    sockDataRemaining = PreceiveUint8.length;
	//	console.log("sockDataRemaining:before while ", sockDataRemaining);
    while(sockDataRemaining > 0) {
      //serach for $;
      //var searchMsg = String.fromCharCode.apply(null, receiveUint8);
      //var posret = searchMsg.indexOf("$", curpos);
      if(PreceiveUint8[0] !== 0x24) // the case of RTSP
      {
        //copy rtsp data to rtsp buffer
        //check for rtsp data is complete or not
        var PreceiveMsg = String.fromCharCode.apply(null, PreceiveUint8);
        var rtspendpos = null;
        if(IsDescribe === true) {
          rtspendpos= PreceiveMsg.lastIndexOf("\r\n");
          IsDescribe = false;
        } else {
          rtspendpos = PreceiveMsg.search("\r\n\r\n");
        }
         
        var rtspstartpos = PreceiveMsg.search("RTSP");
        if(rtspstartpos !== -1 ) {
          if(rtspendpos !== -1) {
            //rtsp response complete
            RTSPResArray = PreceiveUint8.subarray(rtspstartpos, rtspendpos+4);
			PreceiveUint8 = PreceiveUint8.subarray(rtspendpos+4);
            var receiveMsg = String.fromCharCode.apply(null, RTSPResArray);
            //we got complete rtsp response - inform to rtsp client
            rtspCallback(receiveMsg);
			sockDataRemaining = PreceiveUint8.length;
          } else {
            //rtsp response is partial - we do not know size of rtsp remaining bytes here,
			// just keep holding the remained data
            sockDataRemaining = PreceiveUint8.length;
            return;
          }
		} else {
		  console.log("Invalid rtsp data in the channel: 2");
          return;
        }
      } else {// case of $ in the firsts position
        //copy data to rtp buffer
        //check rtp data is complete or not
        rtspinterleave = PreceiveUint8.subarray(0,4);// 4 is the size of interleav header
        RTPPacketTotalSize = rtspinterleave[2]*256 + rtspinterleave[3];// rtp packet size
        if(RTPPacketTotalSize+4 <= PreceiveUint8.length ) {
          rtpheader = PreceiveUint8.subarray(4,16);
          rtpPacketArray = PreceiveUint8.subarray(16, RTPPacketTotalSize+4);
		  rtpCallback(rtspinterleave,rtpheader,rtpPacketArray);
		  PreceiveUint8 = PreceiveUint8.subarray(RTPPacketTotalSize+4);
		  sockDataRemaining = PreceiveUint8.length;
		  //	console.log("sockDataRemaining after RTP ", sockDataRemaining);
        } else {
          //rtp response is partial - we do not know size of rtsp remaining bytes here,
		  // just keep holding the remained data
		  sockDataRemaining = PreceiveUint8.length;
		  //		console.log("A part of RTP is still remaining", sockDataRemaining);
          return;
        }
      }
    }
  };

    //Receive RTSP/RTP/RTCP data from web socket
  var OnReceive = function(event) {
    var receiveBlobMsg = event.data;
    ReadSocketData(receiveBlobMsg);
  };

  module.SetCallback = function (connectionCbFunc, rtspCbFunc, rtpCbFunc) {
    rtspCallback = rtspCbFunc;
    rtpCallback = rtpCbFunc;
    connectionCallback = connectionCbFunc;
  };

  module.Connect = function () {
    websock = new WebSocket(serverAddr);
    websock.binaryType = 'arraybuffer';
    websock.onmessage = OnReceive;
    websock.onopen = function (message) {
      connectionCallback('open', message);
    };
    websock.onerror = function (error) {
      console.log("Websocket error");
      connectionCallback('error', error);
    };
  };

  module.Disconnect = function () {
    if(websock !== null && websock.readyState === WebSocket.OPEN) {
      websock.close();
      websock = null;
    }
       
    console.log("----- Disconnect websock-------");
  };

  module.SendRtspCommand = function (sendMessage) {
    if(websock !== null && websock.readyState === WebSocket.OPEN) {
      if(describekey === false) {
        var describeCmd = sendMessage.search("DESCRIBE");
        if(describeCmd !== -1) {
          IsDescribe = true;
          describekey = true;
        }
      }

      websock.send(stringToUint8Array(sendMessage));
      //console.log('----- send message -----\n' + sendMessage);
    }
  };

  module.SendRtpData = function (rtpdata) {
    if(websock !== null && websock.readyState === WebSocket.OPEN) {
      websock.send(rtpdata);
    } else {
      console.log("SendRtpData - Web socket does not exist");
    }
  };

  module.close = function () {
    if(websock.readyState === WebSocket.OPEN){
      websock.close();
      websock = null;
    }
    console.log("----- close websock-------");
  };

  return module;
};