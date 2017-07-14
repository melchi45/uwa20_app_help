/**
 * This service is for controlling timeline item set
 */
kindFramework.
  factory('ItemSetModel', ['$filter', '$rootScope',
    function($filter, $rootScope) {
      "use strict";
      var ItemSetModel = function() {
        if (ItemSetModel._instance) {
          return ItemSetModel._instance;
        }
        var idx = 0;
        ItemSetModel._instance = this;
        var DUPLICATE_CLASS_NAME = 'vis-duplicate-view';
        var TIMELINE_DATA_INTERVAL = 10;
        var DAY_TO_HOUR = 24, HOUR_TO_MINUTE = 60, MINUTE_TO_SEC = 60, SEC_TO_MS = 1000;
        var HALF = 2;
        /*
         * itemSet.timelineData : to be shown in timeline (normal,event, duplicated event)
         * itemSet.dupEventData : not to be shown in timeline (contents for duplicated event)
         */
        var itemSet = {
          'timelineData': null,
          'dupEventData': null,
        };

        /*
         * timeInfo for checking whether check specific time range (every 10 sec)
         */
        var timeInfo = null;

        var markingArray = function(_start, _end) {
          if (_start === 0 || _end === 0) {
            return;
          }
          var startIndex = _start / TIMELINE_DATA_INTERVAL;
          var endIndex = _end / TIMELINE_DATA_INTERVAL;
          if (startIndex !== null && endIndex !== null) {
            for (var i = startIndex; i <= endIndex; i++) {
              timeInfo[i] = 1;
            }
          }
        };

        var getTimeInfo = function(start, end) {
          return timeInfo.slice(start, end + 1);
        };

        var makeTimelineItem = function(inputArray) {
          var list = $filter('orderBy')(inputArray, 'length', true);
          var WARNING_COUNT = 500; //if exceed WARNING_COUNT, then, roughly check timelien's item.
          var newArray = [];
          for (var i = 0; i < list.length; i++) {
            if (i < WARNING_COUNT) {
              newArray.push(list[i]);
              markingArray(list[i].startObj.getTime() / SEC_TO_MS, 
                          list[i].endObj.getTime() / SEC_TO_MS);
            } else {
              var timeInfoList = getTimeInfo(list[i].startObj, list[i].endObj);
              var isEmptyItem = true;
              for (var index = 0; index < timeInfoList.length; index++) {
                if (timeInfoList[index] === 1) {
                  isEmptyItem = false;
                }
              }
              if (isEmptyItem) {
                newArray.push(list[i]);
                markingArray(list[i].startObj.getTime() / SEC_TO_MS, 
                            list[i].endObj.getTime() / SEC_TO_MS);
              }
            }
          }
          console.log('newArray length' + newArray.length);
          return newArray;
        };
        /**
         * update itemSet.
         * @name: addData
         * @param: newArray - item Array.
         */
        this.addData = function(newArray, _showSequence) {
          var showSequence = _showSequence;
          if (typeof showSequence === "undefined") {
            showSequence = false;
          }
          itemSet.timelineData = [];
          itemSet.dupEventData = [];
          if (timeInfo !== null) {
            timeInfo = null;
          }
          timeInfo = new Array(
                        DAY_TO_HOUR * HOUR_TO_MINUTE * MINUTE_TO_SEC / TIMELINE_DATA_INTERVAL);
          // Array.protoype.fill() not supported by IE
          
          for ( idx = 0; idx < timeInfo.length; idx++) {
            timeInfo[idx] = 0;
          }
          var itemList = $filter('orderBy')(newArray, 'start');
          checkDuplicateEvent(itemList);
          var timelineItems = makeTimelineItem(itemList);
          var items = $filter('orderBy')(timelineItems, 'start');
          for (idx = 0; idx < items.length; idx++) {
            if (items[idx].dupId !== -1 && typeof(items[idx].className) === 'undefined') {
              itemSet.dupEventData.push(items[idx]);
            } else {
              items[idx].id = itemSet.timelineData.length;
              itemSet.timelineData.push(items[idx]);
            }
          }
          if (showSequence === true && itemSet.dupEventData.length !== 0) {
            for (idx = 0; idx < itemSet.timelineData.length; idx++) {
              if (idx + 1 < itemSet.timelineData.length &&
                itemSet.timelineData[idx + 1].startObj.getTime() - 
                itemSet.timelineData[idx].endObj.getTime() === SEC_TO_MS) {

                itemSet.timelineData[idx + 1].startObj = itemSet.timelineData[idx].endObj;
                itemSet.timelineData[idx + 1].start = itemSet.timelineData[idx].end;
              }
            }
          }
          $rootScope.$emit('updateItem', itemSet.timelineData.length);
        };

        /** 
         * return currently saved itemSet
         * @name: getFullItemSet
         * @return : itemSet Array
         */
        this.getFullItemSet = function() {
          return itemSet.timelineData;
        };
        
        /**
         * return last endTime item
         * @function getLastItem
         * @return last item data.
         */
        this.getLastItem = function() {
          var lastItem = $filter('orderBy')(itemSet.timelineData,'end',true)[0];
          return lastItem;
        };

        /**
         * return first startTime item
         * @function getFirstItem
         * @return first item data.
         */
        this.getFirstItem = function() {
          var firstItem = $filter('orderBy')(itemSet.timelineData,'start',false)[0];
          return firstItem;
        };

        /** 
         * return item using index param
         * @name : getItem
         * @param : index 
         * @return : if itemSet is null, return -1. else return selected item
         */
        this.getItem = function(index) {
          return itemSet.timelineData === null ? null : itemSet.timelineData[index];
        };

        /** 
         * delete item Set Array
         * @name : itemSet
         */
        this.clearData = function() {
          itemSet.timelineData = null;
          itemSet.dupEventData = null;
        };

        /**
         * return list which range between start,end
         * @name: getAllRangedData
         * @param: targetArray : array list
         *         start and end is Date format
         */
        var getAllRangedData = function(targetArray, start, end) {
          if (start >= end) {
            return null;
          }

          var min = 0,
            max = targetArray.length - 1;
          var startIndex = 0,
            endIndex = 0;
          var guess = 0;
          while (min <= max) {
            guess = Math.floor((max + min) / HALF);
            if (targetArray[guess].startObj > start) {
              if (guess === 0 || targetArray[guess - 1].endObj < start) {
                startIndex = guess;
                break;
              }
              max = guess - 1;
            } else {
              if (targetArray[guess].endObj > start) {
                if (guess !== 0 &&
                  targetArray[guess - 1].startObj.getTime() === 
                  targetArray[guess].startObj.getTime()) {
                  max = guess - 1;
                } else {
                  startIndex = guess;
                  break;
                }
              } else {
                min = guess + 1;
              }
            }
          }
          min = startIndex, max = targetArray.length - 1;
          if (min === -1 || min > max) {
            return null;
          }
          var newTargetArray = targetArray.slice(startIndex, targetArray.length);
          min = 0;
          max = (newTargetArray.length - 1);
          while (min <= max) {
            guess = Math.floor((max + min) / HALF);
            if (newTargetArray[guess].startObj >= end) {
              if (guess !== 0 &&
                newTargetArray[guess - 1].startObj < end) {
                endIndex = guess - 1;
                break;
              }
              max = guess - 1;
            } else {
              if (guess === newTargetArray.length - 1) {
                endIndex = guess;
                break;
              } else if (guess !== newTargetArray.length - 1 &&
                newTargetArray[guess + 1].startObj >= end) {
                endIndex = guess;
                break;
              }
              min = guess + 1;
            }
          }
          return newTargetArray.slice(0, endIndex + 1);
        };

        /*
         * find nearest item
         * @name: binarySearch
         * @param: time is Date format
         */
        var binarySearch = function(targetArray, time, direction) {
          if (targetArray === null || targetArray.length === 0) {
            return null;
          }
          var min = 0,
            max = targetArray.length - 1;
          var guess = -1;
          var checkTimePosition = function(inputStart, inputEnd) {
            var includeEnd =
              !(typeof(direction) === 'undefined' || direction === null || direction > 0);
            if (inputStart > time) {
              return 1;
            } else if (inputStart <= time && inputEnd > time) {
              return 0;
            } else if (inputEnd < time) {
              return -1;
            } else {
              if (includeEnd) {
                return 0;
              } else {
                return -1;
              }
            }
          };
          while (min <= max) {
            guess = Math.floor((max + min) / HALF);
            var results = checkTimePosition(targetArray[guess].startObj, targetArray[guess].endObj);
            if (results > 0) {
              max = guess - 1;
            } else if (results === 0) {
              break;
            } else if (results < 0) {
              min = guess + 1;
            }
          }
          if (guess < targetArray.length &&
            checkTimePosition(targetArray[guess].startObj, targetArray[guess].endObj) === 0) {
            return targetArray[guess];
          }
          return null;
        };

        /**
         * return item comparing with target time
         * @name : getSelectedItem
         * @param : time is Date format
         */
        this.getSelectedItem = function(time, direction) {
          if (itemSet === null || itemSet.timelineData === null) {
            return null;
          }
          return binarySearch(itemSet.timelineData, time, direction);
        };

        this.getIndexingItem = function(id) {
          if (id < 0 || id >= itemSet.timelineData.length) {
            return null;
          }
          return itemSet.timelineData[id];
        };

        /**
         * return item set matching with dupId
         * @name : getDuplicatedItems
         * @param : dupId is id
         */
        this.getDuplicatedItems = function(dupId) {
          if (itemSet.dupEventData === null) {
            return null;
          }
          var tempResults = itemSet.dupEventData.filter(function(item) {
            return (item.dupId === dupId);
          });
          return tempResults;
        };

        /**
         * return item which is near comparing with start 
         * this function must be called when there is no item at 'start' time
         * @name: getNextNearItem
         * @param: start is milliseconds
         */
        this.getNextNearItem = function(start) {
          if (itemSet.timelineData === null || itemSet.timelineData.length === 0) {
            return null;
          }
          var min = 0,
            max = itemSet.timelineData.length - 1;
          var guess = -1;
          while (min <= max) {
            guess = Math.floor((max + min) / HALF);
            if (itemSet.timelineData[guess].startObj >= start) {
              if (guess === 0 || itemSet.timelineData[guess - 1].endObj <= start) {
                break;
              }
              max = guess - 1;
            } else {
              min = guess + 1;
            }
          }
          if (guess < itemSet.timelineData.length && 
              itemSet.timelineData[guess].startObj >= start) {
            return itemSet.timelineData[guess];
          }
          return null;
        };

        /**
         * create new item for duplicated event
         * @name checkDuplicateEvent
         * @param : objectList is Array for checking
         * @return: result is applied to objectList
         */
        var checkDuplicateEvent = function(objectList) {
          var dupId = 0;
          if (objectList === null) {
            return null;
          }
          var targetList = objectList.filter(function(item) {
            return typeof(item.className) === 'undefined' || item.dupId === -1;
          });
          var checkNoDuplicate = function(item) {
            return item.dupId === -1;
          };
          for (var index = 0; index < targetList.length; index++) {
            var target = targetList[index];
            var newTargetList = targetList.filter(checkNoDuplicate);
            if (typeof(target.className) !== 'undefined' || target.dupId !== -1) {
              continue;
            }

            var timeInfo = {
              'start': target.start,
              'startObj': target.startObj,
              'end': target.end,
              'endObj': target.endObj,
            };

            var recalculated = true;
            var enableDup = false;
            var itemContainning = null;
            var checkNoClassName = function(item) {
              return (typeof(item.className) === 'undefined');
            };
            while (recalculated === true) {
              recalculated = false;
              enableDup = false;
              var rangeList = getAllRangedData(newTargetList, timeInfo.startObj, timeInfo.endObj);
              if (rangeList === null) {
                break;
              }
              itemContainning = rangeList.filter(checkNoClassName);
              if (itemContainning.length > 1) {
                enableDup = true;
              }
              /* 
               * calcularing duplicated event's range 
               *(set to minimum value for start, set to maximum value for end)
               */
              for (idx = 0; idx < itemContainning.length; idx++) {
                if (itemContainning[idx].startObj < timeInfo.startObj) {
                  timeInfo.startObj = itemContainning[idx].startObj;
                  timeInfo.start = itemContainning[idx].start;
                  recalculated = true;
                }
                if (itemContainning[idx].endObj > timeInfo.endObj) {
                  timeInfo.end = itemContainning[idx].end;
                  timeInfo.endObj = itemContainning[idx].endObj;
                  recalculated = true;
                }
              }
            }
            if (enableDup) {
              /*
               * add newly created item for duplicated event
               * set dupId to previous item for matching with 'dupItem'
               */
              var dupItem = {
                id: "dup" + dupId,
                start: timeInfo.start,
                startObj: timeInfo.startObj,
                end: timeInfo.end,
                endObj: timeInfo.endObj,
                className: DUPLICATE_CLASS_NAME,
                dupId: dupId,
                length: timeInfo.endObj.getTime() - timeInfo.startObj.getTime(),
              };
              objectList.push(dupItem);
              for (idx = 0; idx < itemContainning.length; idx++) {
                var targetItem = $filter('filter')(objectList, {
                  id: itemContainning[idx].id,
                });
                targetItem[0].dupId = dupId;
              }
              dupId++;
            }
          }
        };
      };
      return ItemSetModel;
    },
  ]);