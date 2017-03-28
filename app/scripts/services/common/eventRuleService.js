kindFramework.factory('eventRuleService', function() {
    'use strict';
    var currentScheduleIds = [];
    var currentScheduleType = "Always";
    var currentMenu = null;
    var scheduleDataObj = {
        type: currentScheduleType,
        data: currentScheduleIds,
    };
    var eventRuleDataObj = {
        pageData: null,
        scopeData: null,
        menu: null,
    };

    var compareScheduleData = function() {
        var pScheduleIds = eventRuleDataObj.pageData.ScheduleIds;
        var sScheduleIds = eventRuleDataObj.scopeData.ScheduleIds;
        var pScheduleType = eventRuleDataObj.pageData.ScheduleType;
        var sScheduleType = eventRuleDataObj.scopeData.ScheduleType;
        var isSame = false;

        if((pScheduleType === sScheduleType) && (pScheduleIds.length == sScheduleIds.length)) {
            isSame = true;
            for(var i = 0; i < pScheduleIds.length; i++) {
                var target = pScheduleIds[i];
                var existing = false;
                for(var k = 0; k < sScheduleIds.length; k++) {
                    if(target === sScheduleIds[k]) {
                        existing = true;
                    }
                }
                if(!existing) {
                    isSame = false;
                    break;
                }
            }
        } else {
            isSame = false;
        }
        return isSame;
    };

    var compareEventActionData = function() {
        var pageData = eventRuleDataObj.pageData;
        var scopeData = eventRuleDataObj.scopeData;
        var isSame = true;

        if(!angular.equals(pageData.AlarmOutputs, scopeData.AlarmOutputs)) {
            isSame = false;
        }
        if(!angular.equals(pageData.FtpEnable, scopeData.FtpEnable)) {
            isSame = false;
        }
        if(!angular.equals(pageData.RecordEnable, scopeData.RecordEnable)) {
            isSame = false;
        }
        if(!angular.equals(pageData.SmtpEnable, scopeData.SmtpEnable)) {
            isSame = false;
        }

        return isSame;
    };

    return {
        setScheduleType: function(data) {
            currentScheduleType = data;
            scheduleDataObj.type = data;
        },
        getScheduleData: function() {
            return scheduleDataObj;
        },
        setScheduleData: function(obj) {
            scheduleDataObj = obj;
            currentScheduleIds = obj.data;
            currentScheduleType = obj.type;
            currentMenu = obj.menu;
        },
        getEventRuleData: function() {
            return eventRuleDataObj;
        },
        setEventRuleData: function(dataObj) {
            currentMenu = dataObj.menu;
            // if(eventRuleDataObj.menu === dataObj.menu) {
            //     eventRuleDataObj.scopeData = dataObj.scopeData;
            // } else {
                eventRuleDataObj = dataObj;
            // }
        },
        checkSchedulerValidation: function() {
            if (currentScheduleType === 'Scheduled' && currentScheduleIds.length === 0) {
                return false;
            }
            return true;
        },
        checkEventRuleValidation: function() {
            if(compareScheduleData() && compareEventActionData()) {
                return true;
            } else {
                return false;
            }
        }
    };
});