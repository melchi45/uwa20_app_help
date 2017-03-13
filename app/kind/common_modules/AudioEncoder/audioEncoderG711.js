function G711AudioEncoder() {

  var localSampleRate = 48000;

  var BIAS   =  0x84;

  var CLIP = 8159;

  var seg_end = [0xFF, 0x1FF, 0x3FF, 0x7FF, 0xFFF, 0x1FFF, 0x3FFF, 0x7FFF];

  var seg_uend = [0x3F, 0x7F, 0xFF, 0x1FF,0x3FF, 0x7FF, 0xFFF, 0x1FFF];

  var self = this;

  var codecInfo = {
		type: "G.711",
		samplingRate : 8000
		// bitrate : 64000
  };

  var remainBuffer = null;

  this.setSampleRate = function(_sampleRate) {
  	localSampleRate = _sampleRate;
  };

  this.encode = function(buffer) {
		var float32Array = null;

		if(remainBuffer !== null){
			float32Array = new Float32Array(buffer.length + remainBuffer.length);
			float32Array.set(remainBuffer, 0);
			float32Array.set(buffer, remainBuffer.length);
		}else{
			float32Array = buffer;
		}

		float32Array = downsampleBuffer(float32Array, codecInfo.samplingRate);

		var pcmArray = new Int16Array(float32Array.length);

		var ulawArray = new Uint8Array(pcmArray.length);

		for(var i = 0, float32Array_length = float32Array.length; i < float32Array_length; i++){
		  pcmArray[i] = float32Array[i] * Math.pow(2,15);
		  ulawArray[i] = lin2Mulaw(pcmArray[i]);
		}

		return ulawArray;
  };

  function downsampleBuffer(buffer, rate) {
		if (rate === localSampleRate) {
		  return buffer;
		}
		if (rate > localSampleRate) {
		  throw "Downsampling rate show be smaller than original sample rate";
		}
		var sampleRateRatio = localSampleRate / rate;

		var newLength = Math.floor(buffer.length / sampleRateRatio);
		var result = new Float32Array(newLength);
		var offsetResult = 0;
		var offsetBuffer = 0;

		while (offsetResult < result.length) {
		  var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
		 
		  var accum = 0, count = 0;
		  for (var i = offsetBuffer, buffer_length = buffer.length; i < nextOffsetBuffer && i < buffer_length; i++) {
				accum += buffer[i];
				count++;
		  }

		  result[offsetResult] = accum / count;
		  offsetResult++;
		  offsetBuffer = nextOffsetBuffer;
		}

		remainBuffer = null;
		if(Math.round(offsetResult*sampleRateRatio) !== buffer.length){
			var remainStartIndex = Math.round(offsetResult*sampleRateRatio);
			remainBuffer = new Float32Array(buffer.subarray(remainStartIndex,buffer.length));
		}
		
		return result;
  }

  function lin2Mulaw (pcm_val){
	var mask, seg, uval;
	if (pcm_val < 0) {
		pcm_val = BIAS - pcm_val;
		mask = 0x7F;
	} else {
		pcm_val += BIAS;
		mask = 0xFF;
	}
	seg = search(pcm_val, seg_end);
	if (seg >= 8){		// out of range, return maximum value. 
		return (0x7F ^ mask);
	}
	else {
		uval = (seg << 4) | ((pcm_val >> (seg + 3)) & 0xF);
		return (uval ^ mask);
	}
}
  

  function search(val, table)
  {
	for (var i=0, table_length = table.length; i<table_length; i++){
	  if (val<=table[i])
		return i;
	}
	return table.length;
  }

  this.getCodecInfo = function() {
	return codecInfo;
  };

  // constructor.prototype = {
  //   getCodecInfo: function() {
  //     return codecInfo;
  //   },
  //   encode: function(buffer) {
  //     return encode(buffer);
  //   }
  // };
  // return new constructor();
}