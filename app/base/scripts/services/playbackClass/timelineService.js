/*global vis, setTimeout, clearTimeout*/
kindFramework
	.factory('TimelineService', ['$rootScope','$filter', 'PlayDataModel', 'PLAYBACK_TYPE',
		'SearchDataModel', 'ItemSetModel', '$timeout', 'ModalManagerService',
		function($rootScope, $filter, PlayDataModel, PLAYBACK_TYPE, SearchDataModel,
			ItemSetModel, $timeout, ModalManagerService){
			"use strict";
			var TimelineService = function() {
				if( TimelineService._instance) {
					return TimelineService._instance;
				}
				TimelineService._instance = this;

				var playData = new PlayDataModel();
				var searchData = new SearchDataModel();
				var itemSet = new ItemSetModel();
				var PLAY_CMD = PLAYBACK_TYPE.playCommand;
				//This is for variable
				var timeline = null;
				var currentWindowStart=null, currentWindowEnd = null;
				var firstItemPosition = null, lastItemPosition = null;
				var updateTimelineText = null;

				var direction = 1;
				var timestamp = 0;
				var stopCallback = false;
				var calculatedTimezone = false;
				var endTarget = -1;
				var selectedID = -1;
				
				var DUPLICATE_CLASS_NAME = 'vis-duplicate-view';

				var blockWindowShiftTimeoutId = null;
				var ignorePanEvent = false;
				var updateTimestamp = 0;
				var blockPlayback = null;
				var isValidBlock = false;

				//This is for local function

	      var convertToUTCTime = function(dateObj){
	        dateObj.setFullYear(dateObj.getUTCFullYear());
	        dateObj.setMonth(dateObj.getUTCMonth());
	        dateObj.setDate(dateObj.getUTCDate());
	        dateObj.setHours(dateObj.getUTCHours());
	      };

	      var getTimelineOption = function(type, startDate, endDate) {
	        var options = {
	            start: startDate,
	            end: endDate,
	            zoomMax: 1000 * 60 * 60 * 24,
	            zoomMin: 1000 * 60,
	            min: startDate.getTime(),
	            max: endDate.getTime(),
	            margin: 0,
	            height: '45px',
	            stack : false,
	            orientation: {
	            axis: 'top',
	          },
	            showCurrentTime:false,
	            autoResize : false,
	        };
	        if( type === 'event') {
	          options.format = {
	              majorLabels: {
	              millisecond:'HH:mm:ss',
	              second:     'MM/D HH:mm',
	              minute:     'MM/D',
	              hour:       'MM/D',
	              weekday:    'MMMM YYYY',
	              day:        'MMMM YYYY',
	              month:      'YYYY',
	              year:       ''
	            }
	          };
	        }
	        return options;
	      };

				var checkValidTimePoint = function(time) {
					var selectedItem = itemSet.getSelectedItem(time, direction);
					if( selectedItem === null ) {
						return false;
					}
					else {
						return true;
					}
				};

				/*
				* timestampCallback. It is called by Plugin or RtspClient.
				* @name : getTimestamp
				* @param : time is second for utc_time.
				*/
				var getTimestamp = function(time, stepFlag) {
					if( time === null ) return;
					if( stopCallback && (stepFlag == undefined || stepFlag === false)) return;
					if(playData.getIsMultiPlayback() && searchData.getChannelId() !== time.channel_index) return;
					/*
					* If end time reached, we need to manually stop the stream.
					*/
					if( typeof(time.timezone) !== 'undefined' && time.timezone !== null && calculatedTimezone === false) {
						endTarget -= time.timezone*60*1000;
						calculatedTimezone = true;
					}

					if( timestamp !== time.timestamp ){
						var curTime = new Date(time.timestamp*1000);
						var deviceType = playData.getDeviceType();
						if(deviceType === 'NWC') {
							var calculatedTime = curTime.getTime() + curTime.getTimezoneOffset()*60*1000;
							if( typeof(time.timezone) !== 'undefined' && time.timezone !== null) {
								calculatedTime += time.timezone*60*1000;
							}
							curTime.setTime(calculatedTime);
						}
						// console.log('timestamp :::', new Date(time.timestamp*1000), 'playbar :::', curTime);
						var diff;
						if( deviceType === 'NWC' ) {
							diff = time.timestamp * 1000 - endTarget;
						}
						else {
							diff = curTime.getTime() - endTarget;
						}
						if( (direction > 0 && diff >= 0 ) || (direction<0 && diff <= 0 ) ) {
							playData.setStatus(PLAY_CMD.STOP);
							playData.setDefautPlaySpeed();
							stopCallback = true;
						}
						if(blockWindowShiftTimeoutId === null && playData.getTimelineEnable()) {
							itemFocusing(curTime);
						}
						setTimebarPosition(curTime);
					}
					timestamp = time.timestamp;
				};

				/*
				* if no item selected, then find next item.
				* @name : findNearItem
				* @param : time : Date object which is currently set
				*/
				var isSameId = false;
				var findNearItem = function(time) {
					var needToRevertFlag = false;
					if( stopCallback === false ) {
						stopCallback = true;
						needToRevertFlag = true;
					}
					/*
					* return item list which is existing after 'time'
					*/
					var selectedItem = itemSet.getSelectedItem(time, direction);
					if( selectedItem === null || selectedID !== selectedItem.id) {
						isSameId =false;
					}
					else {
						isSameId = true;
					}

					var nearItem = null;
					if( selectedItem === null ) {
						nearItem = itemSet.getNextNearItem(time);
					}
					else {
						nearItem = selectedItem;
					}
					if( nearItem === null ) {
						console.log("There is no near item");
						stopCallback = false;
						return false;
					}

					setPlayRange(nearItem, isSameId, time);
					if( needToRevertFlag === true ) {
						stopCallback = false;
					}

					/*
					* if 'eventSearch' to be set, must be set end time ( eventSearch for only playing selected item.)
					*/
					return true;
				};

	      var setTimeRange = function(startTime, endTime) {
	      	playData.setTimeRange(startTime, endTime);
	      	if( typeof(endTime) !== 'undefined' && endTime !== null ) {
	      		endTarget = endTime.getTime();
            if( playData.IsEnableTimezone() ) {
              endTarget -= endTime.getTimezoneOffset()*60*1000;
            }
	          calculatedTimezone = false; 
	      	}
	      	else if( lastItemPosition !== null ) {
	        	endTarget = lastItemPosition.getTime();
            if( playData.IsEnableTimezone() ) {
              endTarget -= lastItemPosition.getTimezoneOffset()*60*1000;
            }
	        	calculatedTimezone = false;      		
	      	}
	      };

	      var setTimebarPosition = function(timePosition, endTime) {
					if( timeline === null ) return;
					var playbackStatus = playData.getStatus();
					if( playbackStatus === PLAY_CMD.STOP ||
						 playbackStatus === PLAY_CMD.PAUSE ||
						 playbackStatus === PLAY_CMD.PLAYPAGE) {
						setTimeRange(timePosition, endTime);
					}

	      	timeline.setCustomTime(timePosition, 't1');

					$rootScope.$emit('updateTimebar', timePosition);
					updateTimebarData(timePosition);      	
	      };

	      var updateTimebarData = function(timePosition) {
	      	updateTimelineText([]);
	      	var showingItem = itemSet.getSelectedItem(timePosition);
	      	var selectedId = [];
	      	if( showingItem !== null ) {
	      		selectedId.push(showingItem.id);
	      	}
	      	$timeout(function() {
	      		timeline.setSelection(selectedId);
	      	});

	      	var selectedItem = itemSet.getSelectedItem(timePosition, direction);
	      	if( selectedItem === null ) {
	      		selectedID = -1;
	      		return;
	      	}

	      	if( selectedItem.dupId !== -1 ) {
	      		loadDuplicatedData(selectedItem.dupId);
	      	}
	      	else {
	      		showDataInfo(selectedItem);
	      	}

	      	selectedID = selectedItem.id;  	
	      };

	      var loadDuplicatedData = function(dupId) {
	      	var itemList = [];
	      	var duplicateItems = itemSet.getDuplicatedItems(dupId);
	      	for( var i=0 ; i< duplicateItems.length ; i++ ) {
	      		var itemInfo = {
							'id': duplicateItems[i].id,
							'start': $filter('date')(duplicateItems[i].start, 'HH:mm:ss'),
							'end': $filter('date')(duplicateItems[i].end, 'HH:mm:ss'),
							'eventType' : duplicateItems[i].eventType,
							'dupId' : duplicateItems[i].dupId,
							'selected': false
						};
						itemList.push(itemInfo);
					}
					updateTimelineText(itemList);
				};

				var showDataInfo = function(data){
					var itemInfo = [];
					itemInfo.push({
						'id' : data.id,
						'start' :  data.start,
						'end' : data.end,
						'selected' : false,
						'eventType' : data.eventType,
						'dupId' : data.dupId,
						'group' : data.group,
					});
					updateTimelineText(itemInfo);
				};


				var setPlayRange = function(item, isDoubleClick, time) {
					var startPoint, endPoint;
					startPoint = isDoubleClick? time : item.start;
					if( searchData.getPlaybackType() === 'eventSearch') {
						endPoint = item.end;
					}
					else {
						endPoint = lastItemPosition;
					}

					if( direction < 0 ) {
						startPoint = isDoubleClick ? time : item.end;
						if( searchData.getPlaybackType() === 'eventSearch' ) {
							endPoint = item.start;
						}
						else {
							endPoint = firstItemPosition;
						}
					}
					setTimeRange(startPoint, endPoint);
					setTimebarPosition(startPoint, endPoint);
				};


				var changeTimelineView = this.changeTimelineView = function(start, end){
					currentWindowStart = start;
					currentWindowEnd = end;
		//				$timeout(function() {
					timeline.setWindow(start,end, {animation:false});
		//				});
				};

				var checkTimelineMoving = function() {
					if( isPhone ) return;
					if( playData.getStatus() === PLAY_CMD.PLAY && isValidBlock === false) {
						$rootScope.$emit("scripts/services/playbackClass/timelineService::changePlayStatus", 
							PLAY_CMD.PAUSE);
						isValidBlock = true;
					}
					if( playData.getStatus() === PLAY_CMD.PAUSE && isValidBlock ) {
						if( blockPlayback !== null ) clearTimeout(blockPlayback);

						blockPlayback = setTimeout(function() {
							blockPlayback = null;
							if( playData.getStatus() === PLAY_CMD.PAUSE ) {
								$rootScope.$emit("scripts/services/playbackClass/timelineService::changePlayStatus", 
											PLAY_CMD.PLAY);
								isValidBlock = false;
							}
						}, 500);
					}
				};
				/**
				 * create timeline
				 * @name createTimeline
				 * @param : _updateTimelineText is callback function from channel.js
				 */
				this.createTimeline = function(type, element, _updateTimelineText){
					if( timeline !== null ) {
						console.log("already created timeline object");
						$timeout(function(){
								timeline.redraw();
						});
						return;
					}
					var idVal = typeof(type) ==='undefined' ? '': type;
					var deviceType = playData.getDeviceType();
					var today;
					if( deviceType ==='NWC' ) {
						today = searchData.getSelectedDate();
					}
					else {
						today = new Date();
					}
					var inputDate = $filter('date')(today, 'yyyy-MM-dd');
					var startDate = new Date(inputDate);
					if( startDate.getHours() !== 0 && idVal !== 'event' ){
						convertToUTCTime(startDate);
					}
					var endDate = new Date(startDate.getTime()  + 24 * 60 * 60 * 1000-1000);
					var options = getTimelineOption(idVal, startDate, endDate);
					var container = element.find('div.timeline-container')[0];
					
					timeline = new vis.Timeline(container, itemSet.getFullItemSet(), options);
					timeline.addCustomTime(startDate,'t1');
					timeline.setOptions({ showMajorLabels:false});
					searchData.setSelectedDate(startDate);
					var createInterval;
					if( !isPhone ) {
						createInterval = 50;
						$timeout(function(){
							timeline.redraw();
						}, createInterval);
					}
					updateTimelineText = _updateTimelineText;

					var updateTimeCallback = null;
					timeline.on('timechange', function(properties) {
						stopCallback = true;
						ignorePanEvent = true;
						/*
						* To reduce count of sending event
						*/
						updateTimestamp = properties.time;
						if( updateTimeCallback === null ) {
							updateTimeCallback = setTimeout(function() {
								updateTimeCallback = null;
								$rootScope.$emit('updateTimebar', updateTimestamp);
							}, 100);
						}
					});

					var timelineObj = this;

					timeline.on('timechanged', function(properties) {
						stopCallback = false;
						ignorePanEvent = false;
						timelineObj.selectTimeline(null, properties);
						if( playData.getDeviceType() === 'NWC' && playData.getStatus() === PLAY_CMD.PAUSE) {
							playData.setNeedToImmediate(true);
						}
					});

					timeline.on('rangechange', function(properties) {
						if( properties.byUser === false ){
							return;
						}
						checkTimelineMoving();
						currentWindowStart = properties.start;
						currentWindowEnd = properties.end;
					});

					/**
					* 'rangechanged' : fired once after start-end changed
					*/
					timeline.on('rangechanged', function(properties) {
						if( properties.byUser === false ){
							return;
						}
						currentWindowStart = properties.start;
						currentWindowEnd = properties.end;
					});

					this.changeTimelineView(startDate, endDate);

					playData.setTimeCallback(getTimestamp);
					playData.setTimeBarPositionCallback(setTimebarPosition);

					playData.setCurrentPositionFunc(getPosition);
				};

				/**
				* re-set timeline item between the range (currentWindowStart, currentWindowEnd)
				* this function called by timeline.js 
				* when end of pan / end of pinch
				* @name : enableToDraw
				*/
				this.enableToDraw = function() {
					if( ignorePanEvent === true ) return;
					if (blockWindowShiftTimeoutId !== null) {
						clearTimeout(blockWindowShiftTimeoutId);
					}
					blockWindowShiftTimeoutId = setTimeout(function() {
						blockWindowShiftTimeoutId = null;
					}, 2000);
					changeTimelineView(currentWindowStart, currentWindowEnd);
				};

				/*
				* delete timeline and item set
				* @name : destroy
				*/
				this.destroy = function() {
					itemSet.clearData();
					if( timeline === null ) return;
					timeline.setItems([]);
					timeline.destroy();
					timeline = null;
					selectedID = -1;
					direction = 1;
				};

				this.changeOptions = function(inputDate, inputEndDate, type){
					var idVal = typeof(type) ==='undefined' ? '': type;
					var deviceType = playData.getDeviceType();
					var today;
					if( deviceType ==='NWC' ) {
						today = searchData.getSelectedDate();
					}
					else {
						today = new Date();
					}
					if( typeof(inputDate) === 'undefined' || inputDate === null ){
						inputDate = $filter('date')(today,'yyyy-MM-dd');
					}
					var startDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(),
						0,0,0);
					if( startDate.getHours() !== 0 && idVal !== 'event' ){
						convertToUTCTime(startDate);
					}
					var endDate = new Date();
					if ( typeof(inputEndDate) === 'undefined' || inputEndDate === null) {
						 endDate = new Date(startDate.getTime()  + 24 * 60 * 60 * 1000-1000);
					}
					else {
						endDate = new Date(inputEndDate);
						//convertToUTCTime(endDate);
					}

					var options = getTimelineOption(idVal, startDate, endDate);
					timeline.setOptions(options);
					timeline.setOptions({
						showMajorLabels:false
					});
					itemSet.clearData();
				};

				this.refreshTimelineView = function() {
					this.changeTimelineView(timeline.options.start, timeline.options.end);
				};

				var getSelectedItemInfo = function() {
					if( timeline === null ) return;
					var currentTime = timeline.getCustomTime('t1');
					return itemSet.getSelectedItem(currentTime, direction);
				};

				this.selectTimeline = function(event, properties) {
					console.log('[timeline]onclick called');
					$rootScope.$emit(
						'app/script/services/playbackClass/timelineService.js::stepInit');

					var props;
					if( typeof(event) === 'undefined' || event === null ) {
						props = properties;
					}
					else {
						props = timeline.getEventProperties(event);
					}
					var nowDate = searchData.getSelectedDate();
					var dateValidCheckFlag = true;

					if($filter('date')(props.time,'yyyy-MM-dd') < 
							$filter('date')(nowDate,'yyyy-MM-dd')){
						dateValidCheckFlag = false;
						setTimebarPosition(new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0));
					}
					if($filter('date')(props.time,'yyyy-MM-dd') > 
							$filter('date')(nowDate,'yyyy-MM-dd')){
						dateValidCheckFlag = false;
						setTimebarPosition(new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 23, 59, 59));
					}

					if( dateValidCheckFlag === true && 
						itemSet.getSelectedItem(props.time, direction) === null && playData.getStatus() !== PLAY_CMD.PLAY ){
						setTimebarPosition(props.time);
					} else {
						findNearItem(props.time);
					}

					if(playData.getStatus() === PLAY_CMD.PLAY) {
						$rootScope.$emit('seek');
					}

					var selectedItem = getSelectedItemInfo();
					var deviceType = playData.getDeviceType();
					if(selectedItem !== null && deviceType ==='NWC') {
						$rootScope.$emit("scripts/services/playbackClass/timelineService::backupTimeRange", 
							selectedItem);
					}
				};
				
				this.isValidTimePosition = function() {
					if( timeline === null) return false;
					var currentTime = timeline.getCustomTime('t1');
					var selectedItem = itemSet.getSelectedItem(currentTime, direction);
					if( selectedItem === null ) {
						var nearItem = itemSet.getNextNearItem(currentTime);
						if( nearItem === null ) {
							return false;
						}
						setPlayRange( nearItem, false , currentTime);
						if(playData.getDeviceType() ==='NWC') {
							$rootScope.$emit("scripts/services/playbackClass/timelineService::backupTimeRange", 
								nearItem);
						}
						itemFocusing(nearItem.start);
						return true;
					}
					else {
						return true;
					}
				};

				var moveWindow = function (timeValue) {
					var ratio;
					if(direction > 0) {
						ratio = 1/4;
					} else {
						ratio = 3/4;
					}
		            var length = currentWindowEnd.getTime() - currentWindowStart.getTime();
		            var startWindow = new Date(timeValue.getTime() - length * ratio);
		            var endWindow = new Date(timeValue.getTime() + length* (1-ratio));
		            if( startWindow <= timeline.options.start ) {
		              startWindow = timeline.options.start;
		            }
		            if( endWindow >= timeline.options.end ) {
		              endWindow = timeline.options.end;
		            }
		            changeTimelineView(startWindow, endWindow);
				};

				var itemFocusing = function(timeValue) {
					if(timeValue > currentWindowEnd || timeValue < currentWindowStart) {
						moveWindow(timeValue);
					}
		        };

				/*
				* jump to next/prev item.
				* @name : jumpEvent
				* @param : newVal is PLAY_CMD.PREV or PLAY_CMD.NEXT ( refer to playback_type.js )
				*/
				this.jumpEvent = function(newVal) {
					stopCallback = true;  //stop updating timestamp 
					var currentTime = timeline.getCustomTime('t1');
					var selectedItem = itemSet.getSelectedItem(currentTime, direction);
					var currentIndex;
					if( selectedItem === null ) {
						if(newVal === PLAY_CMD.PREV) {
							return; // not occur anything if no item selected
						} else {
							selectedItem = itemSet.getNextNearItem(currentTime);
							if(selectedItem === null) {
								return;
							}
							currentIndex = selectedItem.id;
						}
					} else {
						currentIndex = selectedItem.id;
						if( newVal === PLAY_CMD.PREV ) {
							--currentIndex;
						} else if( newVal === PLAY_CMD.NEXT) {
							currentIndex++;
						}
					}

					var item = itemSet.getIndexingItem(currentIndex);
					if( item === null ) {
						var message = 'This is' + (newVal===PLAY_CMD.PREV ? ' first' : ' last') + ' event';
						ModalManagerService.open(
							'message',
							{'message' : message, 'buttonCount' : 0}
						);
						return false;
					}
					// setPlayRange( item, false , item.start);
					setTimebarPosition(item.start, item.end);
					setTimeRange(item.start,item.end);
					itemFocusing(item.start);
					stopCallback = false;  // re-start updating timestamp
					return true;
				};

				/*
				* re-start selected Item
				* @name : goInit
				*/
				this.goInit = function() {
					stopCallback = true;  //stop updating timestamp 
					var currentTime = timeline.getCustomTime('t1');
					var selectedItem = itemSet.getSelectedItem(currentTime, direction);
					if( selectedItem === null ) return;
					setTimebarPosition(selectedItem.start, selectedItem.end);
					setTimeRange(selectedItem.start, selectedItem.end);
					itemFocusing(selectedItem.start);
					stopCallback = false;  // re-start updating timestamp
				};
					
				this.clearTimeline = function(){
					if( timeline === null ) return;
					itemSet.clearData();
					timeline.setItems([]);

					this.changeTimelineView(
						timeline.options.start,
						timeline.options.end
					);

					setTimebarPosition(timeline.options.start);
					var deviceType = playData.getDeviceType();
					if(deviceType !== 'NWC') {
						searchData.setEventTypeList(null);
						searchData.setOverlapId(0);
					}
					
				};

	      this.stopCallback = function(value) {
	      	if( value === true ) {
	      		timestamp = 0;
	      	}
	      	stopCallback = value;
	      };

	      this.setTimebar = function( hours, minutes, seconds ) {
	      	if( playData.getStatus() === PLAY_CMD.PLAY ) return false;
	      	var currentTime = timeline.getCustomTime('t1');
	      	setTimebarPosition(
	      		new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 
	      			hours, minutes, seconds));
	      	return true;
	      };

	      var getPosition = function() {
	      	return timeline.getCustomTime('t1');
	      };

			var setInitialPosition = function(start, end) {
				setTimebarPosition(
					new Date(start.getTime()),
					end
				);
			};
				/*
				* add received item in timeline
				* App, need to change window view 1 hour
				* @name : displayTimeline
				* @param : newVal is array type.
				*/
				this.displayTimeline = function(timerange){
					if( timeline === null) return;
					timeline.setItems([]);
					var itemList = itemSet.getFullItemSet();
					timeline.setItems(itemList);
					if( itemList !== undefined && itemList.length > 0 ) {
						firstItemPosition = itemList[0].start;
						lastItemPosition = itemList[itemList.length-1].end;
						if( isPhone ){
							var startWindow, endWindow;
							if(timerange === null) {
								endWindow = itemList[itemList.length-1].end;
								startWindow = new Date(endWindow.getTime()-60*60*1000);	
								if( startWindow.getDate() !== endWindow.getDate() ){
									startWindow = new Date(endWindow.getFullYear(), endWindow.getMonth(), endWindow.getDate(), 0, 0, 0);
								}
							} else {
								endWindow = timerange.end;
								startWindow = timerange.start;
							}
							this.changeTimelineView(startWindow, endWindow);
							setInitialPosition(startWindow, endWindow);
						}
						else{
							setInitialPosition(currentWindowStart, currentWindowEnd);
						}
					}
					else{
						setInitialPosition(timeline.options.start, timeline.options.end);
						firstItemPosition = null;
						lastItemPosition = null;
					}
				};

				/**
				* update playback from/to time range. (rtsp url format : recording/from(-to)/play.smp)
				* @name : applyPlaySpeed
				* @param : speed : if speed < 0 then direction is reverse.
				* switch start & end time if direction changed.
				* if eventSearch = time range is for selected item.
				* else if timeSearch = time range is for whole itmes.
				*/
				this.applyPlaySpeed = function(speed) {
					if( timeline === null ) return;
					//revert playback
					direction = speed;
					playData.setPlaySpeed(speed);
					var selectIds = timeline.getSelection();
					if( selectIds.length === 0 ) return;
					var selectedItem = itemSet.getIndexingItem(selectIds[0]);
					var currentPoint = timeline.getCustomTime('t1');
					var endPoint = null;

					var playbackType = searchData.getPlaybackType();
					if( speed < 0 ) {
						if( playbackType === 'eventSearch' ) {
							endPoint = selectedItem.start;
						} else {
							endPoint = firstItemPosition;
						}
					} else {
						if( playbackType === 'eventSearch' ) {
							endPoint = selectedItem.end;
						} else {
							endPoint = lastItemPosition;
						}
					}
					setTimeRange(currentPoint, endPoint);
				};

				this.selectOneEvent = function(eventList, item) {
					var len = eventList.length;
					for(len; len > 0; len--) {
						var tmpItem = eventList[len-1];
						if(item.id !== tmpItem.id) tmpItem.selected = false;
						else tmpItem.selected = true;
					}
					var target = null;
					if( item.dupId !== -1 ) {
						var itemList = itemSet.getDuplicatedItems(item.dupId);
						for( var i=0 ; i< itemList.length; i++ ) {
							if( itemList[i].id === item.id ) {
								target = itemList[i];
								break;
							}
						}
					}
					else {
						target = item;
					}
					searchData.setOverlapId(target.group);
					setTimeRange(target.start, 
						searchData.getPlaybackType() === 'eventSearch' ? target.end : null);
					if( playData.getStatus() === PLAY_CMD.PLAY){
						$rootScope.$emit('seek');
					}	
				};
				this.redraw = function() {
					if( timeline === null ) return;
					timeline.redraw();
				};

				this.resetTimeRange = function() {
					setTimeRange(getPosition());
				};
			};
			return TimelineService;
}]);