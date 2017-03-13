kindFramework.factory('PcCameraManagementModel', function($q, pcSetupService, $translate){
	"use strict";

	var PcCameraManagementModel = function(){
		if(!(this instanceof PcCameraManagementModel)){
			return new PcCameraManagementModel();
		}

		var lang = {
			/* TBD
			checkBox: {
				pc: 'HeatMap',
				hm: 'People Counting'
			},
			cameraManagement: {
				title: 'Camera Management',
				masterCamera: {
					title: 'Master Camera',
					masterCamera: 'Master Camera',
					ip: 'IP'
				},
				slaveCamera: {
					title: 'Slave Camera',
					use: 'USE',
					name: 'Name',
					ip: 'IP',
					status: 'Status',
					testButton: 'Test',
					statusList: [
						'Ready',
						'Connecting',
						'Connect Error',
						'Auth Error',
						'Registration'
					]
				},
				add: 'Add',
				delete: 'Delete'
			},
			*/
			systemManagement: {
				title: 'lang_system_management',
				dataRemove: {
					description: 'lang_msg_system_management_info',
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
				successCallback: function(responseData){
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