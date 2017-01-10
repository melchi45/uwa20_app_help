/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('soundClassificationCtrl', function ($scope, SunapiClient, XMLParser, Attributes, COMMONUtils, $timeout, CameraSpec, $q, $translate, $uibModal, $rootScope, $location) {
    "use strict";

    var mAttr = Attributes.get();
    $scope.SelectedChannel = 0;
    COMMONUtils.getResponsiveObjects($scope);
    var pageData = {};
    pageData.soundClassification = {};
    $scope.SoundClassfication = {};

    // $scope.SensitivitySliderModel = {
    //     data: 5
    // };
    // $scope.SensitivitySliderProperty =   {
    //     floor: 1,
    //     ceil: 10,
    //     showSelectionBar: true,
    //     vertical: false,
    //     showInputBox: true
    // };

    var audioanalysisView = '/stw-cgi/eventsources.cgi?msubmenu=audioanalysis&action=view';
    var audioanalysisSet = '/stw-cgi/eventsources.cgi?msubmenu=audioanalysis&action=set';

    $scope.SoundClassificationtChartOptions = {
        showInputBox : true,
        ThresholdLevel : 50,
        floor: 1,
        ceil: 100,
        width: 400,
        height: 150,
        disabled: false,
        onEnd: function(){}
    };

    $scope.$watch('SoundClassificationtChartOptions', function(newValue) {
        if(newValue.ThresholdLevel)
        {
            if($scope.SoundClassfication !== undefined)
            {
                $scope.SoundClassfication.ThresholdLevel = $scope.SoundClassificationtChartOptions.ThresholdLevel;
            }
        }
    },true);

    function getAttributes() {

        if (mAttr.EnableOptions !== undefined)
        {
            $scope.EnableOptions = mAttr.EnableOptions;
        }

        //////////////////////////////////////////////////////////////////////////////
        //////////////////// TODO : Will Change -> get from mAttr ////////////////////
        //////////////////////////////////////////////////////////////////////////////


        /////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////
        if (mAttr.ActivateOptions !== undefined)
        {
            $scope.ActivateOptions = mAttr.ActivateOptions;
        }

        if (mAttr.WeekDays !== undefined)
        {
            $scope.WeekDays = mAttr.WeekDays;
        }

        if (mAttr.AlarmoutDurationOptions !== undefined)
        {
            $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
        }

        if (mAttr.InputThresholdLevelRange !== undefined)
        {
            $scope.SoundClassificationtChartOptions.ceil = mAttr.InputThresholdLevelRange.maxValue;
            $scope.SoundClassificationtChartOptions.floor = mAttr.InputThresholdLevelRange.minValue;
        }

        if (Attributes.isSupportGoToPreset() === true)
        {
            $scope.PresetOptions = Attributes.getPresetOptions();
        }

        $scope.EventActions = COMMONUtils.getSupportedEventActions("AudioAnalysis");   // TODO : Will Change MotionDetectionV2
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
        ////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////

    }

    // $scope.$watch('SensitivitySliderModel.data', function () {
    //     if($scope.SensitivitySliderModel && $scope.SensitivitySliderModel.data){
    //         $scope.SoundClassfication.SensitivityLevel = $scope.SensitivitySliderModel.data;    
    //     }
    // });

    $scope.getTranslatedOption = function (Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };

    $scope.msgClick = function(){
        $location.path('/setup/videoAudio_audioSetup');
    };

    $scope.setAudioanalysisEnable = function () {
        var modalInstance = $uibModal.open({
            templateUrl: 'views/setup/common/confirmMessage.html',
            controller: 'confirmMessageCtrl',
            size: 'sm',
            resolve: {
                Message: function ()
                {
                    return 'lang_apply_question';
                }
            }
        });

        modalInstance.result.then(
            function (){
                var setData = {};

                setData.Channel = 0;

                if (pageData.SoundClassfication.Enable !== $scope.SoundClassfication.Enable)
                {
                    setData.Enable = $scope.SoundClassfication.Enable;
                }

                return SunapiClient.get(audioanalysisSet, setData,
                    function (response)
                    {
                        pageData.SoundClassfication.Enable = angular.copy($scope.SoundClassfication.Enable);
                    },
                    function (errorData)
                    {
                        $scope.SoundClassfication.Enable = angular.copy(pageData.SoundClassfication.Enable);
                        console.log(errorData);
                    }, '', true);
            },
            function ()
            {
                $scope.SoundClassfication.Enable = angular.copy(pageData.SoundClassfication.Enable);
            }
        );
    };

    function view(data) {
        if(data === 0) {
            $rootScope.$emit('resetScheduleData', true);
        }
        var promises = [];
        promises.push(getSoundClassificationData);
        ////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////
        promises.push(getEventRules);
        ////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////        

        $q.seqAll(promises).then(
            function(){
                $scope.pageLoaded = true;
                $("#imagepage").show();
            },
            function(errorData){
                alert(errorData);
            }
        );
    }

    function getSoundClassificationData(){
        var getData = {};

        return SunapiClient.get(
            audioanalysisView, 
            getData,
            function (response){
                // if((response.data.AudioAnalysis[0].SensitivityLevel < 1) ||
                //    (response.data.AudioAnalysis[0].SensitivityLevel > 10)){
                //     response.data.AudioAnalysis[0].SensitivityLevel = 5;
                // }
                var responseData = response.data.AudioAnalysis;
                pageData.SoundClassfication = angular.copy(responseData[0]);

                $scope.SoundClassfication = responseData[0];

                // $scope.SensitivitySliderModel = {
                //     data : $scope.SoundClassfication.SensitivityLevel
                // };

                $scope.SoundClassificationtChartOptions.ThresholdLevel = responseData[0].ThresholdLevel;
                prepareSoundType();
            },
            function (errorData)
            {
                console.log(errorData);
            }, '', true);

    }

    var soundTypeList = [
        'lang_screamsound',
        'lang_gunshotsound',
        'lang_explosionsound',
        'lang_galsscrashsound'
    ];

    var soundTypeOptions = [
        "Scream",
        "Gunshot",
        "Explosion",
        "GlassBreak"
    ];

    function convertSoundTypeForSunapi(key){
        for(var i = 0, ii = soundTypeList.length; i < ii; i++){
            if(soundTypeList[i] === key){
                return soundTypeOptions[i];
            }
        }

        return false;
    }

    function prepareSoundType(){

        var soundType = $scope.SoundClassfication.SoundType;

        $scope.SoundClassfication.SoundType = {};

        for(var i = 0, ii = soundTypeList.length; i < ii; i++){
            var key = soundTypeList[i];
            var option = convertSoundTypeForSunapi(key);
            var val = soundType.indexOf(option) > -1;
            $scope.SoundClassfication.SoundType[key] = val;
        }
    }

    var mStopMonotoringSoundLevel = false;
    var monitoringTimer = null;
    var destroyInterrupt = false;
    var maxSample = 5;

    $scope.$on("$destroy", function(){
        destroyInterrupt = true;
        stopMonitoringSoundLevel();
    });

    function startMonitoringSoundLevel()
    {
        (function update()
        {
            getSoundLevel(function (data) {
                if(destroyInterrupt) return;
                var newSoundLevel = angular.copy(data);

                if (!mStopMonotoringSoundLevel)
                {
                    if (newSoundLevel.length >= maxSample)
                    {
                        var index = newSoundLevel.length;

                        while(index--)
                        {
                            var level = validateLevel(newSoundLevel[index]);

                            if(level === null) continue;

                            if($scope.SoundClassificationtChartOptions.EnqueueData)
                            {
                                $scope.SoundClassificationtChartOptions.EnqueueData(level);
                            }
                        }
                    }
                    monitoringTimer = $timeout(update, 300); //300 msec
                }
            });
        })();
    }

    function stopMonitoringSoundLevel(){
        if(monitoringTimer !== null){
            $timeout.cancel(monitoringTimer);
        }
    }

    var mLastSequenceLevel = 0;
    function validateLevel(soundLevelObject)
    {
        if (mLastSequenceLevel > soundLevelObject.SequenceID)
        {
            return null;
        }

        mLastSequenceLevel = soundLevelObject.SequenceID;

        return soundLevelObject.Level;
    }

    function getSoundLevel(func)
    {
        var newSoundLevel = {};

        var getData = {};

        getData.MaxSamples = maxSample;

        getData.EventSourceType = 'AudioAnalysis';

        var sunapiURL = '/stw-cgi/eventsources.cgi?msubmenu=samples&action=check';

        return SunapiClient.get(sunapiURL, getData,
            function (response)
            {
                newSoundLevel = angular.copy(response.data.AudioAnalysis[0].Samples);
                if (func !== undefined) {
                    func(newSoundLevel);
                }
            },
            function (errorData)
            {
                console.log("getSoundLevel Error : ", errorData);
                startMonitoringSoundLevel();
            }, '', true);
    }


    function set() {
        COMMONUtils.ApplyConfirmation(saveSettings);
    }

    function saveSettings() {   // soundClassification set -> event set
        stopMonitoringSoundLevel();
        setSoundClassificationData(
            function(){
                $q.seqAll([setEventRules]).then(
                    function(){
                        view();
                    },
                    function(errorData){
                        console.log(errorData);
                    }
                ).finally(function(){
                    startMonitoringSoundLevel();
                });
            }
        );
    }

    function setSoundClassificationData(callBack){
        var setData = {};

        if(validation()){
            callBack();
        }else{
            for(var reqKey in pageData.SoundClassfication){
                if(reqKey == "SoundType") continue;
                if(pageData.SoundClassfication[reqKey] !== $scope.SoundClassfication[reqKey]){
                    setData[reqKey] = $scope.SoundClassfication[reqKey];
                }
            }

            setData['SoundType'] = getSettedSoundType().join(',');

            SunapiClient.get(
                audioanalysisSet, 
                setData,
                function (response) {
                    callBack();
                },
                function (errorData) {
                    console.log(errorData);
                }, '', true);
        }

        function validation(){
            var isOk = true;
            var soundType = getSettedSoundType();

            if(
                !angular.equals(pageData.SoundClassfication, $scope.SoundClassfication) ||
                !angular.equals(pageData.SoundType, soundType)){
                isOk = false;
            }

            return isOk;
        }

        function getSettedSoundType(){
            var soundType = [];

            for(var soundTypeKey in $scope.SoundClassfication.SoundType){
                if($scope.SoundClassfication.SoundType[soundTypeKey] === true){
                    soundType.push(convertSoundTypeForSunapi(soundTypeKey));
                }
            }

            return soundType;
        }
    }

    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            getAttributes();
            view();
            startMonitoringSoundLevel();
        }
    })();

    $scope.submit = set;
    $scope.view = view;

    ////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////
    function getEventRules() {
        var getData = {};

        getData.EventSource = 'AudioAnalysis';

        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', getData,
                function (response){
                    var responseData = response.data.EventRules;
                    if(responseData.length > 0){
                        prepareEventRules(responseData);   
                    }
                },
                function (errorData)
                {
                    console.log(errorData);
                }, '', true);
    }

    function prepareEventRules(eventRules) {
        $scope.EventRule = {};

        $scope.EventRule.FtpEnable = false;
        $scope.EventRule.SmtpEnable = false;
        $scope.EventRule.RecordEnable = false;

        $scope.EventRule.Enable = eventRules[0].Enable;
        $scope.EventRule.RuleIndex = eventRules[0].RuleIndex;

        $scope.EventRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventRules[0].Schedule));

        $scope.EventRule.ScheduleType = eventRules[0].ScheduleType;

        if (typeof eventRules[0].EventAction !== 'undefined')
        {
            if (eventRules[0].EventAction.indexOf('FTP') !== -1)
            {
                $scope.EventRule.FtpEnable = true;
            }

            if (eventRules[0].EventAction.indexOf('SMTP') !== -1)
            {
                $scope.EventRule.SmtpEnable = true;
            }

            if (eventRules[0].EventAction.indexOf('Record') !== -1)
            {
                $scope.EventRule.RecordEnable = true;
            }
        }

        $scope.EventRule.AlarmOutputs = [];
        if (typeof eventRules[0].AlarmOutputs === 'undefined')
        {
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++)
            {
                $scope.EventRule.AlarmOutputs[ao] = {};
                $scope.EventRule.AlarmOutputs[ao].Duration = 'Off';
            }
        } else
        {
            for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++)
            {
                $scope.EventRule.AlarmOutputs[ao] = {};

                var duration = 'Off';
                for (var j = 0; j < eventRules[0].AlarmOutputs.length; j++)
                {
                    if (ao + 1 === eventRules[0].AlarmOutputs[j].AlarmOutput)
                    {
                        duration = eventRules[0].AlarmOutputs[j].Duration;
                        break;
                    }
                }
                $scope.EventRule.AlarmOutputs[ao].Duration = duration;
            }
        }

        if (typeof eventRules[0].PresetNumber === 'undefined')
        {
            $scope.EventRule.PresetNumber = 'Off';
        } else
        {
            $scope.EventRule.PresetNumber = eventRules[0].PresetNumber + '';
        }

        pageData.EventRule = angular.copy($scope.EventRule);
    }

    function setEventRules()
    {
        var setData = {};

        setData.RuleIndex = $scope.EventRule.RuleIndex;

        setData.EventAction = "";
        if ($scope.EventRule.FtpEnable)
        {
            setData.EventAction += 'FTP,';
        }

        if ($scope.EventRule.SmtpEnable)
        {
            setData.EventAction += 'SMTP,';
        }

        if ($scope.EventRule.RecordEnable)
        {
            setData.EventAction += 'Record,';
        }

        for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++)
        {
            if ($scope.EventRule.AlarmOutputs[ao].Duration !== 'Off')
            {
                setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                setData["AlarmOutput." + (ao + 1) + ".Duration"] = $scope.EventRule.AlarmOutputs[ao].Duration;
            }
        }

        if ($scope.EventRule.PresetNumber !== 'Off')
        {
            setData.EventAction += 'GoToPreset,';
            setData.PresetNumber = $scope.EventRule.PresetNumber;
        }

        if (setData.EventAction.length)
        {
            setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
        }

        setData.ScheduleType = $scope.EventRule.ScheduleType;
        //if ($scope.EventRule.ScheduleType === 'Scheduled')
        {
            var diff = $(pageData.EventRule.ScheduleIds).not($scope.EventRule.ScheduleIds).get();

            var sun = 0, mon = 0, tue = 0, wed = 0, thu = 0, fri = 0, sat = 0;

            for (var s = 0; s < diff.length; s++)
            {
                var str = diff[s].split('.');

                for (var d = 0; d < mAttr.WeekDays.length; d++)
                {
                    if (str[0] === mAttr.WeekDays[d])
                    {
                        switch (d)
                        {
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

            for (var s = 0; s < $scope.EventRule.ScheduleIds.length; s++)
            {
                var str = $scope.EventRule.ScheduleIds[s].split('.');

                for (var d = 0; d < mAttr.WeekDays.length; d++)
                {
                    if (str[0] === mAttr.WeekDays[d])
                    {
                        switch (d)
                        {
                            case 0:
                                sun = 1;
                                setData["SUN" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["SUN" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 1:
                                mon = 1;
                                setData["MON" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["MON" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 2:
                                tue = 1;
                                setData["TUE" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["TUE" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 3:
                                wed = 1;
                                setData["WED" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["WED" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 4:
                                thu = 1;
                                setData["THU" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["THU" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 5:
                                fri = 1;
                                setData["FRI" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["FRI" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            case 6:
                                sat = 1;
                                setData["SAT" + str[1]] = 1;
                                if (str.length === 4)
                                {
                                    setData["SAT" + str[1] + ".FromTo"] = str[2] + '-' + str[3];
                                }
                                break;

                            default:
                                break;
                        }
                    }
                }
            }

            if (sun)
            {
                setData.SUN = 1;
            }

            if (mon)
            {
                setData.MON = 1;
            }

            if (tue)
            {
                setData.TUE = 1;
            }

            if (wed)
            {
                setData.WED = 1;
            }

            if (thu)
            {
                setData.THU = 1;
            }

            if (fri)
            {
                setData.FRI = 1;
            }

            if (sat)
            {
                setData.SAT = 1;
            }
        }

        return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=update', setData,
                function (response){
                    $timeout(view);
                },
                function (errorData)
                {
                    pageData.EventRule = angular.copy($scope.EventRule);
                    console.log(errorData);
                }, '', true);
    }

    function validatePage()
    {
        if ($scope.EventRule.ScheduleType === 'Scheduled' && $scope.EventRule.ScheduleIds.length === 0)
        {
            COMMONUtils.ShowError('lang_msg_checkthetable');
            return false;
        }
        return true;
    }

$scope.setColor = function (day, hour, isAlways)
    {
        for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++)
        {
            if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour + '.') >= 0)
            {
                if (isAlways)
                {
                    return 'setMiniteFaded';
                } else
                {
                    return 'setMinite already-selected ui-selected';
                }
            }
        }

        if ($scope.EventRule.ScheduleIds.indexOf(day + '.' + hour) !== -1)
        {
            if (isAlways)
            {
                return 'setHourFaded';
            } else
            {
                return 'setHour already-selected ui-selected';
            }
        }
    };

    $scope.mouseOver = function (day, hour)
    {
        $scope.MouseOverMessage = [];
        for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++)
        {
            if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour) >= 0)
            {
                $scope.MouseOverMessage = $scope.EventRule.ScheduleIds[i].split('.');
                break;
            }
        }
    };

    $scope.mouseLeave = function ()
    {
        $scope.MouseOverMessage = [];
    };

    $(document).ready(function ()
    {
        $('[data-toggle="tooltip"]').tooltip();
    });

    $scope.getTooltipMessage = function ()
    {
        if (typeof $scope.MouseOverMessage !== 'undefined')
        {
            var hr, fr, to;

            if($scope.MouseOverMessage.length === 2) {
                var hr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[1], 2);
                var fr = '00';
                var to = '59';
            } else if($scope.MouseOverMessage.length === 4) {
                var hr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[1], 2);
                var fr = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[2], 2);
                var to = COMMONUtils.getFormatedInteger($scope.MouseOverMessage[3], 2);
            } else {
                return;
            }

            return "(" + $translate.instant($scope.MouseOverMessage[0]) + ") " + hr + ":" + fr + " ~ " + hr + ":" + to;
        }
    };

    $scope.clearAll = function ()
    {
        $timeout(function(){
            $scope.EventRule.ScheduleIds = [];
        });
    };

    $scope.open = function (day, hour)
    {
        $scope.SelectedDay = day;
        $scope.SelectedHour = hour;

        $scope.SelectedFromMinute = 0;
        $scope.SelectedToMinute = 59;
        for (var i = 0; i < $scope.EventRule.ScheduleIds.length; i++)
        {
            if ($scope.EventRule.ScheduleIds[i].indexOf(day + '.' + hour + '.') >= 0)
            {
                var str = $scope.EventRule.ScheduleIds[i].split('.');

                if (str.length === 4)
                {
                    $scope.SelectedFromMinute = Math.round(str[2]);
                    $scope.SelectedToMinute = Math.round(str[3]);
                }
                break;
            }
        }

        var modalInstance = $uibModal.open({
            size: 'lg',
            templateUrl: 'views/setup/common/schedulePopup.html',
            controller: 'modalInstanceCtrl',
            resolve: {
                SelectedDay: function ()
                {
                    return $scope.SelectedDay;
                },
                SelectedHour: function ()
                {
                    return $scope.SelectedHour;
                },
                SelectedFromMinute: function ()
                {
                    return $scope.SelectedFromMinute;
                },
                SelectedToMinute: function ()
                {
                    return $scope.SelectedToMinute;
                },
                Rule: function ()
                {
                    return $scope.EventRule;
                }
            }
        });

        modalInstance.result.then(function (selectedItem)
        {
            //console.log("Selected : ",selectedItem);
        }, function ()
        {
            //$log.info('Modal dismissed at: ' + new Date());
        });
    };
    ////////////////////////////<<FOR SCHEDULE CODE>>/////////////////////////////

});
