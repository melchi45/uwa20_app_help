kindFramework.controller('ModalInstnceVoiceRecCtrl',
  ['$scope', '$rootScope', '$uibModalInstance', 'data',
  function ($scope, $rootScope, $uibModalInstance, data) {
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
      for(var i = 0; i < dummyData.length ; i++) {
        voiceRecControl.datas.push(dummyData[i]);
      }
      while(i < VOICE_REC_MAX){
        voiceRecControl.datas.push({
          'title': 'New Voice',
          'isEmpty': true,
        });
        i++;
      }
    }
    $scope.save = function() {
      voiceRecControl.visibilityNewRecord = false;
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
    
    $rootScope.$saveOn('allpopupclose', function(event) {
      $uibModalInstance.dismiss('cancel');
    }, $scope);
}]);