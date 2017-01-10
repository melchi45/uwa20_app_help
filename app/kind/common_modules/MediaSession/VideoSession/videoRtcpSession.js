var RtcpSession = function(clockfreq){  
  var ntpmsw,
    ntplsw,
    rtptimestamp,
    fsynctimestamp = 0,
    fsynctime = {},
    timestampfrequency = clockfreq;
  
  function noteIncomingSR(ntpmsw, ntplsw, rtptimestamp) {
    var microseconds = (ntplsw*15625.0)/0x04000000;       
    fsynctime.seconds = ntpmsw - 0x83AA7E80;        
    fsynctime.useconds = microseconds+0.5;
    fsynctimestamp = rtptimestamp;
  }

  function Constructor() {}

  Constructor.prototype = inheritObject(new RtpSession(), {
    SendRtpData: function(rtspInterleaved, rtpHeader, rtpPayload) {
      var startHeader = 0;
      var RTCPSize = rtpPayload.length + 12;
      var rtcpbuffer = new Uint8Array(new ArrayBuffer(RTCPSize));

      rtcpbuffer.set(rtpHeader,0);
      rtcpbuffer.set(rtpPayload,12);

      var rc = rtcpbuffer[0] & 0x1F; 
      var pt = rtcpbuffer[1];
      var length = 4*((rtcpbuffer[2] << 8) + rtcpbuffer[3]) + 1; // doesn't count hdr
      startHeader += 4;
     
      var reportSenderSSRC = new Uint8Array(new ArrayBuffer(4));
      reportSenderSSRC.set(rtcpbuffer.subarray(startHeader,startHeader+4),0);
      startHeader += 4;          
     
      if(pt === 200)
      {                  
          var NTPmsw = new Uint8Array(new ArrayBuffer(4));
          NTPmsw.set(rtcpbuffer.subarray(startHeader,startHeader+4),0);
         
          ntpmsw = this.ntohl(NTPmsw);                
          startHeader += 4;

          var NTPlsw = new Uint8Array(new ArrayBuffer(4));
          NTPlsw.set(rtcpbuffer.subarray(startHeader,startHeader+4),0);
        
          ntplsw = this.ntohl(NTPlsw); 
          startHeader += 4;

          var rtpTimestamp = new Uint8Array(new ArrayBuffer(4));
          rtpTimestamp.set(rtcpbuffer.subarray(startHeader,startHeader+4),0);
       
          rtptimestamp = this.ntohl(rtpTimestamp);

          startHeader += 4;                 

          //console.log("NTP TimeStamp: msb: lsb: rtptime:", ntpmsw, ntplsw, rtptimestamp);

          noteIncomingSR(ntpmsw, ntplsw, rtptimestamp);         
      }
    },

    calculatePacketTime: function(rtpTimeStamp) {
      var PresentationTime = {};
      var timestampdiff = rtpTimeStamp - fsynctimestamp;
      var timeDiff = timestampdiff/timestampfrequency; //timestamp freqency comes from SDP         

      var million = 1000000;
      var seconds, uSeconds;

      if(fsynctime.seconds === 0)
      {
          fsynctime.seconds = Math.round( new Date()/1000);
          fsynctime.useconds = 0;
      }

      if (timeDiff >= 0.0) {
        seconds = fsynctime.seconds + timeDiff;
        uSeconds = fsynctime.useconds
          + ((timeDiff - timeDiff)*million);
        if (uSeconds >= million) {
          uSeconds -= million;
          ++seconds;
        }
      } else {
        timeDiff = -timeDiff;
        seconds = fsynctime.seconds - (timeDiff);
        uSeconds = fsynctime.useconds
          - ((timeDiff -timeDiff)*million);
        if (uSeconds < 0) {
          uSeconds += million;
          --seconds;
        }
      }

      PresentationTime.tv_sec = seconds;
      PresentationTime.tv_usec = uSeconds;

      return PresentationTime;
    }
  });

  return new Constructor();
};