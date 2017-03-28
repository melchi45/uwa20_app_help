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
            var pScheduleIds = eventRuleDataObj.pageData.ScheduleIds;
            var sScheduleIds = eventRuleDataObj.scopeData.ScheduleIds;

            var isSame = (pScheduleIds.length == sScheduleIds.length) && pScheduleIds.every(function(element, index) {
                return element === sScheduleIds[index]; 
            });

            if(isSame) {
                if(!angular.equals(eventRuleDataObj.pageData, eventRuleDataObj.scopeData)) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return false;
            }
        }
    };
});