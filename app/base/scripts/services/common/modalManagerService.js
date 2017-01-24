"use strict";

kindFramework.service('ModalManagerService', 
  ['$uibModal','$uibModalStack',
  function($uibModal, $uibModalStack) { 
    
    var modalList = {

        'alarmout': { 'controller' : 'ModalInstnceAlarmOutCtrl'  , 'template' : 'views/livePlayback/modal/ModalAlarmout.html', 'priority': 2 },
        'b2clogin' : {'controller' : 'ModalInstnceB2CLoginCtrl'  , 'template' : 'views/livePlayback/modal/ModalB2CLogin.html', 'backdrop' : 'static', 'priority': 2},
        'b2cPreset': { 'controller' : 'ModalInstnceB2CPresetCtrl'  , 'template' : 'views/livePlayback/modal/ModalB2CPreset.html', 'priority': 2 },
        'b2cprofile' : {'controller' : 'ModalInstnceB2CProfileCtrl'  , 'template' : 'views/livePlayback/modal/ModalB2CProfile.html' , 'priority': 2 },
        'checkboxlist' : { 'controller' : 'ModalCheckBoxListCtrl'  , 'template' : 'views/livePlayback/modal/ModalCheckBoxList.html', 'priority': 2 },
        'crop': { 'controller' : 'ModalInstnceCropCtrl'  , 'template' : 'views/livePlayback/modal/ModalCrop.html', 'priority': 2 },
        'favorite' : {'controller' : 'ModalInstnceFavoriteCtrl'  , 'template' : 'views/livePlayback/modal/ModalFavorite.html', 'priority': 2 },
        'flipmirror' : { 'controller' : 'ModalInstnceFlipMirrorCtrl'  , 'template' : 'views/livePlayback/modal/ModalFlipMirror.html', 'priority': 2 },
        'list' : {'controller' : 'ModalInstnceListCtrl'  , 'template' : 'views/livePlayback/modal/ModalList.html', 'priority': 2 },
        'logout' : { 'controller' : 'modalInstnceLogoutCtrl'  , 'template' : 'views/livePlayback/modal/ModalLogout.html', 'priority': 1 },
        'message' : {'controller' : 'ModalInstnceMessageCtrl'  , 'template' : 'views/livePlayback/modal/ModalMessage.html', 'priority': 2 },
        'mobilePreset': { 'controller' : 'ModalInstnceMobilePresetCtrl'  , 'template' : 'views/livePlayback/modal/ModalMobilePreset.html', 'priority': 2 },
        'OverlapEvent': { 'controller' : 'modalInstnceOverlapEventCtrl'  , 'template' : 'views/livePlayback/modal/ModalOverlapEvent.html', 'priority': 2 },
        'b2bPassword': { 'controller' : 'ModalInstncePasswordSetting'  , 'template' : 'views/livePlayback/modal/ModalPasswordSetting.html', 'priority': 2 },
        'presetadd' : {'controller' : 'ModalInstncePresetAddCtrl'  , 'template' : 'views/livePlayback/modal/ModalPresetAdd.html', 'priority': 2 },
        'presetlist' : {'controller' : 'ModalInstncePresetListCtrl'  , 'template' : 'views/livePlayback/modal/ModalPresetList.html', 'priority': 2 },
        'profile' : {'controller' : 'ModalInstnceProfileCtrl'  , 'template' : 'views/livePlayback/modal/ModalProfile.html', 'priority': 2 },
        'search' : {'controller' : 'ModalInstnceSearchCtrl'  , 'template' : 'views/livePlayback/modal/ModalSearch.html', 'backdrop' : 'static', 'priority': 2 },
        'slider' : { 'controller' : 'ModalInstnceSliderCtrl'  , 'template' : 'views/livePlayback/modal/ModalSlider.html', 'priority': 2 },
        'status' : { 'controller' : 'modalInstnceStatusCtrl'  , 'template' : 'views/livePlayback/modal/ModalStatus.html', 'priority': 2 },
        'tracking' : {'controller' : 'ModalInstnceTrackingCtrl'  , 'template' : 'views/livePlayback/modal/ModalTracking.html', 'priority': 2 },
        'voicerecord' : { 'controller' : 'ModalInstnceVoiceRecCtrl'  , 'template' : 'views/livePlayback/modal/ModalVoiceRec.html', 'priority': 2 },
        'viewMode' : { 'controller' : 'ModalInstanceViewModeCtrl'  , 'template' : 'views/livePlayback/modal/ModalViewMode.html', 'priority': 2 },
        'b2bProfileSelect': {'controller' : 'ModalB2BProfileSelect'  , 'template' : 'views/livePlayback/modal/ModalB2BProfileSelect.html', 'priority': 2 },
        'bookmarkComment': {'controller' : 'ModalBookmarkCommentCtrl'  , 'template' : 'views/livePlayback/modal/ModalBookmarkComment.html', 'priority': 2 },
        'ptzmode': {'controller' : 'ModalInstncePTZModeCtrl'  , 'template' : 'views/livePlayback/modal/ModalPTZMode.html', 'priority': 2 },
        'profileSizeAlert' : {'controller' : 'modalInstnceprofileSizeAlertCtrl'  , 'template' : 'views/livePlayback/modal/ModalProfileSizeAlert.html', 'priority': 2 },
        'generalCheckboxList' : {'controller' : 'ModalGeneralCheckBoxListCtrl'  , 'template' : 'views/livePlayback/modal/ModalGeneralCheckBoxList.html', 'priority': 2 },
        'liveList' : {'controller' : 'ModalInstnceLiveListCtrl'  , 'template' : 'views/livePlayback/modal/ModalLiveList.html', 'priority': 2 },
        'idPassword' : {'controller' : 'ModalInstnceIdPasswordCtrl'  , 'template' : 'views/livePlayback/modal/ModalIPPassword.html', 'priority': 2 },
        'hugeThumbnail' : {'controller' : 'ModalHugeThumbnailCtrl'  , 'template' : 'views/livePlayback/modal/ModalHugeThumbnail.html', 'priority': 2 },
    };

    /*
     * Priority of the modal that is showing. 
     * 1 has the highest priority. 
     * Lower the number, higher the priority.
     * However, if number is zero or below, it is considered to have no priority at all. 
     * It will be discarded if there is any modal is showing.
     */
    var priority = -1;
    var modalInstance = null;

    this.open = function( key, jsonData, successCallback, failCallback, addedClassName ){

      var modal = modalList[key];

      if(modal === undefined ) {
          console.log("There is no type of ModalInstace");
          return;
      }

      if(modal.hasOwnProperty('priority') === false) {
        modal.priority = -1;
      }

      if(priority > 0 && (modal.priority > priority || modal.priority < 1)) {
        console.log('modal for ', key, ' has lower priority than the modal currently showing.');
        if(failCallback !== undefined) {
          failCallback();
        }
        return;
      } else {
        priority = modal.priority;
      }

      $uibModalStack.dismiss(modalInstance, 'Modal with a higher or same priority has popped up!');

      modalInstance = $uibModal.open({
        animation: true,
        templateUrl: modal.template,
        controller: modal.controller,
        windowClass: 'ua-modal ' + addedClassName,
        backdrop: (modal.backdrop ? modal.backdrop: true),
        resolve: {
          data: function () {
            return jsonData;
          },
        }
      });

      var successCB = successCallback ? function (result) {
        console.log(key, 'successCallback:', result);
        successCallback(result);
        priority = -1;
      } : function(result){
        console.log(key, 'successCallback:', result);
        priority = -1;
      };
      var failCB = failCallback ? function (result) {
        console.log(key, 'failCallback:', result);
        failCallback(result); 
        priority=-1;
      } : function (result) {
        console.log(key, 'failCallback:', result);
        console.log('Modal dismissed at: ' + new Date());
        priority = -1;
      };

      modalInstance.result.then(
          successCB,
          failCB
     );
    };

    this.close = function() {
      if(modalInstance !== null || modalInstance !== undefined) {
        $uibModalStack.dismiss(modalInstance);
      }
    };
 }]);