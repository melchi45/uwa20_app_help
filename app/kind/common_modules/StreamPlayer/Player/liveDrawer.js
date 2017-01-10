/**
 * Created by dohyuns.kim on 2016-09-08.
 */
/* global Module, Uint8Array, ArrayBuffer, setInterval, clearInterval, Size, RGB2dCanvas, YUVWebGLCanvas, KindStreamer, KindWSStreamer, KindRTSPStreamer, AudioDecoder */
"use strict";
/**
 * Represents draws video image on the canvas. Drawer has two drawing methods which are rgb and webgl.
 * @memberof (kind_stream.js)
 * @ngdoc module
 * @param {number} id channel.
 * @name liveDrawer
 */
function LiveDrawer(id) {
  var STEP_MS = 17; //safari didn't accept const in "use strict"
  /**
   * id of channel.
   * @var channelId
   * @memberof KindDrawer
   */
  var channelId = id;
  /**
   * it's a canvas which is an element of html.
   * @var canvas
   * @memberof KindDrawer
   */
  var canvas;
  /**
   * it's a object which is a drawer of kind.
   * @var drawer
   * @memberof KindDrawer
   */
  var drawer;
  /**
   * It's a width of canvas setted currently.
   * @var preWidth
   * @memberof KindDrawer
   */
  var preWidth,
    /**
     * It's a height of canvas setted currently.
     * @var preHeight
     * @memberof KindDrawer
     */
    preHeight;
  /**
   * It's a strategy type for drawing on the canvas.
   * @var drawingStrategy
   * @memberof KindDrawer
   */
  var drawingStrategy;
  var frameInterval, maxDelay;
  var prevCodecType;
  var resizeCallback;
  var freeBufferCallback;
  var bufferFullCallback;
  var startTimestamp = 0,
    frameTimestamp = null,
    preTimestamp = 0,
    progressTime = 0,
    curTime = 0;
  var fileName = "",
    captureFlag = false;

  var liveBufferNode = (function () {
    var width, height, codecType, frameType, timeStamp;

    function Constructor(data, width, height, codecType, frameType, timeStamp) {
      BufferNode.call(this, data);
      this.width = width;
      this.height = height;
      this.codecType = codecType;
      this.frameType = frameType;
      this.timeStamp = timeStamp;
    }

    return Constructor;
  })();

  var videoBufferList = null;

  function LiveBufferList() {
    var MAX_LENGTH;

    function Constructor() {
      BufferList.call(this);
      MAX_LENGTH = 5;
      frameTimestamp = null;
    }

    Constructor.prototype = inherit(BufferList, {
      push: function (data, width, height, codecType, frameType, timeStamp) {
        ( this._length >= MAX_LENGTH ) ? this.clear() : 0;
//          console.log('buffer overflow!');
        var node = new liveBufferNode(data, width, height, codecType, frameType, timeStamp);
        if (this._length > 0) {
          this.tail.next = node;
          node.previous = this.tail;
          this.tail = node;
        } else {
          this.head = node;
          this.tail = node;
        }
        this._length += 1;
        //console.log("after push node count is " + this._length + " frameType is " + frameType);
        return node;
      },
      pop: function () {
        var node = null;

        if (this._length > 1) {
          node = this.head;
          this.head = this.head.next;
          if (this.head != null) {
            this.head.previous = null;
            // 2nd use-case: there is no second node
          } else {
            this.tail = null;
          }
          this._length -= 1;
        }

        return node;
      },
      pushPop: function (data, width, height, codecType, frameType, timeStamp) {
        var node = null;
        if (data !== undefined) {
          node = new liveBufferNode(data, width, height, codecType, frameType, timeStamp);
          if (this._length > 0) {
            this.tail.next = node;
            node.previous = this.tail;
            this.tail = node;
          } else {
            this.head = node;
            this.tail = node;
          }
          this._length += 1;
          if (this._length == MAX_LENGTH) {
            if (bufferFullCallback !== null) {
              bufferFullCallback();
            }
          }
        } else {
          if (this._length > 1) {
            node = this.head;
            this.head = this.head.next;
            if (this.head != null) {
              this.head.previous = null;
              // 2nd use-case: there is no second node
            } else {
              this.tail = null;
            }
            this._length -= 1;
          }
        }
        return node;
      },
      setMaxLength: function (length) {
        MAX_LENGTH = length;
        if(MAX_LENGTH > 30)
          MAX_LENGTH = 30;
        if(MAX_LENGTH < 5)
          MAX_LENGTH = 5;
      }
    });
    return new Constructor();
  }

  function Constructor() {
    console.log("streamDrawer Constructor!!");
    drawingStrategy = 'rgb2d';
    prevCodecType = null;
    videoBufferList = new LiveBufferList();
    frameInterval = 33.3;
  }

  /**
   * Represents checks an execution environment and selects a drawing method. And decide size.
   * @memberof KindDrawer
   * @name resize
   * @param {number} width.
   * @param {number} height.
   * @example
   *    drawer.resize(640, 480);
   */
  var resize = function (width, height) {
    var size = new Size(width, height);
    canvas = $('canvas[kind-channel-id="' + channelId + '"]')[0];
    switch (drawingStrategy) {
      case 'RGB2d':
        drawer = new RGB2dCanvas(canvas, size);
        break;
      case 'YUVWebGL':
        drawer = new YUVWebGLCanvas(canvas, size);
        break;
      case 'ImageWebGL':
        drawer = new ImageWebGLCanvas(canvas, size);
        break;
      case 'WebGL':
        drawer = new WebGLCanvas(canvas, size);
        break;
      default:
        console.log(drawingStrategy, 'is unsupported strategy');
        break;
    }
  };

  var drawFrame = function (stepValue) {
    var bufferNode = null;
    bufferNode = videoBufferList.pop();

    if (bufferNode != null && bufferNode.buffer != null && (bufferNode.codecType == 'mjpeg' || bufferNode.buffer.length > 0)) {
      if (preWidth === undefined || preHeight === undefined || preWidth !== bufferNode.width || preHeight !== bufferNode.height || prevCodecType !== bufferNode.codecType) {
        drawingStrategy = (bufferNode.codecType == 'h264' || bufferNode.codecType == 'h265') ? 'YUVWebGL' : 'ImageWebGL';
        resize(bufferNode.width, bufferNode.height);
        preWidth = bufferNode.width;
        preHeight = bufferNode.height;
        prevCodecType = bufferNode.codecType;
        resizeCallback('resize');
      }

      frameTimestamp = bufferNode.timeStamp;  //update frameTimestamp
      workerManager.timeStamp(frameTimestamp);
      if (drawer !== undefined) {
        drawer.drawCanvas(bufferNode.buffer);
        if (captureFlag) {
          captureFlag = false;
          doCapture(canvas.toDataURL(), fileName);
        }
        delete bufferNode.buffer;
        bufferNode.buffer = null;
        bufferNode.previous = null;
        bufferNode.next = null;
        bufferNode = null;
//        freeBufferCallback(bufferNode.bufferIdx);
        return true;
      } else {
        console.log('drawer is undefined in KindDrawer!');
      }
    } else {
//      console.log("bufferNode is null!");
    }
    return false;
  };

  var drawingInTime = function (timestamp) {
    //        console.log("drawingInTime is " + timestamp);
    if (startTimestamp == 0 || (timestamp - startTimestamp) < 150) {
      if (videoBufferList != null) {
        window.requestAnimationFrame(drawingInTime);
      }
      return;
    }
//    console.log("drawingInTime Interval is " + (timestamp - preTimestamp));
    curTime += timestamp - preTimestamp;//STEP_MS;
    if (curTime > progressTime) {
      drawFrame() ? (progressTime += frameInterval) : 0;
//      console.log("drawingInTime curTime " + curTime + " progressTime " + progressTime);
    }
    if (curTime > 1000) {
      progressTime = 0;
      curTime = 0;
    }
    preTimestamp = timestamp;

    window.requestAnimationFrame(drawingInTime);
  };

  function startRendering() {
    startTimestamp = Date.now();//performance.now();
    console.log("startRendering curTime = " + startTimestamp);
    window.requestAnimationFrame(drawingInTime);
  }

  Constructor.prototype = inherit(KindDrawer, {
    /**
     * Represents how to draw on the canvas.
     * @memberof KindDrawer
     * @name getDrawingStrategy
     * @return {string} drawingStrategy drawing type.
     * @example
     *    drawer.getDrawingStrategy(type);
     */
    getDrawingStrategy: function () {
      return drawingStrategy;
    },
    /**
     * Represents temporary function. suddenly when canvas of kindstream exchange, the used canvas is be danggling.
     * @memberof KindDrawer
     * @name reassignCanvas
     * @example
     *    drawer.reassignCanvas();
     */
    reassignCanvas: function () {
      var tempcanvas = $('canvas[kind-channel-id="' + channelId + '"]')[0];
      if (canvas !== tempcanvas) {
        //resize(0, 0);
        preWidth = 0;
        preHeight = 0;
      }
    },
    /**
     * Represents draws video image on the canvas.
     * @memberof KindDrawer
     * @name draw
     * @param {string} data.
     * @param {number} bufferIdx.
     * @param {number} width.
     * @param {number} height.
     * @param {string} codecType.
     * @param {string} frameType.
     * @param {number} timeStamp.
     * @example
     *    drawer.draw(data array, 640, 480);
     */
    draw: function (data, width, height, codecType, frameType, timeStamp) {
//      if (codecType == 'h264' || codecType == 'h265') {
        if(videoBufferList !== null)
          videoBufferList.push(data, width, height, codecType, frameType, timeStamp);
//        drawFrame();
/*      } else {
        if (preWidth === undefined || preHeight === undefined || preWidth !== width || preHeight !== height || prevCodecType !== codecType) {
          drawingStrategy = (codecType == 'h264' || codecType == 'h265') ? 'YUVWebGL' : 'ImageWebGL';
          resize(width, height);
          preWidth = width;
          preHeight = height;
          prevCodecType = codecType;
          resizeCallback('resize');
        }
        if (drawer !== undefined && drawer !== null) {
          drawer.drawCanvas(data);
          if (captureFlag) {
            captureFlag = false;
            doCapture(canvas.toDataURL(), fileName);
          }
        } else {
          console.log('drawer is undefined in KindDrawer!');
        }
      }*/
    },
    /**
     * Represents checks an execution environment and selects a drawing method. And decide size.
     * @memberof KindDrawer
     * @name capture
     * @return {string} image raw data.
     * @example
     *    drawer.capture();
     */
    capture: function (name) {
      fileName = name;
      captureFlag = true;
      //return canvas.toDataURL();
    },
    /**
     * Represents send vertex array buffer, which is calculated by digitalZoomService to canvas.
     * @memberof KindDrawer
     * @name digitalZoom
     * @param bufferData.
     * @return
     * @example
     *    drawer.digitalZoom(buffer);
     */
    digitalZoom: function (bufferData) {
      if (drawer !== undefined && drawer !== null) {
        drawer.updateVertexArray(bufferData);
      }
    },
    setResizeCallback: function (callback) {
      resizeCallback = callback;
    },
    getCodecType: function () {
      return prevCodecType;
    },
    getFrameTimestamp: function () {
      return frameTimestamp;
    },
    initStartTime: function () {
      if (startTimestamp == 0) {
        startRendering();
      }
    },
    setFPS: function (fps) {
      if(fps === undefined){
        console.log('fps = undefined ' + fps);
      } else if(fps == 0){
        frameInterval = 0;
        maxDelay = 10 * 2;//
        videoBufferList.setMaxLength(fps);
      } else {
        frameInterval = (1000 / fps);
        maxDelay = fps * 2;//
        videoBufferList.setMaxLength(fps);
      }
    },
    getCanvas: function () {
      return canvas;
    },
    terminate: function () {
      console.log('streamDrawer terminate!');
      startTimestamp = 0;
      frameTimestamp = null;
      if(videoBufferList !== null){
        videoBufferList.clear();
        videoBufferList = null;
      }
      drawer = null;
    }
  });
  return new Constructor();
}