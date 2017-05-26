/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


/*global kindFramework */
/*global console */
/*global alert */

kindFramework.controller('productinfo', function ($scope, $timeout, $uibModal, $translate, SunapiClient, XMLParser, Attributes,COMMONUtils, MultiLanguage) {
    "use strict";
    var mAttr = Attributes.get();

    COMMONUtils.getResponsiveObjects($scope);

    $scope.systemLanguage = {
        currentLanguage: null,
        supportedLanguages: []
    };
    $scope.Info = {
        DeviceName: null,
        Location: null,
        Description: null,
        Memo: null
    };

    function featureDetection()
    {
        $scope.DeviceNameRange = {};
        $scope.DeviceNameRange.PatternStr = "^[^#'\"&+:<>=\\%*\\\\]*$";

        if (mAttr.DeviceName !== undefined)
        {
            $scope.DeviceNameRange.Min = 1;
            $scope.DeviceNameRange.Max = mAttr.DeviceName.maxLength;
        }

        $scope.DeviceLocationRange = {};
        $scope.DeviceLocationRange.PatternStr = mAttr.FriendlyNameCharSetExpandedStr;
        if (mAttr.DeviceLoc !== undefined)
        {
            $scope.DeviceLocationRange.Min = 1;
            $scope.DeviceLocationRange.Max = mAttr.DeviceLoc.maxLength;
        }

        $scope.DeviceDescriptionRange = {};
        $scope.DeviceDescriptionRange.PatternStr = mAttr.FriendlyNameCharSetExpandedStr;
        if (mAttr.DeviceDesc !== undefined)
        {
            $scope.DeviceDescriptionRange.Min = 1;
            $scope.DeviceDescriptionRange.Max = mAttr.DeviceDesc.maxLength;
        }

        $scope.MemoRange = {};
        $scope.MemoRange.PatternStr = mAttr.FriendlyNameCharSetExpandedStr;
        if (mAttr.Memo !== undefined)
        {
            $scope.MemoRange.Min = 1;
            $scope.MemoRange.Max = mAttr.Memo.maxLength;
        }

        $scope.systemLanguage.supportedLanguages = mAttr.Languages;
        $scope.showLanguage = true;
        if ($scope.systemLanguage.supportedLanguages.length === 1) {
            $scope.showLanguage = false;
        }
    }


    function view() {
        featureDetection();

        SunapiClient.get(
            '/stw-cgi/system.cgi?msubmenu=deviceinfo&action=view',
            '',
            function (response) {
                /** Populate values from SUNAPI and store in the SCOPE */
                $scope.DeviceType = response.data.DeviceType;
                $scope.Model = response.data.Model;
                if ($scope.DeviceType === 'NWC') {
                    $scope.Serial = response.data.SerialNumber;
                    $scope.Info.Location = response.data.DeviceLocation;
                    $scope.Info.Description = response.data.DeviceDescription;
                    $scope.Info.Memo = response.data.Memo;
                    $scope.ISPVersion = response.data.ISPVersion;
                } else {
                    $scope.MicomVersion = response.data.MicomVersion;
                }
                $scope.Info.DeviceName = decodeURIComponent(response.data.DeviceName);
                $scope.BuildDate = response.data.BuildDate;
                $scope.FirmwareVersion = response.data.FirmwareVersion;
                $scope.systemLanguage.currentLanguage = response.data.Language;
            },
            function (errorData) {
            },
            '',
            true
        )
        .then(
            function() {
                $scope.pageLoaded = true;
                $("#prodinfopage").show();
            },
            function(errorData){
                console.log(errorData);
            }
        );
    }

    function validDeviceName(){
        var val = $scope.Info.DeviceName;
        if($.trim(val).length === 0) return false; // only white space
        var len = val.length;
        for(var i = 0; i < val.length; i++){
            var str = val[i];
            try{
                var stringByteLen = ~-encodeURI(str).split(/%..|./).length;
            }catch(e){
                i++;
                len--;
            }
        }

        if(len > 8){
            return false;
        }else{
            return true;
        }
    }

    function validate() {
        var retVal = true;

        if ($scope.prodinfoForm.DeviceName.$valid === false) {
            var ErrorMessage = 'lang_msg_check_deviceName';
            retVal = false;
            COMMONUtils.ShowError(ErrorMessage);
            return retVal;
        }

        if (validDeviceName() === false) {
            var ErrorMessage = $translate.instant('lang_msg_check_deviceName') + ' ' + $translate.instant('lang_msg_allowed_upto_8_chars');
            retVal = false;
            COMMONUtils.ShowError(ErrorMessage);
            return retVal;
        }

        if ($scope.DeviceType === 'NWC')
        {
            if ($scope.prodinfoForm.Description.$valid === false)
            {
                var ErrorMessage = 'lang_msg_check_description';
                retVal = false;
                COMMONUtils.ShowError(ErrorMessage);
                return retVal;
            }

            if($scope.prodinfoForm.Location.$valid === false)
            {
                var ErrorMessage = 'lang_msg_check_location';
                retVal = false;
                COMMONUtils.ShowError(ErrorMessage);
                return retVal;
            }

            if($scope.prodinfoForm.Memo.$valid === false)
            {
                var ErrorMessage = 'lang_msg_check_memo';
                retVal = false;
                COMMONUtils.ShowError(ErrorMessage);
                return retVal;
            }
        }

        return retVal;
    }

    function set()
    {
        if (validate())
        {
            var modalInstance = $uibModal.open({
                    templateUrl: 'views/setup/common/confirmMessage.html',
                    controller: 'confirmMessageCtrl',
                    size: 'sm',
                    resolve: {
                        Message: function ()
                        {
                            return 'lang_apply_question';
                        }
                    }
                });

                modalInstance.result.then(function ()
                {
                    var setData = {};
                    setData.DeviceName = encodeURIComponent($scope.Info.DeviceName);
                    if ($scope.DeviceType === 'NWC') {
                        setData.DeviceLocation = $scope.Info.Location;
                        setData.DeviceDescription = $scope.Info.Description;
                        setData.Memo = $scope.Info.Memo;
                        setData.Language = $scope.systemLanguage.currentLanguage;

                        /** Change the UI Language */
                        MultiLanguage.setLanguage($scope.systemLanguage.currentLanguage);
                        mAttr.CurrentLanguage = $scope.systemLanguage.currentLanguage;
                    }
                    SunapiClient.get('/stw-cgi/system.cgi?msubmenu=deviceinfo&action=set', setData,
                            function (response) {

                            },
                            function (errorData) {
                                alert("Error!");
                            }, '', true);
                }, function ()
                {

                });
        }
    }

    $scope.submit = set;
    $scope.view = view;

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
