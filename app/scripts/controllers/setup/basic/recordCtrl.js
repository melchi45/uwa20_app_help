kindFramework.controller('recordCtrl', function ($scope, $uibModal, $timeout, $rootScope, $location,
    SunapiClient, Attributes, COMMONUtils, LogManager, SessionOfUserManager, CameraSpec, $q, $filter, $translate, eventRuleService) {

    "use strict";
    $scope.pageLoaded = false;
    $scope.EventSource = "Record";

    COMMONUtils.getResponsiveObjects($scope);

    if (SessionOfUserManager.IsLoggedin()) {
        LogManager.debug("Setup login is success.");
    }

    var mAttr = Attributes.get("media");
    var pageData = {};

    $scope.showAdvancedMenu = false;
    $scope.showAdvancedLabel = 'lang_show';
    $scope.getTranslatedOption = COMMONUtils.getTranslatedOption;
    $scope.RecordGeneralInfo = {};
    $scope.channelSelectionSection = (function(){
        var currentChannel = 0;

        return {
            getCurrentChannel: function(){
                $scope.Channel = currentChannel;
                return currentChannel;
            },
            setCurrentChannel: function(index){
                $scope.Channel = index;
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
        $scope.MaxChannel = mAttr.MaxChannel;

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

    function getRecordGeneralDetails() {
        var getData = {};
        if($scope.MaxChannel > 1) getData.Channel = $scope.Channel;

        return SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=general&action=view', getData, function(response) {
            $scope.RecordGeneralInfo = response.data.RecordSetup[0];
            pageData.RecordGeneralInfo = angular.copy($scope.RecordGeneralInfo);

            console.log($scope.RecordGeneralInfo, 'general record data');
        }, function(errorData) {
            console.error(errorData);
        }, '', true);
    }

    function getRecordingSchedules() {
        var getData = {};
        if($scope.MaxChannel > 1) getData.Channel = $scope.Channel;
        
        return SunapiClient.get('/stw-cgi/recording.cgi?msubmenu=recordingschedule&action=view', getData, function(response) {
            $rootScope.$emit('resetScheduleData', true);
            $scope.RecordSchedule = response.data.RecordSchedule[0];
            $scope.RecordSchedule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds($scope.RecordSchedule.Schedule));

            console.log($scope.RecordSchedule);

            pageData.RecordSchedule = angular.copy($scope.RecordSchedule);
        }, function(errorData) {
            console.error(errorData);
        }, '', true);
    }

    function getProfileDetails() {
        var getData = {};
        if($scope.MaxChannel > 1) getData.Channel = $scope.Channel;

        // /stw-cgi/media.cgi?msubmenu=videoprofilepolicy&action=view&Channel=0&SunapiSeqId=64
        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', getData, function(response) {
            $scope.VideoProfile = response.data.VideoProfiles[0].Profiles;
            // console.info(response.data.VideoProfiles[0]);
            // $scope.RecordProfileName = $scope.VideoProfile.Name;

        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function getRecordProfile() {
        var getData = {}
        if($scope.MaxChannel > 1) getData.Channel = $scope.Channel;

        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofilepolicy&action=view', getData, function(response) {
            $scope.RecordProfileId = response.data.VideoProfilePolicies[0].RecordProfile;
        }, function(errorData) {
            console.log(errorData);
        }, '', true);
    }

    function setAttribute () {
        var defer = $q.defer();

        for(var i = 0; i<$scope.VideoProfile.length; i++) {
            if($scope.VideoProfile[i].Profile == $scope.RecordProfileId) {
                $scope.RecordProfileName = $scope.VideoProfile[i].Name;
            }
        }

        $scope.RecordGeneralInfo.NormalMode = $scope.RecordGeneralInfo.NormalMode;
        $scope.RecordGeneralInfo.EventMode = $scope.RecordGeneralInfo.EventMode;
        $scope.RecordGeneralInfo.PreEventDuration = $scope.RecordGeneralInfo.PreEventDuration;
        $scope.RecordGeneralInfo.PostEventDuration = $scope.RecordGeneralInfo.PostEventDuration;
        $scope.RecordGeneralInfo.RecordedVideoFileType = $scope.RecordGeneralInfo.RecordedVideoFileType;
        $scope.RecordSchedule.Activate = $scope.RecordSchedule.Activate;

        defer.resolve('Success');
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

        console.log(setData, 'set record general');

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

    function setRecordSchedule(queue) {
        if (!angular.equals(pageData.RecordSchedule, $scope.RecordSchedule)) {
            var setData = {};
            if($scope.MaxChannel > 1) setData.Channel = $scope.Channel;
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
            console.log(setData);
            queue.push({
                url: '/stw-cgi/recording.cgi?msubmenu=recordingschedule&action=set',
                reqData: setData
            });
        }
        pageData.RecordSchedule = angular.copy($scope.RecordSchedule);
    }

    function RefreshPage() {
        //window.location.href = $scope.relocateUrl;
        if ($scope.needReload === true) {
            $scope.needReload = false;
            window.location.reload(true);
        }
    }

    function validatePage() {
        if(!eventRuleService.checkSchedulerValidation()) {
            COMMONUtils.ShowError('lang_msg_checkthetable');
            return false;
        }
        return true;
    }

    function view() {
        var promises = [];
        promises.push(getRecordingSchedules);
        promises.push(getRecordGeneralDetails);
        promises.push(getProfileDetails);
        promises.push(getRecordProfile);


        $q.seqAll(promises).then(setAttribute).then(function() {
            $scope.pageLoaded = true;
            $scope.$emit('recordPageLoaded', $scope.RecordSchedule.Activate);
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

    function showModalDialog(callback, displaymsg, index, queue) {
        var deferred = $q.defer();
        var modalInstance = $uibModal.open({
            templateUrl: 'views/setup/common/confirmMessage.html',
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

    function saveRecord() {
        var promises = [],
            queue = [],
            showMsg = true,
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
                showMsg = false;
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
                COMMONUtils.ApplyConfirmation(saveRecord);
            });
        }
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
