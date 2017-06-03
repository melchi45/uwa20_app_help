kindFramework
  .factory('BasePlaybackService', ['$q', 'SunapiClient',
    function($q, SunapiClient) {
      "use strict";

      return function() {


        var convertToDateObject = function(UTCString) {
          var targetDate = new Date(UTCString);
          targetDate.setTime(targetDate.getTime() + targetDate.getTimezoneOffset() * 60 * 1000);
          return targetDate;
        };

        var getUTCTimeObj = function(dateString) {
          return moment.parseZone(dateString + '+00:00');
        };

        var checkValidDate = function(dateObj, targetString) {
          if (dateObj.StartTime.substring(0, 10) === targetString &&
            dateObj.EndTime.substring(0, 10) === targetString) {
            return true;
          }
          return false;
        }

        this.generateTimelineItem = function(value, groupIndex, year, month, day) {
          var results = value;
          var recordJson = [];
          var item = {};
          var isWaitingNextItem = false;
          for (var i = 0; i < results.length; i++) {
            if (results[i].StartTime === results[i].EndTime ||
              checkValidDate(results[i], year + "-" + month + "-" + day) === false) continue;
            if (isWaitingNextItem !== true) {
              item.id = Math.random().toString(36).substr(2, 9) + "" + i;
              var startTime = getUTCTimeObj(results[i].StartTime);
              item.start = startTime;
              item.startObj = convertToDateObject(startTime);
              item.eventType = results[i].Type;
              if (results[i].Type === 'Normal') {
                item.className = 'vis-item-normal';
              }
              item.group = groupIndex;
              item.dupId = -1;
            }
            var endTime = getUTCTimeObj(results[i].EndTime);
            if (i + 1 < results.length &&
              convertToDateObject(getUTCTimeObj(results[i + 1].StartTime)).getTime() - convertToDateObject(endTime).getTime() <= 1000 &&
              results[i + 1].Type === results[i].Type &&
              results[i + 1].StartTime !== results[i + 1].EndTime) {

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
          return recordJson;
        };
      }
    }
  ]);