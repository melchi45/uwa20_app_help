kindFramework.directive('liveMenuContent', function(
  $rootScope,
  $timeout,
  Attributes,
  SunapiClient,
  CameraService,
  AccountService,
	CAMERA_STATUS,
	BrowserService,
  UniversialManagerService,
  PluginControlService,
  kindStreamInterface
) {
  "use strict";
  return {
    restrict: 'E',
    replace: true,
    scope: false,
    templateUrl: 'views/livePlayback/directives/live-menu-content.html',
    link: function(scope, element, attrs) {
      var mAttr = Attributes.get();
      var display = null;
      scope.showImageController = false;
      var isMultiChannel = false;
      var ATTRIBUTE_REQUEST_TIMEOUT = 500;
      if (mAttr.MaxChannel > 1) {
        isMultiChannel = true;
      }

      scope.resetDisplay = function() {
        var setData = {};
        setData.Reset = true;
        if (isMultiChannel) {
          setData.Channel = UniversialManagerService.getChannelId();
        }
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imageenhancements&action=control', setData,
          function(response) {
            initDisplay();
          },
          function(errorData) {
            console.log(errorData);
          }, '', true);
      };

      function setDisplay() {
        var setData = {};

        $.each(display, function(ii, self) {
          setData[ii] = self.value;
        });

        if (display.SharpnessLevel.enable === false) {
          delete setData.SharpnessLevel;
          setData.SharpnessEnable = false;
        } else {
          setData.SharpnessEnable = true;
        }

        if (isMultiChannel) {
          setData.Channel = UniversialManagerService.getChannelId();
        }

        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imageenhancements&action=set', setData,
          function(response) {
            var setData = {};
            if (isMultiChannel) {
              setData.Channel = UniversialManagerService.getChannelId();
            }
            return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=camera&action=set&ImagePreview=Start', setData,
              function(response) {},
              function(errorData) {}, '', true);
          },
          function(errorData) {}, '', true);
      }

      function initDisplay() {
        var setData = {};
        if (isMultiChannel) {
          setData.Channel = UniversialManagerService.getChannelId();
        }
        return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=imageenhancements&action=view', setData,
          function(response) {
            display = {
              Contrast: {
                min: mAttr.Contrast.minValue,
                max: mAttr.Contrast.maxValue,
                defValue: 50,
              },
              Brightness: {
                min: mAttr.Brightness.minValue,
                max: mAttr.Brightness.maxValue,
                defValue: 50,
              },
              SharpnessLevel: {
                min: mAttr.SharpnessLevel.minValue,
                max: mAttr.SharpnessLevel.maxValue,
                defValue: 12,
              },
              Saturation: {
                min: mAttr.Saturation.minValue,
                max: mAttr.Saturation.maxValue,
                defValue: 50,
              },
            };
            var values = response.data.ImageEnhancements[0];
            $("#cm-display-slider li").each(function(ii, self) {
              var type = $(self).attr("data-type");
              display[type].value = values[type];
              var slider = $(self).find(".cm-slider div");

              $(self).find(".cm-min").html(display[type].min);
              $(self).find(".cm-max").html(display[type].max);
              $(self).find("input[type='number']").
                attr("min", display[type].min).
                attr("max", display[type].max).
                val(display[type].value).
                on("change keyup", function(error) {
                  slider.slider("value", $(this).val());
                });

              if (typeof slider.slider("instance") === 'undefined') {
                slider.slider({
                  orientation: "horizontal",
                  range: "min",
                  min: display[type].min,
                  max: display[type].max,
                  value: display[type].value,
                  step: 1,
                  change: function(event, ui) {
                    $(self).find("input[type='number']").val(ui.value);
                    display[type].value = ui.value;
                    setDisplay();
                  },
                  create: function() {
                    $(".ui-slider-handle").unbind('keydown');
                  },
                });
              } else {
                slider.slider("instance").options.value = display[type].value;
                slider.slider("instance")._refresh();
              }
            });
            $('#sharpness-enable')[0].checked = values.SharpnessEnable;
            display.SharpnessLevel.enable = values.SharpnessEnable;
            if (display.SharpnessLevel.enable === true) {
              $('#sharpness-enable').
                parent().
                parent().
                find(".cm-slider > div").
                slider({
                  disabled: false,
                }).
                parent().
                parent().
                find("input[type='number']").
                removeClass("cm-opacity").
                prop("disabled", false);
            } else {
              $('#sharpness-enable').
                parent().
                parent().
                find(".cm-slider > div").
                slider({
                  disabled: true,
                }).
                parent().
                parent().
                find("input[type='number']").
                addClass("cm-opacity").
                prop("disabled", true);
            }
            scope.showImageController = true;
          },
          function(errorData) {
            console.log(errorData);
            if (errorData === "Not Authorized") {
              scope.showImageController = false;
            }
          }, '', true);
      }

      $("#sharpness-enable").change(function() {
        display.SharpnessLevel.enable = $("#sharpness-enable")[0].checked;
        if ($("#sharpness-enable")[0].checked === true) {
          $(this).
            parent().
            parent().
            find(".cm-slider > div").
            slider({
              disabled: false,
            }).
            parent().
            parent().
            find("input[type='number']").
            removeClass("cm-opacity").
            prop("disabled", false);
        } else {
          $(this).
            parent().
            parent().
            find(".cm-slider > div").
            slider({
              disabled: true,
            }).
            parent().
            parent().
            find("input[type='number']").
            addClass("cm-opacity").
            prop("disabled", true);
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

      function setTableSize() {
        /*
        var padding = 20;
        var allWidth = $(".live-status-col")[0].clientWidth - (padding * 2);
        var size = {
          first: [
            18,
            20,
            20,
            15,
            27,
          ],
          second: [
            22,
            23,
            30,
            25,
          ],
        };

        for(var key in size){
        	var table = $("#cm-status-" + key);
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
        */
      }

      $rootScope.$saveOn('liveMenuContent:setTableSize', setTableSize);

      $rootScope.$saveOn("channelSelector:selectChannel", function(event, data) {
        UniversialManagerService.setChannelId(data);
        view();
      }, scope);

      window.addEventListener('resize', setTableSize);
      scope.$on("$destroy", function() {
        window.removeEventListener('resize', setTableSize);
      });

      function view() {
        if (mAttr.MaxChannel > 1) {
          isMultiChannel = true;
        }
        initDisplay();
        getFisheyeMode();
        scope.pluginStatus.initQuality();
      }

      (function wait() {
        if (!mAttr.Ready) {
          $timeout(function() {
            mAttr = Attributes.get();
            wait();
          }, ATTRIBUTE_REQUEST_TIMEOUT);
        } else {
          view();
        }
      })();

			scope.changeFisheyeMode = function(elem){
				var self = $(elem.currentTarget);
				var type = self.attr("data-mode");

				$("#cm-fisheye-mode button").removeClass("active");
				self.addClass("active");
        kindStreamInterface.setCanvasStyle(scope.viewMode, scope.channelSetFunctions.show);
        var position = scope.fisheyeMode === scope.fisheyeModeList[0]? 2 : 1;
				PluginControlService.changeViewMode(position, modeNum);
			};
      
			function getFisheyeMode() {
				var getData = {};
				return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=fisheyesetup&action=view', getData,
					function (response) {
						scope.fisheyeModeList = mAttr.CameraPosition;
						scope.fisheyeMode = response.data.Viewmodes[0].CameraPosition;
					},
					function (errorData) {
						console.log(errorData);
					}, '', true);
			}
    },
  };
});