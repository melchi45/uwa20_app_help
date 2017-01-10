kindFramework.factory('playbackStepService', ['$rootScope', '$filter',
    function($rootScope, $filter) { 
      "use strict";

      var bufferInfo = {
        frameData: null,
        timeStamp: null, 
        codec:"",
      };

      var defaultNum = 7;
      var currentNum = 7;
      var settingNum = 0;
      var jpegBackwardFrame = 1;

      var maxIframe = 6;
      var h264BufferMaxSize = maxIframe * 15;
      var jpegBufferMaxSize = h264BufferMaxSize / 3;
      var currentBufferSize = 0;
      var currentCodec = "h264";
      var iFrameArray = new Array(maxIframe);
      var iFrameCurrentNum = 0;
      var iFrameNum = 0;
      var settingCheck = false;
      var settingFlag = true;
      var decodeFunc = null;

      var requestTimeStamp = null;
      var currentTimeStamp = null;
      var startTimeStamp = null;
      var endTimeStamp = null;

      var stepBuffer = new Array(h264BufferMaxSize);
      for(var i = 0; i < stepBuffer.length; i++) {
        stepBuffer[i] = bufferInfo;
      }

      function init() {
        currentNum = 0;
        settingNum = 0;
        iFrameCurrentNum = 0;
        iFrameNum = 0;
        currentBufferSize = 0;
        decodeFunc = null;
        for(var i = 0; i < stepBuffer.length; i++) {
          stepBuffer[i] = bufferInfo;
        }
        settingCheck = false;
        console.log("playbackStepService init");
      }

      function getForward() {
        currentNum++;
        if (stepBuffer[currentNum].codec === "h264" || stepBuffer[currentNum].codec === "h265") {
          for (var i = 0; i < maxIframe; i++) {
            if (iFrameArray[i] >= currentNum) {
              iFrameCurrentNum = i;
              break;
            }
          }
        }
        console.log("playbackStepService getForward currentNum " + currentNum + ", time = " + calcTimeStamp(stepBuffer[currentNum].timeStamp));
        return stepBuffer[currentNum];
      }

      function getBackward() {
        if (stepBuffer[currentNum].codec === "h264" || stepBuffer[currentNum].codec === "h265") {
          currentNum = iFrameArray[--iFrameCurrentNum];
        } else {
          currentNum -= jpegBackwardFrame;
        }
        console.log("playbackStepService getBackward currentNum " + currentNum + ", time = " + calcTimeStamp(stepBuffer[currentNum].timeStamp));
        return stepBuffer[currentNum];
      }

      function calcTimeStamp(time) {
        var curTime = new Date(time.timestamp*1000);
        var calculatedTime = curTime.getTime() + curTime.getTimezoneOffset()*60*1000;
        if( typeof(time.timezone) !== 'undefined' && time.timezone !== null) {
          calculatedTime += time.timezone*60*1000;
        }
        curTime.setTime(calculatedTime);
        return $filter('date')(curTime, 'yyyyMMddHHmmss');
      }

      function setBufferData(frame, time, codec) {
        var frameTime = calcTimeStamp(time);

        if (codec === "h264" || codec === "h265") {
          currentCodec = codec;
          if (settingNum === 0 && (frame[4] === 0x67 &&  codec === "h264") || (frame[4] === 0x40 &&  codec === "h265")) {
            stepBuffer[settingNum] = {frameData:frame, timeStamp:time, codec:codec};
          } else if (settingNum !== 0) {
            stepBuffer[settingNum] = {frameData:frame, timeStamp:time, codec:codec};
          } else {
            return ;
          }

          if (settingNum === 0) {
            $rootScope.$emit('changeLoadingBar', true);
            settingFlag = true;
            console.log("playbackStepService buffering Start");
          }

          if ((frame[4] === 0x67 &&  codec === "h264") || (frame[4] === 0x40 &&  codec === "h265")) {
            if (iFrameNum < maxIframe) {
              iFrameArray[iFrameNum] = settingNum;

              /* jshint ignore:start */
              if (frameTime == requestTimeStamp && currentNum == 0) {
                currentNum = (settingNum - 1);
                iFrameCurrentNum = iFrameNum;
              }
              /* jshint ignore:end */

              // if (iFrameCurrentNum !== 0) {
              //   stepBuffer[settingNum].timeStamp = stepBuffer[settingNum - 1].timeStamp;
              // }
            }
            iFrameNum++;
          }
          
          if (settingNum === h264BufferMaxSize || iFrameNum > maxIframe) {
            currentBufferSize = settingNum;
            stepBuffer[0].timeStamp = stepBuffer[1].timeStamp;
            settingCheck = true;
            settingNum = 0;
            $rootScope.$emit('changeLoadingBar', false);
            settingFlag = false;
            console.log("playbackStepService buffering End currentNum " + currentNum + ", currentBufferSize = " + currentBufferSize);
            return;
          }
        } else {
          currentCodec = codec;
          stepBuffer[settingNum] = {frameData:frame, timeStamp:time, codec:codec};

          if (settingNum === 0) {
            $rootScope.$emit('changeLoadingBar', true);
            settingFlag = true;
            console.log("playbackStepService buffering Start");
          }
          /* jshint ignore:start */
          if (frameTime == requestTimeStamp) {
            currentNum = settingNum;
          }
          /* jshint ignore:end */
          
          if (settingNum === jpegBufferMaxSize) {
            //because first iFrame time is null
            stepBuffer[0].timeStamp = stepBuffer[1].timeStamp;
            settingCheck = true;
            settingNum = 0;
            $rootScope.$emit('changeLoadingBar', false);
            settingFlag = false;
            console.log("playbackStepService buffering End");
            return;
          }
        }

         // console.log("playbackStepService setBufferData settingNum " + settingNum 
         //   + ", currentNum " + currentNum + ", frameTime = " + frameTime + ", requestTimeStamp = " + requestTimeStamp);
        settingNum++;

        return settingCheck;
      }

      function setTimeStamp(timeStamp) {
        currentTimeStamp = timeStamp;
      }

      function getSettingCheck() {
        return settingCheck;
      }

      function getTimeStamp() {
        return currentTimeStamp;
      }

      function getFrameNum() {
        return currentNum;
      }

      function setDecodeFunc(func) {
          decodeFunc = func;
      }

      function getDecodeFunc() {
        return decodeFunc;
      }

      function getForwardEmpty() {
        if (currentCodec === "h264" || currentCodec === "h265") {
          if (currentNum >= h264BufferMaxSize || currentNum >= currentBufferSize) {
            return true; 
          } else {
            return false; 
          }
        } else {
          if (currentNum >= jpegBufferMaxSize) {
            return true; 
          } else {
            return false; 
          }
        }
      }

      function getBackwardEmpty() {
        if (currentNum <= 0) { return true; }
        else { return false; }
      }

      function getSettingFlag() {
        return settingFlag;
      }

      function setSettingFlag(flag) {
        settingFlag = flag;
      }

      function getCurrentCodec() {
        return currentCodec;
      }

      function setRequestTime(time) {
        requestTimeStamp = time;
      }

      return  {
        init:init,
        getForward:getForward,
        getBackward:getBackward,
        getTimeStamp:getTimeStamp,
        getSettingCheck:getSettingCheck,
        getFrameNum:getFrameNum,
        getDecodeFunc:getDecodeFunc,
        getForwardEmpty:getForwardEmpty,
        getBackwardEmpty:getBackwardEmpty,
        getSettingFlag:getSettingFlag,        
        getCurrentCodec:getCurrentCodec,
        setBufferData:setBufferData,
        setTimeStamp:setTimeStamp,
        setDecodeFunc:setDecodeFunc,
        setSettingFlag:setSettingFlag,
        setRequestTime:setRequestTime,
      };
    }]);