kindFramework.factory('PcCameraManagementModel', function($q, pcSetupService, $translate){
	"use strict";

	var PcCameraManagementModel = function(){
		if(!(this instanceof PcCameraManagementModel)){
			return new PcCameraManagementModel();
		}

		var lang = {
			systemManagement: {
				title: 'lang_system_management',
				dataRemove: {
					description: 'lang_msg_delete_all_data_question',
					button: 'lang_data_delete'
				}
			},
			modal: {
				//masterSlaveModeChange: 'Master / Slave Mode Change',
				//masterSlaveModeChangeMessage: '현재 등록되어 있는 Slave Camera 삭제됩니다. 진행하시겠습니까?',
				dataRemove: 'lang_data_delete',
				dataRemoveMessage: '' //in lang init
			}
		};

		(function langInit(){
			var dataRemoveMessage = [
				$translate.instant('lang_msg_system_management_info'),
				'<br>',
				$translate.instant('lang_apply_question')
			];

			lang.modal.dataRemoveMessage = dataRemoveMessage.join('');
		})();

		this.getLang = function(){
			return lang;
		};

		this.deleteData = function (type){
			var pageType = null;
			switch(type){
				case "hm" : pageType = 'HeatMap'; break;
				case "qm" : pageType = 'QueueEvents'; break;
				default : pageType = 'PeopleCount'; break;
			}
			var deferred = $q.defer();
			var options = {
				cgi: 'system',
				msubmenu: 'databasereset',
				action: 'control',
				data: {
					IncludeDataType: pageType
				},
				successCallback: function(){
					deferred.resolve('Success');
				},
				errorCallback: function(errorData){
					deferred.reject(errorData);
				}
			};
			pcSetupService.requestSunapi(options);

			return deferred.promise;
		};
	};

	return PcCameraManagementModel;
});