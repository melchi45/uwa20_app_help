kindFramework.factory('PcSetupReportModel', function($q, pcSetupService){
	"use strict";

	var PcSetupReportModel = function(){
		if(!(this instanceof PcSetupReportModel)){
			return new PcSetupReportModel();
		}

		var lang = {
			report: {
				title: 'lang_download',
				use: 'lang_enable',
				schedule: 'lang_schedule',
				periodList: {
					Daily: 'lang_daily',
					Weekly: 'lang_weekly'
				},
				dateList: {
					sun: 'lang_sun',
					mon: 'lang_mon',
					tue: 'lang_tue',
					wed: 'lang_wed',
					thu: 'lang_thu',
					fri: 'lang_fri',
					sat: 'lang_sat'
				},
				// everyDayAt: 'Everyday at',
				// every: 'Every',
				// at: 'at',
				hour: 'lang_Hour',
				minute: 'lang_minutes',
				fileName: 'lang_filename',
				description: 'lang_description',
				subject: 'lang_subject',
				fileNameInfo: 'lang_msg_filename_info',
				ftpEmailInfo: 'lang_msg_ftpemail',
				extensionList: {
					pc: [
						'xlsx',
						'txt'
					],
					hm: [
						'png'
					]
				},
				export: 'lang_export',
				ftpEmail: 'lang_menu_ftpemail',
				alert: 'lang_alert',
				message: 'lang_msg_noname'
			}
		};

		this.getLang = function(){
			return lang;
		};

		this.getReportInfo = function (type){
			var msubmenu = '';
			if(type === "hm"){
				msubmenu = 'heatmap';
			}else if(type === "qm"){
				msubmenu = 'queuemanagementsetup';
			}else{
				msubmenu = 'peoplecount';
			}

			var deferred = $q.defer();
			var options = {
				cgi: 'eventsources',
				msubmenu: msubmenu,
				action: 'view',
				data: {},
				successCallback: function(responseData){
					if(type === "hm"){
						deferred.resolve(responseData.data.HeatMap[0]);
					}else if(type === "qm"){
						deferred.resolve(responseData.data.QueueManagementSetup[0]);
					}else{
						deferred.resolve(responseData.data.PeopleCount[0]);
					}
				},
				failCallback: function(errorData){
					deferred.reject(errorData);
				}
			};
			pcSetupService.requestSunapi(options);

			return deferred.promise;
		};

		this.getSchedule = function (type){
			var pageType = '';
			if(type === "hm"){
				pageType = 'HeatMap';
			}else if(type === "qm"){
				pageType = 'QueueManagement';
			}else{
				pageType = 'PeopleCount';
			}

			var deferred = $q.defer();
			var options = {
				cgi: 'eventrules',
				msubmenu: 'scheduler',
				action: 'view',
				data: {
					Type: pageType
				},
				successCallback: function(responseData){
					if(type === "hm"){
						deferred.resolve(responseData.data.HeatMap[0]);
					}else if(type === "qm"){
						deferred.resolve(responseData.data.QueueManagement[0]);
					}else{
						deferred.resolve(responseData.data.PeopleCount[0]);
					}
				},
				failCallback: function(errorData){
					deferred.reject(errorData);
				}
			};
			pcSetupService.requestSunapi(options);

			return deferred.promise;
		};

		this.setReport = function (type, Enable, ReportEnable, ReportFilename, ReportFileType){
			var msubmenu = '';
			if(type === "hm"){
				msubmenu = 'heatmap';
			}else if(type === "qm"){
				msubmenu = 'queuemanagementsetup';
			}else{
				msubmenu = 'peoplecount';
			}

			var deferred = $q.defer();
			var options = {
				cgi: 'eventsources',
				msubmenu: msubmenu,
				action: 'set',
				data: {
					ReportEnable: ReportEnable,
					ReportFilename: ReportFilename,
					ReportFileType: ReportFileType
				},
				successCallback: function(responseData){
					deferred.resolve('Success');
				},
				failCallback: function(errorData){
					deferred.reject(errorData);
				}
			};

			if(Enable !== null){
				options.data.Enable = Enable;
			}
			
			pcSetupService.requestSunapi(options);

			return deferred.promise;
		};

		this.setSchedule = function (type, ScheduleType, WeekDay, Hour, Minute){
			var pageType = '';
			if(type === "hm"){
				pageType = 'HeatMap';
			}else if(type === "qm"){
				pageType = 'QueueManagement';
			}else{
				pageType = 'PeopleCount';
			}

			var deferred = $q.defer();
			var options = {
				cgi: 'eventrules',
				msubmenu: 'scheduler',
				action: 'set',
				data: {
					ScheduleType: ScheduleType,
					Hour: Hour,
					Minute: Minute,
					Type: pageType
				},
				successCallback: function(responseData){
					deferred.resolve('Success');
				},
				failCallback: function(errorData){
					deferred.reject(errorData);
				}
			};
			if(WeekDay !== false){
				options.data.WeekDay = WeekDay;
			}
			pcSetupService.requestSunapi(options);

			return deferred.promise;
		};
	};

	return PcSetupReportModel;
});