/* global Module, Uint8Array, ArrayBuffer, setInterval, clearInterval, Size, RGB2dCanvas, YUVWebGLCanvas, KindStreamer, KindWSStreamer, KindRTSPStreamer, AudioDecoder */
"use strict";
/**
 * Represents draws video image on the canvas. Drawer has two drawing methods which are rgb and webgl.
 * @memberof (kind_stream.js)
 * @ngdoc module
 * @param {number} id channel.
 * @name KindDrawer
 */
function KindDrawer(id) {
  var Uniformity = true;
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
  var startTimestamp = 0,
    frameTimestamp = null,
    preTimestamp = 0,
    progressTime = 0,
    curTime = 0,
    imagePool = new ImagePool(),
    bufferNode;
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
    var videoBufferQueue = null;

   function  VideoBufferQueue  () {
     var MAX_LENGTH;

     function Constructor() {
       BufferQueue.call(this);
       MAX_LENGTH = 30;
     }
     Constructor.prototype = inherit(BufferQueue, {
       enqueue: function (data, width, height, codecType, frameType, timeStamp) {
         ( this.size >= MAX_LENGTH ) ? this.clear() : 0;
         var node = new videoBufferNode(data, width, height, codecType, frameType, timeStamp);
         if (this.first == null){
           this.first = node;
         } else {
           var n = this.first;
           while (n.next != null) {
             n = n.next;
           }
           n.next = node;
         }

         this.size += 1;
//         console.log("after enqueue node count is " + this.size + " frameType is " + frameType);
         return node;
       }
     });
     return  new Constructor();
   }

  function Constructor() {
    // console.log("streamDrawer Constructor!!");
    drawingStrategy = 'rgb2d';
    prevCodecType = null;
    videoBufferQueue = new VideoBufferQueue();
    frameInterval = 16.7;
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
    bufferNode = videoBufferQueue.dequeue();
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
        if(bufferNode.codecType == 'mjpeg'){
          imagePool.free(bufferNode.buffer);
          //console.log("imagePool.free");
        } else {
          delete bufferNode.buffer;
          bufferNode.buffer = null;
        }
        bufferNode.previous = null;
        bufferNode.next = null;
        bufferNode = null;
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
    if (startTimestamp == 0 || (timestamp - startTimestamp) < 200) {
      if (startTimestamp == 0){
        startTimestamp = timestamp;
      }
      if (videoBufferQueue != null) {
        window.requestAnimationFrame(drawingInTime);
      }
      return;
    }
//    console.log("drawingInTime Interval is " + (timestamp - preTimestamp));
    curTime += timestamp - preTimestamp;
    if (curTime > progressTime) {
      drawFrame() ? (progressTime += frameInterval) : 0;
      // console.log("drawingInTime curTime " + curTime + " progressTime " + progressTime);
    }
    if (curTime > 1000) {
      progressTime = 0;
      curTime = 0;
    }
    preTimestamp = timestamp;
    window.requestAnimationFrame(drawingInTime);
  };

  function drawImage(data) {
    if (preWidth === undefined || preHeight === undefined || preWidth !== data.width || preHeight !== data.height) {
      drawingStrategy = 'ImageWebGL';
      resize(data.width, data.height);
      preWidth = data.width;
      preHeight = data.height;
      resizeCallback('resize');
    }

    frameTimestamp = data.time;  //update frameTimestamp
    if (frameTimestamp !== null) {
      workerManager.timeStamp(frameTimestamp);
    }
    if (drawer !== undefined) {
      drawer.drawCanvas(data);
      if (captureFlag) {
        captureFlag = false;
        doCapture(canvas.toDataURL(), fileName);
      }
      imagePool.free(data);
      return true;
    } else {
      console.log('drawer is undefined in KindDrawer!');
    }
    return false;
  }

  function startRendering() {
    //startTimestamp = Date.now();//performance.now();
    //console.log("startRendering curTime = " + startTimestamp);
    window.requestAnimationFrame(drawingInTime);
  }

  Constructor.prototype = {
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
    drawMJPEG: function (data, width, height, codecType, frameType, timeStamp) {
      //console.log('drawMJPEG in KindDrawer!');
      var image = imagePool.alloc();
      image.width = width;
      image.height = height;
      image.codecType = codecType;
      image.frameType = frameType;
      image.time = timeStamp;
      image.onload = function() {
        if(Uniformity == false){
          drawImage(this);
        } else {
          if(videoBufferQueue !== null)
            videoBufferQueue.enqueue(this, this.width, this.height, this.codecType, this.frameType, this.time);
        }
      };
      image.setAttribute("src", "data:image/jpeg;base64," + base64ArrayBuffer(data));
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
      if(Uniformity == false){
        if (preWidth === undefined || preHeight === undefined || preWidth !== width || preHeight !== height || prevCodecType !== codecType) {
          drawingStrategy = (codecType == 'h264' || codecType == 'h265') ? 'YUVWebGL' : 'ImageWebGL';
          resize(width, height);
          preWidth = width;
          preHeight = height;
          prevCodecType = codecType;
          resizeCallback('resize');
        }

        frameTimestamp = timeStamp;  //update frameTimestamp
        if (frameTimestamp !== null) {
          workerManager.timeStamp(frameTimestamp);
        }
        if (drawer !== undefined) {
          drawer.drawCanvas(data);
          if (captureFlag) {
            captureFlag = false;
            doCapture(canvas.toDataURL(), fileName);
          }
          return true;
        } else {
          console.log('drawer is undefined in KindDrawer!');
        }
        return false;
      } else {
        if(videoBufferQueue !== null)
          videoBufferQueue.enqueue(data, width, height, codecType, frameType, timeStamp);
      }
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
      if (startTimestamp == 0 && Uniformity !== false) {
        startRendering();
      }
    },
    setFPS: function (fps) {
      if(fps === undefined){
        frameInterval = 16.7;
        maxDelay = 10 * 2;
      } else if(fps == 0){
        frameInterval = 16.7;
        maxDelay = 10 * 2;
      } else {
        frameInterval = (1000 / fps);
        maxDelay = fps * 1;
      }
    },
    setThroughPut: function(throughput){
      this.throughPut = throughput;
    },
    getCanvas: function () {
      return canvas;
    },
    renewCanvas: function () {
      resize(preWidth, preHeight);
      drawer.initCanvas();
    },
    terminate: function () {
      // console.log('streamDrawer terminate!');
      startTimestamp = 0;
      frameTimestamp = null;
      if(videoBufferQueue !== null){
        videoBufferQueue.clear();
        videoBufferQueue = null;
      }
      drawer = null;
    }
  };
  return new Constructor();
}