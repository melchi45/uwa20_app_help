"use strict";

function H265Decoder() {
	var initDecoder;
	var decoderContext;
	var decodeByFFMPEG;
	var getWidth;
	var getHeight;
	var closeContext;
	var context=null;
	var outputBuffer = null;
	var inputBuffer;
	var outBufferArray;
	var self = this;
	var outpic = new Uint8Array();
	var ID = 265;
	var playbackLimitCheck = false;

	function Constructor() {
		console.log('Construct H265 Codec');
		// initialize ffmpeg decoder
		initDecoder = Module.cwrap('init_jsFFmpeg', 'void', []);
		decoderContext = Module.cwrap('context_jsFFmpeg', 'number', ['number']);
		decodeByFFMPEG = Module.cwrap('decode_video_jsFFmpeg', 'number', ['number', 'array', 'number', 'number']);
		getWidth = Module.cwrap('get_width', 'number', ['number']);
		getHeight = Module.cwrap('get_height', 'number', ['number']);
		closeContext = Module.cwrap('close_jsFFmpeg', 'number', ['number']);

		initDecoder();
		
		Constructor.prototype.init();
		Constructor.prototype.setIsFirstFrame(false);
	}

	Constructor.prototype = inheritObject(new KindDecoder(),{
		init: function() {
			console.log("H265 Decoder init");
			var ret = closeContext(context);
			context = decoderContext(ID);
		},
		setOutputSize: function(size) {
			var outpicsize = size * 1.5;
			var outpicptr = Module._malloc(outpicsize);
			outpic = new Uint8Array(Module.HEAPU8.buffer, outpicptr, outpicsize);

		},
		decode: function (data) {
			var beforeDecoding, decodingTime, frameData, bufferIdx;
			var	frameType = (data[4] == 0x40) ? 'I' : 'P';

			beforeDecoding = Date.now();
			decodeByFFMPEG(context, data, data.length, outpic.byteOffset);
			decodingTime = Date.now() - beforeDecoding;

			var width = getWidth(context);
			var height = getHeight(context);
			var outpic_size = width * height * 1.5;
			
			if(!Constructor.prototype.isFirstFrame()){
				Constructor.prototype.setIsFirstFrame(true);
				//					var frameData ={'firstFrame' : true};
				return {'firstFrame' : true};
			}

			// draw picture in canvas.
			if (width > 0 && height > 0) {
				var copyOutput = new Uint8Array(outpic);

				frameData = {
					'data': copyOutput,
					'width': width,
					'height': height,
					'codecType': 'h265',
					'decodingTime': decodingTime,
					'frameType': frameType
				};

				return frameData;
			}
		}
	});

	return new Constructor();
}