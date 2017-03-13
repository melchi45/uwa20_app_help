"use strict";
function MJPEGDecoder() {
	var width,
		height;
	function Constructor() {
		console.log('Construct MJPEG Codec');
	}

	Constructor.prototype = inheritObject(new KindDecoder(),{
		setResolution: function(w, h) {
			width = w;
			height = h;
		},
		decode: function(data, type) {
			if(!Constructor.prototype.isFirstFrame()){
				Constructor.prototype.setIsFirstFrame(true);
				var frameData ={'firstFrame' : true};
				return frameData;
			}
			
			return {
				'data': data,
				'width': width,
				'height': height,
				'codecType': 'mjpeg'
			};
		}
	});

	return new Constructor();
}