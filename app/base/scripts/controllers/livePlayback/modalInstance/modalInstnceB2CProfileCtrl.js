'use strict';

kindFramework.controller('ModalInstnceB2CProfileCtrl', ['$scope', '$rootScope', '$uibModalInstance', 'data',
  function($scope, $rootScope, $uibModalInstance, data) {

    $scope.profileList = data.profileList;

    $scope.data = {
      currentProfile: data.selectedProfile,
    };

    $scope.selectProfile = function(profile) {
      console.log(profile + " is selected");
      $uibModalInstance.close(profile);
      $rootScope.$emit('changeLoadingBar', true);
    };

    $rootScope.$saveOn('allpopupclose', function() {
      $uibModalInstance.dismiss('cancel');
    }, $scope);

  },
]);
kindFramework.run(["$templateCache", function($templateCache) {
  var strVar = "";

  strVar += "<div class=\"modal-body modal-list ua-modal-body\">";
  strVar += "   <ul>";
  strVar += "    <li ng-repeat=\"profile in profileList\" class=\"popup-profile-list\">";
  strVar += "      <label>";

  strVar += "              <input type=\"radio\" value=\"{{profile}}\" ng-model=\"data.currentProfile\" name=\"b2c_profile_group\" ng-click=\"selectProfile(profile)\" \/>";
  strVar += "        <span class=\"radio-text-position\">{{ profile }}<\/span>";
  strVar += "      <\/label>";
  strVar += "    <\/li>";
  strVar += "  <\/ul>";

  strVar += "<\/div>";
  strVar += "<div class=\"modal-bottom-bar\"><\/div>";
  $templateCache.put("ModalB2CProfile.html", strVar);
}]);