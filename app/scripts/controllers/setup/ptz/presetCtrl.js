kindFramework.controller('presetCtrl', function ($scope, $location, $timeout, $uibModal, SunapiClient, Attributes, COMMONUtils, $q, $translate)
{
    "use strict";

    var mAttr = Attributes.get();

    var pageData = {};

    var BrowserDetect = COMMONUtils.getBrowserDetect();
    
    $scope.getTranslatedOption = function (Option)
    {
        return COMMONUtils.getTranslatedOption(Option);
    };

    $scope.onSelectedImage = function (Option, PresetNumber)
    {
        Attributes.setDefaultPresetNumber(PresetNumber);

        if (Option === 0)
        {
            $location.path('/setup/videoAudio_cameraSetup');
        }
        else if (Option === 1)
        {
            var path = '/setup/event_motionDetection';
            if (mAttr.VideoAnalyticsSupport === true) {
                path = '/setup/event_videoAnalytics';
            }
            $location.path(path);
        }
    };

    $scope.presetSelected = function (preset)
    {
        gotoPreset(preset);
    };
    $scope.$on('changePTZPreset', function(args, preset){
    	var promises = [];
    	promises.push(function(){return gotoPreset(preset)});
        promises.push(getPresets);
        promises.push(getPresetImageConfig);
    	$q.seqAll(promises).then(
    			function(){
    			},
    			function(errorData){
    			}
    	);

    });

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

    function getPresetImageConfig() {
        var getData = {};
        return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=view', getData,
            function (response) {
                var PresetImageConfig;
                if(typeof response.data.PresetImageConfig !== 'undefined'){
                    PresetImageConfig = response.data.PresetImageConfig[0].Presets;
                }else{
                    PresetImageConfig = [];
                }

                if (PresetImageConfig.length === $scope.PTZPresets.length) {
                    for (var i = 0; i < PresetImageConfig.length; i++) {
                        $scope.PTZPresets[i].SelectedPreset = false;
                        $scope.PTZPresets[i].AfterAction = PresetImageConfig[i].AfterAction;
                        $scope.PTZPresets[i].AfterActionTrackingTime = PresetImageConfig[i].AfterActionTrackingTime;
                    }
                } else {
                    $scope.PTZPresets = [];
                }
                pageData.PTZPresets = angular.copy($scope.PTZPresets);
            },
            function (errorData) {
                if (errorData !== "Configuration Not Found") {
                    console.log(errorData);
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

    function setPresetImageConfig()
    {
        var specialHeaders = [];
        specialHeaders[0] = {};
        specialHeaders[0].Type = 'Content-Type';
        specialHeaders[0].Header = 'application/x-www-form-urlencoded';

        var setData = {
        		'PresetImageConfig' : 
        			[
	        			 {
	        				 'Channel' : 0,
	        				 'Presets' : []
	        			 }
        			 ]
        };    	
    	
        for (var i = 0; i < $scope.PTZPresets.length; i++)
        {
            if (!angular.equals(pageData.PTZPresets[i], $scope.PTZPresets[i]))
            {
                setData.PresetImageConfig[0].Presets.push(
                	{
                		"Preset" : $scope.PTZPresets[i].Preset,
                		"AfterAction" : $scope.PTZPresets[i].AfterAction,
                		"AfterActionTrackingTime" : $scope.PTZPresets[i].AfterActionTrackingTime
                	}
                );
            }
        }
        //console.log("PostSetData",setData);
        
        var jsonString = JSON.stringify(setData);
        var encodeddata = encodeURI(jsonString);

        SunapiClient.post('/stw-cgi/ptzconfig.cgi?msubmenu=presetimageconfig&action=set', {},
        		function (response)
        		{
        			//completeMessage('lang_apply');
        			pageData.PTZPresets = angular.copy($scope.PTZPresets);
        		},
        		function (errorData)
        		{
        			view();
        			console.log(errorData);
        		}, $scope, encodeddata, specialHeaders);
        
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

    function validatePage()
    {
        return true;
    }
    function validationLastPosition()
    {
        if ($scope.LastPosition.RememberLastPositionDuration === undefined || (Number($scope.LastPosition.RememberLastPositionDuration) < 1) || (Number($scope.LastPosition.RememberLastPositionDuration) >
            Number($scope.LastPositionAttr.RememberLastPositionDuration.maxValue))){
            COMMONUtils.ShowError($translate.instant('lang_range_alert').replace('%1', 1).replace('%2', $scope.LastPositionAttr.RememberLastPositionDuration.maxValue));
            return false;
        } 
        return true;
    }

    function openSelectRemove(selectorName,removeIndex,focusSkip){
        var newVal = $('#'+selectorName+' option:selected').val();
        var removeSelect = $('#'+selectorName);
        removeSelect.unbind();
        removeSelect.remove();
        $timeout(function(){
            if(selectorName=='presetAfterActionSelect'){
                if(newVal !== undefined) $scope.PTZPresets[removeIndex].AfterAction = newVal;
                $('.presetAfterActionInput:eq('+removeIndex+')').show();
                if(focusSkip != true) $('.presetAfterActionInput:eq('+removeIndex+')').focus();
            }else{
                if(newVal !== undefined) $scope.PTZPresets[removeIndex].AfterActionTrackingTime = newVal;
                $('.presetAfterActionTrackingTimeInput:eq('+removeIndex+')').show();
                if(focusSkip != true) $('.presetAfterActionTrackingTimeInput:eq('+removeIndex+')').focus();
            }
        });
    }
    function openSelectCreate(selectorName,index,options,selectedVal,hideSelector){
        var selectHtml = $('<select id="'+selectorName+'" name="'+selectorName+'" data-index="'+index+'" class="form-control preset-input-select openSelect" />');
        $.each(options,function(subIndex,item){
            if(item==selectedVal){
                $('<option/>',{value:item,text:$scope.getTranslatedOption(item),selected:'selected'}).appendTo(selectHtml);
            }else{
                $('<option/>',{value:item,text:$scope.getTranslatedOption(item)}).appendTo(selectHtml);
            }
        });
        $(hideSelector).hide();
        $(hideSelector).parent().append(selectHtml);
        var createdSelect = $('#'+selectorName);
        if(!BrowserDetect.isIE){
            createdSelect.focus();
        }
        createdSelect.focusout(function(){
            openSelectRemove(selectorName,index,true);
        });
        createdSelect.change(function(){
            openSelectRemove(selectorName,index);
        });
    }
    $scope.openAfterActionSelect = function(index,isShow){
        var selectorName = 'presetAfterActionSelect';
        if(isShow){
            var selectedVal = $scope.PTZPresets[index].AfterAction;
            var hideSelector = '.presetAfterActionInput:eq('+index+')';
            var options = $scope.PresetActions;
            var openedSelect = $('.openSelect');
            if(openedSelect.length == 1) {
                var removeSelectorName = openedSelect.attr('id');
                var removeIndex = parseInt(openedSelect.attr('data-index'),10);
                openSelectRemove(removeSelectorName,removeIndex);
            }
            openSelectCreate(selectorName,index,options,selectedVal,hideSelector);
        }
    };
    $scope.openTrackingTimeSelect = function(index,isShow){
        var selectorName = 'presetAfterActionTrackingTimeSelect';
        if(isShow){
            var selectedVal = $scope.PTZPresets[index].AfterActionTrackingTime;
            var hideSelector = '.presetAfterActionTrackingTimeInput:eq('+index+')';
            var options = $scope.PresetTrackingTime;
            var openedSelect = $('.openSelect');
            if(openedSelect.length == 1) {
                var removeSelectorName = openedSelect.attr('id');
                var removeIndex = parseInt(openedSelect.attr('data-index'),10);
                openSelectRemove(removeSelectorName,removeIndex);
            }
            openSelectCreate(selectorName,index,options,selectedVal,hideSelector);
        }
    };
    $scope.$watch('LastPosition.RememberLastPosition',function(newVal, oldVal){
        if (typeof newVal !== 'undefined'){
            $scope.ptzinfo = {
                type: 'preset',
                disablePosition: newVal
            };
        }
    });
    
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

    function view()
    {
        getAttributes();
        var promises = [];
        promises.push(getPresets);
        promises.push(getPresetImageConfig);
        if (typeof mAttr.RememberLastPosition !== 'undefined'){
            promises.push(getLastPosition);
        }
        $q.seqAll(promises).then(
            function(){
                $scope.pageLoaded = true;
                showVideo().finally(function(){
                    $("#presetpage").show();
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
                    type: 'preset'
                };
            },
            function (errorData) {
                console.log(errorData);
            }, '', true);
    }

    function set()
    {
        if (validatePage())
        {
            if (!angular.equals(pageData.PTZPresets, $scope.PTZPresets))
            {
                COMMONUtils.ApplyConfirmation(setPresetImageConfig);
            }
        }
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

    function completeMessage(message){
        var modalInstance = $uibModal.open({
            templateUrl: 'views/setup/common/errorMessage.html',
            controller: 'errorMessageCtrl',
            size: 'sm',
            resolve: {
                Message: function ()
                {
                    return message;
                },
                Header: function ()
                {
                    return 'lang_success';
                }
            }
        });

        modalInstance.result.then(function (){
            $scope.pageLoaded = false;
            view();
        }, function (){

        });
    }

    $scope.submit = set;
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