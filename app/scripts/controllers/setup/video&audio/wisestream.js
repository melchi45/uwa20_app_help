/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('wiseStreamCtrl', function ($scope, SunapiClient, XMLParser, Attributes,COMMONUtils, $timeout, CameraSpec, $q) {
    "use strict";

    var mAttr = Attributes.get();
    $scope.wisestreamMode;
    $scope.WiseStreamEnableOptions;
    $scope.SelectedChannel = 0;
    COMMONUtils.getResponsiveObjects($scope);
    var idx;
    var pageData = {};

    function getAttributes() {
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
         var getData = {};
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
        $scope.pageLoaded = true;
        $("#wisestreampage").show();
            },
            function(errorData){
                console.log(errorData);
            }
        );
    }

    $scope.getTranslatedOption = function (Option) {
        return COMMONUtils.getTranslatedOption(Option);
    };

    function WiseStreamSet() {
        var setData = {};

            setData.Mode = $scope.wisestreamMode;
            setData.Channel = $scope.SelectedChannel;
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
        if (!angular.equals(pageData.WiseStream[0].Mode, $scope.wisestreamMode)) {
            WiseStreamSet();
        }
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

    $scope.submit = set;
    $scope.view = view;
});
