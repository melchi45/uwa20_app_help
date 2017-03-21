kindFramework.controller('eventSetupCtrl', function($scope, $location, $timeout, $uibModal, SunapiClient, Attributes, COMMONUtils, $q, $rootScope, ModalManagerService) {
    "use strict";
    var mAttr = Attributes.get();
    var pageData = {};
    var BrowserDetect = COMMONUtils.getBrowserDetect();

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

    function convertEventTypeToEventSource(eventType) {
        switch(eventType) {
            case 'Timer':
                return 'Timer';
            case 'NetworkDisconnect':
                return 'NetworkEvent';
            case 'AlarmInput.#':
                return 'AlarmInput.1';
            case 'Channel.#.MotionDetection':
                return 'MotionDetection';
            case 'Channel.#.FogDetection':
                return 'FogDetection';
            case 'Channel.#.DefocusDetection':
                return 'DefocusDetection';
            case 'Channel.#.TamperingDetection':
                return 'TamperingDetection';
            case 'Channel.#.FaceDetection':
                return 'FaceDetection';
            case 'Channel.#.VideoAnalysis':
                return 'VideoAnalysis';
        }
        return null
    }

    $scope.changeNaming = function(option) {
        if (option === 'MDAndIV') {
            return 'MD_VA_short';
        } else if (option === 'Tracking') {
            return 'AutoTracking';
        }
        return option;
    };

    $scope.getTranslatedOption = function(Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };
    $scope.showReducedEventList = false;
    if (BrowserDetect.isIE) {
        $scope.maxInitialEvents = 3;
        $scope.showReducedEventList = true;
    } else {
        /** Show all the events for other browsers */
        $scope.maxInitialEvents = 1000;
    }
    $scope.eventCountToShow = $scope.maxInitialEvents;
    $scope.showAdvancedMenu = false;
    $scope.showAdvancedLabel = 'lang_show';
    $scope.isEventActionSupported = false;
    $scope.isMultiChannel = false;

    $scope.showMoreEvents = function() {
        $scope.eventCountToShow = $scope.EventRules.length;
    };
    $scope.advacedMenu = function() {
        if ($scope.showAdvancedMenu === false) {
            $scope.showAdvancedMenu = true;
            $scope.eventCountToShow = $scope.EventRules.length;
            $scope.showAdvancedLabel = 'lang_hide';
        } else {
            $scope.showAdvancedMenu = false;
            $scope.eventCountToShow = $scope.maxInitialEvents;
            $scope.showAdvancedLabel = 'lang_show';
        }
    };
    $scope.sourceSelected = function(source) {
        var path = null;
        switch (source) {
            case 'MotionDetection':
                path = '/setup/analytics_motionDetection/v2';
                break;
            case 'VideoAnalysis':
                path = '/setup/analytics_iva';
                break;
            case 'NetworkEvent':
                path = '/setup/event_nwDisconnection';
                break;
            case 'NetworkDisconnect':
                path = '/setup/event_nwDisconnection';
                break;
            case 'FaceDetection':
                path = '/setup/analytics_faceDetection';
                break;
            case 'TamperingDetection':
                path = '/setup/analytics_tamperDetection';
                break;
            case 'AudioDetection':
                path = '/setup/analytics_audioDetection';
                break;
            case 'Timer':
                path = '/setup/event_timeSchedule';
                break;
            case 'OpenSDK':
                path = '/setup/event_appEvent';
                break;
            case 'Tracking':
                path = '/setup/analytics_autoTrackEvent';
                break;
            case 'DefocusDetection':
                path = '/setup/analytics_defocusDetection';
                break;
            case 'FogDetection':
                path = '/setup/analytics_fogDetection';
                break;                
            case 'AudioAnalysis':
                path = '/setup/analytics_soundClassification';
                break;                
            default:
                var str = source.split('.');
                Attributes.setDefaultAlarmIndex(str[1] - 1);
                path = '/setup/event_alarminput';
                break;
        }
        $location.path(path);
    };

    function getAttributes() {
        var eventActions = null;
        if(mAttr.MaxChannel > 1) {
            $scope.isMultiChannel = true;
        }
        $scope.MaxAlarmInput = mAttr.MaxAlarmInput;
        $scope.MaxAlarmOutput = mAttr.MaxAlarmOutput;
        if (mAttr.EventSources !== undefined) {
            $scope.EventSources = mAttr.EventSources;
        }
        if (mAttr.EventActions !== undefined) {
            eventActions = mAttr.EventActions;
        }
        $scope.isEventActionSupported = mAttr.EventActionSupport;
        $scope.ftpActionSupported = (eventActions.indexOf('FTP') !== -1);
        $scope.smtpActionSupported = (eventActions.indexOf('SMTP') !== -1);
        $scope.recordActionSupported = (eventActions.indexOf('Record') !== -1);
        $scope.presetActionSupported = (eventActions.indexOf('GoToPreset') !== -1);
        if (mAttr.AlarmoutDurationOptions !== undefined) {
            $scope.AlarmoutDurationOptions = mAttr.AlarmoutDurationOptions;
        }
        if (Attributes.isSupportGoToPreset() === true) {
            $scope.PresetOptions = Attributes.getPresetOptions();
        }
        $scope.getAlarmOutArray = COMMONUtils.getArray(mAttr.MaxAlarmOutput);
        $scope.alarmActionSupported = [];
        for (var i = 0; i < mAttr.MaxAlarmOutput; i++) {
            $scope.alarmActionSupported[i] = eventActions.indexOf('AlarmOutput.' + (i + 1)) !== -1;
        }
    }

    // get Common events by eventrules.cgi
    function prepareEventRules(eventRules) {
        $scope.EventRules = [];
        for (var i = 0, len = eventRules.length; i < len; i++) {
            var mRule = {};
            var eventSource = eventRules[i].EventSource;
            var alarmOutputs = eventRules[i].AlarmOutputs;
            mRule = angular.copy(eventRules[i]);
            if (typeof mRule.AlarmOutputs === 'undefined') {
                mRule.AlarmOutputs = [];
                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                    mRule.AlarmOutputs[ao] = {
                        Duration: 'Off'
                    };
                }
            } else {
                mRule.AlarmOutputs = [];
                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                    mRule.AlarmOutputs[ao] = {};
                    var duration = 'Off';
                    for (var j = 0, jLen = alarmOutputs.length; j < jLen; j++) {
                        var self = alarmOutputs[j];
                        if (ao + 1 === self.AlarmOutput) {
                            duration = self.Duration;
                            break;
                        }
                    }
                    mRule.AlarmOutputs[ao].Duration = duration;
                }
            }
            if (typeof mRule.PresetNumber === 'undefined') {
                mRule.PresetNumber = 'Off';
            }
            mRule.FtpEnable = false;
            mRule.SmtpEnable = false;
            mRule.RecordEnable = false;
            if (typeof mRule.EventAction !== 'undefined') {
                if (mRule.EventAction.indexOf('FTP') !== -1) {
                    mRule.FtpEnable = true;
                }
                if (mRule.EventAction.indexOf('SMTP') !== -1) {
                    mRule.SmtpEnable = true;
                }
                if (mRule.EventAction.indexOf('Record') !== -1) {
                    mRule.RecordEnable = true;
                }
            }
            mRule.SupportedActions = COMMONUtils.getSupportedEventActions(eventSource);
            mRule.ftpActionSupported = mRule.SupportedActions.indexOf('FTP') !== -1;
            mRule.smtpActionSupported = mRule.SupportedActions.indexOf('SMTP') !== -1;
            mRule.recordActionSupported = mRule.SupportedActions.indexOf('Record') !== -1;
            mRule.alarmActionSupported = mRule.SupportedActions.indexOf('AlarmOutput') !== -1;
            mRule.presetActionSupported = mRule.SupportedActions.indexOf('GoToPreset') !== -1;
            if (eventSource === 'MotionDetection') {
                mRule.EventOrder = 6;
                $scope.EventRules.push(mRule);
            } else if(eventSource === 'VideoAnalysis' ) {
                mRule.EventOrder = 7;
                $scope.EventRules.push(mRule);
            } else if (eventSource === 'NetworkEvent') {
                mRule.EventOrder = 11;
                $scope.EventRules.push(mRule);
            } else if (eventSource === 'FaceDetection') {
                mRule.EventOrder = 8;
                $scope.EventRules.push(mRule);
            } else if (eventSource === 'TamperingDetection') {
                mRule.EventOrder = 4;
                $scope.EventRules.push(mRule);
            } else if (eventSource === 'AudioDetection') {
                if(mAttr.MaxAudioOutput > 0 || mAttr.MaxAudioInput > 0) {
                    mRule.EventOrder = 9;
                    $scope.EventRules.push(mRule);
                }
            } else if (eventSource === 'Timer') {
                mRule.EventOrder = 2;
                $scope.EventRules.push(mRule);
            } else if (eventSource === 'OpenSDK') {
                mRule.EventOrder = 13;
                $scope.EventRules.push(mRule);
            } else if (eventSource === 'Tracking') {
                mRule.EventOrder = 12;
                $scope.EventRules.push(mRule);
            } else if (eventSource === 'DefocusDetection') {
                mRule.EventOrder = 5;
                $scope.EventRules.push(mRule);
            } else if (eventSource === 'FogDetection') {
                mRule.EventOrder = 3;
                $scope.EventRules.push(mRule);
            } else if (eventSource === 'AudioAnalysis') {
                if(mAttr.MaxAudioOutput > 0 || mAttr.MaxAudioInput > 0) {
                    mRule.EventOrder = 10;
                    $scope.EventRules.push(mRule);
                }
            } else if (eventSource === 'UserInput') {} else {
                for (var ai = 0; ai < mAttr.MaxAlarmInput; ai++) {
                    var sourceName = 'AlarmInput.' + (ai + 1);
                    if (eventSource === sourceName) {
                        mRule.SupportedActions = COMMONUtils.getSupportedEventActions(eventSource);
                        mRule.Index = ai + 1;
                        mRule.EventOrder = 1;
                        $scope.EventRules.push(mRule);
                        break;
                    }
                }
            }
        }
        pageData.EventRules = angular.copy($scope.EventRules);
    }

    // get Common and Channel events by eventactions.cgi
    function prepareEventActions(eventActionList) {
        $scope.ChannelEventRules = [];
        $scope.CommonEventRules = [];
        for (var i = 0, len = eventActionList.length; i < len; i++) {
            var mRule = {};
            var eventAction = eventActionList[i].Actions;
            var currentChannel = $scope.channelSelectionSection.getCurrentChannel();
            if(eventAction[currentChannel] === undefined) {
                currentChannel = 0;
            }
            var eventType = eventActionList[i].EventType;
            var eventSource = convertEventTypeToEventSource(eventType);
            var alarmOutputs = eventAction.AlarmOutputs;
            mRule = angular.copy(eventActionList[i]);
            mRule.EventSource = eventSource;
            mRule.FtpEnable = false;
            mRule.SmtpEnable = false;
            mRule.RecordEnable = false;

            mRule.Enable = eventAction[currentChannel].Enable;

            if (typeof eventAction[currentChannel].EventActions !== 'undefined') {
                if (eventAction[currentChannel].EventActions.indexOf('FTP') !== -1) {
                    mRule.FtpEnable = true;
                }
                if (eventAction[currentChannel].EventActions.indexOf('SMTP') !== -1) {
                    mRule.SmtpEnable = true;
                }
                if (eventAction[currentChannel].EventActions.indexOf('Record') !== -1) {
                    mRule.RecordEnable = true;
                }
            }
            mRule.AlarmOutputs = [];
            if (typeof eventAction[currentChannel].AlarmOutputs[0].Duration === 'undefined' || eventAction[0].AlarmOutputs[0].Duration === 'None') {
                mRule.AlarmOutputs = [];
                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                    mRule.AlarmOutputs[ao] = {
                        Duration: 'Off'
                    };
                }
            } else {
                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                    mRule.AlarmOutputs[ao] = {};
                    var duration = 'Off';
                    for (var j = 0; j < eventAction[currentChannel].AlarmOutputs.length; j++) {
                        if ((ao + 1) === eventAction[currentChannel].AlarmOutputs[j].AlarmOutput) {
                            duration = eventAction[currentChannel].AlarmOutputs[j].Duration;
                            break;
                        }
                    }
                    mRule.AlarmOutputs[ao].Duration = duration;
                }
            }
            if (typeof eventAction[currentChannel].PresetNumber === 'undefined') {
                mRule.PresetNumber = 'Off';
            }

            mRule.SupportedActions = COMMONUtils.getSupportedEventActions(eventSource);
            mRule.ftpActionSupported = mRule.SupportedActions.indexOf('FTP') !== -1;
            mRule.smtpActionSupported = mRule.SupportedActions.indexOf('SMTP') !== -1;
            mRule.recordActionSupported = mRule.SupportedActions.indexOf('Record') !== -1;
            mRule.alarmActionSupported = mRule.SupportedActions.indexOf('AlarmOutput') !== -1;
            mRule.presetActionSupported = mRule.SupportedActions.indexOf('GoToPreset') !== -1;
            if (eventSource === 'MotionDetection') {
                mRule.EventOrder = 4;
                $scope.ChannelEventRules.push(mRule);
            } else if(eventSource === 'VideoAnalysis' ) {
                mRule.EventOrder = 5;
                $scope.ChannelEventRules.push(mRule);
            } else if (eventSource === 'NetworkEvent') {
                mRule.EventOrder = 3;
                $scope.CommonEventRules.push(mRule);
            } else if (eventSource === 'FaceDetection') {
                mRule.EventOrder = 6;
                $scope.ChannelEventRules.push(mRule);
            } else if (eventSource === 'TamperingDetection') {
                mRule.EventOrder = 2;
                $scope.ChannelEventRules.push(mRule);
            } else if (eventSource === 'AudioDetection') {
                mRule.EventOrder = 7;
                $scope.ChannelEventRules.push(mRule);
            } else if (eventSource === 'Timer') {
                mRule.EventOrder = 2;
                $scope.CommonEventRules.push(mRule);
            } else if (eventSource === 'OpenSDK') {
                mRule.EventOrder = 4;
                $scope.CommonEventRules.push(mRule);
            } else if (eventSource === 'Tracking') {
                mRule.EventOrder = 5;
                $scope.CommonEventRules.push(mRule);
            } else if (eventSource === 'DefocusDetection') {
                mRule.EventOrder = 3;
                $scope.ChannelEventRules.push(mRule);
            } else if (eventSource === 'FogDetection') {
                mRule.EventOrder = 1;
                $scope.ChannelEventRules.push(mRule);
            } else if (eventSource === 'AudioAnalysis') {
                mRule.EventOrder = 8;
                $scope.ChannelEventRules.push(mRule);
            } else if (eventSource === 'UserInput') {

            } else {
                for (var ai = 0; ai < mAttr.MaxAlarmInput; ai++) {
                    var sourceName = 'AlarmInput.' + (ai + 1);
                    if (eventSource === sourceName) {
                        mRule.SupportedActions = COMMONUtils.getSupportedEventActions(eventSource);
                        mRule.Index = ai + 1;
                        mRule.EventOrder = 1;
                        $scope.CommonEventRules.push(mRule);
                        break;
                    }
                }
            }
        }
        pageData.CommonEventRules = angular.copy($scope.CommonEventRules);
        pageData.ChannelEventRules = angular.copy($scope.ChannelEventRules);
        console.info('prepareEventActions ::: ');console.info($scope.CommonEventRules);console.info($scope.ChannelEventRules);
    }

    function getEventRules() {
        var getData = {};
        var url = '';
        if($scope.isEventActionSupported && $scope.isMultiChannel) {
            url = '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=view';
        } else {
            url = '/stw-cgi/eventrules.cgi?msubmenu=rules&action=view';
        }

        return SunapiClient.get(
            url, 
            getData, 
            function(response) {
                if($scope.isEventActionSupported && $scope.isMultiChannel) {
                    prepareEventActions(response.data.ComplexActions);
                } else {
                    prepareEventRules(response.data.EventRules);
                }
            },
            function(errorData) {
                //alert(errorData);
            }, 
            '', 
            true
        );
    }

    function cameraView() {
        var getData = {};
        var currentChannel = $scope.channelSelectionSection.getCurrentChannel();
        getData.Channel = currentChannel;
        return SunapiClient.get(
            '/stw-cgi/image.cgi?msubmenu=camera&action=view', 
            getData, 
            function(response) {
                if($scope.isMultiChannel) {
                    $scope.Camera = response.data.Camera[currentChannel];
                } else {
                    $scope.Camera = response.data.Camera[0];
                }
            }, 
            function(errorData) {
                //alert(errorData);
            }, 
            '', 
            true
        );
    }
    $scope.isSupportedEventSource = function(rule) {
        var retVal = true;
        if ($scope.Camera !== undefined) {
            if (rule.RuleName.indexOf('AlarmInput') !== -1) {
                if ($scope.Camera.DayNightMode === 'ExternalBW') {
                    retVal = false;
                }
            }
        }
        return retVal;
    };

    $scope.isSupportedEventSourceForMultiChannel = function(rule) {
        var retVal = true;
        if ($scope.Camera !== undefined) {
            if (rule.EventType.indexOf('AlarmInput.#') !== -1) {
                if ($scope.Camera.DayNightMode === 'ExternalBW') {
                    retVal = false;
                }
            }
        }
        return retVal;
    };

    function sunapiQueueRequest(queue, callback){
        function reqCallback(){
            if(queue.length > 0){
                sunapiQueueRequest(queue, callback);
            }else{
                callback();
            }
        }

        var currentItem = queue.shift();
        SunapiClient.get(
            currentItem.url, 
            currentItem.reqData, 
            function(response){

            }, 
            function(errorData) {
            //alert(errorData);
            }, 
            '', 
            true
        ).then(reqCallback);
    }

    function setEventRules() {
        var queue = [];
        var channel = 0;

        for (var i = 0; i < $scope.EventRules.length; i++) {
            var setData = {};
            var scopeEventRule = $scope.EventRules[i];
            if (!angular.equals(pageData.EventRules[i], scopeEventRule)) {
                setData.RuleIndex = scopeEventRule.RuleIndex;
                if (pageData.EventRules[i].Enable !== scopeEventRule.Enable) {
                    setData.Enable = scopeEventRule.Enable;
                }
                setData.EventAction = [];
                if (scopeEventRule.FtpEnable) {
                    setData.EventAction.push('FTP');
                }
                if (scopeEventRule.SmtpEnable) {
                    setData.EventAction.push('SMTP');
                }
                if (scopeEventRule.RecordEnable) {
                    setData.EventAction.push('Record');
                }
                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                    if (scopeEventRule.AlarmOutputs[ao].Duration !== 'Off') {
                        setData.EventAction.push('AlarmOutput.' + (ao + 1));
                        setData["AlarmOutput." + (ao + 1) + ".Duration"] = scopeEventRule.AlarmOutputs[ao].Duration;
                    }
                }
                if (scopeEventRule.PresetNumber !== 'Off') {
                    setData.EventAction.push('GoToPreset');
                    setData.PresetNumber = scopeEventRule.PresetNumber;
                }
                if (setData.EventAction.length) {
                    setData.EventAction = setData.EventAction.join(',');
                }

                setData.Channel = channel;
                channel++;
                queue.push({
                    url: '/stw-cgi/eventrules.cgi?msubmenu=rules&action=update',
                    reqData: setData
                });

                /*SunapiClient.get('/stw-cgi/eventrules.cgi?msubmenu=rules&action=update', setData, function(response) {}, function(errorData) {
                    //alert(errorData);
                }, '', true);*/
            }
        }

        sunapiQueueRequest(queue, function(){
            pageData.EventRules = angular.copy($scope.EventRules); 
        });
    }

    function setEventActions() {
        var queue = [];

        for (var i = 0; i < $scope.CommonEventRules.length; i++) {
            var tEventRule = $scope.CommonEventRules[i];
            var setData = {};
            if (!angular.equals(pageData.CommonEventRules[i], tEventRule)) {
                if (pageData.CommonEventRules[i].Enable !== tEventRule.Enable) {
                    setData.Enable = tEventRule.Enable;
                }
                setData.EventAction = [];
                if (tEventRule.FtpEnable) {
                    setData.EventAction.push('FTP');
                }
                if (tEventRule.SmtpEnable) {
                    setData.EventAction.push('SMTP');
                }
                if (tEventRule.RecordEnable) {
                    setData.EventAction.push('Record');
                }
                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                    if (tEventRule.AlarmOutputs[ao].Duration !== 'Off') {
                        setData.EventAction.push('AlarmOutput.' + (ao + 1));
                        setData["AlarmOutput." + (ao + 1) + ".Duration"] = tEventRule.AlarmOutputs[ao].Duration;
                    }
                }
                if (tEventRule.PresetNumber !== 'Off') {
                    setData.EventAction.push('GoToPreset');
                    setData.PresetNumber = tEventRule.PresetNumber;
                }
                if (setData.EventAction.length) {
                    setData.EventAction = setData.EventAction.join(',');
                }

                if(setData.EventAction.length === 0) {
                    setData.EventAction.push('None');
                }

                if(tEventRule.EventType === 'AlarmInput.#') {
                    setData.EventType = tEventRule.EventSource;
                } else {
                    setData.EventType = tEventRule.EventType;
                }

                queue.push({
                    url: '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=set',
                    reqData: setData
                });
            }
        }

        for (var i = 0; i < $scope.ChannelEventRules.length; i++) {
            var tEventRule = $scope.ChannelEventRules[i];
            var setData = {};
            if (!angular.equals(pageData.ChannelEventRules[i], tEventRule)) {
                if (pageData.ChannelEventRules[i].Enable !== tEventRule.Enable) {
                    setData.Enable = tEventRule.Enable;
                }
                setData.EventAction = [];
                if (tEventRule.FtpEnable) {
                    setData.EventAction.push('FTP');
                }
                if (tEventRule.SmtpEnable) {
                    setData.EventAction.push('SMTP');
                }
                if (tEventRule.RecordEnable) {
                    setData.EventAction.push('Record');
                }
                for (var ao = 0; ao < mAttr.MaxAlarmOutput; ao++) {
                    if (tEventRule.AlarmOutputs[ao].Duration !== 'Off') {
                        setData.EventAction.push('AlarmOutput.' + (ao + 1));
                        setData["AlarmOutput." + (ao + 1) + ".Duration"] = tEventRule.AlarmOutputs[ao].Duration;
                    }
                }
                if (tEventRule.PresetNumber !== 'Off') {
                    setData.EventAction.push('GoToPreset');
                    setData.PresetNumber = tEventRule.PresetNumber;
                }
                if (setData.EventAction.length) {
                    setData.EventAction = setData.EventAction.join(',');
                }

                if(setData.EventAction.length === 0) {
                    setData.EventAction.push('None');
                }

                setData.EventType = 'Channel.' + $scope.channelSelectionSection.getCurrentChannel() + '.' + tEventRule.EventSource; // EventType=Channel.0.MotionDetection

                queue.push({
                    url: '/stw-cgi/eventactions.cgi?msubmenu=complexaction&action=set',
                    reqData: setData
                });
            }
        }
