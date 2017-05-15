/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('simpleFocusCtrl', function ($scope, SunapiClient, Attributes, $timeout, COMMONUtils, sketchbookService, $q, $rootScope, UniversialManagerService, $uibModal) {
    "use strict";

    $scope.FastAutoFocusDefined = true;
    $scope.ZoomOptionsDefined = true;
    $scope.FastAutoFocus = true;

    $scope.PageData = {};

    var mAttr = Attributes.get();
    COMMONUtils.getResponsiveObjects($scope);

    $scope.Lens = null;
    $scope.IRShiftOptions = [];
    $scope.FBAdjustEnable = false;
    $scope.TCEnable = false;
    $scope.IRShift = '';
    $scope.ICSLensSupport = false;

    function getAttributes() {
        var defer = $q.defer();
        if (mAttr.SimpleFocusOptions !== undefined) {
            $scope.SimpleFocusOptions = mAttr.SimpleFocusOptions;
            $scope.SimpleZoomOptions = mAttr.SimpleZoomOptions;
            $scope.FastAutoFocusEnable = mAttr.FastAutoFocusEnable;
            if (typeof $scope.FastAutoFocusEnable === 'undefined') {
                $scope.FastAutoFocusDefined = false;
            }
            if (typeof $scope.SimpleZoomOptions === 'undefined') {
                $scope.ZoomOptionsDefined = false;
            }
            $scope.FocusModeOptions = mAttr.FocusModeOptions;
            $scope.IRShiftOptions = mAttr.IRShiftOptions;
            if (typeof $scope.IRShiftOptions !== 'undefined') {
                for(var i = 0; i < $scope.IRShiftOptions.length; i++) {
                    if($scope.IRShiftOptions[i] !== 'Off') {
                        var option = $scope.IRShiftOptions[i];
                        if(option.indexOf('nm') === -1) {
                            $scope.IRShiftOptions[i] = angular.copy(option + 'nm');
                        }
                    }
                }
            }
            $scope.MaxChannel = mAttr.MaxChannel;
            $scope.IrisModeOptions = mAttr.IrisModeOptions;
            checkICSLensSupport();
        }
        
        defer.resolve("success");
        return defer.promise;
    }

    $scope.isSupportedFocusMode = function (mode) {
        var retVal = false;

        if ($scope.FocusModeOptions !== undefined) {
            if ($scope.FocusModeOptions.indexOf(mode) !== -1) {
                return true;
            }
        }

        return retVal;
    };

    getAttributes();


    function manualFocus(level) {
        var setData = {};

        setData.Focus = level;
        setData.Channel = UniversialManagerService.getChannelId();

        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=control', setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function manualZoom(level) {
        var setData = {};

        setData.Zoom = level;
        setData.Channel = UniversialManagerService.getChannelId();

        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=control', setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function focusMode(mode) {
        var setData = {};

        setData.Mode = mode;
        var coordi = sketchbookService.get();
        if(coordi[0].isSet){
            setData.FocusAreaCoordinate = coordi[0].x1 + "," + coordi[0].y1 + "," + coordi[0].x2 + "," + coordi[0].y2;
        }
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=control', setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }



    function SaveFAFSettings() {
        var setData = {};
        setData.FastAutoFocus = $scope.FastAutoFocus;
        setData.Channel = UniversialManagerService.getChannelId();
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=set', setData,
            function (response) {
                view();
            },
            function (errorData) {
                view();
                console.log(errorData);
            }, '', true);
    }


    function setFastAutoFocus() {
        // COMMONUtils.ApplyConfirmation(SaveFAFSettings);
        var modalInstance = $uibModal.open({
            templateUrl: 'views/setup/common/confirmMessage.html',
            controller: 'confirmMessageCtrl',
            size: 'sm',
            resolve: {
                Message: function() {
                    return 'lang_apply_question';
                }
            }
        });
        modalInstance.result.then(function() {
            SaveFAFSettings();
        }, function() {
            $scope.FastAutoFocus = !$scope.FastAutoFocus;
        });
    }

    function setFBEnable() {
        // COMMONUtils.ApplyConfirmation(SaveFBEnable);
        var modalInstance = $uibModal.open({
            templateUrl: 'views/setup/common/confirmMessage.html',
            controller: 'confirmMessageCtrl',
            size: 'sm',
            resolve: {
                Message: function() {
                    return 'lang_apply_question';
                }
            }
        });
        modalInstance.result.then(function() {
            SaveFBEnable();
        }, function() {
            $scope.FBAdjustEnable = !$scope.FBAdjustEnable;
        });
    }

    function setTCEnable() {
        // COMMONUtils.ApplyConfirmation(SaveTCEnable);
        var modalInstance = $uibModal.open({
            templateUrl: 'views/setup/common/confirmMessage.html',
            controller: 'confirmMessageCtrl',
            size: 'sm',
            resolve: {
                Message: function() {
                    return 'lang_apply_question';
                }
            }
        });
        modalInstance.result.then(function() {
            SaveTCEnable();
        }, function() {
            $scope.TCEnable = !$scope.TCEnable;
        });
    }

    function focusView(){
        var jData = {};
        jData.Channel = UniversialManagerService.getChannelId();
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=view', jData,
            function (response) {
                $scope.PageData = response.data;
                $scope.FastAutoFocus = response.data.Focus[0].FastAutoFocus;
                $scope.TCEnable = angular.copy(response.data.Focus[0].TemperatureCompensationEnable);
                $scope.IRShift = angular.copy(response.data.Focus[0].IRShift);
                if($scope.IRShift !== 'Off') {
                    $scope.IRShift += 'nm';
                }
            },
            function (errorData) {}, '', true);
    }

    function cameraView() {
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=view', '',
            function (response) {
                $scope.Camera = response.data.Camera[0];
                $scope.Lens = angular.copy($scope.Camera.IrisMode);
                if($scope.Lens.substring(0,3) === 'ICS') {
                    $scope.Lens = 'ICS';
                }
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function checkICSLensSupport() {
        for(var i = 0; i < $scope.IrisModeOptions.length; i++) {
            var option = $scope.IrisModeOptions[i];
            if(option.indexOf('ICS') !== -1) {
                $scope.ICSLensSupport = true;
                return;
            }
        }
    }

    function flangeBackView() {
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flangeback&action=view', '',
            function (response) {
                $scope.FlangeBack = response.data.FlangeBack[0];
                $scope.FBAdjustEnable = angular.copy($scope.FlangeBack.Enable);
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function SaveFBEnable() {
        var setData = {};
        setData.Enable = $scope.FBAdjustEnable;
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flangeback&action=set', setData,
            function (response) {
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    };

    function SaveTCEnable() {
        var setData = {};
        setData.TemperatureCompensationEnable = $scope.TCEnable;
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=set', setData,
            function (response) {
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    };

    $scope.IRShiftChange = function() {
        var setData = {};
        var IRShift = null;
        if($scope.IRShift !== 'Off') {
            IRShift = $scope.IRShift;
            IRShift = IRShift.replace('nm','');
            setData.IRShift = IRShift;
        } else {
            setData.IRShift = $scope.IRShift;
        }

        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=focus&action=set', setData,
            function (response) {
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    };

    $scope.FBAdjust = function(level) {
        var setData = {};
        setData.FocalLength = level;

        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flangeback&action=control', setData,
            function (response) {
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    };

    function view() {
        var promises = [];

        promises.push(focusView);

        promises.push(cameraView);

        promises.push(flangeBackView);

        $q.seqAll(promises).then(
            function(){
                $scope.pageLoaded = true;
                $rootScope.$emit('changeLoadingBar', false);
                showVideo().finally(function(){
                    $("#simplefocuspage").show();
                });
            },
            function(errorData){
                $rootScope.$emit('changeLoadingBar', false);
                console.log(errorData);
            }
        );
    }

    function showVideo(){
        var getData = {};
        getData.Channel = UniversialManagerService.getChannelId();
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

                $scope.coordinates = new Array(1);
                $scope.coordinates[0] = {isSet: false, x1: 0, y1: 0, x2: 0,y2: 0};

                $scope.sketchinfo = {
                    workType: "simpleFocus",
                    shape: 0,
                    maxNumber: 1,
                    modalId: null
                };                
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);                    
    }

    $rootScope.$saveOn('channelSelector:selectChannel', function(event, index){
        $rootScope.$emit('changeLoadingBar', true);
        UniversialManagerService.setChannelId(index);
        $rootScope.$emit("channelSelector:changeChannel", index);
        view();
    }, $scope);

    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            getAttributes().finally(function(){
                view();
            });
        }
    })();

    $scope.manualFocus = manualFocus;
    $scope.manualZoom = manualZoom;
    $scope.focusMode = focusMode;
    $scope.setFastAutoFocus = setFastAutoFocus;
    $scope.setFBEnable = setFBEnable;
    $scope.setTCEnable = setTCEnable;

});
