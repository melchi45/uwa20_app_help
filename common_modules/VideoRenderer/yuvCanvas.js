/**
 * Created by dohyuns.kim on 2016-06-23.
 */
"use strict";

// universal module definition
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.YUVCanvas = factory();
    }
}(this, function () {

    /**
     * This class can be used to render output pictures from an H264bsdDecoder to a canvas element.
     * If available the content is rendered using WebGL.
     */
    function YUVCanvas(canvas, size) {
        this.canvasElement = canvas || document.createElement("canvas");
//        this.contextOptions = parOptions.contextOptions;
//        this.type = parOptions.type || "yuv420";
//        this.customYUV444 = parOptions.customYUV444;
//        this.conversionType = parOptions.conversionType || "rec601";

        this.width = size.w || 640;
        this.height = size.h || 320;

//        this.animationTime = parOptions.animationTime || 0;

        this.canvasElement.width = this.width;
        this.canvasElement.height = this.height;

        this.initContextGL();

        if(this.contextGL) {
            this.initProgram();
            this.initBuffers();
            this.initTextures();
            this.setMatrixUniforms();
        }

        /**
         * Draw the next output picture using WebGL
         */
        this.drawNextOuptutPictureGL = function(par) {
            var gl = this.contextGL;
            var texturePosBuffer = this.texturePosBuffer;
            var uTexturePosBuffer = this.uTexturePosBuffer;
            var vTexturePosBuffer = this.vTexturePosBuffer;

            var yTextureRef = this.yTextureRef;
            var uTextureRef = this.uTextureRef;
            var vTextureRef = this.vTextureRef;

            var yData = par.yData;
            var uData = par.uData;
            var vData = par.vData;

            var width = this.width;
            var height = this.height;

            var yDataPerRow = width;
            var yRowCnt     = height;

            var uDataPerRow = (width / 2);
            var uRowCnt     = (height / 2);

            var vDataPerRow = uDataPerRow;
            var vRowCnt     = uRowCnt;

            gl.viewport(0, 0, width, height);

            var tTop = 0;
            var tLeft = 0;
            var tBottom = height / yRowCnt;
            var tRight = width / yDataPerRow;
            var texturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

            gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, texturePosValues, gl.DYNAMIC_DRAW);

            tBottom = (height / 2) / uRowCnt;
            tRight = (width / 2) / uDataPerRow;
            var uTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

            gl.bindBuffer(gl.ARRAY_BUFFER, uTexturePosBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, uTexturePosValues, gl.DYNAMIC_DRAW);

            tBottom = (height / 2) / vRowCnt;
            tRight = (width / 2) / vDataPerRow;
            var vTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

            gl.bindBuffer(gl.ARRAY_BUFFER, vTexturePosBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vTexturePosValues, gl.DYNAMIC_DRAW);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, yTextureRef);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, yDataPerRow, yRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, yData);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, uTextureRef);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, uDataPerRow, uRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, uData);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, vTextureRef);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, vDataPerRow, vRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, vData);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
    }

    /**
     * Returns true if the canvas supports WebGL
     */
    YUVCanvas.prototype.isWebGL = function() {
        return this.contextGL;
    };

    /**
     * Create the GL context from the canvas element
     */
    YUVCanvas.prototype.initContextGL = function() {
        var canvas = this.canvasElement;
        var gl = null;

        var validContextNames = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
        var nameIndex = 0;

        while(!gl && nameIndex < validContextNames.length) {
            var contextName = validContextNames[nameIndex];

            try {
                gl = canvas.getContext(contextName);
            } catch (e) {
                gl = null;
            }

            if(!gl || typeof gl.getParameter !== "function") {
                gl = null;
            }

            ++nameIndex;
        }

        this.contextGL = gl;
    };

    /**
     * Initialize GL shader program
     */
    YUVCanvas.prototype.initProgram = function() {
        var gl = this.contextGL;

        // vertex shader is the same for all types
        var vertexShaderScript;
        var fragmentShaderScript;
        vertexShaderScript = [
            'attribute vec4 vertexPos;',
            'attribute vec4 texturePos;',
            'attribute vec4 uTexturePos;',
            'attribute vec4 vTexturePos;',
            'uniform mat4 uMVMatrix;',
            'uniform mat4 uPMatrix;',
            'varying vec2 textureCoord;',
            'varying vec2 uTextureCoord;',
            'varying vec2 vTextureCoord;',

            'void main()',
            '{',
//            '  gl_Position = vertexPos;',
            '  gl_Position = uPMatrix * uMVMatrix * vertexPos;',
            '  textureCoord = texturePos.xy;',
            '  uTextureCoord = uTexturePos.xy;',
            '  vTextureCoord = vTexturePos.xy;',
            '}'
        ].join('\n');

        fragmentShaderScript = [
            'precision highp float;',
            'varying highp vec2 textureCoord;',
            'varying highp vec2 uTextureCoord;',
            'varying highp vec2 vTextureCoord;',
            'uniform sampler2D ySampler;',
            'uniform sampler2D uSampler;',
            'uniform sampler2D vSampler;',
            'uniform mat4 YUV2RGB;',

            'void main(void) {',
            '  highp float y = texture2D(ySampler,  textureCoord).r;',
            '  highp float u = texture2D(uSampler,  uTextureCoord).r;',
            '  highp float v = texture2D(vSampler,  vTextureCoord).r;',
            '  gl_FragColor = vec4(y, u, v, 1) * YUV2RGB;',
            '}'
        ].join('\n');

        // assume ITU-T Rec. 601
        var YUV2RGB = [
            1.16438,  0.00000,  1.59603, -0.87079,
            1.16438, -0.39176, -0.81297,  0.52959,
            1.16438,  2.01723,  0.00000, -1.08139,
            0, 0, 0, 1
        ];

        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderScript);
        gl.compileShader(vertexShader);
        if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.log('Vertex shader failed to compile: ' + gl.getShaderInfoLog(vertexShader));
        }

        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderScript);
        gl.compileShader(fragmentShader);
        if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.log('Fragment shader failed to compile: ' + gl.getShaderInfoLog(fragmentShader));
        }

        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.log('Program failed to compile: ' + gl.getProgramInfoLog(program));
        }

        gl.useProgram(program);

        var YUV2RGBRef = gl.getUniformLocation(program, 'YUV2RGB');
        gl.uniformMatrix4fv(YUV2RGBRef, false, YUV2RGB);

        this.shaderProgram = program;
    };

    /**
     * Initialize vertex buffers and attach to shader program
     */
    YUVCanvas.prototype.initBuffers = function() {
        var gl = this.contextGL;
        var program = this.shaderProgram;

        this.perspectiveMatrix = makePerspective(45, 1, 0.1, 100.0);

        // Set the drawing position to the "identity" point, which is
        // the center of the scene.
        this.mvIdentity.call(this);

        // Now move the drawing position a bit to where we want to start
        // drawing the square.
        this.mvTranslate.call(this, [0.0, 0.0, -2.415]);

        var vertexPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);

        var vertexPosRef = gl.getAttribLocation(program, 'vertexPos');
        gl.enableVertexAttribArray(vertexPosRef);
        gl.vertexAttribPointer(vertexPosRef, 2, gl.FLOAT, false, 0, 0);

        if (this.animationTime){

            var animationTime = this.animationTime;
            var timePassed = 0;
            var stepTime = 15;

            var aniFun = function(){
                timePassed += stepTime;
                var mul = ( 1 * timePassed ) / animationTime;

                if (timePassed >= animationTime){
                    mul = 1;
                }else{
                    setTimeout(aniFun, stepTime);
                }

                var neg = -1 * mul;
                var pos = 1 * mul;

                var vertexPosBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([pos, pos, neg, pos, pos, neg, neg, neg]), gl.STATIC_DRAW);

                var vertexPosRef = gl.getAttribLocation(program, 'vertexPos');
                gl.enableVertexAttribArray(vertexPosRef);
                gl.vertexAttribPointer(vertexPosRef, 2, gl.FLOAT, false, 0, 0);

                try{
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                }catch(e){}
            };
            aniFun();
        }

        var texturePosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);

        var texturePosRef = gl.getAttribLocation(program, 'texturePos');
        gl.enableVertexAttribArray(texturePosRef);
        gl.vertexAttribPointer(texturePosRef, 2, gl.FLOAT, false, 0, 0);

        this.texturePosBuffer = texturePosBuffer;

        var uTexturePosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uTexturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);

        var uTexturePosRef = gl.getAttribLocation(program, 'uTexturePos');
        gl.enableVertexAttribArray(uTexturePosRef);
        gl.vertexAttribPointer(uTexturePosRef, 2, gl.FLOAT, false, 0, 0);

        this.uTexturePosBuffer = uTexturePosBuffer;


        var vTexturePosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vTexturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);

        var vTexturePosRef = gl.getAttribLocation(program, 'vTexturePos');
        gl.enableVertexAttribArray(vTexturePosRef);
        gl.vertexAttribPointer(vTexturePosRef, 2, gl.FLOAT, false, 0, 0);

        this.vTexturePosBuffer = vTexturePosBuffer;
    };

    /**
     * Initialize GL textures and attach to shader program
     */
    YUVCanvas.prototype.initTextures = function() {
        var gl = this.contextGL;
        var program = this.shaderProgram;
        var yTextureRef = this.initTexture();
        var ySamplerRef = gl.getUniformLocation(program, 'ySampler');
        gl.uniform1i(ySamplerRef, 0);
        this.yTextureRef = yTextureRef;

        var uTextureRef = this.initTexture();
        var uSamplerRef = gl.getUniformLocation(program, 'uSampler');
        gl.uniform1i(uSamplerRef, 1);
        this.uTextureRef = uTextureRef;

        var vTextureRef = this.initTexture();
        var vSamplerRef = gl.getUniformLocation(program, 'vSampler');
        gl.uniform1i(vSamplerRef, 2);
        this.vTextureRef = vTextureRef;
    };

    /**
     * Create and configure a single texture
     */
    YUVCanvas.prototype.initTexture = function() {
        var gl = this.contextGL;

        var textureRef = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, textureRef);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return textureRef;
    };

    /**
     * Draw picture data to the canvas.
     * If this object is using WebGL, the data must be an I420 formatted ArrayBuffer,
     * Otherwise, data must be an RGBA formatted ArrayBuffer.
     */
    YUVCanvas.prototype.drawCanvas = function(data) {
        var gl = this.contextGL;
        var ylen = this.width * this.height;
        var uvlen = (this.width / 2) * (this.height / 2);

        if(gl) {
            this.drawNextOuptutPictureGL({
                yData: data.subarray(0, ylen),
                uData: data.subarray(ylen, ylen + uvlen),
                vData: data.subarray(ylen + uvlen, ylen + uvlen + uvlen)
            });
        } else {
            this.drawNextOuptutPictureRGBA(this.width, this.height, croppingParams, {
                yData: data.subarray(0, ylen),
                uData: data.subarray(ylen, ylen + uvlen),
                vData: data.subarray(ylen + uvlen, ylen + uvlen + uvlen)
            });
        }
    };

    /**
     * Draw next output picture using ARGB data on a 2d canvas.
     */
    YUVCanvas.prototype.drawNextOuptutPictureRGBA = function(width, height, croppingParams, data) {
        var canvas = this.canvasElement;

        var cropping = null;
        var argbData = data;

        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, width, height);
        imageData.data.set(argbData);

        if(cropping === null) {
            ctx.putImageData(imageData, 0, 0);
        } else {
            ctx.putImageData(imageData, -cropping.left, -cropping.top, 0, 0, cropping.width, cropping.height);
        }
    };

    YUVCanvas.prototype.mvIdentity = function () {
        this.mvMatrix = Matrix.I(4);
    };

    YUVCanvas.prototype.mvMultiply = function (m) {
        this.mvMatrix = this.mvMatrix.x(m);
    };

    YUVCanvas.prototype.mvTranslate = function (m) {
        this.mvMultiply.call(this, Matrix.Translation($V([m[0], m[1], m[2]])).ensure4x4());
    };

    YUVCanvas.prototype.setMatrixUniform = function (name, array) {
        var gl = this.contextGL;
        var program = this.shaderProgram;
        var uniform = gl.getUniformLocation(program, name);
        gl.uniformMatrix4fv(uniform, false, array);
    };

    YUVCanvas.prototype.setMatrixUniforms = function () {
        this.setMatrixUniform("uPMatrix", new Float32Array(this.perspectiveMatrix.flatten()));
        this.setMatrixUniform("uMVMatrix", new Float32Array(this.mvMatrix.flatten()));
    };

    YUVCanvas.prototype.drawScene = function () {
        var gl = this.contextGL;
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    YUVCanvas.prototype.zoomScene = function (data) {
        this.mvIdentity.call(this);
        this.mvTranslate.call(this, [data[0], data[1], data[2]]);
        this.setMatrixUniforms.call(this);
        this.drawScene();
    };

    YUVCanvas.prototype.updateVertexArray = function(vertexArray) {
        this.zoomScene(vertexArray);
    };

    return YUVCanvas;
}));

