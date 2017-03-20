kindFramework.controller('sequenceCtrl', function ($scope, $uibModal, $timeout, $translate, SunapiClient, Attributes, COMMONUtils, $q)
{
    "use strict";

    var mAttr = Attributes.get();

    var pageData = {};

    $scope.clearSchedule = function ()
    {
        $scope.AutoRun.ModeSchedule.Schedules = [];
        $scope.AutoRun.ModeSchedule.Schedules[0] = {};
        $scope.AutoRun.ModeSchedule.Schedules[0].FromTo = "SUN 00:00-SAT 24:00";
        $scope.AutoRun.ModeSchedule.Schedules[0].ScheduleMode = 'Home';
        reloadScheduler();
    };

    $scope.setColor = function (day, hour)
    {
        if ($scope.AutoRunScheduler[day][hour].Mode === 'Home')
        {
            return {background: "#54c0ff"};
        }
        else if ($scope.AutoRunScheduler[day][hour].Mode === 'Preset')
        {
            return {background: "#ffa52f"};
        }
        else if ($scope.AutoRunScheduler[day][hour].Mode === 'Swing')
        {
            return {background: "#5eec5f"};
        }
        else if ($scope.AutoRunScheduler[day][hour].Mode === 'Group')
        {
            return {background: "#923ee6"};
        }
        else if ($scope.AutoRunScheduler[day][hour].Mode === 'Tour')
        {
            return {background: "#ef5ca8"};
        }
        else if ($scope.AutoRunScheduler[day][hour].Mode === 'Trace')
        {
            return {background: "#ffff77"};
        }
        else if ($scope.AutoRunScheduler[day][hour].Mode === 'AutoPan')
        {
            return {background: "#3464ff"};
        }
    };

    $scope.getTranslatedOption = function (Option)
    {
        return COMMONUtils.getTranslatedOption(Option);
    };

    $scope.startStopSwing = function (Option)
    {
        controlSwing(Option);
    };

    $scope.startStopGroup = function (Option)
    {
        var groupId = parseInt($scope.GroupOptions[$scope.Group.SelectedIndex]);

        if ($scope.GroupsSet.indexOf(groupId) !== -1)
        {
            controlGroup(Option, groupId);
        }
    };

    $scope.startStopTour = function (Option)
    {
        controlTour(Option);
    };

    $scope.startStopTrace = function (Option)
    {
        controlTrace(Option);
    };

    $scope.removeGroups = function ()
    {
        var groupId = parseInt($scope.GroupOptions[$scope.Group.SelectedIndex]);

        if ($scope.GroupsSet.indexOf(groupId) !== -1)
        {
            COMMONUtils.ShowConfirmation(function(){
                removeGroup(groupId);
            },'lang_msg_confirm_remove_profile','sm');
        }
    };

    $scope.removeTours = function ()
    {
        COMMONUtils.ShowConfirmation(function(){
            removeTour();
        },'lang_msg_confirm_remove_profile','sm');
    };

    $scope.setGroup = function ()
    {
    	var groupId = parseInt($scope.GroupOptions[$scope.Group.SelectedIndex]);
    	var gIdx = groupId-1;
    	if (!angular.equals(pageData.Groups[gIdx], $scope.Groups[gIdx])){

            COMMONUtils.ShowConfirmation(function(){
                // group remove
                var removeSetGroup = function(GroupId, fnSuccess, fnError){
                    var setData = {};
                    setData.Channel = 0;
                    setData.Group = groupId;
                    SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=group&action=remove', setData, fnSuccess, fnError, '', true);
                };

                // group save
                var groupCurrSet = function(){
                    var setData = {
                        'PTZGroups' :
                            [
                                {
                                    'Channel' : 0,
                                    'Groups' :
                                        [
                                            {
                                                "Group" : gIdx+1,
                                                "PresetSequences" : []
                                            }
                                        ]
                                }
                            ]
                    };
                    for (var p = 0; p < $scope.MaxPresetsPerGroup; p++)
                    {
                        if ($scope.Groups[gIdx].PresetList[p].SelectedPresetIndex != 0){
                            setData.PTZGroups[0].Groups[0].PresetSequences.push({
                                "PresetSequence": p + 1,
                                "Preset": parseInt($scope.Groups[gIdx].PresetList[p].SelectedPresetIndex,10),
                                "Speed": parseInt($scope.Groups[gIdx].PresetList[p].Speed,10),
                                "DwellTime": parseInt($scope.Groups[gIdx].PresetList[p].DwellTime,10)
                            });
                        }
                    }

                    var specialHeaders = [];
                    specialHeaders[0] = {};
                    specialHeaders[0].Type = 'Content-Type';
                    specialHeaders[0].Header = 'application/x-www-form-urlencoded';

                    var jsonString = JSON.stringify(setData);
                    //console.log(jsonString);
                    var encodeddata = encodeURI(jsonString);
                    return SunapiClient.post('/stw-cgi/ptzconfig.cgi?msubmenu=group&action=set', {},
                        function (response) {
                            $scope.pageLoaded = false;
                            view();
                        },
                        function (errorData) {
                        }, $scope, encodeddata, specialHeaders);
                };

                if (validateGroup(gIdx)){
                    if ($scope.GroupsSet.indexOf(gIdx + 1) !== -1){
                        removeSetGroup(gIdx,groupCurrSet,function(){});
                    } else {
                        groupCurrSet();
                    }
                }
            },'lang_set_question','sm');
    	}
    };

    $scope.setSwing = function ()
    {
        if (!angular.equals(pageData.Swings, $scope.Swings))
        {
            var index = $scope.SwingMode.SelectedIndex;
            if (!angular.equals(pageData.Swings[index], $scope.Swings[index]))
            {
                COMMONUtils.ShowConfirmation(function(){
                    if (validateSwing(index))
                    {
                        setSwing($scope.SwingModes[index], index);
                    }
                },'lang_set_question','sm');
            }
        }
    };

    $scope.setTour = function ()
    {
        if (!angular.equals(pageData.GroupSequences, $scope.GroupSequences))
        {
            COMMONUtils.ShowConfirmation(function(){
                var tourPostSet = function(){
                    var postStop = false;
                    var setData = {
                        "PTZTours": [
                            {
                                "Channel": 0,
                                "Tours": [
                                    {
                                        "Tour": 1,
                                        "GroupSequences": []
                                    }
                                ]
                            }
                        ]
                    };

                    for (var g = 0; g < $scope.GroupSequences.length; g++)
                    {
                        if (!angular.equals(pageData.GroupSequences[g], $scope.GroupSequences[g]))
                        {
                            if (validateGroupSequence(g))
                            {
                                var GroupSequenceIndex = g+1;
                                var GroupIndex = 0;
                                if ($scope.GroupSequences[g].SelectedTourGroup === 'None'){
                                    GroupIndex = 0;
                                }else{
                                    GroupIndex = parseInt($scope.GroupSequences[g].SelectedTourGroup,10);
                                }
                                var GroupDwellTime = parseInt($scope.GroupSequences[g].DwellTime,10);

                                setData.PTZTours[0].Tours[0].GroupSequences.push({
                                    "GroupSequence": GroupSequenceIndex,
                                    "Group": GroupIndex,
                                    "DwellTime": GroupDwellTime
                                });
                            }
                            else
                            {
                                postStop = true;
                                break;
                            }
                        }
                    }

                    if(postStop) return;

                    var specialHeaders = [];
                    specialHeaders[0] = {};
                    specialHeaders[0].Type = 'Content-Type';
                    specialHeaders[0].Header = 'application/x-www-form-urlencoded';

                    var jsonString = JSON.stringify(setData);
                    var encodeddata = encodeURI(jsonString);
                    return SunapiClient.post('/stw-cgi/ptzconfig.cgi?msubmenu=tour&action=update', {},
                        function (response) {
                            $scope.pageLoaded = false;
                            view();
                        },
                        function (errorData) {
                        }, $scope, encodeddata, specialHeaders);
                };

                tourPostSet();
            },'lang_set_question','sm');
        }
    };

    $scope.setTrace = function ()
    {
        $scope.memorizeTraceMode = $scope.memorizeTraceMode == 'Start' ? 'Stop' : 'Start';
        var promises = [];
        promises.push(function(){return memorizeTrace($scope.memorizeTraceMode, true)});
        $q.seqAll(promises).then(
            function(){
            },
            function(errorData){
                //alert(errorData);
            }
        );
    };

    function validateGroupSequence(GroupSequenceIndex)
    {
        if ((typeof $scope.GroupSequences[GroupSequenceIndex].DwellTime === 'undefined') || 
        		$scope.GroupSequences[GroupSequenceIndex].DwellTime < $scope.DwellMinTime || 
        		$scope.GroupSequences[GroupSequenceIndex].DwellTime > $scope.DwellMaxTime)
        {
        	COMMONUtils.ShowError($translate.instant('lang_range_alert').replace('%1', $scope.DwellMinTime).replace('%2', $scope.DwellMaxTime));
            return false;
        }

        return true;
    }

    function validateSwing(SwingIndex)
    {
        if ((typeof $scope.Swings[SwingIndex].Speed === 'undefined') || 
        		$scope.Swings[SwingIndex].Speed < $scope.PresetMinSpeed || 
        		$scope.Swings[SwingIndex].Speed > $scope.PresetMaxSpeed)
        {
        	COMMONUtils.ShowError($translate.instant('lang_range_alert').replace('%1', $scope.PresetMinSpeed).replace('%2', $scope.PresetMaxSpeed));
            return false;
        }

        if ((typeof $scope.Swings[SwingIndex].DwellTime === 'undefined') || 
        		$scope.Swings[SwingIndex].DwellTime < $scope.DwellMinTime || 
        		$scope.Swings[SwingIndex].DwellTime > $scope.DwellMaxTime)
        {
        	COMMONUtils.ShowError($translate.instant('lang_range_alert').replace('%1', $scope.DwellMinTime).replace('%2', $scope.DwellMaxTime));
            return false;
        }

        if (!parseInt($scope.Swings[SwingIndex].FromPreset) || 
        		!parseInt($scope.Swings[SwingIndex].ToPreset) || 
        		parseInt($scope.Swings[SwingIndex].FromPreset) === parseInt($scope.Swings[SwingIndex].ToPreset))
        {
        	COMMONUtils.ShowError($translate.instant('lang_msg_selValidPresetNumber'));
            return false;
        }

        return true;
    }

    function validateGroup(GroupIndex)
    {
        for (var p = 0; p < $scope.MaxPresetsPerGroup; p++)
        {
            if ((typeof $scope.Groups[GroupIndex].PresetList[p].Speed === 'undefined') || 
            		$scope.Groups[GroupIndex].PresetList[p].Speed < $scope.PresetMinSpeed ||
            		$scope.Groups[GroupIndex].PresetList[p].Speed > $scope.PresetMaxSpeed)
            {
            	COMMONUtils.ShowError($translate.instant('lang_range_alert').replace('%1', $scope.PresetMinSpeed).replace('%2', $scope.PresetMaxSpeed));
                return false;
            }

            if ((typeof $scope.Groups[GroupIndex].PresetList[p].DwellTime === 'undefined') || 
            		$scope.Groups[GroupIndex].PresetList[p].DwellTime < $scope.DwellMinTime || 
            		$scope.Groups[GroupIndex].PresetList[p].DwellTime > $scope.DwellMaxTime)
            {
            	COMMONUtils.ShowError($translate.instant('lang_range_alert').replace('%1', $scope.DwellMinTime).replace('%2', $scope.DwellMaxTime));
                return false;
            }
        }

        return true;
    }

    function getAttributes()
    {
        $scope.tabs = [];
        $scope.MaxPreset = mAttr.MaxPreset;
        $scope.OnlyNumStr = mAttr.OnlyNumStr;

        if (mAttr.SwingSupport)
        {
            $scope.tabs.push('Swing');

            $scope.SwingMode = {};
            $scope.SwingMode.SelectedIndex = 0;
            if (mAttr.SwingModes !== undefined)
            {
                $scope.SwingModes = mAttr.SwingModes;
            }

            $scope.Swings = [];
            for (var s = 0; s < mAttr.SwingModes.length; s++)
            {
                $scope.Swings[s] = {};
                $scope.Swings[s].Speed = mAttr.DefaultPresetSpeed;
                $scope.Swings[s].DwellTime = mAttr.DefaultDwellTime;
                $scope.Swings[s].FromPreset = 0;
                $scope.Swings[s].ToPreset = 0;
            }
        }

        if (mAttr.GroupSupport)
        {
            $scope.tabs.push('Group');

            $scope.MaxGroupCount = mAttr.MaxGroupCount;
            $scope.GroupOptions = COMMONUtils.getArrayWithMinMax(1, mAttr.MaxGroupCount);
            $scope.Group = {};
            $scope.Group.SelectedIndex = 0;
            $scope.MaxPresetsPerGroup = mAttr.MaxPresetsPerGroup;

            if (mAttr.PresetSpeedLimits !== undefined)
            {
                $scope.PresetMinSpeed = mAttr.PresetSpeedLimits.minValue;
                $scope.PresetMaxSpeed = mAttr.PresetSpeedLimits.maxValue;
            }

            if (mAttr.PresetDwellTimeLimits !== undefined)
            {
                $scope.DwellMinTime = mAttr.PresetDwellTimeLimits.minValue;
                $scope.DwellMaxTime = mAttr.PresetDwellTimeLimits.maxValue;
            }

            var PresetList = [];
            for (var p = 0; p < $scope.MaxPresetsPerGroup; p++)
            {
                PresetList[p] = {};
                PresetList[p].SelectedPresetIndex = 0;
                PresetList[p].Speed = mAttr.DefaultPresetSpeed;
                PresetList[p].DwellTime = mAttr.DefaultDwellTime;
            }

            $scope.Groups = [];
            for (var g = 0; g < mAttr.MaxGroupCount; g++)
            {
                $scope.Groups[g] = {};
                $scope.Groups[g].PresetList = angular.copy(PresetList);
            }
        }

        if (mAttr.TourSupport)
        {
            $scope.tabs.push('Tour');

            $scope.TourGroupOptions = ['None'];

            $scope.GroupSequences = [];
            for (var g = 0; g < mAttr.MaxGroupCount; g++)
            {
                $scope.GroupSequences[g] = {};
                $scope.GroupSequences[g].DwellTime = 1;
                $scope.GroupSequences[g].SelectedTourGroup = $scope.TourGroupOptions[0];
            }
        }

        if (mAttr.TraceSupport)
        {
            $scope.tabs.push('Trace');

            $scope.MaxTraceCount = mAttr.MaxTraceCount;
            $scope.TraceOptions = COMMONUtils.getArrayWithMinMax(1, mAttr.MaxTraceCount);
            $scope.Trace = {};
            $scope.Trace.SelectedIndex = 0;
            $scope.memorizeTraceMode = 'Stop';
        }

        if (mAttr.AutorunSupport)
        {
            $scope.tabs.push('AutoRun');

            if (mAttr.AutoRunModes !== undefined)
            {
                $scope.AutoRunModes = mAttr.AutoRunModes;
            }

            if (mAttr.AutoRunActiveTimeOptions !== undefined)
            {
                $scope.AutoRunActiveTimeOptions = mAttr.AutoRunActiveTimeOptions;
            }

            if (mAttr.AutoPanSpeed !== undefined)
            {
                $scope.AutoPanMinSpeed = mAttr.AutoPanSpeed.minValue;
                $scope.AutoPanMaxSpeed = mAttr.AutoPanSpeed.maxValue;
            }

            if (mAttr.AutoPanTiltAngle !== undefined)
            {
                $scope.AutoPanTiltMinAngle = mAttr.AutoPanTiltAngle.minValue;
                $scope.AutoPanTiltMaxAngle = mAttr.AutoPanTiltAngle.maxValue;
            }

            $scope.WeekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        }
    }

    function getPresetList()
    {
        $scope.PresetNameOptions = [];
        $scope.PresetNameOptions.push({preset:0,name:'None'});

        var getData = {};

        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=view', getData,
            function (response) {
                for (var i = 0; i < response.data.PTZPresets[0].Presets.length; i++) {
                    var item = {
                        preset : response.data.PTZPresets[0].Presets[i].Preset,
                        name : response.data.PTZPresets[0].Presets[i].Preset + ' : ' + response.data.PTZPresets[0].Presets[i].Name
                    };
                    $scope.PresetNameOptions.push(item);
                }
            },
            function (errorData) {
                if (errorData !== "Configuration Not Found") {
                    //alert(errorData);
                }
            }, '', true);
    }

    function getGroups()
    {
        $scope.GroupsSet = [];

        var getData = {};

        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=group&action=view', getData,
            function (response) {
                var aGroups = response.data.PTZGroups[0].Groups;

                for (var g = 0; g < aGroups.length; g++) {
                    $scope.GroupsSet.push(aGroups[g].Group);

                    var gIndex = aGroups[g].Group - 1;
                    for (var p = 0; p < aGroups[g].PresetSequences.length; p++) {
                        var pIndex = aGroups[g].PresetSequences[p].PresetSequence - 1;

                        $scope.Groups[gIndex].PresetList[pIndex].SelectedPresetIndex = aGroups[g].PresetSequences[p].Preset;
                        $scope.Groups[gIndex].PresetList[pIndex].Speed = aGroups[g].PresetSequences[p].Speed;
                        $scope.Groups[gIndex].PresetList[pIndex].DwellTime = aGroups[g].PresetSequences[p].DwellTime;
                    }
                }

                pageData.Groups = angular.copy($scope.Groups);
            },
            function (errorData) {
                if (errorData == "Configuration Not Found") {
                    pageData.Groups = angular.copy($scope.Groups);
                }else{
                    //alert(errorData);
                }
            }, '', true);
    }

    function getSwings()
    {
        var getData = {};

        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=swing&action=view', getData,
            function (response) {
                var aSwings = response.data.PTZSwing[0].SwingSequence;

                for (var s = 0; s < aSwings.length; s++) {
                    var index = $scope.SwingModes.indexOf(aSwings[s].Mode);

                    if (index !== -1) {
                        $scope.Swings[index].Speed = aSwings[s].Speed;
                        $scope.Swings[index].DwellTime = aSwings[s].DwellTime;
                        $scope.Swings[index].FromPreset = aSwings[s].FromPreset;
                        $scope.Swings[index].ToPreset = aSwings[s].ToPreset;
                    }
                }

                pageData.Swings = angular.copy($scope.Swings);
            },
            function (errorData) {
                if (errorData == "Configuration Not Found") {
                    pageData.Swings = angular.copy($scope.Swings);
                }else{
                    //alert(errorData);
                }
            }, '', true);
    }

    function getTours()
    {
        $scope.TourGroupSequencesSet = [];
        $scope.TourGroupOptions.push.apply($scope.TourGroupOptions, $scope.GroupsSet);

        var getData = {};

        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=tour&action=view', getData,
            function (response) {
                if (response.data.PTZTours[0].Tours.length) {
                    var GroupSequences = response.data.PTZTours[0].Tours[0].GroupSequences;

                    for (var g = 0; g < GroupSequences.length; g++) {
                        var index = GroupSequences[g].GroupSequence - 1;

                        if ($scope.GroupsSet.indexOf(GroupSequences[g].Group) !== -1) {
                            $scope.TourGroupSequencesSet.push(GroupSequences[g].GroupSequence);

                            $scope.GroupSequences[index] = {};
                            $scope.GroupSequences[index].SelectedTourGroup = GroupSequences[g].Group;
                        }
                        $scope.GroupSequences[index].DwellTime = GroupSequences[g].DwellTime;
                    }

                    pageData.GroupSequences = angular.copy($scope.GroupSequences);
                }
            },
            function (errorData) {
                if (errorData == "Configuration Not Found") {
                    pageData.GroupSequences = angular.copy($scope.GroupSequences);
                }else{
                    //alert(errorData);
                }
            }, '', true);
    }

    function readSchedule(day, hour)
    {
        var schedule = {};

        for (var i = 0; i < $scope.AutoRun.ModeSchedule.Schedules.length; i++)
        {
            if (COMMONUtils.isValidSchedule(day, hour, $scope.AutoRun.ModeSchedule.Schedules[i].FromTo))
            {
                schedule.Mode = $scope.AutoRun.ModeSchedule.Schedules[i].ScheduleMode;

                if (schedule.Mode === 'Preset')
                {
                    schedule.Preset = $scope.AutoRun.ModeSchedule.Schedules[i].Preset;
                }
                else
                {
                    schedule.Preset = $scope.AutoRun.ModePreset.Preset;
                }

                if (schedule.Mode === 'Swing')
                {
                    schedule.SwingMode = $scope.AutoRun.ModeSchedule.Schedules[i].SwingMode;
                }
                else
                {
                    schedule.SwingMode = $scope.AutoRun.ModeSwing.SwingMode;
                }

                if (schedule.Mode === 'Group')
                {
                    schedule.Group = $scope.AutoRun.ModeSchedule.Schedules[i].Group;
                }
                else
                {
                    schedule.Group = $scope.AutoRun.ModeGroup.Group;
                }

                if (schedule.Mode === 'Tour')
                {
                    schedule.Tour = $scope.AutoRun.ModeSchedule.Schedules[i].Tour;
                }
                else
                {
                    schedule.Tour = $scope.AutoRun.ModeTour.Tour;
                }

                if (schedule.Mode === 'Trace')
                {
                    schedule.Trace = $scope.AutoRun.ModeSchedule.Schedules[i].Trace;
                }
                else
                {
                    schedule.Trace = $scope.AutoRun.ModeTrace.Trace;
                }

                if (schedule.Mode === 'AutoPan')
                {
                    schedule.AutoPanSpeed = $scope.AutoRun.ModeSchedule.Schedules[i].AutoPanSpeed;
                    schedule.AutoPanTiltAngle = $scope.AutoRun.ModeSchedule.Schedules[i].AutoPanTiltAngle;
                }
                else
                {
                    schedule.AutoPanSpeed = $scope.AutoRun.ModeAutoPan.AutoPanSpeed;
                    schedule.AutoPanTiltAngle = $scope.AutoRun.ModeAutoPan.AutoPanTiltAngle;
                }

                break;
            }
        }

        return schedule;
    }

    function reloadScheduler()
    {
        $scope.AutoRunScheduler = [];
        for (var d = 0; d < $scope.WeekDays.length; d++)
        {
            $scope.AutoRunScheduler[$scope.WeekDays[d]] = [];

            for (var h = 0; h < mAttr.MaxHours; h++)
            {
                $scope.AutoRunScheduler[$scope.WeekDays[d]][h] = readSchedule($scope.WeekDays[d], h);
            }
        }
    }

    function getAutoRun()
    {
        var getData = {};

        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=autorun&action=view', getData,
            function (response) {
                $scope.AutoRun = response.data.AutoRun[0];
                pageData.AutoRun = angular.copy($scope.AutoRun);

                reloadScheduler();

                pageData.AutoRunScheduler = [];
                for (var d = 0; d < $scope.WeekDays.length; d++) {
                    pageData.AutoRunScheduler[$scope.WeekDays[d]] = angular.copy($scope.AutoRunScheduler[$scope.WeekDays[d]]);
                }
            },
            function (errorData) {
                if (errorData !== "Configuration Not Found") {
                    //alert(errorData);
                }
            }, '', true);
    }

    function setSwing(Mode, SwingIndex)
    {
        var setData = {};

        setData.Channel = 0;
        setData.Mode = Mode;
        setData.Speed = $scope.Swings[SwingIndex].Speed;
        setData.DwellTime = $scope.Swings[SwingIndex].DwellTime;
        setData.FromPreset = $scope.Swings[SwingIndex].FromPreset;
        setData.ToPreset = $scope.Swings[SwingIndex].ToPreset;

        SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=swing&action=set', setData,
            function (response) {
                $scope.pageLoaded = false;
                view();
            },
            function (errorData) {
                //alert(errorData);
            }, '', true);
    }

    function setAutoRunMode(callback)
    {
        var setData = {};

        setData.Channel = 0;
        setData.Mode = $scope.AutoRun.Mode;

        if ($scope.AutoRun.Mode === 'Home')
        {
            setData.ActivationTime = $scope.AutoRun.ModeHome.ActivationTime;
        }
        else if ($scope.AutoRun.Mode === 'Preset')
        {
            setData.ActivationTime = $scope.AutoRun.ModePreset.ActivationTime;
            setData.Preset = $scope.AutoRun.ModePreset.Preset;
        }
        else if ($scope.AutoRun.Mode === 'Swing')
        {
            setData.ActivationTime = $scope.AutoRun.ModeSwing.ActivationTime;
            setData.SwingMode = $scope.AutoRun.ModeSwing.SwingMode;
        }
        else if ($scope.AutoRun.Mode === 'Group')
        {
            setData.ActivationTime = $scope.AutoRun.ModeGroup.ActivationTime;
            setData.Group = $scope.AutoRun.ModeGroup.Group;
        }
        else if ($scope.AutoRun.Mode === 'Tour')
        {
            setData.ActivationTime = $scope.AutoRun.ModeTour.ActivationTime;
            setData.Tour = $scope.AutoRun.ModeTour.Tour;
        }
        else if ($scope.AutoRun.Mode === 'Trace')
        {
            setData.ActivationTime = $scope.AutoRun.ModeTrace.ActivationTime;
            setData.Trace = $scope.AutoRun.ModeTrace.Trace;
        }
        else if ($scope.AutoRun.Mode === 'AutoPan')
        {
            setData.ActivationTime = $scope.AutoRun.ModeAutoPan.ActivationTime;
            setData.AutoPanSpeed = $scope.AutoRun.ModeAutoPan.AutoPanSpeed;
            setData.AutoPanTiltAngle = $scope.AutoRun.ModeAutoPan.AutoPanTiltAngle;
        }
        else if ($scope.AutoRun.Mode === 'Schedule')
        {
            setData.ActivationTime = $scope.AutoRun.ModeSchedule.ActivationTime;
        }

        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=autorun&action=set', setData,
            function (response) {
                if (callback !== undefined) {callback();}
            },
            function (errorData) {
                //alert(errorData);
            }, '', true);
    }

    function updateAutoRun(promises)
    {
        var scheduleArray = [];

        for (var d = 0; d < $scope.WeekDays.length; d++)
        {
            var day = $scope.WeekDays[d];
            if (!angular.equals(pageData.AutoRunScheduler[day], $scope.AutoRunScheduler[day]))
            {
                var from = 0;

                for (var h = 0; h < mAttr.MaxHours; h++)
                {
                    if (!angular.equals($scope.AutoRunScheduler[day][h], $scope.AutoRunScheduler[day][h + 1]))
                    {
                        var fromStr = COMMONUtils.getFormatedInteger(from, 2) + ':00';
                        var toStr = COMMONUtils.getFormatedInteger(h + 1, 2) + ':00';

                        var schedule = {};

                        schedule.Mode = $scope.AutoRunScheduler[day][h].Mode;
                        schedule.FromTo = (day + ' ' + fromStr + '-' + day + ' ' + toStr);

                        if (schedule.Mode === 'Preset')
                        {
                            schedule.Preset = $scope.AutoRunScheduler[day][h].Preset;
                        }
                        else if (schedule.Mode === 'Swing')
                        {
                            schedule.SwingMode = $scope.AutoRunScheduler[day][h].SwingMode;
                        }
                        else if (schedule.Mode === 'Group')
                        {
                            schedule.Group = $scope.AutoRunScheduler[day][h].Group;
                        }
                        else if (schedule.Mode === 'Tour')
                        {
                            schedule.Tour = $scope.AutoRunScheduler[day][h].Tour;
                        }
                        else if (schedule.Mode === 'Trace')
                        {
                            schedule.Trace = $scope.AutoRunScheduler[day][h].Trace;
                        }
                        else if (schedule.Mode === 'AutoPan')
                        {
                            schedule.AutoPanSpeed = $scope.AutoRunScheduler[day][h].AutoPanSpeed;
                            schedule.AutoPanTiltAngle = $scope.AutoRunScheduler[day][h].AutoPanTiltAngle;
                        }

                        scheduleArray.push(schedule);

                        from = h + 1;
                    }
                }
            }
        }

        var scheduleUpdate = function(paramData){
            return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=autorun&action=update', paramData,
                function (response) {

                },
                function (errorData) {
                    //alert(errorData);
                }, '', true);
        };
        for (var i = 0; i < scheduleArray.length; i++)
        {
            var setData = {};

            setData.Channel = 0;
            setData.ScheduleMode = scheduleArray[i].Mode;
            setData.FromTo = scheduleArray[i].FromTo;

            if (setData.ScheduleMode === 'Preset')
            {
                setData.Preset = scheduleArray[i].Preset;
            }
            else if (setData.ScheduleMode === 'Swing')
            {
                setData.SwingMode = scheduleArray[i].SwingMode;
            }
            else if (setData.ScheduleMode === 'Group')
            {
                setData.Group = scheduleArray[i].Group;
            }
            else if (setData.ScheduleMode === 'Tour')
            {
                setData.Tour = scheduleArray[i].Tour;
            }
            else if (setData.ScheduleMode === 'Trace')
            {
                setData.Trace = scheduleArray[i].Trace;
            }
            else if (setData.ScheduleMode === 'AutoPan')
            {
                setData.AutoPanSpeed = scheduleArray[i].AutoPanSpeed;
                setData.AutoPanTiltAngle = scheduleArray[i].AutoPanTiltAngle;
            }

            promises.push(scheduleUpdate(setData));
        }
    }

    function removeGroup(GroupId)
    {
        var setData = {};

        setData.Channel = 0;
        setData.Group = GroupId;

        SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=group&action=remove', setData,
            function (response) {
                $scope.pageLoaded = false;
                view();
            },
            function (errorData) {
                //alert(errorData);
            }, '', true);
    }

    function removeTour()
    {
        var setData = {};

        setData.Channel = 0;
        setData.Tour = 1;

        SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=tour&action=remove', setData,
            function (response) {
                $scope.pageLoaded = false;
                view();
            },
            function (errorData) {
                //alert(errorData);
            }, '', true);
    }

    function memorizeTrace(Option,refreshMode)
    {
        var setData = {};

        setData.Channel = 0;
        setData.Trace = $scope.TraceOptions[parseInt($scope.Trace.SelectedIndex)];
        setData.Mode = Option;

        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=trace&action=memorize', setData,
            function (response) {
                if(Option=='Stop' && refreshMode){
                    COMMONUtils.ShowInfo('lang_savingCompleted',function(){
                        $scope.pageLoaded = false;
                        view();
                    });
                }
            },
            function (errorData) {
                //alert(errorData);
            }, '', true);
    }

    function controlTrace(Option)
    {
        var setData = {};
        var promises = [];
        setData.Channel = 0;
        setData.Trace = $scope.TraceOptions[parseInt($scope.Trace.SelectedIndex)];

        if (Option){
            setData.Mode = 'Start';
        }else{
            setData.Mode = 'Stop';
            if($scope.memorizeTraceMode == 'Start'){
                $scope.memorizeTraceMode = 'Stop';
                promises.push(memorizeTrace('Stop'));
            }
        }

        var traceControl = function(paramData){
            return SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=trace&action=control', paramData,
                function (response) {

                },
                function (errorData) {
                    //alert(errorData);
                }, '', true);
        };
        promises.push(traceControl(setData));

        $q.seqAll(promises).then(
            function(){
            },
            function(errorData){
                //alert(errorData);
            }
        );
    }

    function controlTour(Option)
    {
        var setData = {};

        setData.Channel = 0;
        setData.Tour = 1;
        Option ? setData.Mode = 'Stop' : setData.Mode = 'Start';

        SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=tour&action=control', setData,
            function (response) {

            },
            function (errorData) {
                //alert(errorData);
            }, '', true);
    }

    function controlSwing(Option)
    {
        var setData = {};

        setData.Channel = 0;
        Option ? setData.Mode = 'Stop' : setData.Mode = $scope.SwingModes[$scope.SwingMode.SelectedIndex];

        SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=swing&action=control', setData,
            function (response) {

            },
            function (errorData) {
                //alert(errorData);
            }, '', true);
    }

    function controlGroup(Option, GroupId)
    {
        var setData = {};

        setData.Channel = 0;
        setData.Group = GroupId;
        Option ? setData.Mode = 'Stop' : setData.Mode = 'Start';

        SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=group&action=control', setData,
            function (response) {

            },
            function (errorData) {
                //alert(errorData);
            }, '', true);
    }

    function updateGroup(GroupIndex)
    {
        var promises = [];
        var groupUpdate = function(paramData){
            SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=group&action=update', paramData,
                function (response) {

                },
                function (errorData) {
                    //alert(errorData);
                }, '', true);
        };
        for (var p = 0; p < $scope.MaxPresetsPerGroup; p++)
        {
            if (!angular.equals(pageData.Groups[GroupIndex].PresetList[p], $scope.Groups[GroupIndex].PresetList[p]))
            {
                var setData = {};

                setData.Channel = 0;
                setData.Group = GroupIndex + 1;
                setData.PresetSequence = p + 1;
                setData.Preset = $scope.Groups[GroupIndex].PresetList[p].SelectedPresetIndex;
                setData.Speed = $scope.Groups[GroupIndex].PresetList[p].Speed;
                setData.DwellTime = $scope.Groups[GroupIndex].PresetList[p].DwellTime;

                promises.push(groupUpdate(setData));
            }
        }
        $q.seqAll(promises).then(
            function(){
                $scope.pageLoaded = false;
                view();
            },
            function(errorData){
                //alert(errorData);
            }
        );
    }

    function addGroup(GroupIndex)
    {
        for (var p = 0; p < $scope.MaxPresetsPerGroup; p++)
        {
            if (!angular.equals(pageData.Groups[GroupIndex].PresetList[p], $scope.Groups[GroupIndex].PresetList[p]))
            {
                var setData = {};

                setData.Channel = 0;
                setData.Group = GroupIndex + 1;
                setData.PresetSequence = p + 1;
                setData.Preset = $scope.Groups[GroupIndex].PresetList[p].SelectedPresetIndex;
                setData.Speed = $scope.Groups[GroupIndex].PresetList[p].Speed;
                setData.DwellTime = $scope.Groups[GroupIndex].PresetList[p].DwellTime;

                SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=group&action=add', setData,
                    function (response) {
                        pageData.Groups[GroupIndex].PresetList[p] = angular.copy($scope.Groups[GroupIndex].PresetList[p]);
                        updateGroup(GroupIndex);
                    },
                    function (errorData) {
                        //alert(errorData);
                    }, '', true);

                break;
            }
        }
    }

    function addTour(GroupSequenceIndex)
    {
        var setData = {};

        setData.Channel = 0;
        setData.Tour = 1;
        setData.GroupSequence = GroupSequenceIndex + 1;
        setData.DwellTime = $scope.GroupSequences[GroupSequenceIndex].DwellTime;

        if ($scope.GroupSequences[GroupSequenceIndex].SelectedTourGroup === 'None')
        {
            setData.Group = 0;
        }
        else
        {
            setData.Group = $scope.GroupSequences[GroupSequenceIndex].SelectedTourGroup;
        }

        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=tour&action=add', setData,
            function (response) {
                $scope.TourGroupSequencesSet.push(GroupSequenceIndex + 1);
                //view();
            },
            function (errorData) {
            }, '', true);
    }

    function updateTour(GroupSequenceIndex)
    {
        var setData = {};

        setData.Channel = 0;
        setData.Tour = 1;
        setData.GroupSequence = GroupSequenceIndex + 1;
        setData.DwellTime = $scope.GroupSequences[GroupSequenceIndex].DwellTime;

        if ($scope.GroupSequences[GroupSequenceIndex].SelectedTourGroup === 'None')
        {
            setData.Group = 0;
        }
        else
        {
            setData.Group = $scope.GroupSequences[GroupSequenceIndex].SelectedTourGroup;
        }

        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=tour&action=update', setData,
            function (response) {
                //view();
            },
            function (errorData) {
            }, '', true);
    }

    function validatePage()
    {
        if ($scope.AutoRun.Mode == 'Preset' && ((typeof $scope.AutoRun.ModePreset.Preset === 'undefined') || ($scope.AutoRun.ModePreset.Preset < 1) || ($scope.AutoRun.ModePreset.Preset > mAttr.MaxPreset)))
        {
        	COMMONUtils.ShowError($translate.instant('lang_range_alert').replace('%1', 1).replace('%2', mAttr.MaxPreset));
            return false;
        }
        else if ($scope.AutoRun.Mode == 'Group' && ((typeof $scope.AutoRun.ModeGroup.Group === 'undefined') || ($scope.AutoRun.ModeGroup.Group < 1) || ($scope.AutoRun.ModeGroup.Group > $scope.MaxGroupCount)))
        {
            COMMONUtils.ShowError($translate.instant('lang_range_alert').replace('%1', 1).replace('%2', $scope.MaxGroupCount));
            return false;
        }
        else if ($scope.AutoRun.Mode == 'Trace' && ((typeof $scope.AutoRun.ModeTrace.Trace === 'undefined') || ($scope.AutoRun.ModeTrace.Trace < 1) || ($scope.AutoRun.ModeTrace.Trace > $scope.MaxTraceCount)))
        {
            COMMONUtils.ShowError($translate.instant('lang_range_alert').replace('%1', 1).replace('%2', $scope.MaxTraceCount));
            return false;
        }
        else if ($scope.AutoRun.Mode == 'AutoPan' && ((typeof $scope.AutoRun.ModeAutoPan.AutoPanSpeed === 'undefined') || ($scope.AutoRun.ModeAutoPan.AutoPanSpeed === '') || ($scope.AutoRun.ModeAutoPan.AutoPanSpeed < $scope.AutoPanMinSpeed) || ($scope.AutoRun.ModeAutoPan.AutoPanSpeed > $scope.AutoPanMaxSpeed)))
        {
            COMMONUtils.ShowError($translate.instant('lang_range_alert').replace('%1', $scope.AutoPanMinSpeed).replace('%2', $scope.AutoPanMaxSpeed));
            return false;
        }
        else if ($scope.AutoRun.Mode == 'AutoPan' && ((typeof $scope.AutoRun.ModeAutoPan.AutoPanTiltAngle === 'undefined') || ($scope.AutoRun.ModeAutoPan.AutoPanTiltAngle === '') || ($scope.AutoRun.ModeAutoPan.AutoPanTiltAngle < $scope.AutoPanTiltMinAngle) || ($scope.AutoRun.ModeAutoPan.AutoPanTiltAngle > $scope.AutoPanTiltMaxAngle)))
        {
            COMMONUtils.ShowError($translate.instant('lang_range_alert').replace('%1', $scope.AutoPanTiltMinAngle).replace('%2', $scope.AutoPanTiltMaxAngle));
            return false;
        }

        return true;
    }

    function view()
    {

        getAttributes();

        var promises = [];
        promises.push(getPresetList);
        if (mAttr.SwingSupport){
            promises.push(getSwings);
        }

        if (mAttr.GroupSupport){
            promises.push(getGroups);
        }

        if (mAttr.TourSupport){
            promises.push(getTours);
        }

        if (mAttr.AutorunSupport){
            promises.push(getAutoRun);
        }

        $q.seqAll(promises).then(
            function(){
                $scope.pageLoaded = true;
                showVideo().finally(function(){
                    $("#sequencepage").show();
                });
            },
            function(errorData){
                //alert(errorData);
            }
        );
    }

    function showVideo() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
            function (response) {
                var viewerWidth = 640;
                var viewerHeight = 360;
                var maxWidth = mAttr.MaxROICoordinateX;
                var maxHeight = mAttr.MaxROICoordinateY;
                var rotate = response.data.Flip[0].Rotate;
                var flip = response.data.Flip[0].VerticalFlipEnable;
                var mirror = response.data.Flip[0].HorizontalFlipEnable;
                var adjust = mAttr.AdjustMDIVRuleOnFlipMirror;

                $scope.videoinfo = {
                    width: viewerWidth,
                    height: viewerHeight,
                    maxWidth: maxWidth,
                    maxHeight: maxHeight,
                    flip: flip,
                    mirror: mirror,
                    support_ptz: false,
                    rotate: rotate,
                    adjust: adjust
                };

                $scope.ptzinfo = {
                    type: 'none'
                };
            },
            function (errorData) {
                //alert(errorData);
            }, '', true);
    }

    $scope.cancelAutoRun = function ()
    {
        getAutoRun();
    };

    $scope.setAutoRun = function ()
    {
        if (!angular.equals(pageData.AutoRun, $scope.AutoRun)) {
            COMMONUtils.ShowConfirmation(function(){
                if (validatePage())
                {
                    var runPromises = function(){
                        var promises = [];
                        updateAutoRun(promises);
                        promises.push(getAutoRun);

                        $q.seqAll(promises).then(
                            function(){
                                pageData.AutoRunScheduler = [];
                                for (var d = 0; d < $scope.WeekDays.length; d++) {
                                    pageData.AutoRunScheduler[$scope.WeekDays[d]] = angular.copy($scope.AutoRunScheduler[$scope.WeekDays[d]]);
                                }

                                $scope.pageLoaded = false;
                                view();
                            },
                            function(errorData){
                                //alert(errorData);
                            }
                        );
                    };

                    if (!angular.equals(pageData.AutoRun, $scope.AutoRun)) {
                        setAutoRunMode(function(){
                            runPromises();
                        });
                    }else{
                        runPromises();
                    }

                }
            },'lang_set_question','sm');
        }
    };

    $scope.mouseOver = function (day, hour)
    {
        $scope.MouseOverMessage = "";

        $scope.MouseOverMessage += COMMONUtils.getTranslatedOption("Mode") + " : " + COMMONUtils.getTranslatedOption($scope.AutoRunScheduler[day][hour].Mode) + "\r\n";

        if ($scope.AutoRunScheduler[day][hour].Mode === 'Preset')
        {
            $scope.MouseOverMessage += COMMONUtils.getTranslatedOption("Number") + " : " + $scope.AutoRunScheduler[day][hour].Preset + "\r\n";
        }

        if ($scope.AutoRunScheduler[day][hour].Mode === 'Swing')
        {
            $scope.MouseOverMessage += COMMONUtils.getTranslatedOption("SwingMode") + " : " + COMMONUtils.getTranslatedOption($scope.AutoRunScheduler[day][hour].SwingMode) + "\r\n";
        }

        if ($scope.AutoRunScheduler[day][hour].Mode === 'Group')
        {
            $scope.MouseOverMessage += COMMONUtils.getTranslatedOption("Number") + " : " + $scope.AutoRunScheduler[day][hour].Group + "\r\n";
        }

        if ($scope.AutoRunScheduler[day][hour].Mode === 'Tour')
        {
            $scope.MouseOverMessage += COMMONUtils.getTranslatedOption("Number") + " : " + $scope.AutoRunScheduler[day][hour].Tour + "\r\n";
        }

        if ($scope.AutoRunScheduler[day][hour].Mode === 'Trace')
        {
            $scope.MouseOverMessage += COMMONUtils.getTranslatedOption("Number") + " : " + $scope.AutoRunScheduler[day][hour].Trace + "\r\n";
        }

        if ($scope.AutoRunScheduler[day][hour].Mode === 'AutoPan')
        {
            $scope.MouseOverMessage += COMMONUtils.getTranslatedOption("Speed") + " : " + $scope.AutoRunScheduler[day][hour].AutoPanSpeed + "\r\n";
            $scope.MouseOverMessage += COMMONUtils.getTranslatedOption("TiltAngle") + " : " + $scope.AutoRunScheduler[day][hour].AutoPanTiltAngle + "\r\n";
        }

        {
            $scope.MouseOverMessage += COMMONUtils.getTranslatedOption(day) + " " + COMMONUtils.getFormatedInteger(hour, 2) + ":" + "00" + " ~ ";
            $scope.MouseOverMessage += COMMONUtils.getTranslatedOption(day) + " " + COMMONUtils.getFormatedInteger(hour, 2) + ":" + "59" + "\r\n";
        }
    };

    $scope.mouseLeave = function ()
    {
        $scope.MouseOverMessage = {};
    };

    $(document).ready(function ()
    {
        $('[data-toggle="uib-tooltip"]').tooltip();
    });

    $scope.getTooltipMessage = function ()
    {
        if (typeof $scope.MouseOverMessage !== 'undefined')
        {
            return $scope.MouseOverMessage;
        }
    };

    $scope.open = function (day, hour)
    {
        $scope.SelectedDay = day;
        $scope.SelectedHour = hour;

        var modalInstance = $uibModal.open({
            templateUrl: 'autorunModal.html',
            controller: 'autorunModalCtrl',
            resolve: {
                SelectedDay: function ()
                {
                    return $scope.SelectedDay;
                },
                SelectedHour: function ()
                {
                    return $scope.SelectedHour;
                },
                AutoRunScheduler: function ()
                {
                    return $scope.AutoRunScheduler;
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
    $scope.getPresetNameWidthPresetNo = function(presetNo){
        var presetName = '';
        $.each($scope.PresetNameOptions,function(index,item){
            if(item.preset == presetNo){
                presetName = item.name;
                return;
            }
        });
        return presetName;
    };

    function openSelectRemove(selectorName,removeIndex,focusSkip){
        var newVal = $('#'+selectorName+' option:selected').val();
        var removeSelect = $('#'+selectorName);
        removeSelect.unbind();
        removeSelect.remove();
        $timeout(function(){
            if(selectorName=='swingsFromPresetSelect') {
                if (newVal !== undefined) $scope.Swings[$scope.SwingMode.SelectedIndex].FromPreset = parseInt(newVal, 10);
                $('.swingsFromPreset:eq(' + removeIndex + ')').show();
                if(focusSkip != true) $('.swingsFromPreset:eq(' + removeIndex + ')').focus();
            }else if(selectorName=='swingsToPresetSelect'){
                if(newVal !== undefined) $scope.Swings[$scope.SwingMode.SelectedIndex].ToPreset = parseInt(newVal,10);
                $('.swingsToPreset:eq('+removeIndex+')').show();
                if(focusSkip != true) $('.swingsToPreset:eq('+removeIndex+')').focus();
            }else{
                if(newVal !== undefined) $scope.Groups[$scope.Group.SelectedIndex].PresetList[removeIndex].SelectedPresetIndex = parseInt(newVal,10);
                $('.groupPresetInput:eq('+removeIndex+')').show();
                if(focusSkip != true) $('.groupPresetInput:eq('+removeIndex+')').focus();
            }
        });
    }
    function openSelectCreate(selectorName,index,options,selectedVal,hideSelector){
        var selectHtml = $('<select id="'+selectorName+'" name="'+selectorName+'" data-index="'+index+'" class="form-control preset-input-select openSelect" />');
        $.each(options,function(subIndex,item){
            if(item.preset==selectedVal){
                $('<option/>',{value:item.preset,text:$scope.getTranslatedOption(item.name),selected:'selected'}).appendTo(selectHtml);
            }else{
                $('<option/>',{value:item.preset,text:$scope.getTranslatedOption(item.name)}).appendTo(selectHtml);
            }
        });
        $(hideSelector).hide();
        $(hideSelector).parent().append(selectHtml);
        var createdSelect = $('#'+selectorName);
        createdSelect.focus();
        createdSelect.focusout(function(){
            openSelectRemove(selectorName,index,true);
        });
        createdSelect.change(function(){
            openSelectRemove(selectorName,index);
        });
    }
    $scope.openPresetNoSelect = function(presetMode,index,isShow){
        var selectorName;
        if(presetMode=='SwingsFromPreset'){
            selectorName = 'swingsFromPresetSelect';
        }else if(presetMode=='SwingsToPreset'){
            selectorName = 'swingsToPresetSelect';
        }else{
            selectorName = 'groupPresetSelect';
        }
        if(isShow){
            var selectedVal;
            var hideSelector;
            if(presetMode=='SwingsFromPreset'){
                selectedVal = $scope.Swings[$scope.SwingMode.SelectedIndex].FromPreset;
                hideSelector = '.swingsFromPreset:eq('+index+')';
            }else if(presetMode=='SwingsToPreset'){
                selectedVal = $scope.Swings[$scope.SwingMode.SelectedIndex].ToPreset;
                hideSelector = '.swingsToPreset:eq('+index+')';
            }else{
                selectedVal = $scope.Groups[$scope.Group.SelectedIndex].PresetList[index].SelectedPresetIndex;
                hideSelector = '.groupPresetInput:eq('+index+')';
            }
            var options = $scope.PresetNameOptions;
            var openedSelect = $('.openSelect');
            if(openedSelect.length == 1) {
                var removeSelectorName = openedSelect.attr('id');
                var removeIndex = parseInt(openedSelect.attr('data-index'),10);
                openSelectRemove(removeSelectorName,removeIndex);
            }
            openSelectCreate(selectorName,index,options,selectedVal,hideSelector);
        }
    };

    $scope.view = view;

    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            $scope.PTZPresetArray = COMMONUtils.getArrayWithMinMax(0, mAttr.MaxPresetsPerGroup - 1);
            $scope.PTZGroupArray = COMMONUtils.getArrayWithMinMax(0, mAttr.MaxGroupCount - 1);
            $scope.getHourArray = COMMONUtils.getArray(mAttr.MaxHours);
            view();
        }
    })();

});


        