/* jslint bitwise: true, strict: true */
  /*
 * CommonAudioUtil()
 *
 * Common Util Object
 * includes common functions to audio decode.
 *
 */

function CommonAudioUtil() {

  var power2 = [1, 2, 4, 8, 0x10, 0x20, 0x40, 0x80,0x100, 0x200, 0x400, 0x800, 0x1000, 0x2000, 0x4000];

  /*
   * quan()
   *
   * quantizes the input val against the table of size short integers.
   * It returns i if table[i - 1] <= val < table[i].
   *
   * Using linear search for simple coding.
   */
  var quan = function(val, table, size) { //int, *int, int
    var i; //int
    var k = 0;
    for (i = 0; i < size; i++) {
      if (val < table[k]) {
        break;
      } else {
        k++;
      }
    }
    return (i);
  };

  /*
   * fmult()
   *
   * returns the integer product of the 14-bit integer "an" and
   * "floating point" representation (4-bit exponent, 6-bit mantessa) "srn".
   */

  var fmult = function(an, srn) { // int, int
    var anmag;//int
    var anexp;//int
    var anmant;//int
    var wanexp;//int
    var wanmant;//int
    var retval;//int

    anmag = (an > 0) ? an : ((-an) & 0x1FFF);
    anexp = quan(anmag, power2, 15) - 6;
    anmant = (anmag === 0) ? 32 :
        (anexp >= 0) ? anmag >> anexp : anmag << -anexp;
    wanexp = anexp + ((srn >> 6) & 0xF) - 13;

    wanmant = (anmant * (srn & 077) + 0x30) >> 4;
    retval = (wanexp >= 0) ? ((wanmant << wanexp) & 0x7FFF) :
        (wanmant >> -wanexp);

    return (((an ^ srn) < 0) ? -retval : retval);
  };

  /*
   * g72x_init_state()
   *
   * This routine initializes and/or resets the g72x_state structure
   * pointed to by 'state_ptr'.
   * All the initial state values are specified in the CCITT G.721 document.
   */
  this.g726_init_state = function() {
   // var a[2];//int  /* Coefficients of pole portion of prediction filter. */
    // var b[6];//int  /* Coefficients of zero portion of prediction filter. */
    // var pk[2];//int /* Signs of previous two samples of a partially reconstructed signal. */
    // var dq[6];//short /* int here fails in newupdate on encode!
    //         // Previous 6 samples of the quantized difference
    //         // signal represented in an internal floating point
    //         // format.       
    // var sr[2];//int /* Previous 2 samples of the quantized difference
    var state_ptr = {};
    var cnta; //int
    state_ptr.a = new Array(2);
    state_ptr.b = new Array(6);
    state_ptr.pk = new Array(2);
    state_ptr.dq = new Array(6);
    state_ptr.sr = new Array(2);

    state_ptr.yl = 34816;
    state_ptr.yu = 544;
    state_ptr.dms = 0;
    state_ptr.dml = 0;
    state_ptr.ap = 0;
    for (cnta = 0; cnta < 2; cnta++) {
      state_ptr.a[cnta] = 0;
      state_ptr.pk[cnta] = 0;
      state_ptr.sr[cnta] = 32;
    }
    for (cnta = 0; cnta < 6; cnta++) {
      state_ptr.b[cnta] = 0;
      state_ptr.dq[cnta] = 32;
    }
    state_ptr.td = 0;

    // g726_state = state_ptr;
    return state_ptr;
  };

    /*
   * predictor_zero()
   *
   * computes the estimated signal from 6-zero predictor.
   *
   */
  this.predictor_zero = function(state_ptr) {
    var i;//int
    var sezi;//int
    sezi = fmult(state_ptr.b[0] >> 2, state_ptr.dq[0]);
    for (i = 1; i < 6; i++) {    /* ACCUM */
      sezi += fmult(state_ptr.b[i] >> 2, state_ptr.dq[i]);
    }
    return (sezi);
  };

  /*
   * predictor_pole()
   *
   * computes the estimated signal from 2-pole predictor.
   *
   */
  this.predictor_pole = function(state_ptr) {
    return (fmult(state_ptr.a[1] >> 2, state_ptr.sr[1]) +
        fmult(state_ptr.a[0] >> 2, state_ptr.sr[0]));
  };

  /*
   * step_size()
   *
   * computes the quantization step size of the adaptive quantizer.
   *
   */
  this.step_size = function(state_ptr) {
    var y;//int
    var dif;//int
    var al;//int
    if (state_ptr.ap >= 256) {
      return (state_ptr.yu);
    } else {
      y = state_ptr.yl >> 6;
      dif = state_ptr.yu - y;
      al = state_ptr.ap >> 2;
      if (dif > 0) {
        y += (dif * al) >> 6;
      } else if (dif < 0) {
        y += (dif * al + 0x3F) >> 6;
      }
      return (y);
    }
  };

  /*
   * quantize()
   *
   * Given a raw sample, 'd', of the difference signal and a
   * quantization step size scale factor, 'y', this routine returns the
   * ADPCM codeword to which that sample gets quantized.  The step
   * size scale factor division operation is done in the log base 2 domain
   * as a subtraction.
   */
  this.quantize = function(
    d,//int /* Raw difference signal sample */
    y,//int /* Step size multiplier */
    table,//int /* quantization table */ //wjuncho
    size)//int  /* table size of integers */
  {
    var   dqm;//int /* Magnitude of 'd' */
    var   exp;//int /* Integer part of base 2 log of 'd' */
    var   mant;//int  /* Fractional part of base 2 log */
    var   dl;//int  /* Log of magnitude of 'd' */
    var   dln;//int /* Step size scale factor normalized log */
    var   i;//int

    /*
     * LOG
     *
     * Compute base 2 log of 'd', and store in 'dl'.
     */
    dqm = Math.abs(d);
    exp = quan(dqm >> 1, power2, 15);
    mant = ((dqm << 7) >> exp) & 0x7F;  /* Fractional portion. */
    dl = (exp << 7) + mant;

    /*
     * SUBTB
     *
     * "Divide" by step size multiplier.
     */
    dln = dl - (y >> 2);

    /*
     * QUAN
     *
     * Obtain codword i for 'd'.
     */
    i = quan(dln, table, size);
    if (d < 0)      /* take 1's complement of i */
      return ((size << 1) + 1 - i);
    else if (i === 0)    /* take 1's complement of 0 */
      return ((size << 1) + 1); /* new in 1988 */
    else
      return (i);
  };
/*
 * reconstruct()
 *
 * Returns reconstructed difference signal 'dq' obtained from
 * codeword 'i' and quantization step size scale factor 'y'.
 * Multiplication is performed in log base 2 domain as addition.
 */
  this.reconstruct = function(
    sign,//int  /* 0 for non-negative value */
    dqln,//int  /* G.72x codeword */
    y)//int   /* Step size multiplier */
  {
    var   dql;//int /* Log of 'dq' magnitude */
    var   dex;//int /* Integer part of log */
    var   dqt;//int
    var   dq;//int    /* Reconstructed difference signal sample */

    dql = dqln + (y >> 2);  /* ADDA */

    if (dql < 0) {
      return ((sign) ? -0x8000 : 0);
    } else {    /* ANTILOG */
      dex = (dql >> 7) & 15;
      dqt = 128 + (dql & 127);
      dq = ((dqt << 7) >> (14 - dex)); //wjuncho convert it to (short) :: dq = (short)((dqt << 7) >> (14 - dex));
      return ((sign) ? (dq - 0x8000) : dq);
    }
  };


  /*
   * update()
   *
   * updates the state variables for each output code
   */
  this.update = function(
    code_size,//int /* distinguish 723_40 with others */
    y,//int   /* quantizer step size */
    wi,//int    /* scale factor multiplier */
    fi,//int    /* for long/short term energies */
    dq,//int    /* quantized prediction difference */
    sr,//int    /* reconstructed signal */
    dqsez,//int   /* difference from 2-pole predictor */
    state_ptr)  /* coder state pointer */
  {
    var   cnt;//int
    var   mag, exp;//int  /* Adaptive predictor, FLOAT A */
    var   a2p;//int   /* LIMC */
    var   a1ul;//int    /* UPA1 */
    var   pks1;//int    /* UPA2 */
    var   fa1;//int
    var   tr;//int      /* tone/transition detector */
    var   ylint, thr2, dqthr; //int
    var   ylfrac, thr1;//int
    var   pk0;//int

    pk0 = (dqsez < 0) ? 1 : 0;  /* needed in updating predictor poles */

    mag = dq & 0x7FFF;    /* prediction difference magnitude */
    /* TRANS */
    ylint = state_ptr.yl >> 15; /* exponent part of yl */
    ylfrac = (state_ptr.yl >> 10) & 0x1F; /* fractional part of yl */
    thr1 = (32 + ylfrac) << ylint;    /* threshold */
    thr2 = (ylint > 9) ? 31 << 10 : thr1; /* limit thr2 to 31 << 10 */
    dqthr = (thr2 + (thr2 >> 1)) >> 1;  /* dqthr = 0.75 * thr2 */
    if (state_ptr.td === 0)    /* signal supposed voice */
      tr = 0;
    else if (mag <= dqthr)    /* supposed data, but small mag */
      tr = 0;     /* treated as voice */
    else        /* signal is data (modem) */
      tr = 1;

    /*
     * Quantizer scale factor adaptation.
     */

    /* FUNCTW & FILTD & DELAY */
    /* update non-steady state step size multiplier */
    state_ptr.yu = y + ((wi - y) >> 5);

    /* LIMB */
    if (state_ptr.yu < 544) /* 544 <= yu <= 5120 */
      state_ptr.yu = 544;
    else if (state_ptr.yu > 5120)
      state_ptr.yu = 5120;

    /* FILTE & DELAY */
    /* update steady state step size multiplier */
    state_ptr.yl += state_ptr.yu + ((-state_ptr.yl) >> 6);

    /*
     * Adaptive predictor coefficients.
     */
    if (tr === 1) {      /* reset a's and b's for modem signal */
      state_ptr.a[0] = 0;
      state_ptr.a[1] = 0;
      state_ptr.b[0] = 0;
      state_ptr.b[1] = 0;
      state_ptr.b[2] = 0;
      state_ptr.b[3] = 0;
      state_ptr.b[4] = 0;
      state_ptr.b[5] = 0;
      a2p = 0 ;
    } else {      /* update a's and b's */
      pks1 = pk0 ^ state_ptr.pk[0];   /* UPA2 */

      /* update predictor pole a[1] */
      a2p = state_ptr.a[1] - (state_ptr.a[1] >> 7);
      if (dqsez !== 0) {
        fa1 = (pks1) ? state_ptr.a[0] : -state_ptr.a[0];
        if (fa1 < -8191) {  /* a2p = function of fa1 */
          a2p -= 0x100;
        } else if (fa1 > 8191) {
          a2p += 0xFF;
        } else {
          a2p += fa1 >> 5;
        }

        if (pk0 ^ state_ptr.pk[1]) {
          /* LIMC */
          if (a2p <= -12160) {
            a2p = -12288;
          } else if (a2p >= 12416) {
            a2p = 12288;
          } else {
            a2p -= 0x80;
          }
        } else if (a2p <= -12416) {
          a2p = -12288;
        } else if (a2p >= 12160) {
          a2p = 12288;
        } else {
          a2p += 0x80;
        }
      }

      /* TRIGB & DELAY */
      state_ptr.a[1] = a2p;

      /* UPA1 */
      /* update predictor pole a[0] */
      state_ptr.a[0] -= state_ptr.a[0] >> 8;
      if (dqsez !== 0) {
        if (pks1 === 0) {
          state_ptr.a[0] += 192;
        } else {
          state_ptr.a[0] -= 192;
        }
      }

      /* LIMD */
      a1ul = 15360 - a2p;
      if (state_ptr.a[0] < -a1ul) {
        state_ptr.a[0] = -a1ul;
      } else if (state_ptr.a[0] > a1ul) {
        state_ptr.a[0] = a1ul;
      }

      /* UPB : update predictor zeros b[6] */
      for (cnt = 0; cnt < 6; cnt++) {
        if (code_size === 5) {   /* for 40Kbps G.723 */
          state_ptr.b[cnt] -= state_ptr.b[cnt] >> 9;
        } else {      /* for G.721 and 24Kbps G.723 */
          state_ptr.b[cnt] -= state_ptr.b[cnt] >> 8;
        }
        if (dq & 0x7FFF) {      /* XOR */
          if ((dq ^ state_ptr.dq[cnt]) >= 0) {
            state_ptr.b[cnt] += 128;
          } else {
            state_ptr.b[cnt] -= 128;
          }
        }
      }
    }

    for (cnt = 5; cnt > 0; cnt--)
      state_ptr.dq[cnt] = state_ptr.dq[cnt-1];
    /* FLOAT A : convert dq[0] to 4-bit exp, 6-bit mantissa f.p. */
    if (mag === 0) {
      state_ptr.dq[0] = (dq >= 0) ? 0x20 : 0xFC20;
    } else {
      exp = quan(mag, power2, 15);
      state_ptr.dq[0] = ((dq >= 0) ? //wjuncho  state_ptr.dq[0] = (short)((dq >= 0) ?
          (exp << 6) + ((mag << 6) >> exp) :
          (exp << 6) + ((mag << 6) >> exp) - 0x400);
    }

    state_ptr.sr[1] = state_ptr.sr[0];
    /* FLOAT B : convert sr to 4-bit exp., 6-bit mantissa f.p. */
    if (sr === 0) {
      state_ptr.sr[0] = 0x20;
    } else if (sr > 0) {
      exp = quan(sr, power2, 15);
      state_ptr.sr[0] = (exp << 6) + ((sr << 6) >> exp);
    } else if (sr > -32768) {
      mag = -sr;
      exp = quan(mag, power2, 15);
      state_ptr.sr[0] =  (exp << 6) + ((mag << 6) >> exp) - 0x400;
    } else {
      state_ptr.sr[0] = 0xFC20;
    }
    /* DELAY A */
    state_ptr.pk[1] = state_ptr.pk[0];
    state_ptr.pk[0] = pk0;

    /* TONE */
    if (tr === 1) {   /* this sample has been treated as data */
      state_ptr.td = 0; /* next one will be treated as voice */
    } else if (a2p < -11776) {  /* small sample-to-sample correlation */
      state_ptr.td = 1; /* signal may be data */
    } else {        /* signal is voice */
      state_ptr.td = 0;
    }

    /*
     * Adaptation speed control.
     */
    state_ptr.dms += (fi - state_ptr.dms) >> 5;   /* FILTA */
    state_ptr.dml += (((fi << 2) - state_ptr.dml) >> 7);  /* FILTB */

    if (tr === 1) {
      state_ptr.ap = 256;
    } else if (y < 1536) {          /* SUBTC */
      state_ptr.ap += (0x200 - state_ptr.ap) >> 4;
    } else if (state_ptr.td === 1) {
      state_ptr.ap += (0x200 - state_ptr.ap) >> 4;
    } else if (Math.abs((state_ptr.dms << 2) - state_ptr.dml) >=
        (state_ptr.dml >> 3)) {
      state_ptr.ap += (0x200 - state_ptr.ap) >> 4;
    } else {
      state_ptr.ap += (-state_ptr.ap) >> 4;
    }
    return state_ptr;
  };

    /*
   * tandem_adjust(sr, se, y, i, sign)
   *
   * At the end of ADPCM decoding, it simulates an encoder which may be receiving
   * the output of this decoder as a tandem process. If the output of the
   * simulated encoder differs from the input to this decoder, the decoder output
   * is adjusted by one level of A-law or u-law codes.
   *
   * Input:
   *  sr  decoder output linear PCM sample,
   *  se  predictor estimate sample,
   *  y quantizer step size,
   *  i decoder input code,
   *  sign  sign bit of code i
   *
   * Return:
   *  adjusted A-law or u-law compressed sample.
   */
  // var tandem_adjust_alaw = function(
  //   sr, /* decoder output linear PCM sample */ //int
  //   se, /* predictor estimate sample */ //int
  //   y,  /* quantizer step size */ //int
  //   i,  /* decoder input code */ //int
  //   sign,  //int
  //   qtab) //*int
  // {
  //   var sp; /* A-law compressed 8-bit code */
  //   var dx; /* prediction error */
  //   var id; /* quantized prediction error */
  //   var sd; /* adjusted A-law decoded sample value */
  //   var im; /* biased magnitude of i */
  //   var imx;  /* biased magnitude of id */

  //   if (sr <= -32768)
  //     sr = -1;
  //   sp = linear2alaw((sr >> 1) << 3); /* short to A-law compression */
  //   dx = (alaw2linear(sp) >> 2) - se; /* 16-bit prediction error */
  //   id = quantize(dx, y, qtab, sign - 1);

  //   if (id === i) {       no adjustment on sp 
  //     return (sp);
  //   } else {      /* sp adjustment needed */
  //     /* ADPCM codes : 8, 9, ... F, 0, 1, ... , 6, 7 */
  //     im = i ^ sign;    /* 2's complement to biased unsigned */
  //     imx = id ^ sign;

  //     if (imx > im) {   /* sp adjusted to next lower value */
  //       if (sp & 0x80) {
  //         sd = (sp === 0xD5) ? 0x55 :
  //             ((sp ^ 0x55) - 1) ^ 0x55;
  //       } else {
  //         sd = (sp === 0x2A) ? 0x2A :
  //             ((sp ^ 0x55) + 1) ^ 0x55;
  //       }
  //     } else {    /* sp adjusted to next higher value */
  //       if (sp & 0x80)
  //         sd = (sp === 0xAA) ? 0xAA :
  //             ((sp ^ 0x55) + 1) ^ 0x55;
  //       else
  //         sd = (sp === 0x55) ? 0xD5 :
  //             ((sp ^ 0x55) - 1) ^ 0x55;
  //     }
  //     return (sd);
  //   }
  // };

  // var tandem_adjust_ulaw = function(
  //   sr, /* decoder output linear PCM sample */ // int
  //   se, /* predictor estimate sample */ // int
  //   y,  /* quantizer step size */ // int
  //   i,  /* decoder input code */ // int
  //   sign, // int
  //   qtab) // *int
  // {
  //   var sp; /* u-law compressed 8-bit code */
  //   var dx; /* prediction error */
  //   var id; /* quantized prediction error */
  //   var sd; /* adjusted u-law decoded sample value */
  //   var im; /* biased magnitude of i */
  //   var imx;  /* biased magnitude of id */

  //   if (sr <= -32768){
  //     sr = 0;
  //   }
  //   sp = linear2ulaw(sr << 2);  /* short to u-law compression */
  //   dx = (ulaw2linear(sp) >> 2) - se;  16-bit prediction error 
  //   id = quantize(dx, y, qtab, sign - 1);
  //   if (id === i) {
  //     return (sp);
  //   } else {
  //     /* ADPCM codes : 8, 9, ... F, 0, 1, ... , 6, 7 */
  //     im = i ^ sign;    /* 2's complement to biased unsigned */
  //     imx = id ^ sign;
  //     if (imx > im) {   /* sp adjusted to next lower value */
  //       if (sp & 0x80)
  //         sd = (sp === 0xFF) ? 0x7E : sp + 1;
  //       else
  //         sd = (sp === 0) ? 0 : sp - 1;

  //     } else {    /* sp adjusted to next higher value */
  //       if (sp & 0x80)
  //         sd = (sp === 0x80) ? 0x80 : sp - 1;
  //       else
  //         sd = (sp === 0x7F) ? 0xFE : sp + 1;
  //     }
  //     return (sd);
  //   }
  // };  

  // constructor.prototype = {
  //   quan: function(val, table, size) {
  //     return quan(val, table, size);
  //   },
  //   fmult: function(an, srn) {
  //     return fmult(an, srn);
  //   },
  //   g726_init_state: function() {
  //     return g726_init_state();
  //   },
  //   predictor_zero: function(state_ptr) {
  //     return predictor_zero(state_ptr);
  //   },
  //   predictor_pole: function(state_ptr) {
  //     return predictor_pole(state_ptr);
  //   },
  //   step_size: function(state_ptr) {
  //     return step_size(state_ptr);
  //   },
  //   quantize: function(d, y, table, size) {
  //     return quantize(d, y, table, size);
  //   },
  //   reconstruct: function(sign, dqln, y) {
  //     return reconstruct(sign, dqln, y);
  //   },
  //   update: function(code_size, y, wi, fi, dq, sr, dqsez, state_ptr) {
  //     return update(code_size, y, wi, fi, dq, sr, dqsez, state_ptr);
  //   },
  //   // tandem_adjust_alaw: function(sr, se, y, i, sign, qtab) {
  //   //   return tandem_adjust_alaw(sr, se, y, i, sign, qtab);
  //   // },
  //   // tandem_adjust_ulaw: function(sr, se, y, i, sign, qtab) {
  //   //   return tandem_adjust_ulaw(sr, se, y, i, sign, qtab);
  //   // }
  // };
  // return new constructor();
}