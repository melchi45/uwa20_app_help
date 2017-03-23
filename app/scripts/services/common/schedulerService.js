kindFramework.factory('schedulerService', function() {
    'use strict';
    var currentScheduleIds;
    var currentScheduleType;
    var currentMenu;
    var dataObj;

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