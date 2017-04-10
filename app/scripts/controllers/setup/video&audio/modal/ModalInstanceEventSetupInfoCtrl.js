'use strict';

kindFramework.controller('ModalInstanceEventSetupInfoCtrl', ['$scope', '$rootScope', '$uibModalInstance', '$timeout', 'infoTableData',
  function ($scope, $rootScope, $uibModalInstance, $timeout, infoTableData) {

  console.log(infoTableData);

	$scope.dataType = [
		'FTP',
		'E-Mail',
		'Record',
		'Alarm output 1'
	];

  var eventActionTypeLive = [
    'FTP',
    'SMTP',
    'Record',
    'AlarmOutput.1'
  ];
  
  $scope.dataTypeLength = $scope.dataType.length;

  var PAGE_INDEX_LIST = {
    FogDetection: 0,
    TamperingDetection: 1,
    DefocusDetection: 2,
    MotionDetection: 3,
    VideoAnalysis: 4,
    FaceDetection: 5
  };

  $scope.channelItems = [];
  $scope.NONE_DATA = 'None';
  $scope.LANG_OFF = 'lang_off';

  try{
    for(var i = 0, ii = infoTableData.length; i < ii; i++){
      var self = infoTableData[i];
      var pageName = self.eventType.replace("Channel.#.", '');
      var pageIndex = PAGE_INDEX_LIST[pageName];

      //각페이지별 채널
      for(var j = 0, jj = self.data[0].length; j < jj; j++){
        var dataSelf = self.data[0][j];
        var channelIndex = j * jj;

        for(
          var k = channelIndex, l = 0, kk = channelIndex + $scope.dataTypeLength;
          k < kk;
          k++, l++
          ){
          var dataTypeName = $scope.dataType[l];
          var eventActionData = '';

          $scope.channelItems[k] = $scope.channelItems[k] ? $scope.channelItems[k] : {
            datas: [],
            dataType: ''
          }; 

          if(k === channelIndex){
            $scope.channelItems[k].ch = j;

            if(dataSelf.enable === false){
              eventActionData = $scope.NONE_DATA;
            }
          }

          if(dataSelf.enable === true){
            eventActionData = dataSelf.eventActions.indexOf(eventActionTypeLive[l]) > -1 ?
              (
                l === $scope.dataTypeLength - 1 ?
                dataSelf.alarmOutputDuration :
                "lang_on"
              ) :
              "lang_off";
          }

          $scope.channelItems[k].datas[pageIndex] = eventActionData;

          $scope.channelItems[k].dataType = dataTypeName;
        }
      }
    }
  }catch(e){
    console.error(e);
  }

  $scope.cancel = function() {
    $uibModalInstance.close();
  };
}]);