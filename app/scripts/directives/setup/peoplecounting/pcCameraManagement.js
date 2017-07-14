kindFramework.directive('pcCameraManagement', function(
  PcCameraManagementModel,
  pcModalService
) {
  "use strict";
  return {
    restrict: 'E',
    replace: true,
    scope: false,
    transclude: false,
    templateUrl: 'views/setup/peoplecounting/directives/pcCameraManagement.html',
    link: function(scope, element, attrs) {
      var pcCameraManagementModel = new PcCameraManagementModel();

      var lang = pcCameraManagementModel.getLang();
      scope.pcCameraManagement = {
        lang: {
          cameraManagement: lang.cameraManagement,
          systemManagement: lang.systemManagement
        },
        deleteData: function() {
          pcModalService.openConfirm({
            title: lang.modal.dataRemove,
            message: lang.modal.dataRemoveMessage
          }).then(function() {
            pcCameraManagementModel.deleteData(attrs.pageType).then(
              function() {
                window.location.reload(true);
              },
              function(failData) {
                console.log(failData);
              }
            );
          }, function() {
            console.log("cancel");
          });
        }
      };
    }
  };
});