kindFramework.controller('ModalInstnceVoiceRecCtrl',
  ['$scope', '$rootScope', '$uibModalInstance', 
  function ($scope, $rootScope, $uibModalInstance) {
    'use strict';
     /*fixed VOICE_REC_MAX data count*/
    var VOICE_REC_MAX = 10;
    var voiceRecControl = $scope.voiceRecControl = {
      visibility: false,
      visibilityCheckbox: false,
      visibilityNewRecord: false,
      datas:[],
      deleteRec: function() {
        voiceRecControl.visibilityCheckbox = false;
      },
      visibleRegisterRec: function() {
        voiceRecControl.visibilityNewRecord = true;
        voiceRecControl.title = "New Voice";
      },
      registerRec: function() {
        voiceRecControl.resetUI();
        voiceRecControl.visibility = true;
      },
      save: function() {
        voiceRecControl.resetUI();
      },
      resetUI: function() {
        voiceRecControl.visibility = false;
        voiceRecControl.visibilityCheckbox = false;
        voiceRecControl.visibilityNewRecord = false;
        voiceRecControl.title = "Voice REC";
      }
    };
    /*
    make voice datas UI
    */
    {
      voiceRecControl.datas = [];
      var dummyData = [{
          'title': 'Good Morning',
          'isEmpty': false,
        },
        {
          'title': 'Cheer up!',
          'isEmpty': false,
        },
        {
          'title': 'Hahahahahaha',
          'isEmpty': false,
        },
        {
          'title': 'Hahahahahaha',
          'isEmpty': false,
        },
      ];
      var idx = 0;
      for(idx = 0; idx < dummyData.length ; idx++) {
        voiceRecControl.datas.push(dummyData[idx]);
      }
      while(idx < VOICE_REC_MAX){
        voiceRecControl.datas.push({
          'title': 'New Voice',
          'isEmpty': true,
        });
        idx++;
      }
    }
    $scope.save = function() {
      voiceRecControl.visibilityNewRecord = false;
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
    
    $rootScope.$saveOn('allpopupclose', function() {
      $uibModalInstance.dismiss('cancel');
    }, $scope);
}]);