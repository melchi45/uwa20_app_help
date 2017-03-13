
function G726_40_AudioDecoder() {

  var AUDIO_ENCODING_ULAW = 1; /* ISDN u-law */
  var AUDIO_ENCODING_ALAW = 2; /* ISDN A-law */
  var AUDIO_ENCODING_LINEAR = 3; /* PCM 2's-complement (0-center) */

  /*
   * Maps G.723_40 code word to ructeconstructed scale factor normalized log
   * magnitude values.
   */
  var _dqlntab = [-2048, -66, 28, 104, 169, 224, 274, 318,
          358, 395, 429, 459, 488, 514, 539, 566,
          566, 539, 514, 488, 459, 429, 395, 358,
          318, 274, 224, 169, 104, 28, -66, -2048]; //short[]

  /* Maps G.723_40 code word to log of scale factor multiplier. */
  var _witab = [448, 448, 768, 1248, 1280, 1312, 1856, 3200,
        4512, 5728, 7008, 8960, 11456, 14080, 16928, 22272,
        22272, 16928, 14080, 11456, 8960, 7008, 5728, 4512,
        3200, 1856, 1312, 1280, 1248, 768, 448, 448]; //short[]

  /*
   * Maps G.723_40 code words to a set of values whose long and short
   * term averages are computed and then compared to give an indication
   * how stationary (steady state) the signal is.
   */
  var _fitab = [0, 0, 0, 0, 0, 0x200, 0x200, 0x200,
        0x200, 0x200, 0x400, 0x600, 0x800, 0xA00, 0xC00, 0xC00,
        0xC00, 0xC00, 0xA00, 0x800, 0x600, 0x400, 0x200, 0x200,
        0x200, 0x200, 0x200, 0, 0, 0, 0, 0]; //short[]

  var qtab_723_40 = [-122, -16, 68, 139, 198, 250, 298, 339,
          378, 413, 445, 475, 502, 528, 553]; //int[]

  var g726_state = {};

  var self = this;

  var commonAudioUtil = null;

  var player = null;

  var codecInfo = {
    type: "G.726-40",
    samplingRate : 8000,
    bitrate : '40000'
  };

  /*
 * g723_40_decoder()
 *
 * Decodes a 5-bit CCITT G.723 40Kbps code and returns
 * the resulting 16-bit linear PCM, A-law or u-law sample value.
 * -1 is returned if the output coding is unknown.
 * i            int
 * out_coding   int
 */
  function g726_40_decode(i, out_coding) {
    var sezi, sei, sez, se; /* ACCUM */
    var y;      /* MIX */
    var sr;     /* ADDB */
    var dq;
    var dqsez;

    i &= 0x1f;      /* mask to get proper bits */
    sezi = commonAudioUtil.predictor_zero(g726_state);
    sez = sezi >> 1;
    sei = sezi + commonAudioUtil.predictor_pole(g726_state);
    se = sei >> 1;      /* se = estimated signal */

    y = commonAudioUtil.step_size(g726_state); /* adaptive quantizer step size */
    dq = commonAudioUtil.reconstruct(i & 0x10, _dqlntab[i], y); /* estimation diff. */

    sr = (dq < 0) ? (se - (dq & 0x7FFF)) : (se + dq); /* reconst. signal */

    dqsez = sr - se + sez;    /* pole prediction diff. */

    g726_state = commonAudioUtil.update(5, y, _witab[i], _fitab[i], dq, sr, dqsez, g726_state);

    switch (out_coding) {
    case AUDIO_ENCODING_LINEAR:
      return (sr << 2); /* sr was of 14-bit dynamic range */
    default:
      return (-1);
    }
  }

  function Constructor() {
    commonAudioUtil = new CommonAudioUtil();
    g726_state = commonAudioUtil.g726_init_state();
  }

  Constructor.prototype = inheritObject(new AudioDecoder(),{
    decode: function(buffer) {
      var decodedBuffer = new Int16Array(buffer.length * 1.6);

      for( var i = 0, n = 0, buffer_length = buffer.length ; i < buffer_length - 5; i += 5 )
      {
        var res;
        var data;

        data = buffer[i] >> 3;
        res = g726_40_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);           
        // n++;
        decodedBuffer[n] = ((res & 0x0000ff00));    
        n++;

        data = (buffer[i] << 2) | (buffer[i + 1] >> 6);
        res = g726_40_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);           
        // n++;
        decodedBuffer[n] = ((res & 0x0000ff00));    
        n++;

        data = buffer[i + 1] >> 1;
        res = g726_40_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);           
        // n++;
        decodedBuffer[n] = ((res & 0x0000ff00));    
        n++;

        data = (buffer[i + 1] << 4) | (buffer[i + 2] >> 4);
        res = g726_40_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);           
        // n++;
        decodedBuffer[n] = ((res & 0x0000ff00));    
        n++;

        data = (buffer[i + 2] << 1) | (buffer[i + 3] >> 7);
        res = g726_40_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);           
        // n++;
        decodedBuffer[n] = ((res & 0x0000ff00));    
        n++;

        data = buffer[i + 3] >> 2;
        res = g726_40_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);           
        // n++;
        decodedBuffer[n] = ((res & 0x0000ff00));    
        n++;

        data = (buffer[i + 3] << 3) | (buffer[i + 4] >> 5);
        res = g726_40_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);           
        // n++;
        decodedBuffer[n] = ((res & 0x0000ff00));    
        n++;

        data = buffer[i + 4] >> 0;
        res = g726_40_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);           
        // n++;
        decodedBuffer[n] = ((res & 0x0000ff00));    
        n++;
      }
      return decodedBuffer;
    }
  });

  return new Constructor();
}