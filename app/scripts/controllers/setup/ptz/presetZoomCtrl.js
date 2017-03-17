kindFramework.controller('presetZoomCtrl', function ($scope, $location, $timeout, $uibModal, SunapiClient, Attributes, COMMONUtils, $q, $translate, XMLParser)
{
    "use strict";

    var mAttr = Attributes.get();

    var pageData = {};
    $scope.PTZPresetPage = {};
    $scope.PTZPresetPage.pageSize = 15;
    $scope.PTZPresetPage.presetList = [];
    $scope.PTZPresetPage.currentPage = 1;
    $scope.PTZPresetPage.pageIndex = $scope.PTZPresetPage.currentPage;
    
    $scope.PTZPresetOptionsList = [];
    $scope.SelectedChannel = 0;
    $scope.CurrentPreset = 1;
    $scope.PTZPresetOptions = {};
    $scope.PresetName = "";
    
    $scope.presetCheckbox = function(){
        if (typeof $scope.PTZPresets !== 'undefined'){
            var presetCount = $scope.PTZPresets.length;
            var selectedCount = 0;
            for(var index in $scope.PTZPresets){
                var preset = $scope.PTZPresets[index];
                if(preset.SelectedPreset) selectedCount++;
            }
            $scope.PTZPreset.checkAll = presetCount == selectedCount;
        }
    };
    
    $scope.checkAll = function(){
        if (typeof $scope.PTZPresets !== 'undefined'){
            for(var index in $scope.PTZPresets){
                var preset = $scope.PTZPresets[index];
                preset.SelectedPreset = $scope.PTZPreset.checkAll;
            }
        }
    };
    function getAttributes()
    {
        $scope.ZoomOnlyModel = mAttr.ZoomOnlyModel;
        $scope.PTZModel = mAttr.PTZModel;
        $scope.OnlyNumStr = mAttr.OnlyNumStr;
       
        $scope.PTZPreset = {};
        $scope.PTZPreset.checkAll = false;

        if (mAttr.PresetActions !== undefined)
        {
            $scope.PresetActions = mAttr.PresetActions;
        }

        if (mAttr.PresetTrackingTime !== undefined)
        {
            $scope.PresetTrackingTime = mAttr.PresetTrackingTime;
        }
        
        if (mAttr.PresetNameMaxLen !== undefined) {
            $scope.PresetNameMaxLen = parseInt(mAttr.PresetNameMaxLen);
        }
        try {
            $scope.LastPositionAttr = {};
            $scope.LastPositionAttr.RememberLastPosition = mAttr.RememberLastPosition;
            if (mAttr.RememberLastPosition !== undefined){
                $scope.LastPositionAttr.RememberLastPositionDuration = mAttr.RememberLastPositionDuration;
                $scope.LastPositionAttr.DurLen = String($scope.LastPositionAttr.RememberLastPositionDuration.maxValue).length;
            }
        } catch (e) {
        }
    }

    function getPresets() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=view', getData,
            function (response) {
                $scope.PTZPresets = response.data.PTZPresets[0].Presets;
                $scope.PTZPresetPage.presetList = [];
                $scope.PTZPresetPage.currentPage = 1;
                $scope.PTZPresetPage.pageIndex = $scope.PTZPresetPage.currentPage;
                $scope.PTZPresetPage.presetList = COMMONUtils.chunkArray($scope.PTZPresets, $scope.PTZPresetPage.pageSize);
            },
            function (errorData) {
                if (errorData !== "Configuration Not Found") {
                    console.log(errorData);
                } else {
                    $scope.PTZPresets = [];
                    $scope.PTZPreset.checkAll = false;
                }
            }, '', true);
    }

    function removePresets(presetFilter)
    {
        var getData = {};

        getData.Preset = presetFilter;

        SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=remove', getData,
            function (response) {
                view();
            },
            function (errorData) {
                view();
                console.log(errorData);
            }, '', true);
    }

    function gotoPreset(Preset)
    {
        var getData = {};

        getData.Channel = 0;
        getData.Preset = Preset;

        return SunapiClient.get('/stw-cgi/ptzcontrol.cgi?msubmenu=preset&action=control', getData,
                function (response)
                {
            
                },
                function (errorData)
                {
                    console.log(errorData);
                }, '', true);
    }
    
    function remove()
    {
        if (typeof $scope.PTZPresets !== 'undefined')
        {
            var presetFilter = "";

            var selectedCount = 0;
            for (var i = 0; i < $scope.PTZPresets.length; i++)
            {
                if ($scope.PTZPresets[i].SelectedPreset)
                {
                    presetFilter += $scope.PTZPresets[i].Preset + ',';
                    selectedCount++;
                }
            }
            
            if (selectedCount && (selectedCount === $scope.PTZPresets.length))
            {
                presetFilter = 'All';
                COMMONUtils.ShowConfirmation(function(){
                    removePresets(presetFilter);
                },'lang_msg_confirm_remove_profile','sm');
            }
            else
            {
                if (presetFilter.length)
                {
                    presetFilter = presetFilter.substring(0, presetFilter.length - 1);
                    COMMONUtils.ShowConfirmation(function(){
                        removePresets(presetFilter);
                    },'lang_msg_confirm_remove_profile','sm');
                }
            }
        }
    }
 
    $scope.$watch('LastPosition.RememberLastPosition',function(newVal, oldVal){
        if (typeof newVal !== 'undefined' && newVal != oldVal){
            $scope.ptzinfo = {
                type: 'presetZoom',
                disablePosition: newVal
            };
        }
    });
    
    function view()
    {
        getAttributes();
        var promises = [];
        promises.push(getPresets);
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
                    type: 'presetZoom'
                };
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }
  
    function validationLastPosition()
    {
        if ((Number($scope.LastPosition.RememberLastPositionDuration) < 1) || (Number($scope.LastPosition.RememberLastPositionDuration) >
            Number($scope.LastPositionAttr.RememberLastPositionDuration.maxValue))){
            COMMONUtils.ShowError($translate.instant('lang_range_alert').replace('%1', 1).replace('%2', $scope.LastPositionAttr.RememberLastPositionDuration.maxValue));
            return false;
        }
        return true;
    }

    function getLastPosition(){
        var getData = {}; 
        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=ptzsettings&action=view', getData,
                function (response)
                {
                    if(response && response.data){
                        $scope.LastPosition = response.data.PTZSettings[0];
                        pageData.LastPosition = angular.copy($scope.LastPosition);
                    }
                },
                function (errorData)
                {
                }, '', true);
    }
    $scope.setLastPosition = function(){
        if (!angular.equals(pageData.LastPosition, $scope.LastPosition))
        {
            COMMONUtils.ShowConfirmation(function(){
                if(validationLastPosition()){
                    setPresetLastPosition();
                }
            }, 'lang_set_question', 'sm');
        }
    };
    function setPresetLastPosition(){
        var setData = {};
        setData.RememberLastPosition = $scope.LastPosition.RememberLastPosition; 
        setData.RememberLastPositionDuration = $scope.LastPosition.RememberLastPositionDuration;
        SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=ptzsettings&action=set', setData,
                function (response)
                {
                    pageData.LastPosition = angular.copy($scope.LastPosition);
                },
                function (errorData)
                {
                }, '', true);
    }
    
    $scope.presetSelected = function (preset)
    {
        gotoPreset(preset);
    };
    
    $scope.$on('changePTZPreset', function(args, preset){
    	var promises = [];
        promises.push(getPresets);
    	$q.seqAll(promises).then(
    			function(){
                    gotoPreset(preset);
    			},
    			function(errorData){
                    COMMONUtils.ShowInfo(errorData);
    			}
    	);

    });
  
    $scope.getPageCount = function(){
        return $scope.PTZPresetPage.presetList.length;
    };
    $scope.getFirstPage = function(){
        $scope.PTZPresetPage.currentPage = 1;
        $scope.PTZPresetPage.pageIndex = $scope.PTZPresetPage.currentPage;

        return $scope.PTZPresetPage.currentPage;
    };
    $scope.getPrevPage = function(){
        if($scope.PTZPresetPage.currentPage > 1){
            $scope.PTZPresetPage.currentPage--;
        }
        $scope.PTZPresetPage.pageIndex = $scope.PTZPresetPage.currentPage;

        return $scope.PTZPresetPage.currentPage;
    };
    $scope.jumpToPage = function(){
        var pageCount = parseInt($scope.getPageCount());
        var pageNum = $scope.PTZPresetPage.pageIndex;

        if(pageNum < 1){
            $scope.PTZPresetPage.currentPage = 1;
        }else if(pageNum > pageCount){
            $scope.PTZPresetPage.currentPage = pageCount;
        }else{
            $scope.PTZPresetPage.currentPage = pageNum;
        }
        $scope.PTZPresetPage.pageIndex = $scope.PTZPresetPage.currentPage;
    };
    $scope.getNextPage = function(){
        if($scope.PTZPresetPage.currentPage < $scope.getPageCount()){
            $scope.PTZPresetPage.currentPage++;
        }
        $scope.PTZPresetPage.pageIndex = $scope.PTZPresetPage.currentPage;
        return $scope.PTZPresetPage.currentPage;
    };
    $scope.getLastPage = function(){
        $scope.PTZPresetPage.currentPage = $scope.getPageCount();
        $scope.PTZPresetPage.pageIndex = $scope.PTZPresetPage.currentPage;

        return $scope.PTZPresetPage.currentPage;
    };
    
$scope.remove = remove;
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