"use strict";
function G726_16_AudioDecoder() {
  var AUDIO_ENCODING_ULAW = 1; /* ISDN u-law */
  var AUDIO_ENCODING_ALAW = 2; /* ISDN A-law */
  var AUDIO_ENCODING_LINEAR = 3; /* PCM 2's-complement (0-center) */

  /*
   * Maps G.723_16 code word to reconstructed scale factor normalized log
   * magnitude values.  Comes from Table 11/G.726
   */
  var _dqlntab = [116, 365, 365, 116]; //short

  /* Maps G.723_16 code word to log of scale factor multiplier.
   *
   * _witab[4] is actually {-22 , 439, 439, -22}, but FILTD wants it
   * as WI << 5  (multiplied by 32), so we'll do that here 
   */
  var _witab = [-704, 14048, 14048, -704]; //short

  /*
   * Maps G.723_16 code words to a set of values whose long and short
   * term averages are computed and then compared to give an indication
   * how stationary (steady state) the signal is.
   */

  /* Comes from FUNCTF */
  var _fitab = [0, 0xE00, 0xE00, 0]; // short

  /* Comes from quantizer decision level tables (Table 7/G.726)
   */
  var qtab_723_16 = [1]; // int 
  var g726_state = {};
  var commonAudioUtil = null;

  //i(int), out_coding(int) 
  function g726_16_decode(i, out_coding) {
    var   sezi; //int
    var   sez;//int     /* ACCUM */
    var   sei;//int
    var   se;//int
    var   y;//int       /* MIX */
    var   dq;//int
    var   sr;//int        /* ADDB */
    var   dqsez;//int

    i &= 0x03;        /* mask to get proper bits */
    sezi = commonAudioUtil.predictor_zero(g726_state);
    sez = sezi >> 1;
    sei = sezi + commonAudioUtil.predictor_pole(g726_state);
    se = sei >> 1;      /* se = estimated signal */

    y = commonAudioUtil.step_size(g726_state); /* dynamic quantizer step size */

    dq = commonAudioUtil.reconstruct(i & 0x02, _dqlntab[i], y); /* quantized diff. */

    sr = (dq < 0) ? (se - (dq & 0x3FFF)) : se + dq; /* reconst. signal */

    dqsez = sr - se + sez;      /* pole prediction diff. */

    g726_state = commonAudioUtil.update(2, y, _witab[i], _fitab[i], dq, sr, dqsez, g726_state);

    switch (out_coding) {
      // case AUDIO_ENCODING_ALAW:
      //   return (commonAudioUtil.tandem_adjust_alaw(sr, se, y, i, 2, qtab_723_16));
      // case AUDIO_ENCODING_ULAW:
      //   return (commonAudioUtil.tandem_adjust_ulaw(sr, se, y, i, 2, qtab_723_16));
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
      var decodedBuffer = new Int16Array(buffer.length * 4);
      for(var i = 0, buffer_length = buffer.length, n = 0; i < buffer.length; i++) {
        var res;
        var data;
        data = buffer[i] >> 6;
        res = g726_16_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);
        // n++;
        decodedBuffer[n] = (res & 0x0000ff00);
        n++;

        data = buffer[i] >> 4;
        res = g726_16_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);
        // n++;
        decodedBuffer[n] = (res & 0x0000ff00);
        n++;

        data = buffer[i] >> 2;
        res = g726_16_decode(data, AUDIO_ENCODING_LINEAR);
        // decodedBuffer[n] = (res & 0x000000ff);
        // n++;
        decodedBuffer[n] = (res & 0x0000ff00);
        n++;

        data = buffer[i];
        res = g726_16_decode(data, AUDIO_ENCODING_LINEAR);
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
