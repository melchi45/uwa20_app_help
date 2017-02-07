kindFramework.controller('presetZoomCtrl', function ($scope, $location, $timeout, $uibModal, SunapiClient, Attributes, COMMONUtils, $q, $translate, XMLParser)
{
    "use strict";

    var mAttr = Attributes.get();

    var pageData = {};
        
    $scope.PTZPresetOptionsList = [];       
    $scope.SelectedChannel = 0;
    $scope.CurrentPreset = 1;    
    $scope.PTZPresetOptions = {};
    $scope.PresetName = "";     

    function getAttributes()
    {    
        if (mAttr.PresetNameMaxLen !== undefined) {
            $scope.PresetNameMaxLen = parseInt(mAttr.PresetNameMaxLen);
        }  
    }

    function view()
    {
        getAttributes();
        var promises = [];
        
        promises.push(PresetView);
        if (typeof mAttr.RememberLastPosition !== 'undefined'){
            promises.push(getLastPosition);
        }
        $q.seqAll(promises).then(
            function(){
                $scope.pageLoaded = true;
                showVideo().finally(function(){
                    $("#presetzoompage").show();
                });
            },
            function(errorData){
                console.log(errorData);
            }
        );
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

                $scope.ptzinfo = {
                    autoOpen: true,
                    type: 'ZoomOnly'
                };
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
            COMMONUtils.ShowError("lang_msg_validPresetName");
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
            COMMONUtils.ShowError("lang_msg_selValidPresetNumber");
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

        var presetnum = GetCurrentPresetNum($scope.CurrentPreset);
        
        if (presetnum == "") {
            COMMONUtils.ShowError("lang_msg_selValidPresetNumber");
            return;
        }
        
        _functionlist.push(function(){
            var setData = {};
            setData.Channel = 0;
            setData.Preset = presetnum;
            
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
    
    
$scope.view = view;

    (function wait(){
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            view();
        }
    })();
});