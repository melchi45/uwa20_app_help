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

        $scope.Channel = 0;
        $scope.pro = 0;
        $scope.ActivateOptions = mAttr.ActivateOptions;
        $scope.AlphaNumericStr = mAttr.AlphaNumericStr;
        
        $scope.FisheyeLens = mAttr.FisheyeLens;
        $scope.maxChannel = mAttr.MaxChannel;

        for (var i = 0; i < $scope.maxChannel; i++) $scope.recordSetting[i] = {};

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

        defer.resolve('Success');
        return defer.promise;
    }

    function setRecordGeneralInfo(index, queue) {
        var setData = {};
        setData.NormalMode = $scope.RecordGeneralInfo[$scope.Channel].NormalMode;
        setData.EventMode = $scope.RecordGeneralInfo[$scope.Channel].EventMode;
        setData.PreEventDuration = $scope.RecordGeneralInfo[$scope.Channel].PreEventDuration;
        setData.PostEventDuration = $scope.RecordGeneralInfo[$scope.Channel].PostEventDuration;
        if (pageData.RecordGeneralInfo[$scope.Channel].RecordedVideoFileType !== $scope.RecordGeneralInfo[$scope.Channel].RecordedVideoFileType) {
            $scope.needReload = true;
        }
        setData.RecordedVideoFileType = $scope.RecordGeneralInfo[$scope.Channel].RecordedVideoFileType;

        queue.push({
            url: '/stw-cgi/recording.cgi?msubmenu=general&action=set',
            reqData: setData,
            successCallback: function(response) {
                pageData.RecordGeneralInfo[$scope.Channel] = angular.copy($scope.RecordGeneralInfo[$scope.Channel]);
            }
        });
    }

    function setRecordSchedule(queue) {
        for (var i = 0; i < $scope.RecordSchedule.length; i++) {
            if (!angular.equals(pageData.RecordSchedule[i], $scope.RecordSchedule[i])) {
                var setData = {};
                var promise;
                setData.Activate = $scope.RecordSchedule[i].Activate;
                //if ($scope.RecordSchedule[i].Activate === 'Scheduled')
                {
                    var diff = $(pageData.RecordSchedule[i].ScheduleIds).not($scope.RecordSchedule[i].ScheduleIds).get();
                    var sun = 0,
                        mon = 0,
                        tue = 0,
                        wed = 0,
                        thu = 0,
                        fri = 0,
                        sat = 0;
                    for (var s = 0; s < diff.length; s++) {
                        var str = diff[s].split('.');
                        for (var d = 0; d < mAttr.WeekDays.length; d++) {
                            if (str[0] === mAttr.WeekDays[d]) {
                                switch (d) {
                                    case 0:
                                        sun = 1;
                                        setData["SUN" + str[1]] = 0;
                                        break;
                                    case 1:
                                        mon = 1;
                                        setData["MON" + str[1]] = 0;
                                        break;
                                    case 2:
                                        tue = 1;
                                        setData["TUE" + str[1]] = 0;
                                        break;
                                    case 3:
                                        wed = 1;
                                        setData["WED" + str[1]] = 0;
                                        break;
                                    case 4:
                                        thu = 1;
                                        setData["THU" + str[1]] = 0;
                                        break;
                                    case 5:
                                        fri = 1;
                                        setData["FRI" + str[1]] = 0;
                                        break;
                                    case 6:
                                        sat = 1;
                                        setData["SAT" + str[1]] = 0;
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }
                    for (var s = 0; s < $scope.RecordSchedule[i].ScheduleIds.length; s++) {
                        var str = $scope.RecordSchedule[i].ScheduleIds[s].split('.');
                        for (var d = 0; d < mAttr.WeekDays.length; d++) {
                            if (str[0] === mAttr.WeekDays[d]) {
                                switch (d) {
                                    case 0:
                                        sun = 1;
                                        setData["SUN" + str[1]] = 1;
                                        if (str.length === 4) {
                                            setData["SUN" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                        }
                                        break;
                                    case 1:
                                        mon = 1;
                                        setData["MON" + str[1]] = 1;
                                        if (str.length === 4) {
                                            setData["MON" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                        }
                                        break;
                                    case 2:
                                        tue = 1;
                                        setData["TUE" + str[1]] = 1;
                                        if (str.length === 4) {
                                            setData["TUE" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                        }
                                        break;
                                    case 3:
                                        wed = 1;
                                        setData["WED" + str[1]] = 1;
                                        if (str.length === 4) {
                                            setData["WED" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                        }
                                        break;
                                    case 4:
                                        thu = 1;
                                        setData["THU" + str[1]] = 1;
                                        if (str.length === 4) {
                                            setData["THU" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                        }
                                        break;
                                    case 5:
                                        fri = 1;
                                        setData["FRI" + str[1]] = 1;
                                        if (str.length === 4) {
                                            setData["FRI" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                        }
                                        break;
                                    case 6:
                                        sat = 1;
                                        setData["SAT" + str[1]] = 1;
                                        if (str.length === 4) {
                                            setData["SAT" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                        }
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }
                    if (sun) {
                        setData.SUN = 1;
                    }
                    if (mon) {
                        setData.MON = 1;
                    }
                    if (tue) {
                        setData.TUE = 1;
                    }
                    if (wed) {
                        setData.WED = 1;
                    }
                    if (thu) {
                        setData.THU = 1;
                    }
                    if (fri) {
                        setData.FRI = 1;
                    }
                    if (sat) {
                        setData.SAT = 1;
                    }
                }

                queue.push({
                    url: '/stw-cgi/recording.cgi?msubmenu=recordingschedule&action=set',
                    reqData: setData
                });
            }
        }
        pageData.RecordSchedule = angular.copy($scope.RecordSchedule);
    }

    function setRecordingStorageInfo(queue){
        var setData = {};
        setData.Enable = $scope.RecordStorageInfo.Enable;
        setData.OverWrite = $scope.RecordStorageInfo.OverWrite;
        setData.AutoDeleteEnable = $scope.RecordStorageInfo.AutoDeleteEnable;
        setData.AutoDeleteDays = $scope.RecordStorageInfo.AutoDeleteDays;
        queue.push({
            url: '/stw-cgi/recording.cgi?msubmenu=storage&action=set',
            reqData: setData,
            successCallback: function(response) {
                pageData.RecordStorageInfo = angular.copy($scope.RecordStorageInfo);
            }
        });
    }
    $scope.setStorageInfoData = function(index) {
        var setData = {};
        if ($scope.Storageinfo.Storages[index].Enable === 'On') {
            setData.Enable = true;
        } else {
            setData.Enable = false;
        }
        setData.Storage = index + 1;
        if ($scope.Storageinfo.Storages[index].Type === 'SD') {
            setData.FileSystem = $scope.Storageinfo.Storages[index].FileSystem;
        }
        if ($scope.Storageinfo.Storages[index].Type === 'NAS') {
            setData.NASIP = $scope.Storageinfo.Storages[index].NASConfig.NASIP;
            setData.NASUserID = $scope.Storageinfo.Storages[index].NASConfig.NASUserID;
            /** change the password only if it is set by user  */
            if ($scope.Storageinfo.Storages[index].NASConfig.NASPasswordInit === false) {
                setData.NASPassword = encodeURIComponent($scope.Storageinfo.Storages[index].NASConfig.NASPasswordNew);
            }
            setData.DefaultFolder = $scope.Storageinfo.Storages[index].NASConfig.DefaultFolder;
        }
        $scope.needReload = true;
        return setData;
    };
    $scope.nasPasswordInit = function(index) {
        if ($scope.Storageinfo.Storages[index].NASConfig.NASPasswordInit === true) {
            //should not be reset here
            $scope.Storageinfo.Storages[index].NASConfig.NASPasswordInit = false;
        }
    };

    function storageinfoSet(otherStorage, queue) {
        var setData = $scope.setStorageInfoData(otherStorage);

        queue.push({
            url: '/stw-cgi/system.cgi?msubmenu=storageinfo&action=set', 
            reqData: setData,
            successCallback: function(response) {
                pageData.Storageinfo.Storages[otherStorage] = angular.copy($scope.Storageinfo.Storages[otherStorage]);
            }
        });
    }

    function setStorageInfo(index, queue) {
        var setData = {};
        setData = $scope.setStorageInfoData(index);

        queue.push({
            url: '/stw-cgi/system.cgi?msubmenu=storageinfo&action=set',
            reqData: setData,
            successCallback: function(response) {
                //$timeout(view,4000);
                pageData.Storageinfo.Storages[index] = angular.copy($scope.Storageinfo.Storages[index]);
            }
        });

        var otherStorage;
        if (index === 1) {
            otherStorage = 0;
        } else {
            otherStorage = 1;
        }
        if ($scope.Storageinfo.Storages[otherStorage] !== undefined && !angular.equals(pageData.Storageinfo.Storages[otherStorage], $scope.Storageinfo.Storages[otherStorage])) {
            storageinfoSet(otherStorage, queue);
        } else {
            //window.setTimeout(RefreshPage, 1000);
        }
    }

    function RefreshPage() {
        //window.location.href = $scope.relocateUrl;
        if ($scope.needReload === true) {
            $scope.needReload = false;
            window.location.reload(true);
        }
    }

    function validatePage() {
        var retVal = true;
        if ($scope.storageForm.AutoDeleteDays.$valid === false) {
            COMMONUtils.ShowError('lang_msg_invalidValue');
            retVal = false;
        }
        if ($scope.RecordStorageInfo.AutoDeleteEnable === true) {
            if ($scope.RecordStorageInfo.AutoDeleteDays < $scope.AutoDeleteDayOptions.min || $scope.RecordStorageInfo.AutoDeleteDays > $scope.AutoDeleteDayOptions.max) {
                COMMONUtils.ShowError('lang_msg_chkPeriodRange');
                retVal = false;
            }
        }
        if ($scope.Storageinfo.Storages[$scope.SelectedStorage].Type === 'NAS' && $scope.Storageinfo.Storages[$scope.SelectedStorage].Enable === 'On') {
            if (checkNas($scope.SelectedStorage) === false) {
                retVal = false;
            }
        }
        var otherstorage;
        if ($scope.SelectedStorage === 0) {
            otherstorage = 1;
        } else {
            otherstorage = 0;
        }
        if ($scope.Storageinfo.Storages[otherstorage].Type === 'NAS' && $scope.Storageinfo.Storages[otherstorage].Enable === 'On') {
            if (checkNas(otherstorage) === false) {
                retVal = false;
            }
        }
        for (var i = 0; i < $scope.RecordSchedule.length; i++) {
            if ($scope.RecordSchedule[i].Activate === 'Scheduled' && $scope.RecordSchedule[i].ScheduleIds.length === 0) {
                COMMONUtils.ShowError('lang_msg_checkthetable');
                retVal = false;
            }
        }
        return retVal;
    }
    $scope.GetFormatButtonStatus = function(index) {
        var idx = 0;
        var formatdisable = false;
        for (idx = 0; idx < $scope.Storageinfo.Storages.length; idx = idx + 1) {
            if ($scope.Storageinfo.Storages[idx].Status === 'Formatting') {
                formatdisable = true;
                break;
            }
        }
        if ($scope.Storageinfo.Storages[index].Status === 'None' || formatdisable === true) {
            return true;
        }
        return false;
    };

    $scope.getOnOffStatus = function(index) {
        if(pageData.Storageinfo.Storages[index].Enable === 'Off') {
            return true;
        }
        return false;
    };

    function setStorageStatus() {
        var defer = $q.defer();
        var index = 0;
        var totalSize = "0";
        var freeSize = "0";
        for (index = 0; index < $scope.Storageinfo.Storages.length; index = index + 1) {
            totalSize = $scope.Storageinfo.Storages[index].TotalSpace;
            freeSize = $scope.Storageinfo.Storages[index].TotalSpace - $scope.Storageinfo.Storages[index].UsedSpace;
            if (totalSize >= 1024 * 1024) {
                totalSize = (totalSize / 1024 / 1024).toFixed(2);
                $scope.Storageinfo.Storages[index].TotalSpace = totalSize + " TB";
            } else if (totalSize >= 1024) {
                totalSize = (totalSize / 1024).toFixed(2);
                $scope.Storageinfo.Storages[index].TotalSpace = totalSize + " GB";
            } else {
                $scope.Storageinfo.Storages[index].TotalSpace = totalSize + " MB";
            }
            if (freeSize >= 1024 * 1024) {
                freeSize = (freeSize / 1024 / 1024).toFixed(2);
                $scope.Storageinfo.Storages[index].UsedSpace = freeSize + " TB";
            } else if (freeSize >= 1024) {
                freeSize = (freeSize / 1024).toFixed(2);
                $scope.Storageinfo.Storages[index].UsedSpace = freeSize + " GB";
            } else {
                $scope.Storageinfo.Storages[index].UsedSpace = freeSize + " MB";
            }
        }
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
        // if(data === 0) $rootScope.$emit('resetScheduleData', true);

        var promises = [];
        // promises.push(getStorageDetails);
        promises.push(getRecordGeneralDetails);
        // promises.push(getRecordingStorageDetails);
        promises.push(getRecordingSchedules);
        promises.push(getRecordProfile);
        promises.push(getRecordProfileDetails);

        $q.seqAll(promises).then(function() {
            var isChannel = findChannel($scope.Channel, $scope.RecordGeneralInfo);
            // EventMode NormalMode PostEventDuration PreEventDuration RecordedVideoFileType

            $scope.recordSetting[$scope.Channel].NormalMode = isChannel.NormalMode;
            $scope.recordSetting[$scope.Channel].EventMode = isChannel.EventMode;
            $scope.recordSetting[$scope.Channel].PreEventDuration = isChannel.PreEventDuration;
            $scope.recordSetting[$scope.Channel].PostEventDuration = isChannel.PostEventDuration;
            $scope.recordSetting[$scope.Channel].RecordedVideoFileType = isChannel.RecordedVideoFileType;
            $scope.recordSetting[$scope.Channel].Activate = $scope.RecordSchedule[$scope.Channel].Activate;

            $scope.pageLoaded = true;
            $("#recordpage").show();
        }, function(errorData) {
            console.log(errorData);
        });

        $scope.pageLoaded = true;
        $("#recordpage").show();
    }

    function findChannel (channel, structure) {
        var is = false;
        for(var i = 0; i < structure.length; i++) {
            if(channel == structure[i].Channel) {
                is = structure[i]
                break;
            }
        }

        return is;
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
