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
    $scope.getTranslatedOption = COMMONUtils.getTranslatedOption;
    $scope.recordSetting = {};

    function getAttributes() {
        var defer = $q.defer();
        var idx = 0;

        $scope.ch = 0;
        $scope.pro = 0;
        $scope.ActivateOptions = mAttr.ActivateOptions;
        $scope.AlphaNumericStr = mAttr.AlphaNumericStr;
        
        $scope.FisheyeLens = mAttr.FisheyeLens;
        $scope.maxChannel = mAttr.MaxChannel;

        // select options

        $scope.FileSystemTypeOptions = mAttr.FileSystemTypeOptions;
        $scope.DeviceType = mAttr.DeviceType;
        $scope.RecNormalModeOptions = mAttr.RecNormalModeOptions;
        $scope.RecEventModeOptions = mAttr.RecEventModeOptions;
        $scope.RecPreEventDurationOptions = mAttr.RecPreEventDurationOptions;
        $scope.RecPostEventDurationOptions = mAttr.RecPostEventDurationOptions;
        $scope.RecVideoFileTypeOptions = mAttr.RecVideoFileTypeOptions;
        $scope.EnableOptions = mAttr.EnableOptions;
        
        $scope.WeekDays = mAttr.WeekDays;
        $scope.NASIPMaxLen = parseInt(mAttr.NASIPMaxLen.maxLength);
        $scope.IPV4Pattern = mAttr.IPv4;
        $scope.NASUserIDMaxLen = parseInt(mAttr.NASUserIDMaxLen.maxLength);
        $scope.NASPasswordMaxLen = parseInt(mAttr.NASPasswordMaxLen.maxLength);
        $scope.DefaultFolderMaxLen = parseInt(mAttr.DefaultFolderMaxLen.maxLength);
        $scope.IdPattern = mAttr.OnlyNumber;

        defer.resolve("success");
        return defer.promise;
    }

    function getStorageDetails() {
        var getData = {},
            idx = 0;
        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=storageinfo&action=view', getData, function(response) {
            $scope.Storageinfo = response.data;
            for (idx = 0; idx < $scope.Storageinfo.Storages.length; idx = idx + 1) {
                if ($scope.Storageinfo.Storages[idx].Enable === true) {
                    $scope.Storageinfo.Storages[idx].Enable = "On";
                } else {
                    $scope.Storageinfo.Storages[idx].Enable = "Off";
                }
                if ($scope.Storageinfo.Storages[idx].Status === "") {
                    $scope.Storageinfo.Storages[idx].Status = "None";
                } else if ($scope.Storageinfo.Storages[idx].Status === "Normal") {
                    $scope.Storageinfo.Storages[idx].Status = "Ready";
                } else if ($scope.Storageinfo.Storages[idx].Status === "Active") {
                    $scope.Storageinfo.Storages[idx].Status = "Recording";
                }
                if ($scope.Storageinfo.Storages[idx].Type === "DAS") {
                    $scope.Storageinfo.Storages[idx].Type = "SD";
                }
                if ($scope.Storageinfo.Storages[idx].Type === 'NAS') {
                    if ($scope.Storageinfo.Storages[idx].NASConfig.IsPasswordSet === true) {
                        $scope.Storageinfo.Storages[idx].NASConfig.NASPasswordNew = '{::::::::}';
                    } else {
                        $scope.Storageinfo.Storages[idx].NASConfig.NASPasswordNew = '';
                    }
                    $scope.Storageinfo.Storages[idx].NASConfig.NASPasswordInit = true;
                }
            }
            setStorageStatus();
            pageData.Storageinfo = angular.copy($scope.Storageinfo);
            startMonitoringStatus();
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function getRecordingSchedules() {
        var getData = {},
            idx = 0;
        return SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=recordingschedule&action=view', getData, function(response) {
            $scope.RecordSchedule = response.data.RecordSchedule;
            for (idx = 0; idx < $scope.RecordSchedule.length; idx = idx + 1) {
                $scope.RecordSchedule[idx].ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds($scope.RecordSchedule[idx].Schedule));
            }
            pageData.RecordSchedule = angular.copy($scope.RecordSchedule);
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function getRecordGeneralDetails() {
        var getData = {},
            idx = 0;
        return SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=general&action=view', getData, function(response) {
            $scope.RecordGeneralInfo = response.data.RecordSetup;
            pageData.RecordGeneralInfo = angular.copy($scope.RecordGeneralInfo);
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function getRecordingStorageDetails() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=storage&action=view', getData, function(response) {
            $scope.RecordStorageInfo = response.data;
            pageData.RecordStorageInfo = angular.copy($scope.RecordStorageInfo);
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function getRecordProfileDetails() {
        var getData = {};
        getData.Profile = $scope.VideoProfilePolicies[$scope.Channel].RecordProfile;
        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', getData, function(response) {
            $scope.VideoProfile = response.data.VideoProfiles[$scope.Channel].Profiles[0];
            $scope.RecordProfileName = $scope.VideoProfile.Name;
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function getRecordProfile() {
        var getData = {},
            recordProfile = 0;
        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofilepolicy&action=view', getData, function(response) {
            $scope.VideoProfilePolicies = response.data.VideoProfilePolicies;
            recordProfile = $scope.VideoProfilePolicies[$scope.Channel].RecordProfile;
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function view() {
        /*
        if(data === 0) $rootScope.$emit('resetScheduleData', true);

            
        var promises = [];
        // promises.push(getStorageDetails);
        // promises.push(getRecordGeneralDetails);
        // promises.push(getRecordingStorageDetails);
        // promises.push(getRecordingSchedules);
        // promises.push(getRecordProfile);
        // promises.push(getRecordProfileDetails);
        

        $q.seqAll(promises).then(function() {
            $scope.pageLoaded = true;
            $("#recordpage").show();
        }, function(errorData) {
            console.log(errorData);
        });
        */

        $scope.pageLoaded = true;
        $("#recordpage").show();
    }

    function saveSettings() {
        var promises = [];
    }

    function set() {
        console.log($scope.recordSetting);
        // COMMONUtils.ApplyConfirmation(saveSettings);
    }

    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            getAttributes().finally(function() {
                view();
            });
        }
    })();

    $scope.submit = set;
    $scope.view = view;
});
