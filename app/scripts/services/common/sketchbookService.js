kindFramework.factory('sketchbookService', function() {
    'use strict';
    return {
        get: function() {
            return this.sketchManager.get();
        },
        set: function(jsonData, flag) {
            if (this.sketchManager !== undefined) this.sketchManager.set(jsonData, flag);
        },
        changeFlag: function(flag) {
            if (this.sketchManager !== undefined) this.sketchManager.changeFlag(flag);
        },
        changeRatio: function(ratio) {
            if (this.sketchManager !== undefined) this.sketchManager.changeRatio(ratio);
        },
        setEnableForSVG: function(index, enableOption){
            if (this.sketchManager !== undefined){
                this.sketchManager.setEnableForSVG(index, enableOption);
            }
        },
        activeShape: function(index){
            if (this.sketchManager !== undefined){
                this.sketchManager.activeShape(index);
            }
        },
        changeArrow: function(index, arrow){
            if (this.sketchManager !== undefined){
                this.sketchManager.changeArrow(index, arrow);
            }
        },
        changeMinSizeOption: function(width, height){
            var returnVal = false;

            if (this.sketchManager !== undefined){
                returnVal = this.sketchManager.changeMinSizeOption(width, height);
            }

            return returnVal;
        },
        changeMaxSizeOption: function(width, height){
            var returnVal = false;

            if (this.sketchManager !== undefined){
                returnVal = this.sketchManager.changeMaxSizeOption(width, height);
            }

            return returnVal;
        },
        changeRectangleToSize: function(index, width, height){
            if (this.sketchManager !== undefined){
                this.sketchManager.changeRectangleToSize(index, width, height);
            }
        },
        removeDrawingGeometry: function(){
            if (this.sketchManager !== undefined){
                this.sketchManager.removeDrawingGeometry();
            }
        },
        alignCenter: function(){
            if (this.sketchManager !== undefined){
                this.sketchManager.alignCenter();
            }  
        },
        getConvertedVideoHeight: function(maxWidth, maxHeight) {
            var ratio = (maxWidth / maxHeight).toFixed(1);
            var convertedHeight = 0;
            ratio = parseFloat(ratio);
            if (ratio === 1.3) { //4:3
                convertedHeight = 480;
            } else if (ratio === 1.8) { //16:9
                convertedHeight = 360;
            } else if (ratio === 1.9) { //4096x2160
                convertedHeight = 337;
            } else if (ratio === 1.7) { //2592x1520
                convertedHeight = 376;
            } else if (ratio === 1) { //1:1
                convertedHeight = 640;
            } else if (ratio === 2.3) { //21:9
                convertedHeight = 278;
            }
            return convertedHeight;
        },
        drawMetaData: function(){
            if (this.sketchManager !== undefined){
                this.sketchManager.drawMetaData.apply(this.sketchManager, arguments);
            }  
        },
        drawMetaDataAll: function(){
            if (this.sketchManager !== undefined){
                this.sketchManager.drawMetaDataAll.apply(this.sketchManager, arguments);
            }  
        }
    };
});