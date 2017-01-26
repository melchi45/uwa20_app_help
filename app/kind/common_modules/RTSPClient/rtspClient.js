var RtspClient = function () {
  "use strict";
  var module = {};
  var rtspUrl;
  var id;
  var pw;
  var userAgent;
  var audioOutStatus = 'off';
  var Authentication = '';
  var SDPinfo = [];
  var transport;
  var digestGenerator = new DigestGenerator();
  var CSeq = 1;
  var sunapiClient;

  var errorCallbackFunc;

  var rtspSDPData = {};

  var currentState;
  var nextState;
  var setupSDPIndex;

  var SessionId = null;
  var mode = '';
  var flag = true;
  var audioTalkServiceStatus = false;
  var getParameterIntervalHandler = null;
  var checkAliveIntervalHandler = null;
  var isRTPRunning = true;

  var AACCodecInfo = {};

  var CommandConstructor = function (method, requestURL, extHeader) {
    var sendMessage = '';
    var AudioBackChannel = 'Require: www.onvif.org/ver20/backchannel\r\n';
    var UserAgentField = 'User-Agent: '+ userAgent +'\r\n';

    switch (method) {
      case 'OPTIONS':
      case 'TEARDOWN':
      case 'GET_PARAMETER':
      case 'SET_PARAMETERS':
        sendMessage = method + ' ' + rtspUrl + ' RTSP/1.0\r\nCSeq: ' + CSeq + '\r\n' + Authentication + UserAgentField + '\r\n';
        break;
      case 'DESCRIBE':
        if(audioOutStatus == 'on') {
          sendMessage = method + ' ' + rtspUrl + ' RTSP/1.0\r\nCSeq: ' + CSeq + '\r\n' + Authentication + AudioBackChannel + UserAgentField + '\r\n';
        } else {
          sendMessage = method + ' ' + rtspUrl + ' RTSP/1.0\r\nCSeq: ' + CSeq + '\r\n' + Authentication + UserAgentField + '\r\n';                
        }
        break;
      case 'SETUP':
        if(requestURL.toLowerCase().indexOf("rtsp:") !== -1) {
          sendMessage = method + ' ' + requestURL + ' RTSP/1.0\r\nCSeq: ' + CSeq + '\r\n' + Authentication + UserAgentField ;            
        } else {
          if(rtspSDPData.ContentBase !== undefined) {
            sendMessage = method + ' ' + rtspSDPData.ContentBase + requestURL + ' RTSP/1.0\r\nCSeq: ' + CSeq + '\r\n' + Authentication + UserAgentField ;
          } else {
            sendMessage = method + ' ' + rtspUrl + '/' + requestURL + ' RTSP/1.0\r\nCSeq: ' + CSeq + '\r\n' + Authentication + UserAgentField ;
          }
        }

        if (extHeader) {
          sendMessage += extHeader;
        }
        sendMessage += '\r\n';
        break;
      case 'PLAY':
        if (requestURL) {
          sendMessage = method + ' ' + requestURL + ' RTSP/1.0\r\n';
          rtspUrl = requestURL;
        } else {
          sendMessage = method + ' ' + rtspUrl + ' RTSP/1.0\r\n';
        }
        sendMessage += 'CSeq: ' + CSeq + '\r\n' + 'Session: ' + SessionId + '\r\n';
        sendMessage += UserAgentField;
        if(mode === 'playback' || mode === 'backup'){
          sendMessage += 'Require: samsung-replay-timezone' + '\r\n';
        }

        if (extHeader) {
          sendMessage += extHeader;
        }

        sendMessage += '\r\n';
        break;
      case 'PAUSE':
        if (requestURL) {
          sendMessage = method + ' ' + requestURL + ' RTSP/1.0\r\n';
          rtspUrl = requestURL;
        } else {
          sendMessage = method + ' ' + rtspUrl + ' RTSP/1.0\r\n';
        }
        sendMessage += 'CSeq: ' + CSeq + '\r\n' + 'Session: ' + SessionId + '\r\n';
        sendMessage += UserAgentField;

        if (extHeader) {
          sendMessage += extHeader;
        }

        sendMessage += '\r\n';
        break;
      default:
        break;
    }

    return sendMessage;
  };

  var parseDescribeResponse = function (message1) {
    var SDPData = {};
    var Sessions = [];
    SDPData.Sessions = Sessions;
    var message;

    if (message1.search("Content-Type: application/sdp") !== -1) {
      var messageTok = message1.split("\r\n\r\n");
      message = messageTok[1];
    } else {
      message = message1;
    }

    var TokenziedDescribe = message.split("\r\n");
    var cnt;
    var mediaFound = false;
    for (cnt = 0; cnt < TokenziedDescribe.length; cnt++) {
      var SDPLineTokens = TokenziedDescribe[cnt].split("=");
      if (SDPLineTokens.length > 0) {
        switch (SDPLineTokens[0]) {
          case 'a':
            var aLineToken = SDPLineTokens[1].split(":");
            if (aLineToken.length > 1) {
              if (aLineToken[0] == "control") {
                var pos = TokenziedDescribe[cnt].search("control:");
                if (mediaFound == true) {
                  if (pos !== -1) {
                    SDPData.Sessions[SDPData.Sessions.length - 1].ControlURL = TokenziedDescribe[cnt].substr(pos + 8);
                  }
                } else {
                  if (pos !== -1) {
                    SDPData.BaseURL = TokenziedDescribe[cnt].substr(pos + 8);
                  }
                }
              } else if (aLineToken[0] == "rtpmap") {
                var rtpmapLine = aLineToken[1].split(" ");
                SDPData.Sessions[SDPData.Sessions.length - 1].PayloadType = rtpmapLine[0];

                var MimeLine = rtpmapLine[1].split("/");
                SDPData.Sessions[SDPData.Sessions.length - 1].CodecMime = MimeLine[0];
                if (MimeLine.length > 1) {
                  SDPData.Sessions[SDPData.Sessions.length - 1].ClockFreq = MimeLine[1];
                }
              } else if (aLineToken[0] == "framesize") {
                var framesizeLine = aLineToken[1].split(" ");
                if (framesizeLine.length > 1) {
                  var framesizeinf = framesizeLine[1].split("-");
                  SDPData.Sessions[SDPData.Sessions.length - 1].Width = framesizeinf[0];
                  SDPData.Sessions[SDPData.Sessions.length - 1].Height = framesizeinf[1];
                }
              } else if (aLineToken[0] == "framerate") {
                SDPData.Sessions[SDPData.Sessions.length - 1].Framerate = aLineToken[1];
              } else if (aLineToken[0] == "fmtp") {

                var sessLine = TokenziedDescribe[cnt].split(" ");

                if(sessLine.length<2)
                  continue;
                for(var ii =1 ;ii<sessLine.length;ii++)
                {
                  var sessToken = sessLine[ii].split(";");
                  var sessprmcnt;
                  for(sessprmcnt = 0;sessprmcnt<sessToken.length;sessprmcnt++)
                  {
                    var ppos = sessToken[sessprmcnt].search("mode=");
                    if(ppos !== -1)
                    {
                      SDPData.Sessions[SDPData.Sessions.length - 1].mode = sessToken[sessprmcnt].substr(ppos + 5);
                    }

                    ppos = sessToken[sessprmcnt].search("config=");
                    if(ppos !== -1)
                    {
                      SDPData.Sessions[SDPData.Sessions.length - 1].config = sessToken[sessprmcnt].substr(ppos + 7);
                      AACCodecInfo.config = SDPData.Sessions[SDPData.Sessions.length - 1].config;
                      AACCodecInfo.clockFreq = SDPData.Sessions[SDPData.Sessions.length - 1].ClockFreq;
                      AACCodecInfo.bitrate = SDPData.Sessions[SDPData.Sessions.length - 1].Bitrate;
                    }

                    ppos = sessToken[sessprmcnt].search("sprop-vps=");
                    if (ppos !== -1) {
                      SDPData.Sessions[SDPData.Sessions.length - 1].VPS =  sessToken[sessprmcnt].substr(ppos + 10);
                    }

                    ppos = sessToken[sessprmcnt].search("sprop-sps=");
                    if (ppos !== -1) {
                      SDPData.Sessions[SDPData.Sessions.length - 1].SPS =  sessToken[sessprmcnt].substr(ppos + 10);
                    }

                    ppos = sessToken[sessprmcnt].search("sprop-pps=");
                    if (ppos !== -1) {
                      SDPData.Sessions[SDPData.Sessions.length - 1].PPS =  sessToken[sessprmcnt].substr(ppos + 10);
                    }

                    ppos = sessToken[sessprmcnt].search("sprop-parameter-sets=");
                    if (ppos !== -1) {
                      var SPSPPS = sessToken[sessprmcnt].substr(ppos + 21);
                      var SPSPPSTokenized = SPSPPS.split(",");
                      if (SPSPPSTokenized.length > 1) {
                        SDPData.Sessions[SDPData.Sessions.length - 1].SPS = SPSPPSTokenized[0];
                        SDPData.Sessions[SDPData.Sessions.length - 1].PPS = SPSPPSTokenized[1];
                      }
                    }

                  }
                }
              }

            }
            break;
          case 'm':
            var mLineToken = SDPLineTokens[1].split(" ");
            var Session = {};
            Session.Type = mLineToken[0];
            Session.Port = mLineToken[1];
            Session.Payload = mLineToken[3];
            SDPData.Sessions.push(Session);
            mediaFound = true;
            break;
          case 'b':
            if (mediaFound == true) {
              var bLineToken = SDPLineTokens[1].split(":");
              SDPData.Sessions[SDPData.Sessions.length - 1].Bitrate = bLineToken[1];
            }
            break;
        }
      }
    }
    return SDPData;
  };

  var parseRtspResponse = function (message1) {
    var RtspResponseData = {};
    var cnt, cnt1, ttt, LineTokens;

    /*Handling only the RTSP Response and not SDP*/
    var message;
    if (message1.search("Content-Type: application/sdp") !== -1) {
      var messageTok = message1.split("\r\n\r\n");
      message = messageTok[0];
    } else {
      message = message1;
    }

    var TokenziedResponseLines = message.split("\r\n");

    var ResponseCodeTokens = TokenziedResponseLines[0].split(" ");
    if (ResponseCodeTokens.length > 2) {
      RtspResponseData.ResponseCode = parseInt(ResponseCodeTokens[1]);
      RtspResponseData.ResponseMessage = ResponseCodeTokens[2];
    }

    if (RtspResponseData.ResponseCode === 200) {
      for (cnt = 1; cnt < TokenziedResponseLines.length; cnt++) {
        LineTokens = TokenziedResponseLines[cnt].split(":");
        if (LineTokens[0] === "Public") {
          RtspResponseData.MethodsSupported = LineTokens[1].split(",");
        } else if (LineTokens[0] === "CSeq") {
          RtspResponseData.CSeq = parseInt(LineTokens[1]);
        } else if (LineTokens[0] === "Content-Type") {
          RtspResponseData.ContentType = LineTokens[1];
          if (RtspResponseData.ContentType.search("application/sdp") !== -1) {
            RtspResponseData.SDPData = parseDescribeResponse(message1);
          }
        } else if (LineTokens[0] === "Content-Length") {
          RtspResponseData.ContentLength = parseInt(LineTokens[1]);
        } else if (LineTokens[0] === "Content-Base") {
          var ppos = TokenziedResponseLines[cnt].search("Content-Base:");
          if(ppos !== -1) {
            RtspResponseData.ContentBase = TokenziedResponseLines[cnt].substr(ppos + 13);
          }
        }else if (LineTokens[0] === "Session") {
          var SessionTokens = LineTokens[1].split(";");
          RtspResponseData.SessionID = parseInt(SessionTokens[0]);
        } else if (LineTokens[0] === "Transport") {
          var TransportTokens = LineTokens[1].split(";");
          for (cnt1 = 0; cnt1 < TransportTokens.length; cnt1++) {
            var tpos = TransportTokens[cnt1].search("interleaved=");
            if (tpos !== -1) {
              var interleaved = TransportTokens[cnt1].substr(tpos + 12);
              var interleavedTokens = interleaved.split("-");
              if (interleavedTokens.length > 1) {
                RtspResponseData.RtpInterlevedID = parseInt(interleavedTokens[0]);
                RtspResponseData.RtcpInterlevedID = parseInt(interleavedTokens[1]);
              }
            }
          }
        } else if (LineTokens[0] === "RTP-Info") {
          LineTokens[1] = TokenziedResponseLines[cnt].substr(9);
          var RTPInfoTokens = LineTokens[1].split(",");
          RtspResponseData.RTPInfoList = [];
          for (cnt1 = 0; cnt1 < RTPInfoTokens.length; cnt1++) {
            var RtpTokens = RTPInfoTokens[cnt1].split(";");
            var RtpInfo = {};
            var cnt2;
            for (cnt2 = 0; cnt2 < RtpTokens.length; cnt2++) {
              var poss = RtpTokens[cnt2].search("url=");
              if (poss !== -1) {
                RtpInfo.URL = RtpTokens[cnt2].substr(poss + 4);
              }
              poss = RtpTokens[cnt2].search("seq=");
              if (poss !== -1) {
                RtpInfo.Seq = parseInt(RtpTokens[cnt2].substr(poss + 4));
              }

            }
            RtspResponseData.RTPInfoList.push(RtpInfo);
          }

        }

      }
    } else if (RtspResponseData.ResponseCode === 401) {
      for (cnt = 1; cnt < TokenziedResponseLines.length; cnt++) {
        LineTokens = TokenziedResponseLines[cnt].split(":");
        if (LineTokens[0] === "CSeq") {
          RtspResponseData.CSeq = parseInt(LineTokens[1]);
        } else if (LineTokens[0] === "WWW-Authenticate") {
          var AuthTokens = LineTokens[1].split(",");
          for (cnt1 = 0; cnt1 < AuthTokens.length; cnt1++) {
            var pos = AuthTokens[cnt1].search("Digest realm=");
            if (pos !== -1) {
              ttt = AuthTokens[cnt1].substr(pos + 13);
              var realmtok = ttt.split("\"");
              RtspResponseData.Realm = realmtok[1];
            }
            pos = AuthTokens[cnt1].search("nonce=");
            if (pos !== -1) {
              ttt = AuthTokens[cnt1].substr(pos + 6);
              var noncetok = ttt.split("\"");
              RtspResponseData.Nonce = noncetok[1];
            }
          }
        }
      }
    }

    return RtspResponseData;
  };

  var formDigestAuthHeader = function (stringMessage) {
    var wwwAuthenticate = stringMessage.slice(stringMessage.search("WWW-Authenticate"), stringMessage.length);
    var digestInfo = digestGenerator.getDigestInfoInWwwAuthenticate(wwwAuthenticate);
    var responseValue;
    var getData = {};

    getData.Method = currentState.toUpperCase();
    getData.Realm = digestInfo.realm;
    getData.Nonce = digestInfo.nonce;
    getData.Uri = encodeURIComponent(rtspUrl);

    sunapiClient.get('/stw-cgi/security.cgi?msubmenu=digestauth&action=view', getData,
      function(response) {
        responseValue = response.data.Response;
        Authentication = 'Authorization:' + ' Digest ' + 'username="' + id + '", ' + 'realm="' + digestInfo.realm + '", ' + 'nonce="' + digestInfo.nonce + '", ' + 'uri="' + rtspUrl + '", ' + 'response="' + responseValue + '"\r\n';                                
        SendUnauthorizedRtspCmd();
      },
      function(errorData,errorCode) {
        console.error(errorData);
      },'',true);

  };

  var SendUnauthorizedRtspCmd = function(){
    var extraheader = '';
    if (currentState === 'Options') {
      transport.SendRtspCommand(CommandConstructor('OPTIONS', null, null));
    } else if (currentState === 'Describe') {
      transport.SendRtspCommand(CommandConstructor('DESCRIBE', null, null));
    } else if (currentState === 'Setup') {
      extraheader = 'Transport: RTP/AVP/TCP;unicast;interleaved=' + (2*setupSDPIndex).toString() + '-' + ((2*setupSDPIndex) + 1).toString() + '\r\n';
      transport.SendRtspCommand(CommandConstructor('SETUP', SDPinfo[setupSDPIndex].trackID, extraheader));
    } else if (currentState === 'Play') {
      if(mode === 'playback') {
        extraheader = 'Immediate: yes' + '\r\n'+ 'Scale: ' + '1.000000' + '\r\n' + 'Range: npt=0.000-' + '\r\n' + 'Rate-Control: yes' + '\r\n';
      } else if(mode === 'backup') {
        /*download mode*/
        extraheader += 'Rate-Control: no' + '\r\n';
      }
      transport.SendRtspCommand(CommandConstructor('PLAY', null, extraheader));
    } else if (currentState === 'Pause') {
      transport.SendRtspCommand(CommandConstructor('PAUSE', null, null));
    } else if (currentState === 'Teardown') {
      transport.SendRtspCommand(CommandConstructor('TEARDOWN', null, null));
    }        
  };

  var checkIsAvaliablePlayback = function(mode) {
    var playbackAliveCount = 0;
    if(mode === 'backup' || mode === 'playback' ){
      if( checkAliveIntervalHandler === null) {
        checkAliveIntervalHandler = setInterval(function(){
          if( !isRTPRunning ) {
            if( playbackAliveCount > 3 ) {
              clearInterval(checkAliveIntervalHandler);
              checkAliveIntervalHandler = null;
              errorCallbackFunc({
                errorCode: "990",
                description: "end of backup",
                place: "RtspClient.js"
              });
              console.log("RTP disconnection detect!!!");
              return;
           }
           playbackAliveCount++;
          }
          else {
            playbackAliveCount = 0;
          }
          isRTPRunning = false;
        },1000);
      }
    }
  };

  var RtspResponseHandler = function (stringMessage) {
    var rtspResponseMsg = {};
    var extraheader = '';
    var seekPoint = stringMessage.search('CSeq: ') + 5;
    CSeq = parseInt(stringMessage.slice(seekPoint, seekPoint + 10)) + 1;
    rtspResponseMsg = parseRtspResponse(stringMessage);

    if (rtspResponseMsg.ResponseCode === 401 && Authentication === '') {
      /*unauthorized*/
      formDigestAuthHeader(stringMessage);
    } else if (rtspResponseMsg.ResponseCode === 200) {
      if (currentState === 'Options') {
        currentState = 'Describe';
        transport.SendRtspCommand(CommandConstructor('DESCRIBE', null, null));
        nextState = 'Setup';
      } else if (currentState === 'Describe') {
        /*Parse Describe Response*/
        audioTalkServiceStatus = false;
        rtspSDPData = parseDescribeResponse(stringMessage);
        if(rtspResponseMsg.ContentBase !== undefined)
        {
          rtspSDPData.ContentBase = rtspResponseMsg.ContentBase;
        }

        var idx = 0;
        var sessionIndex;
        for (idx = 0; idx < rtspSDPData.Sessions.length; idx = idx + 1) {
          var sdpInfoObj = {};
          if (rtspSDPData.Sessions[idx].CodecMime === 'JPEG' || rtspSDPData.Sessions[idx].CodecMime === 'H264' || rtspSDPData.Sessions[idx].CodecMime === 'H265' ) {
            sdpInfoObj.codecName = rtspSDPData.Sessions[idx].CodecMime;
            sdpInfoObj.trackID = rtspSDPData.Sessions[idx].ControlURL;
            sdpInfoObj.ClockFreq = rtspSDPData.Sessions[idx].ClockFreq;
            sdpInfoObj.Port =  parseInt(rtspSDPData.Sessions[idx].Port);
            if( rtspSDPData.Sessions[idx].Framerate !== undefined ) {
              sdpInfoObj.Framerate = parseInt(rtspSDPData.Sessions[idx].Framerate);
            }
            SDPinfo.push(sdpInfoObj);
          } else if (rtspSDPData.Sessions[idx].CodecMime === 'PCMU' 
            || rtspSDPData.Sessions[idx].CodecMime.search('G726-16') !== -1 
            || rtspSDPData.Sessions[idx].CodecMime.search('G726-24') !== -1 
            || rtspSDPData.Sessions[idx].CodecMime.search('G726-32') !== -1 
            || rtspSDPData.Sessions[idx].CodecMime.search('G726-40') !== -1) {
            if (rtspSDPData.Sessions[idx].ControlURL.search('trackID=t') !== -1) {
              sdpInfoObj.codecName = 'G.711';
              sdpInfoObj.trackID = rtspSDPData.Sessions[idx].ControlURL;
              sdpInfoObj.Port =  parseInt(rtspSDPData.Sessions[idx].Port);
              sdpInfoObj.Bitrate = parseInt(rtspSDPData.Sessions[idx].Bitrate);
              SDPinfo.push(sdpInfoObj);
              audioTalkServiceStatus = true;
            } else {
              if (rtspSDPData.Sessions[idx].CodecMime === 'PCMU') {
                sdpInfoObj.codecName = 'G.711';
              } else if(rtspSDPData.Sessions[idx].CodecMime === 'G726-16') {
                sdpInfoObj.codecName = 'G.726-16';
              } else if(rtspSDPData.Sessions[idx].CodecMime === 'G726-24'){
                sdpInfoObj.codecName = 'G.726-24';
              } else if(rtspSDPData.Sessions[idx].CodecMime === 'G726-32'){
                sdpInfoObj.codecName = 'G.726-32';
              } else if(rtspSDPData.Sessions[idx].CodecMime === 'G726-40'){
                sdpInfoObj.codecName = 'G.726-40';
              }
              sdpInfoObj.trackID = rtspSDPData.Sessions[idx].ControlURL;
              sdpInfoObj.ClockFreq = rtspSDPData.Sessions[idx].ClockFreq;
              sdpInfoObj.Port =  parseInt(rtspSDPData.Sessions[idx].Port);
              sdpInfoObj.Bitrate = parseInt(rtspSDPData.Sessions[idx].Bitrate);
              SDPinfo.push(sdpInfoObj);
            }
          } else if(rtspSDPData.Sessions[idx].CodecMime === 'mpeg4-generic') {
            sdpInfoObj.codecName = 'mpeg4-generic';
            sdpInfoObj.trackID = rtspSDPData.Sessions[idx].ControlURL;
            sdpInfoObj.ClockFreq = rtspSDPData.Sessions[idx].ClockFreq;
            sdpInfoObj.Port =  parseInt(rtspSDPData.Sessions[idx].Port);
            sdpInfoObj.Bitrate = parseInt(rtspSDPData.Sessions[idx].Bitrate);
            SDPinfo.push(sdpInfoObj);
          } else if (rtspSDPData.Sessions[idx].CodecMime === 'vnd.onvif.metadata') {
            sdpInfoObj.codecName = 'MetaData';
            sdpInfoObj.trackID = rtspSDPData.Sessions[idx].ControlURL;
            sdpInfoObj.ClockFreq = rtspSDPData.Sessions[idx].ClockFreq;
            sdpInfoObj.Port =  parseInt(rtspSDPData.Sessions[idx].Port);

            SDPinfo.push(sdpInfoObj);
          } else {
            console.log("Unknown codec type:", rtspSDPData.Sessions[idx].CodecMime, rtspSDPData.Sessions[idx].ControlURL);
          }
        }
        setupSDPIndex = 0;
        currentState = 'Setup';
        extraheader = 'Transport: RTP/AVP/TCP;unicast;interleaved=' + (2*setupSDPIndex).toString() + '-' + ((2*setupSDPIndex) + 1).toString() + '\r\n';
        transport.SendRtspCommand(CommandConstructor('SETUP', SDPinfo[setupSDPIndex].trackID, extraheader));
        nextState = (SDPinfo.length > 1) ? 'Setup' : 'Play';

      } else if (currentState === 'Setup') {
        if (setupSDPIndex < SDPinfo.length) {
          SDPinfo[setupSDPIndex].RtpInterlevedID = rtspResponseMsg.RtpInterlevedID;
          SDPinfo[setupSDPIndex].RtcpInterlevedID = rtspResponseMsg.RtcpInterlevedID;

          setupSDPIndex += 1;
          if(setupSDPIndex !== SDPinfo.length){
            extraheader = 'Transport: RTP/AVP/TCP;unicast;interleaved=' + (2*setupSDPIndex).toString() + '-' + ((2*setupSDPIndex) + 1).toString() + '\r\n';
            transport.SendRtspCommand(CommandConstructor('SETUP', SDPinfo[setupSDPIndex].trackID, extraheader));
          }else{
            workerManager.sendSdpInfo(SDPinfo, AACCodecInfo, audioTalkServiceStatus);
            if(audioTalkServiceStatus){
              workerManager.setCallback('audioTalk', module.SendAudioTalkData);    
            }
            currentState = 'Play';
            if(mode === 'playback')
            {
              extraheader = 'Immediate: yes' + '\r\n'+ 'Scale: ' + '1.000000' + '\r\n' + 'Range: npt=0.000-' + '\r\n' + 'Rate-Control: yes' + '\r\n';
            }else if(mode === 'backup') {
              extraheader += 'Rate-Control: no' + '\r\n';
            }
            transport.SendRtspCommand(CommandConstructor('PLAY', null, extraheader));
            nextState = 'Playing';
            if( mode === 'backup' ) {
              setTimeout(function(){
                checkIsAvaliablePlayback(mode);
              }, 1000);
            }
          }
        } else {
          console.log("Unknown setup SDP index");
        }
      } else if (currentState === 'Play') {
        // console.log("RTSP player respose: ");
        // console.log(rtspResponseMsg);
        SessionId = rtspResponseMsg.SessionID;
        errorCallbackFunc({
          errorCode: "200",
          description: "Streaming start",
          place: "RtspClient.js"
        });

        /*for maintain rtsp connection*/
        getParameterIntervalHandler = setInterval(function () {     
          if(transport){
            transport.SendRtspCommand(CommandConstructor('GET_PARAMETER', null, null));
          }
        }, 10000);

        var aliveCounter = 0;

        if(mode === 'live'){
          checkAliveIntervalHandler = setInterval(function(){ 
            if(!isRTPRunning){
              if(aliveCounter > 3){
                clearInterval(checkAliveIntervalHandler);
                errorCallbackFunc({
                  errorCode: "999",
                  description: "no rtsp response",
                  place: "RtspClient.js"
                });
                console.log("RTP disconnection detect!!!");
                return;
              }
              aliveCounter++;
            }

            isRTPRunning = false;
          }, 1000);
        }
        else if( mode === 'backup' ) {
          checkIsAvaliablePlayback(mode);
        }
        else if( mode === 'playback' ) {
          setTimeout(function(){
            checkIsAvaliablePlayback(mode);
          }, 1000);
        }

        currentState = 'Playing';
      } else if (currentState === 'Playing') {
        /*for live GET_PARAMETER rtsp response comes here*/
      } else {
        console.log("unknown rtsp state:", currentState);
      }
    } else if (rtspResponseMsg.ResponseCode === 503) {
      if (currentState === 'Setup' && SDPinfo[setupSDPIndex].trackID.search('trackID=t') !== -1) {

        SDPinfo[setupSDPIndex].RtpInterlevedID = -1;
        SDPinfo[setupSDPIndex].RtcpInterlevedID = -1;

        /*skip the sesson*/
        setupSDPIndex += 1;
        audioTalkServiceStatus = false;

        errorCallbackFunc({
          errorCode: "504",
          description: "Talk Service Unavilable",
          place: "RtspClient.js"
        });

        if (setupSDPIndex < SDPinfo.length) {
          extraheader = 'Transport: RTP/AVP/TCP;unicast;interleaved=' + (2*setupSDPIndex).toString() + '-' + ((2*setupSDPIndex) + 1).toString() + '\r\n';
          transport.SendRtspCommand(CommandConstructor('SETUP', SDPinfo[setupSDPIndex].trackID, extraheader));
        } else {
          currentState = 'Play';
          if(mode === 'playback')
          {
            extraheader = 'Immediate: yes' + '\r\n'+ 'Scale: ' + '1.000000' + '\r\n' + 'Range: npt=0.000-' + '\r\n' + 'Rate-Control: yes' + '\r\n';
          }
          transport.SendRtspCommand(CommandConstructor('PLAY', null, extraheader));
          nextState = 'Playing';
        }
      } else {
        // console.log("2nd unknown rtsp state:", currentState);
        errorCallbackFunc({
          errorCode: "503",
          description: "Service Unavilable",
          place: "RtspClient.js"
        });
      }
    } else if(rtspResponseMsg.ResponseCode === 404){
      if(currentState === 'Options'){
        errorCallbackFunc({
          errorCode: "404",
          description: "rtsp not found",
          place: "RtspClient.js"
        });
        return;
      }
    }
  };

  var RtpDataHandler = function (rtspinterleave, rtpheader, rtpPacketArray) {
    workerManager.sendRtpData(rtspinterleave, rtpheader, rtpPacketArray);
    isRTPRunning = true;
  };

  module.SendAudioTalkData = function(rtpdata) {
    if(transport && audioTalkServiceStatus && audioOutStatus === 'on') {
      transport.SendRtpData(rtpdata);
    }
  };

  var connectionCbFunc = function (type, message) {
    if (type === 'open') {
      currentState = 'Options';
      nextState = 'Describe';
      transport.SendRtspCommand(CommandConstructor('OPTIONS', null, null));
    } else if (type === 'error') {
      console.log(message);
    }
  };

  module.SetErrorCallback = function (callbackFunc) {
    errorCallbackFunc = callbackFunc;
  };    

  module.SetSunapiClient = function(sunapiClientObj){
    sunapiClient = sunapiClientObj;
  };

  module.SetDeviceInfo = function (deviceInfo) {
    id = deviceInfo.id;
    pw = deviceInfo.pw;
    rtspUrl = deviceInfo.rtspUrl;
    mode = deviceInfo.mode;
    userAgent = deviceInfo.useragent;
    audioOutStatus = deviceInfo.audioOutStatus;
    transport = new Transport(deviceInfo.wsUrl);
  };

  module.Connect = function () {
    if (transport) {
      transport.SetCallback(connectionCbFunc, RtspResponseHandler, RtpDataHandler);
      transport.Connect();
    }
  };

  module.Disconnect = function () {
    if (transport) {
      transport.SendRtspCommand(CommandConstructor('TEARDOWN', null, null));
      transport.Disconnect();
      transport = null;
      clearInterval(getParameterIntervalHandler);
      clearInterval(checkAliveIntervalHandler);
      getParameterIntervalHandler = null;
      checkAliveIntervalHandler = null;
    }
    SDPinfo = [];
    Authentication  = '';
  };

  module.close = function () {
    transport.close();
  };

  // module.GetPacketTimeStamp = function (Channel, rtpTimeStamp) {
  //   var pakTimeStamp = {};

  //   for (idx = 0; idx < SDPinfo.length; idx = idx + 1) {
  //     if (Channel === SDPinfo[idx].RtpInterlevedID) {
  //       pakTimeStamp = rtcpSessionsArray[idx].calculatePacketTime(rtpTimeStamp);
  //       break;
  //     }
  //   }
  //   return pakTimeStamp;
  // }

  module.ControlStream = function(controlInfo) {
    var extraheader = '';
    var cmd = null;

    if (transport) {
      if(controlInfo.media.requestInfo.cmd === 'resume') {
        /*PLAY command*/
        cmd = 'PLAY';
        if(controlInfo.media.type === 'playback') {
          extraheader += 'Scale: ' + controlInfo.media.requestInfo.scale + '\r\n' + 'Range: npt=0.000-' + '\r\n' + 'Rate-Control: yes' + '\r\n';
          if( controlInfo.media.needToImmediate === true ) {
            extraheader += 'Immediate: yes' + '\r\n';
          }
        } else if(controlInfo.media.type === 'backup') {
          /*download mode*/
          extraheader += 'Rate-Control: no' + '\r\n';
        }
        transport.SendRtspCommand(CommandConstructor(cmd, controlInfo.media.requestInfo.url, extraheader));
      } else if(controlInfo.media.requestInfo.cmd === 'seek') {
        /*Seek Command*/
        cmd = 'PLAY';
        if(controlInfo.media.type === 'playback') {
          extraheader += 'Immediate: yes' + '\r\n'+ 'Scale: ' + controlInfo.media.requestInfo.scale + '\r\n' + 'Range: npt=0.000-' + '\r\n' + 'Rate-Control: yes' + '\r\n';
        } 
        else if( controlInfo.media.type === 'step'){
          extraheader += 'Immediate: yes' + '\r\n'+ 'Scale: ' + controlInfo.media.requestInfo.scale + '\r\n' + 'Range: npt=0.000-' + '\r\n'+ 'Rate-Control: no' + '\r\n';
        }
        else if(controlInfo.media.type === 'backup') {
          /*download mode*/
          extraheader += 'Rate-Control: no' + '\r\n' + 'Immediate: yes' + '\r\n';
        } 
        transport.SendRtspCommand(CommandConstructor(cmd, controlInfo.media.requestInfo.url, extraheader));
      } else if(controlInfo.media.requestInfo.cmd === 'pause') {
        /*PAUSE command*/
        cmd = 'PAUSE';
        extraheader += 'Scale: ' + '1.000000' + '\r\n' + 'Range: npt=0.000-' + '\r\n';
        transport.SendRtspCommand(CommandConstructor(cmd, controlInfo.media.requestInfo.url, extraheader));
      } else if(controlInfo.media.requestInfo.cmd === 'speed') {
        /*FAST Forward or FAST Backward a stream*/
        cmd = 'PLAY'; 
        extraheader += "Scale: " + controlInfo.media.requestInfo.scale + "\r\n" + 'Range: npt=0.000-' + '\r\n';
        extraheader += 'Rate-Control: yes' + '\r\n';

        if(controlInfo.media.requestInfo.scale < -1 || controlInfo.media.requestInfo.scale > 1) {
          extraheader += 'Frames: intra' + '\r\n';
        }

        transport.SendRtspCommand(CommandConstructor(cmd, controlInfo.media.requestInfo.url, extraheader));
      } 
      else if(controlInfo.media.requestInfo.cmd === 'backup') {
        /*PLAY command*/
        cmd = 'PLAY';
        extraheader += 'Rate-Control: no' + '\r\n';
        transport.SendRtspCommand(CommandConstructor(cmd, controlInfo.media.requestInfo.url, extraheader));
      }
      else {
        console.log("RTSP ControlStream- Unknown command:",controlInfo.cmd);
      }
    } else {
      console.log("RTSP ControlStream- Web socket does not exist:");
    }
  };

  return module;
};
