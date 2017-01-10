/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('audioCtrl', function ($scope, SunapiClient, XMLParser, Attributes,COMMONUtils, $timeout, CameraSpec, $q) {
    "use strict";

    var mAttr = Attributes.get();
    COMMONUtils.getResponsiveObjects($scope);
    var idx;
    var pageData = {};

    $scope.G711BitRateOptions = CameraSpec.G711BitRateOptions;
    $scope.G711SamplingRateOptions = CameraSpec.G711SamplingRateOptions;
    $scope.G726BitRateOptions = CameraSpec.G726BitRateOptions;
    $scope.G726SamplingRateOptions = CameraSpec.G726SamplingRateOptions;
    $scope.AACBitRateOptions = CameraSpec.AACBitRateOptions;
    $scope.AACSamplingRateOptions = CameraSpec.AACSamplingRateOptions;

    $scope.getTranslatedOption = function (Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };

    function featureDetection() {
        var defer = $q.defer();
        $scope.SelectedChannel = 0;
        if (mAttr.DeviceType != undefined) {
            $scope.DeviceType = mAttr.DeviceType;
            pageData.DeviceType = angular.copy($scope.DeviceType);
            if ($scope.DeviceType === "NVR") {
                $scope.ChannelOptions = [];
                if (mAttr.MaxChannel != undefined) {
                    $scope.maxChannels = parseInt(mAttr.MaxChannel);
                    for (idx = 1; idx <= $scope.maxChannels; idx = idx + 1) {
                        var channelname = "Channel " + idx;
                        $scope.ChannelOptions.push(channelname);
                    }
                }
            }

            if ($scope.DeviceType === "NWC") {
                //Audio - In
                if (mAttr.AudioInSourceOptions != undefined) {
                    $scope.AudioInSourceOptions = mAttr.AudioInSourceOptions;
                }
                if (mAttr.AudioInEncodingOptions != undefined) {
                    $scope.AudioInEncodingOptions = mAttr.AudioInEncodingOptions;
                }

                if (mAttr.AudioInGainOptions != undefined) {
                    var gainmin = parseInt(mAttr.AudioInGainOptions.minValue);
                    var gainmax = parseInt(mAttr.AudioInGainOptions.maxValue);
                    $scope.AudioInGainOptions = [];
                    for (idx = gainmin; idx <= gainmax; idx = idx + 1) {
                        $scope.AudioInGainOptions.push(idx);
                    }
                }
                //Audio-Out
                if (mAttr.AudioOutGainOptions != undefined) {
                    var gainmin = parseInt(mAttr.AudioOutGainOptions.minValue);
                    var gainmax = parseInt(mAttr.AudioOutGainOptions.maxValue);
                    $scope.AudioOutGainOptions = [];
                    for (idx = gainmin; idx <= gainmax; idx = idx + 1) {
                        $scope.AudioOutGainOptions.push(idx);
                    }
                }

                if(mAttr.MaxAudioInput !== undefined)
                {
                    $scope.MaxAudioInput = mAttr.MaxAudioInput;
                }

                if(mAttr.MaxAudioOutput !== undefined)
                {
                    $scope.MaxAudioOutput = mAttr.MaxAudioOutput;
                }

            }
        }

        defer.resolve("success");
        return defer.promise;
    }


    function audioInView() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=audioinput&action=view', getData,
            function (response) {
                /** Populate values from SUNAPI and store in the SCOPE */
                $scope.AudioInputs = response.data.AudioInputs;
                for (idx = 0; idx <= $scope.AudioInputs.length - 1; idx = idx + 1) {
                    $scope.AudioInputs[idx].Bitrate = $scope.AudioInputs[idx].Bitrate / 1000;
                }
                pageData.AudioInputs = angular.copy($scope.AudioInputs);
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function audioOutView() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=audiooutput&action=view', getData,
            function (response) {
                /** Populate values from SUNAPI and store in the SCOPE */
                $scope.AudioOutputs = response.data.AudioOutputs;
                pageData.AudioOutputs = angular.copy($scope.AudioOutputs);
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);

    }

    function view() {
        var functionList = [];

        functionList.push(audioInView);

        if ($scope.DeviceType === "NWC") 
        {
            if($scope.MaxAudioOutput !== 0)
            {
                functionList.push(audioOutView);
            }
        }
        else{
            functionList.push(audioOutView);
        }
        
        $q.seqAll(functionList).then(
            function(){
        $scope.pageLoaded = true;
        $("#audiosettingpage").show();
            },
            function(errorData){
                console.log(errorData);
            }
        );
    }


    function audioInSet() {
        var setData = {};

        if ($scope.DeviceType === "NWC") {
            if (pageData.AudioInputs[$scope.SelectedChannel].Source !== $scope.AudioInputs[$scope.SelectedChannel].Source) {
                setData.Source = pageData.AudioInputs[$scope.SelectedChannel].Source = $scope.AudioInputs[$scope.SelectedChannel].Source;
            }
            if (pageData.AudioInputs[$scope.SelectedChannel].EncodingType !== $scope.AudioInputs[$scope.SelectedChannel].EncodingType) {
                setData.EncodingType = pageData.AudioInputs[$scope.SelectedChannel].EncodingType = $scope.AudioInputs[$scope.SelectedChannel].EncodingType;
            }
            if (pageData.AudioInputs[$scope.SelectedChannel].Bitrate !== $scope.AudioInputs[$scope.SelectedChannel].Bitrate) {
                setData.Bitrate = pageData.AudioInputs[$scope.SelectedChannel].Bitrate = $scope.AudioInputs[$scope.SelectedChannel].Bitrate;
                setData.Bitrate = setData.Bitrate * 1000;
            }
            if (pageData.AudioInputs[$scope.SelectedChannel].Gain !== $scope.AudioInputs[$scope.SelectedChannel].Gain) {
                setData.Gain = pageData.AudioInputs[$scope.SelectedChannel].Gain = $scope.AudioInputs[$scope.SelectedChannel].Gain;
            }
            if (pageData.AudioInputs[$scope.SelectedChannel].PowerOnExternalMIC !== $scope.AudioInputs[$scope.SelectedChannel].PowerOnExternalMIC) {
                setData.PowerOnExternalMIC = pageData.AudioInputs[$scope.SelectedChannel].PowerOnExternalMIC = $scope.AudioInputs[$scope.SelectedChannel].PowerOnExternalMIC;
            }
        }

        if ($scope.DeviceType === "NVR") {
            setData.Enable = pageData.AudioInputs[$scope.SelectedChannel].Enable = $scope.AudioInputs[$scope.SelectedChannel].Enable;
            setData.Channel = $scope.SelectedChannel;
        }

        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=audioinput&action=set', setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function audioOutSet() {
        var setData = {};

        if ($scope.DeviceType === "NVR") {
            return;
        }

        if ($scope.DeviceType === "NWC") 
        {
            if($scope.MaxAudioOutput == 0)
            {
                return;
            }
        } 

        setData.Enable = pageData.AudioOutputs[$scope.SelectedChannel].Enable = $scope.AudioOutputs[$scope.SelectedChannel].Enable;

        if ($scope.DeviceType === "NWC" && setData.Enable === true) {
            setData.Gain = pageData.AudioOutputs[$scope.SelectedChannel].Gain = $scope.AudioOutputs[$scope.SelectedChannel].Gain;
        }

        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=audiooutput&action=set', setData,
            function (response) {},
            function (errorData) {
                console.log(errorData);
            }, '', true);

    }

    function set() {
        COMMONUtils.ApplyConfirmation(saveSettings);
    }

    function saveSettings() {
        var functionList = [];

        if (!angular.equals(pageData.AudioInputs, $scope.AudioInputs)) {
            functionList.push(audioInSet);
        }
        if (!angular.equals(pageData.AudioOutputs, $scope.AudioOutputs)) {
            functionList.push(audioOutSet);
        }

        $q.seqAll(functionList).then(
            function(){
                view();
            },
            function(errorData){
                console.log(errorData);
            }
        );
    }

    $scope.onAudioEncodingChange = function(Index,Encoding)
    {
        $scope.AudioInputs[Index].Bitrate = CameraSpec[Encoding + 'DefaultBitRate'];
        if ( $scope.AudioInputs[Index].SampleRate ) {
            $scope.AudioInputs[Index].SampleRate = $scope[Encoding + 'SamplingRateOptions'][0];
        }
    };

    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            featureDetection().finally(function(){
            view();
            });
        }
    })();

    $scope.submit = set;
    $scope.view = view;
});
