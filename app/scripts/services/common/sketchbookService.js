kindFramework.factory('sketchbookService', function() {
  'use strict';
  return {
    get: function() {
      return this.sketchManager.get();
    },
    set: function(jsonData, flag) {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.set(jsonData, flag);
      }
    },
    changeFlag: function(flag) {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.changeFlag(flag);
      }
    },
    changeRatio: function(ratio) {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.changeRatio(ratio);
      }
    },
    changeWFDFillColor: function(fillColor) {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.changeWFDFillColor(fillColor);
      }
    },
    setEnableForSVG: function(index, enableOption) {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.setEnableForSVG(index, enableOption);
      }
    },
    activeShape: function(index) {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.activeShape(index);
      }
    },
    changeArrow: function(index, arrow) {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.changeArrow(index, arrow);
      }
    },
    changeMinSizeOption: function(width, height) {
      var returnVal = false;

      if (typeof this.sketchManager !== "undefined") {
        returnVal = this.sketchManager.changeMinSizeOption(width, height);
      }

      return returnVal;
    },
    changeMaxSizeOption: function(width, height) {
      var returnVal = false;

      if (typeof this.sketchManager !== "undefined") {
        returnVal = this.sketchManager.changeMaxSizeOption(width, height);
      }

      return returnVal;
    },
    changeRectangleToSize: function(index, width, height) {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.changeRectangleToSize(index, width, height);
      }
    },
    removeDrawingGeometry: function() {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.removeDrawingGeometry();
      }
    },
    moveTopLayer: function(index) {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.moveTopLayer(index);
      }
    },
    alignCenter: function() {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.alignCenter();
      }
    },
    getConvertedVideoHeight: function(maxWidth, maxHeight) {
      var ratio = (maxWidth / maxHeight).toFixed(1);
      var convertedHeight = 0;
      var RATIO_FACTORY = {
        R4x3: 1.3,
        R16x9: 1.8,
        R4096x2160: 1.9,
        R2592x1520: 1.7,
        R1x1: 1,
        R21x9: 2.3
      };

      ratio = parseFloat(ratio);
      if (ratio === RATIO_FACTORY.R4x3) { //4:3
        convertedHeight = 480;
      } else if (ratio === RATIO_FACTORY.R16x9) { //16:9
        convertedHeight = 360;
      } else if (ratio === RATIO_FACTORY.R4096x2160) { //4096x2160
        convertedHeight = 337;
      } else if (ratio === RATIO_FACTORY.R2592x1520) { //2592x1520
        convertedHeight = 376;
      } else if (ratio === RATIO_FACTORY.R1x1) { //1:1
        convertedHeight = 640;
      } else if (ratio === RATIO_FACTORY.R21x9) { //21:9
        convertedHeight = 278;
      }
      return convertedHeight;
    },
    drawMetaData: function() {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.drawMetaData.apply(this.sketchManager, arguments);
      }
    },
    drawMetaDataAll: function() {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.drawMetaDataAll.apply(this.sketchManager, arguments);
      }
    },
    stopEvent: function() {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.stopEvent();
      }
    },
    startEvent: function() {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.startEvent();
      }
    },
    hideGeometry: function(index) {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.hideGeometry(index);
      }
    },
    showGeometry: function(index) {
      if (typeof this.sketchManager !== "undefined") {
        this.sketchManager.showGeometry(index);
      }
    },
    getErrorRange: function() {
      if (typeof this.sketchManager !== "undefined") {
        return this.sketchManager.getErrorRange();
      }
      return false;
    }
  };
});