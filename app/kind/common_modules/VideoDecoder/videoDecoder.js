"use strict";
/**
 *  @const
 */
var KIND_HEADER_SIZE = 0;
/**
 * Represents an abstract Kind Decoder.
 * @memberof (kind_stream.js)
 * @ngdoc module
 * @name KindDecoder
 */
function KindDecoder() {
  var isFirstIFrame;
  var outputSize = 0;

  function Constructor() {
  }

  Constructor.prototype = {
    setIsFirstFrame: function (flag) {
      isFirstIFrame = flag;
    },
    isFirstFrame: function () {
      return isFirstIFrame;
    },
    decode: function () {
      console.log('default decode');
    }
  };
  return new Constructor();
}