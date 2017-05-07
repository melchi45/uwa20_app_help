/* global SketchManager, setInterval, clearInterval, getClientIP */
kindFramework
    .directive('eventActionSetup', ['LoggingService', 'COMMONUtils', 'Attributes', 'SunapiClient', '$rootScope', 'eventRuleService', 'UniversialManagerService',
    function(LoggingService, COMMONUtils, Attributes, SunapiClient, $rootScope, eventRuleService, UniversialManagerService){
    'use strict';
    return{
        restrict: 'E',
        scope: false,
        templateUrl:'views/setup/common/event-action-setup.html',
        link: function(scope, elem, attrs) {
            var logger = LoggingService.getInstance('eventActionSetup');
            var currentEventRule = {};
            var currentEventSource = null;
            var mAttr = Attributes.get();
            var isMultiChannel;
            if(mAttr.MaxChannel > 1) {
                isMultiChannel = true;
            } else {
                isMultiChannel = false;
            }
            var isEventActionSupported = mAttr.EventActionSupport;
            var pageData = {};
            var currentPage = null;

            function getEventActions() {
                var getData = {};
                var url = '';
                if(currentPage !== null) {
                    scope.EventSource = currentPage;
                }
                if(scope.EventSource === 'VideoAnalysis'
                    || scope.EventSource === 'FogDetection'
                    || scope.EventSource === 'DefocusDetection'
                    || scope.EventSource === 'FaceDetection'
                    || scope.EventSource === 'AudioAnalysis'
                    || scope.EventSource === 'VideoAnalysis'
                    || scope.EventSource === 'MotionDetection'
                    || scope.EventSource === 'TamperingDetection') {
                    var currentChannel = UniversialManagerService.getChannelId(); 
                    url = '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=view';
                    getData.EventType = 'Channel.' + currentChannel + '.' + scope.EventSource; // EventType=Channel.0.MotionDetection
                } else {
                    url = '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=view';
                    if(scope.EventSource === 'NetworkEvent') { // SUNAPI NG
                        getData.EventType = 'NetworkDisconnect';
                    } else {
                        getData.EventType = scope.EventSource;
                    }
                }

                return SunapiClient.get(url, getData,
                        function (response)
                        {
                            prepareEventActions(response.data.ComplexActions);
                        },
                        function (errorData)
                        {
                            console.log(errorData);
                        }, '', true);
            }

            function getEventActionArray() {
                var getData = {};
                var url = '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=view';
                return SunapiClient.get(url, getData, function(response) {
                    prepareEventActionArray(response.data.ComplexActions);
                }, function(errorData) {
                    console.log(errorData);
                }, '', true);
            }

            function getEventRules() {
                var getData = {};
                if(currentPage === null) {
                    getData.EventSource = scope.EventSource;
                } else {
                    getData.EventSource = currentPage;
                }
                return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', getData,
                        function (response)
                        {
                            prepareEventRules(response.data.EventRules);
                        },
                        function (errorData)
                        {
                            console.log(errorData);
                        }, '', true);
            }

            function getEventRuleArray() {
                var getData = {};
                return SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', getData, function(response) {
                    prepareEventRuleArray(response.data.EventRules);
                }, function(errorData) {
                    console.log(errorData);
                }, '', true);
            }

            function setEventRules() {
                var url = '';
                var setData = {};

                url = '/stw-cgi/eventrules.cgi?msubmenu=rules&action=update';
                if(scope.EventSource === 'OpenSDK') {
                    setData.Enable = scope.EventRule.Enable;
                }
                setData.RuleIndex = scope.EventRule.RuleIndex;
                if(currentPage === null) {
                    setData.EventSource = scope.EventSource;
                } else {
                    setData.EventSource = currentPage;
                }

                setData.EventAction = "";
                if (scope.EventRule.FtpEnable) {
                    setData.EventAction += 'FTP,';
                }
                if (scope.EventRule.SmtpEnable) {
                    setData.EventAction += 'SMTP,';
                }
                if (scope.EventRule.RecordEnable) {
                    setData.EventAction += 'Record,';
                }
                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                    if (scope.EventRule.AlarmOutputs[ao].Duration !== 'Off') {
                        setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                        setData["AlarmOutput." + (ao + 1) + ".Duration"] = scope.EventRule.AlarmOutputs[ao].Duration;
                    }
                }
                if (scope.EventRule.PresetNumber !== 'Off') {
                    setData.EventAction += 'GoToPreset,';
                    setData.PresetNumber = scope.EventRule.PresetNumber;
                }
                if (setData.EventAction.length) {
                    setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
                }
                setData.ScheduleType = scope.EventRule.ScheduleType;
                // if ($scope.EventRule.ScheduleType === 'Scheduled')
                {
                    var diff = $(pageData.EventRule.ScheduleIds).not(scope.EventRule.ScheduleIds).get();
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
                    for (var s = 0; s < scope.EventRule.ScheduleIds.length; s++) {
                        var str = scope.EventRule.ScheduleIds[s].split('.');
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

                SunapiClient.get(url, setData,
                    function(response) {
                        scope.$emit('setEventRuleCompleted', true);
                    },
                    function(errorData) {
                        console.log(errorData);
                        scope.$emit('setEventRuleCompleted', true);
                    }, '', true);

                pageData.EventRule = angular.copy(scope.EventRule);
            };

            function setEventActions(channel) {
                var url = '';
                var setData = {};
                var currentChannel = 0;

                if(currentPage !== null) {
                    scope.EventSource = currentPage;
                }

                if(scope.EventRule.EventType.substring(0,7) === 'Channel') {
                    if(channel === null) { // no channel selection page.
                        currentChannel = UniversialManagerService.getChannelId();
                    } else { // channel selection page.
                        currentChannel = channel;
                    }
                    url = '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=set';
                    setData.EventType = 'Channel.' + currentChannel + '.' + scope.EventSource; // EventType=Channel.0.MotionDetection
                } else {
                    url = '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=set';
                    setData.EventType = scope.EventRule.EventType;
                }

                setData.EventAction = "";
                if (scope.EventRule.FtpEnable) {
                    setData.EventAction += 'FTP,';
                }
                if (scope.EventRule.SmtpEnable) {
                    setData.EventAction += 'SMTP,';
                }
                if (scope.EventRule.RecordEnable) {
                    setData.EventAction += 'Record,';
                }
                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                    if (scope.EventRule.AlarmOutputs[ao].Duration !== 'Off') {
                        setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                        setData["AlarmOutput." + (ao + 1) + ".Duration"] = scope.EventRule.AlarmOutputs[ao].Duration;
                    }
                }
                if (scope.EventRule.PresetNumber !== 'Off') {
                    setData.EventAction += 'GoToPreset,';
                    setData.PresetNumber = scope.EventRule.PresetNumber;
                }
                if (setData.EventAction.length) {
                    setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
                }

                if(setData.EventAction.length === 0) {
                    setData.EventAction = 'None';
                }

                setData.ScheduleType = scope.EventRule.ScheduleType;
                // if ($scope.EventRule.ScheduleType === 'Scheduled')
                {
                    var diff = $(pageData.EventRule.ScheduleIds).not(scope.EventRule.ScheduleIds).get();
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
                    for (var s = 0; s < scope.EventRule.ScheduleIds.length; s++) {
                        var str = scope.EventRule.ScheduleIds[s].split('.');
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

                SunapiClient.get(url, setData,
                    function(response) {
                    },
                    function(errorData) {
                        console.log(errorData);
                    }, '', true);

                pageData.EventRule = angular.copy(scope.EventRule);
            };

            function setEventActionsByIndex(i) {
                var setData = {};
                setData.EventType = 'AlarmInput.' + (i + 1);
                // setData.RuleIndex = scope.EventRules[i].RuleIndex;
                setData.EventAction = "";
                if (scope.EventRules[i].FtpEnable) {
                    setData.EventAction += 'FTP,';
                }
                if (scope.EventRules[i].SmtpEnable) {
                    setData.EventAction += 'SMTP,';
                }
                if (scope.EventRules[i].RecordEnable) {
                    setData.EventAction += 'Record,';
                }
                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                    if (scope.EventRules[i].AlarmOutputs[ao].Duration !== 'Off') {
                        setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                        setData["AlarmOutput." + (ao + 1) + ".Duration"] = scope.EventRules[i].AlarmOutputs[ao].Duration;
                    }
                }
                if (scope.EventRules[i].PresetNumber !== 'Off') {
                    setData.EventAction += 'GoToPreset,';
                    setData.PresetNumber = scope.EventRules[i].PresetNumber;
                }
                if (setData.EventAction.length) {
                    setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
                }
                if(setData.EventAction.length === 0) {
                    setData.EventAction = 'None';
                }

                setData.ScheduleType = scope.EventRules[i].ScheduleType;
                //if ($scope.EventRules[i].ScheduleType === 'Scheduled')
                {
                    var diff = $(pageData.EventRules[i].ScheduleIds).not(scope.EventRules[i].ScheduleIds).get();
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
                    for (var s = 0; s < scope.EventRules[i].ScheduleIds.length; s++) {
                        var str = scope.EventRules[i].ScheduleIds[s].split('.');
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

                SunapiClient.get('/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=set', setData,
                    function(response) {
                    },
                    function(errorData) {
                        console.log(errorData);
                }, '', true);

                pageData.EventRules = angular.copy(scope.EventRules);
            }

            function setEventRulesByIndex(i) {
                var setData = {};
                setData.RuleIndex = scope.EventRules[i].RuleIndex;
                setData.EventAction = "";
                if (scope.EventRules[i].FtpEnable) {
                    setData.EventAction += 'FTP,';
                }
                if (scope.EventRules[i].SmtpEnable) {
                    setData.EventAction += 'SMTP,';
                }
                if (scope.EventRules[i].RecordEnable) {
                    setData.EventAction += 'Record,';
                }
                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                    if (scope.EventRules[i].AlarmOutputs[ao].Duration !== 'Off') {
                        setData.EventAction += 'AlarmOutput.' + (ao + 1) + ',';
                        setData["AlarmOutput." + (ao + 1) + ".Duration"] = scope.EventRules[i].AlarmOutputs[ao].Duration;
                    }
                }
                if (scope.EventRules[i].PresetNumber !== 'Off') {
                    setData.EventAction += 'GoToPreset,';
                    setData.PresetNumber = scope.EventRules[i].PresetNumber;
                }
                if (setData.EventAction.length) {
                    setData.EventAction = setData.EventAction.substring(0, setData.EventAction.length - 1);
                }
                setData.ScheduleType = scope.EventRules[i].ScheduleType;
                //if ($scope.EventRules[i].ScheduleType === 'Scheduled')
                {
                    var diff = $(pageData.EventRules[i].ScheduleIds).not(scope.EventRules[i].ScheduleIds).get();
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
                    for (var s = 0; s < scope.EventRules[i].ScheduleIds.length; s++) {
                        var str = scope.EventRules[i].ScheduleIds[s].split('.');
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

                SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=update', setData,
                    function(response) {
                    },
                    function(errorData) {
                        console.log(errorData);
                }, '', true);

                pageData.EventRules = angular.copy(scope.EventRules);
            }

            function prepareEventRules(eventRules) {
                scope.EventRule = {};
                scope.EventRule.FtpEnable = false;
                scope.EventRule.SmtpEnable = false;
                scope.EventRule.RecordEnable = false;
                scope.EventRule.Enable = eventRules[0].Enable;
                scope.EventRule.RuleIndex = eventRules[0].RuleIndex;
                scope.EventRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventRules[0].Schedule));
                scope.EventRule.ScheduleType = eventRules[0].ScheduleType;
                if (typeof eventRules[0].EventAction !== 'undefined') {
                    if (eventRules[0].EventAction.indexOf('FTP') !== -1) {
                        scope.EventRule.FtpEnable = true;
                    }
                    if (eventRules[0].EventAction.indexOf('SMTP') !== -1) {
                        scope.EventRule.SmtpEnable = true;
                    }
                    if (eventRules[0].EventAction.indexOf('Record') !== -1) {
                        scope.EventRule.RecordEnable = true;
                    }
                }
                scope.EventRule.AlarmOutputs = [];
                if (typeof eventRules[0].AlarmOutputs === 'undefined') {
                    for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                        scope.EventRule.AlarmOutputs[ao] = {};
                        scope.EventRule.AlarmOutputs[ao].Duration = 'Off';
                    }
                } else {
                    for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                        scope.EventRule.AlarmOutputs[ao] = {};
                        var duration = 'Off';
                        for (var j = 0; j < eventRules[0].AlarmOutputs.length; j++) {
                            if ((ao + 1) === eventRules[0].AlarmOutputs[j].AlarmOutput) {
                                duration = eventRules[0].AlarmOutputs[j].Duration;
                                break;
                            }
                        }
                        scope.EventRule.AlarmOutputs[ao].Duration = duration;
                    }
                }
                if (typeof eventRules[0].PresetNumber === 'undefined') {
                    scope.EventRule.PresetNumber = 'Off';
                } else {
                    scope.EventRule.PresetNumber = eventRules[0].PresetNumber + '';
                }

                scope.$apply(function() {
                    pageData.EventRule = angular.copy(scope.EventRule);
                });

                eventRuleService.setEventRuleData({pageData: scope.EventRule, scopeData: scope.EventRule, menu: scope.EventSource});

                // scope.$emit('EventRulePrepared', scope.EventRule.ScheduleType);
            };

            function prepareEventActions(eventActions) {
                var eventAction = eventActions[0].Actions;
                scope.EventRule = {};
                scope.EventRule.FtpEnable = false;
                scope.EventRule.SmtpEnable = false;
                scope.EventRule.RecordEnable = false;
                scope.EventRule.Enable = eventAction[0].Enable;
                scope.EventRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventAction[0].Schedule));
                scope.EventRule.ScheduleType = eventAction[0].ScheduleType;
                scope.EventRule.EventType = eventActions[0].EventType;

                if (typeof eventAction[0].EventActions !== 'undefined') {
                    if (eventAction[0].EventActions.indexOf('FTP') !== -1) {
                        scope.EventRule.FtpEnable = true;
                    }
                    if (eventAction[0].EventActions.indexOf('SMTP') !== -1) {
                        scope.EventRule.SmtpEnable = true;
                    }
                    if (eventAction[0].EventActions.indexOf('Record') !== -1) {
                        scope.EventRule.RecordEnable = true;
                    }
                }
                scope.EventRule.AlarmOutputs = [];
                if (typeof eventAction[0].AlarmOutputs[0].Duration === 'undefined' || eventAction[0].AlarmOutputs[0].Duration === 'None') {
                    for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                        scope.EventRule.AlarmOutputs[ao] = {};
                        scope.EventRule.AlarmOutputs[ao].Duration = 'Off';
                    }
                } else {
                    for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                        scope.EventRule.AlarmOutputs[ao] = {};
                        var duration = 'Off';
                        for (var j = 0; j < eventAction[0].AlarmOutputs.length; j++) {
                            if ((ao + 1) === eventAction[0].AlarmOutputs[j].AlarmOutput) {
                                duration = eventAction[0].AlarmOutputs[j].Duration;
                                break;
                            }
                        }
                        scope.EventRule.AlarmOutputs[ao].Duration = duration;
                    }
                }
                if (typeof eventAction[0].PresetNumber === 'undefined') {
                    scope.EventRule.PresetNumber = 'Off';
                } else {
                    scope.EventRule.PresetNumber = eventAction[0].PresetNumber + '';
                }
                scope.$apply(function() {
                    pageData.EventRule = angular.copy(scope.EventRule);
                });

                eventRuleService.setEventRuleData({pageData: scope.EventRule, scopeData: scope.EventRule, menu: scope.EventSource});

                scope.$emit('EventRulePrepared', scope.EventRule.ScheduleType);
            };

            function prepareEventActionArray(eventActions) {
                scope.EventRules = [];
                for (var ai = 0; ai < mAttr.MaxAlarmInput; ai++) {
                    var eventType = 'AlarmInput.' + (ai + 1);
                    for (var i = 0; i < eventActions.length; i++) {
                        var mRule = {};
                        mRule.FtpEnable = false;
                        mRule.SmtpEnable = false;
                        mRule.RecordEnable = false;
                        if (eventActions[i].EventType === 'AlarmInput.#') {
                            var actions = eventActions[i].Actions;
                            for(var k = 0; k < actions.length; k++) {
                                mRule.Enable = actions[k].Enable;
                                mRule.RuleIndex = actions[k].AlarmInput;
                                mRule.ScheduleType = actions[k].ScheduleType;
                                mRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(actions[k].Schedule));
                                if(typeof actions[k].EventActions !== 'undefined') {
                                    if (actions[k].EventActions.indexOf('FTP') !== -1) {
                                        mRule.FtpEnable = true;
                                    }
                                    if (actions[k].EventActions.indexOf('SMTP') !== -1) {
                                        mRule.SmtpEnable = true;
                                    }
                                    if (actions[k].EventActions.indexOf('Record') !== -1) {
                                        mRule.RecordEnable = true;
                                    }
                                }
                                mRule.AlarmOutputs = [];
                                if (typeof actions[k].AlarmOutputs === 'undefined' || actions[k].AlarmOutputs[0].Duration === 'None') {
                                    for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                                        mRule.AlarmOutputs[ao] = {};
                                        mRule.AlarmOutputs[ao].Duration = 'Off';
                                    }
                                } else {
                                    for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                                        mRule.AlarmOutputs[ao] = {};
                                        var duration = 'Off';
                                        for (var j = 0; j < actions[k].AlarmOutputs.length; j++) {
                                            if (ao + 1 === actions[k].AlarmOutputs[j].AlarmOutput) {
                                                duration = actions[k].AlarmOutputs[j].Duration;
                                                break;
                                            }
                                        }
                                        mRule.AlarmOutputs[ao].Duration = duration;
                                    }
                                }
                                if (typeof actions[k].PresetNumber === 'undefined') {
                                    mRule.PresetNumber = 'Off';
                                } else {
                                    mRule.PresetNumber = actions[k].PresetNumber + '';
                                }
                                scope.EventRules.push(mRule);
                            }
                        }
                    }
                }

                scope.$apply(function() {
                    pageData.EventRules = angular.copy(scope.EventRules);
                });

                eventRuleService.setEventRuleData({pageData: scope.EventRules, scopeData: scope.EventRules, menu: scope.EventSource});

                // scope.$emit('EventRulePrepared', scope.EventRules.ScheduleType);
            }

            function prepareEventRuleArray(eventRules) {console.info(eventRules);
                scope.EventRules = [];
                for (var ai = 0; ai < mAttr.MaxAlarmInput; ai++) {
                    var mRule = {};
                    mRule.FtpEnable = false;
                    mRule.SmtpEnable = false;
                    mRule.RecordEnable = false;
                    var sourceName = 'AlarmInput.' + (ai + 1);
                    for (var i = 0; i < eventRules.length; i++) {
                        if (eventRules[i].EventSource === sourceName) {
                            mRule.Enable = eventRules[i].Enable;
                            mRule.RuleIndex = eventRules[i].RuleIndex;
                            mRule.ScheduleIds = angular.copy(COMMONUtils.getSchedulerIds(eventRules[i].Schedule));
                            mRule.ScheduleType = eventRules[i].ScheduleType;
                            if (typeof eventRules[i].EventAction !== 'undefined') {
                                if (eventRules[i].EventAction.indexOf('FTP') !== -1) {
                                    mRule.FtpEnable = true;
                                }
                                if (eventRules[i].EventAction.indexOf('SMTP') !== -1) {
                                    mRule.SmtpEnable = true;
                                }
                                if (eventRules[i].EventAction.indexOf('Record') !== -1) {
                                    mRule.RecordEnable = true;
                                }
                            }
                            mRule.AlarmOutputs = [];
                            if (typeof eventRules[i].AlarmOutputs === 'undefined') {
                                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                                    mRule.AlarmOutputs[ao] = {};
                                    mRule.AlarmOutputs[ao].Duration = 'Off';
                                }
                            } else {
                                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                                    mRule.AlarmOutputs[ao] = {};
                                    var duration = 'Off';
                                    for (var j = 0; j < eventRules[i].AlarmOutputs.length; j++) {
                                        if (ao + 1 === eventRules[i].AlarmOutputs[j].AlarmOutput) {
                                            duration = eventRules[i].AlarmOutputs[j].Duration;
                                            break;
                                        }
                                    }
                                    mRule.AlarmOutputs[ao].Duration = duration;
                                }
                            }
                            if (typeof eventRules[i].PresetNumber === 'undefined') {
                                mRule.PresetNumber = 'Off';
                            } else {
                                mRule.PresetNumber = eventRules[i].PresetNumber + '';
                            }
                            scope.EventRules.push(mRule);
                            break;
                        }
                    }
                }

                scope.$apply(function() {
                    pageData.EventRules = angular.copy(scope.EventRules);
                });

                eventRuleService.setEventRuleData({pageData: scope.EventRules, scopeData: scope.EventRules, menu: scope.EventSource});

                // scope.$emit('EventRulePrepared', scope.EventRules.ScheduleType);
            }

            scope.$watch('pageLoaded', function(newVal, oldVal){
                if(typeof newVal === "undefined"){
                    return;
                }//console.info('eventactionsetup watch pageloaded : ');console.info(scope.EventSource);
                if(newVal === true) {
                    if(isEventActionSupported && isMultiChannel) {
                        if(scope.EventSource !== 'AlarmInput') {
                            getEventActions();
                        } else {
                            getEventActionArray();
                        }
                    } else {
                        if(scope.EventSource !== 'AlarmInput') {
                            getEventRules();
                        } else {
                            getEventRuleArray();
                        }
                    }
                }
            }, true);

            // when update eventRule data by user mouse, set data for eventRuleService.
            scope.$watch('EventRule', function(newVal, oldVal){
                if(typeof newVal === "undefined"){
                    return;
                }//console.info('eventactionsetup watch EventRule : ');console.info(scope.EventSource);
                var data = {
                    pageData: pageData.EventRule,
                    scopeData: scope.EventRule,
                    menu: scope.EventSource,
                }
                eventRuleService.setEventRuleData(data);
            }, true);

            // when update eventRules data by user mouse, set data for eventRuleService.
            scope.$watch('EventRules', function(newVal, oldVal){
                if(typeof newVal === "undefined"){
                    return;
                }//console.info('eventactionsetup watch EventRules : ');console.info(scope.EventSource);
                var data = {
                    pageData: pageData.EventRules,
                    scopeData: scope.EventRules,
                    menu: scope.EventSource
                }
                eventRuleService.setEventRuleData(data);
            }, true);

            scope.$saveOn('pageLoaded', function(event, data) {//console.info('eventactionsetup saveon pageloaded : ');console.info(scope.EventSource);
                currentPage = data;
                if(currentPage === scope.EventSource) {
                    if(isEventActionSupported && isMultiChannel) {
                        if(scope.EventSource !== 'AlarmInput') {
                            getEventActions();
                        } else {
                            getEventActionArray();
                        }
                    } else {
                        if(scope.EventSource !== 'AlarmInput') {
                            getEventRules();
                        } else {
                            getEventRuleArray();
                        }
                    }
                }
            });

            scope.$saveOn('applied', function(event, data) {//console.info('eventactionsetup saveon applied : ');console.info(scope.EventSource);
                var channel = null;
                if(data !== true) { // target channel to set passed as parameter.
                    channel = data;
                }
                if(scope.EventSource !== 'AlarmInput') {
                    if (!angular.equals(pageData.EventRule, scope.EventRule)) {
                        if(isEventActionSupported && isMultiChannel) {
                            setEventActions(channel);
                        } else {
                            setEventRules();
                        }
                    }
                } else {
                    if (!angular.equals(pageData.EventRules, scope.EventRules)) {
                        if(isEventActionSupported && isMultiChannel) {
                            scope.EventRules.forEach(function(elem, index){
                                if (!angular.equals(pageData.EventRules[index], scope.EventRules[index])) {
                                    setEventActionsByIndex(index);
                                }
                            });
                        } else {
                            scope.EventRules.forEach(function(elem, index){
                                if (!angular.equals(pageData.EventRules[index], scope.EventRules[index])) {
                                    setEventRulesByIndex(index);
                                }
                            });
                        }
                    }
                }
            });
            
            scope.getTitleAutoSimpleFcous = function(){
                if(mAttr.PTZModel || mAttr.ZoomOnlyModel){
                    return 'lang_autoFocus';
                } else {
                    return 'lang_simpleFocus';
        }
            }
        }
    };
}]);
