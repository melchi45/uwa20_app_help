kindFramework.factory(
  'SearchDataModel',
  function() {
    "use strict";
    var SearchDataModel = function() {
      if (SearchDataModel._instance) {
        return SearchDataModel._instance;
      }
      SearchDataModel._instance = this;

      var selectedEventList = null;
      var playbackType = null;

      var defaultSelectedDate = new Date();
      var defaultPlusMinutes = 60;
      var defaultSelectedStartedTime = ["00", "00", "00"];
      var defaultSelectedEndedTime = ["23", "59", "59"];
      var defaultPlusTime = defaultPlusMinutes;
      var defaultOverlapId = 0;
      var defaultChannelIdList = [];
      var defaultChannelNumList = [];

      var overlapId = defaultOverlapId;
      var selectedDate = new Date(defaultSelectedDate.valueOf());
      var selectedStartedTime = defaultSelectedStartedTime;
      var selectedEndedTime = defaultSelectedEndedTime;
      var webIconStatus = false;
      /**
       * For playback pages with multiple channels. 
       * For NVR Multiplayback only.
       * List of channel indexes for multiplayback.
       * Channel Indexes in this list are indexes based on channels showing on playback page.
       * (Not channel indexes used in data base)
       */
      var channelIdList = defaultChannelIdList;
      /**
       * For playback pages with multiple channels.
       * For NVR Multiplayback only.
       * List of channel num of the same NVR  
       * (Not channel indexes based in channels showing on playback page)
       */
      var channelNumList = defaultChannelNumList;


      /**
       * get currently selected overlap ID
       * @name : getOverlapId
       * @return: saved overlapId
       */
      this.getOverlapId = function() {
        return overlapId;
      };

      /**
       * save currently selected overlap ID
       * ( you can select overlap ID through modalInstnceOverlapEventCtrl.js)
       * @name : setOverlapId
       * @param: index is number.
       */
      this.setOverlapId = function(index) {
        if (typeof(index) === 'undefined') {
          return;
        }
        overlapId = index;
      };

      /**
       * get selected event list
       * @name : getEventTypeList
       * @return: saved eventList
       */
      this.getEventTypeList = function() {
        return selectedEventList;
      };

      /**
       * save selected event list
       * ( you can select event type through modalInstnceOverlapEventCtrl.js)
       * @name : setEventTypeList
       * @param: eventList is Array
       */
      this.setEventTypeList = function(eventList) {
        selectedEventList = eventList;
      };

      this.setSelectedDate = function(inputValue) {
        selectedDate = inputValue;
      };

      this.setSelectedStartedTime = function(inputValue) {
        selectedStartedTime = inputValue;
      };

      this.setSelectedEndedTime = function(inputValue) {
        selectedEndedTime = inputValue;
      };

      this.setRefreshHoldValues = function() {
        selectedDate = new Date(defaultSelectedDate.valueOf());
        selectedStartedTime = defaultSelectedStartedTime;
        selectedEndedTime = defaultSelectedEndedTime;
        overlapId = defaultOverlapId;
        channelIdList = defaultChannelIdList;
        channelNumList = defaultChannelNumList;
      };

      this.getDefaultPlusTime = function() {
        return defaultPlusTime;
      };

      this.getSelectedDate = function() {
        return selectedDate;
      };

      this.getSelectedStartedTime = function() {
        return selectedStartedTime;
      };

      this.getSelectedEndedTime = function() {
        return selectedEndedTime;
      };
      /**
       * just to know currently sesarch status
       * @name : setPlaybackType
       * @param : type must be 'timeSearch' or 'eventSearch'
       * 
       */
      this.setPlaybackType = function(type) {
        if (type === 'timeSearch' || type === 'eventSearch') {
          playbackType = type;
        }
      };

      this.getPlaybackType = function() {
        return playbackType;
      };

      this.setChannelIdList = function(idList) {
        channelIdList = idList;
      };

      this.getChannelIdList = function() {
        return channelIdList;
      };

      this.setChannelNumList = function(chNumList) {
        channelNumList = chNumList;
      };

      this.getChannelNumList = function() {
        return channelNumList;
      };

      /**
       * make to web icon enable/disable ( Plugin don't use web icon when main-playback view) 
       * @name : setWebIconStatus
       * @param : value must be type of boolean
       * 
       */
      this.setWebIconStatus = function(value) {
        webIconStatus = value;
      };

      this.getWebIconStatus = function() {
        return webIconStatus;
      };

      this.setDefaultDate = function(date) {
        defaultSelectedDate = date;
        selectedDate = new Date(defaultSelectedDate.valueOf());
      };
    };
    return SearchDataModel;
  }
);