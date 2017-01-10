/*jshint bitwise: false*/
"use strict"; 
/**
 * Represents RGB2dCanvas is one of drawing method which draws 2d canvas.
 * @memberof (rgbcanvas.js)
 * @ngdoc module
 * @name RGB2dCanvas
 */
var RGB2dCanvas = (function () {
    var canvas;
    var size;
    var web2dContext;
    var TempBufferFor2d;
    /**
     * Represents  a constructor object of kind rgb 2d canvas.
     * @memberof RGB2dCanvas
     * @name Constructor
     */
    function Constructor(can, s) {
        canvas = can;
        canvas.width = s.w;
        canvas.height = s.h;
        size = s;
        web2dContext = can.getContext("2d");
        TempBufferFor2d = web2dContext.createImageData(canvas.width, canvas.height);
    }

    Constructor.prototype = {
        /**
         * Represents transcode from yuv to rgb and draw image data on the canvas.
         * @memberof RGB2dCanvas
         * @name drawCanvas
         * @param {string} decoded raw data.
         * @example
         *    drawer.drawCanvas(bufferData);
         */
        drawCanvas: function (bufferData) {
            var width = canvas.width;
            var height = canvas.height;
            var yOffset = 0;
            var uOffset = width * height;
            var vOffset = width * height + (width * height) / 4;
            for (var h = 0; h < height; h++) {
                for (var w = 0; w < width; w++) {
                    var ypos = w + h * width + yOffset;

                    var upos = (w >> 1) + (h >> 1) * width / 2 + uOffset;
                    var vpos = (w >> 1) + (h >> 1) * width / 2 + vOffset;

                    var Y = bufferData[ypos];
                    var U = bufferData[upos] - 128;
                    var V = bufferData[vpos] - 128;

                    var R = (Y + 1.371 * V);
                    var G = (Y - 0.698 * V - 0.336 * U);
                    var B = (Y + 1.732 * U);

                    var outputData_pos = w * 4 + width * h * 4;
                    TempBufferFor2d.data[0 + outputData_pos] = R;
                    TempBufferFor2d.data[1 + outputData_pos] = G;
                    TempBufferFor2d.data[2 + outputData_pos] = B;
                    TempBufferFor2d.data[3 + outputData_pos] = 255;
                }
            }
            web2dContext.putImageData(TempBufferFor2d, 0, 0);
        },
        toString: function () {
            return "2dCanvas Size: " + size;
        }
    };
    return Constructor;
})();