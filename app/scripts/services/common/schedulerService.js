kindFramework.factory('schedulerService', function() {
    'use strict';
    var scheduleObjArray = [];
    var scheduleObj = {
        id: '',
        data: [],
    };

    return {
        get: function(id) {
            for(var i = 0; scheduleObjArray.length; i++) {
                scheduleObj = scheduleObjArray[i];
                if(scheduleObj.id === id) {
                    return scheduleObj;
                }
            }
            return null;
        },
        set: function(id, data) {
            scheduleObj.id = id;
            scheduleObj.data = data;
            scheduleObjArray.push(scheduleObj);
        },
    };
});