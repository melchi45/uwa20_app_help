kindFramework.
  factory('BasePlaybackService', ['$q', 'SunapiClient',
    function($q, SunapiClient) {
      "use strict";

      return function() {
        var SEC_TO_MS = 1000;
        var MIN_TO_SEC = 60;
        var DATE_OFFSET = 10;
        var BASE36 = 36;
        var NUM_START_POINT = 2, NUM_LENGTH = 7;
        var convertToDateObject = function(UTCString) {
          var targetDate = new Date(UTCString);
          targetDate.setTime(targetDate.getTime() + 
                            (targetDate.getTimezoneOffset() * MIN_TO_SEC * SEC_TO_MS));
          return targetDate;
        };

        var getUTCTimeObj = function(dateString) {
          return moment.parseZone(dateString + '+00:00');
        };

        var checkValidDate = function(dateObj, targetString) {
          if (dateObj.StartTime.substring(0, DATE_OFFSET) === targetString &&
            dateObj.EndTime.substring(0, DATE_OFFSET) === targetString) {
            return true;
          }
          return false;
        }

        this.generateTimelineItem = function(value, groupIndex, year, month, day) {
          var results = value;
          var recordJson = [];
          var item = {};
          var isWaitingNextItem = false;
          for (var idx = 0; idx < results.length; idx++) {
            if (results[idx].StartTime !== results[idx].EndTime &&
              checkValidDate(results[idx], year + "-" + month + "-" + day) === true) {

              if (isWaitingNextItem !== true) {
                item.id = Math.random().toString(BASE36).substr(
                            NUM_START_POINT, NUM_START_POINT+NUM_LENGTH) + "" + idx;
                var startTime = getUTCTimeObj(results[idx].StartTime);
                item.start = startTime;
                item.startObj = convertToDateObject(startTime);
                item.eventType = results[idx].Type;
                if (results[idx].Type === 'Normal') {
                  item.className = 'vis-item-normal';
                }
                item.group = groupIndex;
                item.dupId = -1;
              }
              var endTime = getUTCTimeObj(results[idx].EndTime);
              if (idx + 1 < results.length &&
                convertToDateObject(getUTCTimeObj(results[idx + 1].StartTime)).getTime() - 
                        convertToDateObject(endTime).getTime() <= SEC_TO_MS &&
                results[idx + 1].Type === results[idx].Type &&
                results[idx + 1].StartTime !== results[idx + 1].EndTime) {

                isWaitingNextItem = true;
                continue;
              } else if (isWaitingNextItem === true) {
                isWaitingNextItem = false;
              }
              item.end = endTime;
              item.endObj = convertToDateObject(endTime);
              item.length = item.endObj.getTime() - item.startObj.getTime();
              recordJson.push(item);
              item = {};
            }
          }
          return recordJson;
        };
      }
    },
  ]);