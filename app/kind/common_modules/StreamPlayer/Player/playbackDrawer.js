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
 * @name KindDrawer
 */
function PlaybackDrawer(id) {
  var STEP_MS = 17; //safari didn't accept const in "use strict"
  var STEP_FORWARD = 1;
  var STEP_BACKWARD = -1;
  var PLAYBACK_JITTER = 300;
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
  var frameInterval;//, maxDelay;
  var prevCodecType;
  var resizeCallback;
  var bufferFullCallback;
  var startTimestamp = 0,
    preTimestamp = 0,
    progressTime = 0,
    curTime = 0;
  var PLAY = 'play',
    PAUSE = 'pause';
  var playFlag = PLAY;
  var frameTimestamp = null;
  var fileName = "",
    captureFlag = false;

  var videoBufferNode = (function () {
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

  function PlaybackBufferList() {
    var MAX_LENGTH,
      BUFFERING = 120,
      bufferFullCallback,
      forcePause;

    function Constructor() {
      BufferList.call(this);
      MAX_LENGTH = 180;
      BUFFERING = 120;
      bufferFullCallback = null;
      forcePause=null;
      frameTimestamp = null;
    }

    Constructor.prototype = inherit(BufferList, {
      push: function (data, width, height, codecType, frameType, timeStamp) {
        ( this._length >= MAX_LENGTH ) ? forcePause() : 0;
        var node = new videoBufferNode(data, width, height, codecType, frameType, timeStamp);
        if (this._length > 0) {
          this.tail.next = node;
          node.previous = this.tail;
          this.tail = node;
        } else {
          this.head = node;
          this.tail = node;
        }
        this._length += 1;

        (bufferFullCallback != null && this._length >= BUFFERING) ? bufferFullCallback() : 0;//PLAYBACK bufferFull
//        console.log("after push node count is " + this._length + " frameType is " + frameType);

        return node;
      },
      pop: function () {
//        console.log("before pop node count is " + this._length + " MINBUFFER is " + MINBUFFER);
        var node = null;
//        if (this._length < MINBUFFER)
//          return node;

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
      setMaxLength: function (length) {
        MAX_LENGTH = length;
        if(MAX_LENGTH > 180)
          MAX_LENGTH = 180;
        if(MAX_LENGTH < 60)
          MAX_LENGTH = 60;
      },
      setBUFFERING: function (interval) {
        BUFFERING = interval;
        if(BUFFERING > 150)
          BUFFERING = 120;
      },
      setBufferFullCallback: function (callback) {
        bufferFullCallback = callback;
        console.log("setBufferFullCallback BUFFERING is " + BUFFERING );
      },
      setForcePauseCallback: function (callback) {
        forcePause = callback;
      },
      searchTimestamp: function (frameTimestamp) {
        var currentNode = this.head,
          length = this._length,
          count = 1,
          message = {failure: 'Failure: non-existent node in this list.'};

        // 1st use-case: an invalid position
        if (length === 0 || frameTimestamp <= 0) {
          throw new Error(message.failure);
        }

        // 2nd use-case: a valid position
        while (currentNode!=null && currentNode.timeStamp.timestamp_usec != frameTimestamp.timestamp_usec) {
          currentNode = currentNode.next;
          count++;
        }

        if (length < count) {
          currentNode = null;
        } else {
          this.curIdx = count;
          console.log("searchTimestamp curIdx = " + this.curIdx + " frameTimestamp = " + frameTimestamp.timestamp_usec);
        }

        console.log('searchTimestamp curIdx ' + this.curIdx + ' count ' + count + ' _length ' + this._length);

        return currentNode;
      }
    });
    return new Constructor();
  }

  function Constructor() {
    console.log("playbackDrawer Constructor!!");
    drawingStrategy = 'rgb2d';
    prevCodecType = null;
    videoBufferList = new PlaybackBufferList();
    frameInterval = 0;
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
    if (stepValue === undefined && playFlag == PLAY) {
      bufferNode = videoBufferList.pop();
    } else {
      if (stepValue == STEP_FORWARD) {
//        console.log("streamDrawer::drawFrame stepValue = FORWARD, videoBufferList.length = " + videoBufferList._length + ", FrameNum = " + videoBufferList.getCurIdx());
        var nextNode = videoBufferList.getCurIdx() + 1;
        if (nextNode <= videoBufferList._length) {
          bufferNode = videoBufferList.searchNodeAt(nextNode);
        } else {
          return false;
        }
      } else if (stepValue == STEP_BACKWARD) {
//        console.log("streamDrawer::drawFrame stepValue = BACKWARD, videoBufferList.length = " + videoBufferList._length + ", FrameNum = " + videoBufferList.getCurIdx());
        var prevINode = videoBufferList.getCurIdx() - 1;
        while (prevINode > 0) {
          bufferNode = videoBufferList.searchNodeAt(prevINode);
          if (bufferNode.frameType === "I" || bufferNode.codecType == "mjpeg") {
            break;
          } else {
            bufferNode = null;
            prevINode--;
          }
        }
        if (bufferNode === null) {
          return false;
        }
      }
    }
    if (bufferNode != null && bufferNode.buffer != null && (bufferNode.codecType == 'mjpeg' || bufferNode.buffer.length > 0)) {
      if (preWidth === undefined || preHeight === undefined || preWidth !== bufferNode.width || preHeight !== bufferNode.height || prevCodecType !== bufferNode.codecType) {
        drawingStrategy = (bufferNode.codecType == 'h264' || bufferNode.codecType == 'h265') ? 'YUVWebGL' : 'ImageWebGL';
        resize(bufferNode.width, bufferNode.height);
        preWidth = bufferNode.width;
        preHeight = bufferNode.height;
        prevCodecType = bufferNode.codecType;
        resizeCallback('resize');
      }

      if(frameTimestamp != null && frameInterval == 0) {
        frameInterval = ((bufferNode.timeStamp.timestamp - frameTimestamp.timestamp) == 0 ? 0 : 1000 ) + (bufferNode.timeStamp.timestamp_usec - frameTimestamp.timestamp_usec);
        if(frameInterval != 0) {
//          console.log('frameInterval ! ' + frameInterval + ' bufferNode.timeStamp.timestamp_usec! ' + bufferNode.timeStamp.timestamp_usec + ' frameTimestamp.timestamp_usec! ' + frameTimestamp.timestamp_usec);
//          maxDelay = 5000/frameInterval;
          videoBufferList.setBUFFERING(4000/frameInterval);
          videoBufferList.setMaxLength(6000/frameInterval);
        }
      }

      frameTimestamp = bufferNode.timeStamp;  //update frameTimestamp
      workerManager.timeStamp(frameTimestamp);
//      console.log('frameTimestamp ! ' + frameTimestamp.timestamp + ' frameTimestamp timestamp_usec! ' + frameTimestamp.timestamp_usec);
      if (drawer !== undefined) {
        drawer.drawCanvas(bufferNode.buffer);
        if (captureFlag) {
          captureFlag = false;
          doCapture(canvas.toDataURL(), fileName);
        }
        if (stepValue === undefined){
          delete bufferNode.buffer;
          bufferNode.buffer = null;
          bufferNode.previous = null;
          bufferNode.next = null;
          bufferNode = null;
        }
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
    if(playFlag != PLAY)
      return;

    if (startTimestamp == 0 || (timestamp - startTimestamp) < PLAYBACK_JITTER) {
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

  function videoBufferFull() {
    videoBufferList.setBufferFullCallback(null);
    if (playFlag != PLAY)
      bufferFullCallback();
    if (videoBufferList.searchTimestamp(frameTimestamp) == null) {
      console.log("can not find timestamp form video buffer list frameTimestamp.timestamp_usec =  " + frameTimestamp.timestamp_usec);
    }

    console.log("videoBufferFull !!!");
  }

  function setFPS(fps) {
    frameInterval = (1000 / fps);
//    maxDelay = fps * 5;//
    videoBufferList.setMaxLength(fps * 6);
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
    playToggle: function () {
      if (playFlag == PLAY) {
        playFlag = PAUSE;
      } else {
        videoBufferList.removeTillCurrent();
        playFlag = PLAY;
        startRendering();//test
      }
    },
    fastPlay: function (nTimes) {
      frameTimestamp = null;
      frameInterval = 0;
      videoBufferList.clear();
//      (nTimes == 1) ? videoBufferList.setMINBUFFER(5) : videoBufferList.setMINBUFFER(0);
    },
    forward: function () {
      return drawFrame(STEP_FORWARD);
    },
    backward: function () {
      return drawFrame(STEP_BACKWARD);
    },
    videoBuffering: function () {
      if(videoBufferList !== null){
        videoBufferList.clear();
        videoBufferList.setBufferFullCallback(videoBufferFull);
      }
    },
    setBufferFullCallback: function (callback) {
      bufferFullCallback = callback;
      videoBufferList.setForcePauseCallback(callback);
//      videoBufferList.setBufferFullCallback(videoBufferFull);
    },
    getCanvas: function () {
      return canvas;
    },
    terminate: function () {
      console.log('playbackDrawer terminate!');
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