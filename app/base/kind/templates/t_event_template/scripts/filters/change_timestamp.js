kindFramework
    .filter('changeTimeStamp', function () {
        return function (timestamp) {
            var currentTime = new Date();
            var utcTime = new Date(timestamp * 1000);
            var localTime = new Date(
                utcTime.getUTCFullYear(),
                utcTime.getUTCMonth(),
                utcTime.getUTCDate(),
                utcTime.getUTCHours(),
                utcTime.getUTCMinutes(),
                utcTime.getUTCSeconds()
            );

            var diffMiSec = currentTime - localTime;
            var diffSec = diffMiSec / 1000;
            var diffMin = diffSec / 60;
            var diffHour = diffMin / 60;
            var diffDay = diffHour / 24;

            var msg;
            if (diffDay > 1) {
                msg = localTime.getFullYear() + "-" + (localTime.getMonth() + 1) + "-" + localTime.getDate() + " "+ localTime.getHours() +":"+ localTime.getMinutes();
            } else if (diffHour > 1) {
                msg = Math.floor(diffHour) + "h " + (Math.floor(diffMin) - (60 * Math.floor(diffHour))) + "m ago";
            } else if (diffMin > 1) {
                msg = Math.floor(diffMin) + "m ago";
            } else {
                msg = "Now";
            }

            return msg;
        };
    });