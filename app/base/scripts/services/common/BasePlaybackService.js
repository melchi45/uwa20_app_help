kindFramework
  .factory('BasePlaybackService', ['$q', 'SunapiClient',
    function($q, SunapiClient){
  "use strict";

  return function(){


    var convertToDateObject = function(dateString){
      var year = dateString.substring(0,4)*1;
      var month = dateString.substring(5,7)*1 - 1;
      var day = dateString.substring(8,10)*1;
      var hour = dateString.substring(11, 13)*1;
      var minute = dateString.substring(14, 16)*1;
      var sec = dateString.substring(17,19)*1;
      return new Date(year,month,day,hour,minute,sec);
    };

    var checkValidDate = function(dateObj, targetString) {
      if( dateObj.StartTime.substring(0,10) === targetString && 
        dateObj.EndTime.substring(0,10) === targetString) {
        return true;
      }
      return false;
    }

    this.generateTimelineItem = function(value, groupIndex, year, month, day){
      var results = value;
      var recordJson = [];
      var item={};
      var isWaitingNextItem = false;
      for( var i=0 ; i<results.length ; i++){
        if( results[i].StartTime === results[i].EndTime || 
          checkValidDate(results[i],year+"-"+month+"-"+day) ===false) continue;
        if( isWaitingNextItem !== true ){
          item.id=Math.random().toString(36).substr(2,9)+""+i;
          var startTime = convertToDateObject(results[i].StartTime); 
          item.start = startTime;
          item.eventType = results[i].Type;
          if( results[i].Type === 'Normal' ){
            item.className = 'vis-item-normal';
          }
          item.group = groupIndex;
          item.dupId = -1;
        }
        var endTime = convertToDateObject(results[i].EndTime);
        if( i+1 < results.length && convertToDateObject(results[i+1].StartTime)-endTime <= 1000  && results[i+1].Type === results[i].Type && 
            results[i+1].StartTime !== results[i+1].EndTime){
          isWaitingNextItem = true;
          continue;
        }
        else if( isWaitingNextItem === true ){
          isWaitingNextItem = false;
        }
        //convertToUTCTime(endTime); //echo
        item.end = endTime;
        item.length = endTime.getTime() - startTime.getTime();
        recordJson.push(item);
        item={};
      }
      return recordJson;
    };
  }
}]);