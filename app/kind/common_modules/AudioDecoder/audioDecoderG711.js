"use strict";
function G711AudioDecoder() {
	var BIAS   =  0x84,
	SIGN_BIT  =  0x80, /* Sign bit for a A-law byte. */
	QUANT_MASK = 0xf,  /* Quantization field mask. */
	NSEGS    =   8,   /* Number of A-law segments. */
	SEG_SHIFT =  4,   /* Left shift for segment number. */
	SEG_MASK  =  0x70;  /* Segment field mask. */
	/* var codecInfo = {
		type: "G.711",
		samplingRate : 8000,
		bitrate : '64000'
	}; */

	function ulaw2linear_pcm(u_val) {
		var t;
		/* Complement to obtain normal u-law value. */
		var u_valc = ~u_val;
		/*
	* Extract and bias the quantization bits. Then
	* shift up by the segment number and subtract out the bias.
	*/
		t = ((u_valc & QUANT_MASK) << 3) + BIAS;
		t <<= (u_valc & SEG_MASK) >> SEG_SHIFT;
		return (((u_valc & SIGN_BIT)) ? (BIAS - t) : (t - BIAS));
	};

	function Constructor() {}

	Constructor.prototype = inheritObject(new AudioDecoder(),{
		decode: function(buffer){
			var rawData = new Uint8Array(buffer);
			var pcmData = new Int16Array(rawData.length);
			for (var i=0, rawData_length = rawData.length; i < rawData_length; i++) {
				pcmData[i]= ulaw2linear_pcm(rawData[i]);
			}
			
			var jsData = new Float32Array(pcmData.length);
			for (var i = 0, pcmData_length = pcmData.length; i < pcmData_length; i++) {
				/* var a1 = pcmData[i]/Math.pow(2,15);
				var a2 = Math.round(a1*100000) / 100000;
				jsData[i] = a2; */
				jsData[i] = pcmData[i] / Math.pow(2,15)
			}
			return jsData;
		}
	});

	return new Constructor();
}

