kindFramework.controller('logCtrl', function ($scope, $timeout, SunapiClient, Attributes, COMMONUtils, $q, $rootScope, UniversialManagerService)
{
    "use strict";

    COMMONUtils.getResponsiveObjects($scope);

    var mAttr = Attributes.get();
    $scope.pagePattern = mAttr.OnlyNumStr;
    $scope.data = {};

    $scope.pageSize = 15;
    $scope.tabs = ['AccessLog', 'SystemLog', 'EventLog'];

    $scope.currentAccessLogPage = 1;
    $scope.data.AccessLogPageIndex = $scope.currentAccessLogPage;

    $scope.currentSystemLogPage = 1;
    $scope.data.SystemLogPageIndex = $scope.currentSystemLogPage;

    $scope.currentEventLogPage = 1;
    $scope.data.EventLogPageIndex = $scope.currentEventLogPage;

    $scope.CurrentDate = new Date();

    $scope.MaxDate = COMMONUtils.getFormatedInteger($scope.CurrentDate.getFullYear(), 4).toString() + "-" + COMMONUtils.getFormatedInteger($scope.CurrentDate.getMonth() + 1, 2).toString() + "-" + COMMONUtils.getFormatedInteger($scope.CurrentDate.getDate(), 2).toString();

    $scope.isMultiChannel = false;

    $scope.today = function ()
    {
        $scope.CurrentDate = new Date();
    };

    $scope.getTranslatedOption = function (Option)
    {
        return COMMONUtils.getTranslatedOption(Option);
    };

    function getAttributes()
    {
        if(mAttr.MaxChannel > 1) {
            $scope.isMultiChannel = true;
        }
        $scope.DeviceType = mAttr.DeviceType;
        $scope.ModelName = mAttr.ModelName;

        $scope.ChannelTypes = ['All'];
        $scope.ChannelTypes.push.apply($scope.ChannelTypes, COMMONUtils.getArrayWithMinMax(1, mAttr.MaxChannel));
        $scope.SelectedChannel = $scope.ChannelTypes[0];

        $scope.AccessLogTypes = ['All'];
        if (mAttr.AccessLogTypes !== undefined)
        {
            var logArray = angular.copy(mAttr.AccessLogTypes);

            logArray.sort();
            $scope.AccessLogTypes.push.apply($scope.AccessLogTypes, logArray);
            $scope.SelectedAccessLog = $scope.AccessLogTypes[0];
        }

        $scope.SystemLogTypes = ['All'];
        if (mAttr.SystemLogTypes !== undefined)
        {
            var logArray = angular.copy(mAttr.SystemLogTypes);

            logArray.sort();
            $scope.SystemLogTypes.push.apply($scope.SystemLogTypes, logArray);
            $scope.SelectedSystemLog = $scope.SystemLogTypes[0];
        }

        $scope.EventLogTypes = ['All'];
        if (mAttr.EventLogTypes !== undefined)
        {
            var logArray = angular.copy(mAttr.EventLogTypes);

            logArray.sort();
            $scope.EventLogTypes.push.apply($scope.EventLogTypes, logArray);

            $scope.data.SelectedEventLog = $scope.EventLogTypes[0];
        }
    }

    $scope.getEventName = function (Type) {
         if (Type === 'VideoAnalysis') {
            if (mAttr.VideoAnalyticsSupport === false) {
                return 'MotionDetection';
            }
         }
         return Type;
    };

    function getAccessLog(dateReq)
    {
        $scope.AccessLog = [];
        $scope.AL = [];
        $scope.currentAccessLogPage = 1;
        $scope.data.AccessLogPageIndex = $scope.currentAccessLogPage;
        $('#AccessTypeId').val($scope.AccessLogTypes[0]);

        var getData = {};

        if (typeof dateReq !== 'undefined')
        {
            getData.FromDate = dateReq.fromDate;
            getData.ToDate = dateReq.toDate;
        }

        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=accesslog&action=view', getData,
                function (response)
                {
                    // response.data.AccessLog.sort(COMMONUtils.sortArray('Date', true));
                    $scope.AccessLog = response.data.AccessLog;
                    $scope.AL = COMMONUtils.chunkArray(response.data.AccessLog, $scope.pageSize);
                    $scope.currentAccessLogPage = 1;
                },
                function (errorData)
                {
                    if (errorData !== "Configuration Not Found")
                    {
                       // alert(errorData);
                    }
                }, '', true);
    }

    function getSystemLog(dateReq)
    {
        $scope.SystemLog = [];
        $scope.SL = [];
        $scope.currentSystemLogPage = 1;
        $scope.data.SystemLogPageIndex = $scope.currentSystemLogPage;
        $('#SystemTypeId').val($scope.SystemLogTypes[0]);

        var getData = {};

        if (typeof dateReq !== 'undefined')
        {
            getData.FromDate = dateReq.fromDate;
            getData.ToDate = dateReq.toDate;
        }

        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=systemlog&action=view', getData,
                function (response)
                {
                    // response.data.SystemLog.sort(COMMONUtils.sortArray('Date', true));
                    $scope.SystemLog = response.data.SystemLog;
                    $scope.SL = COMMONUtils.chunkArray(response.data.SystemLog, $scope.pageSize);
                },
                function (errorData)
                {
                    if (errorData !== "Configuration Not Found")
                    {
                        //alert(errorData);
                    }
                }, '', true);
    }

    function getEventLog(dateReq)
    {
        var currentChannel = UniversialManagerService.getChannelId();
        // $scope.ChannelEvents = [];
        $scope.AlarmEvents = [];
        $scope.EventLog = [];
        $scope.EL = [];
        $scope.currentEventLogPage = 1;
        $scope.data.EventLogPageIndex = $scope.currentEventLogPage;
        $('#ChannelId').val($scope.ChannelTypes[0]);
        $('#EventTypeId').val($scope.EventLogTypes[0]);

        var getData = {};
        getData.Channel = currentChannel;

        if (typeof dateReq !== 'undefined')
        {
            getData.FromDate = dateReq.fromDate;
            getData.ToDate = dateReq.toDate;
        }

        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=eventlog&action=view', getData,
                function (response)
                {
                    if (typeof response.data.ChannelEventLog !== 'undefined')
                    {
                        for (var i = 0; i < response.data.ChannelEventLog.length; i++)
                        {
                            // $scope.EventLog.push.apply($scope.EventLog, response.data.ChannelEventLog[i].EventLog);
                            $scope.EventLog.push(response.data.ChannelEventLog[i].EventLog);
                        }
                    }

                    if (typeof response.data.AlarmInputLog !== 'undefined')
                    {
                        for (var i = 0; i < response.data.AlarmInputLog.length; i++)
                        {
                            $scope.EventLog.push.apply($scope.EventLog, response.data.AlarmInputLog[i].EventLog);
                            $scope.AlarmEvents.push(response.data.AlarmInputLog[i]);
                        }
                    }

                    /*$scope.EventLog = $scope.EventLog.sort(COMMONUtils.sortArray('Date', true, function (a) {
                        return a.toUpperCase();
                    }));*/
                    // $scope.EL = COMMONUtils.chunkArray($scope.EventLog, $scope.pageSize);
                    $scope.EL = COMMONUtils.chunkArray($scope.EventLog[0], $scope.pageSize);
                },
                function (errorData)
                {
                    if (errorData !== "Configuration Not Found")
                    {
                       // alert(errorData);
                    }
                }, '', true);
    }

    function view(onlyEventLog)
    {
        if(onlyEventLog) {
            $q.seqAll([
                    getEventLog
                ]).then(function(){
                    $rootScope.$emit('changeLoadingBar', false);
                    $scope.pageLoaded = true;
                    $("#systemlogpage").show();
                }, function(errorData){
                    //alert(errorData);
                });
        } else {
            getAttributes();
            $q.seqAll([
                    getAccessLog,
                    getSystemLog,
                    getEventLog
                ]).then(function(){
                    $rootScope.$emit('changeLoadingBar', false);
                    $scope.pageLoaded = true;
                    $("#systemlogpage").show();
                }, function(errorData){
                    //alert(errorData);
                });
        }
    }

    $scope.backup = function (Option)
    {
        var logArray = [];

        if (Option === 'AccessLog')
        {
            for (var i = 0; i < $scope.AL.length; i++)
            {
                logArray.push.apply(logArray, $scope.AL[i]);
            }
        }
        else if (Option === 'SystemLog')
        {
            for (var i = 0; i < $scope.SL.length; i++)
            {
                logArray.push.apply(logArray, $scope.SL[i]);
            }
        }
        else if (Option === 'EventLog')
        {
            for (var i = 0; i < $scope.EL.length; i++)
            {
                logArray.push.apply(logArray, $scope.EL[i]);
            }
        }

        if (!logArray.length)
        {
            //alert(COMMONUtils.getTranslatedOption("NotAvailable"));
            COMMONUtils.ShowError('lang_msg_noData');
            return;
        }

        var logData;
        for (var i = 0; i < logArray.length; i++)
        {
            if (Option === 'EventLog' && logArray[i].Type === 'VideoAnalysis') 
            {
                if (mAttr.VideoAnalyticsSupport === false) 
                {
                    logArray[i].Type = 'MotionDetection';
                }
            }                               
            
            var logString = '[' + logArray[i].Date + ']' + ' [' + logArray[i].Type + ']' + ' [' + logArray[i].Description + ']' + '\r\n';

            if (typeof logData === 'undefined')
            {
                logData = logString;
            }
            else
            {
                logData += logString;
            }
        }

        var success = false;

        var filename = $scope.ModelName + '_' + Option + '_' + COMMONUtils.getCurrentDatetime() + '.txt';
        var contentType = 'application/plain-text';

        try
        {
            console.log("Trying SaveBlob method ...");

            var blob = new Blob([logData], {type: contentType});

            if (navigator.msSaveBlob)
            {
                navigator.msSaveBlob(blob, filename);
            }
            else
            {
                var saveBlob = navigator.webkitSaveBlob || navigator.mozSaveBlob || navigator.saveBlob;
                if (saveBlob === undefined)
                {
                    throw "Not supported";
                }
                saveBlob(blob, filename);
            }

            console.log("SaveBlob succeded");
            success = true;
        }
        catch (ex)
        {
            console.log("SaveBlob method failed with the exception: ", ex);
        }

        if (!success)
        {
            var urlCreator = window.URL || window.webkitURL || window.mozURL || window.msURL;
            if (urlCreator)
            {
                var link = document.createElement('a');
                if ('download' in link)
                {
                    try
                    {
                        console.log("Trying DownloadLink method ...");

                        var blob = new Blob([logData], {type: contentType});

                        var url = urlCreator.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute("download", filename);

                        var event = document.createEvent('MouseEvents');
                        event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                        link.dispatchEvent(event);

                        console.log("DownloadLink succeeded");
                        success = true;
                    }
                    catch (ex)
                    {
                        console.log("DownloadLink method failed with exception: ", ex);
                    }
                }

                if (!success)
                {
                    try
                    {
                        console.log("Trying DownloadLink method with WindowLocation ...");
                        var blob = new Blob([logData], {type: contentType});
                        var url = urlCreator.createObjectURL(blob);
                        window.location = url;

                        console.log("DownloadLink method with WindowLocation succeeded");
                        success = true;
                    }
                    catch (ex)
                    {
                        console.log("DownloadLink method with WindowLocation failed with exception: ", ex);
                    }
                }
            }
        }

        if (!success)
        {
            console.log("No methods worked for saving the arraybuffer, Using Resort window.open");
            window.open(httpPath, '_blank', '');
        }
    };

    $scope.jumpToPage = function (Option)
    {
        var pageCount = parseInt($scope.getPageCount(Option));

        if (Option === 'AccessLog')
        {
            var pageNum = $scope.data.AccessLogPageIndex;

            if (pageNum < 1)
            {
                return;
            }
            else if (pageNum > pageCount)
            {
                $scope.currentAccessLogPage = pageCount;
            }
            else
            {
                $scope.currentAccessLogPage = pageNum;
            }
            $scope.data.AccessLogPageIndex = $scope.currentAccessLogPage;
        }
        else if (Option === 'SystemLog')
        {
            var pageNum = $scope.data.SystemLogPageIndex;

            if (pageNum < 1)
            {
                return;
            }
            else if (pageNum > pageCount)
            {
                $scope.currentSystemLogPage = pageCount;
            }
            else
            {
                $scope.currentSystemLogPage = pageNum;
            }
            $scope.data.SystemLogPageIndex = $scope.currentSystemLogPage;
        }
        else if (Option === 'EventLog')
        {
            var pageNum = $scope.data.EventLogPageIndex;

            if (pageNum < 1)
            {
                return;
            }
            else if (pageNum > pageCount)
            {
                $scope.currentEventLogPage = pageCount;
            }
            else
            {
                $scope.currentEventLogPage = pageNum;
            }
           $scope.data.EventLogPageIndex = $scope.currentEventLogPage;
        }
    };

    $scope.getNextPage = function (Option)
    {
        if (Option === 'AccessLog')
        {
            if ($scope.currentAccessLogPage < $scope.getPageCount(Option))
            {
                $scope.currentAccessLogPage++;
            }
            $scope.data.AccessLogPageIndex = $scope.currentAccessLogPage;
            return $scope.currentAccessLogPage;
        }
        else if (Option === 'SystemLog')
        {
            if ($scope.currentSystemLogPage < $scope.getPageCount(Option))
            {
                $scope.currentSystemLogPage++;
            }
            $scope.data.SystemLogPageIndex = $scope.currentSystemLogPage;
            return $scope.currentSystemLogPage;
        }
        else if (Option === 'EventLog')
        {
            if ($scope.currentEventLogPage < $scope.getPageCount(Option))
            {
                $scope.currentEventLogPage++;
            }
            $scope.data.EventLogPageIndex = $scope.currentEventLogPage;
            return $scope.currentEventLogPage;
        }

        return 1;
    };

    $scope.getLastPage = function (Option)
    {
        if (Option === 'AccessLog')
        {
            $scope.currentAccessLogPage = $scope.getPageCount(Option);
            $scope.data.AccessLogPageIndex = $scope.currentAccessLogPage;

            return $scope.currentAccessLogPage;
        }
        else if (Option === 'SystemLog')
        {
            $scope.currentSystemLogPage = $scope.getPageCount(Option);
           $scope.data.SystemLogPageIndex = $scope.currentSystemLogPage;

            return $scope.currentSystemLogPage;
        }
        else if (Option === 'EventLog')
        {
            $scope.currentEventLogPage = $scope.getPageCount(Option);
            $scope.data.EventLogPageIndex = $scope.currentEventLogPage;

            return $scope.currentEventLogPage;
        }

        return 1;
    };

    $scope.getFirstPage = function (Option)
    {
        if (Option === 'AccessLog')
        {
            $scope.currentAccessLogPage = 1;
            $scope.data.AccessLogPageIndex = $scope.currentAccessLogPage;

            return $scope.currentAccessLogPage;
        }
        else if (Option === 'SystemLog')
        {
            $scope.currentSystemLogPage = 1;
            $scope.data.SystemLogPageIndex = $scope.currentSystemLogPage;

            return $scope.currentSystemLogPage;
        }
        else if (Option === 'EventLog')
        {
            $scope.currentEventLogPage = 1;
            $scope.data.EventLogPageIndex = $scope.currentEventLogPage;

            return $scope.currentEventLogPage;
        }

        return 1;
    };

    $scope.getPrevPage = function (Option)
    {
        if (Option === 'AccessLog')
        {
            if ($scope.currentAccessLogPage > 1)
            {
                $scope.currentAccessLogPage--;
            }
           $scope.data.AccessLogPageIndex = $scope.currentAccessLogPage;

            return $scope.currentAccessLogPage;
        }
        else if (Option === 'SystemLog')
        {
            if ($scope.currentSystemLogPage > 1)
            {
                $scope.currentSystemLogPage--;
            }
            $scope.data.SystemLogPageIndex = $scope.currentSystemLogPage;
            return $scope.currentSystemLogPage;
        }
        else if (Option === 'EventLog')
        {
            if ($scope.currentEventLogPage > 1)
            {
                $scope.currentEventLogPage--;
            }
            $scope.data.EventLogPageIndex = $scope.currentEventLogPage;

            return $scope.currentEventLogPage;
        }

        return 1;
    };

    $scope.getPageCount = function (Option)
    {
        if (Option === 'AccessLog' && typeof $scope.AL !== 'undefined')
        {
            return $scope.AL.length;
        }
        else if (Option === 'SystemLog' && typeof $scope.SL !== 'undefined')
        {
            return $scope.SL.length;
        }
        else if (Option === 'EventLog' && typeof $scope.EL !== 'undefined')
        {
            return $scope.EL.length;
        }

        return 1;
    };

    $scope.onAccLogChange = function (Option)
    {
        $scope.AL = [];
        $scope.currentAccessLogPage = 1;

        if (Option === 'All')
        {
            $scope.AL = COMMONUtils.chunkArray($scope.AccessLog, $scope.pageSize);
        }
        else
        {
            $scope.AL = COMMONUtils.chunkArray(COMMONUtils.filterArrayByObject($scope.AccessLog, Option), $scope.pageSize);
        }

        $scope.data.AccessLogPageIndex = $scope.currentAccessLogPage;
    };

    $scope.onSysLogChange = function (Option)
    {
        $scope.SL = [];
        $scope.currentSystemLogPage = 1;

        if (Option === 'All')
        {
            $scope.SL = COMMONUtils.chunkArray($scope.SystemLog, $scope.pageSize);
        }
        else
        {
            $scope.SL = COMMONUtils.chunkArray(COMMONUtils.filterArrayByObject($scope.SystemLog, Option), $scope.pageSize);
        }

        $scope.data.SystemLogPageIndex = $scope.currentSystemLogPage;
    };

    $scope.onEvtLogChange = function (Option)
    {
        var currentChannel = UniversialManagerService.getChannelId();
        $scope.EL = [];
        $scope.currentEventLogPage = 1;
        if (Option === 'All')
        {
            $scope.EL = COMMONUtils.chunkArray($scope.EventLog[currentChannel], $scope.pageSize);
        }
        else
        {
            $scope.EL = COMMONUtils.chunkArray(COMMONUtils.filterArrayByObject($scope.EventLog[0], Option), $scope.pageSize);
        }

        $scope.data.EventLogPageIndex = $scope.currentEventLogPage;
    };

    $scope.onSearch = function ()
    {
        if (typeof $scope.CurrentDate === 'undefined')
        {
            var str = $('#SearchDateId').val().split('-');

            $scope.CurrentDate = new Date(parseInt(str[0]), parseInt(str[1]) - 1, parseInt(str[2]));
        }

        var cDate = new Date();

        if ($scope.CurrentDate <= cDate)
        {
            var fromDate = $scope.CurrentDate;
            var toDate = $scope.CurrentDate;

            var dateReq = {};

            dateReq.fromDate = COMMONUtils.getFormatedInteger(fromDate.getFullYear(), 4).toString() + "-" + COMMONUtils.getFormatedInteger(fromDate.getMonth() + 1, 2).toString() + "-" + COMMONUtils.getFormatedInteger(fromDate.getDate(), 2).toString();
            dateReq.toDate = COMMONUtils.getFormatedInteger(toDate.getFullYear(), 4).toString() + "-" + COMMONUtils.getFormatedInteger(toDate.getMonth() + 1, 2).toString() + "-" + COMMONUtils.getFormatedInteger(toDate.getDate(), 2).toString();

            getAccessLog(dateReq);
            getSystemLog(dateReq);
            getEventLog(dateReq);
        }
        else
        {
            alert("Future Date");
        }
    };

    $rootScope.$saveOn("channelSelector:selectChannel", function(event, data) {
        $rootScope.$emit('changeLoadingBar', true);
        $rootScope.$emit("channelSelector:changeChannel", data);
        UniversialManagerService.setChannelId(data);
        $timeout(function() {
            view(true);
        });
    }, $scope);


    (function wait()
    {
        if (!mAttr.Ready)
        {
            $timeout(function ()
            {
                mAttr = Attributes.get();
                wait();
            }, 500);
        }
        else
        {
            view();
        }
    })();
});