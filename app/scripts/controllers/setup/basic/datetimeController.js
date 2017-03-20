kindFramework.controller('datetimeCtrl', function ($scope, SunapiClient, $timeout, $filter, XMLParser, Attributes, $translate, COMMONUtils, $uibModal, $location, $q) {
    "use strict";
    var mAttr = Attributes.get();
    COMMONUtils.getResponsiveObjects($scope);
    $scope.TableElementClass = COMMONUtils.getTableElementClass(6);
    var dstUpdated = false;
    $scope.isPCDSTOn = false;

    var idx = 0;
    $scope.TimeZoneList = [];
    $scope.YearOptions = [];
    $scope.MonthOptions = [];
    $scope.DayOptions = [];
    $scope.HourOptions = [];
    $scope.MinuteOptions = [];
    $scope.SecondOptions = [];
    $scope.ManualDateTime = {};

    $scope.CurrentTimeZone = {};
    $scope.SyncPc = false;
    $scope.pctime = new Date();
    var pageData = {};
    $scope.FriendlyNameCharSetSupportedStr = mAttr.FriendlyNameCharSetSupportedStr;
    $scope.URLSet = mAttr.URLSet;

    var NUM = '0123456789';
    var ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

    $scope.isShowedOvertimeErr = false;
    $scope.isCameraOvertimeErr = false;

    function getAttributes() {

        var deferred = $q.defer();

        if (mAttr.YearOptions !== undefined) {
            $scope.YeaMin = parseInt(mAttr.YearOptions.minValue, 10);
            $scope.YearMax = parseInt(mAttr.YearOptions.maxValue, 10);
            $scope.YearOptions = [];
            for (idx = $scope.YeaMin; idx <= $scope.YearMax; idx = idx + 1) {
                $scope.YearOptions.push(idx);
            }

        }
        if (mAttr.MonthOptions !== undefined) {
            $scope.MonthMin = parseInt(mAttr.MonthOptions.minValue, 10);
            $scope.MonthMax = parseInt(mAttr.MonthOptions.maxValue, 10);
            $scope.MonthOptions = [];
            for (idx = $scope.MonthMin; idx <= $scope.MonthMax; idx = idx + 1) {
                $scope.MonthOptions.push(idx);
            }

        }
        if (mAttr.DayOptions !== undefined) {
            $scope.DayMin = parseInt(mAttr.DayOptions.minValue, 10);
            $scope.DayMax = parseInt(mAttr.DayOptions.maxValue, 10);
            $scope.DayOptions = [];
            for (idx = $scope.DayMin; idx <= $scope.DayMax; idx = idx + 1) {
                $scope.DayOptions.push(idx);
            }

        }
        if (mAttr.HourOptions !== undefined) {
            $scope.HourMin = parseInt(mAttr.HourOptions.minValue, 10);
            $scope.HourMax = parseInt(mAttr.HourOptions.maxValue, 10);
            $scope.HourOptions = [];
            for (idx = $scope.HourMin; idx <= $scope.HourMax; idx = idx + 1) {
                $scope.HourOptions.push(idx);
            }

        }
        if (mAttr.MinuteOptions !== undefined) {
            $scope.MinuteMin = parseInt(mAttr.MinuteOptions.minValue, 10);
            $scope.MinuteMax = parseInt(mAttr.MinuteOptions.maxValue, 10);
            $scope.MinuteOptions = [];
            for (idx = $scope.MinuteMin; idx <= $scope.MinuteMax; idx = idx + 1) {
                $scope.MinuteOptions.push(idx);

            }
        }
        if (mAttr.SecondOptions !== undefined) {
            $scope.SecondMin = parseInt(mAttr.SecondOptions.minValue, 10);
            $scope.SecondMax = parseInt(mAttr.SecondOptions.maxValue, 10);
            $scope.SecondOptions = [];
            for (idx = $scope.SecondMin; idx <= $scope.SecondMax; idx = idx + 1) {
                $scope.SecondOptions.push(idx);

            }
        }

        $scope.NTPUrlMaxLen = 39; //camera server side address length is 40

        deferred.resolve('success');

        return deferred.promise;
    }

    function getTimeZoneList() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=date&action=view&TimeZoneList', getData,
            function (response) {
                //console.log("View response in getTimeZoneList: ", response);
                /** Populate values from SUNAPI and store in the SCOPE */
                $scope.TimeZoneList = response.data.TimeZones;
                //getDateTime();
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    // function nthWeekdayOfMonth(weekday, n, year, month) {
    //     var date = new Date(year, month, 1),
    //         add = (weekday - date.getDay() + 7) % 7 + (n - 1) * 7;
    //     date.setDate(1 + add);
    //     return date;
    // }

    // var lastWeekdayofMonth = function (day, year, month) {
    //     var lastDay = new Date(year, month + 1, 0);
    //     var sub;
    //     if (lastDay.getDay() >= day)
    //         sub = lastDay.getDay() - day;
    //     else
    //         sub = lastDay.getDay() + (7 - day);

    //     var curDate = lastDay.getDate();

    //     var date = new Date(year, month, curDate - sub);

    //     return date;
    // };

    // function DSTStringToDate(dstString) {
    //     //console.log(dstString);
    //     var StartParse = dstString.toString().split("/");
    //     var DayParse = StartParse[0].toString().split(".");
    //     var TimeParse = StartParse[1].toString().split(":");
    //     var monthNumber = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].indexOf(DayParse[0].toLowerCase());
    //     var weekdayNumber = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(DayParse[2].toLowerCase());
    //     var Markday;
    //     var currentLocDate = new Date($scope.cameratimeMillsec);
    //     if (DayParse[1].toLowerCase() === "1st") {
    //         Markday = nthWeekdayOfMonth(weekdayNumber, 1, currentLocDate.getFullYear(), monthNumber);
    //     } else if (DayParse[1].toLowerCase() === "2nd") {
    //         Markday = nthWeekdayOfMonth(weekdayNumber, 2, currentLocDate.getFullYear(), monthNumber);
    //     } else if (DayParse[1].toLowerCase() === "3rd") {
    //         Markday = nthWeekdayOfMonth(weekdayNumber, 3, currentLocDate.getFullYear(), monthNumber);
    //     } else if (DayParse[1].toLowerCase() === "4th") {
    //         Markday = nthWeekdayOfMonth(weekdayNumber, 4, currentLocDate.getFullYear(), monthNumber);
    //     } else if (DayParse[1].toLowerCase() === "last") {
    //         Markday = lastWeekdayofMonth(weekdayNumber, currentLocDate.getFullYear(), monthNumber);
    //     }

    //     //console.log(TimeParse[0],TimeParse[1],TimeParse[2],typeof TimeParse[0]);

    //     Markday.setHours(parseInt(TimeParse[0]));
    //     Markday.setMinutes(parseInt(TimeParse[1]));
    //     Markday.setSeconds(parseInt(TimeParse[2]));
    //     return Markday;
    // }

    function IsDSTUpdated() {
        if (pageData.DateTime.DSTEnable === true) {
            var DstStart = DSTStringToDate($scope.CurrentTimeZone.StartTime);
            var DstEnd = DSTStringToDate($scope.CurrentTimeZone.EndTime);
            var curTime = new Date($scope.cameratimeMillsec);

            if(DstEnd.getTime()<DstStart.getTime())
            {
                if(curTime.getTime()<DstEnd.getTime())
                {
                    DstStart.setFullYear(DstStart.getFullYear()-1);
                }
                else
                {
                    DstEnd.setFullYear(DstEnd.getFullYear()+1);
                }
            }

            //console.log(curTime.toString(), DstStart.toString(), DstEnd.toString());
            if ((curTime.getTime() >= DstStart.getTime()) && (curTime.getTime() < DstEnd.getTime())) {
                return true;
            }
        }
        return false;
    }

    // function getDateTime() {
    //     var getData = {};
    //     return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=date&action=view', getData,
    //         function (response) {
    //             // console.log("View response in getDateTime: ", response);
    //             /** Populate values from SUNAPI and store in the SCOPE */
    //             $scope.DateTime = response.data;
    //             $scope.DateTime.LocalTime = $scope.DateTime.LocalTime.split("-").join("/");
    //             $scope.cameratimeformat = new Date($scope.DateTime.LocalTime);
    //             $scope.ManualDateTime.ManualYear = $scope.cameratimeformat.getFullYear();
    //             $scope.ManualDateTime.ManualMonth = $scope.cameratimeformat.getMonth() + 1;
    //             $scope.ManualDateTime.ManualDay = $scope.cameratimeformat.getDate();
    //             $scope.ManualDateTime.ManualHour = $scope.cameratimeformat.getHours();
    //             $scope.ManualDateTime.ManualMinute = $scope.cameratimeformat.getMinutes();
    //             $scope.ManualDateTime.ManualSecond = $scope.cameratimeformat.getSeconds();

    //             $scope.cameratimeMillsec = $scope.cameratimeformat.getTime();

    //             pageData.DateTime = angular.copy($scope.DateTime);
    //             pageData.ManualDateTime = angular.copy($scope.ManualDateTime);
    //             dstUpdated = IsDSTUpdated();
    //          },
    //         function (errorData) {
    //             console.log(errorData);
    //         }, '', true);
    // }

    function getTimeZone() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=date&action=view', getData,
            function (response) {
                // console.log("View response in getDateTime: ", response);
                /** Populate values from SUNAPI and store in the SCOPE */
                $scope.DateTime = response.data;

                $scope.CurrentTimeZone = $scope.TimeZoneList[$scope.DateTime.TimeZoneIndex];
                $scope.TimeZoneIndex = $scope.DateTime.TimeZoneIndex;

                pageData.CurrentTimeZone = angular.copy($scope.CurrentTimeZone);
                //pageData.DateTime.DSTEnable = angular.copy($scope.DateTime.DSTEnable);
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function CancelTimezone() {
         $scope.CurrentTimeZone = angular.copy(pageData.CurrentTimeZone);
         $scope.DateTime.DSTEnable = angular.copy(pageData.DateTime.DSTEnable);
    }


    // function getOnlyCameraTime() {
    //     var getData = {};
    //     SunapiClient.get('/stw-cgi/system.cgi?msubmenu=date&action=view', getData,
    //         function (response) {
    //             // console.log("View response in getDateTime: ", response);
    //             /** Populate values from SUNAPI and store in the SCOPE */
    //             //$scope.DateTime. = response.data;
    //             $scope.DateTime.LocalTime = response.data.LocalTime.split("-").join("/");
    //             $scope.cameratimeformat = new Date($scope.DateTime.LocalTime);
    //             $scope.cameratimeMillsec = $scope.cameratimeformat.getTime();

    //         },
    //         function (errorData) {
    //             //alert(errorData);
    //         }, '', true);
    // }

    function view() {
        $q.seqAll([getAttributes, getTimeZoneList, getTimeZone]).then(
            function(result){
                $scope.isViewed = true;
                $scope.pageLoaded = true;
                $scope.SyncPc = false;
                //$("#datetimepage").show();
                startTicking();
            },
            function(error){
                console.log(error);
            });
    }
    // $scope.get = function () {
    //     $q.seqAll([getDateTime]).then(
    //         function(result){
    //         },
    //         function(error){
    //             console.log(error);
    //         });
    // };

    function isValidNTPURL(ntpaddr) {
        var i;
        if (ntpaddr.length <= 0 || ntpaddr.length > $scope.NTPUrlMaxLen) {
            return false;
        }
        for (i = 0; i < ntpaddr.length; i = i + 1) {
            if (((ntpaddr.charCodeAt(i) > 0x3130 && ntpaddr.charCodeAt(i) < 0x318F) || (ntpaddr.charCodeAt(i) >= 0xAC00 && ntpaddr.charCodeAt(i) <= 0xD7A3))) {
                return false;
            }
        }

        if (ntpaddr === '') {
            return false;
        }
        if (COMMONUtils.CheckSpace(ntpaddr)) {
            return false;
        }
        if (ntpaddr.search(':') !== -1) {
            if (!COMMONUtils.CheckValidIPv6Address(ntpaddr)) {
                return false;
            }
        } else {
            if (COMMONUtils.TypeCheck(ntpaddr.charAt(0), NUM)) {
                if (!COMMONUtils.CheckValidIPv4Address(ntpaddr)) {
                    return false;
                } else {
                    var str = ntpaddr.split('.');
                    if (str[str.length - 1] > 254) {
                        return false;
                    }
                }
            } else {
                if (!(COMMONUtils.TypeCheck(ntpaddr, ALPHA + NUM + '.' + '-') && COMMONUtils.TypeCheck(ntpaddr.charAt(0), ALPHA) && ntpaddr.charAt(ntpaddr.length - 1) !== '.')) {
                    return false;
                }
            }
        }

        return true;
    }

    function getLastday(year, month)
    {
        var last_month = new Array(31,  28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
        if (((year%4 === 0) && (year%100 !== 0)) || (year%400 === 0)) last_month[1] = 29;
        else last_month[1] = 28;
        return last_month[month-1];
    }

    function validate() {
        var valid = true;
        var invalid_year = false;
        var invalid_dayInMonth = false;
        var invalid_address = false;

        if (pageData.DateTime !== $scope.DateTime) {
            if ($scope.DateTime.SyncType === 'Manual') {
                if ($scope.SyncPc === true) {
                    var currentTime = new Date();
                    if (currentTime.getFullYear() > $scope.YearMax || currentTime.getFullYear() < $scope.YeaMin) {
                        invalid_year = true;
                        valid = false;
                    }
                }
                else{
                    if ($scope.ManualDateTime.ManualDay > getLastday($scope.ManualDateTime.ManualYear, $scope.ManualDateTime.ManualMonth))
                    {
                        invalid_dayInMonth = true;
                        valid = false;
                    }
                }
            } else if ($scope.DateTime.SyncType === 'NTP') {
                if (!angular.equals(pageData.DateTime.NTPURLList, $scope.DateTime.NTPURLList)) {
                    for (idx = 0; idx < $scope.DateTime.NTPURLList.length; idx = idx + 1) {
                        if (isValidNTPURL($scope.DateTime.NTPURLList[idx]) === false) {
                            invalid_address = true;
                            valid = false;
                        }
                    }
                }
            }


            if(invalid_year === true)
            {
                var ErrorMessage = 'lang_msg_invalid_year';
                COMMONUtils.ShowError(ErrorMessage);
            }

            if(invalid_dayInMonth === true)
            {
                var ErrorMessage = 'lang_msg_invalid_day';
                COMMONUtils.ShowError(ErrorMessage);
            }

            if(invalid_address === true)
            {
                var ErrorMessage = 'lang_msg_invalid_address';
                COMMONUtils.ShowError(ErrorMessage);
            }
        }

        return valid;
    }

    function validTimezoneCheck(){ // wjuncho

        var tmpTimezone = $scope.CurrentTimeZone.TimeZone.substring(4,10);
        var TimezoneHour=0, TimezoneMinute =0;
        var minTime = new Date("2000/01/01 00:00:00");
        var result = true;
        var manualTime;
        if ($scope.DateTime.SyncType === 'Manual') {
            if ($scope.SyncPc === true) {
                manualTime = new Date($scope.pctime);
            }
            else {
                manualTime = new Date($scope.ManualDateTime.ManualYear, $scope.ManualDateTime.ManualMonth-1, $scope.ManualDateTime.ManualDay, $scope.ManualDateTime.ManualHour, $scope.ManualDateTime.ManualMinute, $scope.ManualDateTime.ManualSecond);
            }

            if (tmpTimezone.indexOf(':') !== -1 )
            {
                TimezoneHour = parseInt(tmpTimezone.split(':')[0]);
                TimezoneMinute = parseInt(tmpTimezone.split(':')[1]);
            }

            var currentLocalTime = new Date(Date.parse(manualTime) + (1000 * 60 * 60*TimezoneHour) + (1000 * 60 * TimezoneMinute));

            if (currentLocalTime < minTime){
                var ErrorMessage = 'lang_msg_overtime';
                COMMONUtils.ShowError(ErrorMessage);
                result = false;
            }

            return result;
        }
    }

    function saveTimeZone()
    {
        var setData = {};
        var is_changed = false;

         if ($scope.CurrentTimeZone.StartTime === undefined) {
                    $scope.DateTime.DSTEnable = false;
         }
         if (!angular.equals(pageData.CurrentTimeZone, $scope.CurrentTimeZone) || (pageData.DSTEnable !== $scope.DateTime.DSTEnable)) {
                    is_changed = true;
                    setData.TimeZoneIndex = $scope.CurrentTimeZone.TimeZoneIndex;
                    pageData.CurrentTimeZone = angular.copy($scope.CurrentTimeZone);
                    if (pageData.DSTEnable !== $scope.DateTime.DSTEnable) {
                        pageData.DSTEnable = setData.DSTEnable = $scope.DateTime.DSTEnable;
                    }
          }

          if(is_changed === true)
          {
            SunapiClient.get('/stw-cgi/system.cgi?msubmenu=date&action=set', setData, function (response) {
                view();
            },
             function (errorData) {
                 console.log(errorData);
            }, '', true);
           }
    }

    function ApplyTimezone(){
        if (validTimezoneCheck() === false) {
            return;
        }
        COMMONUtils.ApplyConfirmation(saveTimeZone);
    }

    function setSystemTime() {

        if (validate() === false) {
            return;
        }
        if (validTimezoneCheck() === false) {
            return;
        }
        var modalInstance = $uibModal.open({
            templateUrl: 'views/setup/common/confirmMessage.html',
            controller: 'confirmMessageCtrl',
            size: 'sm',
            resolve: {
                Message: function () {
                    return 'lang_apply_question';
                }
            }
        });

        modalInstance.result.then(function () {
                var setData = {};

                for (idx = 0; idx < $scope.DateTime.NTPURLList.length; idx = idx + 1) {
                    if ($scope.DateTime.NTPURLList[idx] === '') {
                        var ErrorMessage = 'lang_msg_invalid_address';
                        COMMONUtils.ShowError(ErrorMessage);
                        return;
                    }
                }
                //if (pageData.DateTime !== $scope.DateTime) {
                    if ($scope.DateTime.SyncType === 'Manual') {
                        if ($scope.SyncPc === true) {
                            //read pc time & conver to YYYY/MM/DD HH:MM:SS format
                            $scope.cameratimeformat = new Date();

                            setData.Year = $scope.cameratimeformat.getUTCFullYear();
                            setData.Month = $scope.cameratimeformat.getUTCMonth() + 1;
                            setData.Day = $scope.cameratimeformat.getUTCDate();

                            setData.Hour = $scope.cameratimeformat.getUTCHours();
                            setData.Minute = $scope.cameratimeformat.getUTCMinutes();
                            setData.Second = $scope.cameratimeformat.getUTCSeconds();
                            setData.IsUTCTime = true;
                            setData.SyncType = $scope.DateTime.SyncType;
                            setData.IsUTCTime = true;

                        } else {
                            // set manual time
                            //if (!angular.equals(pageData.ManualDateTime, $scope.ManualDateTime) || (pageData.DateTime.SyncType !== $scope.DateTime.SyncType)) {
                                setData.Year = $scope.ManualDateTime.ManualYear;
                                setData.Month = $scope.ManualDateTime.ManualMonth;
                                setData.Day = $scope.ManualDateTime.ManualDay;

                                setData.Hour = $scope.ManualDateTime.ManualHour;
                                setData.Minute = $scope.ManualDateTime.ManualMinute;
                                setData.Second = $scope.ManualDateTime.ManualSecond;
                                pageData.ManualDateTime = angular.copy($scope.ManualDateTime);
                                setData.SyncType = $scope.DateTime.SyncType;
                            //}
                        }
                    } else if ($scope.DateTime.SyncType === 'NTP') {
                        setData.SyncType = $scope.DateTime.SyncType;
                        if (!angular.equals(pageData.DateTime.NTPURLList, $scope.DateTime.NTPURLList)) {

                            setData.NTPURLList = "";
                            for (idx = 0; idx < $scope.DateTime.NTPURLList.length; idx = idx + 1) {
                                setData.NTPURLList += $scope.DateTime.NTPURLList[idx];

                                if (idx !== ($scope.DateTime.NTPURLList.length - 1)) {
                                    setData.NTPURLList += ",";
                                }
                            }
                        }
                    }
                    pageData.DateTime = angular.copy($scope.DateTime);
                //}

                /*if ($scope.CurrentTimeZone.StartTime === undefined) {
                    $scope.DateTime.DSTEnable = false;
                }

                if (!angular.equals(pageData.CurrentTimeZone, $scope.CurrentTimeZone) || (pageData.DSTEnable !== $scope.DateTime.DSTEnable)) {
                    setData.TimeZoneIndex = $scope.CurrentTimeZone.TimeZoneIndex;
                    pageData.CurrentTimeZone = angular.copy($scope.CurrentTimeZone);

                    if (pageData.DSTEnable !== $scope.DateTime.DSTEnable) {
                        pageData.DSTEnable = setData.DSTEnable = $scope.DateTime.DSTEnable;
                    }
                }*/

                if (COMMONUtils.isValidSetData(setData)) {
                    SunapiClient.get('/stw-cgi/system.cgi?msubmenu=date&action=set', setData, function (response) {
                            // getDateTime();
                            view();
                        },
                        function (errorData) {
                            console.log(errorData);
                        }, '', true);
                }
            },
            function () {}
        );

    }

    function IsManualDisabled() {
        if ('DateTime' in $scope) {
            if ($scope.DateTime.SyncType !== 'Manual' || $scope.SyncPc === true) {
                return true;
            }
        }
        return false;
    }

    // function getDSTOffset() {
    //     var dstOffset = 0;
    //     if (typeof pageData.DateTime !== 'undefined') {
    //         if (pageData.DateTime.DSTEnable === true) {
    //             if (dstUpdated === false) {
    //                 var DstStart = DSTStringToDate($scope.CurrentTimeZone.StartTime);
    //                 var DstEnd = DSTStringToDate($scope.CurrentTimeZone.EndTime);
    //                 var curTime = new Date($scope.cameratimeMillsec);

    //                 if(DstEnd.getTime()<DstStart.getTime())
    //                 {
    //                     if(curTime.getTime()<DstEnd.getTime())
    //                     {
    //                         DstStart.setFullYear(DstStart.getFullYear()-1);
    //                     }
    //                     else
    //                     {
    //                         DstEnd.setFullYear(DstEnd.getFullYear()+1);
    //                     }
    //                 }

    //                 if ((curTime.getTime() >= DstStart.getTime()) && (curTime.getTime() < DstEnd.getTime())) {
    //                     dstOffset = 3600 * 1000;
    //                 }
    //             } else {
    //                 var DstStart = DSTStringToDate($scope.CurrentTimeZone.StartTime);
    //                 var DstEnd = DSTStringToDate($scope.CurrentTimeZone.EndTime);
    //                 var curTime = new Date($scope.cameratimeMillsec);
    //                 if(DstEnd.getTime()<DstStart.getTime())
    //                 {
    //                     if(curTime.getTime()<DstEnd.getTime())
    //                     {
    //                         DstStart.setFullYear(DstStart.getFullYear()-1);
    //                     }
    //                     else
    //                     {
    //                         DstEnd.setFullYear(DstEnd.getFullYear()+1);
    //                     }
    //                 }

    //                 if (!((curTime.getTime() >= DstStart.getTime()) && (curTime.getTime() < DstEnd.getTime()))) {
    //                     dstOffset = -3600 * 1000;
    //                 }
    //             }
    //         }
    //     }
    //     return dstOffset;
    // }


    // var tick = function () {
    // var isDateTimePage = false;
    // var changedUrl = $location.absUrl();

    // if (changedUrl.indexOf('basic_dateTime') !== -1) {
    //     isDateTimePage = true;
    // }

    // if (isDateTimePage === false) {
    //     return;
    // }

    // $scope.pctime = new Date();

    // var currentTime = new Date();
    // $scope.cameratimeMillsec = $scope.cameratimeMillsec + 1000;

    // var addDstOffset = 0;
    // if ($scope.CurrentTimeZone.StartTime !== undefined) {
    //     addDstOffset = getDSTOffset();
    // }

    // $scope.cameratimeformat = new Date($scope.cameratimeMillsec + addDstOffset);

    // if($scope.cameratimeformat.getFullYear() > $scope.YearMax && $scope.isCameraOvertimeErr === false)
    // {
    //     COMMONUtils.ShowInfo('lang_msg_overtime');
    //     $scope.isCameraOvertimeErr = true;
    //     var setData = {};
    //     setData.Year = 2000;
    //     setData.Month = 1;
    //     setData.Day = 1;
    //     setData.Hour = 0;
    //     setData.Minute = 0;
    //     setData.Second = 0;
    //     setData.SyncType= "Manual";
    //     SunapiClient.get('/stw-cgi/system.cgi?msubmenu=date&action=set', setData, function (response) {
    //                 $scope.get();
    //                 },
    //                 function (errorData) {
    //                     console.log(errorData);
    //                 }, '', true);
    // }
    // else
    // {
    //     $scope.isCameraOvertimeErr = false;
    // }

//     if ((currentTime.getFullYear() < $scope.YeaMin) || (currentTime.getFullYear() > $scope.YearMax)) {
//         if ($scope.isShowedOvertimeErr === false) {
//             var ErrorMessage = 'lang_msg_overtime';
//             COMMONUtils.ShowError(ErrorMessage);
//             $scope.isShowedOvertimeErr = true;
//         }
//     } else {
//         if ($scope.isShowedOvertimeErr === true) {
//             console.log('Reset Show Over Time error flag');
//             $scope.isShowedOvertimeErr = false;
//         }
//     }
//     $timeout(tick, 1000);
// };
// $timeout(tick, 1000);

    $scope.timeValidation = {
      pattern: {
        year: "^([0-9]{0,4})$",
        month: "^([0]?[1-9]{1}|[1]{1}[0-2]{1})$",
        day: "^([0]?[1-9]{1}|[1-2]{1}[0-9]{1}|[3]{1}[0-1]{1})$",
        hour: "^([0-1]{0,1}[0-9]{0,1}|[2]{1}[0-3]{1})$",
        minuteSecond: "^([0-5]{0,1}[0-9]{0,1})$"
      },
      blur: function($event, option){
        var self = $event.target;
        var val = self.value;
        var min = parseInt(mAttr[option + 'Options'].minValue);
        var max = parseInt(mAttr[option + 'Options'].maxValue);

        function setDefault() {
            var nodeVal = self.attributes.getNamedItem("ng-model").value.split(".");
            $scope[nodeVal[0]][nodeVal[1]] = pageData.ManualDateTime['Manual' + option];
        }
        if(val === ''){
            setDefault();
            return;
        }

        val = parseInt(val);

        if(val < min || val > max){
            setDefault();
            return;
        }


      },
      focus: function($event, length){
        try{
          $event.target.setSelectionRange(0, 4); 
        }catch(e){
          console.error(e);
        }
      }
    };

    $scope.$watch('pctimeformat', function (unformattedDate) {

        $scope.pctime = $filter('date')(unformattedDate, 'yyyy-MM-dd HH:mm:ss');
    });

    $scope.$watch('pctime', function (pctime) {

        $scope.pctimeformat = $filter('date')(pctime, 'yyyy-MM-dd HH:mm:ss');
    });

    // $scope.$watch('cameratimeformat', function (cameratimeformat) {
    //      // $scope.cameratime = $filter('date')(unformattedDate, 'yyyy-MM-dd HH:mm:ss');
    //      $scope.cameratime = cameratimeformat;
    // });

    // $scope.$watch('cameratime', function (cameratime) {
    //     // $scope.cameratimeformat = $filter('date')(cameratime, 'yyyy-MM-dd HH:mm:ss');
    //     $scope.cameratimeformat = cameratime;
    // });
    $scope.$watch('isViewed', function(newVal,oldVal){
        if(newVal != oldVal && newVal == false){
            $("#datetimepage").show();
        }
    });

    var mStopTicking = false;
    var monitoringTimer = null;
    var destroyInterrupt = false;

    function startTicking()
    {
        (function update()
        {
            getCamLocalTime(function (data) {
                if(destroyInterrupt) return;
                var newLocalTime = angular.copy(data);
                if (!mStopTicking)
                {
                    $scope.cameratime = newLocalTime;
                    localTick();
                    monitoringTimer = $timeout(update, 900);
                }
            });
        })();
    }

    function localTick() {
        var isDateTimePage = false;
        var changedUrl = $location.absUrl();

        if (changedUrl.indexOf('basic_dateTime') !== -1) {
            isDateTimePage = true;
        }

        if (isDateTimePage === false) {
            return;
        }

        $scope.pctime = new Date();

        var currentTime = new Date();

        var tCameraTime = $scope.cameratimeformat.split(' ');

        tCameraTime = tCameraTime[0].split('-');

        if(parseInt(tCameraTime[0]) > $scope.YearMax && $scope.isCameraOvertimeErr === false)
        {
            COMMONUtils.ShowInfo('lang_msg_overtime');
            $scope.isCameraOvertimeErr = true;
            var setData = {};
            setData.Year = 2000;
            setData.Month = 1;
            setData.Day = 1;
            setData.Hour = 0;
            setData.Minute = 0;
            setData.Second = 0;
            setData.SyncType= "Manual";
            SunapiClient.get('/stw-cgi/system.cgi?msubmenu=date&action=set',
                setData,
                function (response) {
                    view();
                },
                function (errorData) {
                    console.log(errorData);
                },
                '',
                true
            );
        }
        else
        {
            $scope.isCameraOvertimeErr = false;
        }


        if ((currentTime.getFullYear() < $scope.YeaMin) || (currentTime.getFullYear() > $scope.YearMax)) {
            if ($scope.isShowedOvertimeErr === false) {
                var ErrorMessage = 'lang_msg_overtime';
                COMMONUtils.ShowError(ErrorMessage);
                $scope.isShowedOvertimeErr = true;
            }
        } else {
            if ($scope.isShowedOvertimeErr === true) {
                console.log('Reset Show Over Time error flag');
                $scope.isShowedOvertimeErr = false;
            }
        }
    }

    function stopTicking(){
        if(monitoringTimer !== null){
            destroyInterrupt = true;
            $timeout.cancel(monitoringTimer);
        }
    }

    $scope.$on("$destroy", function(){
        destroyInterrupt = true;
        stopTicking();
    });

    function updateManualTime() {
        var tLocalTime = $scope.cameratimeformat.split(' ');
        var tDate = tLocalTime[0];
        tDate = tDate.split('-');
        var tTime = tLocalTime[1];
        tTime = tTime.split(':');
        $scope.ManualDateTime.ManualYear = tDate[0];
        $scope.ManualDateTime.ManualMonth = tDate[1];
        $scope.ManualDateTime.ManualDay = tDate[2];
        $scope.ManualDateTime.ManualHour = tTime[0];
        $scope.ManualDateTime.ManualMinute = tTime[1];
        $scope.ManualDateTime.ManualSecond = tTime[2];
        pageData.ManualDateTime = angular.copy($scope.ManualDateTime);
    }

    function getCamLocalTime(func)
    {
        var getData = {};
        SunapiClient.get('/stw-cgi/system.cgi?msubmenu=date&action=view', getData,
            function (response) {
                // console.log("View response in getDateTime: ", response);
                /** Populate values from SUNAPI and store in the SCOPE */

                if($scope.isViewed) { // get date & time for the first time.
                    $scope.DateTime = response.data;
                    $scope.cameratimeformat = $scope.DateTime.LocalTime;
                    $scope.cameratimeMillsec = new Date($scope.cameratimeformat).getTime();
                    pageData.DateTime = angular.copy($scope.DateTime);

                    updateManualTime();

                    $scope.isViewed = false;
                } else { // get only local time and update.
                    $scope.DateTime.LocalTime = response.data.LocalTime;
                    $scope.cameratimeformat = $scope.DateTime.LocalTime;
                    $scope.cameratimeMillsec = new Date($scope.cameratimeformat).getTime();
                }

                func($scope.DateTime.LocalTime);
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            view();
        }
    })();
    $scope.view = view;
    $scope.submit_systemtime = setSystemTime;
    $scope.IsManualDisabled = IsManualDisabled;
    $scope.ApplyTimezone = ApplyTimezone;
    $scope.CancelTimezone = CancelTimezone;
    $scope.isViewed = true;
});