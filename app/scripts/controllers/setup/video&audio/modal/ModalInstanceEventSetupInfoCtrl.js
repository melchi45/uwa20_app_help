'use strict';

kindFramework.controller('ModalInstanceEventSetupInfoCtrl', ['$scope', '$rootScope', '$uibModalInstance', '$timeout',
  function ($scope, $rootScope, $uibModalInstance, $timeout) {
	$scope.dataType = [
		'FTP',
		'E-Mail',
		'Record',
		'Alarm output 1'
	];
  	$scope.channelItems = [
  		{
  			ch: 1, //CH 가 있을 때 HTML에 표시
  			dataType: 'FTP',
  			datas: [
  				'On',
  				'On',
  				'On',
  				'On',
  				'On',
  				'On'
  			]
  		},
  		{
  			dataType: 'E-Mail',
  			datas: [
  				'On',
  				'On',
  				'On',
  				'On',
  				'On',
  				'On'
  			]
  		},
  		{
  			dataType: 'Record',
  			datas: [
  				'On',
  				'On',
  				'On',
  				'On',
  				'On',
  				'On'
  			]
  		},
  		{
  			dataType: 'Alarm output 1',
  			datas: [
  				'On',
  				'On',
  				'On',
  				'On',
  				'On',
  				'On'
  			]
  		},
  		{
  			ch: 2, //CH 가 있을 때 HTML에 표시
  			dataType: 'FTP',
  			datas: [
  				'On',
  				'On',
  				'On',
  				'On',
  				'On',
  				'On'
  			]
  		},
  		{
  			dataType: 'E-Mail',
  			datas: [
  				'On',
  				'On',
  				'On',
  				'On',
  				'On',
  				'On'
  			]
  		},
  		{
  			dataType: 'Record',
  			datas: [
  				'On',
  				'On',
  				'On',
  				'On',
  				'On',
  				'On'
  			]
  		},
  		{
  			dataType: 'Alarm output 1',
  			datas: [
  				'On',
  				'On',
  				'On',
  				'On',
  				'On',
  				'On'
  			]
  		}
  	];

    $scope.cancel = function() {
      $uibModalInstance.close();
    };
}]);