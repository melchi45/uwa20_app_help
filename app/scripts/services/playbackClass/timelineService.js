/*global vis, setTimeout, clearTimeout*/
kindFramework
  .factory('TimelineService', ['$rootScope','$filter', 'PlayDataModel', 'PLAYBACK_TYPE',
    'SearchDataModel', 'ItemSetModel', '$timeout', 'ModalManagerService',
      function($rootScope, $filter, PlayDataModel, PLAYBACK_TYPE, SearchDataModel,
        ItemSetModel, $timeout, ModalManagerService) {
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

        Date.prototype.stdTimezoneOffset = function() {
          var jan = new Date(this.getFullYear(), 0, 1);
          var jul = new Date(this.getFullYear(), 6, 1);
          return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
        };

        Date.prototype.dst = function() {
          return this.getTimezoneOffset() < this.stdTimezoneOffset();
        };

        Date.prototype.startDst = function() {
          if( this.dst() && this.needCheckDst == true ) {
            return true;
          }
          return false;
        };

        Date.prototype.checkDst = function(value) {
          Date.prototype.needCheckDst = value;
        };

        moment.tz.add("Africa/Abidjan|LMT GMT|g.8 0|01|-2ldXH.Q|48e5");
        moment.tz.setDefault("Africa/Abidjan");

        var convert_UTCDate_to_LocalDate = function(dateObj) {
          if( typeof dateObj !== 'object' && dateObj.getTime === undefined) {
            console.log('input parameter is wrong please check!');
            return null;
          }
          dateObj.setTime(dateObj.getTime()+dateObj.getTimezoneOffset()*60*1000);
          return dateObj;
        };

        var convert_Date_to_moment = function(dateObj) {
          if( typeof dateObj !== 'object' && dateObj.getTime === undefined) {
            console.log('input parameter is wrong please check!');
            return null;
          }
          return moment.parseZone($filter('date')(dateObj, 'yyyy-MM-dd hh:mm:ss')+'+00:00');
        };

        var convert_moment_to_Date = function(momentObj){
          if( typeof momentObj !== 'object' && momentObj.zoneName === undefined ) {
            console.log('input parameter is wrong please check!');
            return null;
          }
          var returnValue = new Date(momentObj.year(), momentObj.month(), momentObj.date(), momentObj.hour(), momentObj.minute(), momentObj.second());
          return returnValue;
        };

        var convert_moment_to_String = function(momentObj, isformatting){
          if( typeof momentObj !== 'object' && momentObj.zoneName === undefined ) {
            console.log('input parameter is wrong please check!');
            return null;
          }
          if( isformatting === true ) {
            return momentObj.format('YYYY-MM-DD HH:mm:ss');
          }
          return momentObj.format();
        };

        var convert_String_to_moment = function(dateString){
          if( typeof dateString !== 'string' ) {
            console.log('input parameter is wrong please check!');
            return null;
        }
          return moment.parseZone(dateString+"+00:00");
        };

        var convert_String_to_Date = function(dateString) {
          if( typeof dateString !== 'string' ) {
            console.log('input parameter is wrong please check!');
            return null;
          }
          var returnValue = convert_UTCDate_to_LocalDate(new Date(dateString));
          return returnValue;
        };

        var convert_Date_to_String = function(dateObj, isformatting, type) {
          if( typeof dateObj !== 'object' && dateObj.getTime === undefined) {
            console.log('input parameter is wrong please check!');
            return null;
          }
          var momentObj;
          if( dateObj.startDst()){
            momentObj = moment.utc([dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 
            dateObj.getHours()-1, dateObj.getMinutes(), dateObj.getSeconds()]);
          }
          else {
            momentObj = moment.utc([dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 
            dateObj.getHours(), dateObj.getMinutes(), dateObj.getSeconds()]);
          }
          if( isformatting === true ) {
            if( type === 'rtsp' ) { 
              return momentObj.format('YYYYMMDDHHmmss');
            }
            return momentObj.format('YYYY-MM-DD HH:mm:ss');
          }
          return momentObj.format();
        };

        var convert_UTCDate_to_LocalMoment = function(dateObj) {
          return moment.utc(dateObj);
        };

        var getTimelineOption = function(startDate, endDate) {
          var options = {
            start: startDate,
            end: endDate,
            zoomMax: 1000 * 60 * 60 * 24,
            zoomMin: 1000 * 60 * 30,
            min: startDate.format('YYYY-MM-DD HH:mm:ss'),
            max: endDate.format('YYYY-MM-DD HH:mm:ss'),
            margin: 0,
            height: '45px',
            stack : false,
            orientation: {
              axis: 'top',
            },
            showCurrentTime:false,
            autoResize : false,
            moment: function(date) {
              return vis.moment(date).utc();
            },
          };
          options.format = {
            majorLabels : {
              second:     'HH:mm',
              minute:     '',
              hour:       '',
              weekday:    '',
              day:        '',
              month:      '',
              year:       ''	
            },
            minorLabels : {
              second:     's',
              minute:     'HH:mm',
              hour:       'HH:mm',
              weekday:    'HH:mm',
              day:        'HH:mm',
              month:      'HH:mm',
              year:       ''	        		
            }
          };
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
            //endTarget -= time.timezone*60*1000;
            calculatedTimezone = true;
          }

          if( timestamp !== time.timestamp ) {
            var curTime = new Date(time.timestamp*1000);
            var deviceType = playData.getDeviceType();
            if(deviceType === 'NWC') {
              curTime = null;
              curTime = moment.utc(time.timestamp*1000 + time.timezone*60*1000);
            }
            // console.log('timestamp :::', new Date(time.timestamp*1000), 'playbar :::', curTime);
            var diff;
            if( deviceType === 'NWC' ) {
              diff = curTime.valueOf() - convert_String_to_moment(endTarget).valueOf();
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
            setTimebarPosition(curTime.format(), convert_String_to_Date(endTarget));
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

        //startTime, endTime : Date obj -->dst Àû¿ë½Ã ¹Ù²ï Date
        var setTimeRange = function(startTime, endTime) {
          var startTimeString = convert_Date_to_String(startTime, true, 'rtsp' );
          var endTimeString;
          if( endTime !== undefined && endTime !== null ) {
            endTimeString = convert_Date_to_String(endTime, true, 'rtsp');
          }
          playData.setTimeRange(startTime, endTime, startTimeString, endTimeString);
          if( typeof(endTime) !== 'undefined' && endTime !== null ) {
            endTarget = convert_Date_to_String(endTime);
            calculatedTimezone = false; 
          }
          else if( lastItemPosition !== null ) {
            endTarget = convert_Date_to_String(lastItemPosition);
            calculatedTimezone = false;      		 
          }
        };

        //timePosition is string type, endTime is Date type
        var setTimebarPosition = function(timePosition, endTime) {
          if( timeline === null ) return;
          var playbackStatus = playData.getStatus();
          if( playbackStatus === PLAY_CMD.STOP ||
            playbackStatus === PLAY_CMD.PAUSE ||
            playbackStatus === PLAY_CMD.PLAYPAGE) {
            setTimeRange(convert_String_to_Date(timePosition), endTime);
          }

          timeline.setCustomTime(timePosition, 't1');

          var time_info = {
            'hours': timePosition.substring(11, 13),
            'minutes': timePosition.substring(14, 16),
            'seconds': timePosition.substring(17, 19)
          };
          $rootScope.$emit('updateTimebar', time_info);
          updateTimebarData(timePosition);      	
        };

        var updateTimebarData = function(timePosition) {
          updateTimelineText([]);
          var localObj = convert_String_to_Date(timePosition)
          var showingItem = itemSet.getSelectedItem(localObj);
          var selectedId = [];
          if( showingItem !== null ) {
            selectedId.push(showingItem.id);
          }
          $timeout(function() {
            timeline.setSelection(selectedId);
          });

          var selectedItem = itemSet.getSelectedItem(localObj, direction);
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
            'start': duplicateItems[i].start.format("HH:mm:ss"),
            'end': duplicateItems[i].end.format("HH:mm:ss"),
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
            'start' :  data.start.format("HH:mm:ss"),
            'end' : data.end.format("HH:mm:ss"),
            'selected' : false,
            'eventType' : data.eventType,
            'dupId' : data.dupId,
            'group' : data.group,
          });
          updateTimelineText(itemInfo);
        };


        var setPlayRange = function(item, isDoubleClick, time) {
          var startPoint, endPoint;
          startPoint = isDoubleClick? time : item.startObj;
          if( searchData.getPlaybackType() === 'eventSearch') {
            endPoint = item.endObj;
          }
          else {
            endPoint = lastItemPosition;
          }

          if( direction < 0 ) {
            startPoint = isDoubleClick ? time : item.endObj;
            if( searchData.getPlaybackType() === 'eventSearch' ) {
              endPoint = item.startObj;
            }
            else {
              endPoint = firstItemPosition;
            }
          }
          setTimeRange(startPoint, endPoint);
          setTimebarPosition(convert_Date_to_String(startPoint), endPoint);
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
        this.createTimeline = function(element, _updateTimelineText){
          if( timeline !== null ) {
            console.log("already created timeline object");
            $timeout(function(){
              timeline.redraw();
            });
            return;
          }
          var deviceType = playData.getDeviceType();
          var today;
          if( deviceType ==='NWC' ) {
            today = searchData.getSelectedDate();
          }
          else {
            today = new Date();
          }
          var inputDate = $filter('date')(today, 'yyyy-MM-dd');
          var startDate = convert_String_to_moment(inputDate+' 00:00:00');
          var endDate = convert_String_to_moment(inputDate+' 23:59:59');
          var options = getTimelineOption(startDate, endDate);
          var container = element.find('div.timeline-container')[0];

          timeline = new vis.Timeline(container, itemSet.getFullItemSet(), options);
          timeline.addCustomTime(startDate.format(),'t1');
          searchData.setSelectedDate(convert_moment_to_Date(startDate));
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
            updateTimestamp = convert_UTCDate_to_LocalMoment(properties.time);
            if( updateTimeCallback === null ) {
              updateTimeCallback = setTimeout(function() {
                updateTimeCallback = null;
                var time_info = {
                  'hours': updateTimestamp.hour(),
                  'minutes': updateTimestamp.minute(),
                  'seconds': updateTimestamp.second()
                };
                $rootScope.$emit('updateTimebar', time_info);
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
            currentWindowStart = convert_UTCDate_to_LocalMoment(properties.start);
            currentWindowEnd = convert_UTCDate_to_LocalMoment(properties.end);
          });

          /**
          * 'rangechanged' : fired once after start-end changed
          */
          timeline.on('rangechanged', function(properties) {
            if( properties.byUser === false ){
              return;
          }
          currentWindowStart = convert_UTCDate_to_LocalMoment(properties.start);
          currentWindowEnd = convert_UTCDate_to_LocalMoment(properties.end);
          });

          this.changeTimelineView(startDate, endDate);

          playData.setTimeCallback(getTimestamp);
          playData.setTimeBarPositionCallback(setTimebarPosition);

          playData.setCurrentPositionFunc(getCurrentPositioForStep);
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

        this.changeOptions = function(inputDate, inputEndDate){
          var deviceType = playData.getDeviceType();
          var today;
          if( deviceType ==='NWC' ) {
            today = searchData.getSelectedDate();
          }
          else {
            today = new Date();
          }
          var targetDate = $filter('date')(inputDate,'yyyy-MM-dd');
          var startDate = convert_String_to_moment(targetDate+' 00:00:00');
          var endDate = convert_String_to_moment(targetDate+' 23:59:59');

          var options = getTimelineOption(startDate, endDate);
          timeline.setOptions(options);
          itemSet.clearData();
        };

        this.refreshTimelineView = function() {
          this.changeTimelineView(timeline.options.start, timeline.options.end);
        };

        var getSelectedItemInfo = function() {
          if( timeline === null ) return;
          var currentTime = convert_String_to_Date(getPosition());
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

          var selectTimeString = convert_UTCDate_to_LocalMoment(props.time).format();
          var selectTime = convert_UTCDate_to_LocalDate(props.time);
          if( selectTimeString.substring(11,13) != selectTime.getHours() ) {
            selectTime.checkDst(true);
          }
          else {
            selectTime.checkDst(false);
          }

          if($filter('date')(selectTime,'yyyy-MM-dd') < 
            $filter('date')(nowDate,'yyyy-MM-dd')){
            dateValidCheckFlag = false;
            var timePosition = convert_String_to_moment($filter('date')(nowDate,'yyyy-MM-dd')+' 00:00:00');
            setTimebarPosition(timePosition.format());
          }
          if($filter('date')(props.time,'yyyy-MM-dd') > 
            $filter('date')(nowDate,'yyyy-MM-dd')){
            dateValidCheckFlag = false;
            var timePosition = convert_String_to_moment($filter('date')(nowDate,'yyyy-MM-dd')+' 23:59:59');
            setTimebarPosition(timePosition.format());
          }

          if( dateValidCheckFlag === true && 
            itemSet.getSelectedItem(selectTime, direction) === null && playData.getStatus() !== PLAY_CMD.PLAY ){
            setTimebarPosition(selectTimeString);
          } else {
            findNearItem(selectTime);
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

        this.checkCurrentTimeIsValid = function() {
          if( timeline === null) return false;
          var currentTime = convert_String_to_Date(getPosition());
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
          var length = currentWindowEnd.valueOf() - currentWindowStart.valueOf();
          var startWindow = moment(timeValue.valueOf() - length * ratio);
          var endWindow = moment(timeValue.valueOf() + length* (1-ratio));
          if( startWindow.valueOf() <= timeline.options.start.valueOf() ) {
            startWindow = timeline.options.start;
          }
          if( endWindow.valueOf() >= timeline.options.end.valueOf() ) {
            endWindow = timeline.options.end;
          }
          changeTimelineView(startWindow, endWindow);
        };

        var itemFocusing = function(timeValue) {
          if(timeValue.valueOf() > currentWindowEnd.valueOf() || timeValue.valueOf() < currentWindowStart.valueOf()) {
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
          var currentTime = convert_String_to_Date(getPosition());
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
          setTimebarPosition(convert_moment_to_String(item.start), item.endObj);
          setTimeRange(item.startObj,item.endObj);
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
          var currentTime = convert_String_to_moment(getPosition());
          var selectedItem = itemSet.getSelectedItem(convert_moment_to_Date(currentTime), direction);
          if( selectedItem === null ) return;
          setTimebarPosition(convert_Date_to_String(selectedItem.startObj), selectedItem.end);
          setTimeRange(selectedItem.startObj, selectedItem.endObj);
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

          setTimebarPosition(timeline.options.start.format());
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
          var currentTime = convert_String_to_moment(getPosition());
          currentTime.hour(hours);
          currentTime.minute(minutes);
          currentTime.second(seconds);
          setTimebarPosition(currentTime.format());
          return true;
        };

        var getCurrentPositioForStep = function() {
          var current = convert_String_to_moment(getPosition());
          return current.format('YYYYMMDDHHmmss');
        };	

        var getPosition = function() {
          var timePosition = new Date(timeline.getCustomTime('t1')); //date
          timePosition = convert_UTCDate_to_LocalDate(timePosition);
          return convert_Date_to_String(timePosition);
        };

        var setInitialPosition = function(start, end) {
        setTimebarPosition(start.format(), convert_moment_to_Date(end));
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
            firstItemPosition = itemList[0].startObj;
            lastItemPosition = itemList[itemList.length-1].endObj;
            if( isPhone ){
              var startWindow, endWindow;
              if(timerange === null) {
                endWindow = itemList[itemList.length-1].endObj;
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
          var currentPoint = getPosition(); //string type
          var endPoint = null;

          var playbackType = searchData.getPlaybackType();
          if( speed < 0 ) {
            if( playbackType === 'eventSearch' ) {
              endPoint = selectedItem.startObj;
            } else {
              endPoint = firstItemPosition;
            }
          } else {
            if( playbackType === 'eventSearch' ) {
              endPoint = selectedItem.endObj;
            } else {
              endPoint = lastItemPosition;
            }
          }
          setTimeRange(convert_String_to_Date(currentPoint), endPoint);
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
          setTimeRange(target.startObj, 
          searchData.getPlaybackType() === 'eventSearch' ? target.endObj : null);
          if( playData.getStatus() === PLAY_CMD.PLAY){
            $rootScope.$emit('seek');
          }	
        };

        this.redraw = function() {
        if( timeline === null ) return;
        timeline.redraw();
        };

        this.resetTimeRange = function() {
          var endTime = endTarget;
          if( endTime !== null ) {
            endTime = convert_String_to_Date(endTime);
            if( endTarget.substring(11,13) !== endTime.getHours()) {
              endTime.checkDst(true);
            }
          }
          setTimeRange(convert_String_to_Date(getPosition()), 
          searchData.getPlaybackType() === 'eventSearch' ? endTime : null );
        };
      };
      return TimelineService;
}]);