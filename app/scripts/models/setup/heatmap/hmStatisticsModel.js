"use strict";

kindFramework.factory('HMStatisticsModel', function($q, pcSetupService, RESTCLIENT_CONFIG){
	var hmStatisticsModel = function(){
		this.startSearch = function (FromDate, ToDate, ResultImageType){
			var deferred = $q.defer();
			var options = {
				cgi: 'recording',
				msubmenu: 'heatmapsearch',
				action: 'control',
				data: {
					ChannelIDList: 0,
					Mode: 'Start',
					FromDate: FromDate,
					ToDate: ToDate,
					ResultAsImage: 'True',
					ResultImageType: ResultImageType
				},
				successCallback: function(responseData){
					deferred.resolve(responseData.data);
				},
				failCallback: function(failData){
					deferred.reject(failData);
				}
			};
			pcSetupService.requestSunapi(options);

			return deferred.promise;
		};

		this.checkSearch = function (SearchToken){
			var deferred = $q.defer();
			var options = {
				cgi: 'recording',
				msubmenu: 'heatmapsearch',
				action: 'view',
				data: {
					Type: 'Status',
					SearchToken: SearchToken
				},
				successCallback: function(responseData){
					deferred.resolve(responseData.data);
				},
				failCallback: function(failData){
					deferred.reject(failData);
				}
			};
			pcSetupService.requestSunapi(options);

			return deferred.promise;
		};

		this.cancelSearch = function (SearchToken){
			var deferred = $q.defer();
			var options = {
				cgi: 'recording',
				msubmenu: 'heatmapsearch',
				action: 'control',
				data: {
					Mode: 'Cancel',
					SearchToken: SearchToken
				},
				successCallback: function(){
					deferred.resolve('Success');
				},
				failCallback: function(failData){
					deferred.reject(failData);
				}
			};
			pcSetupService.requestSunapi(options);

			return deferred.promise;
		};

		this.deviceInfo = function(){
			var deferred = $q.defer();
			var options = {
				cgi: 'system',
				msubmenu: 'deviceinfo',
				action: 'view',
				data: {},
				successCallback: function(responseData){
					deferred.resolve(responseData.data);
				},
				failCallback: function(failData){
					deferred.reject(failData);
				}
			};
			pcSetupService.requestSunapi(options);

			return deferred.promise;
		};

		this.getResultPath = function (SearchToken){
			var imagePath = [
				'/stw-cgi/recording.cgi',
				'?msubmenu=heatmapsearch',
				'&action=view',
				'&Type=Results',
				'&SearchToken=' + SearchToken
			];
			var hostName = null;

			if(RESTCLIENT_CONFIG.serverType === "grunt"){
				hostName = [
					window.location.protocol,
					'//',
					RESTCLIENT_CONFIG.digest.hostName,
					':',
					RESTCLIENT_CONFIG.port
				];

				imagePath.unshift(hostName.join(''));
			}

			return imagePath.join('');
		};

		this.getReportInfo = function (){
			var deferred = $q.defer();
			var options = {
				cgi: 'eventsources',
				msubmenu: 'heatmap',
				action: 'view',
				data: {},
				successCallback: function(responseData){
					deferred.resolve(responseData.data.HeatMap[0]);
				},
				errorCallback: function(errorData){
					deferred.reject(errorData);
				}
			};
			pcSetupService.requestSunapi(options);

			return deferred.promise;
		};
		
	};

	return hmStatisticsModel;
});