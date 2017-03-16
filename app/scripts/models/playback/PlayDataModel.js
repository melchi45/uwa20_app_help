kindFramework.factory(
	'PlayDataModel',['$rootScope','$filter','PLAYBACK_TYPE','SearchDataModel',
	function($rootScope, $filter, PLAYBACK_TYPE, SearchDataModel){
    "use strict";
		var PlayDataModel = function() {
			if( PlayDataModel._instance) {
				return PlayDataModel._instance;
			}
			PlayDataModel._instance = this;

			var PLAY_CMD = PLAYBACK_TYPE.playCommand;
			var searchData = new SearchDataModel();

			var playbackStatus = null;
			var currentMenu = 'main';
			var getPositionFunc = null;
      var deviceType = 'NWC';
			var selectTime = null;
			var endTime = null;
			var startTime = null;
			var timeCallback = null;
			var timeBarPostionCallback = null;
      var isMultiPlayback = false;

			var displayTimeline = true;
      var defaultPlaySpeed = 1;
			var playSpeed = defaultPlaySpeed;
      var backupTime = null;
      var enableTimezone = false;
      var needToImmediate = false;
      var timelineMode = false;
      var enablePlayback = false;

      this.getPlaySpeed = function() {
        return playSpeed;
      };

      this.setPlaySpeed = function(_playSpeed) {
        if( playSpeed !== _playSpeed ) {
          playSpeed = _playSpeed;
          $rootScope.$emit('app/scripts/models/playback/PlayDataModel.js::changeSpeed', playSpeed);          
        }
      };

      this.setDefautPlaySpeed = function() {
        this.setPlaySpeed(defaultPlaySpeed);
      };
      
      /**
      * save playback status 
      * @name : setStatus
      * @param : cmd is one of PLAYBACK_TYPE (refer to playback_type.js)
      *        : (ex. playCommand.PLAY, playCommand.PAUSE ...)
      */
      this.setStatus = function( cmd ){
      	if( playbackStatus === cmd ) return;
        playbackStatus = cmd;

        if( cmd === PLAY_CMD.STOP || cmd === PLAY_CMD.PAUSE || cmd === PLAY_CMD.LIVE) {
          $rootScope.$emit('app/scripts/models/playback/PlayDataModel::changeButtonStatus', 'stop');
        }
        else if( cmd === PLAY_CMD.PLAY || cmd === PLAY_CMD.SEEK) {
          $rootScope.$emit('app/scripts/models/playback/PlayDataModel::changeButtonStatus', 'play');
        }
        if( cmd === PLAY_CMD.STOP ) {
          $rootScope.$emit('app/scripts/models/playback/PlayDataModel::stop');
        }
      };

      this.getStatus = function() {
      	return playbackStatus;
      };
      /**
      * just to know currently status ( main-playback of detail view)
      * @name : setCurrentMenu 
      * @param : val must be 'main' or 'full'
      * 
      */
      this.setCurrentMenu = function(val){
        if( val === 'main' || val === 'full'){
          currentMenu = val;
        }
      };

      this.getCurrentMenu = function() {
      	return currentMenu;
      };

      this.setDeviceType = function(_deviceType) {
        deviceType = _deviceType;
      };

      this.getDeviceType = function() {
        return deviceType;
      };

      this.setEnableTimezone = function(value) {
        enableTimezone = value;
      };

      this.IsEnableTimezone = function() {
        return enableTimezone;
      };

      this.getSelectTime = function() {
      	return selectTime;
      };

      this.getStartTime = function() {
      	return startTime;
      };

      this.getEndTime = function() {
      	return endTime;
      };

      this.setTimeRange = function( start, end, startTimeString, endTimeString) {
      	startTime = start;
      	selectTime = startTimeString;
        if( end !== null && typeof(end) !== 'undefined') {
      		endTime = end;
      	} else {
          endTime = null;
        }
        if( searchData.getPlaybackType() === 'eventSearch' &&
              endTime !== null && endTime !== undefined ) {            
            selectTime += "-"+ endTimeString;
        }
      };

      this.setTimeString = function(timeString){
        selectTime = timeString;
      };
   
      this.setTimeCallback = function(callbackFnc){
        timeCallback = callbackFnc;
      };

      this.getTimeCallback = function() {
      	return timeCallback;
      };

      this.setTimeBarPositionCallback = function(callbackFnc){
        timeBarPostionCallback = callbackFnc;
      };

      this.getTimeBarPositionCallback = function(){
        return timeBarPostionCallback;
      };

      this.setCurrentPositionFunc = function(func){
        getPositionFunc = func;
      };

      this.getCurrentPositionWithoutFilter = function(){
        var positionDate = getPositionFunc();
        return positionDate;
      };

      this.getCurrentPosition = function(){
        var positionDate = getPositionFunc();
        return positionDate;
      };

      this.setTimelineEnable = function(value) {
        displayTimeline = value;
      };

      this.getTimelineEnable = function() {
        return displayTimeline;
      };

      this.setIsMultiPlayback = function(_isMultiPlayback) {
        isMultiPlayback = _isMultiPlayback;
      };

      this.getIsMultiPlayback = function() {
        return isMultiPlayback;
      };

      this.setPlaybackBackupTime = function(day, startTime, endTime) {
        var targetDate = $filter('date')(day, 'yyyyMMdd');
        backupTime =targetDate+startTime + "-" +
                    targetDate + endTime;
      };

      this.getPlaybackBackupTIme = function() {
        return backupTime;
      };

      this.getNeedToImmediate = function() {
        return needToImmediate;
      };

      this.setNeedToImmediate = function(value) {
        needToImmediate = value;
      };

      this.getTimelineMode = function() {
        return timelineMode;
      };

      this.setTimelineMode = function(mode) {
        timelineMode = mode;
      };

      /**
       * only in case of 'enablePlayback' is true, playback streaming works
       * @function : setPlaybackEnable
       * @param : mode is type of boolean
       */
      this.setPlaybackEnable = function(mode) {
        enablePlayback = mode;
      };
      /**
       * get current status of page ( playback or not )
       * @function : setPlaybackEnable
       * @return : boolean value
       */
      this.isPlaybackEnable = function() {
        return enablePlayback;
      };
    };
		return PlayDataModel;
}]);