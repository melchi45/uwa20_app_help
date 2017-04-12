/*global PlaybackParent, workerManager*/
kindFramework
	.factory('PlaybackInterface', ['$q', '$filter', '$rootScope', '$injector','CAMERA_TYPE', 
		 'SunapiClient', 'PlaybackService',
		'ConnectionSettingService', 'PLAYBACK_TYPE', 'ModalManagerService',
		'SearchDataModel', 'PlayDataModel', 'ItemSetModel', 'Attributes', '$timeout', 'UniversialManagerService', 'kindStreamInterface',
		'BasePlaybackInterface','BACKUP_STATUS','BrowserService',
		function($q, $filter, $rootScope, $injector, CAMERA_TYPE,
			SunapiClient, PlaybackService, ConnectionSettingService, PLAYBACK_TYPE, ModalManagerService, 
			SearchDataModel, PlayDataModel, ItemSetModel, Attributes, $timeout, UniversialManagerService, kindStreamInterface,
			BasePlaybackInterface, BACKUP_STATUS, BrowserService) {
			"use strict";

		var PLAY_CMD = PLAYBACK_TYPE.playCommand;
    var support_alarm_input = false;
    var support_face_detection = false;
    var support_tampering_detection = false;
    var support_motion_detection = false;
    var support_video_analysis = false;
    var support_audio_detection = false;
    var support_nework_disconnect = false;
    var support_manual_recording = false;
    var support_defocus_detection = false;
    var support_fog_detection = false;
    var support_audio_analysis = false;
		var support_auto_tracking = false;
    var self = this;
    var openErrorPopup = false;
    var defaultSpeed = 1;
		var pad = function(x){
			x *= 1;
			return x<10? "0"+x : x;
		};
		var mAttr = Attributes.get();

		var PlaybackInterface = Object.create(BasePlaybackInterface);
		PlaybackInterface.init();

		var searchData = new SearchDataModel();
		var playData = new PlayDataModel();		

		PlaybackInterface.eventList=[
        {name:"lang_normal_for_playback", event:"Normal", selected:true, enable:false}
      ];
        /*WebPlayback.prototype.eventList = [
        {name:"Normal Recording", event:"Normal", selected:true, enable:false},
        {name: "Alarm input", event:"AlarmInput", selected:true, enable:false},
        {name: "Tampering detection", event:"TamperingDetection", selected:true, enable:false},  
        {name: "Motion detection", event:"MotionDetection", selected:true, enable:false},
        {name: "Video analytics", event:"VideoAnalysis", selected:true, enable:false},
        {name: "Face detection", event:"FaceDetection", selected:true, enable:false},
        {name: "Audio detection", event:"AudioDetection", selected:true, enable:false},
        {name: "Network disconnection", event:"NetworkDisconnect", selected:true, enable:false},
        {name: "Manual recording", event:"UserInput", selected:true, enable:false},
      ];
*/

      	/**
      	* When go main-playback page, this function called ( web operation differ from app)
      	* Just check sd status & show All+Overlap1 timeline.
      	* @name : preparePlayback
      	* @param : channelId is numeric value
      	*/
		PlaybackInterface.preparePlayback = function(channelId) {
			var def = $q.defer();
			var myObj = this;
			this.checkSDStatus(channelId)
			.then(function(value) {
            	myObj.openPlayback(channelId);
            	def.resolve('success');
			}, function(sdInfo) {
				//Please check multi language.
				myObj.showErrorPopup('lang_check_storage_status');
				$rootScope.$emit('changeLoadingBar', false);
				$rootScope.$emit('refreshLivePage', true);
				def.reject('error');
			});
			return def.promise;
		};
		PlaybackInterface.requestTimeSearch = function(type, channelId) {
			var today = searchData.getSelectedDate();
			var year = today.getFullYear();
			var month = pad(today.getMonth()+1);
			var date = pad(today.getDate());
			var query = { year : year, 
		      	month : month, 
		      	day : date, 
		      	id : 0, 
		      	type : type,
		      	channel : channelId
      		};
      		PlaybackService.getOverlappedId(query)
      		.then(function(value){
      			var itemSet = new ItemSetModel();
      			//value.OverlappedIDList format is = {1,0} 
      			if( value.OverlappedIDList.length > 0 ) {
      				query.id = value.OverlappedIDList[value.OverlappedIDList.length-1];
      			}
      			searchData.setOverlapId(query.id);
      			console.log(value);
      			PlaybackService.displayTimelineItem(query)
		      	.then(function(value){
		      		console.log("value.length", value.length);
		      		if(value.length === 0){
		      			ModalManagerService.open(
		      				'message',
		      				{'message':"lang_msg_no_result", 'buttonCount':1}
		      			);
		      		}
		        	itemSet.addData(value, playData.getTimelineMode());
		        	//searchData.setWebIconStatus(true);
		        	$rootScope.$emit('changeLoadingBar', false);
		      	},function(){
		        	console.log("There is no valid record item");
		  			ModalManagerService.open(
		    		'message',
		    		{'message' : "lang_timeout", 'buttonCount':1}
		  			);
		  			itemSet.addData([]);
		  			$rootScope.$emit('changeLoadingBar', false);
		    	});
	      	},function(){
	      		var itemSet = new ItemSetModel();
	      		console.log("There is no valid record item");
      			ModalManagerService.open(
	    		'message',
	    		{'message' : "lang_timeout", 'buttonCount':1}
	  			);
	  			itemSet.addData([]);
	      		$rootScope.$emit('changeLoadingBar', false);
	    	});


	    };

		PlaybackInterface.openPlayback = function(channelId) {
			searchData.setPlaybackType('timeSearch');
			searchData.setWebIconStatus(true);
			searchData.setEventTypeList(['All']);  //For default set value. (web & app different)
			this.requestTimeSearch('All',channelId);
		};
		PlaybackInterface.refreshLivePage = function() {
			searchData.setWebIconStatus(false);
			searchData.setRefreshHoldValues();
            playData.setStatus(PLAY_CMD.LIVE);
			return ConnectionSettingService.closePlaybackSession();
		};
		PlaybackInterface.stepRequestCallback = function(result, interfaceObj) {
			if (result === "request") {
				var playData = new PlayDataModel();
				playData.setDefautPlaySpeed();
	      interfaceObj.playbackInfo.time = playData.getCurrentPosition();
	      interfaceObj.playbackInfo.id = searchData.getOverlapId();
	      interfaceObj.playbackInfo.speed = playData.getPlaySpeed();
	      ConnectionSettingService.applyStepCommand("step", interfaceObj.playbackInfo);
	      $rootScope.$emit('changeLoadingBar', true);
    	} else {
    		ConnectionSettingService.applyPauseCommand();
    		$rootScope.$emit('changeLoadingBar', false);
    	}
		};
		PlaybackInterface.timelineCallback = function(time, stepFlag) {
			var callbackFnc = playData.getTimeCallback();
			if( typeof(callbackFnc) === 'undefined' || callbackFnc === null ) return;
     		 callbackFnc(time, stepFlag);
		};
		PlaybackInterface.play = function() {
			if( playData.getSelectTime() === null) {
				return null;
			}
			var rtspInfo = ConnectionSettingService.getConnectionSetting();
			this.playbackInfo.rtspIP = rtspInfo.rtspIp;
			this.playbackInfo.rtspPort = rtspInfo.rtspPort;
			this.playbackInfo.userID = rtspInfo.user;
			this.playbackInfo.time = playData.getSelectTime();
			this.playbackInfo.endTime = $filter('date')(playData.getEndTime(), 'yyyyMMddHHmmss');
			this.playbackInfo.id = searchData.getOverlapId();
			this.playbackInfo.channel =  UniversialManagerService.getChannelId();
			$rootScope.$emit('channelSelector:off', true);
			$rootScope.$emit('app/scripts/services/playbackClass::disableButton', true);
			$rootScope.$emit("channelPlayer:command", "playback", this.playbackInfo, 
				{'timeCallback' : this.timelineCallback, 'errorCallback' : this.playbackErrorCallback});
		};

		PlaybackInterface.pause = function() {      
			if(UniversialManagerService.isSpeakerOn()){
				kindStreamInterface.controlAudioIn('off');
			}
			$rootScope.$emit("channelPlayer:command", "pause");
		};
		PlaybackInterface.resume = function() {
			if(UniversialManagerService.isSpeakerOn()){
				kindStreamInterface.controlAudioIn('on');
				var vol = UniversialManagerService.getSpeakerVol();
          		kindStreamInterface.controlAudioIn(vol);
          		UniversialManagerService.setSpeakerVol(vol);
			}
			this.playbackInfo.time = playData.getSelectTime();
			this.playbackInfo.endTime = $filter('date')(playData.getEndTime(), 'yyyyMMddHHmmss');
			this.playbackInfo.id = searchData.getOverlapId();
			this.playbackInfo.channel =  UniversialManagerService.getChannelId();
			this.playbackInfo.needToImmediate = playData.getNeedToImmediate();
			playData.setNeedToImmediate(false);
			$rootScope.$emit("channelPlayer:command", "resume", this.playbackInfo);
		};
		PlaybackInterface.stop = function() {
			playData.setDefautPlaySpeed();
			//workerManager.playbackSpeed(defaultSpeed);
			kindStreamInterface.controlWorker({'channelId':this.playbackInfo.channel, 'cmd':'playbackSpeed', 'data': [defaultSpeed]});
			$rootScope.$emit('changeLoadingBar', false);
			$rootScope.$emit("channelPlayer:command", "close");
		};
		PlaybackInterface.seek = function() {
			this.playbackInfo.time = playData.getSelectTime();
			this.playbackInfo.id = searchData.getOverlapId();
			$rootScope.$emit("channelPlayer:command", "seek", this.playbackInfo);
		};
		PlaybackInterface.applyPlaySpeed = function(speed) {
			this.playbackInfo.time = playData.getSelectTime();
			this.playbackInfo.id = searchData.getOverlapId();
			kindStreamInterface.controlWorker({'channelId':this.playbackInfo.channel, 'cmd':'playbackSpeed', 'data': speed});
			$rootScope.$emit("channelPlayer:command", "speed", {'speed':speed, 'data':this.playbackInfo});
		};

		PlaybackInterface.stopLive = function() {
			$rootScope.$emit("channelPlayer:command", "stopLive", true);
		};

		PlaybackInterface.startLive = function(profileInfo) {
			return ConnectionSettingService.getPlayerData('live', profileInfo, 
				null, 
				function(error){
					console.log("errorcode:", error.errorCode, "error string:", error.description);
				}, function(error){
					console.log(error);
				});
		};
		/**
		* return date to recorded
		* @name : findRecordings
		*/
		PlaybackInterface.findRecordings = function(info) {
			var def = $q.defer();
			PlaybackService.findRecordingDate(info)
			.then(function(results){
				def.resolve(results);
			}, function(error) {
				console.log("No search result and error"+error);
				def.reject(error);
			});
			return def.promise;
		};

		/**
		* request to step forward or step backwward
		* @name : stepPlay
		* @parameter : command must be STEPFORWARD or STEPBACKWARD ( playback_type.js)
		*/
		PlaybackInterface.stepPlay = function(command) {
			// before starting step play, must be set 1x speed
			var playData = new PlayDataModel();
			playData.setDefautPlaySpeed();
      this.playbackInfo.time = playData.getCurrentPosition();
      this.playbackInfo.id = searchData.getOverlapId();
      this.playbackInfo.speed = playData.getPlaySpeed();
      if( command === PLAY_CMD.STEPBACKWARD ) {
        ConnectionSettingService.applyStepCommand("backward", this.playbackInfo);
      } else {
        ConnectionSettingService.applyStepCommand("forward", this.playbackInfo);
      }
		};
		PlaybackInterface.playbackErrorCallback = function(error) {
			console.log("errorcode:", error.errorCode, "error string:", error.description);
			$rootScope.$emit('channelSelector:on', true);
		  $rootScope.$emit('app/scripts/services/playbackClass::disableButton', false);
		  var playData = new PlayDataModel();
		  if (error.errorCode !== "200" && error.errorCode !== "777") {
		  	playData.setDefautPlaySpeed();  //if error occur, reset playback speed to 1x
	  		playData.setStatus(PLAY_CMD.STOP);
	  	}
	  	var callbackFnc = function(data) {
	  		openErrorPopup = false;
	  	};
	  	if( error.errorCode === "503" ) {
	  		if( openErrorPopup === false ) {
	  			openErrorPopup = true;
		  		ModalManagerService.open(
	    		'message',
	    		{'message' : 'lang_service_unavailable', 'buttonCount':1},
	    		callbackFnc,
	    		callbackFnc
	  			);	  			
	  		}	  		
	  	}
	  	else if( error.errorCode === "999") {
	  		$rootScope.$emit('changeLoadingBar', false);
	  	}
	  	else if( error.errorCode === "998") {
	  		if( openErrorPopup === false ) {
	  			openErrorPopup = true;
		  		ModalManagerService.open(
	    		'message',
	    		{'message' : 'lang_msg_not_support_resolution', 'buttonCount':1},
	    		callbackFnc,
	    		callbackFnc
	  			);	  			
	  		}
	  	}
	  	else if( error.errorCode === "777") {
	  		if( BrowserService.BrowserDetect == BrowserService.BROWSER_TYPES.FIREFOX ||
	  			BrowserService.BrowserDetect == BrowserService.BROWSER_TYPES.EDGE) {
		  		if( openErrorPopup === false ) {
		  			openErrorPopup = true;
		  			var message = (BrowserService.BrowserDetect == BrowserService.BROWSER_TYPES.FIREFOX ? 'lang_unavailable_aac_firefox' : 'lang_unavailable_aac_edge');
			  		ModalManagerService.open(
		    		'message',
		    		{'message' : message, 'buttonCount':0},
		    		callbackFnc,
		    		callbackFnc
		  			);
		  		}
	  		}
	  	}
		};
		var backupErrorCallback = function(error) {
		  console.log("errorcode:", error.errorCode, "error string:", error.description);
			$rootScope.$emit('channelSelector:on', true);
		  $rootScope.$emit('app/scripts/services/playbackClass::disableButton', false);
		  $rootScope.$emit('app/scripts/services/playbackClass::setDefaultPlaybackMode');
		  if( error.description === 'backup' ) {
		  	if( error.errorCode !== BACKUP_STATUS.MODE.RECORDING ) {		
		  		$rootScope.$emit('changeLoadingBar', false);
		  		playData.setStatus(PLAY_CMD.STOP);
		  		if( error.errorCode === BACKUP_STATUS.MODE.STOP ) {
		  			ModalManagerService.open(
		      			'message',
		      			{'message':"lang_msg_savingComplete", 'buttonCount':0}
		      		);	
		  		}
		  		else if( error.errorCode === BACKUP_STATUS.MODE.NO_FILE_CREATED){
					ModalManagerService.open(
		      			'message',
		      			{'message':"lang_msg_downloadingFail", 'buttonCount':0}
		      		);
		  		}
		  		else if( error.errorCode === BACKUP_STATUS.MODE.CODEC_CHANGED || 
		  				error.errorCode === BACKUP_STATUS.MODE.PROFILE_CHANGED ) {
					ModalManagerService.open(
		      			'message',
		      			{'message':"lang_msg_codecChange", 'buttonCount':0}
		      		);
		  		}
		  		else if( error.errorCode === BACKUP_STATUS.MODE.EXCEEDED_MAX_FILE) {
		  			ModalManagerService.open(
		      			'message',
		      			{'message':"lang_max_filesize", 'buttonCount':0}
		      		);
		  		}
		  	}
		  }
		  else {
				if (error.errorCode !== "200") {
		  			playData.setStatus(PLAY_CMD.STOP);
		  			playData.setDefautPlaySpeed();  //if error occur, reset playback speed to 1x
	  			}
	  			if( error.errorCode === '990' ){ //end of file
	  				$rootScope.$emit('changeLoadingBar', false);
	  				playData.setStatus(PLAY_CMD.STOP);
	  			}	  	
			}
		};

		/**
		* request to playback backup for creating avi file.
		* @name : backup
		*/
		PlaybackInterface.backup = function() {
			var rtspInfo = ConnectionSettingService.getConnectionSetting();
			var playData = new PlayDataModel();
      		this.playbackInfo.time = playData.getPlaybackBackupTIme();
      		this.playbackInfo.id = searchData.getOverlapId();
			this.playbackInfo.rtspIP = rtspInfo.cameraUrl;
			this.playbackInfo.rtspPort = rtspInfo.rtspPort;
			this.playbackInfo.userID = rtspInfo.user;
			this.playbackInfo.channel = UniversialManagerService.getChannelId();
      		$rootScope.$emit("channelPlayer:command", "playbackBackup", this.playbackInfo, backupErrorCallback);
		};
		var checkEventSource = function() {
			var eventSource = mAttr.EventSourceOptions;
			if( eventSource === null || typeof(eventSource) === 'undefined' ) {
				return;
			}
			for( var i=0 ; i<eventSource.length; i++ ) {
				var eventType = eventSource[i].EventSource;
				var indexOf = eventType.indexOf;
				if( indexOf.call(eventType, "AlarmInput") !== -1 ) {
					support_alarm_input = true;
				}
				else if( indexOf.call(eventType,"MotionDetection") !== -1) {
					support_motion_detection = true;
				}
				else if( indexOf.call(eventType,"TamperingDetection") !== -1) {
					support_tampering_detection = true;
				}
				else if( indexOf.call(eventType,"FaceDetection") !== -1) {
					support_face_detection = true;
				}
				else if( indexOf.call(eventType,"AudioDetection") !== -1) {
					support_audio_detection = true;
				}
				else if( indexOf.call(eventType,"NetworkEvent") !== -1) {
					support_nework_disconnect = true;
				}
				else if( indexOf.call(eventType,"UserInput") !== -1 ) {
					support_manual_recording = true;
				}
				else if( indexOf.call(eventType, "DefocusDetection") !== -1 ) {
					support_defocus_detection = true;
				}
				else if( indexOf.call(eventType, "FogDetection") !== -1 ) {
					support_fog_detection = true;
				}
				else if( indexOf.call(eventType, "AudioAnalysis") !== -1 ) {
					support_audio_analysis = true;
				}
				else if( indexOf.call(eventType, "Tracking") !== -1 ) {
					support_auto_tracking = true;
				}
			}
			if( typeof(mAttr.MotionDetectModes) !== 'undefined' && mAttr.MotionDetectModes !== null ) {
				for( var index = 0 ; index < mAttr.MotionDetectModes.length ; index++ ) {
					if( mAttr.MotionDetectModes[index] === 'IntelligentVideo') {
						support_video_analysis = true;
						break;
					}
				}
			}
		};

		var updateEventList = function() {
			var eventList = PlaybackInterface.eventList;
			var push = eventList.push;
			if( support_alarm_input ) {
				push.call(eventList, {name: "lang_alarm", event:"AlarmInput", selected:true, enable:false});
			}
			if( support_tampering_detection) {
				push.call(eventList, {name: "lang_tampering", event:"TamperingDetection", selected:true, enable:false});
			}
			if( support_motion_detection ) {
				push.call(eventList, {name: "lang_menu_motiondetection", event:"MotionDetection", selected:true, enable:false});
			}
			if( support_video_analysis ) {
				push.call(eventList, {name: "lang_menu_iva", event:"VideoAnalysis", selected:true, enable:false});
			}
			if( support_face_detection ) {
				push.call(eventList, {name: "lang_menu_facedetection", event:"FaceDetection", selected:true, enable:false});
			}
			if( support_audio_detection ) {
				push.call(eventList, {name: "lang_ad", event:"AudioDetection", selected:true, enable:false});
			}
			if( support_nework_disconnect ) {
				push.call(eventList, {name: "lang_menu_networkdisconnect", event:"NetworkDisconnect", selected:true, enable:false});
			}
			if( support_manual_recording ) {
				push.call(eventList, {name: "lang_manualRecording", event:"UserInput", selected:true, enable:false});
			}
			if( support_defocus_detection ) {
				push.call(eventList, {name: "lang_defocus_detection", event:"DefocusDetection", selected:true, enable:false});
			}
			if( support_fog_detection ) {
				push.call(eventList, {name: "lang_menu_fogdetection", event:"FogDetection", selected:true, enable:false});
			}
			if( support_audio_analysis ) {
				push.call(eventList, {name: "lang_menu_soundclassification", event:"AudioAnalysis", selected:true, enable:false});
			}
			if( support_auto_tracking ) {
				push.call(eventList, {name : "lang_autotracking", event:"Tracking", selected:true, enabled:false});
			}
		};



			(function wait() {
				if( !mAttr.EventSourceOptionsReady || !mAttr.eventsourceCgiAttrReady ){
					$timeout(function() {
						mAttr = Attributes.get();
						wait();
					}, 500);
				} else {
					checkEventSource();
					updateEventList();
				}
			})();

		kindStreamInterface.controlWorker({'channelId':0, 'cmd':'setCallback', 'data': ['stepRequest', PlaybackInterface.stepRequestCallback, PlaybackInterface]});
    return PlaybackInterface;
}]);