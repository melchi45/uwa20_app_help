"use strict";
kindStreamModule.factory('kindStreamInterface', function(ConnectionSettingService, playbackStepService, 
	UniversialManagerService, CAMERA_STATUS, PLAYBACK_TYPE, $rootScope, EventNotificationService, $timeout,
	BrowserService) {
		/**
		 * itself.
		 * @var manager
		 * @memberof kindStreamInterface
		 */
		var manager = null;
		var streamCanvas;
		var saveCanvas;
		var pixelCanvas;
		var ispreview;
		var curViewMode;
		var bottomMenuHeight = 50;
		var currentPage = null;
		var tagType = null;
		var callbackArray = new Array();

		var loadingBar = function(flag) {
			$rootScope.$emit('changeLoadingBar', flag);
		};

		var getBorderElement = function(){
			var element = null;
			if($('.wn5-setup-wrapper').length === 0){
				element = streamCanvas;
			}else{
				element = $("#setup-border-box");
			}

			return element;
		};

		var setCanvasStyle = function(mode, controlShow) {
                                if(controlShow === undefined){
                                    var bottomMenu = $("#cm-bottom-menu");
                                    controlShow = bottomMenu.hasClass('cm-show-menu')? true : false;
                                }

                                setContainerSize(controlShow);

		 	if (streamCanvas === null || streamCanvas === undefined) {
		 		return;
			}

			pixelCanvas = $("#cm-livecanvas");

			if (tagType !== UniversialManagerService.getVideoMode()) {
				tagType = UniversialManagerService.getVideoMode();
				if(tagType === "canvas"){
					streamCanvas = $("#livecanvas");
				}else if(tagType === "video"){
					streamCanvas = $("#video-container");
				}

				EventNotificationService.setBorderElement(getBorderElement(), currentPage);
			}
		 	UniversialManagerService.setViewModeType(mode);

		 	var container = $("#container, .channel-container");
	 		if (mode === 'originalsize') {
	 			curViewMode = mode;
	 			container.css("overflow", "auto");

				var newSize = getSize();
				streamCanvas.css({
					width: newSize.width + "px",
					height: newSize.height + "px"
				});

				setPosition(newSize.width, newSize.height);
	 		} else if (mode === 'fit') {
	 			curViewMode = mode;
	 			container.css("overflow", "hidden");

				streamCanvas.css({
					width: "100%",
					height: "100%",
					top: 0,
					left: 0
				});
				pixelCanvas.css({
					top: 3+"px",
					left: 3+"px"
				});

      			var plugin = (UniversialManagerService.getStreamingMode() === CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE) ? true : false;
				if(plugin && !(UniversialManagerService.getViewMode() == 0 || UniversialManagerService.getIsCapturedScreen())){
					streamCanvas.css({
						height: (window.innerHeight - bottomMenuHeight) + "px"
					});
				}
	 		} else if (mode === 'originalratio' || curViewMode === 'originalratio' || mode === 'resize') {
	 			if (mode === 'originalratio') {
	  				curViewMode = mode; // when dynamically browser size changed, check ratio mode with this var
	  			}
	  			container.css("overflow", "hidden");

			    setCanvasBytestRatio();
			}

			$rootScope.$emit('update-dot-dptz', true);

			function setContainerSize(controlShow){
				// var checkLiveSize = (window.innerWidth < 800) && ($('.cm-live-icon-list').length);
				// if(controlShow){
				// 	bottomMenuHeight = checkLiveSize? 350 : 250;
                                    // }else{
                                    //      bottomMenuHeight = checkLiveSize? 150 : 50;
                                    // }

                                    var checkType = $('.cm-live-icon-list').length;
                                    var checkSize = window.innerWidth;
                                    var checkHeight = window.innerHeight;
                                    var smallerHeight;

                                    if(checkHeight < 400) {
                                        if($(".kind-responsive-live").length)   $(".kind-responsive-live").addClass('land-scape');
                                        if($(".kind-responsive-playback").length)   $(".kind-responsive-playback").addClass('land-scape');

                                       // 하단 메뉴 On-Off시 width 차이
                                       var bottomMenuWidth;
                                        if(controlShow) bottomMenuWidth = 470;
                                        else bottomMenuWidth = 70;

                                        $("#cm-video").removeAttr('style');
                                        $("#cm-video").css({ width: "calc(100% - "+ (bottomMenuWidth) +"px)" });
                                        if( $(".full-screen img").length || $(".full-screen object").length){
                                            $(".full-screen kind_stream").css({ width: "100%" });
                                            $(".full-screen").css({ width: "calc(100% - "+ bottomMenuWidth +"px)" });
                                        }else{
                                            $(".full-screen").css({ width: "100%" });
                                            // $(".full-screen kind_stream").css({ width: "calc(100% - "+ bottomMenuWidth +"px)" });
                                        }

                                        if(UniversialManagerService.getViewMode() != 0){
                                            $("#cm-video").css({ width: "calc(100% - "+ bottomMenuWidth +"px)" });
                                        }

                                    } else {
                                        $(".land-scape").removeClass('land-scape');

                                       // 하단 메뉴 On-Off시 height 차이

                                       if(checkSize > 2300 && checkHeight > 1294){
                                       	  if(controlShow) bottomMenuHeight = 400;
                                          else bottomMenuHeight = 115;
                                       }else {
                                       	  if(controlShow) bottomMenuHeight = 260;
                                          else bottomMenuHeight = 60;
                                       }

                                       if (checkSize > 3000 && checkHeight > 1688) {
                                       	  if(controlShow) bottomMenuHeight = 500;
                                          else bottomMenuHeight = 145;

                                       }
                                        

                                        // Default Show 상태의 메뉴 > Responsive 상태일시 2줄
                                        // Live에서는 변경점  900
                                        if(checkSize < 800 || (checkSize < 900 && checkType)) bottomMenuHeight += 50;

                                        // live page 에서는 하단의 길이가 더 김
                                        if(checkType && checkSize < 900) bottomMenuHeight += 50;


                                        $("#cm-video").removeAttr('style');
                                        $("#cm-video").css({ height: "calc(100% - "+ (bottomMenuHeight + 50) +"px)" });
                                        if( $(".full-screen img").length || $(".full-screen object").length){
                                            $(".full-screen kind_stream").css({ height: "100%" });
                                            $(".full-screen").css({ height: "calc(100% - "+ bottomMenuHeight +"px)" });
                                        }else{
                                            $(".full-screen").css({ height: "100%" });
                                            $(".full-screen kind_stream").css({ height: "calc(100% - "+ bottomMenuHeight +"px)" });
                                        }

                                        if(UniversialManagerService.getViewMode() != 0){
                                            $("#cm-video").css({ height: "calc(100% - "+ bottomMenuHeight +"px)" });
                                        }
                                    }
			}

			function getSize(boxWidth, boxHeight){
  				var width, height;
  				if(streamCanvas[0]  !== undefined){
	  				if(streamCanvas[0].id === "video-container"){
		  				width = streamCanvas.find("video")[0].videoWidth;
		  				height = streamCanvas.find("video")[0].videoHeight;
	  				}else{
		  				width = parseInt(streamCanvas.attr("width"), 10);
		  				height = parseInt(streamCanvas.attr("height"), 10);
	  				}

	  				var newWidth = width; 
	  				var newHeight = height;
	  				if(boxWidth !== undefined && boxHeight !== undefined){
	  					newWidth = boxWidth / width;
	  					newHeight = boxHeight / height;

	  					var min = Math.min(newWidth, newHeight);
	  					newWidth = Math.floor(width * min);
	  					newHeight = Math.floor(height * min);

	  					if(UniversialManagerService.getRotate() === "0"){
		  					if(newWidth < 320){
		  						newWidth = 320;
		  						newHeight = (320 / width) * height;

		  						container.css("overflow", "auto");
		  					}
	  					}else{
		  					if(newHeight < 320){
		  						newHeight = 320;
		  						newWidth = (320 / height) * width;

		  						container.css("overflow", "auto");
		  					}
	  					}
	  				}

	  				return {
						width: newWidth,
						height: newHeight
					}
  				}
			}

	  		function setCanvasBytestRatio() {
	  			var boxSize = getBoxSize();

				if(boxSize === null){
					if (streamCanvas.hasClass('dptz') === false) {
						streamCanvas.css({
							width: "100%",
							height: "100%"
						});
					}
				}else{
		  			var wWidth = boxSize.width;
		  			var wHeight = boxSize.height;
					var newSize = getSize(wWidth, wHeight);
					if(newSize !== undefined){
						streamCanvas.css({
							width: newSize.width + "px",
							height: newSize.height + "px"
						});

						setPosition(newSize.width, newSize.height);
					}
				}
			} //setCanvasBytestRatio
			
			if(streamCanvas[0] !== undefined && BrowserService.BrowserDetect !== BrowserService.BROWSER_TYPES.IE) {
				$rootScope.$emit("pixelCount::setSize", streamCanvas[0].clientWidth, streamCanvas[0].clientHeight);
			}
		}; //setCanvasStyle

		function setPosition(width, height){
			var boxSize = getBoxSize();
			var top = (boxSize.height - height) / 2;
			var left = (boxSize.width - width) / 2;

			if(top <= 0){
				top = 0;
			}
			if(left <= 0){
				left = 0;
			}

			streamCanvas.css({
				top: top + "px",
				left: left + "px"
			});
			pixelCanvas.css({
				top: (top+3) + "px",
				left: (left+3) + "px"
			});
		}

		function getBoxSize(){
		  	var wWidth, wHeight;
			// main view or captured screen
			if (UniversialManagerService.getViewMode() == 0 || UniversialManagerService.getIsCapturedScreen()) {
				if(!$(".channel-container").length){
					return null;
				}
				wWidth = $(".channel-container")[0].clientWidth;
				wHeight = $(".channel-container")[0].clientHeight;

				// when close full screen by esc key or by capture, use prev size to reset in main view
				if (wWidth === 0 || wHeight === 0) { 
					var channelView = $('.channels-view');
					channelView.removeClass('ng-hide');
					wWidth = channelView.width();
					wHeight = channelView.height();

					// in case that captured screen closed
					if (UniversialManagerService.getIsCapturedScreen()) { 
						UniversialManagerService.setIsCapturedScreen(false);
					}
				}
				EventNotificationService.setViewMode("default");
			} else {
				// full screen
				wWidth = window.innerWidth;
				wHeight = window.innerHeight - bottomMenuHeight;
				EventNotificationService.setViewMode("fullScreen");
			}

			return {
				width : wWidth,
				height : wHeight
			}
		}

return {
	/**
	 * Represents initialize a kind stream manager.
	 * @memberof kindStreamInterface
	 * @name init
	 * @param {object} info is object which has a device and media information.
	 * @example kindStreamInterface.init(info);
	 */
	init: function(info, sunapiClient) {
	 	manager = new KindStreamManager();
	 	manager.initKindStreamPlayer(info, sunapiClient);
	 	manager.setBufferingFunc(this.setBufferingData);
	 	// workerManager.setCallback('resize', this.setCanvasStyle);
	 	// workerManager.setCallback('videoMode', UniversialManagerService.setVideoMode);
	 	// workerManager.setCallback('metaEvent', EventNotificationService.updateEventStatus);
	 	// workerManager.setCallback('loadingBar', this.loadingBar);
		var channelId = info.device.channelId;
		for (var i = 0; i < callbackArray.length; i++) {
			this.controlWorker(callbackArray[i]);
		}
		this.controlWorker({'channelId':channelId, 'cmd':'setCallback', 'data':['resize', this.setCanvasStyle]});
		this.controlWorker({'channelId':channelId, 'cmd':'setCallback', 'data':['videoMode', UniversialManagerService.setVideoMode]});
		this.controlWorker({'channelId':channelId, 'cmd':'setCallback', 'data':['metaEvent', EventNotificationService.updateEventStatus]});
		this.controlWorker({'channelId':channelId, 'cmd':'setCallback', 'data':['loadingBar', this.loadingBar]});
	},
	destroyPlayer: function(){
		if(manager === undefined || manager === null)
			return false;

		manager.destroyPlayer();	
	},
	setBufferingData: function(frame, timeData, codec, decodeFunc, limitResolution) {
		if(manager === undefined || manager === null)
			return false;

		var currentCmd = ConnectionSettingService.getCurrentCommand();
		if (currentCmd == "backward" || currentCmd == "forward") {
			if (playbackStepService.getDecodeFunc() == null || (playbackStepService.getCurrentCodec() != codec)) {
				playbackStepService.init();
				manager.decoderInit(codec);
				playbackStepService.setDecodeFunc(decodeFunc)
			}
			if (playbackStepService.getSettingCheck() == false) {
				playbackStepService.setBufferData(frame, timeData, codec);
			} else {
				ConnectionSettingService.applyPauseCommand();
			}
		} else {
			if (playbackStepService.getSettingFlag()) {
				playbackStepService.setSettingFlag(false);
			}
			if (currentCmd != "pause") {
				decodeFunc(frame, 'playback', limitResolution);
			}
		}
	},
    /**
    * Represents control a kind stream player through the manager.
    * @memberof kindStreamInterface
    * @name changeStreamInfo
    * @param {object} info is object which has a device and media information.
    * @example kindStreamInterface.changeStreamInfo(info);
    */
    changeStreamInfo: function(kindplayerdata) {
    	if( kindplayerdata === undefined ) return false;
			if(manager === undefined || manager === null)
				return false;
    	console.log("Kind Stream Profile is changed !");
    	manager.controlPlayer(kindplayerdata);
    	var cmd = kindplayerdata.media.requestInfo.cmd;
    	if (cmd === 'capture' /*|| cmd === 'seek' || cmd === 'open'*/ )
    		kindplayerdata.media.requestInfo.cmd = 'init';
    },
    changeDrawInfo: function(data) {
			if(manager === undefined || manager === null)
				return false;    	
    	var info = {
    		device: {
    			channelId: 0
    		},
    		media: {
    			requestInfo: {
    				cmd: 'dZoom',
    				data: data
    			}
    		}
    	};
    	manager.controlPlayer(info);
    },
		controlWorker: function(controlData) {
			if(manager === undefined || manager === null) {
				if (controlData.cmd === "setCallback") {
					callbackArray[callbackArray.length] = controlData;
					return;
				}
				return;
			}

			//controlData = {'channelId':0, 'cmd':'', 'data': ['data1', 'data2']}
			manager.controlWorker(controlData);
		},    
    controlAudioIn: function(data) {
			if(manager === undefined || manager === null)
				return false;

    	var info = {
    		device: {
    			channelId: 0
    		},
    		media: {
    			requestInfo: {
    				cmd: 'audioIn',
    				data: data
    			}
    		}
    	};
    	manager.controlPlayer(info);
    },
    controlAudioOut: function(data) {
			if(manager === undefined || manager === null)
				return false;
				    	
    	var info = {
    		device: {
    			channelId: 0
    		},
    		media: {
    			requestInfo: {
    				cmd: 'audioOut',
    				data: data
    			}
    		}
    	};
    	manager.controlPlayer(info);
    },
    managerCheck: function() {
    	return (manager ? true : false);
    },
    setStreamCanvas: function(element) {
    	streamCanvas = element;
    },
    setResizeEvent: function() {
    	window.onresize = setCanvasStyle;
    },
    getStreamCanvas: function() {
    	return streamCanvas;
    },
    setCanvasStyle: function(mode, controlShow) {
    	setCanvasStyle(mode, controlShow);
    },
    loadingBar: function(flag) {
    	loadingBar(flag);
    },
    setIspreview: function(value, pageName) {
    	ispreview = value;
    	if(!ispreview){
    		currentPage = 'live';
    	}else{
    		currentPage = pageName;
    	}

    	EventNotificationService.setBorderElement(getBorderElement(), currentPage);
    },
    getIspreview: function() {
    	return ispreview;
    }
  };
});