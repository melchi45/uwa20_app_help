/*global vis, setTimeout, clearTimeout*/
kindFramework.
  factory('TimelineService', ['$rootScope', '$filter', 'PlayDataModel', 'PLAYBACK_TYPE',
    'SearchDataModel', 'ItemSetModel', '$timeout', 'ModalManagerService', 
    'UniversialManagerService',
    function($rootScope, $filter, PlayDataModel, PLAYBACK_TYPE, SearchDataModel,
      ItemSetModel, $timeout, ModalManagerService, UniversialManagerService) {
      "use strict";
      var TimelineService = function() {
        if (TimelineService._instance) {
          return TimelineService._instance;
        }
        TimelineService._instance = this;
        var HOUR_TO_MIN = 60, MIN_TO_SEC = 60, SEC_TO_MS = 1000;
        var ZOOM_MAX_24H = 24;
        var ZOOM_MIN_30M = 30;
        var TIMEOUT = 500, REDRAW_TIMEOUT = 50, TIMEBAR_UPDATE_INTERVAL = 100,
          WINDOW_MOVE_TIMEOUT = 2000;
        var HOUR_START_POINT = 11, MIN_START_POINT = 14, SEC_START_POINT = 17,
          TIME_LENGTH = 2;

        var playData = new PlayDataModel();
        var searchData = new SearchDataModel();
        var itemSet = new ItemSetModel();
        var PLAY_CMD = PLAYBACK_TYPE.playCommand;
        //This is for variable
        var timeline = null;
        var currentWindowStart = null,
          currentWindowEnd = null;
        var firstItemPosition = null,
          lastItemPosition = null;
        var updateTimelineText = null;

        var direction = 1;
        var timestamp = 0;
        var stopCallback = false;
        var calculatedTimezone = false;
        var endTarget = null;
        var selectedID = -1;

        var blockWindowShiftTimeoutId = null;
        var ignorePanEvent = false;
        var updateTimestamp = 0;
        var blockPlayback = null;
        var isValidBlock = false;

        //This is for local function

        /*
         * @function : stdTimezoneoffset
         */
        Date.prototype.stdTimezoneOffset = function() {
          var jan = new Date(this.getFullYear(), 0, 1);
          var jul = new Date(this.getFullYear(), 6, 1);
          return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
        };

        /*
         * check current date is applied dst or not
         * @function : dst
         */
        Date.prototype.dst = function() {
          return this.getTimezoneOffset() < this.stdTimezoneOffset();
        };

        /*
         * start dst during 1 hours new Date().getHours() values differs with 1h
         * @function : startDst
         */
        Date.prototype.startDst = function() {
          if (this.dst() && this.needCheckDst === true) {
            return true;
          }
          return false;
        };


        /*
         * @function : checkDst
         */
        Date.prototype.checkDst = function(value) {
          Date.prototype.needCheckDst = value;
        };

        moment.tz.add("Africa/Abidjan|LMT GMT|g.8 0|01|-2ldXH.Q|48e5");
        moment.tz.setDefault("Africa/Abidjan");

        /*
         * applied local timezone offset
         *
         * @function : convertUTCDateToLocalDate
         * @param : dateObj is type of Date
         */
        var convertUTCDateToLocalDate = function(dateObj) {
          if (typeof dateObj !== 'object' && typeof dateObj.getTime === "undefined") {
            console.log('input parameter is wrong please check!');
            return null;
          }
          dateObj.setTime(dateObj.getTime() + (dateObj.getTimezoneOffset() * MIN_TO_SEC*SEC_TO_MS));
          return dateObj;
        };

        /*
         * convert moment to Date
         *
         * @function : convertMomentToDate
         * @param : momentObj is type of moment
         */
        var convertMomentToDate = function (momentObj) {
          if (typeof momentObj !== 'object' && typeof momentObj.zoneName === "undefined") {
            console.log('input parameter is wrong please check!');
            return null;
          }
          var returnValue = new Date(momentObj.year(), momentObj.month(), momentObj.date(), 
                                    momentObj.hour(), momentObj.minute(), momentObj.second());
          return returnValue;
        };

        /*
         * convert moment to String
         *
         * @function : convertMomentToString
         * @param : momentObj is type of moment
         * @return : string 
         */
        var convertMomentToString = function(momentObj, isformatting) {
          if (typeof momentObj !== 'object' && typeof momentObj.zoneName === "undefined") {
            console.log('input parameter is wrong please check!');
            return null;
          }
          if (isformatting === true) {
            return momentObj.format('YYYY-MM-DD HH:mm:ss');
          }
          return momentObj.format();
        };

        /*
         * convert String to moment object
         *
         * @function : convertStringToMoment
         * @param : dateString is type of string
         */
        var convertStringToMoment = function(dateString) {
          if (typeof dateString !== 'string') {
            console.log('input parameter is wrong please check!');
            return null;
          }
          return moment.parseZone(dateString + "+00:00");
        };

        /*
         * convert String to Date object
         *
         * @function : convertStringToDate
         * @param : dateString is type of string
         */
        var convertStringToDate = function(dateString) {
          if (typeof dateString !== 'string') {
            console.log('input parameter is wrong please check!');
            return null;
          }
          var returnValue = convertUTCDateToLocalDate(new Date(dateString));
          return returnValue;
        };

        /*
         * convert Date to String
         *
         * @function : convertDateToString
         * @param : dateObj is type of Date
         *        : if isformatting is false, return default type of string
         *        : if type value is 'rtsp', then return rtspUrlTime format 
         */
        var convertDateToString = function(dateObj, isformatting, type) {
          if (typeof dateObj !== 'object' && typeof dateObj.getTime === "undefined") {
            console.log('input parameter is wrong please check!');
            return null;
          }
          var momentObj = null;
          if (dateObj.startDst()) {
            momentObj = moment.utc([dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(),
              dateObj.getHours() - 1, dateObj.getMinutes(), dateObj.getSeconds()]);
          } else {
            momentObj = moment.utc([dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(),
              dateObj.getHours(), dateObj.getMinutes(), dateObj.getSeconds()]);
          }
          if (isformatting === true) {
            if (type === 'rtsp') {
              return momentObj.format('YYYYMMDDHHmmss');
            }
            return momentObj.format('YYYY-MM-DD HH:mm:ss');
          }
          return momentObj.format();
        };

        /*
         * convert Date to moment.utc object
         *
         * @function : convertUTCDateToLocalMoment
         * @param : dateObj is type of Date
         */
        var convertUTCDateToLocalMoment = function(dateObj) {
          return moment.utc(dateObj);
        };

        /*
         * return timeline create options
         *
         * @function : getTimelineOption
         * @param : startDate, endDate is type of moment
         */
        var getTimelineOption = function(startDate, endDate) {
          var options = {
            start: startDate,
            end: endDate,
            zoomMax: ZOOM_MAX_24H* HOUR_TO_MIN*MIN_TO_SEC*SEC_TO_MS,
            zoomMin: ZOOM_MIN_30M* MIN_TO_SEC*SEC_TO_MS,
            min: startDate.format('YYYY-MM-DD HH:mm:ss'),
            max: endDate.format('YYYY-MM-DD HH:mm:ss'),
            margin: 0,
            height: '45px',
            stack: false,
            orientation: {
              axis: 'top',
            },
            showCurrentTime: false,
            autoResize: false,
            moment: function(date) {
              return vis.moment(date).utc();
            },
          };
          options.format = {
            majorLabels: {
              second: 'HH:mm',
              minute: '',
              hour: '',
              weekday: '',
              day: '',
              month: '',
              year: '',
            },
            minorLabels: {
              second: 's',
              minute: 'HH:mm',
              hour: 'HH:mm',
              weekday: 'HH:mm',
              day: 'HH:mm',
              month: 'HH:mm',
              year: '',
            },
          };
          return options;
        };

        /*
         * timestampCallback. It is called by Plugin or RtspClient.
         * @name : getTimestamp
         * @param : time is second for utc_time.
         *        : stepFlag is for step play
         */
        function getTimestamp(time, stepFlag) {
          if (time === null) {
            return;
          }
          if (stopCallback && (typeof stepFlag === "undefined" || stepFlag === false)) {
            return;
          }
          if (playData.getIsMultiPlayback() && 
            UniversialManagerService.getChannelId() !== time.channel_index) {
            return;
          }
          /*
           * If end time reached, we need to manually stop the stream.
           */
          if (typeof(time.timezone) !== 'undefined' && time.timezone !== null && 
            calculatedTimezone === false) {
            //endTarget -= time.timezone*60*1000;
            calculatedTimezone = true;
          }
          if (timestamp !== time.timestamp) {
            var curTime = null;
            var deviceType = playData.getDeviceType();
            if (deviceType === 'NWC') {
              curTime = moment.utc((time.timestamp * SEC_TO_MS) + 
                                  (time.timezone * MIN_TO_SEC * SEC_TO_MS));
            }
            // console.log('timestamp :::', new Date(time.timestamp*1000), 'playbar :::', curTime);
            var diff=0;
            if (deviceType === 'NWC') {
              diff = curTime.valueOf() - convertStringToMoment(endTarget).valueOf();
            } else {
              curTime = new Date(time.timestamp * SEC_TO_MS);
              diff = curTime.getTime() - endTarget;
            }
            if ((direction > 0 && diff >= 0) || (direction < 0 && diff <= 0)) {
              playData.setStatus(PLAY_CMD.STOP);
              playData.setDefautPlaySpeed();
              stopCallback = true;
            }
            if (blockWindowShiftTimeoutId === null && playData.getTimelineEnable()) {
              itemFocusing(curTime);
            }
            setTimebarPosition(curTime.format(), 
                    convertStringToDate(endTarget), !(stepFlag === true) );
          }
          timestamp = time.timestamp;
        }

        /*
         * if no item selected, then find next item.
         * @name : findNearItem
         * @param : time is Date object which is currently set
         */
        var isSameId = false;
        var findNearItem = function(time) {
          var needToRevertFlag = false;
          if (stopCallback === false) {
            stopCallback = true;
            needToRevertFlag = true;
          }
          /*
           * return item list which is existing after 'time'
           */
          var selectedItem = itemSet.getSelectedItem(time, direction);
          if (selectedItem === null || selectedID !== selectedItem.id) {
            isSameId = false;
          } else {
            isSameId = true;
          }

          var nearItem = null;
          if (selectedItem === null) {
            nearItem = itemSet.getNextNearItem(time);
          } else {
            nearItem = selectedItem;
          }
          if (nearItem === null) {
            console.log("There is no near item");
            stopCallback = false;
            return false;
          }

          setPlayRange(nearItem, isSameId, time);
          if (needToRevertFlag === true) {
            stopCallback = false;
          }

          /*
           * if 'eventSearch' to be set, must be set end time ( eventSearch for only playing selected item.)
           */
          return true;
        };

        /*
         * set RTSP time range
         * 
         * @function : setTimeRange
         * @param : startTime, endTime is type of Date.
         */
        var setTimeRange = function(startTime, endTime) {
          var startTimeString = convertDateToString(startTime, true, 'rtsp');
          var endTimeString = null;
          if (typeof endTime !== "undefined" && endTime !== null) {
            endTimeString = convertDateToString(endTime, true, 'rtsp');
          }
          playData.setTimeRange(startTime, endTime, startTimeString, endTimeString);
          if (typeof(endTime) !== 'undefined' && endTime !== null) {
            endTarget = convertDateToString(endTime);
            calculatedTimezone = false;
          } else if (lastItemPosition !== null) {
            endTarget = convertDateToString(lastItemPosition);
            calculatedTimezone = false;
          }
        };

        /*
         * set timebar position & update timeRange info
         *
         * @function : setTimebarPosition
         * @param : timePosition is type of String, endTime is type of Date
         *        : if discard set to true, don't update rtsp url info.
         */
        var setTimebarPosition = function(timePosition, endTime, discard) {
          if (timeline === null) {
            return;
          }
          var playbackStatus = playData.getStatus();
          if (discard !== true) {
            if (playbackStatus === PLAY_CMD.STOP ||
              playbackStatus === PLAY_CMD.PAUSE ||
              playbackStatus === PLAY_CMD.PLAYPAGE) {
              setTimeRange(convertStringToDate(timePosition), endTime);
            }
          }
          timeline.setCustomTime(timePosition, 't1');

          var timeInfo = {
            'hours': timePosition.substring(HOUR_START_POINT, HOUR_START_POINT+TIME_LENGTH),
            'minutes': timePosition.substring(MIN_START_POINT, MIN_START_POINT+TIME_LENGTH),
            'seconds': timePosition.substring(SEC_START_POINT, SEC_START_POINT+TIME_LENGTH),
          };
          $rootScope.$emit('updateTimebar', timeInfo);
          updateTimebarData(timePosition);
        };

        /*
         * update selected item's info
         *
         * @function : updateTimebarData
         * @param : timePosition is type of String
         */
        var updateTimebarData = function(timePosition) {
          updateTimelineText([]);
          var localObj = convertStringToDate(timePosition)
          var showingItem = itemSet.getSelectedItem(localObj);
          var selectedId = [];
          if (showingItem !== null) {
            selectedId.push(showingItem.id);
          }
          $timeout(function() {
            timeline.setSelection(selectedId);
          });

          var selectedItem = itemSet.getSelectedItem(localObj, direction);
          if (selectedItem === null) {
            selectedID = -1;
            return;
          }

          if (selectedItem.dupId !== -1) {
            loadDuplicatedData(selectedItem.dupId);
          } else {
            showDataInfo(selectedItem);
          }

          selectedID = selectedItem.id;
        };

        /*
         * show duplicated items's info
         *
         * @function : loadDuplicatedData
         * @param : dupId is type of init. 
         */
        var loadDuplicatedData = function(dupId) {
          var itemList = [];
          var duplicateItems = itemSet.getDuplicatedItems(dupId);
          for (var i = 0; i < duplicateItems.length; i++) {
            var itemInfo = {
              'id': duplicateItems[i].id,
              'start': duplicateItems[i].start.format("HH:mm:ss"),
              'end': duplicateItems[i].end.format("HH:mm:ss"),
              'eventType': duplicateItems[i].eventType,
              'dupId': duplicateItems[i].dupId,
              'selected': false,
            };
            itemList.push(itemInfo);
          }
          updateTimelineText(itemList);
        };

        /*
         * show items's info
         *
         * @function : showDataInfo
         * @param : data is ItemSetModels's data
         */
        var showDataInfo = function(data) {
          var itemInfo = [];
          itemInfo.push({
            'id': data.id,
            'start': data.start.format("HH:mm:ss"),
            'end': data.end.format("HH:mm:ss"),
            'selected': false,
            'eventType': data.eventType,
            'dupId': data.dupId,
            'group': data.group,
          });
          updateTimelineText(itemInfo);
        };


        /*
         * show items's info
         *
         * @function : setPlayRange
         * @param : item is ItemSetModels's data, time is type of Date
         */
        var setPlayRange = function(item, isDoubleClick, time) {
          var startPoint=null, endPoint=null;
          startPoint = isDoubleClick ? time : item.startObj;
          if (searchData.getPlaybackType() === 'eventSearch') {
            endPoint = item.endObj;
          } else {
            endPoint = lastItemPosition;
          }

          if (direction < 0) {
            startPoint = isDoubleClick ? time : item.endObj;
            if (searchData.getPlaybackType() === 'eventSearch') {
              endPoint = item.startObj;
            } else {
              endPoint = firstItemPosition;
            }
          }
          setTimeRange(startPoint, endPoint);
          setTimebarPosition(convertDateToString(startPoint), endPoint);
        };

        /*
         * change timeline view
         *
         * @function : changeTimelineView
         * @param : start, end is type of moment
         */
        var changeTimelineView = this.changeTimelineView = function(start, end) {
          currentWindowStart = start;
          currentWindowEnd = end;
          //				$timeout(function() {
          timeline.setWindow(start, end, {
            animation: false,
          });
          //				});
        };

        /**
         * change timeline view
         *
         * @function : checkTimelineMoving
         */
        var checkTimelineMoving = function() {
          if (isPhone) {
            return;
          }
          if (playData.getStatus() === PLAY_CMD.PLAY && isValidBlock === false) {
            $rootScope.$emit("scripts/services/playbackClass/timelineService::changePlayStatus",
              PLAY_CMD.PAUSE);
            isValidBlock = true;
          }
          if (playData.getStatus() === PLAY_CMD.PAUSE && isValidBlock) {
            if (blockPlayback !== null) {
              clearTimeout(blockPlayback);
            }

            blockPlayback = setTimeout(function() {
              blockPlayback = null;
              if (playData.getStatus() === PLAY_CMD.PAUSE) {
                $rootScope.$emit("scripts/services/playbackClass/timelineService::changePlayStatus",
                  PLAY_CMD.PLAY);
                isValidBlock = false;
              }
            }, TIMEOUT);
          }
        };

        /**
         * create timeline
         * @name createTimeline
         * @param : _updateTimelineText is callback function from channel.js
         */
        this.createTimeline = function(element, _updateTimelineText) {
          if (timeline !== null) {
            console.log("already created timeline object");
            $timeout(function() {
              timeline.redraw();
            });
            return;
          }
          var deviceType = playData.getDeviceType();
          var today = null;
          if (deviceType === 'NWC') {
            today = searchData.getSelectedDate();
          } else {
            today = new Date();
          }
          var inputDate = $filter('date')(today, 'yyyy-MM-dd');
          var startDate = convertStringToMoment(inputDate + ' 00:00:00');
          var endDate = convertStringToMoment(inputDate + ' 23:59:59');
          var options = getTimelineOption(startDate, endDate);
          var container = element.find('div.timeline-container')[0];

          timeline = new vis.Timeline(container, itemSet.getFullItemSet(), options);
          timeline.addCustomTime(startDate.format(), 't1');
          searchData.setSelectedDate(convertMomentToDate(startDate));
          var createInterval = 0;
          if (!isPhone) {
            createInterval = REDRAW_TIMEOUT;
            $timeout(function() {
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
            updateTimestamp = convertUTCDateToLocalMoment(properties.time);
            if (updateTimeCallback === null) {
              updateTimeCallback = setTimeout(function() {
                updateTimeCallback = null;
                $rootScope.$emit('updateTimebar', {
                  'hours': updateTimestamp.hour(),
                  'minutes': updateTimestamp.minute(),
                  'seconds': updateTimestamp.second(),
                });
              }, TIMEBAR_UPDATE_INTERVAL);
            }
          });

          var timelineObj = this;

          timeline.on('timechanged', function(properties) {
            stopCallback = false;
            ignorePanEvent = false;
            timelineObj.selectTimeline(null, properties);
            if (playData.getDeviceType() === 'NWC' && playData.getStatus() === PLAY_CMD.PAUSE) {
              playData.setNeedToImmediate(true);
            }
          });

          timeline.on('rangechange', function(properties) {
            if (properties.byUser === false) {
              return;
            }
            checkTimelineMoving();
            currentWindowStart = convertUTCDateToLocalMoment(properties.start);
            currentWindowEnd = convertUTCDateToLocalMoment(properties.end);
          });

          /**
           * 'rangechanged' : fired once after start-end changed
           */
          timeline.on('rangechanged', function(properties) {
            if (properties.byUser === false) {
              return;
            }
            currentWindowStart = convertUTCDateToLocalMoment(properties.start);
            currentWindowEnd = convertUTCDateToLocalMoment(properties.end);
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
         * @function : enableToDraw
         */
        this.enableToDraw = function() {
          if (ignorePanEvent === true) {
            return;
          }
          if (blockWindowShiftTimeoutId !== null) {
            clearTimeout(blockWindowShiftTimeoutId);
          }
          blockWindowShiftTimeoutId = setTimeout(function() {
            blockWindowShiftTimeoutId = null;
          }, WINDOW_MOVE_TIMEOUT);
          changeTimelineView(currentWindowStart, currentWindowEnd);
        };

        /*
         * delete timeline and item set
         * @function : destroy
         */
        this.destroy = function() {
          itemSet.clearData();
          if (timeline === null) {
            return;
          }
          timeline.setItems([]);
          timeline.destroy();
          timeline = null;
          selectedID = -1;
          direction = 1;
        };

        /*
         * change timeline options
         * @function : changeOptions
         * @param : inputDate, inputEndDate is type of Date
         */
        this.changeOptions = function(inputDate, inputEndDate) {
          var targetDate = $filter('date')(inputDate, 'yyyy-MM-dd');
          var startDate = convertStringToMoment(targetDate + ' 00:00:00');
          var endDate = convertStringToMoment(targetDate + ' 23:59:59');

          var options = getTimelineOption(startDate, endDate);
          timeline.setOptions(options);
          itemSet.clearData();
        };

        /*
         * change timeline options to default
         * @function : refreshTimelineView
         */
        this.refreshTimelineView = function() {
          this.changeTimelineView(timeline.options.start, timeline.options.end);
        };

        /*
         * based on currentTime, get Selected item
         * @function : getSelectedItemInfo
         */
        var getSelectedItemInfo = function() {
          if (timeline === null) {
            return;
          }
          var currentTime = convertStringToDate(getPosition());
          return itemSet.getSelectedItem(currentTime, direction);
        };

        /*
         * timeline click event handler
         * @function : selectTimeline
         */
        this.selectTimeline = function(event, properties) {
          $rootScope.$emit(
            'app/script/services/playbackClass/timelineService.js::stepInit');

          var props = null;
          if (typeof(event) === 'undefined' || event === null) {
            props = properties;
          } else {
            props = timeline.getEventProperties(event);
          }
          var nowDate = searchData.getSelectedDate();
          var dateValidCheckFlag = true;

          var selectTimeString = convertUTCDateToLocalMoment(props.time).format();
          var selectTime = convertUTCDateToLocalDate(props.time);
          var hourString = selectTimeString.substring(
                            HOUR_START_POINT, HOUR_START_POINT+TIME_LENGTH);
          if (parseInt(hourString) !== selectTime.getHours()) {
            selectTime.checkDst(true);
          } else {
            selectTime.checkDst(false);
          }

          var timePosition = null;
          if ($filter('date')(selectTime, 'yyyy-MM-dd') <
            $filter('date')(nowDate, 'yyyy-MM-dd')) {
            dateValidCheckFlag = false;
            timePosition = convertStringToMoment($filter('date')(nowDate, 'yyyy-MM-dd') + 
                          ' 00:00:00');
            setTimebarPosition(timePosition.format());
          }
          if ($filter('date')(props.time, 'yyyy-MM-dd') >
            $filter('date')(nowDate, 'yyyy-MM-dd')) {
            dateValidCheckFlag = false;
            timePosition = convertStringToMoment($filter('date')(nowDate, 'yyyy-MM-dd') + 
                          ' 23:59:59');
            setTimebarPosition(timePosition.format());
          }

          if (dateValidCheckFlag === true &&
            itemSet.getSelectedItem(selectTime, direction) === null && 
            playData.getStatus() !== PLAY_CMD.PLAY) {
            
            setTimebarPosition(selectTimeString);
          } else {
            findNearItem(selectTime);
          }

          if (playData.getStatus() === PLAY_CMD.PLAY) {
            $rootScope.$emit('seek');
          }

          var selectedItem = getSelectedItemInfo();
          var deviceType = playData.getDeviceType();
          if (selectedItem !== null && deviceType === 'NWC') {
            $rootScope.$emit("scripts/services/playbackClass/timelineService::backupTimeRange",
              selectedItem);
          }
        };

        /*
         * check current time is valid or not
         * @function : checkCurrentTimeIsValid
         */
        this.checkCurrentTimeIsValid = function() {
          if (timeline === null) {
            return false;
          }
          var currentTime = convertStringToDate(getPosition());
          var selectedItem = itemSet.getSelectedItem(currentTime, direction);
          if (selectedItem === null) {
            var nearItem = itemSet.getNextNearItem(currentTime);
            if (nearItem === null) {
              return false;
            }
            setPlayRange(nearItem, false, currentTime);
            if (playData.getDeviceType() === 'NWC') {
              $rootScope.$emit("scripts/services/playbackClass/timelineService::backupTimeRange",
                nearItem);
            }
            itemFocusing(nearItem.start);
            return true;
          } else {
            return true;
          }
        };

        /*
         * move timeline view
         * @function : moveWindow
         */
        var moveWindow = function(timeValue) {
          var ratio = 0;
          if (direction > 0) {
            ratio = 1 / 4;
          } else {
            ratio = 3 / 4;
          }
          var length = currentWindowEnd.valueOf() - currentWindowStart.valueOf();
          var startWindow = moment(timeValue.valueOf() - (length * ratio));
          var endWindow = moment(timeValue.valueOf() + (length * (1 - ratio)));
          if (startWindow.valueOf() <= timeline.options.start.valueOf()) {
            startWindow = timeline.options.start;
          }
          if (endWindow.valueOf() >= timeline.options.end.valueOf()) {
            endWindow = timeline.options.end;
          }
          changeTimelineView(startWindow, endWindow);
        };

        var itemFocusing = function(timeValue) {
          if (timeValue.valueOf() > currentWindowEnd.valueOf() || 
              timeValue.valueOf() < currentWindowStart.valueOf()) {
            moveWindow(timeValue);
          }
        };

        /*
         * jump to next/prev item.
         * @name : jumpEvent
         * @param : newVal is PLAY_CMD.PREV or PLAY_CMD.NEXT ( refer to playback_type.js )
         */
        this.jumpEvent = function(newVal) {
          stopCallback = true; //stop updating timestamp 
          var currentTime = convertStringToDate(getPosition());
          var selectedItem = itemSet.getSelectedItem(currentTime, direction);
          var currentIndex = -1;
          if (selectedItem === null) {
            if (newVal === PLAY_CMD.PREV) {
              return; // not occur anything if no item selected
            } else {
              selectedItem = itemSet.getNextNearItem(currentTime);
              if (selectedItem === null) {
                return;
              }
              currentIndex = selectedItem.id;
            }
          } else {
            currentIndex = selectedItem.id;
            if (newVal === PLAY_CMD.PREV) {
              --currentIndex;
            } else if (newVal === PLAY_CMD.NEXT) {
              currentIndex++;
            }
          }

          var item = itemSet.getIndexingItem(currentIndex);
          if (item === null) {
            var message = 'This is' + (newVal === PLAY_CMD.PREV ? ' first' : ' last') + ' event';
            ModalManagerService.open(
              'message', {
                'message': message,
                'buttonCount': 0,
              }
            );
            return false;
          }
          // setPlayRange( item, false , item.start);
          setTimebarPosition(convertMomentToString(item.start), item.endObj);
          setTimeRange(item.startObj, item.endObj);
          itemFocusing(item.start);
          stopCallback = false; // re-start updating timestamp
          return true;
        };

        /*
         * re-start selected Item
         * @name : goInit
         */
        this.goInit = function() {
          stopCallback = true; //stop updating timestamp 
          var currentTime = convertStringToMoment(getPosition());
          var selectedItem = itemSet.getSelectedItem(convertMomentToDate(currentTime), direction);
          if (selectedItem === null) {
            return;
          }
          setTimebarPosition(convertDateToString(selectedItem.startObj), selectedItem.end);
          setTimeRange(selectedItem.startObj, selectedItem.endObj);
          itemFocusing(selectedItem.start);
          stopCallback = false; // re-start updating timestamp
        };

        this.clearTimeline = function() {
          if (timeline === null) {
            return;
          }
          itemSet.clearData();
          timeline.setItems([]);

          this.changeTimelineView(
            timeline.options.start,
            timeline.options.end
          );

          setTimebarPosition(timeline.options.start.format());
          var deviceType = playData.getDeviceType();
          if (deviceType !== 'NWC') {
            searchData.setEventTypeList(null);
            searchData.setOverlapId(0);
          }
        };

        this.stopCallback = function(value) {
          if (value === true) {
            timestamp = 0;
          }
          stopCallback = value;
        };

        this.setTimebar = function(hours, minutes, seconds) {
          if (playData.getStatus() === PLAY_CMD.PLAY) {
            return false;
          }
          var currentTime = convertStringToMoment(getPosition());
          currentTime.hour(hours);
          currentTime.minute(minutes);
          currentTime.second(seconds);
          setTimebarPosition(currentTime.format());
          return true;
        };

        var getCurrentPositioForStep = function() {
          var current = convertStringToMoment(getPosition());
          return current.format('YYYYMMDDHHmmss');
        };

        var getPosition = function() {
          var timePosition = new Date(timeline.getCustomTime('t1')); //date
          timePosition = convertUTCDateToLocalDate(timePosition);
          return convertDateToString(timePosition);
        };

        var setInitialPosition = function(start, end) {
          setTimebarPosition(start.format(), convertMomentToDate(end));
        };
        /*
         * add received item in timeline
         * App, need to change window view 1 hour
         * @name : displayTimeline
         * @param : newVal is array type.
         */
        this.displayTimeline = function(timerange) {
          if (timeline === null) {
            return;
          }
          timeline.setItems([]);
          var itemList = itemSet.getFullItemSet();
          timeline.setItems(itemList);
          if (typeof itemList !== "undefined" && itemList.length > 0) {
            firstItemPosition = itemList[0].startObj;
            lastItemPosition = itemList[itemList.length - 1].endObj;
            if (isPhone) {
              var startWindow = null, endWindow = null;
              if (timerange === null) {
                endWindow = itemList[itemList.length - 1].endObj;
                startWindow = new Date(endWindow.getTime() - (HOUR_TO_MIN * MIN_TO_SEC*SEC_TO_MS));
                if (startWindow.getDate() !== endWindow.getDate()) {
                  startWindow = new Date(endWindow.getFullYear(), endWindow.getMonth(), 
                                        endWindow.getDate(), 0, 0, 0);
                }
              } else {
                endWindow = timerange.end;
                startWindow = timerange.start;
              }
              this.changeTimelineView(startWindow, endWindow);
              setInitialPosition(startWindow, endWindow);
            } else {
              setInitialPosition(currentWindowStart, currentWindowEnd);
            }
          } else {
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
          if (timeline === null) {
            return;
          }
          //revert playback
          direction = speed;
          playData.setPlaySpeed(speed);
          var selectIds = timeline.getSelection();
          if (selectIds.length === 0) {
            return;
          }
          var selectedItem = itemSet.getIndexingItem(selectIds[0]);
          var currentPoint = getPosition(); //string type
          var endPoint = null;

          var playbackType = searchData.getPlaybackType();
          if (speed < 0) {
            if (playbackType === 'eventSearch') {
              endPoint = selectedItem.startObj;
            } else {
              endPoint = firstItemPosition;
            }
          } else {
            if (playbackType === 'eventSearch') {
              endPoint = selectedItem.endObj;
            } else {
              endPoint = lastItemPosition;
            }
          }
          setTimeRange(convertStringToDate(currentPoint), endPoint);
        };

        this.selectOneEvent = function(eventList, item) {
          var len = eventList.length;
          for (len; len > 0; len--) {
            var tmpItem = eventList[len - 1];
            if (item.id !== tmpItem.id) {
              tmpItem.selected = false;
            } else {
              tmpItem.selected = true;
            }
          }
          var target = null;
          if (item.dupId !== -1) {
            var itemList = itemSet.getDuplicatedItems(item.dupId);
            for (var i = 0; i < itemList.length; i++) {
              if (itemList[i].id === item.id) {
                target = itemList[i];
                break;
              }
            }
          } else {
            target = item;
          }
          searchData.setOverlapId(target.group);
          setTimeRange(target.startObj,
            searchData.getPlaybackType() === 'eventSearch' ? target.endObj : null);
          if (playData.getStatus() === PLAY_CMD.PLAY) {
            $rootScope.$emit('seek');
          }
        };

        this.redraw = function() {
          if (timeline === null) {
            return;
          }
          timeline.redraw();
        };

        this.resetTimeRange = function() {
          var endTime = endTarget;
          if (endTime !== null && endTime !== -1) {
            endTime = convertStringToDate(endTime);
            if (endTarget.substring(HOUR_START_POINT, HOUR_START_POINT+TIME_LENGTH) !== 
                endTime.getHours()) {
              endTime.checkDst(true);
            }
          }
          setTimeRange(convertStringToDate(getPosition()),
            searchData.getPlaybackType() === 'eventSearch' ? endTime : null);
        };
      };
      return TimelineService;
    },
  ]);