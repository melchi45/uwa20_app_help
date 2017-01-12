kindFramework.directive('liveMenuContent', function(
	$rootScope,
	$timeout,
	Attributes,
	SunapiClient,
	CameraService,
	AccountService
	){
	"use strict";
	return {
		restrict: 'E',
		replace: true,
		scope: false,
		templateUrl: 'views/livePlayback/directives/live-menu-content.html',
		link: function(scope, element, attrs){
			var mAttr = Attributes.get();
			var display = null;
			scope.showImageController = false;

			scope.resetDisplay = function(){
				var setData = {};
				setData.Reset = true;
        		return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imageenhancements&action=control', setData,
                function (response)
                {
                    initDisplay();
                },
                function (errorData)
                {
                    console.log(errorData);
                }, '', true);
			};

			function setDisplay(){
				var setData = {};

				$.each(display, function(i, self){
					setData[i] = self.value;
				});

				if(display['SharpnessLevel'].enable === false){
					delete setData['SharpnessLevel'];
					setData.SharpnessEnable = false;
				} else {
					setData.SharpnessEnable = true;
				}

		        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imageenhancements&action=set', setData,
	                function (response) {
						return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=set&ImagePreview=Start',
							function (response) {}, function (errorData) {}, '', true);
					}, function (errorData) {}, '', true);
			}

			function initDisplay(){
				return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imageenhancements&action=view', '', 
					function (response) {
						display = {
							Contrast: {
								min: mAttr.Contrast.minValue,
								max: mAttr.Contrast.maxValue,
								defValue: 50
							},
							Brightness: {
								min: mAttr.Brightness.minValue,
								max: mAttr.Brightness.maxValue,
								defValue: 50
							},
							SharpnessLevel: {
								min: mAttr.SharpnessLevel.minValue,
								max: mAttr.SharpnessLevel.maxValue,
								defValue: 12
							},
							Saturation: {
								min: mAttr.Saturation.minValue,
								max: mAttr.Saturation.maxValue,
								defValue: 50
							}
						};
					    var values = response.data.ImageEnhancements[0];
						$("#cm_display-slider li").each(function(i, self){
							var type = $(self).attr("data-type");
							display[type].value = values[type];
							var slider = $(self).find(".cm_slider div");

							$(self).find(".cm_min").html(display[type].min);
							$(self).find(".cm_max").html(display[type].max);
							$(self).find("input[type='number']")
								.attr("min", display[type].min)
								.attr("max", display[type].max)
								.val(display[type].value)
								.on("change keyup", function(e){
									slider.slider("value", $(this).val());
								});

							if(slider.slider("instance") === undefined){
								slider.slider({
							      	orientation: "horizontal",
							      	range: "min",
							        min: display[type].min,
							        max: display[type].max,
							        value: display[type].value,
							        step: 1,
							        change: function(event, ui){
							        	$(self).find("input[type='number']").val(ui.value);
							        	display[type].value = ui.value;
							        	setDisplay();
							        },
									create: function() {
									  $(".ui-slider-handle").unbind('keydown');
									}
						        });	
							} else {
								slider.slider("instance").options.value = display[type].value;
								slider.slider("instance")._refresh();
							}
						});
						$('#sharpness-enable')[0].checked = values['SharpnessEnable'];
						display['SharpnessLevel'].enable = values['SharpnessEnable'];
						if(display['SharpnessLevel'].enable === true){
							$('#sharpness-enable')
								.parent()
								.parent()
								.find(".cm_slider > div")
								.slider({
									disabled: false
								});
						} else {
							$('#sharpness-enable')
								.parent()
								.parent()
								.find(".cm_slider > div")
								.slider({
									disabled: true
								});
						}
						scope.showImageController = true;
					},
					function (errorData) {
					    console.log(errorData);
					    if(errorData == "Not Authorized"){
					    	scope.showImageController = false;
					    }
					}, '', true);
			}

			$("#sharpness-enable").change(function(){
				display['SharpnessLevel'].enable = $("#sharpness-enable")[0].checked;
				if($("#sharpness-enable")[0].checked === true){
					$(this)
						.parent()
						.parent()
						.find(".cm_slider > div")
						.slider({
							disabled: false
						});
				} else {
					$(this)
						.parent()
						.parent()
						.find(".cm_slider > div")
						.slider({
							disabled: true
						});
				}
				setDisplay();
			});

		    /*$timeout(function(){
		      document.getElementById('imageSetting').onclick = function(e) {
		        e = e || event;
		        var target = e.target || e.srcElement;
		        if (target.className != 'fa fa-minus-square' && target.className != 'fa fa-plus-square') return;

		        switch(target.className)
		        {
		          case 'fa fa-minus-square' :
		            var sliderElement = target.nextElementSibling.lastElementChild;
		            var ModelValue = sliderElement.getAttribute('rz-slider-model').split(".");
		            var level = scope[ModelValue[0]][ModelValue[1]];
		            var option = scope[sliderElement.getAttribute('rz-slider-options')];

		            var sVal = level - 1;
		            if (sVal >= option.floor && sVal <= option.ceil){
		                scope.$apply(function(){
		                  scope[ModelValue[0]][ModelValue[1]] = sVal;
		                });
		            }
		          break;
		          case 'fa fa-plus-square' :
		            var sliderElement = target.previousElementSibling.lastElementChild;
		            var ModelValue = sliderElement.getAttribute('rz-slider-model').split(".");
		            var level = scope[ModelValue[0]][ModelValue[1]];
		            var option = scope[sliderElement.getAttribute('rz-slider-options')];

		            var sVal = level + 1;
		            if (sVal >= option.floor && sVal <= option.ceil){
		                scope.$apply(function(){
		                  scope[ModelValue[0]][ModelValue[1]] = sVal;
		                });
		            }
		          break;
		        }
		        scope.imageenhancementsSet();
		      };
		    });*/

			function setTableSize(){
				var padding = 20;
				var allWidth = $(".cm_status-col")[0].clientWidth - (padding * 2);
				var size = {
					first: [
						18,
						20,
						20,
						15,
						27
					],
					second: [
						22,
						23,
						30,
						25
					]
				};

				for(var key in size){
					var table = $("#cm_status-" + key);
					table.css({width: allWidth + "px"});

					table.find("thead tr, tbody tr").each(function(trNum, tr){
						tr = $(tr);
						var cols = tr.find("th, td");
						cols.each(function(colNum, col){
							col = $(col);
							var width = (allWidth / 100) * size[key][colNum];
							if(colNum === cols.length-1){
								col.css({width: width + "px"});
							}else{
								col.css({minWidth: width + "px"});
							}
						});
					});
				}
			}

			$rootScope.$saveOn('liveMenuContent:setTableSize', setTableSize);

			window.addEventListener('resize', setTableSize);
			scope.$on("$destroy", function(){
				window.removeEventListener('resize', setTableSize);
			});

			function view(){
				initDisplay();
			}

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
		}
	};
});