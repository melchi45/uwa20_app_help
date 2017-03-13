/* global G711AudioEncoder */
/* global AudioContext */
/* global Uint8Array */
/* global Float32Array */

"use strict";


/**
* Represents Web Audio Api.
* 
* 
* 
*/
function Talk() {
	var audioOutVolume = 0,
	audioContext = null,
	gainOutNode = null,
	bufferSize = 4096, //1024, // var bufferSize = 1024; //must be power num
	scriptNode = null,
	localSampleRate = null,
	isStreaming = false,
	currentLocalStream = null,
	biquadFilter = null,
	streamNode = null;
	

	var constraints = {
		audio: true,
		video: false
	};

	var sendAudioBufferCallback = null;


	function cleanBuffer() {
		chunkCounter = 0;
		bufferedArray = null;
	}

	function Constructor() {}

	Constructor.prototype = {
		init: function(){
			//initWebAudio();
			//get audio context
			if (audioContext === undefined || audioContext === null) {
				try {
					window.AudioContext = window.AudioContext       ||
					window.webkitAudioContext ||
					window.mozAudioContext    ||
					window.oAudioContext      ||
					window.msAudioContext;
					audioContext = new AudioContext();
					audioContext.onstatechange = function() {
						console.info('Audio Context State changed :: ' + audioContext.state);
					};
				} catch (error) {
					console.error("Web Audio API is not supported in this web browser! : " + error);
					return;
				}      
			}else{
				// console.info('Audio context already defined!'); //audio_context already defined
			}
		},
		initAudioOut: function(){
			//setAudioOutNodes();
			if(gainOutNode === null || scriptNode === null) {
				gainOutNode = audioContext.createGain();
				biquadFilter = audioContext.createBiquadFilter();
				scriptNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
				scriptNode.onaudioprocess = function(e){
					if(currentLocalStream !==null) {
					var recordChunk = e.inputBuffer.getChannelData(0);
						if(sendAudioBufferCallback !== null && isStreaming === true) {
							sendAudioBufferCallback(recordChunk);
						}
					}
				}
				gainOutNode.connect(scriptNode);
				scriptNode.connect(audioContext.destination);
				localSampleRate = audioContext.sampleRate;
				gainOutNode.gain.value =1;
				
				/* gainOutNode.connect(biquadFilter);
				biquadFilter.connect(scriptNode);
				scriptNode.connect(audioContext.destination);
				localSampleRate = audioContext.sampleRate;
				biquadFilter.type = 'lowpass';
				biquadFilter.frequency.value = 2000;
				biquadFilter.gain.value = 10;   */
			} 
			
			// init getusermedia
			if(navigator.mediaDevices === undefined) {
				navigator.mediaDevices = {};
			}
			if(navigator.mediaDevices.getUserMedia === undefined) {
				//navigator.mediaDevices.getUserMedia = promisifiedOldGUM;
				navigator.mediaDevices.getUserMedia = function (constraints, successCallback, errorCallback) {
					// First get ahold of getUserMedia, if present
					var getUserMedia = (navigator.getUserMedia ||
					navigator.webkitGetUserMedia ||
					navigator.mozGetUserMedia ||
					navigator.msGetUserMedia);
					// Some browsers just don't implement it - return a rejected promise with an error
					// to keep a consistent interface
					if(!getUserMedia) {
						return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
					} else {
						// Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
						return new Promise(function(successCallback, errorCallback) {
							getUserMedia.call(navigator, constraints, successCallback, errorCallback);
						});
					}
				};
			}
			if(navigator.mediaDevices.getUserMedia) {
				navigator.mediaDevices.getUserMedia(constraints)
				.then(function(stream) {
					currentLocalStream = stream;
					streamNode = audioContext.createMediaStreamSource(stream);
					streamNode.connect(gainOutNode);
				})
				.catch(function(error) {
					console.error(error);
				});
			} else {
				console.error('Cannot open local media stream! :: navigator.mediaDevices.getUserMedia is not defined!');

				return;
			}
			
			isStreaming = true;
			return localSampleRate;
		},
	controlVolumnOut: function(volumn) {
			// setAudioOutNodes(); // in case control volume before turn on
			var tVol = volumn / 20 * 2;
			if(tVol <= 0) { //min
				gainOutNode.gain.value = 0;
			} else {
				if (tVol >= 10) { //max
					gainOutNode.gain.value = 10;
				} else {
					gainOutNode.gain.value = tVol;
				}
			}
		},
	stopAudioOut: function(){       //after stopAudioOut, initAudioOut needs to be called to restart.
			// if(currentLocalStream.active) {
			if(currentLocalStream !== null) {  
				if(isStreaming){
					try{
						var audioTracks = currentLocalStream.getAudioTracks();
						for(var i = 0, audioTracks_length = audioTracks.length; i < audioTracks_length; i++) {
							audioTracks[i].stop();
						}
						isStreaming = false;
						currentLocalStream = null;
					}catch(e){
						console.log(e);
					}
				}
			}
			// } else {
			//   console.info('Current Local Stream is not active!');
			// }        
		},
	terminate: function(){
			//self.stopAudioIn();
			this.stopAudioOut();
			audioContext.close();        
			gainOutNode = null;
			scriptNode = null;
		},
	setSendAudioTalkBufferCallback: function(callbackFn){
			sendAudioBufferCallback = callbackFn;
		}
	}
	return new Constructor();
};