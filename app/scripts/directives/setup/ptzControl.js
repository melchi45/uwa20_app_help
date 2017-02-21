kindFramework.directive('ptzControl', function(Attributes,SunapiClient,$uibModal,$state,$timeout,COMMONUtils, $interval, CAMERA_STATUS, UniversialManagerService){
	"use strict";
	return {
		restrict: 'E',
        scope:{
            ptzinfo:'=',
            quadrant: '='
        },
		templateUrl: './views/setup/common/ptzControl.html',
		link: function(scope, element, attrs){
            var mAttr = Attributes.get("attr");
			scope.showPTZControl = false;
			scope.showPTZControlLabel = 'lang_show';
			scope.showPTZControlPreset = false;
			scope.showPTZControlAT = false;
			scope.showPTZControlBLC = false;
			scope.disablePTZControlBLC = true;
            scope.showPTZControlBasicDPTZ = false;
            scope.showPTZControlFisheyeDPTZ = false;
            scope.showPTZControlEPTZ = false;
            scope.DATFlag = false;
            scope.isShowPTZControl = false;                 
            scope.showZoomFocus = false;   
            scope.showPTZControlBox = true;
            scope.isPtzControlStart = false;

            var sunapiURI, showPTZControlFlag = false;

            (function wait(){
                if (!mAttr.Ready) {
                    $timeout(function () {
                        mAttr = Attributes.get();
                        wait();
                    }, 500);
                } else {
                    if(mAttr.PTZModel){
                        return true;
                    }                    
                    else {
                        if($state.current.name === "setup.ptzSetup_dptzSetup") {
                            SunapiClient.get('/stw-cgi/media.cgi?msubmenu=videoprofile&action=view', '',
                                function (response) {
                                    var DEFAULT_CHANNEL = 0;
                                    var IsDigitalPTZProfile = response.data.VideoProfiles[DEFAULT_CHANNEL].Profiles.some(function(element){
                                        if('IsDigitalPTZProfile' in element)
                                        {
                                            return element.IsDigitalPTZProfile;
                                        }
                                    });
                                    scope.isShowPTZControl = (mAttr.ExternalPTZModel === false && IsDigitalPTZProfile === true);
                                },
                                function (errorData) {
                                    scope.isShowPTZControl = false;
                                },'', true);
                        }
                        else if($state.current.name === "setup.ptzSetup_externalPtzSetup") {
                            scope.isShowPTZControl = true;
                        }
                        else {
                            scope.isShowPTZControl = false;
                        }
                    }
                }
            })();

            scope.showPTZControlMenu = function () {
                showPTZControlFlag = true;
                if (scope.showPTZControl === false) {
                    scope.showPTZControl = true;
                    scope.showPTZControlLabel = 'lang_hide';
                } else {
                    scope.showPTZControl = false;
                    scope.showPTZControlLabel = 'lang_show';
                }
            };

            scope.$watch('ptzinfo', function(ptzinfo){
                if(typeof ptzinfo !== 'undefined'){
                    if(showPTZControlFlag===false){
                        if(ptzinfo.autoOpen){
                            scope.showPTZControl = true;
                            scope.showPTZControlLabel = 'lang_hide';
                        }else{
                            scope.showPTZControl = false;
                            scope.showPTZControlLabel = 'lang_show';
                        }
                    }

                    if(ptzinfo.type==='preset'){
                        scope.showPTZControlPreset = true;
                        scope.showPTZControlAT = false;
                        scope.showPTZControlBLC = false;
                        scope.showPTZControlFisheyeDPTZ = false;
                        $("#ptz-control_at-selectable").unbind();
                    }else if(ptzinfo.type==='AT'){
                        scope.showPTZControlPreset = false;
                        scope.showPTZControlAT = true;
                        scope.showPTZControlBLC = false;
                        scope.showPTZControlFisheyeDPTZ = false;
                        $("#ptz-control_at-selectable").selectable({
                            selected: function(event, ui) {
                            	scope.selectTrackingArea = $(ui.selected).text();
                            	moveAutoTracking(scope.selectTrackingArea);
                                $(ui.selected).addClass("ui-selected").siblings().removeClass("ui-selected").each(
                                    function(key,value){
                                        $(value).find('*').removeClass("ui-selected");
                                    }
                                );
                            },
                            unselected: function(){
                            	scope.selectTrackingArea = '';
                            }
                        });
                        // autoTrackingList Data
                        if (ptzinfo.isViewTrackingData){
	                        if(!ptzinfo.TrackingAreas) ptzinfo.TrackingAreas = [];
	                        scope.TrackingAreas = angular.copy(ptzinfo.TrackingAreas);
                        }

                    }else if(ptzinfo.type ==='BLC'){
                        scope.showPTZControlPreset = false;
                        scope.showPTZControlAT = false;
                        scope.showPTZControlBLC = true;
                        scope.showPTZControlFisheyeDPTZ = false;
                        scope.blcbox = {};
                        scope.blcbox.select=5;
                        scope.blcbox.options = COMMONUtils.getArray(5, true);
                        if(ptzinfo.disable == undefined || (ptzinfo.disable !== undefined && ptzinfo.disable==true)){
                            scope.disablePTZControlBLC = true;
                        }else{
                            scope.disablePTZControlBLC = false;
                        }
                        $("#ptz-control_at-selectable").unbind();
                    }else if(ptzinfo.type ==='DPTZ'){
                        scope.showPTZControl = false;
                        scope.showPTZControlLabel = 'lang_hide';
                        scope.showPTZControlPreset = false;
                        scope.showPTZControlAT = false;
                        scope.showPTZControlBLC = false;
                        scope.showPTZControlDPTZ = false;
                        scope.showPTZControlBasicDPTZ = true;
                        scope.DATFlag = true;

                        $("#ptz-control_at-selectable").unbind();
                    }else if(ptzinfo.type ==='EPTZ'){
                        scope.showPTZControl = false;
                        scope.showPTZControlLabel = 'lang_hide';
                        scope.showPTZControlPreset = false;
                        scope.showPTZControlAT = false;
                        scope.showPTZControlBLC = false;
                        scope.showPTZControlDPTZ = false;
                        scope.showPTZControlEPTZ = true;
                        $("#ptz-control_at-selectable").unbind();
                    }else if(ptzinfo.type ==='ZoomOnly'){
                        scope.showPTZControl = false;
                        scope.showPTZControlLabel = 'lang_hide';
                        scope.showPTZControlPreset = false;
                        scope.showPTZControlAT = false;
                        scope.showPTZControlBLC = false;
                        scope.showPTZControlDPTZ = false;
                        scope.showPTZControlEPTZ = false;
                        scope.showZoomFocus = true;
                        scope.showPTZControlBox = false;
                        scope.isShowPTZControl = true;
                        $("#ptz-control_at-selectable").unbind();
                    }else{
                        scope.showPTZControlPreset = false;
                        scope.showPTZControlAT = false;
                        scope.showPTZControlBLC = false;
                        scope.showPTZControlDPTZ = false;
                        $("#ptz-control_at-selectable").unbind();
                    }
                }
            });

            scope.blcAreaChange = function(mode,direction){
                var data = {};
                data.mode = mode;
                data.direction = direction;
                data.step = scope.blcbox.select;
                scope.$emit('changeBlcArea',data);
            };
            scope.$watch('blcbox.select',function(newVal, oldVal){

            });

            function ptzLimitCheck(data) {
                if (data > 100) { data = 100; }
                else if (data < -100) { data = -100; }

                return data;
            }

            function moveAutoTracking(selectTrackingArea){
            	if(!selectTrackingArea) return;
            	//sunapiURI = '';
            	//execSunapi(sunapiURI);
            }

            scope.deleteAutoTracking = function(){
            	if(!scope.selectTrackingArea) return;
            	execSunapi('/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=remove&Channel=0&TrackingAreaID='+scope.selectTrackingArea, getAutoTracking);
            };

            function getAutoTracking(){
            	execSunapi('/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=view', function(data){
            		$timeout(function(){
	            		try {
	            			if(!data.AutoTracking[0].TrackingAreas) data.AutoTracking[0].TrackingAreas = [];
	                        scope.TrackingAreas = data.AutoTracking[0].TrackingAreas;
	                        scope.selectTrackingArea = '';
						} catch (e) {}
            		},100);
            	});
            }

            $("#ptz-control_move-btn").unbind();
            $("#ptz-control_box").unbind();
            $("#ptz-control_slider").unbind();
            var isDrag = false;
            var isMove = false;
            var animateDuration = 50;
            // var PAN_RATIO = 1.205;
            // var TILT_RATIO = 1.755;
            var PAN_RATIO = 1.495;
            var TILT_RATIO = 1.790;
            var downTimer = null;
            var ptzJogTimer = null;
            var isJogUpdating = false;

            $("#ptz-control_move-btn").draggable({
                containment: "parent",
                revert: false,
                revertDuration: 100,
                drag: function(){
                    isDrag = true;
                    isMove = false;
                    var offset = $(this).position();
                    var xPos = (offset.left);
                    var yPos = (offset.top);
                    xPos *= PAN_RATIO;
                    yPos *= TILT_RATIO;

                    xPos = parseInt(xPos,10) - 100;
                    yPos = -(parseInt(yPos,10) - 100);
                    if (-4 < yPos && yPos < 4) yPos = 0;
                    if (-2 < xPos && xPos < 2) xPos = 0;
                    ptzJogMove(xPos, yPos);
                },
                stop: function(){
                    if(!isDrag && !isMove){
                    }else{
                        isDrag = false;
                        isMove = false;
                        var moveAreaWidth = $('#ptz-control_box').width();
                        var moveAreaHeight = $('#ptz-control_box').height();
                        $('#ptz-control_move-btn').animate({
                            top: (moveAreaHeight/2-12),
                            left: (moveAreaWidth/2-12)
                        }, animateDuration, function(){
                            ptzStop();
                        });
                    }
                }
            });
            $("#ptz-control_box").mousedown(function(e){
                if(isDrag || isMove || e.which != 1)
                    return;

                isMove = true;
                var jogWidth = $('#ptz-control_move-btn').width()/2;

                var moveAreaPos = $('#ptz-control_box').offset();
                var moveAreaWidth = $('#ptz-control_box').width();
                var moveAreaHeight = $('#ptz-control_box').height();
                var jogPos = $('#ptz-control_move-btn').offset();
                var jog_Left = jogPos.left + jogWidth;
                var jog_Top = jogPos.top + jogWidth;
                var xPos = e.pageX;
                var yPos = e.pageY;

                if (window.navigator.msPointerEnabled) {
                    if($(window).scrollLeft() != 0 && e.pageX == e.clientX){
                        xPos = xPos + $(window).scrollLeft();
                    }
                    if($(window).scrollTop() != 0 && e.pageY == e.clientY){
                        yPos = yPos + $(window).scrollTop();
                    }
                }
                if(xPos <= (moveAreaPos.left + jogWidth))
                    xPos = (moveAreaPos.left + jogWidth);
                else if(xPos >= (moveAreaWidth + moveAreaPos.left - jogWidth))
                    xPos = moveAreaWidth + moveAreaPos.left - jogWidth;

                if(yPos <= (moveAreaPos.top + jogWidth))
                    yPos = moveAreaPos.top + jogWidth;
                else if(yPos >= (moveAreaPos.top + moveAreaHeight - jogWidth))
                    yPos = moveAreaPos.top + moveAreaHeight - jogWidth;

                xPos = xPos- jog_Left;
                yPos = jog_Top - yPos;
                if (-4 <= xPos && xPos <= 4) xPos = 0;
                if (-2 <= yPos && yPos <= 2) yPos = 0;

                $('#ptz-control_move-btn').animate({
                    top: (moveAreaHeight/2-12)-yPos,
                    left: (moveAreaWidth/2-12)+xPos
                }, animateDuration, function() {
                    xPos *= PAN_RATIO;
                    yPos *= TILT_RATIO;

                    ptzJogMove(xPos, yPos);
                    if(isMove == true) {
                        clearTimeout(downTimer);
                        downTimer = setTimeout(function(){
                            $('#ptz-control_move-btn').trigger(e);
                        },animateDuration);
                    }
                });
                e.preventDefault();
            });
            $('#ptz-control_box,#ptz-control_move-btn').mouseup(function(e) {
                clearTimeout(downTimer);
                e.preventDefault();
                if(!isDrag && !isMove){
                }else{
                    isDrag = false;
                    isMove = false;
                    var moveAreaWidth = $('#ptz-control_box').width();
                    var moveAreaHeight = $('#ptz-control_box').height();
                    $('#ptz-control_move-btn').animate({
                        top: (moveAreaHeight/2-12),
                        left: (moveAreaWidth/2-12)
                    }, animateDuration, function(){
                        ptzStop();
                    });
                }
            });
            function ptzJogMove(xPos, yPos){
                sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control&Channel=0&NormalizedSpeed=True";
                sunapiURI += "&Pan=" + ptzLimitCheck(xPos);
                sunapiURI += "&Tilt=" + ptzLimitCheck(yPos);
                sunapiURI += "&Zoom=0";
                if(scope.showPTZControlFisheyeDPTZ === true)
                {
                    sunapiURI += "&SubViewIndex=" + scope.quadrant.select;
                }

                if(ptzJogTimer === null) {
                    makeJogTimer();
                }

                if(isJogUpdating === false) {
                	scope.isPtzControlStart = true;
                    execSunapi(sunapiURI);
                    isJogUpdating = true;
                }
            }

            $("#ptz-control_slider").slider({
                orientation: "vertical",
                min: -100,
                max: 100,
                value: 0,
                revert: true,
                slide: function(event, ui){
                    if(ptzJogTimer === null) {
                        makeJogTimer();
                    }

                    if(isJogUpdating === false) {
                        var sliderVal = ui.value;
                        sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control&Channel=0&NormalizedSpeed=True&Zoom=" + sliderVal;

                        if(scope.showPTZControlFisheyeDPTZ === true)
                        {
                            sunapiURI += "&SubViewIndex=" + scope.quadrant.select;
                        }

                        scope.isPtzControlStart = true;
                        execSunapi(sunapiURI);
                        isJogUpdating = true;
                    }

                },
                stop: function(){
                    $( "#ptz-control_slider" ).slider('value', 0);
                    ptzStop();
                }
            });

            $("#ptz-control_slider-horizontal-zoom").unbind();
            
            $("#ptz-control_slider-horizontal-zoom").slider({
                orientation: "horizontal",
                min: -100,
                max: 100,
                value: 0,
                revert: true,
                slide: function(event, ui){
                    if(ptzJogTimer === null) {
                        makeJogTimer();
                    }
                    
                    if(isJogUpdating === false) {
                        var sliderVal = ui.value;
                        sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control&Channel=0&NormalizedSpeed=True&Zoom=" + sliderVal;

                        scope.isPtzControlStart = true;
                        execSunapi(sunapiURI);
                        isJogUpdating = true;
                    }

                },
                stop: function(){
                    $( "#ptz-control_slider-horizontal-zoom" ).slider('value', 0);
                    ptzStop();
                }
            });
            
            
            
            
            $("#ptz-control_slider-horizontal-focus").unbind();
            
            $("#ptz-control_slider-horizontal-focus").slider({
                orientation: "horizontal",
                min: -100,
                max: 100,
                value: 0,
                revert: true,
                slide: function(event, ui){
                    if(ptzJogTimer === null) {
                        makeJogTimer();
                    }
                    
                    if(isJogUpdating === false) {
                        var sliderVal = ui.value;
                        if (sliderVal > 0)
                        {
                            scope.clickPtzFocus('Far');    
                        }
                        else if (sliderVal < 0)
                        {
                            scope.clickPtzFocus('Near');
                        }                        
                        isJogUpdating = true;
                    }

                },
                stop: function(){
                    $( "#ptz-control_slider-horizontal-focus" ).slider('value', 0);
                    ptzStop();
                }
            });
            function makeJogTimer() {
                ptzJogTimer = $interval(function() {
                    isJogUpdating = false;
                }, 100);
            }

            scope.clickPtzFocus = function(value){
                if(value=='Stop'){
                    ptzStop();
                }else if(value=='Auto'){
                    sunapiURI = "/stw-cgi/image.cgi?msubmenu=focus&action=control&Channel=0&Mode=AutoFocus";
                    scope.isPtzControlStart = true;
                    execSunapi(sunapiURI);
                }else{
                    sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control&Channel=0&Focus="+value;
                    scope.isPtzControlStart = true
                    execSunapi(sunapiURI);
                }
            };

            scope.clickDigitalAutoTracking = function(){
                if(UniversialManagerService.getDigitalPTZ() === CAMERA_STATUS.DPTZ_MODE.DIGITAL_PTZ)
                {
                    sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=digitalautotracking&action=control&Channel=0&Mode=Start";
                    execSunapi(sunapiURI);
                }else if(UniversialManagerService.getDigitalPTZ() === CAMERA_STATUS.DPTZ_MODE.DIGITAL_AUTO_TRACKING){
                    sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=digitalautotracking&action=control&Channel=0&Mode=Stop";
                    execSunapi(sunapiURI);
                }
            };

            scope.clickHomePosition = function(value) {
                var callback;
                if(value=='Set'){
                    sunapiURI = "/stw-cgi/ptzconfig.cgi?msubmenu=home&action=set";
                    callback = function(){
                        $uibModal.open({
                            templateUrl: 'views/setup/common/errorMessage.html',
                            controller: 'errorMessageCtrl',
                            size: 'sm',
                            resolve: {
                                Message: function ()
                                {
                                    return 'lang_apply';
                                },
                                Header: function ()
                                {
                                    return 'lang_success';
                                }
                            }
                        });
                    };
                }else{
                    sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=home&action=control&Channel=0";
                }
                execSunapi(sunapiURI,callback);
            };

		    scope.ptzControlZoom = function(value){
                if(value=='Stop'){
                    if (UniversialManagerService.getDigitalPTZ() !== CAMERA_STATUS.DPTZ_MODE.DIGITAL_AUTO_TRACKING) {
                        ptzStop();
                    }
                }else{
                    sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control&Channel=0&NormalizedSpeed=True&Zoom=" + value;
                    if(scope.showPTZControlFisheyeDPTZ === true)
                    {
                        sunapiURI += "&SubViewIndex=" + scope.quadrant.select;
                    }
                    scope.isPtzControlStart = true;
                    execSunapi(sunapiURI);
                }
		    };

            function ptzStop(){
                if (ptzJogTimer !== null) {
                    $interval.cancel(ptzJogTimer);
                    ptzJogTimer = null;
                }
                if(!scope.isPtzControlStart) return;
                sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=stop&action=control&Channel=0&OperationType=All";
                if(scope.showPTZControlFisheyeDPTZ === true)
                {
                    sunapiURI += "&SubViewIndex=" + scope.quadrant.select;
                }
                scope.isPtzControlStart = false;
                execSunapi(sunapiURI);
            }

            scope.showSetPreset = function(){
                execSunapi('/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=view',
                    function (response){
                        var mAttr = Attributes.get("attr");
                        var modalInstance = $uibModal.open({
                            templateUrl: 'views/setup/common/ptzPresetPopup.html',
                            controller: 'ptzPresetCtrl',
                            resolve: {
                                PresetData: function () {
                                    var presets = [];
                                    if(typeof response.PTZPresets !== 'undefined' && typeof response.PTZPresets[0].Presets !== 'undefined'){
                                        presets = response.PTZPresets[0].Presets;
                                    }
                                    return {
                                        'PTZPresets' : presets,
                                        'PTZPresetOptionsMaxValue' : mAttr.PTZPresetOptions.maxValue
                                    };
                                }
                            }
                        });
                        modalInstance.result.then(function(data){
                            if (data.PresetIdx && data.PresetName){
                                sunapiURI = "/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=add&Preset="+data.PresetIdx+"&Name="+data.PresetName;
                                execSunapi(sunapiURI, function(){
                                    scope.$emit('changePTZPreset',data.PresetIdx);
                                });
                            }
                        }, function(){});

                    });
		    };

            function execSunapi(uri, callback) {
                var getData = {};
                if (uri !== null) {
                    SunapiClient.get(uri, getData,
                        function (response) {
                            if (callback !== undefined) {
                                if (callback !== null) {
                                    callback(response.data);
                                }
                            }
                        },
                        function (errorData) {
                            if (callback !== undefined) {
                                if (callback !== null) {
                                    callback(errorData);
                                } else {
                                    console.log(errorData);
                                }
                            } else {
                                console.log(errorData);
                            }
                        }, '', true);
                }
            }
		}
	};
});