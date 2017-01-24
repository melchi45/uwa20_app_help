/*global clearTimeout, setTimeout*/
kindFramework.service('EventStatusService', function (SunapiClient, Attributes, $timeout, $location, SessionOfUserManager)
{
    "use strict";
    var isMonitoring = false;
    var stopMonotoring = false;
    var promiseBorder, promiseUpdate;
    var ACTIVATED_LIVE_EVENT_TIME = 2000;
    var mSubscriptionKey = "";

    this.stopMonotoringEvents = function ()
    {
        stopEventService();
    };

    this.startMonitoringEvents = function (element)
    {
        if (isMonitoring === true)
        {
            return;
        }

        subscribe();
        if (typeof mSubscriptionKey !== 'undefined' && mSubscriptionKey.length)
        {
            isMonitoring = true;
            stopMonotoring = false;

            var kindStream_Element = element;
            var mAttr = Attributes.get();

            (function update()
            {
                var newEvents = angular.copy(getEventStatus());

                if (!stopMonotoring)
                {
                    $timeout.cancel(promiseUpdate);

                    promiseUpdate = $timeout(function ()
                    {
                        for (var i = 0; i < newEvents.EventCount; i++)
                        {
                            console.log("TimeStamp : ", newEvents.EventArray[i].Timestamp);

                            if (typeof newEvents.EventArray[i].ChannelEvent !== 'undefined') //ChannelEvents
                            {
                                var ChannelEvent = newEvents.EventArray[i].ChannelEvent[0];
                                var ChannelNumber = newEvents.EventArray[i].ChannelEvent[0].Channel;

                                if (ChannelEvent.MotionDetection) // 1. MotionDetection
                                {
                                    console.log("MotionDetection at CH:", ChannelNumber);
                                    //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                }
                                else if (ChannelEvent.FaceDetection) // 2.FaceDetection
                                {
                                    console.log("FaceDetection at CH:", ChannelNumber);
                                    // paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                }
                                else if (ChannelEvent.Videoloss) // 3.Videoloss
                                {
                                    console.log("Videoloss at CH:", ChannelNumber);
                                    //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                }
                                else if (ChannelEvent.Tampering) // 4.Tampering
                                {
                                    console.log("Tampering at CH:", ChannelNumber);
                                    //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                }
                                else if (ChannelEvent.AudioDetection) // 5.AudioDetection
                                {
                                    console.log("AudioDetection at CH:", ChannelNumber);
                                    //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                }
                                else if (typeof ChannelEvent.VideoAnalytics !== 'undefined') // 6.VideoAnalytics
                                {
                                    if (ChannelEvent.VideoAnalytics.Appearing) // 6.1 Appearing
                                    {
                                        console.log("VideoAnalytics.Appearing at CH:", ChannelNumber);
                                        //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                    }
                                    else if (ChannelEvent.VideoAnalytics.Disappering) // 6.2 Disappering
                                    {
                                        console.log("VideoAnalytics.Disappering at CH:", ChannelNumber);
                                        //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                    }
                                    else if (ChannelEvent.VideoAnalytics.Entering) // 6.3 Entering
                                    {
                                        console.log("VideoAnalytics.Entering at CH:", ChannelNumber);
                                        //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                    }
                                    else if (ChannelEvent.VideoAnalytics.Exiting) // 6.4 Exiting
                                    {
                                        console.log("VideoAnalytics.Exiting at CH:", ChannelNumber);
                                        //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                    }
                                    else if (ChannelEvent.VideoAnalytics.Passing) // 6.5 Passing
                                    {
                                        console.log("VideoAnalytics.Passing at CH:", ChannelNumber);
                                        //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                    }
                                }
                                else if (ChannelEvent.NetworkAlarmInput) // 7.NetworkAlarmInput
                                {
                                    console.log("NetworkAlarmInput at CH:", ChannelNumber);
                                    //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                }
                                else if (ChannelEvent.Tracking) // 8.Tracking
                                {
                                    console.log("Tracking at CH:", ChannelNumber);
                                    //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                }
                                else if (ChannelEvent.RecordingStatus) // 9.RecordingStatus
                                {
                                    console.log("RecordingStatus at CH:", ChannelNumber);
                                    //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                }
                                else if (ChannelEvent.PriorityRecordingStatus) // 10.PriorityRecordingStatus
                                {
                                    console.log("PriorityRecordingStatus at CH:", ChannelNumber);
                                    //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                }
                                else if (ChannelEvent.PTZMotion) // 11.PTZMotion
                                {
                                    console.log("PTZMotion at CH:", ChannelNumber);
                                    //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                }
                                else if (ChannelEvent.UserInput) // 12.UserInput
                                {
                                    console.log("UserInput at CH:", ChannelNumber);
                                    //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                }
                                else if (ChannelEvent.NetworkCameraConnect) // 13.NetworkCameraConnect
                                {
                                    console.log("NetworkCameraConnect at CH:", ChannelNumber);
                                    //paintBorder(kindStream_Element, ACTIVATED_LIVE_EVENT_TIME, true);
                                }
                            }
                            else if (typeof newEvents.EventArray[i].SystemEvent !== 'undefined') // System Events
                            {
                                var SystemEvent = newEvents.EventArray[i].SystemEvent;

                                if (SystemEvent.CPUFanError)
                                {
                                    alert("CPU Fan Error");
                                }
                                else if (SystemEvent.FrameFanError)
                                {
                                    alert("Frame Fan Error");
                                }
                                else if (SystemEvent.LeftFanError)
                                {
                                    alert("Left Fan Error");
                                }
                                else if (SystemEvent.RightFanError)
                                {
                                    alert("Right Fan Error");
                                }
                                else if (SystemEvent.FactoryReset)
                                {
                                    alert("Factory Reset");
                                }
                                else if (SystemEvent.RecordingError)
                                {
                                    alert("Recording Error");
                                }
                                else if (SystemEvent.BatteryFail)
                                {
                                    alert("Battery Fail");
                                }
                                else if (SystemEvent.DualSMPSFail)
                                {
                                    alert("Dual SMPS Fail");
                                }
                                else if (SystemEvent.AlarmReset)
                                {
                                    alert("Alarm Reset");
                                }
                                else if (SystemEvent.NewFWAvailable)
                                {
                                    alert("New FW Available");
                                }
                                else if (SystemEvent.PasswordChange)
                                {
                                    alert("Password Change");
                                    logoutEventSession();
                                }
                                else if (SystemEvent.TimeChange)
                                {
                                    alert("Time Change");
                                    logoutEventSession();
                                }
                                else if (SystemEvent.PowerReboot)
                                {
                                    alert("Power Reboot");
                                    logoutEventSession();
                                }
                                else if (SystemEvent.FWUpdate)
                                {
                                    alert("FW Update");
                                    logoutEventSession();
                                }
                            }
                            else if (typeof newEvents.EventArray[i].AlarmInput !== 'undefined') // AlarmInput
                            {
                                var AlarmInputEvent = newEvents.EventArray[i].AlarmInput;

                                for (var ai = 1; ai <= mAttr.MaxAlarmInput; ai++)
                                {
                                    if (AlarmInputEvent[ai])
                                    {
                                        console.log("AlarmInput : ", ai);
                                    }
                                }
                            }
                            else if (typeof newEvents.EventArray[i].AlarmOutput !== 'undefined') // AlarmOutput
                            {
                                var AlarmOutputEvent = newEvents.EventArray[i].AlarmOutput;

                                for (var ao = 1; ao <= mAttr.MaxAlarmOutput; ao++)
                                {
                                    if (AlarmOutputEvent[ao])
                                    {
                                        console.log("AlarmOutput : ", ao);
                                    }
                                }
                            }
                        }

                        update();
                    }, 4000); // 4sec
                }
            })();
        }
    };

    function stopEventService()
    {
        stopMonotoring = true;
        isMonitoring = false;

        if (typeof mSubscriptionKey !== 'undefined' && mSubscriptionKey.length)
        {
            unsubscribe();
        }
    }

    function subscribe()
    {
        var getData = {};

        SunapiClient.get('/stw-cgi/eventstatus.cgi?msubmenu=subscription&action=add', getData,
                function (response)
                {
                    mSubscriptionKey = angular.copy(response.data.SubscriptionKey);
                },
                function (errorData)
                {
                    alert("Event Subscription Fail");
                    logoutEventSession();
                });
    }

    function getEventStatus()
    {
        var newEvents = {};

        var getData = {};

        getData.SubscriptionKey = mSubscriptionKey;

        SunapiClient.get('/stw-cgi/eventstatus.cgi?msubmenu=eventstatus&action=view', getData,
                function (response)
                {
                    newEvents = angular.copy(response.data);
                },
                function (errorData)
                {
                    console.log(errorData);
                    logoutEventSession();
                });

        return newEvents;
    }

    function unsubscribe()
    {
        var getData = {};

        getData.SubscriptionKey = mSubscriptionKey;

        SunapiClient.get('/stw-cgi/eventstatus.cgi?msubmenu=subscription&action=remove', getData,
                function (response)
                {

                },
                function (errorData)
                {
                    console.log(errorData);
                });
    }

    function logoutEventSession()
    {
        stopEventService();
        SessionOfUserManager.UnSetLogin();
        Attributes.reset();
        $location.path('/login');
    }

    function paintBorder(element, times, isOn)
    {
        if (isOn === true)
        {
            element.find('div').css({
                'border': 'orange',
                'border-style': 'solid',
                'border-width': '3px'
            });

            if (times !== 0 || times !== null)
            {
                paintBorder(element, times, false);
            }
        }
        else if (isOn === false)
        {
            clearTimeout(promiseBorder);

            promiseBorder = setTimeout(function ()
            {
                element.find('div').removeAttr("style");
            }, times);
        }
    }


});
