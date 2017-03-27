kindFramework.controller('smartCodecCtrl', function ($scope, $timeout, SunapiClient, Attributes, COMMONUtils, sketchbookService, $q, $rootScope) {
    "use strict";

    var mAttr = Attributes.get();
    COMMONUtils.getResponsiveObjects($scope);
    $scope.ch = 0;
    var pageData = {};

    $scope.channelSelectionSection = (function(){
        var currentChannel = 0;

        return {
            getCurrentChannel: function(){
                return currentChannel;
            },
            setCurrentChannel: function(index){
                currentChannel = index;
            }
        }
    })();

    $scope.clearAll = function ()
    {
        var removeSetData = {};
        removeSetData['Area'] = 'All';
        removeSetData.Channel = $scope.channelSelectionSection.getCurrentChannel();
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=smartcodec&action=remove',removeSetData,
            function (response) {
                view();

                for (var i = 0; i < mAttr.MaxSmartCodecArea; i++) {
                    $scope.coordinates[i] = {
                        isSet: false,
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 0
                    };
                }
                sketchbookService.set($scope.coordinates);
            },
            function (errorData) {
        for (var i = 0; i < mAttr.MaxSmartCodecArea; i++) {
            $scope.coordinates[i] = {
                isSet: false,
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            };
        }
        sketchbookService.set($scope.coordinates);
            }, '', true);
    };

    $scope.getTranslation = function (Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };

    function getAttributes() {
        $scope.ZoomOnlyModel = mAttr.ZoomOnlyModel;
        $scope.PTZModel = mAttr.PTZModel;
        $scope.MaxChannel = mAttr.MaxChannel;
        if (mAttr.SmartCodecOptions !== undefined) {
            $scope.SmartCodecOptions = mAttr.SmartCodecOptions;
        }

        if (mAttr.SmartCodecQualityOptions !== undefined) {
            $scope.QualityOptions = mAttr.SmartCodecQualityOptions;
        }

        if (mAttr.FaceDetectionSupport !== undefined) {
            $scope.FaceDetectionSupport = mAttr.FaceDetectionSupport;
        }

        if (mAttr.MaxSmartCodecArea !== undefined) {
            $scope.MaxSmartCodecArea = mAttr.MaxSmartCodecArea;
        }        
    }

    function setSmartCodec() {
        var deferred = $q.defer();
        var ignoredKeys = ['Areas'],
            functionList = [];

        functionList.push(function(){
            var setData = {},
                changed = 0;

            COMMONUtils.fillSetData(setData, $scope.SmartCodec[$scope.ch], pageData.SmartCodec[$scope.ch], ignoredKeys, false);
            $.each(setData, function (k, value) {
                changed++;
            });
            if (changed != 0) {
                setData.Channel = $scope.channelSelectionSection.getCurrentChannel();
                return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=smartcodec&action=set', setData,
                    function (response) {},
                    function (errorData) {
                        console.log(errorData);
                    }, '', true);
            }
        });

        functionList.push(function(){
            var setData = {},
                changed = 0;

            if(!angular.equals($scope.SmartCodec[$scope.ch].Areas, pageData.SmartCodec[$scope.ch].Areas)){
                if(typeof pageData.SmartCodec[$scope.ch].Areas == "undefined"){
                    for(var i = 0; i < mAttr.MaxSmartCodecArea; i++){
                        if(typeof $scope.SmartCodec[$scope.ch].Areas[i] != "undefined"){
                            var coordi = $scope.SmartCodec[$scope.ch].Areas[i].Coordinate[0].x + ',';
                            coordi += $scope.SmartCodec[$scope.ch].Areas[i].Coordinate[0].y + ',';
                            coordi += $scope.SmartCodec[$scope.ch].Areas[i].Coordinate[1].x + ',';
                            coordi += $scope.SmartCodec[$scope.ch].Areas[i].Coordinate[1].y;

                            setData['Area.' + $scope.SmartCodec[$scope.ch].Areas[i].Area + '.Coordinate'] = coordi;
                            changed++;
                        }
                    }
                }else{
                    for(var i = 0; i < mAttr.MaxSmartCodecArea; i++){
                        if(typeof $scope.SmartCodec[$scope.ch].Areas[i] != "undefined" && typeof pageData.SmartCodec[$scope.ch].Areas[i] == "undefined"){
                            var coordi = $scope.SmartCodec[$scope.ch].Areas[i].Coordinate[0].x + ',';
                            coordi += $scope.SmartCodec[$scope.ch].Areas[i].Coordinate[0].y + ',';
                            coordi += $scope.SmartCodec[$scope.ch].Areas[i].Coordinate[1].x + ',';
                            coordi += $scope.SmartCodec[$scope.ch].Areas[i].Coordinate[1].y;

                            setData['Area.' + $scope.SmartCodec[$scope.ch].Areas[i].Area + '.Coordinate'] = coordi;
                            changed++;
                        }
                    }
                }
            }

            if (changed != 0) {
                setData.Channel = $scope.channelSelectionSection.getCurrentChannel();
                return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=smartcodec&action=add', setData,
                    function (response) {},
                    function (errorData) {
                        console.log(errorData);
                    }, '', true);
            }
        });

        if(functionList.length > 0){
            $q.seqAll(functionList).then(
                function () {
                    if(checkChangedData()){
                        pageData.SmartCodec = angular.copy($scope.SmartCodec);
                    }
                    view();
                    deferred.resolve(true);
                },
                function (errorData) {
                    deferred.reject(errorData);
                }
            );
        }else{
            $timeout(function(){
                deferred.resolve(true);
            });
        }

        return deferred.promise;
    }

    function saveSettings() {
        if (checkChangedData()) {
            setSmartCodec();
        }
    }

    function getSketchbookData(){
        var smartCodecArray = sketchbookService.get();

        for (var i = 0; i < smartCodecArray.length; i++) {
            if(smartCodecArray[i].isSet){
                if ($scope.SmartCodec[0].Areas == undefined) {
                    $scope.SmartCodec[0].Areas = new Array(smartCodecArray.length);
                }

                $scope.SmartCodec[0].Areas[i] = {
                    "Area": (i + 1),
                    "Coordinate": [{
                        "x": smartCodecArray[i].x1,
                        "y": smartCodecArray[i].y1
                    }, {
                        "x": smartCodecArray[i].x2,
                        "y": smartCodecArray[i].y2
                    }]
                };
            }
        }
    }

    function set() {
        COMMONUtils.ApplyConfirmation(saveSettings);
    }

    function getFaceDetection() {
        var getData = {
            Channel: $scope.channelSelectionSection.getCurrentChannel()
        };
        return SunapiClient.get('/stw-cgi/eventsources.cgi?msubmenu=facedetection&action=view', getData,
            function (response) {
                $scope.FaceDetection = response.data.FaceDetection;
                pageData.FaceDetection = angular.copy($scope.FaceDetection);
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function getSmartCodec() {
        var getData = {
            Channel: $scope.channelSelectionSection.getCurrentChannel()
        };
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=smartcodec&action=view', getData,
            function (response) {
                $scope.SmartCodec = response.data.SmartCodec;
                pageData.SmartCodec = angular.copy($scope.SmartCodec);
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function view() {
        var promises = [];
        
        getAttributes();
        promises.push(getSmartCodec);
        if ($scope.FaceDetectionSupport === true) {
            promises.push(getFaceDetection);
        }

        $q.seqAll(promises).then(
            function(){
                $rootScope.$emit('changeLoadingBar', false);
                $scope.pageLoaded = true;
                showVideo().finally(function(){
                    $("#smartcodecpage").show();
                });
            },
            function(errorData){
                $rootScope.$emit('changeLoadingBar', false);
                console.log(errorData);
            }  
        );
    }

    function showVideo(){
        var getData = {
            Channel: $scope.channelSelectionSection.getCurrentChannel()
        };
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
                    type: 'none'
                };
                var drawMax = mAttr.MaxSmartCodecArea;
                $scope.coordinates = new Array(drawMax);

                for (var i = 0; i < drawMax; i++) {
                    if ($scope.SmartCodec[0].Areas != undefined) {
                        if ($scope.SmartCodec[0].Areas[i] != undefined) {
                            var codecArea = $scope.SmartCodec[0].Areas[i];
                            var areaX1 = codecArea.Coordinate[0].x;
                            var areaY1 = codecArea.Coordinate[0].y;
                            var areaX2 = codecArea.Coordinate[1].x;
                            var areaY2 = codecArea.Coordinate[1].y;
                            $scope.coordinates[i] = {
                                isSet: true,
                                x1: areaX1,
                                y1: areaY1,
                                x2: areaX2,
                                y2: areaY2
                            };
                        } else {
                            $scope.coordinates[i] = {
                                isSet: false,
                                x1: 0,
                                y1: 0,
                                x2: 0,
                                y2: 0
                            };
                        }
                    } else {
                        $scope.coordinates[i] = {
                            isSet: false,
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 0
                        };
                    }
                }

                $scope.sketchinfo = {
                    workType: "smartCodec",
                    shape: 0,
                    maxNumber: drawMax,
                    modalId: null
                };

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

    function checkChangedData(){
        getSketchbookData();
        return !angular.equals(pageData.SmartCodec, $scope.SmartCodec);
    }

    function changeChannel(index){
        $rootScope.$emit("channelSelector:changeChannel", index);
        $rootScope.$emit('changeLoadingBar', true);
        $scope.channelSelectionSection.setCurrentChannel(index);
        view();
    }

    $rootScope.$saveOn('channelSelector:selectChannel', function(event, index){
        if(checkChangedData()){
            COMMONUtils
                .confirmChangeingChannel()
                .then(function(){
                    setSmartCodec().then(function(){
                        changeChannel(index);
                    });
                }, function(){
                    console.log("canceled");
                });    
        }else{
            changeChannel(index);
        }
    }, $scope);

    $scope.submit = set;
    $scope.view = view;
});
