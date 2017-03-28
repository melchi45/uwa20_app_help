kindFramework.directive('liveIconList', function(
	$rootScope,
	$timeout,
	Attributes,
	SunapiClient,
	CameraService,
	AccountService,
	BACKUP_STATUS,
	BrowserService,
	UniversialManagerService,
	CAMERA_STATUS,
	SearchDataModel
	){
	"use strict";
	return {
		restrict: 'E',
		replace: true,
		scope: false,
		templateUrl: 'views/livePlayback/directives/live-icon-list.html',
		link: function(scope, element, attrs){
    		var mAttr = Attributes.get();

    		scope.disableAlarmOutput = function() {
    			if (BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.IE &&
    				UniversialManagerService.getStreamingMode() === CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE ) {
    				return true;
    			} else {
    				return false;
    			}
    		}

    		scope.alarmOutputUser = function() {
    			return AccountService.isAlarmOutputAble();
    		}

    		scope.alarmOutputMax = function() {
    			return new Array(mAttr.MaxAlarmOutput);
    		};

		    var backupCallback = function(data) {
		      if( data.errorCode === BACKUP_STATUS.MODE.RECORDING ) {
		        $timeout(function(){
		          scope.channelBasicFunctions.rec = true;
		        }); 
		      }
		      else if( data.errorCode === BACKUP_STATUS.MODE.STOP){
		        $timeout(function(){
		          scope.channelBasicFunctions.rec = false;
		        });
		      }
		    };

		    function backup() {
		    	var searchData = new SearchDataModel();
		    	var channelId = searchData.getChannelId();
		    	var recordInfo = {
		    		'channel' : channelId,
		    		'callback' : backupCallback
		    	};
		      if( scope.channelBasicFunctions.rec === false ) {
		      	recordInfo.command = 'start';
		        $rootScope.$emit('channelPlayer:command', 'record', recordInfo);
		      }
		      else {
		      	recordInfo.command = 'stop';
		        $rootScope.$emit('channelPlayer:command', 'record', recordInfo);
		      }
		    }

		    function pixelCountFunc() {
		      if (scope.channelBasicFunctions.pixelCount) {
		        scope.channelBasicFunctions.pixelCount = false;
		      } else {
		        scope.channelBasicFunctions.pixelCount = true;
		      }

		      var command = {
		      	cmd : scope.channelBasicFunctions.pixelCount
		      };

		      $rootScope.$emit('channelPlayer:command', 'pixelCount', command);
		    }

            $rootScope.$saveOn("overlayCanvas::command", function(event, mode, boolEnable) {
                switch (mode)
                {
                    case "pixelCount" :
                        break;
                    case "manualTracking" :
                        break;
                    case "areaZoomMode":
                        scope.channelBasicFunctions.pixelCount = false;
                        break;
                }
            });

		    function openFullscreenButton(e){
		      e.fullButton = true;
		      $rootScope.$emit('channel:changeFullSetRec');
		      $rootScope.$emit('channelContainer:openFullscreenButton', e);
		    }

		    function closeFullscreenButton(e){
		      e.fullButton = true;
		      $rootScope.$emit('fullCamera:closeFullscreenButton', e);
		    }

		    function toggleChannelFunctions(type){
		       if(scope.channelSetFunctions["show"] === false || scope.channelSetFunctions[type] === true){
		         scope.channelSetFunctions["show"] = !scope.channelSetFunctions["show"];
		       }

		      for(var key in scope.channelSetFunctions){
		        if(key !== "show"){
		          if(key === type && scope.channelSetFunctions["show"] === true){
		            scope.channelSetFunctions[type] = true;
		            if(type === 'status'){
		              setProfileAccessInfo();
		            }else if (type === 'setup'){
		              scope.refreshSliders(500);
		            } else if (type === 'ptz') {
		              scope.openPTZ();
		            }
		          }else{
		            scope.channelSetFunctions[key] = false;
		          }
		        }
		      }

		      $timeout(scope.setChannelSize);
		    }

		    function setProfileAccessInfo(){
		      return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=profileaccessinfo&action=view', '',
		        function (response) {
		          scope.$apply(function(){
		            scope.profileAccessInfoList = response.data.ProfileAccessInfo.ProfileInfo[0].Profiles;
		            scope.profileAccessUserList = response.data.ProfileAccessInfo.Users;
		            for (var index=0; index < scope.profileAccessInfoList.length ; index++)
		            {
		              scope.profileAccessInfoList[index].Name = scope.profileList[index].Name;
		            }
		            
		            $timeout(function(){
		            	$rootScope.$emit('liveMenuContent:setTableSize');
		            });
		          });
		        },
		        function (errorData) {
		      },'',true);      
		    }

		    function setInit(){
			    scope.wisenetCameraFuntions = {
			      fullScreen: {
			        'label': 'lang_fullScreen',
			        'action': function(e){
			        	if(scope.domControls.visibilityFullScreen){
			        		closeFullscreenButton(e);
			        	}else{
			        		openFullscreenButton(e);
			        	}
                        $rootScope.$emit('channel:overlayCanvas');
			        },
			        'class': 'tui-wn5-toolbar-fullscreen',
			        'show': true,
			        'disabled' : false,
			      },
			      viewMode: {
			        'label': 'viewMode',
			        'action': function(){
			        	scope.domControls.changeViewMode();
			        },
			        'class': 'viewMode',
			        'show': true,
			        'disabled' : false,
			      },
			      capture: {
			        'label': 'lang_capture',
			        'action': function(){
			        	CameraService.captureScreen();
			        },
			        'class': 'tui-wn5-toolbar-capture',
			        'show': true,
			        'disabled' : false,
			      },
			      record: {
			        'label': 'lang_record',
			        'action': function() {
			          backup();
			        },
			        'class': 'tui-wn5-toolbar-record',
			        'ngClass': "rec",
			        'show': true,
			        'disabled' : false,
			      },
			      pixelCounting: {
			        'label': 'lang_pixel_count',
			        'action': function() {
			          pixelCountFunc();
			        },
			        'class': 'tui-wn5-toolbar-pixel',
			        'ngClass': "pixelCount",
			        'show': true,
			        'disabled' : false,
			      }
			    };

			    scope.wisenetCameraFuntions2 = {
			      setup: {
			        'label': 'lang_menu_videosrc',
			        'action': function() {
			          toggleChannelFunctions('setup');
			        },
			        'class': 'tui-wn5-toolbar-setup',
			        'ngClass': 'setup',
			        'show': true
			      },
			      ptz: {
			        'label': 'lang_PTZ',
			        'action': function() {
						// if (scope.channelBasicFunctions.overlayCanvas) {
						// 	scope.channelBasicFunctions.overlayCanvas = false;
						// } else {
						// 	scope.channelBasicFunctions.overlayCanvas = true;
						// }
			          toggleChannelFunctions('ptz');
			        },
			        'class': 'tui-wn5-toolbar-ptz',
			        'ngClass': 'ptz',
			        'show': false
			      },
			      fisheye: {
			        'label': 'lang_fisheyeView',
			        'action': function() {
			          toggleChannelFunctions('fisheye');
			        },
			        'class': 'tui-eye',
			        'ngClass': 'fisheye',
			        'show': false
			      },
			      status: {
			        'label': 'lang_status',
			        'action': function() {
			          toggleChannelFunctions('status');
			        },
			        'class': 'tui-wn5-toolbar-status',
			        'ngClass': 'status',
			        'show': true
			      },
			    };

		        $("#cm-speaker-slider div").slider({
			      	orientation: "horizontal",
			      	range: "min",
			        min: 0,
			        max: 5,
			        step: 1,
			        slide:function(event, ui){
			          if(!scope.channelBasicFunctions.speakerStatus){
			            event.stopPropagation();
			            return false;
			          }
			        },
			        stop: function(event, ui){
			          if(!scope.channelBasicFunctions.speakerStatus){
			            console.log("AudioInput is disabled.");
			            return;
			          }

			          scope.$apply(function(){
			            scope.channelBasicFunctions.speakerVolume = ui.value;    
			          });
			        }
		        });
    		}

    		var watchPluginMode = scope.$watch(function(){return UniversialManagerService.getStreamingMode();}, 
    			function(newVal, oldVal){
    			if( scope.wisenetCameraFuntions === undefined ) return;
    			if( BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.SAFARI ) {
    				if( newVal === CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE ) {
    					scope.wisenetCameraFuntions.record.disabled = true;
    				}
    				else {
    					scope.wisenetCameraFuntions.record.disabled = false;
    				}
    			}
    		});
    		scope.$on('$destroy', function() {
      			watchPluginMode();
    		});

			function view(){
				setInit();
			}

			$timeout(view);
			$timeout(wait);

			function loadedAttr(){
				scope.wisenetCameraFuntions2.ptz.show = (mAttr.ZoomOnlyModel || mAttr.PTZModel || mAttr.ExternalPTZModel || mAttr.isDigitalPTZ);
        if(mAttr.MaxChannel > 1) {
            scope.isMultiChannel = true;
        }
        if(mAttr.MaxAudioInput !== undefined)
        {
            scope.MaxAudioInput = mAttr.MaxAudioInput;
        }

        if(mAttr.MaxAudioOutput !== undefined)
        {
            scope.MaxAudioOutput = mAttr.MaxAudioOutput;
        }				
			}

			function wait(){
		        if (!mAttr.Ready) {
		            $timeout(function () {
		                mAttr = Attributes.get();
		                wait();
		            }, 500);
		        } else {
                    loadedAttr();
		        }
			}
		}
	};
});