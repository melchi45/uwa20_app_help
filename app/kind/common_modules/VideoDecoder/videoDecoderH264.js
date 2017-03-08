"use strict";

function H264Decoder() {
	var initDecoder,
	decoderContext,
	decodeByFFMPEG,
	getWidth,
	getHeight,
	closeContext,
	//flushBuffers,
	context=null,
	outputBuffer = null,
	inputBuffer,
	outBufferArray,
	self = this,
	outpic = new Uint8Array(),
	ID = 264,
	playbackLimitCheck = false;
	
	function Constructor() {
		console.log('Construct H264 Codec');
		// initialize ffmpeg decoder
		initDecoder = Module.cwrap('init_jsFFmpeg', 'void', []);
		decoderContext = Module.cwrap('context_jsFFmpeg', 'number', ['number']);
		decodeByFFMPEG = Module.cwrap('decode_video_jsFFmpeg', 'number', ['number', 'array', 'number', 'number']);
		getWidth = Module.cwrap('get_width', 'number', ['number']);
		getHeight = Module.cwrap('get_height', 'number', ['number']);
		closeContext = Module.cwrap('close_jsFFmpeg', 'number', ['number']);
		//flushBuffers = Module.cwrap('flush_buffers_jsFFmpeg', 'void', ['number']);

		initDecoder();
		//context = decoderContext(ID);

		Constructor.prototype.init();
		Constructor.prototype.setIsFirstFrame(false);
	}

	Constructor.prototype = inheritObject(new KindDecoder(),{
		init: function() {
			console.log("H264 Decoder init");
			if(context !== null){
				closeContext(context);
				context = null;
			}
			context = decoderContext(ID);
			playbackLimitCheck = false;
		},
		setOutputSize: function(size) {
			//console.log("H264 Decoder setOutputSize");
			var outpicsize = size * 1.5;
			var outpicptr = Module._malloc(outpicsize);
			outpic = new Uint8Array(Module.HEAPU8.buffer, outpicptr, outpicsize);
		},
		decode: function (data, type, limit) {
			var beforeDecoding, decodingTime, frameData, bufferIdx;
			var frameType = (data[4] == 0x67) ? 'I' : 'P';
			
			if (limit) {
				closeContext(context);
				context = decoderContext(ID);
				playbackLimitCheck = true;

				var errorCallback = Constructor.prototype.getErrorCallback();
				errorCallback({
					errorCode: "998",
					description: "Resolution is too big",
					place: "kind_video_decoder.js"
				});
				return ;
			}

			beforeDecoding = Date.now();

			if (!playbackLimitCheck)
				var Ret264 =decodeByFFMPEG(context, data, data.length, outpic.byteOffset);
			
			var width = getWidth(context);
			var height = getHeight(context);
			var outpic_size = width * height * 1.5;
			decodingTime = Date.now() - beforeDecoding;
			if(!Constructor.prototype.isFirstFrame()){
				Constructor.prototype.setIsFirstFrame(true);
				frameData ={'firstFrame' : true};
				return frameData;
			}
			// draw picture in canvas.
			if (width > 0 && height > 0) {
				var copyOutput = new Uint8Array(outpic);
				
				frameData = {
					'data': copyOutput,
					'bufferIdx': bufferIdx,
					'width': width,
					'height': height,
					'codecType': 'h264',
					'decodingTime': decodingTime,
					'frameType': frameType
				};

				return frameData;
			}
		}
	});

	return new Constructor();
}