console.info('setEventActions ::: ');console.info(queue);
        sunapiQueueRequest(queue, function(){
            pageData.CommonEventRules = angular.copy($scope.CommonEventRules);
            pageData.ChannelEventRules = angular.copy($scope.ChannelEventRules);
        });
    }

    function prepareInfoData() {

    }


    $scope.presetGotoSelectShowChange = function(index,isShow,event){
        if(isShow){
            for(var i=0;i<$scope.EventRules.length;i++){
                var eventSource = $scope.EventRules[i].EventSource;
                $scope.presetGotoSelectShow[eventSource].selectShow=false;
                $scope.presetGotoSelectShow[eventSource].inputShow=true;
            }
            if(event != undefined){
                var code = event.which;
                if(code==32) event.preventDefault();
                if(code==32||code==13||code==188||code==186){
                    $scope.presetGotoSelectShow[index].inputShow=false;
                    $scope.presetGotoSelectShow[index].selectShow=true;
                    $timeout(function(){
                        $('.presetSelectbox').focus();
                    },100);
                }
            }else{
                $scope.presetGotoSelectShow[index].inputShow=false;
                $scope.presetGotoSelectShow[index].selectShow=true;
                $timeout(function(){
                    $('.presetSelectbox').focus();
                },100);
            }
        }else{
            $scope.presetGotoSelectShow[index].selectShow=false;
            $timeout(function(){
                $scope.presetGotoSelectShow[index].inputShow=true;
            },100);
        }
    };
    $scope.presetAlarmActionSelectShowChange = function(index,alarmIndex,isShow,event){
        if(isShow){
            for(var i=0;i<$scope.EventRules.length;i++){
                var eventSource = $scope.EventRules[i].EventSource;
                var subArray = $scope.presetAlarmActionSelectShow[eventSource];
                for(var j=0;j<subArray.length;j++){
                    $scope.presetAlarmActionSelectShow[eventSource][j].selectShow=false;
                    $scope.presetAlarmActionSelectShow[eventSource][j].inputShow=true;
                }
            }
            if(event != undefined){
                var code = event.which;
                if(code==32) event.preventDefault();
                if(code==32||code==13||code==188||code==186){
                    $scope.presetAlarmActionSelectShow[index][alarmIndex].inputShow=false;
                    $scope.presetAlarmActionSelectShow[index][alarmIndex].selectShow=true;
                    $timeout(function(){
                        $('.presetSelectbox').focus();
                    },100);
                }
            }else{
                $scope.presetAlarmActionSelectShow[index][alarmIndex].inputShow=false;
                $scope.presetAlarmActionSelectShow[index][alarmIndex].selectShow=true;
                $timeout(function(){
                    $('.presetSelectbox').focus();
                },100);
            }
        }else{
            $scope.presetAlarmActionSelectShow[index][alarmIndex].selectShow=false;
            $timeout(function(){
                $scope.presetAlarmActionSelectShow[index][alarmIndex].inputShow=true;
            },100);
        }
    };

    $scope.presetAlarmActionSelectShowChangeForCommonEvents = function(index,alarmIndex,isShow,event){
        if(isShow){
            for(var i=0;i<$scope.CommonEventRules.length;i++){
                var eventSource = $scope.CommonEventRules[i].EventSource;
                var subArray = $scope.presetAlarmActionSelectShow[eventSource];
                for(var j=0;j<subArray.length;j++){
                    $scope.presetAlarmActionSelectShow[eventSource][j].selectShow=false;
                    $scope.presetAlarmActionSelectShow[eventSource][j].inputShow=true;
                }
            }
            if(event != undefined){
                var code = event.which;
                if(code==32) event.preventDefault();
                if(code==32||code==13||code==188||code==186){
                    $scope.presetAlarmActionSelectShow[index][alarmIndex].inputShow=false;
                    $scope.presetAlarmActionSelectShow[index][alarmIndex].selectShow=true;
                    $timeout(function(){
                        $('.presetSelectbox').focus();
                    },100);
                }
            }else{
                $scope.presetAlarmActionSelectShow[index][alarmIndex].inputShow=false;
                $scope.presetAlarmActionSelectShow[index][alarmIndex].selectShow=true;
                $timeout(function(){
                    $('.presetSelectbox').focus();
                },100);
            }
        }else{
            $scope.presetAlarmActionSelectShow[index][alarmIndex].selectShow=false;
            $timeout(function(){
                $scope.presetAlarmActionSelectShow[index][alarmIndex].inputShow=true;
            },100);
        }
    };

    $scope.presetAlarmActionSelectShowChangeForChannelEvents = function(index,alarmIndex,isShow,event){
        if(isShow){
            for(var i=0;i<$scope.ChannelEventRules.length;i++){
                var eventSource = $scope.ChannelEventRules[i].EventSource;
                var subArray = $scope.presetAlarmActionSelectShow[eventSource];
                for(var j=0;j<subArray.length;j++){
                    $scope.presetAlarmActionSelectShow[eventSource][j].selectShow=false;
                    $scope.presetAlarmActionSelectShow[eventSource][j].inputShow=true;
                }
            }
            if(event != undefined){
                var code = event.which;
                if(code==32) event.preventDefault();
                if(code==32||code==13||code==188||code==186){
                    $scope.presetAlarmActionSelectShow[index][alarmIndex].inputShow=false;
                    $scope.presetAlarmActionSelectShow[index][alarmIndex].selectShow=true;
                    $timeout(function(){
                        $('.presetSelectbox').focus();
                    },100);
                }
            }else{
                $scope.presetAlarmActionSelectShow[index][alarmIndex].inputShow=false;
                $scope.presetAlarmActionSelectShow[index][alarmIndex].selectShow=true;
                $timeout(function(){
                    $('.presetSelectbox').focus();
                },100);
            }
        }else{
            $scope.presetAlarmActionSelectShow[index][alarmIndex].selectShow=false;
            $timeout(function(){
                $scope.presetAlarmActionSelectShow[index][alarmIndex].inputShow=true;
            },100);
        }
    };
    
    function initPresetSelectShow(){
        $scope.presetGotoSelectShow = [];
        $scope.presetAlarmActionSelectShow = [];
        for(var i=0;i<$scope.EventRules.length;i++){
            var eventSource = $scope.EventRules[i].EventSource;
            $scope.presetGotoSelectShow[eventSource] = {selectShow:false,inputShow:true};
            var alarmOutArray = [];
            for(var j=0;j<$scope.getAlarmOutArray.length;j++){
                alarmOutArray.push({selectShow:false,inputShow:true});
            }
            $scope.presetAlarmActionSelectShow[eventSource] = alarmOutArray;
        }
    }

    function initPresetSelectShowForMultiChannel(){
        $scope.presetGotoSelectShow = [];
        $scope.presetAlarmActionSelectShow = [];
        for(var i=0;i<$scope.CommonEventRules.length;i++){
            var eventSource = $scope.CommonEventRules[i].EventSource;
            $scope.presetGotoSelectShow[eventSource] = {selectShow:false,inputShow:true};
            var alarmOutArray = [];
            for(var j=0;j<$scope.getAlarmOutArray.length;j++){
                alarmOutArray.push({selectShow:false,inputShow:true});
            }
            $scope.presetAlarmActionSelectShow[eventSource] = alarmOutArray;
        }
        for(var i=0;i<$scope.ChannelEventRules.length;i++){
            var eventSource = $scope.ChannelEventRules[i].EventSource;
            $scope.presetGotoSelectShow[eventSource] = {selectShow:false,inputShow:true};
            var alarmOutArray = [];
            for(var j=0;j<$scope.getAlarmOutArray.length;j++){
                alarmOutArray.push({selectShow:false,inputShow:true});
            }
            $scope.presetAlarmActionSelectShow[eventSource] = alarmOutArray;
        }
    }
    
    function view() {
        getAttributes();
        $q.seqAll([getEventRules, cameraView]).then(function(result) {
            if($scope.isMultiChannel && $scope.isEventActionSupported) {
                initPresetSelectShowForMultiChannel();
            } else {
                initPresetSelectShow();
            }
            $scope.pageLoaded = true;
            $rootScope.$emit('changeLoadingBar', false);
        }, function(error) {});
    }

    function set() {
        var modalInstance = $uibModal.open({
            templateUrl: 'views/setup/common/confirmMessage.html',
            controller: 'confirmMessageCtrl',
            size: 'sm',
            resolve: {
                Message: function() {
                    return 'lang_apply_question';
                }
            }
        });

        if($scope.isMultiChannel && $scope.isEventActionSupported) {
            if (!angular.equals(pageData.CommonEventRules, $scope.CommonEventRules) ||
                !angular.equals(pageData.ChannelEventRules, $scope.ChannelEventRules)) {
                modalInstance.result.then(function() {
                    setEventActions();
                }, function() {});
            }
        } else {
            if (!angular.equals(pageData.EventRules, $scope.EventRules)) {
                modalInstance.result.then(function() {
                    setEventRules();
                }, function() {});
            }
        }
    }

    $rootScope.$saveOn('channelSelector:showInfo', function(event, response){
        $uibModal.open({
            templateUrl: 'views/setup/event/modal/ModalEventSetupInfo.html',
            controller: 'ModalInstanceEventSetupInfoCtrl'
        });
    }, $scope);

    $rootScope.$saveOn("channelSelector:selectChannel", function(event, data) {
        $scope.channelSelectionSection.setCurrentChannel(data);
        $rootScope.$emit('changeLoadingBar', true);
        view()
    }, $scope);

    $scope.submit = set;
    $scope.view = view;

    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function() {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            view();
        }
    })();
});