'use strict';
kindFramework
  .directive('liveSlider', ['Attributes', '$timeout',
    function(Attributes, $timeout) {
      return {
        restrict: 'E',
        scope: {
          liveSliderProperty: '=',
          liveSliderModel: '='
        },
        templateUrl: './views/setup/common/liveSlider.html',
        link: function(scope, elem, attrs) {
          var mAttr = Attributes.get();
          var slider = elem.find(".cm-slider div");
          var checkLoad = false;
          var checkModel = false;
          var checkProperty = false;
          var inputOnChange = false;
          var isFloat = false;
          var OnlyNumberRegExp = /^[0-9]+$/;

          scope.levelPattern = mAttr.OnlyNumStr;

          function changePatternToFloat(maxlength) {
            isFloat = true;
            scope.levelPattern = "^$|^[0-9]{1}$|^[0-9]{1}[.]{1}[0-9]{0,1}$|^[1-9]{1}[0-9]{0," + String(maxlength - 1) + "}[.]{1}[0-9]{0,1}$|^[1-9]{1}[0-9]{0," + String(maxlength - 1) + "}$";
            OnlyNumberRegExp = /^[0-9.]*$/;
          }

          function changePatternToInt() {
            isFloat = false;
            scope.levelPattern = mAttr.OnlyNumStr;
            OnlyNumberRegExp = /^[0-9]+$/;
          }

          function validatedValue(_value) {
            if (_value === undefined || _value === "") {
              return Number(scope.liveSliderProperty.floor);
            }

            if (OnlyNumberRegExp.test(_value) === false) {
              return Number(scope.liveSliderProperty.floor);
            }

            if (isFloat === true) {
              if (typeof _value !== "number") {
                _value = parseFloat(_value);
              }

              /**
               * Javascript 이슈로
               * 소수점이 4.3999999999999995 또는 4.1000000000000005
               * 이런 방식으로 나오는 것을 방지
               */
              var tmpValue = _value.toFixed(3);
              _value = parseFloat(tmpValue.substr(0, (tmpValue.indexOf('.') + 2)));
            }

            if (_value < scope.liveSliderProperty.floor) {
              return Number(scope.liveSliderProperty.floor);
            }

            if (_value > scope.liveSliderProperty.ceil) {
              return Number(scope.liveSliderProperty.ceil);
            }

            return Number(_value);
          }


          function updateSliderModel(_value, applySkip) {
            if (applySkip) {
              scope.liveSliderModel[scope.modelName] = _value;
            } else {
              scope.$apply(function() {
                scope.liveSliderModel[scope.modelName] = _value;
              });
            }
          }

          function updateInputBox(_value) {
            elem.find("input[type='text']").val(_value);
          }

          function updateSliderUI(_value) {
            slider.slider("value", _value);
          }

          function revokeUpdateCallback(_value) {
            //It's for liveChart Threshold
            if (scope.liveSliderModel.updateCallback) {
              scope.liveSliderModel.updateCallback(_value);
            }
          }

          function revokeOnEnd() {
            if (scope.liveSliderProperty.onEnd) {
              scope.liveSliderProperty.onEnd();
            }
          }

          scope.InputBox_onBlurEventHandler = function() {
            if (scope.liveSliderProperty.disabled) return;

            var SliderValue = validatedValue(elem.find("input[type='text']").val());
            updateSliderUI(SliderValue);
            revokeUpdateCallback(SliderValue);
            revokeOnEnd();
            updateInputBox(SliderValue);

            if (SliderValue !== scope.liveSliderModel[scope.modelName]) {
              scope.liveSliderModel[scope.modelName] = SliderValue;
            }
          };

          scope.InputBox_onChangeEventHandler = function() {
            if (scope.liveSliderProperty.disabled) return;

            var SliderValue = validatedValue(elem.find("input[type='text']").val());
            inputOnChange = true;

            if (scope.liveSliderModel[scope.modelName] === SliderValue) {
              updateSliderUI(SliderValue);
              revokeUpdateCallback(SliderValue);
              revokeOnEnd();
            } else {
              updateSliderModel(SliderValue, true);
            }
          };

          function init() {
            if (!(checkModel && checkProperty)) return;
            checkLoad = true;

            // Slider UI 초기화
            if (slider.slider("instance") === undefined) {
              slider.slider({
                orientation: scope.liveSliderProperty.vertical ? "vertical" : "horizontal",
                range: "min",
                min: (('floor' in scope.liveSliderProperty) ? scope.liveSliderProperty.floor : 0),
                max: (('ceil' in scope.liveSliderProperty) ? scope.liveSliderProperty.ceil : 100),
                value: scope.liveSliderModel[scope.modelName],
                step: (('step' in scope.liveSliderProperty) ? scope.liveSliderProperty.step : 1),
                disabled: (('disabled' in scope.liveSliderProperty) ? scope.liveSliderProperty.disabled : false),
                slide: function(event, ui) {
                  if (scope.liveSliderProperty.disabled) return;
                  updateSliderModel(ui.value);
                  updateInputBox(ui.value);
                }
              });

              if (scope.liveSliderProperty.step > 0 && scope.liveSliderProperty.step < 1) {
                changePatternToFloat(String(scope.liveSliderProperty.ceil).length);
              } else {
                changePatternToInt();
              }


            } else {
              slider.slider("instance").options.value = scope.liveSliderModel[scope.modelName];
              slider.slider("instance")._refresh();
            }

            // + - 버튼 이벤트 핸들러
            elem.bind('click', function(e) {
              e = e || event;
              var target = e.target || e.srcElement;
              var SliderValue;
              var SliderStep = (('step' in scope.liveSliderProperty) ? scope.liveSliderProperty.step : 1);

              if (target.className !== 'tui tui-wn5-minus cm-right' && target.className !== 'tui tui-wn5-add cm-left') return;

              if (scope.liveSliderProperty.disabled) return;

              switch (target.className) {
                case 'tui tui-wn5-minus cm-right':
                  SliderValue = validatedValue(scope.liveSliderModel[scope.modelName] - SliderStep);
                  break;
                case 'tui tui-wn5-add cm-left':
                  SliderValue = validatedValue(scope.liveSliderModel[scope.modelName] + SliderStep);
                  break;
              }

              updateSliderModel(SliderValue);
              updateInputBox(SliderValue);
            });
          }

          scope.$watch('liveSliderProperty', function(newValue, oldValue) {
            if (!checkLoad && scope.liveSliderProperty) {
              checkProperty = true;
              if (scope.liveSliderProperty.step > 0 && scope.liveSliderProperty.step < 1) {

              } else {
                scope.maxLength = String(scope.liveSliderProperty.ceil).length;
              }
              init();
            }

            if (checkLoad && newValue !== oldValue) {
              if ('floor' in newValue) {
                slider.slider("option", "min", newValue.floor);
              }
              if ('ceil' in newValue) {
                slider.slider("option", "max", newValue.ceil);
                scope.maxLength = String(newValue.ceil).length;
              }
              if ('disabled' in newValue) {
                slider.slider("option", "disabled", newValue.disabled);
              }
              if ('step' in newValue) {
                slider.slider("option", "step", newValue.step);
                if (newValue.step > 0 && newValue.step < 1) {
                  changePatternToFloat();
                } else {
                  changePatternToInt();
                }
              }
              slider.slider("instance")._refresh();
            }
          }, true);

          scope.$watch('liveSliderModel', function(newVal, oldVal) {
            if (!checkLoad) {
              if (scope.liveSliderModel) {
                scope.modelName = attrs.liveSliderModelName ? attrs.liveSliderModelName : "data";
                if (scope.liveSliderModel[scope.modelName]) {
                  scope.ThreshValue = scope.liveSliderModel[scope.modelName];
                  checkModel = true;
                  init();
                }
              }
            }

            if (checkLoad && newVal !== oldVal) {
              if (newVal[scope.modelName]) {
                var SliderValue = validatedValue(newVal[scope.modelName]);
                updateSliderUI(SliderValue);
                revokeUpdateCallback(SliderValue);
                revokeOnEnd();

                if (!inputOnChange) {
                  updateInputBox(SliderValue);
                }
                inputOnChange = false;
              }
            }
          }, true);

          //if( !checkLoad && scope.liveSliderModel[scope.modelName] ){
          //    console.log('---------------------------0',scope.modelName);
          //    init();
          //}
        }
      };
    }
  ]);