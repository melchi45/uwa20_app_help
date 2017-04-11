kindFramework.controller('externalPTZCtrl', function ($scope, $timeout, SunapiClient, Attributes, COMMONUtils, $translate, ModalManagerService, $q, XMLParser) {
    "use strict";
    COMMONUtils.getResponsiveObjects($scope);
    var mAttr = Attributes.get();
    var pageData = {};
    $scope.CameraIDOptionsList = [];
    $scope.PTZPresetOptionsList = [];
    $scope.SelectedChannel = 0;
    $scope.CameraIDOptions = {};
    $scope.PTZPresetOptions = {};
    $scope.CurrentPreset = 1;
    $scope.PTZPresets = "";
    $scope.PresetName = "";
    $scope.ONVIFFocusControlOptions = ["Off", "On"];

    $scope.videoinfo = {
        width: 640,
        height: 360,
        maxWidth: mAttr.MaxROICoordinateX,
        maxHeight: mAttr.MaxROICoordinateY,
        flip: null,
        mirror: null,
        support_ptz: null,
        rotate: null
    };

    $scope.getTranslation = function (Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };

    function getAttributes() {
        $scope.AlphaNumericStr = mAttr.AlphaNumericStr;
        if (mAttr.PTZProtocolOptions !== undefined) {
            $scope.PTZProtocolOptions = mAttr.PTZProtocolOptions;
        }

        if (mAttr.CameraIDOptions !== undefined) {
            $scope.CameraIDOptions.Min = mAttr.CameraIDOptions.minValue;
            $scope.CameraIDOptions.Max = mAttr.CameraIDOptions.maxValue;
            $scope.CameraIDOptionsList = COMMONUtils.getArray($scope.CameraIDOptions.Max, true);
        } else {
            $scope.CameraIDOptions.Min = $scope.CameraIDOptions.Max = 1;
            $scope.CameraIDOptionsList.push(1);
        }

        if (mAttr.BaudRateOptions !== undefined) {
            $scope.BaudRateOptions = mAttr.BaudRateOptions;
        }
        if (mAttr.ParityBitOptions !== undefined) {
            $scope.ParityBitOptions = mAttr.ParityBitOptions;
        }
        if (mAttr.StopBitOptions !== undefined) {
            $scope.StopBitOptions = mAttr.StopBitOptions;
        }
        if (mAttr.DataBitOptions !== undefined) {
            $scope.DataBitOptions = mAttr.DataBitOptions;
        }
        if (mAttr.ExternalPTZModel !== undefined) {
            $scope.ExternalPTZModel = mAttr.ExternalPTZModel;
        }

        if (mAttr.PTZModel !== undefined) {
            $scope.PTZModel = mAttr.PTZModel;
        }

        if($scope.ExternalPTZModel){
            $scope.getTitle ='lang_external_PTZ';
            $scope.getSerialSetup = 'lang_serialSetup';
        }else{
            if(mAttr.RS422Support !== undefined && mAttr.RS422Support == false) {
                $scope.getTitle = 'RS-485';
                $scope.getSerialSetup = 'RS-485 setup';
            }else{
                $scope.getTitle = 'lang_menu_rs485';
                $scope.getSerialSetup = 'RS-485/422 setup';
            }
        }

        if (mAttr.PresetNameMaxLen !== undefined) {
            $scope.PresetNameMaxLen = parseInt(mAttr.PresetNameMaxLen);
        }
    }

    function validatePage() {
        return true;
    }

    function PTZProtocolSet() {
        var setData = {};

        pageData.PTZProtocol[$scope.SelectedChannel].Protocol = $scope.PTZProtocol[$scope.SelectedChannel].Protocol;
        setData.Protocol = pageData.PTZProtocol[$scope.SelectedChannel].Protocol;

        if ($scope.PTZModel === true) {
            setData.CameraID = pageData.PTZProtocol[$scope.SelectedChannel].CameraID = $scope.PTZProtocol[$scope.SelectedChannel].CameraID;
        }

        return SunapiClient.get("/stw-cgi/ptzconfig.cgi?msubmenu=ptzprotocol&action=set", setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            }, "" , true);
    }

    function ONVIFFeaturesSet() {
        var setData = {};

        if (pageData.FocusControl !== $scope.FocusControl) {
            pageData.FocusControl = $scope.FocusControl;

            if ($scope.FocusControl === "On") {
                setData.FocusControl = true;
            } else {
                setData.FocusControl = false;
            }
        }

        return SunapiClient.get("/stw-cgi/system.cgi?msubmenu=onviffeature&action=set", setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            }, "", true);
    }

    function SerialSet() {
        var setData = {};

        if ($scope.Serial.BaudRate !== pageData.Serial.BaudRate) {
            setData.BaudRate = pageData.Serial.BaudRate = $scope.Serial.BaudRate;
        }

        if ($scope.ExternalPTZModel === true) {
            if (pageData.Serial.DataBits !== $scope.Serial.DataBits) {
                setData.DataBits = pageData.Serial.DataBits = $scope.Serial.DataBits;
            }

            if (pageData.Serial.ParityBit !== $scope.Serial.ParityBit) {
                setData.ParityBit = pageData.Serial.ParityBit = $scope.Serial.ParityBit;
            }

            if (pageData.Serial.StopBits !== $scope.Serial.StopBits) {
                setData.StopBits = pageData.Serial.StopBits = $scope.Serial.StopBits;
            }
        }

        if ($scope.PTZModel === true) {
            if (pageData.Serial.SignalTermination !== $scope.Serial.SignalTermination) {
                setData.SignalTermination = pageData.Serial.SignalTermination = $scope.Serial.SignalTermination;
            }
        }

        return SunapiClient.get("/stw-cgi/system.cgi?msubmenu=serial&action=set", setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            }, "", true);
    }

    function saveSerialSettings() {
        var _functionlist = [];

        if (!angular.equals(pageData.PTZProtocol, $scope.PTZProtocol)) {
            _functionlist.push(PTZProtocolSet);
        }
        if (!angular.equals(pageData.Serial, $scope.Serial)) {
            _functionlist.push(SerialSet);
        }

        if ($scope.ExternalPTZModel === true) {
            if (!angular.equals(pageData.FocusControl, $scope.FocusControl)) {
                _functionlist.push(ONVIFFeaturesSet);
            }
        }

        if(_functionlist.length > 0)
        {
            $q.seqAll(_functionlist).then(
                function(){
                    view();
                },
                function(error) {
                    console.log(error);
                }
            );
        }
    }

    function set() {
        if (validatePage()) {
            if (!angular.equals(pageData.PTZProtocol, $scope.PTZProtocol) || !angular.equals(pageData.Serial, $scope.Serial) ||
                ($scope.ExternalPTZModel === true && !angular.equals(pageData.FocusControl, $scope.FocusControl))) {
                COMMONUtils.ApplyConfirmation(saveSerialSettings);
            }
        }
    }

    function PTZProtocolView() {
        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=ptzprotocol&action=view', '',
            function (response) {
                $scope.PTZProtocol = response.data.PTZProtocol;
                if ($scope.ExternalPTZModel === true) {
                    $scope.PTZProtocol[$scope.SelectedChannel].CameraID = 1;
                }
                pageData.PTZProtocol = angular.copy($scope.PTZProtocol);
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function SerialView() {
        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=serial&action=view', '',
            function (response) {
                $scope.Serial = response.data;
                pageData.Serial = angular.copy($scope.Serial);
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function ONVIFFeaturesView() {
        return SunapiClient.get('/stw-cgi/system.cgi?msubmenu=onviffeature&action=view', '',
            function (response) {
                $scope.FocusControl = response.data.FocusControl;

                if ($scope.FocusControl !== undefined) {
                    if ($scope.FocusControl === true) {
                        $scope.FocusControl = 'On';
                    } else {
                        $scope.FocusControl = 'Off';
                    }
                }
                pageData.FocusControl = angular.copy($scope.FocusControl);

            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function PresetView() {
        var idx, idy;
        $scope.PresetName = '';
        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=view', '',
            function (response) {
                $scope.PTZPresets = response.data.PTZPresets;
                pageData.PTZPresets = angular.copy($scope.PTZPresets);

                if (mAttr.PTZPresetOptions !== undefined) {
                    $scope.PTZPresetOptions.Min = mAttr.PTZPresetOptions.minValue;
                    $scope.PTZPresetOptions.Max = mAttr.PTZPresetOptions.maxValue;
                    $scope.PTZPresetOptionsList = COMMONUtils.getArray($scope.PTZPresetOptions.Max, true);

                    for (idx = 0; idx < $scope.PTZPresetOptionsList.length; idx = idx + 1) {
                        $scope.PTZPresetOptionsList[idx] = $scope.PTZPresetOptionsList[idx] + ":";
                    }
                    $scope.CurrentPreset = "1:";

                    if ($scope.PTZPresets !== '') {
                        for (idx = 0; idx < $scope.PTZPresets[$scope.SelectedChannel].Presets.length; idx = idx + 1) {
                            for (idy = 0; idy < $scope.PTZPresetOptionsList.length; idy = idy + 1) {
                                if ($scope.PTZPresets[$scope.SelectedChannel].Presets[idx].Preset === 1) {
                                    $scope.CurrentPreset = $scope.CurrentPreset + $scope.PTZPresets[$scope.SelectedChannel].Presets[idx].Name;
                                }
                                var tmppreset = $scope.PTZPresets[$scope.SelectedChannel].Presets[idx].Preset + ":";
                                if (tmppreset === $scope.PTZPresetOptionsList[idy]) {
                                    $scope.PTZPresetOptionsList[idy] = $scope.PTZPresetOptionsList[idy] + $scope.PTZPresets[$scope.SelectedChannel].Presets[idx].Name;
                                    break;
                                }
                            }
                        }

                    }
                }
            },
            function (errorData) {

            }, '', true);

    }

    $scope.PresetAdd = function () {
        var _functionlist = [];
        if ($scope.PresetName === "") {
            alert($translate.instant("lang_msg_validPresetName"));
            return;
        }
        _functionlist.push(function(){
            var setData = {};
            setData.Preset = GetCurrentPresetNum($scope.CurrentPreset);
            setData.Name = $scope.PresetName;
            return SunapiClient.get("/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=add", setData,
                function () {},
                function (errorData) {
                    console.log(errorData);
                }, "", true);
        });

        if(_functionlist.length > 0)
        {
            $q.seqAll(_functionlist).then(
                function(){
                    COMMONUtils.ShowInfo("Add");
                    PresetView();
                },
                function(errorData){
                    console.log(errorData);
                }
            );
        }
    };

    $scope.PresetRemove = function () {
        var _functionlist = [];
        var presetname = GetCurrentPresetName($scope.CurrentPreset);
        if (presetname == "") {
            alert($translate.instant("lang_msg_selValidPresetNumber"));
            return;
        }

        _functionlist.push(function(){
            var setData = {};
            setData.Preset = GetCurrentPresetNum($scope.CurrentPreset);
            return SunapiClient.get("/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=remove", setData,
                function () { },
                function (errorData) {
                    console.log(errorData);
                }, "", true);
        });
        if(_functionlist.length > 0)
        {
            $q.seqAll(_functionlist).then(
                function(){
                    COMMONUtils.ShowInfo("Remove");
                    PresetView();
                },
                function(errorData){
                    console.log(errorData);
                }
            );
        }
    };

    $scope.PresetControl = function () {
        var _functionlist = [];
        var presetname = GetCurrentPresetName($scope.CurrentPreset);
        if (presetname == "") {
            alert($translate.instant("lang_msg_selValidPresetNumber"));
            return;
        }

        _functionlist.push(function(){
            var setData = {};
            setData.PresetName = presetname;
            return SunapiClient.get("/stw-cgi/ptzcontrol.cgi?msubmenu=preset&action=control", setData,
                function () {},
                function (errorData) {
                    console.log(errorData);
                }, "", true);
        });

        if(_functionlist.length > 0)
        {
            $q.seqAll(_functionlist).then(
                function(){
                },
                function(errorData){
                    console.log(errorData);
                }
            );
        }
    };

    function GetCurrentPresetName(preset) {
        var delindex = preset.indexOf(":");
        var CurrentPresetName = preset.substr(delindex + 1);
        return CurrentPresetName;
    }

    function GetCurrentPresetNum(preset) {
        var delindex = preset.indexOf(":");
        var presetnum = parseInt(preset.substr(0, delindex));
        return presetnum;
    }

    function getCgis() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/attributes.cgi/cgis', getData,
            function (response) {
                mAttr.PTZPresetOptions = XMLParser.parseCgiSection(response.data, 'ptzconfig/preset/Preset/int');
                mAttr.PTZProtocolOptions = XMLParser.parseCgiSection(response.data, 'ptzconfig/ptzprotocol/Protocol/enum');

                if (mAttr.PTZProtocolOptions !== undefined) {
                    $scope.PTZProtocolOptions = mAttr.PTZProtocolOptions;
                }
            },
            function (errorData) {
                //alert(errorData);
            }, '', true);
    }

    function view() {
        var _functionlist = [];
        getAttributes();
        //_functionlist.push(getCgis);
        _functionlist.push(PTZProtocolView);
        _functionlist.push(SerialView);
        if ($scope.ExternalPTZModel === true) {
            _functionlist.push(PresetView);
            _functionlist.push(ONVIFFeaturesView);
        }

        if(_functionlist.length > 0)
        {
            $q.seqAll(_functionlist).then(
                function(){
                    $scope.pageLoaded = true;
                    showVideo().finally(function(){
                        $("#externalptzpage").show();
                    });
                },
                function(errorData){
                    console.log(errorData);
                }
            );
        }
    }

    function showVideo() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
            function (response) {
                var viewerWidth = 640;
                var viewerHeight = 360;
                var maxWidth = mAttr.MaxROICoordinateX;
                var maxHeight = mAttr.MaxROICoordinateY;
                var rotate = response.data.Flip[0].Rotate;
                var flip = response.data.Flip[0].VerticalFlipEnable;
                var mirror = response.data.Flip[0].HorizontalFlipEnable;
                var adjust = mAttr.AdjustMDIVRuleOnFlipMirror;

                $scope.videoinfo = {
                    width: viewerWidth,
                    height: viewerHeight,
                    maxWidth: maxWidth,
                    maxHeight: maxHeight,
                    flip: flip,
                    mirror: mirror,
                    support_ptz: false,
                    rotate: rotate,
                    adjust: adjust
                };
                if($scope.ExternalPTZModel){
                    $scope.ptzinfo = {
                        type: 'EPTZ'
                    };
                }else{
                    $scope.ptzinfo = {
                        type: 'none'
                    };
                }
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

    $scope.submit = set;
    $scope.view = view;
});
