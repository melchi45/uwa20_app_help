'use strict';
function AudioPlayerAAC(){
	var mimeCodec,
			mediaSource,		
			audio,		
			sourceBuffer = null,
			sourceOpened = false,
			isStopped = false,
			saveVol = 0,
			segmentBuffer = new Uint8Array();

	var preTimeStamp = 0;
	var initVideoTimeStamp = 0;
	var videoDiffTime = null;

	var bufferingFlag = false;
	var startPosArray = null;
	var startPos = 0;

	function appendBuffer(buffer1, buffer2) {
		var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
		tmp.set(new Uint8Array(buffer1), 0);
		tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
		return tmp;
	};

	function createAudio() {
		if(/Apple Computer/.test(navigator.vendor) && /Safari/.test(navigator.userAgent)) {
			mimeCodec = 'audio/x-aac';
		} else {
			mimeCodec = 'audio/aac';
		}

		audio = document.createElement("audio");
		document.body.appendChild(audio);		
		audio.addEventListener('error', audioErrorCallback);

		// console.log('init AAC player Mime codec = ' + mimeCodec);
	}

	function createMediaSource() {
		var availablePlay = false;
		if(!window.MediaSource) {
			console.error('MediaSource API is not supported!');
		} else if (window.MediaSource.isTypeSupported(mimeCodec)) {
			mediaSource = new MediaSource();
			mediaSource.addEventListener('sourceopen', sourceOpenedCallback);
			mediaSource.addEventListener('sourceclose', sourceCloseCallback);
			mediaSource.addEventListener('sourceended', sourceEndedCallback);
			mediaSource.addEventListener('error', sourceErrorCallback);
			mediaSource.addEventListener('abort', sourceAbortCallback);
			availablePlay = true;
		} else {
			console.error('Unsupported MIME type or codec: ', mimeCodec);
		}
		return availablePlay;
	}

	function audioErrorCallback(e) {
		console.error(e);
		switch (e.target.error.code) {
		case e.target.error.MEDIA_ERR_ABORTED:
			console.error('audio tag error : You aborted the media playback.'); 
			break;
		case e.target.error.MEDIA_ERR_NETWORK:
			console.error('audio tag error : A network error caused the media download to fail.'); 
			break;
		case e.target.error.MEDIA_ERR_DECODE:
			console.error('audio tag error : The media playback was aborted due to a corruption problem or because the media used features your browser did not support.'); 
			break;
		case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
			console.error('audio tag error : The media could not be loaded, either because the server or network failed or because the format is not supported.'); 
			break;
		default:
			console.error('audio tag error : An unknown media error occurred.');
			break;
		}
	}
	
	function sourceOpenedCallback() {
		console.info('sourceopened');
		if(sourceBuffer === null) {
			try {
				sourceOpened = true;
				sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
				sourceBuffer.addEventListener('updateend', sourceUpdatedCallback);
			} catch (exception) {
				console.error('Exception calling addSourceBuffer : ' + exception);
				return;
			}
		}
	}

	function sourceUpdatedCallback() {   
		if (audio.paused) {
			audio.play();
		}		
	}

	function sourceCloseCallback() {
		console.info('sourceclose'); 
		sourceOpened = false;		
	}

	function sourceEndedCallback() { console.info('sourceended'); }
	function sourceErrorCallback() { console.info('error'); }
	function sourceAbortCallback() { console.info('abort'); }

	function Constructor() {}

	Constructor.prototype = inheritObject(new AudioPlayer(), {
		audioInit: function(volume){
			createAudio();
			var availablePlay = createMediaSource();
			if(availablePlay){
				// connect mediasource to audio tag
				if (audio !== null) {
					audio.src = window.URL.createObjectURL(mediaSource);
					this.ControlVolumn(volume);
					audio.pause();
				}				
			}
			return availablePlay;
		},
		Play: function() {
			// var vol = saveVol * 20;
			this.ControlVolumn(saveVol);
			//isStopped = false;
		},
		Stop: function() {
			audio.volume = 0;
			saveVol = 0;
			// if(audio) {
			// 	audio.pause();
			// 	if(mediaSource.readyState === 'open' && !sourceBuffer.updating) {
			// 		if(audio.currentTime > 0) {
			// 			mediaSource.endOfStream();
			// 		}
			// 	}

			// 	var sourceBuffers = mediaSource.activeSourceBuffers;
			// 	for(var i = 0, sourceBuffers_length = sourceBuffers.length; i < sourceBuffers_length; i++) {
			// 		mediaSource.removeSourceBuffer(sourceBuffers[i]);
			// 	}
			// 	mediaSource = null;
			// 	sourceBuffer = null;
			// }
		},
		BufferAudio: function(data, rtpTimestamp, videoCodec) {
			isStopped = false;
			var timegap = rtpTimestamp - preTimeStamp;

			if(timegap > 200 || timegap < 0){	// under 2000ms
				segmentBuffer = new Uint8Array();
				startPosArray = new Array();
				bufferingFlag = true;
				if(sourceBuffer !== null){
					audio.pause();
					if(sourceBuffer.buffered.length > 0){
						audio.currentTime = sourceBuffer.buffered.end(0);
					}
				}
				// console.log("audioBuffering :: bufferingStart AAC!!!!!!!!!!!!");
			}
				
			if(bufferingFlag){
				startPosArray.push(startPos);
				startPos += data.length;
			}

			preTimeStamp = rtpTimestamp;
			segmentBuffer = appendBuffer(segmentBuffer, data);
			
			if (sourceBuffer !== null && !bufferingFlag) {
				if(!sourceBuffer.updating){ // if true, sourcebuffer is unusable
					try {
						if(startPosArray !== null){
							if(videoDiffTime !== null){
								// console.log("audioBuffering :: Origin Buffering Time AAC: " + startPosArray.length/16 + " sec");
								if((parseInt(startPosArray.length/16) - parseInt(videoDiffTime)) >= 2){
									videoDiffTime += 1;
								}
								startPos = parseInt(((videoDiffTime) * 16),10);
								// console.log("audioBuffering :: Waste Buffering Time AAC: " + startPos/16 + " sec");	
								if(startPos < startPosArray.length){
									sourceBuffer.appendBuffer(segmentBuffer.subarray(startPosArray[startPos],segmentBuffer.length));	
									if(sourceBuffer.buffered.length > 0){
										audio.currentTime = sourceBuffer.buffered.end(0);
									}
								} else {
									if(sourceBuffer.buffered.length > 0){
										audio.currentTime = sourceBuffer.buffered.end(0)-0.3;
									}
								}
 							}
						}else{
							sourceBuffer.appendBuffer(segmentBuffer);
							
							if(videoDiffTime === null){
								if(sourceBuffer.buffered.length > 0){
									if(videoCodec === "mjpeg"){
										if(parseFloat(sourceBuffer.buffered.end(0) - audio.currentTime) > parseFloat(2.0)){
											audio.currentTime = sourceBuffer.buffered.end(0);
										}										
									}else{
										if(parseFloat(sourceBuffer.buffered.end(0) - audio.currentTime) > parseFloat(1.0)){
											audio.currentTime = sourceBuffer.buffered.end(0);
										}
									}

								}								
							}
							
						}

						segmentBuffer = new Uint8Array();
						startPosArray = null;
						startPos = 0;
					} catch (exception) {
						console.error('Exception while appending : ' + exception);
					}
				} else {
					
				}
			}
		},
		ControlVolumn: function(vol) {
			saveVol = vol;
			if(audio !== null) {
				var tVol = vol / 5;
				if(tVol <= 0) { //min
					audio.volume = 0;
				} else {
					if (tVol >= 1) { //max
						audio.volume = 1;
					} else {
						audio.volume = tVol;
					}
				}
			}
		},
		GetVolume: function(){
			return saveVol;
		},
		terminate: function(){
			// audio = null;
		},
		setBufferingFlag: function(videoTime, videoStatus){
			if(videoStatus == "init"){
				// console.log("audioBuffering :: init time =" + videoTime);
				initVideoTimeStamp = videoTime;
				bufferingFlag = true;
			}else{
				if(bufferingFlag){
					// console.log("audioBuffering :: currentTime = " + videoTime);
					if(videoTime === 0 || videoTime === "undefined" || videoTime === null){
						videoDiffTime = null;
					}else{
						videoDiffTime = videoTime - initVideoTimeStamp;
						initVideoTimeStamp = 0;
					}
					bufferingFlag = false;
				}
			}
		},
		getBufferingFlag: function(){
			return bufferingFlag;
		},
		setInitVideoTimeStamp: function(time){
			initVideoTimeStamp = time;
		},
		getInitVideoTimeStamp: function(){
			return initVideoTimeStamp;
		}
	});

	return new Constructor();
}
