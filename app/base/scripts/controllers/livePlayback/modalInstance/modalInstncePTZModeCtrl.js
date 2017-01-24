kindFramework.controller('ModalInstncePTZModeCtrl',
  ['$scope', '$uibModalInstance', 'data', '$rootScope', 'ModalManagerService', 'Attributes', 'SunapiClient', 'UniversialManagerService',
  function ($scope, $uibModalInstance, data, $rootScope, ModalManagerService, Attributes, SunapiClient, UniversialManagerService) {
    "use strict";
    var sunapiAttributes = Attributes.get();

    $scope.data = {
      zoomMode : data.zoomMode,
      isDigitalZoom : false,
      isPTZ : false,
      isDPTZ : false,
      supportPTZ : (sunapiAttributes.PTZModel || sunapiAttributes.ExternalPTZModel || sunapiAttributes.ZoomOnlyModel),
      supportDPTZ : sunapiAttributes.isDigitalPTZ
    };


    switch($scope.data.zoomMode)
    {
      case 'Digital Zoom':
        $scope.data.isDigitalZoom = true;
      break;
      case 'PTZ':
        $scope.data.isPTZ = true;
      break;
      case 'Digital PTZ':
        $scope.data.isDPTZ = true;
      break;
    }

    $scope.changeZoomMode = function(_zoomMode)
    {
      switch(_zoomMode)
      {
        case "Digital Zoom":
          changeToDigitalZoom();
        break;
        case "PTZ":
          chnageToPTZ();
        break;
        case "Digital PTZ":
          changeToDPTZ();
        break;
      }
    };

    function changeToDigitalZoom() {
      $uibModalInstance.close('Digital Zoom');
    }

    function chnageToPTZ() {
      $uibModalInstance.close('PTZ'); 
    }

    function changeToDPTZ() {
      var successCallback = function(response){
        var DEFAULT_CHANNEL=0;
        var profileList = response.data.VideoProfiles[DEFAULT_CHANNEL].Profiles;
        // for(var i = 0; i < profileList.length; i++) { // check if dptz profile is set or not
        //   if(profileList[i].IsDigitalPTZProfile !== undefined) {
        //     break;
        //   } else {
        //     if(i == (profileList.length - 1)) {
        //       ModalManagerService.open('message', { 'buttonCount': 0, 'message': "test" } );
        //       $uibModalInstance.dismiss();
        //       return;
        //     }
        //   }
        // }
        var currentProfile = UniversialManagerService.getProfileInfo(data);
        for(var i = 0; i < profileList.length; i++) // check if dptz profile is selected or not
        {
          if(currentProfile.ViewModeType === "QuadView" || currentProfile.IsDigitalPTZProfile === true)
          {
            $uibModalInstance.close('Digital PTZ');
            UniversialManagerService.setViewModeType("QuadView");
            return;
          } else {
            var msg;
            if(sunapiAttributes.FisheyeLens) {
              msg = "lang_dptz_viewtype_select";
            } else {
              msg = "lang_dptzprofile_select";
            }
            ModalManagerService.open('message', { 'buttonCount': 0, 'message': msg } );
            $uibModalInstance.dismiss();
            return;
          }
        }
      };
      var errorCallback = function() {
        ModalManagerService.open('message', { 'buttonCount': 0, 'message': "Sunapi error" } );
      };
      SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', {}, successCallback, errorCallback,'',true);      
    }

    $rootScope.$saveOn('allpopupclose', function(event) {
      $uibModalInstance.dismiss();
    }, $scope);

}]);