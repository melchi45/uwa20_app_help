function VideoMediaSource() {
  var initSegmentFunc = null;
  var mediaSegmentFunc = null;
  var videoElement = null;
  var codecInfo = "";
  var mediaSource = null;
  var sourceBuffer = null;
  var mediaSegmentBuffer = new Uint8Array();
  var videoDigitalPtz = new videoDigitalPTZ();
  var playbackTimeStamp = null;
  var timeStampCallback = null;
  var videoSizeCallback = null;
  var browserType = null;
  var speedValue = 1;
  var receiveTimeStamp = {timestamp:0, timestamp_usec:0, timezone:0};
  var preVideoTimeStamp = null;
  var playbackFlag = false;
  var bufferEventListenerArray = null;
  var videoEventListenerArray = null;
  var mediaSourceEventListenerArray = null;
  var isPlaying = false;
  var isPause = true;

  function Constructor() { }

  function onSourceOpen(videoTag, e) {
    mediaSource = e.target;
    appendInitSegment();
  }

  function AddBufferEventListener(sourceBuffer) {
    bufferEventListenerArray = new Array();
    bufferEventListenerArray.push({'type':'error', 'function':onSourceBufferError});
    // bufferEventListenerArray.push({'type':'updateend', 'function': onUpdateEnd});
    // bufferEventListenerArray.push({'type':'sourceclose', 'function': onSourceBufferClose});
    // bufferEventListenerArray.push({'type':'sourceended', 'function': onSourceBufferEnded});
    // bufferEventListenerArray.push({'type':'updatestart', 'function': onUpdateStart});
    // bufferEventListenerArray.push({'type':'update', 'function': onUpdate});    
    // bufferEventListenerArray.push({'type':'abort', 'function': onSourceBufferAbort});

    for (var i = 0; i < bufferEventListenerArray.length; i++) {
      sourceBuffer.addEventListener(bufferEventListenerArray[i].type, bufferEventListenerArray[i].function);
    }
  }

  function AddVideoEventListener(videoTag) {
    videoEventListenerArray = new Array();
    videoEventListenerArray.push({'type':'durationchange', 'function':videoUpdating.bind(videoTag, mediaSource)});
    videoEventListenerArray.push({'type':'seeking', 'function':videoUpdating.bind(videoTag, mediaSource)});
    videoEventListenerArray.push({'type':'error', 'function':onError.bind(videoTag, mediaSource)});
    // videoEventListenerArray.push({'type':'progress', 'function':onProgress.bind(videoTag, mediaSource)});
    videoEventListenerArray.push({'type':'pause', 'function':onPause.bind(videoTag, mediaSource)});    
    // videoEventListenerArray.push({'type':'loadstart', 'function':onLoadstart.bind(videoTag, mediaSource)});
    // videoEventListenerArray.push({'type':'abort', 'function':onAbort.bind(videoTag, mediaSource)});
    // videoEventListenerArray.push({'type':'emptied', 'function':onEmptied.bind(videoTag, mediaSource)});
    // videoEventListenerArray.push({'type':'stalled', 'function':onStalled.bind(videoTag, mediaSource)});
    // videoEventListenerArray.push({'type':'loadedmetadata', 'function':onLoadedmetadata.bind(videoTag, mediaSource)});
    // videoEventListenerArray.push({'type':'loadeddata', 'function':onLoadeddata.bind(videoTag, mediaSource)});
    videoEventListenerArray.push({'type':'canplay', 'function':videoPlay.bind(videoTag, mediaSource)});
    videoEventListenerArray.push({'type':'canplaythrough', 'function':videoPlay.bind(videoTag, mediaSource)});
    videoEventListenerArray.push({'type':'playing', 'function':onPlaying.bind(videoTag, mediaSource)});
    videoEventListenerArray.push({'type':'waiting', 'function':onWaiting.bind(videoTag, mediaSource)});
    // videoEventListenerArray.push({'type':'seeked', 'function':onSeeked.bind(videoTag, mediaSource)});
    // videoEventListenerArray.push({'type':'ended', 'function':onEnded.bind(videoTag, mediaSource)});    
    videoEventListenerArray.push({'type':'timeupdate', 'function':onTimeupdate.bind(videoTag)});
    // videoEventListenerArray.push({'type':'play', 'function':onPlay.bind(videoTag, mediaSource)});
    // videoEventListenerArray.push({'type':'ratechange', 'function':onRatechange.bind(videoTag, mediaSource)});
    videoEventListenerArray.push({'type':'resize', 'function':onResize.bind(videoTag, mediaSource)});
    // videoEventListenerArray.push({'type':'volumechange', 'function':onVolumechange.bind(videoTag, mediaSource)});
    // videoEventListenerArray.push({'type':'addtrack', 'function':onAddtrack.bind(videoTag, mediaSource)});
    // videoEventListenerArray.push({'type':'removetrack', 'function':onRemovetrack.bind(videoTag, mediaSource)});    

    for (var i = 0; i < videoEventListenerArray.length; i++) {
      videoTag.addEventListener(videoEventListenerArray[i].type, videoEventListenerArray[i].function);
    }
  }

  function AddMediaSourceEventListener(mediaSource) {
    mediaSourceEventListenerArray = new Array();
    mediaSourceEventListenerArray.push({'type':'sourceopen', 'function': onSourceOpen.bind(this, videoElement)});
    mediaSourceEventListenerArray.push({'type':'error', 'function': onSourceError.bind(this, videoElement)});
    // mediaSourceEventListenerArray.push({'type':'sourceended', 'function': onSourceEnded.bind(this, videoElement)});
    // mediaSourceEventListenerArray.push({'type':'sourceclose', 'function': onSourceClose.bind(this, videoElement)});

    for (var i = 0; i < mediaSourceEventListenerArray.length; i++) {
      mediaSource.addEventListener(mediaSourceEventListenerArray[i].type, mediaSourceEventListenerArray[i].function);
    }    
  }

  function removeEventListener() {
    if (bufferEventListenerArray !== null) {
      for (var i = 0; i < bufferEventListenerArray.length; i++) {
        sourceBuffer.removeEventListener(bufferEventListenerArray[i].type, bufferEventListenerArray[i].function);
      }
    }
    if (mediaSourceEventListenerArray !== null) {
      for (var i = 0; i < mediaSourceEventListenerArray.length; i++) {
        mediaSource.removeEventListener(mediaSourceEventListenerArray[i].type, mediaSourceEventListenerArray[i].function);
      }
    }
    if (videoEventListenerArray !== null) {
      for (var i = 0; i < videoEventListenerArray.length; i++) {
        videoElement.removeEventListener(videoEventListenerArray[i].type, videoEventListenerArray[i].function);
      }
    }
  }

  function appendInitSegment() {
    if (mediaSource == null || mediaSource.readyState == "ended") {
      mediaSource = new MediaSource();
      AddMediaSourceEventListener(mediaSource);      
      videoElement.src = window.URL.createObjectURL(mediaSource);
      console.log("videoMediaSource::appendInitSegment new MediaSource()");
      return;
    }

    console.log("videoMediaSource::appendInitSegment start");
    if (mediaSource.sourceBuffers.length === 0) {
      mediaSource.duration = 0;

      var codecs = "video/mp4;codecs=\"avc1." + codecInfo + "\"";
      sourceBuffer = mediaSource.addSourceBuffer(codecs);
      
      AddBufferEventListener(sourceBuffer);
    }

    var initSegment = initSegmentFunc();

    if (initSegment == null) {
      mediaSource.endOfStream("network");
      return;
    }

    sourceBuffer.appendBuffer(initSegment);
    console.log("videoMediaSource::appendInitSegment end, codecInfo = " + codecInfo);
  }

  function appendNextMediaSegment(mediaData) {
    if (sourceBuffer == null) return;
  	if (mediaSource.readyState == "closed" || mediaSource.readyState == "ended" || sourceBuffer.updating) return;
      
      try {
        sourceBuffer.appendBuffer(mediaData);
      } catch(error) {
        console.log("videoMediaSource::appendNextMediaSegment error >> initVideo");
        workerManager.initVideo(false);
      }
  }

  function videoPlay(e) {
    if (browserType != "firefox" && browserType != "safari") {
      if (videoElement.paused) {
        videoSizeCallback();
        if (!isPlaying) {
          videoElement.play();
        }
      }
    }
  }

  function videoUpdating(e) {
    if (mediaSource == null) return;

    var duration = parseInt(mediaSource.duration, 10);
    var currentTime = videoElement.currentTime;
    var delay = (browserType === "chrome" ? 0.2 : 2);
    var diffDuration = duration - currentTime;

    if (playbackFlag === true) {
      delay = (browserType === "chrome" ? 2 : 4);
    }

    if (diffDuration >= (1.2 + delay)) {
      if (playbackFlag === false) {
        videoElement.currentTime = duration - delay;
      } else {
        var startTime = sourceBuffer.buffered.start(sourceBuffer.buffered.length - 1) * 1;
        var endTime = sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1) * 1;
        var bufferTime = (endTime - startTime) * 1;

        if (bufferTime > 1.2) {
          videoElement.currentTime = (videoElement.currentTime < 1 ? startTime + 1 : endTime - delay);
        }
      }
      
      if (videoElement.paused) {
        videoSizeCallback();
        if (!isPlaying) {
          videoElement.play();
        }
      }
    }
  }

  //media source event
  function onSourceError(e) { 
    console.log("videoMediaSource::onSourceError");
  }
  function onSourceEnded(e) { console.log("videoMediaSource::onSourceEnded"); }
  function onSourceClose(e) { console.log("videoMediaSource::onSourceClose"); }
  function onSourceBufferClose(e) { console.log("videoMediaSource::onSourceBufferClose"); }
  function onSourceBufferEnded(e) { console.log("videoMediaSource::onSourceBufferEnded"); }

  //source buffer event handler
  function onSourceBufferError(e) { 
    console.log("videoMediaSource::onSourceBufferErrormsg");
  }
  function onUpdateStart(e) { console.log("videoMediaSource::onUpdateStart"); }
  function onUpdate(e) { console.log("videoMediaSource::onUpdate"); }
  function onUpdateEnd(e) { console.log("videoMediaSource::onUpdateEnd"); }  
  function onSourceBufferAbort(e) { console.log("videoMediaSource::onSourceBufferAbort"); }    

  //videoTag event handler
  function onDurationchange(mediaSource, e) { console.log("videoMediaSource::onDurationchange"); }
  function onError(mediaSource, e) { 
    console.log("videoMediaSource::onError", e);
    if (!videoElement.paused) {
      if (!isPause) {
        videoElement.pause();
      }
    }

    if (browserType === 'safari') {
      workerManager.initVideo(false);
    }
  }
  function onProgress(mediaSource, e) { console.log("videoMediaSource::onProgress"); }
  function onPause(mediaSource, e) { 
    isPlaying = false;
    isPause = true;
  }
  function onSeeking(mediaSource, e) { console.log("videoMediaSource::onSeeking"); }
  function onLoadstart(mediaSource, e) { console.log("videoMediaSource::onLoadstart"); }
  function onAbort(mediaSource, e) { console.log("videoMediaSource::onAbort"); }
  function onEmptied(mediaSource, e) { console.log("videoMediaSource::onEmptied"); }
  function onStalled(mediaSource, e) { console.log("videoMediaSource::onStalled"); }
  function onLoadedmetadata(mediaSource, e) { console.log("videoMediaSource::onLoadedmetadata"); }
  function onLoadeddata(mediaSource, e) { console.log("videoMediaSource::onLoadeddata"); }
  function onCanplay(mediaSource, e) { console.log("videoMediaSource::onCanplay"); }
  function onCanplaythrough(mediaSource, e) { console.log("videoMediaSource::onCanplaythrough"); }
  function onPlaying(mediaSource, e) { 
    isPlaying = true;
    isPause = false;
  }
  function onWaiting(e) {
    if (!videoElement.paused && mediaSource !== null) {
      if (!isPause) {
        videoElement.pause();
      }
    }
  }
  function onSeeked(mediaSource, e) { console.log("videoMediaSource::onSeeked"); }
  function onEnded(mediaSource, e) { console.log("videoMediaSource::onEnded"); }
  function onTimeupdate(e) {
    var duration = parseInt(mediaSource.duration, 10);
    var currentTime =  parseInt(videoElement.currentTime, 10);
    var calcTimeStamp = receiveTimeStamp.timestamp - (speedValue * (duration - currentTime + (speedValue !== 1 ? 1 : 0)));
    var sendTimeStamp = {timestamp:calcTimeStamp, timestamp_usec:0, timezone:receiveTimeStamp.timezone};

    if (!videoElement.paused) {
      if (preVideoTimeStamp === null) {
        preVideoTimeStamp = sendTimeStamp;
      } else if ((preVideoTimeStamp.timestamp <= sendTimeStamp.timestamp && speedValue >= 1) ||
          (preVideoTimeStamp.timestamp > sendTimeStamp.timestamp && speedValue < 1)) {
        workerManager.timeStamp(sendTimeStamp);
        preVideoTimeStamp = sendTimeStamp;
      }
    }
  }
  function onPlay(mediaSource, e) { console.log("videoMediaSource::onPlay"); }
  function onRatechange(mediaSource, e) { console.log("videoMediaSource::onRatechange"); }
  function onResize(mediaSource, e) { 
    videoSizeCallback();
  }
  function onVolumechange(mediaSource, e) { console.log("videoMediaSource::onVolumechange"); }
  function onAddtrack(mediaSource, e) { console.log("videoMediaSource::onAddtrack"); }
  function onRemovetrack(mediaSource, e) { console.log("videoMediaSource::onRemovetrack"); } 

  Constructor.prototype = {
  	init: function(element) {
      browserType = BrowserDetect();
      console.log("videoMediaSource::init browserType = " + browserType);
      videoElement = element;
  	  if (browserType === 'chrome' || browserType === 'edge') {
  		  videoElement.autoplay = true;	  
  	  }else {
  		  videoElement.autoplay = false; 	  
  	  }
      
      videoElement.controls = false;
      videoElement.preload = "auto";
      videoElement.poster = "./base/images/video_poster.png";
      videoElement.style.background = "url('./base/images/loading.gif') no-repeat center center";
      videoElement.style.backgroundSize = "48px 48px";
      videoDigitalPtz.setVideoElement(videoElement);
      AddVideoEventListener(videoElement);
      appendInitSegment();
  	},
  	setInitSegmentFunc: function(func) {
      initSegmentFunc = func;
  	},
    getVideoElement: function() {
      return videoElement;
    },
    setCodecInfo: function(info) {
      codecInfo = info;
    },
    setMediaSegment: function(mediaSegment) {
      appendNextMediaSegment(mediaSegment);
    },
    capture: function(fileName) {
      var canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      canvas.getContext('2d')
            .drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      doCapture(canvas.toDataURL(), fileName);      
    },
    setInitSegment: function() {
      appendInitSegment();
    },
    setTimeStamp: function(timeStamp, callback) {
      playbackTimeStamp = timeStamp;
      timeStampCallback = callback;
    },
    setVideoSizeCallback: function(func) {
      videoSizeCallback = func;
    },
    getPlaybackTimeStamp: function() {
      return playbackTimeStamp;
    },
    setSpeedPlay: function(value) {
      speedValue = value;
    },
  	setvideoTimeStamp: function(timestamp) {
      receiveTimeStamp = timestamp;
  	},
  	pause: function() {
  	  if (!videoElement.paused) {
        if (!isPause) {
          videoElement.pause();
        }
  	  }
    },
    setPlaybackFlag: function(value) {
      playbackFlag = value;
    },
    setTimeStampInit: function() {
      preVideoTimeStamp = null;
    },
    close: function() {
      removeEventListener();

      if (!videoElement.paused) {
        if (!isPause) {
          videoElement.pause();
        }
      }
    }
  };

  return new Constructor();
}