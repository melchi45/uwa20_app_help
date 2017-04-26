var KindDisplay = angular.module('KindDisplayModule',[]);
KindDisplay
    .factory('DisplayService', function(){
        return function(){

            var previous;
            
            var width,height,style,time;

            var divisionSize = function(targetWidth,targetHeight,stageWidth,stageHeight){
                var stageSum  = stageHeight + stageWidth;
                var sw = stageWidth*100/stageSum;
                var sh = stageHeight*100/stageSum;

                var targetSum  = targetHeight + targetWidth;
                var cw = targetWidth*100/targetSum;
                var ch = targetHeight*100/targetSum;

                var newWidth = sw - cw;
                var newHeight = sh - ch;
                
                return newWidth < newHeight;
            };

            var fullSize = function(element,stage){  
				element.find(' > div').css('overflow', '');
							
                var canvas  = $('canvas',element);
                style = canvas.attr('style');
                
                var size = {
                    tw:canvas.width(),
                    th:canvas.height(),
                    sw:stage.width(),
                    sh:stage.height()
                }

              if (!document.fullscreenElement &&    // alternative standard method
                  !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen();
                } else if (document.documentElement.msRequestFullscreen) {
                  document.documentElement.msRequestFullscreen();
                } else if (document.documentElement.mozRequestFullScreen) {
                  document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                  document.documentElement.webkitRequestFullscreen();
                }
              }
                
                
                element.addClass('full-screen');
                element.removeClass('origin-screen');
                element.removeClass('fit-screen');
                
                time = new Date().getTime();
                element.after("<span data-full-screen='"+previous+"'></span>");
                // stage.prepend(element);

                if(divisionSize(size.tw,size.th,size.sw,size.sh)){
                    canvas.addClass('full-screen-set-width');
                }else{
                    canvas.addClass('full-screen-set-height');
                }


                
                var touchTimer = null;
                var lastTouch = null;
                element.bind('touchstart', function(event) {
                  var now = new Date().getTime();
                  lastTouch = lastTouch || now + 1;
                  var delta = now - lastTouch;
                  var TIME_SET = 200;
                  touchTimer = new Timer(function(){
                      touchTimer.clearTimeout();
                      lastTouch = null;
                    }, TIME_SET);

                  if(delta < TIME_SET && delta > 0){
                      closeFullScreen();
                  } else {
                    touchTimer.resetTime(TIME_SET);
                  }
                });
                
                /*
                element.dblclick(function(){
                    
                    closeFullScreen();
                });
                */
            };

            var closeFullScreen = function(){
                var span = $("span[data-full-screen]");
                var element = $("channel_player.full-screen").length != 0 ? $("channel_player.full-screen") : $("kind-stream.full-screen");
								element.find(' > div').css('overflow', 'auto');
                var canvas  = $('canvas',element);
                if(span.length != 0){
                    span.after(element).remove();
                    element.removeClass('full-screen');
                    
                    if (document.exitFullscreen) {
                      document.exitFullscreen();
                    } else if (document.msExitFullscreen) {
                      document.msExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                      document.mozCancelFullScreen();
                    } else if (document.webkitExitFullscreen) {
                      document.webkitExitFullscreen();
                    }
                    
                    var previous = span.attr('data-full-screen');
                    switch(previous){
                        case'fit-screen':
                            fitSize(element);
                        break;
                        case'origin-screen':
                            originSize(element);
                        break;
                        case 'undefined':
                            canvas.removeClass('full-screen-set-width');
                            canvas.removeClass('full-screen-set-height');
                        break;
                    }
                }else{
                      element.remove();
                }
            };
            
            
            var originSize = function(element){
                previous = 'origin-screen';
                element.addClass('origin-screen');
                element.removeClass('fit-screen');
                
                var canvas  = $('canvas',element);

                width = canvas.attr('width');   
                height = canvas.attr('height');   
                style = canvas.attr('style');
                canvas.css({width:width+'px',height:height+'px'});
            };

            var fitSize = function(element){
                previous = 'fit-screen';
                var stage = element.find('div');
                var canvas  = $('canvas',element);

                var size = {
                    tw:canvas.width(),
                    th:canvas.height(),
                    sw:stage.width(),
                    sh:stage.height()
                }
                
                element.addClass('fit-screen');
                element.removeClass('origin-screen');
                if(divisionSize(size.tw,size.th,size.sw,size.sh)){
                    canvas.css({width:"100%",height:"auto"});
                }else{
                    canvas.css({height:"100%",width:"auto"});
                }
            };


            return {
                previous:previous,
                fullSize:fullSize,
                closeFullScreen:closeFullScreen,
                originSize:originSize,
                fitSize:fitSize
            }
    
        }
    });

