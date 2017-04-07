kindFramework.controller('upgradeRebootCtrl', function ($scope, $timeout, $uibModal, SunapiClient, Attributes, COMMONUtils, $translate)
{
    "use strict";

    COMMONUtils.getResponsiveObjects($scope);

    var mAttr = Attributes.get();

    $scope.getTranslatedOption = function (Option)
    {
        if (Option == 'Network') {
            if (mAttr.OpenSDKSupport) {
                return COMMONUtils.getTranslatedOption("ExcludeNetworkOpenPlatform");
            } else {
                return COMMONUtils.getTranslatedOption("ExcludeNetwork");
            }
        }
        return COMMONUtils.getTranslatedOption(Option);
    };

    function getAttributes()
    {
        $scope.DeviceType = mAttr.DeviceType;
        $scope.FirmwareVersion = mAttr.FirmwareVersion;
        $scope.ModelName = mAttr.ModelName;
        $scope.PTZModel = mAttr.PTZModel;

        if (mAttr.ISPVersion !== undefined)
        {
            $scope.ISPVersion = mAttr.ISPVersion;
        }

        if (mAttr.CGIVersion !== undefined)
        {
            $scope.CGIVersion = mAttr.CGIVersion;
        }

        if (mAttr.TrackingVersion !== undefined)
        {
            $scope.TrackingVersion = mAttr.TrackingVersion;
        }

        if (mAttr.ExcludeSettings !== undefined)
        {
            $scope.ExcludeSettings = mAttr.ExcludeSettings;
        }

        if (mAttr.RestoreExclusions !== undefined)
        {
            $scope.RestoreExclusions = mAttr.RestoreExclusions;
        }

        $scope.SelectedSettings = angular.copy($scope.ExcludeSettings);
        $scope.SelectedExclusions = angular.copy($scope.ExcludeSettings);
    }

    function view()
    {
        getAttributes();
        $scope.pageLoaded = true;
    }

    $scope.toggleExclusion = function (setting)
    {
        var index = $scope.SelectedExclusions.indexOf(setting);

        if (index > -1)
        {
            $scope.SelectedExclusions.splice(index, 1);
        }
        else
        {
            $scope.SelectedExclusions.push(setting);
        }
    };

    $scope.setFirmwareFile = function (element)
    {
        $scope.$apply(function ($scope)
        {
            $scope.FirmwareFile = element.files[0];
        });
    };


    function logout()
    {
        COMMONUtils.onLogout();
    }


    $scope.updateFirmware = function ()
    {
        COMMONUtils.ShowConfirmation(updateFirmwareCallback, 'lang_msg_upgrade_removed_statistics_data', 'lg');

        function updateFirmwareCallback() {
            $scope.ProgressBar = 0;
            var file = $scope.FirmwareFile;
            var epochTicks = 621355968000000000;
            var ticksPerMillisecond = 10000;
            var yourTicks = epochTicks + ((new Date()).getTime() * ticksPerMillisecond);

            var boundary = '*****mgd*****' + yourTicks;
            var header = "--" + boundary + "\r\n";
            var footer = "\r\n--" + boundary + "--\r\n";

            var specialHeaders = [];

            specialHeaders[0] = {};
            specialHeaders[0].Type = 'Content-Type';
            specialHeaders[0].Header = "multipart/form-data; boundary=" + boundary;

            var contents = header + "Content-Disposition: form-data; name=\"File\"; filename=\"" + file.name + "\"\r\n\r\n";
            //contents += "Content-Transfer-Encoding: binary\r\n";
            //contents += "Content-Type: application/octect-stream\r\n\r\n";

            var fileToPost = new Blob([contents, file.slice(0, file.size), footer]);

            if (fileToPost.size) {

                var div = document.createElement("div");
                div.setAttribute("id", "notallow")
                div.className += "disabledom";
                document.body.appendChild(div);

                console.log("FW File Size = ", fileToPost.size);

                $scope.IsFWUpdating = true;

                var setData = {};

                setData.Type = 'Normal';
                setData.IgnoreMultipartResponse = true;


                SunapiClient.post('/stw-cgi/system.cgi?msubmenu=firmwareupdate&action=control', setData,
                    function (response) {
                    },
                    function (errorData, errorCode) {
                        if (errorCode === 604) {
                            COMMONUtils.ShowError('lang_msg_uploadError_Invalid_File');
                            var div = document.getElementById("notallow");
                            if (typeof div !== 'undefined') {
                                document.body.removeChild(div);
                            }
                        }
                        else {
                            if (errorData.indexOf('HTTP Error') !== -1) {
                                var msg = $translate.instant('lang_msg_upgrading_was_failed');
                                alert(msg);
                                logout();
                            } else {
                                COMMONUtils.ShowInfo('lang_msg_upgrading_was_failed', logout);
                            }
                        }
                        $scope.IsRestoreRunning = false;
                        $scope.IsFWUpdating = false;
                        $scope.ProgressVisible = false;
                    }, $scope, fileToPost, specialHeaders);


            }
            else {
                COMMONUtils.ShowError('lang_msg_uploadError_Invalid_File');
                console.log("Empty File");
            }
        }
    };

    $scope.backupConfig = function ()
    {
        var getData = {};

        SunapiClient.get('/stw-cgi/system.cgi?msubmenu=configbackup&action=control', getData,
                function (response)
                {
                    if (response.data.Response === "Fail")
                    {
                        alert(response.data.Error.Details);
                    }
                    else
                    {
                        var success = false;

                        var filename = $scope.ModelName + 'Config.bin';
                        var contentType = 'application/octet-stream';

                        try
                        {
                            console.log("Trying SaveBlob method ...");

                            var blob = new Blob([response.data], {type: contentType});

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

                                        var blob = new Blob([response.data], {type: contentType});

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
                                        var blob = new Blob([response.data], {type: contentType});
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
                    }
                },
                function (errorData)
                {
                    console.log(errorData);
                }, $scope, true);

    };

    $scope.factoryReset = function ()
    {
        var modalInstance = $uibModal.open({
            templateUrl: 'confirmMessage.html',
            controller: 'confirmMessageCtrl',
            resolve: {
                Message: function ()
                {
                    return 'lang_msg_factoryDefault';
                }
            }
        });

        modalInstance.result.then(function ()
        {
            resetDevice();
        }, function ()
        {

        });
    };

    function resetDevice()
    {
        var setData = {};

        setData.ExcludeSettings = "";

        for (var i = 0; i < $scope.SelectedExclusions.length; i++)
        {
            setData.ExcludeSettings += $scope.SelectedExclusions[i] + ',';
        }

        if (setData.ExcludeSettings.length)
        {
            setData.ExcludeSettings = setData.ExcludeSettings.substring(0, setData.ExcludeSettings.length - 1);
        }
        else
        {
            setData = {};
        }

        SunapiClient.get('/stw-cgi/system.cgi?msubmenu=factoryreset&action=control', setData,
                function (response)
                {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'errorPopup.html',
                        controller: 'errorMessageCtrl',
                        resolve: {
                            Message: function ()
                            {
                                return 'lang_msg_windowClose';
                            },
                            Header: function ()
                            {
                                return 'lang_Confirm';
                            }
                        }
                    });

                    modalInstance.result.then(function ()
                    {
                        window.open('', '_self');
                        window.close();
                        COMMONUtils.onLogout();
                    }, function ()
                    {
                        window.open('', '_self');
                        window.close();
                        COMMONUtils.onLogout();
                    });
                },
                function (errorData)
                {
                    console.log(errorData);
                }, '', true);
    }


    $scope.reboot = function ()
    {
        var modalInstance = $uibModal.open({
            templateUrl: 'confirmMessage.html',
            controller: 'confirmMessageCtrl',
            size: 'sm',
            resolve: {
                Message: function ()
                {
                    return 'lang_msg_restart';
                }
            }
        });

        modalInstance.result.then(function ()
        {
            restart();
        }, function ()
        {

        });
    };

    function restart()
    {
        var getData = {};

        getData.Type = 'Restart';

        SunapiClient.get('/stw-cgi/system.cgi?msubmenu=power&action=control', getData,
                function (response)
                {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'errorPopup.html',
                        controller: 'errorMessageCtrl',
                        resolve: {
                            Message: function ()
                            {
                                return 'lang_msg_windowClose';
                            },
                            Header: function ()
                            {
                                return 'lang_Confirm';
                            }
                        }
                    });

                    modalInstance.result.then(function ()
                    {
                        window.open('', '_self');
                        window.close();
                        COMMONUtils.onLogout();
                    }, function ()
                    {
                        window.open('', '_self');
                        window.close();
                        COMMONUtils.onLogout();
                    });
                },
                function (errorData)
                {
                    console.log(errorData);
                }, '', true);
    }

    $scope.setConfigFile = function (element)
    {
        $scope.$apply(function ($scope)
        {
            configRestore(element.files[0]);
        });
    };

    function configRestore(file)
    {
        var setData = {};

        setData.ExcludeSettings = "";

        for (var i = 0; i < $scope.SelectedExclusions.length; i++)
        {
            setData.ExcludeSettings += $scope.SelectedExclusions[i] + ',';
        }

        if (setData.ExcludeSettings.length)
        {
            setData.ExcludeSettings = setData.ExcludeSettings.substring(0, setData.ExcludeSettings.length - 1);
        }
        else
        {
            setData = {};
        }

        var specialHeaders = [];

        specialHeaders[0] = {};
        specialHeaders[0].Type = 'Content-Type';
        specialHeaders[0].Header = 'application/x-www-form-urlencoded;';

        var reader = new FileReader();
        reader.readAsArrayBuffer(file);

        reader.onload = function (evt)
        {
            var fileData = evt.target.result;
            var bytes = new Uint8Array(fileData);

            var fileToPost = '';
            for (var index = 0; index < bytes.byteLength; index++)
            {
                fileToPost += String.fromCharCode(bytes[index]);
            }

            $scope.IsRestoreRunning = true;

            SunapiClient.post('/stw-cgi/system.cgi?msubmenu=configrestore&action=control', setData,
                    function (response)
                    {

                    },
                    function (errorData)
                    {
                        console.log(errorData);
                        $scope.IsRestoreRunning = false;
                        $scope.IsFWUpdating = false;
                        $scope.ProgressVisible = false;
                    }, $scope, btoa(fileToPost), specialHeaders);
        };
    }
    ;

    function updateProgress(TimeDelay, ProgressBarName, MaxValue)
    {
        (function update()
        {
            if($scope.ProgressBar > 25){
                ProgressBarName = "Updating FW";
                TimeDelay = 1500;
            }
            if ($scope.ProgressVisible && $scope.ProgressBar < MaxValue)
            {
                $timeout(function ()
                {
                    $scope.ProgressBarName = ProgressBarName;

                    if ($scope.ProgressBar < (MaxValue - 1))
                    {
                        $scope.ProgressBar += 1;
                    }
                    else if ($scope.ProgressBar >= (MaxValue - 1))
                    {
                        $scope.ProgressBar = MaxValue;
                        return;
                    }
                    else
                    {
                        return;
                    }

                    update();
                }, TimeDelay);
            }
        })();
    }

    $scope.$watch('ProgressBar', function ()
    {
        if ($scope.ProgressBar === 10)
        {
            var maxValue = 95;
            var timeDelay = 100;
            var progressbarName = "Updating";

            if ($scope.IsRestoreRunning)
            {
                timeDelay = 30;
                progressbarName = "Restoring Config";
            }
            else if ($scope.IsFWUpdating)
            {
                if (mAttr.DeviceType === 'NVR') {
                    timeDelay = 600;
                } else {
                    if (mAttr.PTZModel) {
                        timeDelay = 3000;
                    } else {
                        // Approx 2 Mins and 25 Seconds in 9081R
                        // timeDelay = 2000;
                        timeDelay = 6500;// temp for wn5 request from HG.Jang
                    }

                }

                progressbarName = "Verifying FW";
            }

            updateProgress(timeDelay, progressbarName, maxValue);
        }
    });

    $scope.ProgressEvent = function (evt)
    {
        $scope.ProgressVisible = true;
        $scope.$apply(function ()
        {
            if (evt.lengthComputable)
            {
                var progressData = Math.round((evt.loaded * 100 / evt.total) / 10);
                if($scope.ProgressBar < progressData){
                    $scope.ProgressBarName = "Uploading";
                    $scope.ProgressBar = progressData;
                }
            }
        });

    };

    $scope.CompleteEvent = function (evt)
    {
        $scope.$apply(function ()
        {
            $scope.ProgressBar = 100;
        });

        if (evt.target.responseType !== 'arraybuffer')
        {
            var response = JSON.parse(evt.target.response);

            if (response.Response === 'Fail')
            {

                //not needed already handled in post callback
                // alert(response.Error.Details);

            }
            else
            {
                if ($scope.IsRestoreRunning)
                {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'errorPopup.html',
                        controller: 'errorMessageCtrl',
                        resolve: {
                            Message: function ()
                            {
                                return 'lang_msg_reconnect';
                            },
                            Header: function ()
                            {
                                return 'lang_Confirm';
                            }
                        }
                    });

                    modalInstance.result.then(function ()
                    {
                        window.open('', '_self');
                        window.close();
                        COMMONUtils.onLogout();
                    }, function ()
                    {
                        window.open('', '_self');
                        window.close();
                        COMMONUtils.onLogout();
                    });
                }
                else if ($scope.IsFWUpdating)
                {
                    var modalInstance = $uibModal.open({
                        templateUrl: 'errorPopup.html',
                        controller: 'errorMessageCtrl',
                        resolve: {
                            Message: function ()
                            {
                                return 'lang_msg_windowClose';
                            },
                            Header: function ()
                            {
                                return 'lang_Confirm';
                            }
                        }
                    });

                    modalInstance.result.then(function ()
                    {
                        window.open('', '_self');
                        window.close();
                        COMMONUtils.onLogout();
                    }, function ()
                    {
                        window.open('', '_self');
                        window.close();
                        COMMONUtils.onLogout();
                    });
                }
            }
        }
        else
        {
            console.log("Config Download Success");
            var modalInstance = $uibModal.open({
                        templateUrl: 'errorPopup.html',
                        controller: 'errorMessageCtrl',
                        resolve: {
                            Message: function ()
                            {
                                return 'lang_msg_windowClose';
                            },
                            Header: function ()
                            {
                                return 'lang_Confirm';
                            }
                        }
                    });

                    modalInstance.result.then(function ()
                    {
                        window.open('', '_self');
                        window.close();
                        COMMONUtils.onLogout();
                    }, function ()
                    {
                        window.open('', '_self');
                        window.close();
                        COMMONUtils.onLogout();
                    });
        }
        $scope.ProgressBar = 100;
        $scope.IsRestoreRunning = false;
        $scope.IsFWUpdating = false;
        $scope.ProgressVisible = false;
    };

    $scope.FailEvent = function (evt)
    {
        $scope.$apply(function ()
        {
            $scope.ProgressVisible = false;
        });

        if (evt.target.responseType !== 'arraybuffer')
        {
            var modalInstance = $uibModal.open({
                templateUrl: 'errorPopup.html',
                controller: 'errorMessageCtrl',
                size: 'sm',
                resolve: {
                    Message: function ()
                    {
                        return 'lang_msg_upload_err';
                    },
                    Header: function ()
                    {
                        return 'lang_error';
                    }
                }
            });

            console.log("Upload Fail");
        }
        else
        {
            var modalInstance = $uibModal.open({
                templateUrl: 'errorPopup.html',
                controller: 'errorMessageCtrl',
                size: 'sm',
                resolve: {
                    Message: function ()
                    {
                        return 'lang_msg_downloadingFail';
                    },
                    Header: function ()
                    {
                        return 'lang_error';
                    }
                }
            });

            console.log("Download Fail");
        }

        $scope.IsRestoreRunning = false;
        $scope.IsFWUpdating = false;
    };

    $scope.CancelEvent = function (evt)
    {
        $scope.$apply(function ()
        {
            $scope.ProgressVisible = false;
        });

        if (evt.target.responseType !== 'arraybuffer')
        {
            var modalInstance = $uibModal.open({
                templateUrl: 'errorPopup.html',
                controller: 'errorMessageCtrl',
                size: 'sm',
                resolve: {
                    Message: function ()
                    {
                        return 'lang_msg_upload_err';
                    },
                    Header: function ()
                    {
                        return 'lang_error';
                    }
                }
            });
        }
        else
        {
            var modalInstance = $uibModal.open({
                templateUrl: 'errorPopup.html',
                controller: 'errorMessageCtrl',
                size: 'sm',
                resolve: {
                    Message: function ()
                    {
                        return 'lang_msg_downloadingFail';
                    },
                    Header: function ()
                    {
                        return 'lang_error';
                    }
                }
            });
        }

        console.log("User canceled or the browser dropped the connection.");
        $scope.IsRestoreRunning = false;
        $scope.IsFWUpdating = false;
    };

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