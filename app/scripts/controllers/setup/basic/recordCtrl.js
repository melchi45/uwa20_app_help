kindFramework.controller('recordCtrl', function ($scope, $uibModal, $timeout, $cookieStore, $rootScope, $location,
    SunapiClient, XMLParser, Attributes, COMMONUtils, LogManager, SessionOfUserManager, ModalManagerService, CameraSpec, $q, $filter) {

    "use strict";
    $scope.pageLoaded = false;

    COMMONUtils.getResponsiveObjects($scope);

    if (SessionOfUserManager.IsLoggedin()) {
        LogManager.debug("Setup login is success.");
    }

    var mAttr = Attributes.get("media");
    var pageData = {};

    $scope.showAdvancedMenu = false;
    $scope.showAdvancedLabel = 'lang_show';
    $scope.EnableAddButton = true;
    $scope.GOVLengthRange = {};
    $scope.DynamicGovRange = {};
    $scope.IPv4PatternStr = mAttr.IPv4PatternStr;
    $scope.isNewProfile = false;
    $scope.getTranslatedOption = COMMONUtils.getTranslatedOption;
    $scope.maxChannel = mAttr.MaxChannel;

    function view() {
        console.log('view load');
        $scope.EnableAddButton = true;
        $scope.isNewProfile = false;
        var promises = [getConnectionPolicy, getVideoSource, getVideoProfilePolicies, getProfiles, getVideoCodecInfo, getVideoRotate];
        var temp;

        if ($scope.FisheyeLens === true) {
            promises.push(getFisheyeSetup);
        }

        $q.seqAll(promises).then(
            function(result){
                $scope.pageLoaded = true;
                $("#recordpage").show();
            },
            function(error){
        });
    }

    function saveSettings() {
        var promises = [];

        /* Try to set profile policy both before and after setting video profile,
           during video codec change it is needed to set profile policy after changing video codec.
           Bcoz Email/FTP is applicable only for MJPEG profile */
        if ($scope.isNewProfile === false) {
            /** In case of creating new profile, not set profile policy  */
            if (!angular.equals(pageData.VideoProfilePolicies, $scope.VideoProfilePolicies)) {
                promises.push(setVideoProfilePolicies);
            }
        }

        if (!angular.equals(pageData.VideoProfiles, $scope.VideoProfiles)) {
            promises.push(setProfiles);
        }
        if (promises.length <= 0) return;
        
        $q.seqAll(promises).then(
            function(result) {
                retrySavingProfilePolicy();
            },
            function(error) {
                LogManager.debug("Save settings promise failed ");
                retrySavingProfilePolicy();
        });
    }

    function set() {
        if (validatePage()) {
            COMMONUtils.ApplyConfirmation(saveSettings);
        }
    }


    $scope.submit = set;
    $scope.view = view;
});
