function G726_24_AudioDecoder() {

  var AUDIO_ENCODING_ULAW = 1; /* ISDN u-law */
  var AUDIO_ENCODING_ALAW = 2; /* ISDN A-law */
  var AUDIO_ENCODING_LINEAR = 3; /* PCM 2's-complement (0-center) */

  /*
   * Maps G.723_24 code word to reconstructed scale factor normalized log
   * magnitude values.
   */
  var _dqlntab = [-2048, 135, 273, 373, 373, 273, 135, -2048]; //short[]

  /* Maps G.723_24 code word to log of scale factor multiplier. */
  var _witab = [-128, 960, 4384, 18624, 18624, 4384, 960, -128]; // short[]

  /*
   * Maps G.723_24 code words to a set of values whose long and short
   * term averages are computed and then compared to give an indication
   * how stationary (steady state) the signal is.
   */
  var _fitab = [0, 0x200, 0x400, 0xE00, 0xE00, 0x400, 0x200, 0]; //short[]

  var qtab_723_24 = [8, 218, 331]; //int[]
  var g726_state = {};

  var commonAudioUtil = null;

  /*
   * g723_24_decoder()
   *
   * Decodes a 3-bit CCITT G.723_24 ADPCM code and returns
   * the resulting 16-bit linear PCM, A-law or u-law sample value.
   * -1 is returned if the output coding is unknown.
   * i            int
   * out_coding   int
   */
  function g726_24_decode(i, out_coding) {
    var   sezi;
    var   sez;      /* ACCUM */
    var   sei;
    var   se;
    var   y;        /* MIX */
    var   dq;
    var   sr;       /* ADDB */
    var   dqsez;

    i &= 0x07;        /* mask to get proper bits */
    sezi = commonAudioUtil.predictor_zero(g726_state);
    sez = sezi >> 1;
    sei = sezi + commonAudioUtil.predictor_pole(g726_state);
    se = sei >> 1;      /* se = estimated signal */

    y = commonAudioUtil.step_size(g726_state); /* adaptive quantizer step size */
    dq = commonAudioUtil.reconstruct(i & 0x04, _dqlntab[i], y); /* unquantize pred diff */

    sr = (dq < 0) ? (se - (dq & 0x3FFF)) : (se + dq); /* reconst. signal */

    dqsez = sr - se + sez;      /* pole prediction diff. */

    g726_state = commonAudioUtil.update(3, y, _witab[i], _fitab[i], dq, sr, dqsez, g726_state);

    switch (out_coding) {
    // case AUDIO_ENCODING_ALAW:
    //   return (commonAudioUtil.tandem_adjust_alaw(sr, se, y, i, 4, qtab_723_24));
    // case AUDIO_ENCODING_ULAW:
    //   return (commonAudioUtil.tandem_adjust_ulaw(sr, se, y, i, 4, qtab_723_24));
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
      var decodedBuffer = new Int16Array(buffer.length * 8 / 3);
      for(var i = 0, n = 0, buffer_length = buffer.length; i < buffer_length - 3; i += 3) {
        var res;
        var data;
        data = buffer[i] >> 5;
        res = g726_24_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);
        // n++;
        decodedBuffer[n] = (res & 0x0000ff00);
        n++;

        data = buffer[i] >> 2;
        res = g726_24_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);
        // n++;
        decodedBuffer[n] = (res & 0x0000ff00);
        n++;

        data = (buffer[i] << 1) | (buffer[i + 1] >> 7);
        res = g726_24_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);
        // n++;
        decodedBuffer[n] = (res & 0x0000ff00);
        n++;

        data = buffer[i + 1] >> 4;
        res = g726_24_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);
        // n++;
        decodedBuffer[n] = (res & 0x0000ff00);
        n++;

        data = buffer[i + 1] >> 1;
        res = g726_24_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);
        // n++;
        decodedBuffer[n] = (res & 0x0000ff00);
        n++;

        data = (buffer[i + 1] << 2) | (buffer[i + 2] >> 6);
        res = g726_24_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);
        // n++;
        decodedBuffer[n] = (res & 0x0000ff00);
        n++;

        data = buffer[i + 2] >> 3;
        res = g726_24_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);
        // n++;
        decodedBuffer[n] = (res & 0x0000ff00);
        n++;

        data = buffer[i + 2] >> 0;
        res = g726_24_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);
        // n++;
        decodedBuffer[n] = (res & 0x0000ff00);
        n++;
      }
      return decodedBuffer;      
    }
  });

  return new Constructor();
}
