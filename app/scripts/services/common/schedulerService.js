kindFramework.factory('schedulerService', function() {
    'use strict';
    var currentScheduleIds = [];
    var currentScheduleType = "Always";
    var currentMenu = null;
    var dataObj = {
        type: currentScheduleType,
        data: currentScheduleIds,
    };

    return {
        get: function() {
            return dataObj;
        },
        set: function(obj) {
            dataObj = obj;
            currentScheduleIds = obj.data;
            currentScheduleType = obj.type;
            currentMenu = obj.menu;
        },
    };
});