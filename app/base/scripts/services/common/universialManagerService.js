kindFramework.service('UniversialManagerService',
	[ 'CAMERA_STATUS', 'LocalStorageService',
	function( CAMERA_STATUS, LocalStorageService ){
		'use strict';
		var self = this;
		var ProfileInfo;
		var SpeakerVol;
		var MicVol;
		var PlayMode;
		var ViewMode;
		var isLogin;
		var Orientation;
		var ProfileList;
		var isSpeakerOn;
		var isMicOn;
		var ZoomMode;
		var Ratio;
		var PlayStatus;
		var isAuthunicating;
		var layout;
		var filpMode;
		var isPTZ;
		var isAspectfit;
		var isRendered;
		var isDigitalPTZ;
		var rotate;
		var gotLiveStream;
		var isCaptured = false;
		var isCapturedScreen = false;
		var isAudioOutEnabled = false;
		var viewModeType = null;
		var streamingMode = null;
		var tagMode = null;
		var isPtzType = null;
		var alarmOutput = [false, false, false, false];
		var pluginElem = null;
		var isPixelCountOn = false;
		var channelId = 0;
		var defaultProfileIndex;

		this.initialization = function()
		{
			ProfileInfo = null;
			SpeakerVol = 0;
			MicVol = 0;
			PlayMode = CAMERA_STATUS.PLAY_MODE.LIVE;
			ViewMode = CAMERA_STATUS.VIEW_MODE.CHANNEL;
			isLogin = false;
			Orientation = CAMERA_STATUS.ORIENTATION.PORTRAIT;
			ProfileList = {};
			isSpeakerOn = false;
			isMicOn = false;
			ZoomMode = CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM;
			Ratio = CAMERA_STATUS.RATIO.ASPECT;
			PlayStatus = CAMERA_STATUS.PLAY_STATUS.STOP;
			isAuthunicating = true;		
			layout = 0;
			filpMode = 'normal';
			isPTZ = false;
			isAspectfit = false;
			isRendered = false;
			isDigitalPTZ = CAMERA_STATUS.DPTZ_MODE.DIGITAL_PTZ;
			gotLiveStream = false;
			streamingMode = CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE;
			isPtzType = CAMERA_STATUS.PTZ_MODE.NONE;
			defaultProfileIndex = {};
		};
		self.initialization();

		this.setStreamingMode = function(_streamingMode)
		{
			switch(_streamingMode)
			{
				case CAMERA_STATUS.STREAMING_MODE.PLUGIN_MODE:
				case CAMERA_STATUS.STREAMING_MODE.NO_PLUGIN_MODE: break;
				default : console.log("You set to wrong streaming mode :: " + _streamingMode); return;
			}

			streamingMode = _streamingMode;
		};

		this.getStreamingMode = function()
		{
			return streamingMode;
		};

		this.setVideoMode = function(_streamTagMode) {
			tagMode = _streamTagMode;
		};

		this.getVideoMode = function() {
			return tagMode;	
		};

		this.setLiveStreamStatus = function(flag){
			gotLiveStream = flag;
		};

		this.getLiveStreamStatus = function(){
			return gotLiveStream;
		};

		this.setSpeakerVol = function(vol){
			SpeakerVol = vol;
		};

		this.getSpeakerVol = function(){
			return SpeakerVol;
		};

		this.setIsAuthunicating = function(_isAuthunicating){
			isAuthunicating = _isAuthunicating;
		};

		this.getIsAuthunicating = function(){
			return isAuthunicating;
		};

		this.setZoomMode = function(_zoomMode){
			switch(_zoomMode)
			{
				case CAMERA_STATUS.ZOOM_MODE.DIGITAL_ZOOM: break;
				case CAMERA_STATUS.ZOOM_MODE.OPTICAL_PTZ: break;
				case CAMERA_STATUS.ZOOM_MODE.DIGITZL_PTZ: break;
				default: console.log("You set to wrong zoom mode :: " + _zoomMode); return;
			}

			ZoomMode = _zoomMode;
		};

		this.getZoomMode = function(){
			return ZoomMode;
		};

		this.setMicVol = function(vol){
			MicVol = vol;
		};

		this.getMicVol = function(){
			return MicVol;
		};

		this.isMicOn = function(){
			return isMicOn;
		};

		this.isSpeakerOn = function(){
			return isSpeakerOn;
		};

		this.setMicOn = function(flag){
			isMicOn = flag;
		};

		this.setSpeakerOn = function(flag){
			isSpeakerOn = flag;
		};
		
		this.setUserId = function(_userId) {
			LocalStorageService.setItem('USER_ID', _userId);
		};

		this.getUserId = function() {
			return LocalStorageService.getItemSync('USER_ID');
		};

		this.removeUserId = function() {
			LocalStorageService.removeItem('USER_ID');
		};

		this.setisLogin = function(_isLogin) {
			isLogin = _isLogin;
		};

		this.getisLogin = function() {
			return isLogin;
		};
		
		this.setProfileInfo = function(_profileInfo) {
			ProfileInfo = _profileInfo;
		};

		this.getProfileInfo = function() {
			return ProfileInfo;
		};

		this.setProfileList = function(_profileList, channelId) {
			ProfileList[channelId] = _profileList;
		};

		this.getProfileList = function(channelId) {
			return ProfileList[channelId];
		};

		this.setPlayMode = function(_playMode){
			switch(_playMode)
			{
				case CAMERA_STATUS.PLAY_MODE.LIVE : break;
				case CAMERA_STATUS.PLAY_MODE.PLAYBACK : break;
				default : console.log("You set to wrong playmode :: " + _playMode);
					return;
			}

			PlayMode = _playMode;
		};

		this.getPlayMode = function(){
			return PlayMode;
		};

		this.setServiceType = function(_serviceType){
			switch(_serviceType)
			{
				case CAMERA_STATUS.WEB_APP_TYPE.SSM_MOBILE : break;
				case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB : break;
				case CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE : break;
				case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE : break;
				default : console.log("You set to wrong playmode :: " + _serviceType);
			}

			var key = 'ServiceType';
			LocalStorageService.setItem('ServiceType', _serviceType);
		};

		this.getServiceType = function(){
			var key = 'ServiceType';
			if(!isPhone) {
				return CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB;
			}
			var ServiceType = LocalStorageService.getItemSync(key);

			switch(ServiceType)
			{
				case CAMERA_STATUS.WEB_APP_TYPE.SSM_MOBILE : break;
				case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_WEB : break;
				case CAMERA_STATUS.WEB_APP_TYPE.SHC_MOBILE : break;
				case CAMERA_STATUS.WEB_APP_TYPE.IPOLIS_MOBILE : break;
				default : console.log("wrong ServiceType return :: " + ServiceType);
			}

			return ServiceType;
		};

		this.setViewMode = function(_viewMode){
			switch(_viewMode)
			{
				case CAMERA_STATUS.VIEW_MODE.CHANNEL : break;
				case CAMERA_STATUS.VIEW_MODE.FULL : break;
				case CAMERA_STATUS.VIEW_MODE.DETAIL : break;
				case CAMERA_STATUS.VIEW_MODE.ALLCHANNEL : break;
				default : console.log("You set to wrong viewmode :: " + _viewMode); return;
			}

			ViewMode = _viewMode;
		};

		this.getViewMode = function(){
			return ViewMode;
		};

		this.setOrientation = function(_orientation){
			switch(_orientation)
			{
				case CAMERA_STATUS.ORIENTATION.PORTRAIT : break;
				case CAMERA_STATUS.ORIENTATION.LANDSCAPE : break;
				default : console.log("wrong orientation value :: " + _orientation);
			}

			Orientation = _orientation;
		};

		this.getOrientation = function(){
			switch(Orientation)
			{
				case CAMERA_STATUS.ORIENTATION.PORTRAIT : break;
				case CAMERA_STATUS.ORIENTATION.LANDSCAPE : break;
				default : console.log("wrong orientation value :: " + Orientation);
			}
			console.log("get Orientation :: " + Orientation);
			return Orientation;
		};

		this.setRatio = function(_ratio){
			switch(_ratio)
			{
				case CAMERA_STATUS.RATIO.ASPECT : break;
				case CAMERA_STATUS.RATIO.ORIGINAL : break;
				default : console.log("wrong ratio value :: " + _ratio);
			}

			Ratio = _ratio;
		};

		this.getRatio = function(){
			switch(Ratio)
			{
				case CAMERA_STATUS.RATIO.ASPECT : break;
				case CAMERA_STATUS.RATIO.ORIGINAL : break;
				default : console.log("wrong ratio value :: " + Ratio);
			}
			return Ratio;
		};

		this.setPlayStatus = function(_playstatus){
			switch(_playstatus)
			{
				case CAMERA_STATUS.PLAY_STATUS.STOP : break;
				case CAMERA_STATUS.PLAY_STATUS.PLAYING : break;
				case CAMERA_STATUS.PLAY_STATUS.CONNECTING : break;
				default : console.log("wrong play status value :: " + _playstatus);
			}

			PlayStatus = _playstatus;
		};

		this.getPlayStatus = function(){
			switch(PlayStatus)
			{
				case CAMERA_STATUS.PLAY_STATUS.STOP : break;
				case CAMERA_STATUS.PLAY_STATUS.PLAYING : break;
				case CAMERA_STATUS.PLAY_STATUS.CONNECTING : break;
				default : console.log("wrong play status value :: " + PlayStatus);
			}
			return PlayStatus;
		};

		this.setLayout = function(_layout){
			switch(_layout)
			{
				case 1 : break;
				case 4 : break;
				case 9 : break;
				case 16 : break;
				default : console.log("wrong layout value :: " + _layout);
			}
			layout = _layout;
		};

		this.getLayout = function(){
			switch(layout)
			{
				case 1 : break;
				case 4 : break;
				case 9 : break;
				case 16 : break;
				default : console.log("wrong layout value :: " + layout);
			}
			return layout;
		};

		this.setFilp = function(_flipMode){
			switch(_flipMode)
			{
				case 'normal' : break;
				case 'flip_mirror' : break;
				default : console.log("wrong filp mode value :: " + _flipMode);
			}

			filpMode = _flipMode;
		};

		this.getFilp = function(){
			switch(filpMode)
			{
				case 'normal' : break;
				case 'flip_mirror' : break;
				default : console.log("wrong filp mode value :: " + filpMode);
			}
			return filpMode;
		};

		this.setPTZMode = function(_PTZ){
			isPTZ = _PTZ;
		};

		this.getPTZMode = function(){
			return isPTZ;
		};

		this.setAspectfit = function(_aspectFit){
			isAspectfit = _aspectFit;
		};

		this.getAspectfit = function(){
			return isAspectfit;
		};

		this.setRenderingState = function(_isRendered){
			isRendered = _isRendered;
		};

		this.getRenderingState = function(){
			return isRendered;
		};

		this.getDigitalPTZ = function(){
			return isDigitalPTZ;
		};

		this.setDigitalPTZ = function(_isDigitalPTZ){
			isDigitalPTZ = _isDigitalPTZ;
		};

		this.setRotate = function(tRotate){
			rotate = tRotate;
		};

		this.getRotate = function(){
			return rotate;
		};

		this.setIsCaptured = function(flag){
			isCaptured = flag;
		};

		this.getIsCaptured = function(){
			return isCaptured;
		};

		this.getIsCapturedScreen = function(){
			return isCapturedScreen;
		};

		this.setIsCapturedScreen = function(flag){
			isCapturedScreen = flag;
		};

		this.setIsAudioOutEnabled = function(flag){
			isAudioOutEnabled = flag;
		};

		this.getIsAudioOutEnabled = function(){
			return isAudioOutEnabled;
		};

		this.setViewModeType = function(type){
			viewModeType = type;
		};

		this.getViewModeType = function(){
			return viewModeType;
		};

		this.setIsPtzType = function(type) {
			isPtzType = type;
		}

		this.getIsPtzType = function() {
			return isPtzType;
		}

		this.setAlarmOutput = function(index, value) {
			alarmOutput[index] = value;
		}

		this.getAlarmOutput = function(index) {
			return alarmOutput[index];
		}

		this.setPluginElement = function(obj) {
			pluginElem = obj;
		}

		this.getPluginElement = function(){
			return pluginElem;
		}

		this.setPixelCount = function(flag) {
			isPixelCountOn = flag;
		}

		this.getPixelCount = function() {
			return isPixelCountOn;
		}

		this.setChannelId = function(value) {
			channelId = value;
		}

		this.getChannelId = function() {
			return channelId;
		}

		this.setDefaultProfileIndex = function(index, channelId) {
			defaultProfileIndex[channelId] = index;
		}

		this.getDefaultProfileIndex = function(channelId) {
			return defaultProfileIndex[channelId];
		}
}]);