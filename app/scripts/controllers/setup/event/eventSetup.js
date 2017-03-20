kindFramework.controller('eventSetupCtrl', function($scope, $location, $timeout, $uibModal, SunapiClient, Attributes, COMMONUtils, $q, $rootScope, ModalManagerService) {
    "use strict";
    var mAttr = Attributes.get();
    var pageData = {};
    var BrowserDetect = COMMONUtils.getBrowserDetect();
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
        $scope.MaxAlarmInput = mAttr.MaxAlarmInput;
        $scope.MaxAlarmOutput = mAttr.MaxAlarmOutput;
        if (mAttr.EventSources !== undefined) {
            $scope.EventSources = mAttr.EventSources;
        }
        if (mAttr.EventActions !== undefined) {
            eventActions = mAttr.EventActions;
        }
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
                mRule.EventOrder = 9;
                $scope.EventRules.push(mRule);
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
                mRule.EventOrder = 10;
                $scope.EventRules.push(mRule);
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

    function getEventRules() {
        var getData = {};
        return SunapiClient.get(
            '/stw-cgi/eventrules.cgi?msubmenu=rules&action=view', 
            getData, 
            function(response) {
                prepareEventRules(response.data.EventRules);
            }, 
            function(errorData) {
                //alert(errorData);
            }, 
            '', 
            true
        );
    }

    function cameraView() {
        return SunapiClient.get(
            '/stw-cgi/image.cgi?msubmenu=camera&action=view', 
            '', 
            function(response) {
                $scope.Camera = response.data.Camera[0];
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
    
    function view() {
        getAttributes();
        $q.seqAll([getEventRules, cameraView]).then(function(result) {
            initPresetSelectShow();
            $scope.pageLoaded = true;
        }, function(error) {});
    }

    function set() {
        if (!angular.equals(pageData.EventRules, $scope.EventRules)) {
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
            modalInstance.result.then(function() {
                setEventRules();
            }, function() {});
        }
    }


    $rootScope.$saveOn('channelSelector:showInfo', function(event, response){
        $uibModal.open({
            templateUrl: 'views/setup/event/modal/ModalEventSetupInfo.html',
            controller: 'ModalInstanceEventSetupInfoCtrl'
        });
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