"use strict"
kindFramework
	.factory('BasePlaybackInterface', ['$q', '$filter', '$rootScope', 'CAMERA_TYPE', 
		'SunapiClient', 'PlaybackService', 'PLAYBACK_TYPE', 'ModalManagerService', 
		'UniversialManagerService', 'CAMERA_STATUS', 'SearchDataModel', 'PlayDataModel', 'ItemSetModel',
		function($q, $filter, $rootScope, CAMERA_TYPE, SunapiClient, PlaybackService, PLAYBACK_TYPE,
			ModalManagerService, UniversialManagerService, CAMERA_STATUS, SearchDataModel, PlayDataModel,
			ItemSetModel) {
			var pad = function(x){
				x *= 1;
    		return ( x<10? "0"+x : x );
  		};
			var PLAY_CMD = PLAYBACK_TYPE.playCommand;
			var PLAY_MODE = CAMERA_STATUS.PLAY_MODE;
			var VIEW_MODE = CAMERA_STATUS.VIEW_MODE;
			var today = new Date();
			var year = today.getFullYear();
			var month = pad(today.getMonth()+1);
			var date = pad(today.getDate());
			var searchData = new SearchDataModel();
			var playData = new PlayDataModel();
			var itemSet = new ItemSetModel();

			var BasePlaybackInterface = {
				init : function() {
					this.sdInfo = { 
					'status' : false,
					'detail' :""
					};
					this.playbackInfo = {
						time:'',
						endTime:'',
						id:-1,
						channel:-1
					};
				},

		checkSDStatus : function(channelId) {
		    var def = $q.defer();
		    var myObj = this;
		    PlaybackService.checkRecordStatus(channelId)
		    .then(function(results){
	      		myObj.sdInfo.status = true;
		      	def.resolve(myObj.sdInfo);
		    }, function(error) {
		      	myObj.sdInfo.status = false;
		      	myObj.sdInfo.detail = "lang_turn_on_sd_card";
		      	def.reject(error);
		        console.log(error);
		    });
		    return def.promise;
		},

		openEventTypeList : function(eventList) {
			var deferred = $q.defer();

			var obj = this;
			var successCallback = function(data){
				if( typeof(data.selectedEvent) === 'undefined' || data.selectedEvent === null ) {
					console.log("data.selectedEvent is null...why?");
				}
				searchData.setEventTypeList(data.selectedEvent);
				var inputData = {
              		'date':  new Date(),
              		'eventList' : data.selectedEvent,
              		'id' : data.selectedOverlap
            	};
            	deferred.resolve(inputData);
			};
			var errorCallback = function() {
				console.log("dismiss event list");
				deferred.reject('openEventTypeList Failed');
			};

			if(eventList === null) {
				errorCallback();
			} else {
				ModalManagerService.open(
					'OverlapEvent', 
					{ 'buttonCount': 1, 'eventList' : eventList ,'selectedEvent' : searchData.getEventTypeList()},
					successCallback,
					errorCallback
				);
			}

			return deferred.promise;
		},

		checkCurrentStatus : function(date) {
			var myObj = this;
			var def = $q.defer();
			// $rootScope.$emit('changeLoadingBar', true);

			var query = {
				year : date.getFullYear(),
				month : pad(date.getMonth()+1),
				day : pad(date.getDate()),
				channel : 0
			};
		
			myObj.getOverlappedId(query)
			.then(function(idList) {
				query.overlappedId = idList.OverlappedIDList;
				query.date = date;
				myObj.getEventStatus(query)
				.then(function(eventList) {
					def.resolve(eventList);
				}, function(error) {
					console.log("Fail to get event status");
					def.reject(error.description);
				});
			}, function(error) {
				console.log("Failed to get overlappedId list due to: ", error);
				def.reject("Failed to get overlappedId list");
			});
			return def.promise;
		},
		requestTimeSearch : function(type, channelId) {
	      var query = { year : year, 
	      	month : month, 
	      	day : date, 
	      	id : 0, 
	      	type : 'All'
	      };
	      PlaybackService.displayTimelineItem(query)
	      .then(function(value){
	        itemSet.addData(value, playData.getTimelineMode());
	        $rootScope.$emit('changeLoadingBar', false);  
	      },function(){
	        console.log("There is no valid record item");
  			ModalManagerService.open(
    		'message',
    		{'message' : "lang_timeout", 'buttonCount':1}
  			);
	        $rootScope.$emit('changeLoadingBar', false);
	      });
		},

		timelineCallback : function(time) {
			var callbackFnc = playData.getTimeCallback();
		  if( typeof(time) === 'undefined' || time === null || callbackFnc === null) return;
		  var newTime= [];
		  newTime.timestamp = time.time;
		  newTime.timezone = time.timezone;

		  callbackFnc(newTime);
		},

		  

		updatePlayIcon : function(enablePlayback) {
			if( enablePlayback === false ) return;
	    if( playData.getStatus() === PLAY_CMD.PLAY ) {
	      $rootScope.$emit('playStatus', 'play');
	    }
	    else if( playData.getStatus() === PLAY_CMD.PAUSE ||
	      playData.getStatus() === PLAY_CMD.STOP) {
	      $rootScope.$emit('playStatus', 'stop');
	    }
		},
		showErrorPopup : function(errorMessage) {
	      ModalManagerService.open(
	        'message',
	        {'message' : errorMessage, 'buttonCount':1}
	      );
		},

		requestEventSearch : function(inputData) {
			var deferred = $q.defer();
			var eventList = typeof(inputData.eventList) === 'undefined' ? ['All'] : inputData.eventList;
			var timeInfo = {
				'startTime' : typeof(inputData.startTime)==='undefined'? 
											'00:00:00' : inputData.startTime,
				'endTime' : typeof(inputData.endTime)==='undefined'?
											'23:59:59' : inputData.endTime,
				'date' : $filter('date')(inputData.date, 'yyyy-MM-dd')
			};

			//temporarily, add this code cause slider can send 24:00:00.
			if( timeInfo.endTime === '24:00:00') {
				timeInfo.endTime = '23:59:59';
			}
			var overlappedId = typeof(inputData.id)==='undefined' ? 0 : inputData.id;
			var channelId = searchData.getChannelId();
			var overlapInfo = {
				'year' : inputData.date.getFullYear(),
				'month' : pad(inputData.date.getMonth()+1),
				'day' : pad(inputData.date.getDate()),
				//channelId
			};
			this.getOverlappedId(overlapInfo)
			.then(function(idList){
				// to check previous overlap id exits
				var index = 0;
				for( ; index< idList.OverlappedIDList.length; index++ ){
					if( overlappedId === idList.OverlappedIDList[index]) break;
				}
				//if not exist, then set default overlap id.
				if( index >= idList.OverlappedIDList.length && idList.OverlappedIDList.length !== 0 ) {
					overlappedId = idList.OverlappedIDList[0];
					searchData.setOverlapId(overlappedId);
				}
				var searchInfo = {
					'fromTime' : timeInfo.date+" "+timeInfo.startTime,
					'toTime' : timeInfo.date+" "+timeInfo.endTime,
					'type' : inputData.eventList,
					'overlappedId' : overlappedId,
					'channel' : channelId
				};
		    	PlaybackService.eventSearch(searchInfo)
		    	.then(function(results){
		    		console.log("results.length", results.length);
		    		if(results.length === 0){
		    			ModalManagerService.open(
			        		'message',
			        		{'message' : "lang_msg_no_result", 'buttonCount':1}
	      				);		    		
		    		}
	      			itemSet.addData(results, playData.getTimelineMode()); // event 'changeLoadingBar' is emitted inside this function
	      			deferred.resolve('requestEventSearch success');
		    	}, function(error){
		    		console.log(error);
	      			ModalManagerService.open(
		        		'message',
		        		{'message' : "lang_timeout", 'buttonCount':1}
	      			);
	      			itemSet.addData([]);
	      			deferred.reject(error);
		    	});
			}, function(error) {
				console.log("fail to get overlappedId");
				ModalManagerService.open(
					'message',
					{'message' : "lang_timeout", 'buttonCount':1}
      			);
      			deferred.reject(error);
			});
			return deferred.promise;
		},

		getOverlappedId : function(info) {
			return PlaybackService.getOverlappedId(info);
		},

		getEventStatus : function(info) {
			return PlaybackService.getCurrentEventStatus(info, this.eventList);
		},

		getEventName : function(event) {
			if( event === null || typeof(event) === 'undefined' ) {
				return "lang_event";
			}
			if( event === "All") {
				return "lang_resetAll";
			}
			for( var i=0 ; i< this.eventList.length; i++) {
				if( this.eventList[i].event === event) {
					return this.eventList[i].name;
				}
			}
			return "";
		},
		preparePlayback : function(channelId){},
		revertLivePage : function(){},
		openPlayback : function(inputData) {},
		penPlaybackAfterAuth : function(inputData) {return null;},
		play : function() {},
		pause : function() {},
		resume : function() {},
		stop : function() {},
		seek : function() {},
		refreshLivePage : function(message){return null;},
		applyPlaySpeed : function(speed) {return null;},
		startLive : function(profileInfo) {},
		stopLive : function() {},
		findRecordings : function(info){},
		stepPlay : function(command){return null;},
		backup : function(){return null;},
	};

		return BasePlaybackInterface;
}]);