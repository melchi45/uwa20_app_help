kindFramework.controller('ChannelListCtrl', function ($scope, $timeout, $rootScope, $state,
    kindStreamInterface, Attributes, SunapiClient, ConnectionSettingService, UniversialManagerService,
    CAMERA_STATUS, BrowserService, RESTCLIENT_CONFIG, SessionOfUserManager, PluginModel) {
    "use strict";

    var channlistClass = 'channellist-video-wrapper';
    var count = 0;
    var requestId = null;
    var sunapiAttributes = Attributes.get()
    var videoMode = "canvas";
    var plugin = false;
    var userID = "";
    var ip;
    var port;
    var MultiDirectionProfile = {
        EncodingType: 'H264',
        Resolution: '800x600',
        FrameRate: 30,
        Name: 'profile14',
        ChannelId: 0,
        H264: {
            GOVLength: 60
        }
    };
    var reconnectionTimeout = null;
    var laodTimeout = null;
    var xmlHttp = new XMLHttpRequest();
    var reconnectCheck = false;
    var aspectWitdth = 0;
    var aspectHeight = 0;

    window.addEventListener('resize', resizeHandle);

    $scope.$on("$viewContentLoaded", function () {
        if (BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.IE ||
            BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.SAFARI) {
            plugin = true;
        }

        loadPage();
    });

    $scope.$on("$destroy", function () {
        window.removeEventListener('resize', resizeHandle);
        var closeData = ConnectionSettingService.closeStream();

        for (var i = 0; i < sunapiAttributes.MaxChannel; i++) {
            if (plugin === false) {
                closeData.device.channelId = i;
                kindStreamInterface.changeStreamInfo(closeData);
            } else {
                var obejct = $('#channel' + i)[0];
                obejct.CloseStream();
            }
        }
    });

    function loadPage() {
        if (laodTimeout !== null) {
            $timeout.cancel(laodTimeout);
        }

        laodTimeout = $timeout(function () {
            if (sunapiAttributes.Ready) {
                if (sunapiAttributes.MaxChannel > 1) {
                    ConnectionSettingService.setMultiChannelSupport(true);
                }

                getRtspIpMac();
                setResolutionAndRatio();

                if (SessionOfUserManager.isLoggedin()) {
                    var id = SessionOfUserManager.getUsername();
                    var password = SessionOfUserManager.getPassword();
                    ConnectionSettingService.setConnectionInfo({
                        id: id,
                        password: password
                    });
                }

                SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', '',
                    function (response) {
                        UniversialManagerService.setRotate(response.data.Flip);
                        var section = $('#channellist-containner');
                        for (var i = 0; i < sunapiAttributes.MaxChannel; i++) {
                            var figure = document.createElement('figure');
                            var div = document.createElement('div');
                            if (response.data.Flip[i].Rotate === "0" || response.data.Flip[i].Rotate === "180") {
                                $(div).addClass('channellist-video-wrapper ratio-' + aspectWitdth + '-' + aspectHeight);
                            } else {
                                $(div).addClass('channellist-video-wrapper ratio-' + aspectHeight + '-' + aspectWitdth);
                            }
                            if (plugin === false) {
                                var videoElement = document.createElement(videoMode);
                                $(videoElement).attr('id', "live" + videoMode + i);
                                $(videoElement).attr('kind-channel-id', i);
                                $(section).append($(figure).append($(div).append(videoElement)));
                            } else {
                                var object = '';
                                if (BrowserService.BrowserDetect === BrowserService.BROWSER_TYPES.IE) {
                                    object = '<object classid="clsid:' + PluginModel.ActiveX.ObjectID + '" width="100%" height="100%" name="channel' + i + '" id="channel' + i + '"></object>';
                                } else {
                                    object = '<object type="' + PluginModel.NPAPI.ObjectID + '" width="100%" height="100%" name="channel' + i + '" id="channel' + i + '"></object>';
                                }
                                div.innerHTML = object;
                                $(section).append($(figure).append($(div)))
                            }
                        }
                        startVideoStreaming();
                        setTimeout(changeCanvas);
                    },
                    function (errorData) {
                        console.log(errorData);
                    }, '', true);
            } else {
                loadPage();
            }
        }, 500);
    }

    function getClientIP() {
        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=getclientip&action=view', {},
            function (response) {
                $scope.ClientIPAddress = response.data.ClientIP;
                SessionOfUserManager.setClientIPAddress($scope.ClientIPAddress);
            },
            function (errorData, errorCode) {
                console.error(errorData);
            }, '', true);
    }

    function getRtspIpMac() {
        return SunapiClient.get('/stw-cgi/network.cgi?msubmenu=interface&action=view', {},
            function (response) {
                var rtspIp = response.data.NetworkInterfaces[0].IPv4Address;
                var macIp = response.data.NetworkInterfaces[0].MACAddress;
                ConnectionSettingService.setRtspIpMac(rtspIp, macIp);
            },
            function (errorData, errorCode) {
                console.error(errorData);
            }, '', true);
    }

    function gcd(a, b) {
        return (b === 0) ? a : gcd(b, a % b);
    }

    function setResolutionAndRatio() {
        var MaxResolution = sunapiAttributes.MaxResolution.split('x');
        var aspectRatio = gcd(parseInt(MaxResolution[0]), parseInt(MaxResolution[1]));
        aspectWitdth = MaxResolution[0] / aspectRatio;
        aspectHeight = MaxResolution[1] / aspectRatio;

        if (aspectWitdth === 4) {
            MultiDirectionProfile.Resolution = '800x600';
        } else {
            MultiDirectionProfile.Resolution = '800x448';
        }
    }

    function resizeHandle() {
        var renderCallBack = function () {
            count++;
            changeCanvas();
            if (count >= 5) {
                window.cancelAnimationFrame(requestId);
                count = 0;
                requestId = null;
            } else {
                requestId = window.requestAnimationFrame(renderCallBack);
            }
        };

        count = 0;

        if (requestId !== null) {
            window.cancelAnimationFrame(requestId);
        }

        requestId = window.requestAnimationFrame(renderCallBack);
    }

    var playVideo = function (channelId) {
        MultiDirectionProfile.ChannelId = channelId;
        var playerData = ConnectionSettingService.getPlayerData('live',
            MultiDirectionProfile, timeCallback, errorCallback, closeCallback, videoMode);
        playerData.device.channelId = channelId;
        playerData.media.checkDelay = false;
        userID = playerData.device.user;
        if (plugin === false) {
            kindStreamInterface.init(playerData, SunapiClient);
            kindStreamInterface.changeStreamInfo(playerData);
        } else {
            var obejct = $('#channel' + channelId)[0];
            obejct.SetWMDInitialize(channelId, channelId + 1, "PluginJSONEvent");
            obejct.SetUserFps(Number(MultiDirectionProfile.FrameRate));
            obejct.PlayLiveStream(ip, port, 13, userID, '', '');
        }
    }

    var startVideoStreaming = function () {
        reconnectCheck = false;
        ip = RESTCLIENT_CONFIG.digest.hostName;
        port = RESTCLIENT_CONFIG.digest.rtspPort;
        for (var i = 0; i < sunapiAttributes.MaxChannel; i++) {
            playVideo(i);
        }
    };

    function reconnect() {
        if (reconnectionTimeout !== null) {
            $timeout.cancel(reconnectionTimeout);
        }

        reconnectionTimeout = $timeout(function () {
            var getData = null;
            if (RESTCLIENT_CONFIG.serverType === 'grunt') {
                SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
                    function (response) {
                        startVideoStreaming();
                    },
                    function (errorData) {
                        reconnect();
                    });
            } else {
                try {
                    xmlHttp.open("POST", "../home/pw_check.cgi", true); // false for synchronous request
                    xmlHttp.send(null);
                } catch (e) {
                    reconnect();
                }
            }
        }, 500);
    }

    function changeCanvas() {
        var wrapElems = document.querySelectorAll('.' + channlistClass);
        var getRatio = function (classList) {
            var ratio = [];
            for (var i = 0, ii = classList.length; i < ii; i++) {
                var self = classList[i];
                if (self.indexOf('ratio-') !== -1) {
                    ratio.push(self.split('-')[1]);
                    ratio.push(self.split('-')[2]);
                    break;
                }
            }

            return ratio;
        };

        for (var i = 0, ii = wrapElems.length; i < ii; i++) {
            var self = wrapElems[i];
            var parentNode = self.parentNode;
            var ratio = [];
            var maxWidth = 'none';
            var maxHeight = 'none';

            if (self.clientHeight >= parentNode.clientHeight - 3) {
                ratio = getRatio(self.classList);

                maxWidth = (parentNode.clientHeight / ratio[1] * ratio[0]) + 'px';
                maxHeight = '100%';
            }

            if (self.style.maxWidth !== maxWidth) {
                self.style.maxWidth = maxWidth;
            }

            if (self.style.maxHeight !== maxHeight) {
                self.style.maxHeight = maxHeight;
            }
        }
    }

    $rootScope.$saveOn("channelSelector:selectChannel", function (event, index) {
        UniversialManagerService.setChannelId(index);
        $state.go('uni.channel');
    }, $scope);

    function timeCallback(e) {
        console.log("timeCallback msg =", e);
    }

    function errorCallback(e) {
        console.log("errorCallback msg =", e);
        if (e.errorCode === "999" && reconnectCheck === false) {
            reconnectCheck = true;
            console.log("Disconnect channelId = " + e.channelId);
            reconnect();
        }
    }

    function closeCallback(e) {
        console.log("closeCallback msg =", e);
    }

    function _PluginJSONEvent(ch, evId, sdata) {
        console.log("WebWMDCamEvent ch, evId, sdata => ", ch, evId, sdata);
        var jsonData = null;

        try {
            jsonData = JSON.parse(sdata); //safari
        } catch (e) {
            jsonData = sdata; //ie
        }

        switch (evId) {
            case 401: //rtsp unauthorized(401)
                $timeout(function () {
                    if (jsonData.type === 0) {
                        rtspDigestAuth('live', (ch - 1));
                    }
                }, 100);
                break;
            case 402:
                for (var idx = 0; idx < sunapiAttributes.MaxChannel; idx++) {
                  var pluginElement = $('#channel' + idx)[0];
                  pluginElement.CloseStream();
                }

                if (reconnectCheck === false) {
                    reconnectCheck = true;
                    reconnect();
                }
                break;

        }
    }

    function RefreshPage() {
        window.location.reload(true);
    }

    xmlHttp.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status == 200) {
                if (xmlHttp.responseText == "OK") {
                    window.setTimeout(RefreshPage, 500);
                } else {
                    try {
                        SunapiClient.get('/stw-cgi/network.cgi?msubmenu=interface&action=view', {},
                            function (response) {
                                var macIp = response.data.NetworkInterfaces[0].MACAddress;
                                if (macIp == RESTCLIENT_CONFIG.digest.macAddress) {
                                    startVideoStreaming();
                                } else {
                                    window.setTimeout(RefreshPage, 500);
                                }
                            },
                            function (errorData, errorCode) {
                                console.error(errorData);
                                reconnect();
                            }, '', true);
                    } catch (e) {
                        reconnect();
                    }
                }
            } else if (this.status == 401) {
                var unAuthHtml = "<html><head><title>401 - Unauthorized</title></head><body><h1>401 - Unauthorized</h1></body></html>";
                document.write(unAuthHtml);
            } else if (this.status == 490) {
                var blockHtml = "<html><head><title>Account Blocked</title></head><body><h1>You have exceeded the maximum number of login attempts, please try after some time.</h1></body></html>";
                document.write(blockHtml);
            } else {
                if (this.status === "" || this.status === 0) {
                    reconnect();
                }
            }
        }
    }

    function rtspDigestAuth(mode, channelId) {
        var pluginElement = $('#channel' + channelId)[0];
        var ip = RESTCLIENT_CONFIG.digest.hostName;
        var port = RESTCLIENT_CONFIG.digest.rtspPort;
        var getData = {};
        getData.Method = 'OPTIONS';
        getData.Realm = pluginElement.GetRealm();
        getData.Nonce = pluginElement.GetNonce();

        getData.Uri = encodeURIComponent(pluginElement.GetRtspUrl());

        SunapiClient.get('/stw-cgi/security.cgi?msubmenu=digestauth&action=view', getData,
            function (response) {
                var responseValue = response.data.Response;
                pluginElement.SetWMDInitialize(channelId, channelId + 1, "PluginJSONEvent");
                pluginElement.PlayLiveStream(ip, port, 13, userID, '', responseValue);
            },
            function (errorData, errorCode) {
                console.error(errorData);
            }, '', true);
    }

    window.PluginJSONEvent = function (ch, evId, sdata) {
        setTimeout(function () {
            _PluginJSONEvent(ch, evId, sdata);
        }, 0)
    }
});