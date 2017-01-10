function G726_32_AudioDecoder() {

  var AUDIO_ENCODING_ULAW = 1; /* ISDN u-law */
  var AUDIO_ENCODING_ALAW = 2; /* ISDN A-law */
  var AUDIO_ENCODING_LINEAR = 3; /* PCM 2's-complement (0-center) */

  var qtab_723_32 = [-124, 80, 178, 246, 300, 349, 400]; //int[]

  /*
 * Maps G.721 code word to reconstructed scale factor normalized log
 * magnitude values.
 */
  var _dqlntab = [-2048, 4, 135, 213, 273, 323, 373, 425,
        425, 373, 323, 273, 213, 135, 4, -2048]; //short[]

  /* Maps G.721 code word to log of scale factor multiplier. */
  var _witab = [-12, 18, 41, 64, 112, 198, 355, 1122,
        1122, 355, 198, 112, 64, 41, 18, -12]; //short[]

  /*
   * Maps G.721 code words to a set of values whose long and short
   * term averages are computed and then compared to give an indication
   * how stationary (steady state) the signal is.
   */
  var _fitab = [0, 0, 0, 0x200, 0x200, 0x200, 0x600, 0xE00,
        0xE00, 0x600, 0x200, 0x200, 0x200, 0, 0, 0];

  var g726_state = {};
  var self = this;
  var commonAudioUtil = null;
 
  //i(int), out_coding(int) 
  function g726_32_decode(i, out_coding) {
    var   sezi; //int
    var   sez;//int     /* ACCUM */
    var   sei;//int
    var   se;//int
    var   y;//int       /* MIX */
    var   dq;//int
    var   sr;//int        /* ADDB */
    var   dqsez;//int
    var lino; //long

    i &= 0x0f;        /* mask to get proper bits */
    sezi = commonAudioUtil.predictor_zero(g726_state);
    sez = sezi >> 1;
    sei = sezi + commonAudioUtil.predictor_pole(g726_state);
    se = sei >> 1;      /* se = estimated signal */

    y = commonAudioUtil.step_size(g726_state); /* dynamic quantizer step size */

    dq = commonAudioUtil.reconstruct(i & 0x08, _dqlntab[i], y); /* quantized diff. */

    sr = (dq < 0) ? (se - (dq & 0x3FFF)) : se + dq; /* reconst. signal */

    dqsez = sr - se + sez;      /* pole prediction diff. */

    g726_state = commonAudioUtil.update(4, y, _witab[i] << 5, _fitab[i], dq, sr, dqsez, g726_state);

    switch (out_coding) {
      // case AUDIO_ENCODING_ALAW:
      //   return (commonAudioUtil.tandem_adjust_alaw(sr, se, y, i, 8, qtab_723_32));
      // case AUDIO_ENCODING_ULAW:
      //   return (commonAudioUtil.tandem_adjust_ulaw(sr, se, y, i, 8, qtab_723_32));
      case AUDIO_ENCODING_LINEAR:
            lino = sr << 2;  /* this seems to overflow a short*/
        lino = lino > 32767 ? 32767 : lino;
        lino = lino < -32768 ? -32768 : lino;
        return lino;//(sr << 2);  /* sr was 14-bit dynamic range */
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
      var decodedBuffer = new Int16Array(buffer.length * 2);
      for(var i = 0, n = 0, buffer_length = buffer.length; i < buffer_length; i++) {
        var res;
        var sec = (0xf0 & buffer[i]) >> 4;
        res = g726_32_decode(sec, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);
        // n++;
        decodedBuffer[n] = (res & 0x0000ff00); // if >> 8, it seems to be little endian.
        n++;

        var first = 0x0f & buffer[i];
        res = g726_32_decode(first, AUDIO_ENCODING_LINEAR);
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