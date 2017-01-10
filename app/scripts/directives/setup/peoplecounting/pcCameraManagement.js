kindFramework.directive('pcCameraManagement', function(
	PcCameraManagementModel, 
	pcModalService,
	$timeout
	){
	"use strict";
	return {
		restrict: 'E',
		replace: true,
		scope: false,
		transclude: false,
		templateUrl: 'views/setup/peoplecounting/directives/pcCameraManagement.html',
		link: function(scope, element, attrs){
			var pcCameraManagementModel = new PcCameraManagementModel();

			var lang = pcCameraManagementModel.getLang();
			scope.pcCameraManagement = {
				lang: {
					cameraManagement: lang.cameraManagement,
					systemManagement: lang.systemManagement
				},
			/* TBD
				masterCamera: {
					name: 'Camera 1',
					ip: '111.111.111.111'
				},
				slaveCamera: {
					use: false,
					isFull: false,
					list: [{},{},{}],
					reset: function(){
						var slaveCamera = scope.pcCameraManagement.slaveCamera;
						slaveCamera.use = false;
						slaveCamera.isFull = false;
						slaveCamera.list = [{}, {}, {}];
					},
					openUseConfirm: function(){
						var slaveCamera = scope.pcCameraManagement.slaveCamera;
						if(slaveCamera.use === false){
							slaveCamera.use = true;

							pcModalService.openConfirm({
								title: lang.modal.masterSlaveModeChange,
								message: lang.modal.masterSlaveModeChangeMessage
							}).then(slaveCamera.reset);
						}
					},
					test: function(index){
						scope.pcCameraManagement.slaveCamera.list[index].status 
							= lang.cameraManagement.slaveCamera.statusList[1];

						$timeout(function(){
							scope.pcCameraManagement.slaveCamera.list[index].status 
								= lang.cameraManagement.slaveCamera.statusList[4];
						}, 1000);
					},
					remove: function(){
						var slaveCamera = scope.pcCameraManagement.slaveCamera;
						var removedList = [];
						for(var i = 0, len = slaveCamera.list.length; i < len; i++){
							if(slaveCamera.list[i].checked === true){
								removedList.push(i);
							}
						}

						for(var i = 0, len = removedList.length; i < len; i++){
							var slaveIndex = removedList[i];
							slaveCamera.list[slaveIndex] = {};
						}

						slaveCamera.checkFull();
					},
					checkFull: function(){
						var slaveCamera = scope.pcCameraManagement.slaveCamera;
						var isFull = true;

						for(var i = 0, len = slaveCamera.list.length; i < len; i++){
							if(!('ip' in slaveCamera.list[i])){
								isFull = false;
								break;
							}
						}

						slaveCamera.isFull = isFull;
					},
					add: function(){
						pcModalService.openAddSlaveConfirm().then(function(data){
							var newIndex = 0;
							var slaveCamera = scope.pcCameraManagement.slaveCamera;

							for(var i = 0, len = slaveCamera.list.length; i < len; i++){
								if(Object.keys(slaveCamera.list[i]).length <= 1){
									newIndex = i;
									break;
								}
							}

							slaveCamera.list[newIndex] = {
								checked: false,
								name: 'Slave Camera ' + (newIndex + 1),
								ip: data.ip,
								ipType: data.ipType,
								port: data.port,
								status: lang.cameraManagement.slaveCamera.statusList[0]
							};

							slaveCamera.checkFull();
						}, function(){
							console.log("Cancle");
						});
					}
				},
			*/
				deleteData: function(){
			        pcModalService.openConfirm({
			        	title: lang.modal.dataRemove,
			        	message: lang.modal.dataRemoveMessage
			        }).then(function(){
						pcCameraManagementModel.deleteData(attrs.pageType).then(
							function(successData){
								console.log(successData);
							},
							function(failData){
								console.log(failData);
							}
						);
			        }, function(){
			        	console.log("cancel");
			        });
				}
			};
		}
	};
});