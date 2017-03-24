/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('wiseStreamCtrl', function ($scope, SunapiClient, XMLParser, Attributes,COMMONUtils, $timeout, CameraSpec, $q, $rootScope) {
    "use strict";

    var mAttr = Attributes.get();
    $scope.wisestreamMode;
    $scope.WiseStreamEnableOptions;
    COMMONUtils.getResponsiveObjects($scope);
    var idx;
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

    function getAttributes() {
        $scope.MaxChannel = mAttr.MaxChannel;
        $scope.WiseStreamEnableOptions = [];

        for (var i = 0; i < mAttr.WiseStreamOptions.length; i++) {
            var option = {};

            if (mAttr.WiseStreamOptions[i] === 'Medium') {
                option.text = 'MediumOrig'
            } else {
                option.text = mAttr.WiseStreamOptions[i];
            }
            option.value = mAttr.WiseStreamOptions[i];

            $scope.WiseStreamEnableOptions.push(option);
        }
    }

    function wisestreamView(){
         var getData = {
            Channel: $scope.channelSelectionSection.getCurrentChannel()
         };
        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=wisestream&action=view', getData,
            function (response) {
                pageData = angular.copy(response.data);
                if(typeof response.data.WiseStream[0] !== 'undefined')
                {
                    $scope.wisestreamMode = response.data.WiseStream[0].Mode;
                }
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function view() {
        var promises = [];

        promises.push(wisestreamView);

        $q.seqAll(promises).then(
            function(){
                $rootScope.$emit('changeLoadingBar', false);
                $scope.pageLoaded = true;
                $("#wisestreampage").show();
            },
            function(errorData){
                $rootScope.$emit('changeLoadingBar', false);
                console.log(errorData);
            }
        );
    }

    $scope.getTranslatedOption = function (Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };

    function setWiseStream() {
        var setData = {};

        setData.Mode = $scope.wisestreamMode;
        setData.Channel = $scope.channelSelectionSection.getCurrentChannel();
        return SunapiClient.get('/stw-cgi/media.cgi?msubmenu=wisestream&action=set', setData,
            function (response) {
                view();
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }


    function set() {
        COMMONUtils.ApplyConfirmation(saveSettings);
    }

    function saveSettings() {
        if (checkChangedData()) {
            setWiseStream();
        }
    }

    function checkChangedData(){
        return !angular.equals(pageData.WiseStream[0].Mode, $scope.wisestreamMode);
    }

    (function wait() {
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            getAttributes();
            view();
        }
    })();

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
                    setWiseStream().then(function(){
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
