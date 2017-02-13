kindFramework
  .factory('PlaybackService', ['$q','BasePlaybackService','SunapiClient', '$filter',
    function($q, BasePlaybackService, SunapiClient, $filter){
  "use strict";

    var playbackService = new BasePlaybackService();

    var pad = function(x){
      x *= 1;
      return ( x<10? "0"+x : x );
    };

    var updateEventStatus = function(info, index) {
          
      var updateDate ={
        FromDate : $filter('date')(info.date, 'yyyy-MM-dd') +" 00:00:00",
        ToDate : $filter('date')(info.date, 'yyyy-MM-dd')+" 23:59:59",
        Type : 'All',
        OverlappedID : info.overlappedId[index],
        ChannelIDList : info.channel
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


    playbackService.eventSearch = function(info) {
      var self = this;
      var def = $q.defer();
      var updateDate = {
        FromDate : info.fromTime,
        ToDate : info.toTime,
        Type : info.eventSelect,
        OverlappedID : info.overlappedId,
        ChannelIDList : info.channel
      };
      /*
       * for multiple event list (web case), request All event results & filtering in client side.
       */
      if( typeof(info.eventSelect) === 'undefined' || info.eventSelect === null || 
        info.eventSelect.length > 1) {
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
        if( typeof(info.eventSelect) !== 'undefined' && info.eventSelect !== null && info.eventSelect.length > 1 ) {
          resultData = resultData.filter(function(value){
            for( var i=0 ; i< info.eventSelect.length; i++) {
              if( value.Type === info.eventSelect[i]) {
                return true;
              }
            }
            return false;
          });
        }
        var dateArray = info.fromTime.split('-');
        var recordJson = self.generateTimelineItem(resultData, info.overlappedId, 
                                                  dateArray[0], dateArray[1], dateArray[2].substring(0,2));
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

    playbackService.findRecordingDate = function(info){
      var today = new Date();
      if( typeof(info.year) === 'undefined' ||  info.year === null ){
        info.year = today.getFullYear();
      }
      if( typeof(info.month) === 'undefined' || info.month === null ){
        info.month = pad(today.getMonth()+1);
      }
      
      var findResult=[];
      
      var def = $q.defer();

      var updateDate = {
        Month : info.year +"-"+info.month, 
        ChannelIDList : info.channel
      };

      SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=calendarsearch&action=view', updateDate,
        function (response) {
          if( response.data.CalenderSearchResults === null ) return;
          var results = response.data.CalenderSearchResults[0].Result;
          var index = -1;
          while((index = results.indexOf('1',index+1))!== -1 ){
            findResult.push({
              year : info.year,
              month : info.month,
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
        Type : query.type,
        ChannelIDList : query.channel
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

    playbackService.getOverlappedId = function(info){
      var updateDate = {
        FromDate : info.year+"-"+info.month+"-"+pad(info.day)+" 00:00:00",
        ToDate : info.year+"-"+info.month+"-"+pad(info.day)+" 23:59:59",
        // TODO : mijoo462.park : overlapped no param for channel
        //ChannelIDList : info.channel
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

    playbackService.checkRecordStatus = function(channelId) {
      //TODO : mijoo462.park
      // system.cgi > storageinfo : there is no param for channelId. Please check!
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

    playbackService.getCurrentEventStatus = function(info,eventList) {
       var def = $q.defer();
        updateEventStatus(info, 0)
        .then(function(results) {
          if( info.overlappedId.length === 1 ) {
            var resultEventList = checkEventListEnable(results, eventList);
            def.resolve(resultEventList);
            return def.promise;
          }
          updateEventStatus(info, 1)
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