var ImageCanvas = (function () {
    function Constructor(canvas, size) {
        YUVCanvas.call(this, canvas, size);
    }

    Constructor.prototype = inherit(YUVCanvas, {
        drawNextOuptutPictureGL : function (objImage) {
            var gl = this.contextGL;
            var texturePosBuffer = this.texturePosBuffer;
            var uTexturePosBuffer = this.uTexturePosBuffer;
            var vTexturePosBuffer = this.vTexturePosBuffer;

            var yTextureRef = this.yTextureRef;
            var uTextureRef = this.uTextureRef;
            var vTextureRef = this.vTextureRef;

            var yData = par.yData;
            var uData = par.uData;
            var vData = par.vData;

            var width = this.width;
            var height = this.height;

            var yDataPerRow = width;
            var yRowCnt     = height;

            var uDataPerRow = (width / 2);
            var uRowCnt     = (height / 2);

            var vDataPerRow = uDataPerRow;
            var vRowCnt     = uRowCnt;

            gl.viewport(0, 0, width, height);

            var tTop = 0;
            var tLeft = 0;
            var tBottom = height / yRowCnt;
            var tRight = width / yDataPerRow;
            var texturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

            gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, texturePosValues, gl.DYNAMIC_DRAW);

            tBottom = (height / 2) / uRowCnt;
            tRight = (width / 2) / uDataPerRow;
            var uTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

            gl.bindBuffer(gl.ARRAY_BUFFER, uTexturePosBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, uTexturePosValues, gl.DYNAMIC_DRAW);

            tBottom = (height / 2) / vRowCnt;
            tRight = (width / 2) / vDataPerRow;
            var vTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

            gl.bindBuffer(gl.ARRAY_BUFFER, vTexturePosBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vTexturePosValues, gl.DYNAMIC_DRAW);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, yTextureRef);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, yDataPerRow, yRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, yData);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, uTextureRef);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, uDataPerRow, uRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, uData);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, vTextureRef);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, vDataPerRow, vRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, vData);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        },
        drawCanvas: function (objImage) {
            var gl = this.contextGL;
            if(gl) {
                this.drawNextOutputPictureGL( objImage );
            } else {
                this.drawNextOutputPictureRGBA(this.width, this.height, croppingParams, objImage );
            }
        }
    });
    return Constructor;
})();
