kindFramework
  .factory('PlaybackService', ['$q','BasePlaybackService','SunapiClient', '$filter',
    function($q, BasePlaybackService, SunapiClient, $filter){
  "use strict";

    var playbackService = new BasePlaybackService();

    var pad = function(x){
      x *= 1;
      return ( x<10? "0"+x : x );
    };

    var updateEventStatus = function(date, id) {
          
      var updateDate ={
        FromDate : $filter('date')(date, 'yyyy-MM-dd') +" 00:00:00",
        ToDate : $filter('date')(date, 'yyyy-MM-dd')+" 23:59:59",
        Type : 'All',
        OverlappedID : id
      };
      var def = $q.defer();
      SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=timeline&action=view', updateDate,
        function (response) {
          var results = '';
          if( response.data.TimeLineSearchResults === undefined ) {
            results = "TotalCount=0";
          }
          else {
            results = $filter('orderBy')(response.data.TimeLineSearchResults[0].Results, 'StartTime');
          }
          var stringValue = JSON.stringify(results);
          def.resolve(stringValue);
        },
        function (errorData) {
          console.log(errorData);
          def.reject(errorData);
        },'',true);
      return def.promise;
    };

    var checkEventListEnable = function(result, eventList) {
      for(var i=0; i<eventList.length; i++) {
        if(result.indexOf(eventList[i].event) !== -1) {
          eventList[i].enable = true;
        } else {
          eventList[i].enable = false;
        }
      }
      return eventList;
    };


    playbackService.eventSearch = function(fromTime, toTime,overlappedID, eventSelect, deviceInfo) {
      var self = this;
      var def = $q.defer();
      var updateDate = {
        FromDate : fromTime,
        ToDate : toTime,
        Type : eventSelect,
        OverlappedID : overlappedID
      };
      /*
       * for multiple event list (web case), request All event results & filtering in client side.
       */
      if( typeof(eventSelect) === 'undefined' || eventSelect === null || 
        eventSelect.length > 1) {
        updateDate.Type = "All";
      }

      SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=timeline&action=view', updateDate,
      function (response) {
        if( response.data.TimeLineSearchResults === undefined || response.data.TimeLineSearchResults.length === 0 ) {
          if( response.data.Response === "Success") {
            def.resolve([]);
          }
          else {
            def.reject('error');
          }
          return def.promise;
        }
        var resultData = $filter('orderBy')(response.data.TimeLineSearchResults[0].Results, 'StartTime');
        if( typeof(eventSelect) !== 'undefined' && eventSelect !== null && eventSelect.length > 1 ) {
          resultData = resultData.filter(function(value){
            for( var i=0 ; i< eventSelect.length; i++) {
              if( value.Type === eventSelect[i]) {
                return true;
              }
            }
            return false;
          });
        }
        var dateArray = fromTime.split('-');
        var recordJson = self.generateTimelineItem(resultData, overlappedID, dateArray[0], dateArray[1], dateArray[2].substring(0,2));
        if( recordJson !== null ){
          def.resolve(recordJson);
        }
      },
      function (errorData) {
        def.reject(errorData);
        console.log(errorData);
      },'', true);
    
      return def.promise;
    };

    playbackService.getPlaybackClientInfo = function(cmd){
      var info ={
        channelId : 0,
        on : 'on',
        control : 'init',
        scale : 0
      };
      if( cmd === 'init'){
        return info;
      }
      return null;
    };

    playbackService.findRecordingDate = function(year,month){
      var today = new Date();
      if( typeof(year) === 'undefined' ||  year === null ){
        year = today.getFullYear();
      }
      if( typeof(month) === 'undefined' || month === null ){
        month = pad(today.getMonth()+1);
      }
      
      var findResult=[];
      
      var def = $q.defer();

      var updateDate = {
        Month : year +"-"+month, 
        ChannelIDList : 0
      };

      SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=calendarsearch&action=view', updateDate,
        function (response) {
          if( response.data.CalenderSearchResults === null ) return;
          var results = response.data.CalenderSearchResults[0].Result;
          var index = -1;
          while((index = results.indexOf('1',index+1))!== -1 ){
            findResult.push({
              year : year,
              month : month,
              day : pad(index+1)
            });
          }
          def.resolve(findResult);
        },
        function (errorData) {
          def.reject(errorData);
          console.log(errorData);
        },'',true);
     
        return def.promise;
    };

    playbackService.displayTimelineItem = function(query){
      var self = this;
      var updateDate = {
        FromDate : query.year+"-"+query.month+"-"+pad(query.day)+" 00:00:00",
        ToDate : query.year+"-"+query.month+"-"+pad(query.day)+" 23:59:59",
        OverlappedID : query.id,
        Type : query.type
      };
      var def = $q.defer();
      SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=timeline&action=view&OverlappedID=', 
        updateDate,
        function (response) {
          if( response.data.TimeLineSearchResults === undefined || response.data.TimeLineSearchResults.length === 0 ) {
            if( response.data.Response === "Success") {
              def.resolve([]);
            }
            else {
              def.reject('error');
            }
            return def.promise;
          }
          var resultData = $filter('orderBy')(response.data.TimeLineSearchResults[0].Results, 'StartTime');
          var recordJson = self.generateTimelineItem(resultData, query.id, query.year, query.month, 
                                                query.day);
          if( recordJson !== null ){
           def.resolve(recordJson);
          }
        },
        function (errorData) {
          def.reject(errorData);
          console.log(errorData);
        },'', true);

      return def.promise;
    };

    playbackService.getOverlappedId = function(year, month, day){
      var updateDate = {
        FromDate : year+"-"+month+"-"+pad(day)+" 00:00:00",
        ToDate : year+"-"+month+"-"+pad(day)+" 23:59:59"
      };
      
      var def = $q.defer();
      SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=overlapped&action=view', updateDate,
        function (response) {
          def.resolve(response.data);
        },
        function (errorData) {
          def.reject(errorData);
          console.log(errorData);
        },'', true);
      return def.promise;
    };

    playbackService.checkRecordStatus = function() {
      var def = $q.defer();
      SunapiClient.get('/stw-cgi/system.cgi?msubmenu=storageinfo&action=view', '',
        function (response)
        {
          var resultsObj = response.data;
          if( resultsObj === null || resultsObj.Storages === null ) {
            def.reject('sunapi response error');
          } else {
            var i=0;
            for( i=0 ; i< resultsObj.Storages.length ; i++ ) {
              if( resultsObj.Storages[i].Enable === true && 
                (resultsObj.Storages[i].Status !== '' && 
                  resultsObj.Storages[i].Status !== "Error" && 
                  resultsObj.Storages[i].Status !== "Formatting") ) {
                def.resolve('enable');
                break;
              }
            }
            if( i >= resultsObj.Storages.length ) {
              def.reject('no sd');
            }
          }
        },
        function (errorData)
        {
          def.reject(errorData);
          console.log(errorData);
        },'',true);
      return def.promise;
    };

    playbackService.getCurrentEventStatus = function(date, eventList, idList) {
       var def = $q.defer();
        updateEventStatus(date, idList[0])
        .then(function(results) {
          if( idList.length === 1 ) {
            var resultEventList = checkEventListEnable(results, eventList);
            def.resolve(resultEventList);
            return def.promise;
          }
          updateEventStatus(date, idList[1])
          .then(function(result) {
            var resultEventList = checkEventListEnable(results+result, eventList);
            def.resolve(resultEventList);
          }, function(error) {
            def.reject(error);
          });
        }, function(error) {
          def.reject(error);
        });
      return def.promise;
    };

    return playbackService;
}]);