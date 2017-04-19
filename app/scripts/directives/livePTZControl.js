"use strict";
kindFramework.directive('livePtzControl', ['CAMERA_STATUS', 'UniversialManagerService', 
	'SunapiClient', '$timeout', 'DigitalPTZContorlService', 'ModalManagerService', '$translate',
	'$interval','Attributes', 'COMMONUtils', 'PTZContorlService', '$rootScope',
	function(CAMERA_STATUS, UniversialManagerService, SunapiClient, $timeout, DigitalPTZContorlService,
		ModalManagerService, $translate, $interval, Attributes, COMMONUtils, PTZContorlService, $rootScope) {
		return {
			restrict: 'E',
			scope: false,
			replace: true,
			templateUrl: 'views/livePlayback/directives/live-ptz-control.html',
			link: function(scope, element, attrs){
                var mAttr = Attributes.get();
                scope.modePTZ =  {
                    AreaZoom : false,
					Home: false,
                    AutoTracking: false,
					DigitalAutoTracking : false
				};

                scope.show = {
                    DigitalAutoTracking : false,
				};

				scope.dptzMode = CAMERA_STATUS.DPTZ_MODE;
				scope.ptzType = CAMERA_STATUS.PTZ_MODE;
				scope.ptzMode = "external";	//external or dptz or zoomonly
				scope.showLivePtzControl = true;
				scope.showZoomOnlyControl = false;
				scope.presetAddForm = {
					show: false,
					set: function(value) {
						this.show = value;
					},
					apply: function(value){
                        if(scope.addPresetting.SelectedName === null || scope.addPresetting.SelectedName === undefined || scope.addPresetting.SelectedName === "")
                        {
                            ModalManagerService.open('message', { 'buttonCount': 1, 'message': $translate.instant('lang_msg_validPresetName') } );
                        }
                        else
                        {
                            scope.ptzPreset("Add");
                            this.show = false;
                            $("#live-ptz-tabs").removeClass('cm-display-none');
                        }
					},
					cancel: function () {
						this.show = false;
						$("#live-ptz-tabs").removeClass('cm-display-none');
					},
					waitTab : function () {
						if( $("#live-ptz-tabs").length ) scope.setTabs();
						else {
							setTimeout(function () {
								scope.presetAddForm.waitTab();
							},1);
						}
					}
				};
				scope.selectedObj = {
					presetObj : null,
					groupObj : null,
					swingObj : null
				};

				var isDrag = false,
				isMove = false,
				animateDuration = 50,
				PAN_RATIO = 1.495,
				TILT_RATIO = 1.495,
				downTimer = null,
				sunapiURI = "",
				ptzJogTimer = null,
				isJogUpdating = false,
				isPtzControlStart = false;

				scope.openPTZ = function() {
					init();
					scope.currentPtzType = UniversialManagerService.getIsPtzType();
					scope.modePTZ.DigitalAutoTracking = (UniversialManagerService.getDigitalPTZ() === scope.dptzMode.DIGITAL_AUTO_TRACKING) ? true : false;

					console.log("livePTZControl::open currentPtzType = " + scope.currentPtzType);

					switch (scope.currentPtzType) {
						case CAMERA_STATUS.PTZ_MODE.DIGITAL:
							scope.ptzMode = "dptz";
							getSettingPresetList();
							getSettingGroupList();
							break;
						case CAMERA_STATUS.PTZ_MODE.EXTERNAL:
						case CAMERA_STATUS.PTZ_MODE.EXTERNAL_DIGITAL:
							scope.ptzMode = "external";
							getSettingPresetList();
							break;
						case CAMERA_STATUS.PTZ_MODE.OPTICAL:
                            getSettingPresetList();
                            getSettingGroupList();
                            getAutoTrackingStatus();
                            $rootScope.$emit('channelPlayer:command', 'manualTracking', true);
							break;
						case CAMERA_STATUS.PTZ_MODE.ZOOMONLY:
							scope.ptzMode = "zoomonly";
							getSettingPresetList();
							scope.showLivePtzControl = false;
							scope.showZoomOnlyControl = true;
							break;
					}

					console.log("scope.ptzMode = " + scope.ptzMode);
				};

				scope.ptzZoom = function(value) {

					if (ptzJogTimer === null) {
						makeJogTimer();
					}

					if (value === 'stop') {
						if (UniversialManagerService.getDigitalPTZ() !== scope.dptzMode.DIGITAL_AUTO_TRACKING) {
							ptzStop();
						}
					} else {
						if (isJogUpdating === false) {
							sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control&Channel=0&NormalizedSpeed=True";
							sunapiURI += (value === 'in' ? "&Zoom=50" : "&Zoom=-50");
                            isPtzControlStart = true;
							execSunapi(sunapiURI);
							isJogUpdating = true;
						}
					}
				};

                $rootScope.$saveOn("livePTZControl:command", function(event, mode, boolEnable) {
                    switch (mode)
                    {
                        case "pixelCount" :
                            $timeout(function () {
                                // Turn Off AreaZoom
                            	scope.modePTZ.AreaZoom = false;
                                scope.$digest();
                            });
                            break;
                        case "manualTracking" :
                            $timeout(function () {
                                // Turn Off AutoTracking
                                scope.modePTZ.AutoTracking = false;
                                scope.$digest();
                            });
                            break;
                        case "areaZoomMode":
                            break;
                    }
                }, scope);

				scope.autoTracking = function() {
					if(scope.modePTZ.AreaZoom)
					{
                        //Disable Area Zoom
                        scope.modePTZ.AreaZoom = false;
                        $rootScope.$emit('channelPlayer:command', 'areaZoomMode', false);
					}

                    sunapiURI = '/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=set&Channel=0&Enable=';
                    sunapiURI += (scope.modePTZ.AutoTracking === false) ? "True" : "False";

					execSunapi(sunapiURI);
				};

				scope.digitalAutoTracking = function() {
                    if(scope.modePTZ.AreaZoom)
                    {
                        //Disable Area Zoom
                        scope.modePTZ.AreaZoom = false;
                        $rootScope.$emit('channelPlayer:command', 'areaZoomMode', false);
                    }

                    sunapiURI = '/stw-cgi/ptzcontrol.cgi?msubmenu=digitalautotracking&action=control&Mode=';
                    sunapiURI += (scope.modePTZ.DigitalAutoTracking === false) ? "Start" : "Stop";

                    execSunapi(sunapiURI);
				};

				scope.modeChange = function(value) {
					scope.ptzMode = value;
					sunapiURI = '/stw-cgi/ptzconfig.cgi?msubmenu=ptzmode&action=set&Mode=';
					sunapiURI += (scope.ptzMode === "external" ? "ExternalPTZ" : "DigitalPTZ");

					execSunapi(sunapiURI);

					init();
				};

				scope.ptzFocus = function(value){
					if(value === 'Stop'){
						ptzStop();
					}else if(value === 'Auto'){
						sunapiURI = "/stw-cgi/image.cgi?msubmenu=focus&action=control&Channel=0&Mode=AutoFocus";
						execSunapi(sunapiURI);
					}else{
						sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control&Channel=0&Focus="+value;
						isPtzControlStart = true;
						execSunapi(sunapiURI);
					}
				};

				scope.ptzPreset = function(value){
					try {
						if(value === 'Home'){
							sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=home&action=control";
							execSunapi(sunapiURI);
						}else if(value === 'Go'){
							run('preset',  scope.selectedObj.presetObj.value, 'Start');
						}else if(value === 'Set') {
							$("#live-ptz-tabs").addClass('cm-display-none');
							scope.presetAddForm.show = true;
						}else if(value === 'Add') {
                            sunapiURI = "/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=add&Preset="+scope.addPresetting.SelectedNumber+"&Name="+scope.addPresetting.SelectedName;
                            execSunapi(sunapiURI, function(){
                                run('preset', scope.addPresetting.SelectedNumber, 'Start');
                                getSettingPresetList();
                            });
						}else{
							throw "Wrong Argument";
						}
					} catch (error)
					{
						console.error(error.message);
					}
				};

				scope.ptzGroup = function(value){
					try {
						if(value === 'Stop'){
							run('group', scope.selectedObj.groupObj.value, 'Stop');
						}else if(value === 'Go'){
							run('group',  scope.selectedObj.groupObj.value, 'Start');
						}else {
							throw "Wrong Argument";
						}
					} catch (error)
					{
						console.error(error.message);
					}
				};

				scope.ptzTrace = function(value){
					try {
						if(value === 'Stop'){
							sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=trace&action=control&Channel=0&Mode=Stop&Trace=" + (scope.Trace.SelectedIndex + 1);
							execSunapi(sunapiURI);
						}else if(value === 'Go'){
							sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=trace&action=control&Channel=0&Mode=Start&Trace=" + (scope.Trace.SelectedIndex + 1);
							execSunapi(sunapiURI);
						}else {
							throw "Wrong Argument";
						}
					} catch (error)
					{
						console.error(error.message);
					}
				};

				scope.ptzTour = function(value){
					try {
						if(value === 'Stop'){
							sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=tour&action=control&Channel=0&Tour=1&Mode=Stop";
							execSunapi(sunapiURI);
						}else if(value === 'Go'){
							sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=tour&action=control&Channel=0&Tour=1&Mode=Start";
							execSunapi(sunapiURI);
						}else {
							throw "Wrong Argument";
						}
					} catch (error)
					{
						console.error(error.message);
					}
				};

				scope.ptzSwing = function(value){
					try {
						if(value === 'Stop'){
							sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=swing&action=control&Channel=0&Mode=Stop";
							execSunapi(sunapiURI);
						}else if(value === 'Go'){
							sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=swing&action=control&Channel=0&Mode=" + scope.selectedObj.swingObj;
							execSunapi(sunapiURI);
						}else {
							throw "Wrong Argument";
						}
					} catch (error)
					{
						console.error(error.message);
					}
				};

				scope.areaZoomMode = function () {
					try {
						//Turn Off Auto Tracking
						if(scope.modePTZ.AutoTracking)
						{
                            scope.autoTracking();
						}

						if(scope.modePTZ.AreaZoom)
						{
							scope.modePTZ.AreaZoom = false;
							$rootScope.$emit('channelPlayer:command', 'areaZoomMode', false);
							$rootScope.$emit('liveIconList:command', "areaZoomMode", false);
						}
						else
						{
							scope.modePTZ.AreaZoom = true;
							$rootScope.$emit('channelPlayer:command', 'areaZoomMode', true);
							$rootScope.$emit('liveIconList:command', "areaZoomMode", true);
						}
					}catch(e)
					{
						console.log(e.message);
					}
				};

				scope.areaZoomAction = function (value) {
					if(scope.modePTZ.AreaZoom)
					{
						try {
							if(value !== '1X' && value !== 'Prev' && value !== 'Next')
							{
								throw new Error(300, "Argument Error");
							}

							$rootScope.$emit('channelPlayer:command', 'areaZoomAction', value);

						} catch(e)
						{
							console.log(e.message);
						}
					}
				};

				var presetListCallback = function(result) {
					if (result.PTZPresets === undefined) {
						//ModalManagerService.open('message', { 'buttonCount': 1, 'message': "lang_NoListFound" } );
					} else {
						scope.presetList = [];
						var presetFunc = function(value) { run('preset', value); };
						for(var index = 0 ; index < result.PTZPresets[0].Presets.length; index++ ) {
							scope.presetList[index] = {
								'name':result.PTZPresets[0].Presets[index].Name,
								'action': presetFunc,
								'value':result.PTZPresets[0].Presets[index].Preset
							};
						}
						scope.selectedObj.presetObj = scope.presetList[0];
						scope.$apply();
					}

					if(mAttr.PresetSupport)
					{
						//Init Preset Add Menu List

						scope.addPresetting = {};
						scope.addPresetting.PresetList = new Array(mAttr.MaxPreset);
						for(var i=0; i<mAttr.MaxPreset; i++)
						{
							scope.addPresetting.PresetList[i] =  {
								'Number' : i+1,
								'Name' : ''
							};
						}

						scope.presetList.forEach(function(PresetObj){
							scope.addPresetting.PresetList[PresetObj.value-1].Number = PresetObj.value;
							scope.addPresetting.PresetList[PresetObj.value-1].Name = PresetObj.name;
						});

						//Select first smpty preset
						for(var j=0; j<scope.addPresetting.PresetList.length; j++)
						{
                            if(scope.addPresetting.PresetList[j].Name === '')
							{
                                scope.addPresetting.SelectedName = scope.addPresetting.PresetList[j].Name;
                                scope.addPresetting.SelectedNumber = scope.addPresetting.PresetList[j].Number;
                                break;
							}
						}
					}
				};

				var groupListCallback = function(result) {
				  if(result.PTZGroups === undefined) {
					//ModalManagerService.open('message', { 'buttonCount': 1, 'message': "lang_NoListFound" } );
				  } else {
					var groups = result.PTZGroups[0].Groups;
					scope.groupList = [];
					var groupPrefix = $translate.instant('lang_group');
					var groupStartFunc = function(value) { run('group', value, 'Start'); };
					var groupStopFunc = function(value) { run('group', value, 'Stop'); };
					for(var i = 0; i < groups.length; i++) {
					  scope.groupList.push({
						'name':groupPrefix + ' ' + groups[i].Group,
									'startaction': groupStartFunc,
									'stopaction': groupStopFunc,
									'value':groups[i].Group,
					  });
					}
					scope.selectedObj.groupObj = scope.groupList[0];
								scope.$apply();
				  }
				};

				function getAttributes(){
                    if (mAttr.TraceSupport)
                    {
                        scope.TraceOptions = COMMONUtils.getArrayWithMinMax(1, mAttr.MaxTraceCount);
                        scope.Trace = {};
                        scope.Trace.SelectedIndex = 0;
                    }

                    if (mAttr.SwingSupport)
                    {
                        if (mAttr.SwingModes !== undefined)
                        {
                            scope.SwingModes = mAttr.SwingModes;
                            scope.selectedObj.swingObj = scope.SwingModes[0];
                        }
                    }

                    if(mAttr.PresetSupport)
                    {
                        //Preset Name Strict Condition
                        //Length Condition
                        //Alphabet or Number are only availabe
                        scope.AlphaNumericStr = mAttr.AlphaNumericStr;
                        scope.PresetNameMaxLen = ((mAttr.PresetNameMaxLen && mAttr.PresetNameMaxLen.maxLength)?mAttr.PresetNameMaxLen.maxLength:"12");
                    }

                    if(mAttr.HomeSupport)
					{
                        scope.modePTZ.Home = mAttr.HomeSupport;
					}

                    scope.show.DigitalAutoTracking = mAttr.isDigitalPTZ;
                    scope.show.AutoTracking = mAttr.PTZModel;
				}

				/*ZOOM*/
				$("#cm-ptz-zoom-slider").slider({
					min: -100,
					max: 100,
					value: 0,
					revert: true,
					orientation: "vertical",
					slide: function(event, ui){
					  sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control&Channel=0&NormalizedSpeed=True&Zoom=" + ui.value;
					  isPtzControlStart = true;
					  execSunapi(sunapiURI);
					},
					stop: function(){
					  $( "#cm-ptz-zoom-slider" ).slider('value', 0);
					  ptzStop();
					}
				});
				/*ZOOM*/

				$("#cm-ptz-control-move-btn").draggable({
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
							var moveAreaWidth = $('#cm-ptz-control-box').width();
							var moveAreaHeight = $('#cm-ptz-control-box').height();
							$('#cm-ptz-control-move-btn').animate({
								top: (moveAreaHeight/2-12),
								left: (moveAreaWidth/2-12)
							}, animateDuration, function(){
								ptzStop();
							});
						}
					}
				});

				$("#cm-ptz-control-box").mousedown(function(e){
					if(isDrag || isMove || e.which !== 1)
						return;

					isMove = true;
					var jogWidth = $('#cm-ptz-control-move-btn').width()/2;

					var moveAreaPos = $('#cm-ptz-control-box').offset();
					var moveAreaWidth = $('#cm-ptz-control-box').width();
					var moveAreaHeight = $('#cm-ptz-control-box').height();
					var jogPos = $('#cm-ptz-control-move-btn').offset();
					var jog_Left = jogPos.left + jogWidth;
					var jog_Top = jogPos.top + jogWidth;
					var xPos = e.pageX;
					var yPos = e.pageY;

					if (window.navigator.msPointerEnabled) {
						if($(window).scrollLeft() !== 0 && e.pageX === e.clientX){
							xPos = xPos + $(window).scrollLeft();
						}
						if($(window).scrollTop() !== 0 && e.pageY === e.clientY){
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

					$('#cm-ptz-control-move-btn').animate({
						top: (moveAreaHeight/2-12)-yPos,
						left: (moveAreaWidth/2-12)+xPos
					}, animateDuration, function() {
						xPos *= PAN_RATIO;
						yPos *= TILT_RATIO;

						ptzJogMove(xPos, yPos);
						if(isMove === true) {
							clearTimeout(downTimer);
							downTimer = setTimeout(function(){
								$('#cm-ptz-control-move-btn').trigger(e);
							},animateDuration);
						}
					});
					e.preventDefault();
				});

				$('#cm-ptz-control-box,#cm-ptz-control-move-btn').mouseup(
					function(e) {
					clearTimeout(downTimer);
					e.preventDefault();
					if(!isDrag && !isMove){
					}else{
						isDrag = false;
						isMove = false;
						var moveAreaWidth = $('#cm-ptz-control-box').width();
						var moveAreaHeight = $('#cm-ptz-control-box').height();
						$('#cm-ptz-control-move-btn').animate({
							top: (moveAreaHeight/2-12),
							left: (moveAreaWidth/2-12)
						}, animateDuration, function(){
							ptzStop();
						});
					}
				});

				function init() {
					scope.presetList = [];
					scope.groupList = [];
					scope.setTabs();
				}

				scope.setTabs = function(){
					console.log($("#live-ptz-tabs").length);
					if( $("#live-ptz-tabs").length ){
						console.log('use tabs');
						$("#live-ptz-tabs").tabs();
						var tabCount = $("#live-ptz-tabs .ui-widget-header li").length;
						if(tabCount < 5){
							$("#live-ptz-tabs .ui-widget-header li").css("width", (100 / tabCount) + "%");
						}
					}
				}

				function getSettingPresetList() {
					DigitalPTZContorlService.getSettingList(presetListCallback, 'preset');
				}

				function getSettingGroupList() {
					DigitalPTZContorlService.getSettingList(groupListCallback, 'group');
				}

				function getAutoTrackingStatus(){
                    sunapiURI = "/stw-cgi/eventsources.cgi?msubmenu=autotracking&action=view";
                    execSunapi(sunapiURI, function(response){
                        scope.modePTZ.AutoTracking = response.AutoTracking[0].Enable;
					});
				}

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
						execSunapi(sunapiURI);
					}
				};
                
				scope.clickPtzFocus = function(value){
					if(value=='Stop'){
						ptzStop();
					}else if(value=='Auto'){
						sunapiURI = "/stw-cgi/image.cgi?msubmenu=focus&action=control&Channel=0&Mode=AutoFocus";
						execSunapi(sunapiURI);
					}else{
						sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control&Channel=0&Focus="+value;
						execSunapi(sunapiURI);
					}
				};
                
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
							isPtzControlStart = true;
							execSunapi(sunapiURI);
							isJogUpdating = true;
						}

					},
					stop: function(){
						$( "#ptz-control_slider-horizontal-zoom" ).slider('value', 0);
						ptzStop();
					}
				});

				function makeJogTimer() {
					ptzJogTimer = $interval(function() {
						isJogUpdating = false;
					}, 100);					
				}

				function ptzLimitCheck(data) {
					if (data > 100) { data = 100; }
					else if (data < -100) { data = -100; }

					return data;
				}

				function ptzJogMove(xPos, yPos){
					sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=continuous&action=control&Channel=0&NormalizedSpeed=True";
					sunapiURI += "&Pan=" + ptzLimitCheck(xPos);
					sunapiURI += "&Tilt=" + ptzLimitCheck(yPos);
					sunapiURI += "&Zoom=0";

					if (ptzJogTimer === null) {
						makeJogTimer();
					}

					if (isJogUpdating === false) {
						isPtzControlStart = true;
						execSunapi(sunapiURI);
						isJogUpdating = true;
					}
				}

				function ptzStop(){
					if (ptzJogTimer !== null) {
						$interval.cancel(ptzJogTimer);
						ptzJogTimer = null;
					}
					if(!isPtzControlStart) return;
					sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=stop&action=control&Channel=0&OperationType=All";
					isPtzControlStart = false;
					execSunapi(sunapiURI);
				}

				function run(mode, value, option) {
					sunapiURI = "/stw-cgi/ptzcontrol.cgi?msubmenu=";
					switch (mode) {
						case "preset":
                            sunapiURI += "preset&action=control&Channel=0&Preset=" + value;
							break;
						case "group":
							sunapiURI += "group&action=control&Channel=0&Group=" + value +"&Mode=" + option;
							break;
						default:
							break;
					}

					execSunapi(sunapiURI);
				}

				function execSunapi(uri, callback) {
					var getData = {};
					if (uri !== null) {
						return SunapiClient.get(uri, getData,
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

                $rootScope.$saveOn('AutoTrackingStatus', function(event, obj) {
                    switch(obj.type) {
                        case "AutoTracking":
                            if (obj.value === 'false')
                            {
                                if(scope.modePTZ.AutoTracking === true)
                                {
                                    // Turn Off AutoTracking
                                    scope.modePTZ.AutoTracking = false;
                                }
                            }
                            else
							{
								//Turn Off AreaZoom
                                if(scope.modePTZ.AreaZoom)
                                {
                                    //Disable Area Zoom
                                    scope.modePTZ.AreaZoom = false;
                                    $rootScope.$emit('channelPlayer:command', 'areaZoomMode', false);
                                }

                                if(scope.modePTZ.AutoTracking === false)
                                {
                                    // Turn Off AutoTracking
                                    scope.modePTZ.AutoTracking = true;
                                }
							}
                            break;
                    }
                }, scope);

                $rootScope.$saveOn('DigitalAutoTrackingStatus', function(event, obj) {
                    switch(obj.type) {
                        case "DigitalAutoTracking":
                            if (obj.value === 'false')
                            {
                                if(scope.modePTZ.DigitalAutoTracking === true)
                                {
                                    // Turn Off AutoTracking
                                    scope.modePTZ.DigitalAutoTracking = false;
                                    UniversialManagerService.setDigitalPTZ(CAMERA_STATUS.DPTZ_MODE.DIGITAL_PTZ);
                                }
                            }
                            else
                            {
                                if(scope.modePTZ.DigitalAutoTracking === false)
                                {
                                    // Turn Off AutoTracking
                                    scope.modePTZ.DigitalAutoTracking = true;
                                    UniversialManagerService.setDigitalPTZ(CAMERA_STATUS.DPTZ_MODE.DIGITAL_AUTO_TRACKING);
                                }
                            }
                            break;
                    }
                }, scope);

                (function wait() {
                    if (!mAttr.Ready) {
                        $timeout(function () {
                            mAttr = Attributes.get();
                            wait();
                        }, 500);
                    } else {
                        getAttributes();
                    }
                })();
			}
		};
	}]);