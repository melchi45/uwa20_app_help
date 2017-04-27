kindFramework.controller('storageCtrl', function($scope, $uibModal, SunapiClient, Attributes, COMMONUtils, $translate, $timeout, $q, $rootScope, eventRuleService, $compile, UniversialManagerService) {
    "use strict";
    var mAttr = Attributes.get();
    COMMONUtils.getResponsiveObjects($scope);
    var pageData = $scope.pageData = {};
    $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
    $scope.RecordEnableOptions = ["Off", "On"];
    $scope.SelectedStorage = 0;
    $scope.Channel = UniversialManagerService.getChannelId();
    $scope.NASTestStatus = "";
    $scope.NASTimerId = null;
    $scope.selected = 0;
    $scope.Formatmsg = ["SDFormatMsg", "NASFormatMsg"];
    $scope.AutoDeleteDayOptions = [];
    $scope.needReload = false;
    $scope.OnlyNumStr = mAttr.OnlyNumStr;
    $scope.IPv4PatternStr = mAttr.IPv4PatternStr;
    $scope.FriendlyNameCharSetNoNewLineStr = mAttr.FriendlyNameCharSetNoNewLineStr;
    $scope.EventSource = "Storage";
    $scope.StorageInfo = {};




    /*
     ID : 숫자,알파벳,특수문자(_ - .) 입력가능하고 이외 문자는 설정 불가능.
     Password : 숫자,알파벳,특수문자(~ ! @ $ ^ * _ - { } [ ] . / ?) 입력가능하고 이외 문자는 설정 불가능
     Default folder : 숫자, 알파벳, 특수문자(_ - .) 입력가능하고 이외 문자는 설정 불가능
     */
    //$scope.NASUserIDPattern = "^[a-zA-Z0-9~`!@$^*()_\\-|{}\\[\\];,./?]*$";
    /** Password and ID has same pattern - ~`!@$^*()_-|{}[];,./? */
    //$scope.NASPasswordPattern = $scope.NASUserIDPattern;
    /** folder - `~!@#$%^&()-_=+[]{};',./ */
    //$scope.NASFolderPattern = "^[a-zA-Z0-9~`!@#$%^&()\\-_=+\\[\\]{};',./]*$";
    $scope.NASUserIDPattern = "^[a-zA-Z0-9_\\-.]*$";
    $scope.NASPasswordPattern = "^[a-zA-Z0-9~!@$^*_\\-{}\\[\\]./?]*$";
    $scope.NASFolderPattern = "^[a-zA-Z0-9_\\-.]*$";

    $scope.getTranslatedOption = function(Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };

    function getStorageTableData() {
        $scope.infoTableData = [];
        var Profiles,
            profCnt = 0;
        var getData = {};

        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=sdcardinfo&action=view', getData,
            function (response) {

                var TableData = response.data;

                $.each(TableData,function(index, element) {

                    var totalSpace = parseInt(element.TotalSpace);
                    var usedSpace = totalSpace - parseInt(element.UsedSpace);
                    var status = element.Status;

                    element.Enable = element.Enable === true ? "On" : "Off";

                    if (usedSpace < 1024) {
                        element.UsedSpace = usedSpace + " MB"
                    } else if (usedSpace >= 1024 && usedSpace < 1024*1024 ) {
                        element.UsedSpace = (usedSpace/1024).toFixed(2) + " GB"
                    } else if (usedSpace >= 1024*1024 && usedSpace < 1024*1024*1024) {
                        element.UsedSpace = (usedSpace/(1024*1024)).toFixed(2) + " TB"
                    }

                    if (totalSpace < 1024) {
                        element.TotalSpace = totalSpace + " MB"
                    } else if (totalSpace >= 1024 && usedSpace < 1024*1024 ) {
                        element.TotalSpace = (totalSpace/1024).toFixed(2) + " GB"
                    } else if (totalSpace >= 1024*1024 && usedSpace < 1024*1024*1024) {
                        element.TotalSpace = (totalSpace/(1024*1024)).toFixed(2) + " TB"
                    }

                    if (status === "") {
                        element.Status = "None";
                    } else if (status === "Normal") {
                        element.Status = "Ready";
                    } else if (status === "Active") {
                        element.Status = "Recording";
                    }

                })

                $scope.infoTableData = TableData;

            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function getStorageSetup() {
        var getData = {
            Channel : 0
        };

        return SunapiClient.get("/stw-cgi/recording.cgi?msubmenu=storage&action=view", getData,
            function (response) {
                $scope.storageData = response.data.storage;
                $scope.pageData.storageData = angular.copy($scope.storageData[0]);

                $scope.RecordStorageInfo.OverWrite = $scope.storageData[0].OverWrite;
                $scope.RecordStorageInfo.AutoDeleteEnable = $scope.storageData[0].AutoDeleteEnable;
                $scope.RecordStorageInfo.AutoDeleteDays = $scope.storageData[0].AutoDeleteDays;
                $scope.RecordSchedule.Activate = "Always";
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function setStorageSetup() {
        var setData = {};

        setData.Channel = 0;
        setData.AutoDeleteEnable = false;
        setData.AutoDeleteDays = 1;
        setData.OverWrite = $scope.pageData.storageData.OverWrite;

        if( $scope.pageData.storageData.OverWrite === true ) {
            setData.AutoDeleteEnable = $scope.pageData.storageData.AutoDeleteEnable;
            if( $scope.pageData.storageData.AutoDeleteEnable === true ) {
                setData.AutoDeleteDays = $scope.pageData.storageData.AutoDeleteDays;
            }
        }

        return SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=storage&action=set', setData,
            function () {
                $scope.pageData.storageData = angular.copy($scope.storageData);
            },
            function (errorData) {
                $scope.pageData.storageData = angular.copy($scope.storageData);
                console.log(errorData);
            }, '', true)
    }


    function showModalDialog(callback, displaymsg, index, queue) {
        var deferred = $q.defer();
        var modalInstance = $uibModal.open({
            templateUrl: 'confirmMessage.html',
            controller: 'confirmMessageCtrl',
            resolve: {
                Message: function() {
                    return displaymsg;
                }
            }
        });
        modalInstance.result.then(function() {
            switch (callback) {
                case "setStorageInfo":
                    setStorageInfo(index, queue);
                    break;
                case "setRecordGeneralInfo":
                    setRecordGeneralInfo(index, queue);
                    break;
                case "storageFormatOK":
                    storageFormatOK(index);
                    break;
            }
            //on ok button press
            deferred.resolve('Success');
        }, function() {
            //on cancel button press
            deferred.resolve('Success');
        });
        return deferred.promise;
    }

    function getAttributes() {
        var defer = $q.defer();
        var idx = 0;
        if (mAttr.FileSystemTypeOptions !== undefined) {
            $scope.FileSystemTypeOptions = mAttr.FileSystemTypeOptions;
        }
        if (mAttr.DeviceType !== undefined) {
            $scope.DeviceType = mAttr.DeviceType;
        }
        if (mAttr.RecNormalModeOptions !== undefined) {
            $scope.RecNormalModeOptions = mAttr.RecNormalModeOptions;
        }
        if (mAttr.RecEventModeOptions !== undefined) {
            $scope.RecEventModeOptions = mAttr.RecEventModeOptions;
        }
        if (mAttr.RecPreEventDurationOptions !== undefined) {
            $scope.RecPreEventDurationOptions = mAttr.RecPreEventDurationOptions;
        }
        if (mAttr.RecPostEventDurationOptions !== undefined) {
            $scope.RecPostEventDurationOptions = mAttr.RecPostEventDurationOptions;
        }
        if (mAttr.RecVideoFileTypeOptions !== undefined) {
            $scope.RecVideoFileTypeOptions = mAttr.RecVideoFileTypeOptions;
        }
        if (mAttr.EnableOptions !== undefined) {
            $scope.EnableOptions = mAttr.EnableOptions;
        }
        if (mAttr.ActivateOptions !== undefined) {
            $scope.ActivateOptions = mAttr.ActivateOptions;
        }
        if (mAttr.WeekDays !== undefined) {
            $scope.WeekDays = mAttr.WeekDays;
        }
        if (mAttr.NASIPMaxLen !== undefined) {
            $scope.NASIPMaxLen = parseInt(mAttr.NASIPMaxLen.maxLength);
            $scope.IPV4Pattern = mAttr.IPv4;
        }
        if (mAttr.NASUserIDMaxLen !== undefined) {
            $scope.NASUserIDMaxLen = parseInt(mAttr.NASUserIDMaxLen.maxLength);
        }
        if (mAttr.NASPasswordMaxLen !== undefined) {
            $scope.NASPasswordMaxLen = parseInt(mAttr.NASPasswordMaxLen.maxLength);
        }
        if (mAttr.DefaultFolderMaxLen !== undefined) {
            $scope.DefaultFolderMaxLen = parseInt(mAttr.DefaultFolderMaxLen.maxLength);
        }
        if (mAttr.AutoDeleteDayOptions !== undefined) {
            $scope.AutoDeleteDayOptions.min = parseInt(mAttr.AutoDeleteDayOptions.minValue);
            $scope.AutoDeleteDayOptions.max = parseInt(mAttr.AutoDeleteDayOptions.maxValue);
            $scope.IdPattern = mAttr.OnlyNumber;
        }

        $scope.MaxChannel = mAttr.MaxChannel;

        defer.resolve("success");
        return defer.promise;
    }


    function setRecordGeneralInfo(queue) {
        var setData = {
            NormalMode : $scope.RecordGeneralInfo.NormalMode,
            EventMode : $scope.RecordGeneralInfo.EventMode,
            PreEventDuration : $scope.RecordGeneralInfo.PreEventDuration,
            PostEventDuration : $scope.RecordGeneralInfo.PostEventDuration
        };
        if($scope.MaxChannel > 1) setData.Channel = $scope.Channel;

        if (pageData.RecordGeneralInfo.RecordedVideoFileType !== $scope.RecordGeneralInfo.RecordedVideoFileType) {
            $scope.needReload = true;
        }
        setData.RecordedVideoFileType = $scope.RecordGeneralInfo.RecordedVideoFileType;

        queue.push({
            url: '/stw-cgi/recording.cgi?msubmenu=general&action=set',
            reqData: setData,
            successCallback: function(response) {
                pageData.RecordGeneralInfo = angular.copy($scope.RecordGeneralInfo);
            }
        });
    }

    function setAttribute () {
        var defer = $q.defer();

        $scope.RecordGeneralInfo.NormalMode = $scope.RecordGeneralInfo.NormalMode;
        $scope.RecordGeneralInfo.EventMode = $scope.RecordGeneralInfo.EventMode;
        $scope.RecordGeneralInfo.PreEventDuration = $scope.RecordGeneralInfo.PreEventDuration;
        $scope.RecordGeneralInfo.PostEventDuration = $scope.RecordGeneralInfo.PostEventDuration;
        $scope.RecordGeneralInfo.RecordedVideoFileType = $scope.RecordGeneralInfo.RecordedVideoFileType;

        defer.resolve('Success');
        return defer.promise;
    }

    function setRecordSchedule(queue) {
        if (!angular.equals(pageData.RecordSchedule, $scope.RecordSchedule)) {
            var setData = {};
            if($scope.MaxChannel > 1) setData.Channel = angular.copy($scope.Channel);
            setData.Activate = $scope.RecordSchedule.Activate;

            if ($scope.RecordSchedule.Activate === 'Scheduled')
            {
                var diff = $(pageData.RecordSchedule.ScheduleIds).not($scope.RecordSchedule.ScheduleIds).get(),
                    sun = 0, mon = 0, tue = 0, wed = 0, thu = 0, fri = 0, sat = 0;

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
                for (var s = 0; s < $scope.RecordSchedule.ScheduleIds.length; s++) {
                    var str = $scope.RecordSchedule.ScheduleIds[s].split('.');
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


    function setRecordingStorageInfo(queue){
        var setData = {};
        setData.Enable = $scope.RecordStorageInfo.Enable;
        setData.OverWrite = $scope.RecordStorageInfo.OverWrite;
        setData.AutoDeleteEnable = $scope.RecordStorageInfo.AutoDeleteEnable;
        if(!($scope.RecordStorageInfo.AutoDeleteDays == undefined || $scope.RecordStorageInfo.AutoDeleteDays == '')){
            setData.AutoDeleteDays = $scope.RecordStorageInfo.AutoDeleteDays;
        }

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
            //$scope.Storageinfo.Storages[index].NASConfig.NASPasswordNew = '';
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
                pageData.Storageinfo.Storages[index] = angular.copy($scope.Storageinfo.Storages[index]);
            }
        });

        var otherStorage;
        if (index === 1) otherStorage = 0;
        else otherStorage = 1;

        if ($scope.Storageinfo.Storages[otherStorage] !== undefined && !angular.equals(pageData.Storageinfo.Storages[otherStorage], $scope.Storageinfo.Storages[otherStorage])) {
            storageinfoSet(otherStorage, queue);
        }
    }

    function validatePage() {
        var retVal = true;
        if ($scope.storageForm.AutoDeleteDays.$valid === false) {
            COMMONUtils.ShowError('lang_msg_chkPeriodRange');
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

        if($scope.Storageinfo.Storages.length > 1) {
            if ($scope.Storageinfo.Storages[otherstorage].Type === 'NAS' && $scope.Storageinfo.Storages[otherstorage].Enable === 'On') {
                if (checkNas(otherstorage) === false) {
                    retVal = false;
                }
            }
        }

        if(!eventRuleService.checkSchedulerValidation()) {
            COMMONUtils.ShowError('lang_msg_checkthetable');
            retVal = false;
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
        var getData = {};
        if($scope.MaxChannel > 1) getData.Channel = $scope.Channel;

        return SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=recordingschedule&action=view', getData, function(response) {
            $scope.RecordSchedule = response.data.RecordSchedule[0];
            $scope.RecordSchedule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds($scope.RecordSchedule.Schedule));

            pageData.RecordSchedule = angular.copy($scope.RecordSchedule);
        }, function(errorData) {
            console.error(errorData);
        }, '', true);
    }

    function getRecordGeneralDetails() {
        var getData = {};
        if($scope.MaxChannel > 1) getData.Channel = $scope.Channel;

        return SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=general&action=view', getData, function(response) {
            $scope.RecordGeneralInfo = response.data.RecordSetup[0];
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
        if($scope.MaxChannel > 1) getData.Channel = $scope.Channel;
        getData.Profile = $scope.VideoProfilePolicies.RecordProfile;

        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', getData, function(response) {
            $scope.VideoProfile = response.data.VideoProfiles[0].Profiles;
            $scope.RecordProfileName = $scope.VideoProfile[0].Name;
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function changeVideoProfilePolicies() {
        var getData = {};

        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofilepolicy&action=view', getData, function(response) {
            $scope.VideoProfilePolicies = response.data.VideoProfilePolicies[$scope.Channel];

        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }




    $scope.OnStorageSelection = function(index) {
        $scope.SelectedStorage = index;
    };

    function checkNas(storageIndex) {
        if ($scope.Storageinfo.Storages[storageIndex].NASConfig.NASIP === '') {
            COMMONUtils.ShowError('lang_msg_input_ip');
            return false;
        }
        if (!COMMONUtils.CheckValidIPv4Address($scope.Storageinfo.Storages[storageIndex].NASConfig.NASIP)) {
            COMMONUtils.ShowError('lang_msg_chkIPAddress');
            return false;
        }
        if ($scope.Storageinfo.Storages[storageIndex].NASConfig.NASUserID === '') {
            COMMONUtils.ShowError('lang_msg_input_id');
            return false;
        }
        if (!COMMONUtils.TypeCheck($scope.Storageinfo.Storages[storageIndex].NASConfig.NASUserID, COMMONUtils.getALPHA() + COMMONUtils.getNUM() + COMMONUtils.getSIM())) {
            COMMONUtils.ShowError('lang_msg_invalid_idpw');
            return false;
        }
        if ($scope.Storageinfo.Storages[storageIndex].NASConfig.NASPassword !== '') {
            if (!COMMONUtils.TypeCheck($scope.Storageinfo.Storages[storageIndex].NASConfig.NASPassword, COMMONUtils.getALPHA() + COMMONUtils.getNUM() + COMMONUtils.getSIM())) {
                COMMONUtils.ShowError('lang_msg_invalid_idpw');
                return false;
            }
        }
        if ($scope.Storageinfo.Storages[storageIndex].NASConfig.DefaultFolder === '') {
            COMMONUtils.ShowError('lang_msg_input_folder');
            return false;
        }
        if (!COMMONUtils.TypeCheck($scope.Storageinfo.Storages[storageIndex].NASConfig.DefaultFolder, COMMONUtils.getALPHA() + COMMONUtils.getNUM() + COMMONUtils.getDIRECTORY())) {
            COMMONUtils.ShowError('lang_msg_invalid_folder');
            return false;
        }
        return true;
    }
    $scope.OnNASTest = function() {
        if (checkNas($scope.SelectedStorage) === false) return;
        $scope.NASTestStatus = "Connecting";
        $scope.NASTimerId = $timeout(NASConnectionTest, 500);
    };
    var NASConnectionTest = function() {
        var setData = {};
        setData.Storage = $scope.SelectedStorage + 1;
        setData.Mode = "NASTest";
        setData.NASIP = $scope.Storageinfo.Storages[$scope.SelectedStorage].NASConfig.NASIP;
        setData.NASUserID = $scope.Storageinfo.Storages[$scope.SelectedStorage].NASConfig.NASUserID;
        setData.DefaultFolder = encodeURIComponent($scope.Storageinfo.Storages[$scope.SelectedStorage].NASConfig.DefaultFolder);
        if ($scope.Storageinfo.Storages[$scope.SelectedStorage].NASConfig.NASPasswordInit === false) {
            setData.NASPassword = encodeURIComponent($scope.Storageinfo.Storages[$scope.SelectedStorage].NASConfig.NASPasswordNew);
        }

        /** If nas password is not entered by user, if any password already stored in the camera it will be used */
        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=storageinfo&action=control', setData, function(response) {
            $scope.NASTestStatus = response.data.Status;
        }, function(errorData) {
            //$scope.NASTestStatus = "Fail";
            $scope.NASTimerId = $timeout(NASConnectionTest, 1000);
        }, '', true);
    };

    function view() {
        var promises = [];
        promises.push(getStorageTableData);
        promises.push(changeVideoProfilePolicies);
        promises.push(getStorageDetails);
        promises.push(getRecordGeneralDetails);
        promises.push(getRecordingStorageDetails);
        promises.push(getRecordingSchedules);
        //promises.push(getRecordProfileDetails);

        $q.seqAll(promises).then(getRecordProfileDetails).then(setAttribute).then(function() {
            $scope.pageLoaded = true;
            UniversialManagerService.setChannelId($scope.Channel);

            $scope.$emit('recordPageLoaded', $scope.RecordSchedule.Activate);
            $rootScope.$emit('changeLoadingBar', false);

            $("#storagepage").show();
        }, function(errorData) {
            console.log(errorData);
        });
    }

    function saveStorage() {
        var deferred = $q.defer();
        var promises = [],
            queue = [],
            promise;

        function callSequence(){
            $rootScope.$emit('changeLoadingBar', true);

            SunapiClient.sequence(queue, function(){
                $scope.$emit("offAlreadyCreated", true);
                deferred.resolve();
            }, function(errorData) {
                deferred.reject(errorData);
                console.error(errorData);
            });
        }


        if (!angular.equals(pageData.RecordStorageInfo, $scope.RecordStorageInfo)) {
            setRecordingStorageInfo(queue);
        }

        if (!angular.equals(pageData.RecordGeneralInfo, $scope.RecordGeneralInfo)) {
            if ($scope.RecordGeneralInfo.RecordedVideoFileType !== pageData.RecordGeneralInfo.RecordedVideoFileType) {
                $scope.DisplayMsg = $translate.instant('lang_msg_storage_format');
                promises.push(function(){
                    return showModalDialog("setRecordGeneralInfo", $scope.DisplayMsg, queue);
                });
            } else {
                setRecordGeneralInfo(queue);
            }
        }


        if (!angular.equals(pageData.RecordSchedule, $scope.RecordSchedule)) {
            promises.push(function(){
                return setRecordSchedule(queue);
            });
        }


        if (!angular.equals(pageData.Storageinfo.Storages[$scope.SelectedStorage], $scope.Storageinfo.Storages[$scope.SelectedStorage])) {
            if ($scope.Storageinfo.Storages[$scope.SelectedStorage].Type === 'SD') {
                if (pageData.Storageinfo.Storages[$scope.SelectedStorage].FileSystem !== $scope.Storageinfo.Storages[$scope.SelectedStorage].FileSystem) {
                    $scope.DisplayMsg = $translate.instant('lang_msg_storage_format2');
                    if ($scope.Storageinfo.Storages[$scope.SelectedStorage].FileSystem === 'ext4') { // ext4
                        $scope.DisplayMsg += "\n" + $translate.instant('lang_msg_storage_format3');
                    }
                    promises.push(function(){
                        return showModalDialog("setStorageInfo", $scope.DisplayMsg, $scope.SelectedStorage, queue);
                    });
                } else {
                    setStorageInfo($scope.SelectedStorage, queue);
                }
            } else {
                setStorageInfo($scope.SelectedStorage, queue);
            }
        } else {
            //check for other storage
            var otherstorage;
            if ($scope.SelectedStorage === 0) {
                otherstorage = 1;
            } else {
                otherstorage = 0;
            }
            if ($scope.Storageinfo.Storages[otherstorage] !== undefined && !angular.equals(pageData.Storageinfo.Storages[otherstorage], $scope.Storageinfo.Storages[otherstorage])) {
                if ($scope.Storageinfo.Storages[otherstorage].Type === 'SD') {
                    if (pageData.Storageinfo.Storages[otherstorage].FileSystem !== $scope.Storageinfo.Storages[otherstorage].FileSystem) {
                        $scope.DisplayMsg = $translate.instant('lang_msg_storage_format2');
                        promises.push(function(){
                            return showModalDialog("setStorageInfo", $scope.DisplayMsg, otherstorage, queue);
                        });
                    } else {
                        setStorageInfo(otherstorage, queue);
                    }
                } else {
                    setStorageInfo(otherstorage, queue);
                }
            }
        }

        if(promises.length > 0){
            $q
                .seqAll(promises)
                .then(
                    callSequence,
                    function(errorData){
                        deferred.reject(errorData);
                    }
                );
        }else{
            console.info('is no modify');
            callSequence();
        }

        return deferred.promise;
    }

    function set() {
        var deferred = $q.defer();
        var modalInstance;
        if (validatePage()) {
            var otherstorage;
            if ($scope.SelectedStorage === 0) {
                otherstorage = 1;
            } else {
                otherstorage = 0;
            }
            if (typeof mAttr.RecordStreamLimitation !== 'undefined' && mAttr.RecordStreamLimitation === true && ((($scope.Storageinfo.Storages[$scope.SelectedStorage].Enable !== pageData.Storageinfo.Storages[$scope.SelectedStorage].Enable) && $scope.Storageinfo.Storages[$scope.SelectedStorage].Enable === 'On') || (($scope.Storageinfo.Storages[otherstorage].Enable !== pageData.Storageinfo.Storages[otherstorage].Enable) && $scope.Storageinfo.Storages[otherstorage].Enable === 'On'))) {
                COMMONUtils.ShowInfo('lang_msg_SDCapabilityLimit', function() {
                    COMMONUtils.ApplyConfirmation(function(){
                        saveStorage().then(function(){
                            deferred.resolve();
                            window.setTimeout(view, 1000);
                        }, deferred.reject);
                    });
                });
            } else {
                COMMONUtils.ApplyConfirmation(function(){
                    saveStorage().then(function(){
                        deferred.resolve();
                        window.setTimeout(view, 1000);
                    }, deferred.reject);
                });
            }
        }

        return deferred.promise;
    }

    $scope.isLoading = false;
    var mStopMonotoringStatus = false;
    var monitoringTimer = null;
    var destroyInterrupt = false;

    function startMonitoringStatus()
    {
        (function update()
        {
            getCurrentStatus(function (data) {
                if(destroyInterrupt) return;

                var tStorageinfo = data;
                if (!mStopMonotoringStatus)
                {
                    var isLoading = false;
                    for (var idx = 0; idx < tStorageinfo.Storages.length; idx = idx + 1) {
                        if (tStorageinfo.Storages[idx].Status === "") {
                            $scope.Storageinfo.Storages[idx].Status = "None";
                            $scope.Storageinfo.Storages[idx].isProcessing = false;
                        } else if (tStorageinfo.Storages[idx].Status === "Normal") {
                            $scope.Storageinfo.Storages[idx].Status = "Ready";
                            $scope.Storageinfo.Storages[idx].isProcessing = false;
                        } else if (tStorageinfo.Storages[idx].Status === "Active") {
                            $scope.Storageinfo.Storages[idx].Status = "Recording";
                            $scope.Storageinfo.Storages[idx].isProcessing = false;
                        } else if (tStorageinfo.Storages[idx].Status === "Formatting") {
                            $scope.Storageinfo.Storages[idx].Status = "Formatting";
                            $scope.Storageinfo.Storages[idx].isProcessing = false;
                            isLoading = true;
                        } else if (tStorageinfo.Storages[idx].Status === "Wait") {
                            $scope.Storageinfo.Storages[idx].Status = "Waiting";
                            $scope.Storageinfo.Storages[idx].isProcessing = true;
                            isLoading = true;
                        } else { // Error, Full
                            $scope.Storageinfo.Storages[idx].Status = tStorageinfo.Storages[idx].Status;
                            $scope.Storageinfo.Storages[idx].isProcessing = false;
                        }
                        if(tStorageinfo.Storages[idx].Status !== "Wait") {
                            $scope.Storageinfo.Storages[idx].TotalSpace = tStorageinfo.Storages[idx].TotalSpace;
                            $scope.Storageinfo.Storages[idx].UsedSpace = tStorageinfo.Storages[idx].UsedSpace;
                            var totalSize = $scope.Storageinfo.Storages[idx].TotalSpace;
                            var freeSize = $scope.Storageinfo.Storages[idx].TotalSpace - $scope.Storageinfo.Storages[idx].UsedSpace;
                            if (totalSize >= 1024 * 1024) {
                                totalSize = (totalSize / 1024 / 1024).toFixed(2);
                                $scope.Storageinfo.Storages[idx].TotalSpace = totalSize + " TB";
                            } else if (totalSize >= 1024) {
                                totalSize = (totalSize / 1024).toFixed(2);
                                $scope.Storageinfo.Storages[idx].TotalSpace = totalSize + " GB";
                            } else {
                                $scope.Storageinfo.Storages[idx].TotalSpace = totalSize + " MB";
                            }
                            if (freeSize >= 1024 * 1024) {
                                freeSize = (freeSize / 1024 / 1024).toFixed(2);
                                $scope.Storageinfo.Storages[idx].UsedSpace = freeSize + " TB";
                            } else if (freeSize >= 1024) {
                                freeSize = (freeSize / 1024).toFixed(2);
                                $scope.Storageinfo.Storages[idx].UsedSpace = freeSize + " GB";
                            } else {
                                $scope.Storageinfo.Storages[idx].UsedSpace = freeSize + " MB";
                            }
                        }
                    }
                    $scope.isLoading = isLoading;
                    monitoringTimer = $timeout(update,2900);
                }
            });
        })();
    }

    function stopMonitoringStatus(){
        if(monitoringTimer !== null){
            destroyInterrupt = true;
            $timeout.cancel(monitoringTimer);
        }
    }

    $scope.$on("$destroy", function(){
        destroyInterrupt = true;
        stopMonitoringStatus();
    });


    function getCurrentStatus(func)
    {
        var getData = {};

        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=storageinfo&action=view', getData, function(response) {

            var tStorageinfo = response.data;

            func(tStorageinfo);

        }, function(errorData) {
            console.log(errorData);
            startMonitoringStatus();
        }, '', true);
    }


    $scope.OnStorageFormat = function(index) {
        if ($scope.Storageinfo.Storages[index].Enable === false) {
            COMMONUtils.ShowError('lang_msg_fail');
            return;
        }
        $scope.SelectedStorage = index;
        if (index === 0) {
            $scope.DisplayMsg = $translate.instant('lang_msg_start_format');
            if ($scope.Storageinfo.Storages[index].FileSystem === 'ext4') { // ext4
                $scope.DisplayMsg += "\n" + $translate.instant('lang_msg_storage_format3');
            }
        } else {
            $scope.DisplayMsg = $translate.instant('lang_msg_nas_format');
        }
        showModalDialog("storageFormatOK", $scope.DisplayMsg, index);
    };

    function storageFormatOK(index) {
        var setData = {};
        setData.Storage = index + 1;
        setData.Mode = "Format";
        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=storageinfo&action=control', setData, function(response) {
            $scope.needReload = true;
            window.setTimeout(view, 1000);
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    $rootScope.$saveOn("channelSelector:selectChannel", function(event, data) {
        var okay = true;

        if(pageData.RecordSchedule.Activate == $scope.RecordSchedule.Activate) {
            if(pageData.RecordSchedule.Activate != 'Always') {
                if(!eventRuleService.checkRecordSchedulerValidation()) okay = false;
            }
        } else okay = false;


        if(!angular.equals(pageData.RecordGeneralInfo, $scope.RecordGeneralInfo)) okay = false;

        if(okay) {
            $scope.Channel = data;

            $rootScope.$emit("channelSelector:changeChannel", data);
            $rootScope.$emit('changeLoadingBar', true);

            view();
        } else {
            COMMONUtils
                .confirmChangeingChannel()
                .then(function () {
                    set().then(function(){
                        if(data !== undefined) {
                            $rootScope.$emit("channelSelector:changeChannel", data);
                            $scope.Channel = data;
                        }
                    });
                });
        }
    }, $scope);

    $rootScope.$saveOn("channelSelector:showInfo", function(event, data){
        $uibModal.open({
            size: 'lg',
            templateUrl: 'views/setup/event/modal/ModalStorageInfo.html',
            controller: 'ModalInstanceStorageInfoCtrl',
            resolve: {
                infoTableData: function(){
                    return $scope.infoTableData;
                }
            }
        });
    }, $scope);

    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function() {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            getAttributes().then(function() {
                view();
            });
        }
    })();

    $scope.submit = set;
    $scope.view = function () {
        $rootScope.$emit("changeLoadingBar", true);
        $scope.$emit("offAlreadyCreated", true);

        view();
    }
    $scope.validate = validatePage;
});

kindFramework.controller('ModalMsgCtrl', function($scope, $uibModalInstance, Attributes, Msg) {
    "use strict";
    $scope.DialogMessage = Msg;
    $scope.ok = function() {
        $uibModalInstance.close($scope.DialogMessage);
    };
    $scope.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };
});

