"use strict"

function AudioPlayer () {
	var preCodec = null,
		audioPlayer = null;

	function Constructor() {}

	Constructor.prototype = {
		audioInit : function() {},
		Play : function() {},
		Stop : function() {},
		BufferAudio : function(data) {},
		ControlVolumn : function() {}
	};
	
	return new Constructor();
};