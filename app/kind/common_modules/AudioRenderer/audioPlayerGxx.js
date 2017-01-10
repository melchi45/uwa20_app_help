"use strict";
function AudioPlayerGxx() {
	var audioContext, 
		gainInNode, 
		biquadFilter, 
		bufferNode,		
		saveVol = 0;
	
	var codecInfo = {
		type: "G.711",
		samplingRate : 8000,
		bitrate : '64000'
	};

	var nextStartTime = 0;
	var isRunning = false;		
	var preTimeStamp = 0;

	var bufferingFlag = false;
	var playBuffer = new Float32Array(80000);
	var readLength = 0;

	function playAudioIn(data, rtpTimestamp) {
		var timegap = rtpTimestamp - preTimeStamp;
		if(timegap > 100 || timegap < 0){	// under 1000ms
			nextStartTime = 0;
			readLength = 0;
			bufferingFlag = true;
			// console.log("audioBuffering :: bufferingStart G7xx!!!!!!!!!!!!");
		}

		if((nextStartTime - audioContext.currentTime) < 0) {	// nextStartTime overflow
			nextStartTime = 0;
		}

		preTimeStamp = rtpTimestamp;

		playBuffer = appendBufferFloat32(playBuffer, data, readLength);
		readLength += data.length;
		if(bufferingFlag){
			
		}else{
			if((readLength/data.length) > 1){
				// console.log("audioBuffering :: chunk size G7xx: " + (readLength/data.length));	
			}
			
			var audioBuffer = null;
			if (/Apple Computer/.test(navigator.vendor) && /Safari/.test(navigator.userAgent)){	
				playBuffer = Upsampling8Kto32K(playBuffer.subarray(0,readLength));
				codecInfo.samplingRate = 32000;
				audioBuffer = audioContext.createBuffer(1, playBuffer.length, codecInfo.samplingRate);
				audioBuffer.getChannelData(0).set(playBuffer);				
			}else{
				audioBuffer = audioContext.createBuffer(1, readLength, codecInfo.samplingRate);
				audioBuffer.getChannelData(0).set(playBuffer.subarray(0,readLength));
			}
			
			readLength = 0;
			var	sourceNode = audioContext.createBufferSource();

			sourceNode.buffer = audioBuffer;
			sourceNode.connect(biquadFilter);

			if(!nextStartTime){
				nextStartTime = audioContext.currentTime+audioBuffer.duration;
			}

			sourceNode.start(nextStartTime);
			nextStartTime += audioBuffer.duration;
		}
	};

	function appendBufferFloat32(currentBuffer, newBuffer, readLength) {
		var BUFFER_SIZE = 80000;
		if ((readLength + newBuffer.length) >= currentBuffer.length) {
			var tmp = new Float32Array(currentBuffer.length + BUFFER_SIZE);
			tmp.set(currentBuffer, 0);
			currentBuffer = tmp;
		}
		currentBuffer.set(newBuffer, readLength);
		return currentBuffer;
	};

	function Upsampling8Kto32K(inputBuffer){
		var point1,point2,point3,point4,mu=0.2,mu2=(1-Math.cos(mu*Math.PI))/2;
		var buf = new Float32Array(inputBuffer.length*4);
		for(var i=0,j=0,inputBuffer_length = inputBuffer.length;i<inputBuffer_length;i++){
			//index for dst buffer
			j=i*4;
			
			//the points to interpolate between
			point1=inputBuffer[i];
			point2=(i<(inputBuffer.length-1))?inputBuffer[i+1]:point1;
			point3=(i<(inputBuffer.length-2))?inputBuffer[i+2]:point1;
			point4=(i<(inputBuffer.length-3))?inputBuffer[i+3]:point1;
			//interpolate
			point2=(point1*(1-mu2)+point2*mu2);
			point3=(point2*(1-mu2)+point3*mu2);
			point4=(point3*(1-mu2)+point4*mu2);
			//put data into buffer
			buf[j]=point1;
			buf[j+1]=point2;
			buf[j+2]=point3;
			buf[j+3]=point4;
		}
		return buf;
	};

	function Constructor() {}

	Constructor.prototype = inheritObject(new AudioPlayer(), {
		audioInit: function(volume){
			//init audio context
			console.log("init Gxx player");
			nextStartTime = 0;

			if (typeof audioContext !== "undefined") {
				console.info('Audio context already defined!'); //audio_context already defined
			}
			else {
			try {
				window.AudioContext = window.AudioContext  ||
				window.webkitAudioContext ||
				window.mozAudioContext    ||
				window.oAudioContext      ||
				window.msAudioContext;

				audioContext = new AudioContext();
				audioContext.onstatechange = function() {
					console.info('Audio Context State changed :: ' + audioContext.state);
					if(audioContext.state === "running"){
						isRunning = true;
					}
				};

				gainInNode = audioContext.createGain(); // create gain node
				biquadFilter = audioContext.createBiquadFilter();  
				biquadFilter.connect(gainInNode);
				biquadFilter.type = "lowpass";
				biquadFilter.frequency.value = 2000;
				biquadFilter.gain.value = 40;

				// Connect gain node to speakers
				gainInNode.connect(audioContext.destination);
				this.ControlVolumn(volume);
				return true;
			} catch (error) {
				console.error("Web Audio API is not supported in this web browser! : " + error);
				return false;
			}
			}
		},		
		Play: function() {
			this.ControlVolumn(saveVol);
		},
		Stop: function() {
			saveVol = 0;
			gainInNode.gain.value = 0;
			nextStartTime = 0;
		},
		BufferAudio: function(data, rtpTimestamp) {
			if(isRunning){
				playAudioIn(data, rtpTimestamp);
			}
		},		
		ControlVolumn: function(vol) {			
			//setAudioInNodes(); // in case control volume before turn on
			saveVol = vol;
			var tVol = vol / 5;
			if(tVol <= 0) { //min
				gainInNode.gain.value = 0;
				nextStartTime = 0;
			} else {
				if (tVol >= 1) { //max
					gainInNode.gain.value = 1;
				} else {
					gainInNode.gain.value = tVol;
				}
			}
		},
		GetVolume: function(){
			return saveVol;
		},
		terminate: function(){
			if(audioContext.state !== "closed"){
				nextStartTime = 0;
				isRunning = false;
				audioContext.close();
			}
		},
		setBufferingFlag: function(flag){
			bufferingFlag = flag;
		},
		getBufferingFlag: function(){
			return bufferingFlag;
		}
	});

	return new Constructor();
}