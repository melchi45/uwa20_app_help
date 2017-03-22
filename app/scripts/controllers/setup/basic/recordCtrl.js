kindFramework.controller('recordCtrl', function ($scope, $uibModal, $timeout, $cookieStore, $rootScope, $location,
    SunapiClient, XMLParser, Attributes, COMMONUtils, LogManager, SessionOfUserManager, ModalManagerService, CameraSpec, $q, $filter) {

    "use strict";
    $scope.pageLoaded = false;
    $scope.EventSource = "Storage";

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
    $scope.channelSelectionSection = (function(){
        var currentChannel = 0;

        return {
            getCurrentChannel: function(){
                return currentChannel;
            },
            setCurrentChannel: function(index){
                currentChannel = index;
            }
        }
    })();

    function getAttributes() {
        var defer = $q.defer();
        var idx = 0;

        $scope.Channel = 0;
        $scope.pro = 0;
        $scope.ActivateOptions = mAttr.ActivateOptions;
        $scope.maxChannel = mAttr.MaxChannel;

        // enable setting types
        // 지정 가능한 세팅 종류
        $scope.RecNormalModeOptions = mAttr.RecNormalModeOptions;
        $scope.RecEventModeOptions = mAttr.RecEventModeOptions;
        $scope.RecPreEventDurationOptions = mAttr.RecPreEventDurationOptions;
        $scope.RecPostEventDurationOptions = mAttr.RecPostEventDurationOptions;
        $scope.RecVideoFileTypeOptions = mAttr.RecVideoFileTypeOptions;
        $scope.EnableOptions = mAttr.EnableOptions;
        
        $scope.WeekDays = mAttr.WeekDays;
        $scope.DefaultFolderMaxLen = parseInt(mAttr.DefaultFolderMaxLen.maxLength);
        $scope.IdPattern = mAttr.OnlyNumber;

        defer.resolve('Success');
        return defer.promise;
    }

    function setRecordGeneralInfo(index, queue) {
        var setData = {};
        setData.NormalMode = $scope.RecordGeneralInfo.NormalMode;
        setData.EventMode = $scope.RecordGeneralInfo.EventMode;
        setData.PreEventDuration = $scope.RecordGeneralInfo.PreEventDuration;
        setData.PostEventDuration = $scope.RecordGeneralInfo.PostEventDuration;

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

    function setRecordingStorageInfo(queue){
        var setData = {};
        setData.Enable = $scope.RecordStorageInfo.Enable;
        setData.OverWrite = $scope.RecordStorageInfo.OverWrite;
        setData.AutoDeleteEnable = $scope.RecordStorageInfo.AutoDeleteEnable;
        queue.push({
            url: '/stw-cgi/recording.cgi?msubmenu=storage&action=set',
            reqData: setData,
            successCallback: function(response) {
                pageData.RecordStorageInfo = angular.copy($scope.RecordStorageInfo);
            }
        });
    }

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

            if ($scope.RecordSchedule.Activate === 'Scheduled' && $scope.RecordSchedule.ScheduleIds.length === 0) {
                COMMONUtils.ShowError('lang_msg_checkthetable');
                retVal = false;
            }

        return retVal;
    }

    function getRecordingSchedules() {
        var getData = {
            Channel: $scope.Channel
        };
        
        return SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=recordingschedule&action=view', getData, function(response) {
            $scope.RecordSchedule = response.data.RecordSchedule;
            
            for (var i = 0; i < $scope.RecordSchedule.length; i++) {
                $scope.RecordSchedule[i].ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds($scope.RecordSchedule[i].Schedule));
            }
            
            pageData.RecordSchedule = angular.copy($scope.RecordSchedule);
        }, function(errorData) {
            console.error(errorData);
        }, '', true);
    }

    function getRecordGeneralDetails() {
        var getData = {
            Channel: $scope.Channel
        };

        return SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=general&action=view', getData, function(response) {
            $scope.RecordGeneralInfo = response.data.RecordSetup[0];
            pageData.RecordGeneralInfo = angular.copy($scope.RecordGeneralInfo);
        }, function(errorData) {
            console.error(errorData);
        }, '', true);
    }

    function getRecordingStorageDetails() {
        var getData = {
            Channel: $scope.Channel
        };
        return SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=storage&action=view', getData, function(response) {
            $scope.RecordStorageInfo = response.data.storage[0];
            pageData.RecordStorageInfo = angular.copy($scope.RecordStorageInfo);
        }, function(errorData) {
            console.error(errorData);
        }, '', true);
    }

    function setAttribute () {
        var defer = $q.defer();

        $scope.recordSetting.NormalMode = $scope.RecordGeneralInfo.NormalMode;
        $scope.recordSetting.EventMode = $scope.RecordGeneralInfo.EventMode;
        $scope.recordSetting.PreEventDuration = $scope.RecordGeneralInfo.PreEventDuration;
        $scope.recordSetting.PostEventDuration = $scope.RecordGeneralInfo.PostEventDuration;
        $scope.recordSetting.RecordedVideoFileType = $scope.RecordGeneralInfo.RecordedVideoFileType;
        $scope.RecordSchedule.Activate = $scope.RecordSchedule[$scope.Channel].Activate;
        $scope.recordSetting.Activate = $scope.RecordSchedule;

        defer.resolve('Success');
        return defer.promise;
    }

    function view() {
        var promises = [];
        promises.push(getRecordingSchedules);
        promises.push(getRecordGeneralDetails);
        promises.push(getRecordingStorageDetails);

        $q.seqAll(promises).then(setAttribute).then(function() {
            $scope.pageLoaded = true;
            $rootScope.$emit('changeLoadingBar', false);
        }, function(errorData) {
            console.error(errorData);
        });
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

    function saveStorage() {
        var promises = [],
            queue = [],
            needRefresh = false,
            promise;

        function callSequence(){
            SunapiClient.sequence(queue, function(){
                if (needRefresh) {
                    window.setTimeout(RefreshPage, 1000);
                }
            }, function(errorData) {});
        }

        if (!angular.equals(pageData.RecordGeneralInfo, $scope.RecordGeneralInfo)) {
            if ($scope.RecordGeneralInfo.RecordedVideoFileType !== pageData.RecordGeneralInfo.RecordedVideoFileType) {
                $scope.DisplayMsg = $translate.instant('lang_msg_storage_format');
                promises.push(function(){
                    return showModalDialog("setRecordGeneralInfo", $scope.DisplayMsg, $scope.Channel, queue);
                });
            } else {
                setRecordGeneralInfo($scope.Channel, queue);
            }
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
                    needRefresh = true;
                } else {
                    setStorageInfo($scope.SelectedStorage, queue);
                    needRefresh = true;
                }
            } else {
                setStorageInfo($scope.SelectedStorage, queue);
                needRefresh = true;
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
                        needRefresh = true;
                    } else {
                        setStorageInfo(otherstorage, queue);
                        needRefresh = true;
                    }
                } else {
                    setStorageInfo(otherstorage, queue);
                    needRefresh = true;
                }
            }
        }

        if(promises.length > 0){
            $q
                .seqAll(promises)
                .then(
                    callSequence, 
                    function(errorData){}
                );   
        }else{
            callSequence();            
        }
    }


    function saveSettings() {
        var promises = [];
    }

    function set() {
        var modalInstance;
        if (validatePage()) {
            COMMONUtils.ShowInfo('lang_msg_SDCapabilityLimit', function() {
                COMMONUtils.ApplyConfirmation(saveStorage);
            });
        }

        console.log($scope.recordSetting);
        // COMMONUtils.ApplyConfirmation(saveSettings);
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

    $rootScope.$saveOn("channelSelector:selectChannel", function(event, data) {
        $scope.channelSelectionSection.setCurrentChannel(data);
        $rootScope.$emit('changeLoadingBar', true);
        
        view();
    }, $scope);

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
