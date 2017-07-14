/**
 * kindTouch는 HammerJs 라이브러리를 사용한다.
 * vis 라이브러리도 HammerJs를 사용하는 데,
 * vis를 사용한 뒤 항상 touch-action이 none으로 설정되어
 * Touch Event를 사용할 수 없는 이슈가 발생한다.
 * 그래서 touch-action이 none으로 되어 있을 경우
 * HammerJs에서 지향하는 value로 설정한다.
 *
 * @refer http://hammerjs.github.io/touch-action/
 */
function setKindTouchTouchAction(element, config) {
  try {
    if (element.style.touchAction === 'none') {
      console.log("changed ", element.style.touchAction);
      element.style.touchAction = config.TOUCHACTION;
    }
  } catch (e) {
    console.error(e);
  }
}
/**
 * <someting kind-touch-pan="<Callback>" kind-touch-pan-disabled="<Boolean>"></someting>
 * @example
 *    In the view
 *    <div kind-touch-pan="callBack" kind-touch-pan-disabled="panDisable"></div>
 *
 *    In the Controller
 *    $scope.panDisable = false;
 *    $scope.callBack = function(event){
 *        console.log(event.type);
 *    };
 *
 *    //Start, End
 *    var beforeDeltaX = null;
 *    $scope.deltaX = 0;
 *    $scope.panHandle = function(event){
 *        if( (event.isFirst || event.type == "panstart") && beforeDeltaX == null ){
 *            console.log("isFirst--------------------------");
 *            beforeDeltaX = event.deltaX;
 *        }else{
 *            if(beforeDeltaX == null) return;
 *    
 *            var movingX = beforeDeltaX - event.deltaX;
 *            console.log("beforeDeltaX", beforeDeltaX, "event.deltaX", event.deltaX, "beforeDeltaX - event.deltaX", movingX);
 *    
 *            $scope.deltaX -= movingX;
 *    
 *            console.log("Current $scope.deltaX", $scope.deltaX);
 *    
 *            beforeDeltaX = event.deltaX;
 *    
 *            console.log("type", event.type);
 *            if((event.isFinal || event.type == "panend") && beforeDeltaX != null ){
 *                console.log("isFinal--------------------------");
 *                beforeDeltaX = null;
 *            }
 *        }
 *    };
 */
kindFramework.directive("kindTouchPan", function(KIND_TOUCH_PAN) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var callBack = attrs.kindTouchPan;
      var disabled = attrs.kindTouchPanDisabled;

      var elem = element[0];
      var panHammer = new Hammer(elem);

      var eventList = "panleft panright panup pandown panstart panend";
      var event = function(ev) {
        scope.$eval(callBack)(ev);
        scope.$apply();
      };

      var currentEvent = null;

      panHammer.get('pan').set({
        direction: Hammer.DIRECTION_ALL,
        pointers: KIND_TOUCH_PAN.POINTERS,
        threshold: KIND_TOUCH_PAN.THRESHOLD
      });

      setKindTouchTouchAction(elem, KIND_TOUCH_PAN);

      if (disabled === undefined) {
        currentEvent = "on";
        panHammer.on(eventList, event);
      } else {
        scope.$watch(disabled, function(newValue, oldValue) {
          var method = null;
          if (newValue === true && currentEvent === "on") {
            currentEvent = method = "off";
          } else if (
            (newValue === false && currentEvent === "off") ||
            (newValue === false && currentEvent === null)) {
            currentEvent = method = "on";
          }

          if (method) {
            panHammer[method](eventList, event);
          }
        });
      }
    }
  }
});

/**
 * <someting kind-touch-pinch="<Callback>" kind-touch-pinch-disabled="<Boolean>"></someting>
 * @example
 *    In the view
 *    <div kind-touch-pinch="callBack" kind-touch-pinch-disabled="pinchDisable"></div>
 *
 *    In the Controller
 *    $scope.pinchDisable = false;
 *    $scope.callBack = function(event){
 *        console.log(event.type);
 *    };
 *    
 *    //Start, End Checking
 *    var pinchStart = null;
 *    $scope.pinchHandle = function(event){
 *        if( (event.isFirst || event.type == "pinchstart") && pinchStart == null){
 *            pinchStart = true;
 *            console.log("pinch start");
 *        }
 *    
 *        if( (event.isFinal || event.type == "pinchend") && pinchStart == true){
 *            pinchStart = null;
 *            console.log("pinch end");
 *        }
 *    
 *        if(pinchStart){
 *            console.log(event.scale);
 *        }
 *    };
 */
kindFramework.directive("kindTouchPinch", function(KIND_TOUCH_PINCH) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var callBack = attrs.kindTouchPinch;
      var disabled = attrs.kindTouchPinchDisabled;

      var elem = element[0];
      var pinchHammer = new Hammer.Manager(elem);
      var pinchEvent = new Hammer.Pinch({
        pointers: KIND_TOUCH_PINCH.POINTERS,
        threshold: KIND_TOUCH_PINCH.THRESHOLD
      });

      var eventList = "pinch pinchstart pinchend pinchin pinchout pinchcancel";
      var event = function(ev) {
        scope.$eval(callBack)(ev);
        scope.$apply();
      };
      var currentEvent = null;

      setKindTouchTouchAction(elem, KIND_TOUCH_PINCH);

      pinchHammer.add([pinchEvent]);

      if (disabled === undefined) {
        currentEvent = "on";
        pinchHammer.on(eventList, event);
      } else {
        scope.$watch(disabled, function(newValue, oldValue) {
          var method = null;
          if (newValue === true && currentEvent === "on") {
            currentEvent = method = "off";
          } else if (
            (newValue === false && currentEvent === "off") ||
            (newValue === false && currentEvent === null)) {
            currentEvent = method = "on";
          }

          if (method) {
            pinchHammer[method](eventList, event);
          }
        });
      }
    }
  }
});

/**
 * <someting kind-touch-double-tap="<Callback>" kind-touch-double-tap-disabled="<Boolean>"></someting>
 * @example
 *    In the view
 *    <div kind-touch-double-tap="callBack" kind-touch-double-tap-disabled="doubleTapDisable"></div>
 *
 *    In the Controller
 *    $scope.doubleTapDisable = false;
 *    $scope.callBack = function(event){
 *        console.log(event.type);
 *    };
 */
kindFramework.directive("kindTouchDoubleTap", function(KIND_TOUCH_DOUBLE_TAP) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var callBack = attrs.kindTouchDoubleTap;
      var disabled = attrs.kindTouchDoubleTapDisabled;

      var elem = element[0];
      var doubleTapHammer = new Hammer.Manager(elem);
      var doubleTapEvent = new Hammer.Tap({
        event: 'doubletap',
        taps: 2
      });

      var eventList = "doubletap";
      var event = function(ev) {
        scope.$eval(callBack)(ev);
        scope.$apply();
      };
      var currentEvent = null;

      doubleTapHammer.add(doubleTapEvent);
      doubleTapHammer.get(eventList).set({
        interval: KIND_TOUCH_DOUBLE_TAP.INTERVAL,
        time: KIND_TOUCH_DOUBLE_TAP.TIME,
        threshold: KIND_TOUCH_DOUBLE_TAP.THRESHOLD,
        posThreshold: KIND_TOUCH_DOUBLE_TAP.POSTHRESHOLD
      });

      setKindTouchTouchAction(elem, KIND_TOUCH_DOUBLE_TAP);

      if (disabled === undefined) {
        currentEvent = "on";
        doubleTapHammer.on(eventList, event);
      } else {
        scope.$watch(disabled, function(newValue, oldValue) {
          var method = null;
          if (newValue === true && currentEvent === "on") {
            currentEvent = method = "off";
          } else if (
            (newValue === false && currentEvent === "off") ||
            (newValue === false && currentEvent === null)) {
            currentEvent = method = "on";
          }

          if (method) {
            doubleTapHammer[method](eventList, event);
          }
        });
      }
    }
  }
});

/**
 * <someting kind-touch-tap="<Callback>" kind-touch-tap-disabled="<Boolean>"></someting>
 * @example
 *    In the view
 *    <div kind-touch-tap="callBack" kind-touch-tap-disabled="tapDisable"></div>
 *
 *    In the Controller
 *    $scope.tapDisable = false;
 *    $scope.callBack = function(event){
 *        console.log(event.type);
 *    };
 */
kindFramework.directive("kindTouchTap", function(KIND_TOUCH_TAP) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var callBack = attrs.kindTouchTap;
      var disabled = attrs.kindTouchTapDisabled;

      var elem = element[0];
      var tapHammer = new Hammer(elem);
      var tapEvent = new Hammer.Tap({
        event: 'singletap'
      });

      var eventList = "tap";
      var event = function(ev) {
        if (attrs.kindTouchTap.indexOf('(') > -1) {
          scope.$eval(attrs.kindTouchTap);
        } else {
          scope.$eval(callBack)(ev);
        }
        scope.$apply();
      };
      var currentEvent = null;

      tapHammer.add(tapEvent);
      tapHammer.get(eventList).set({
        pointers: KIND_TOUCH_TAP.POINTERS,
        threshold: KIND_TOUCH_TAP.THRESHOLD
      });

      setKindTouchTouchAction(elem, KIND_TOUCH_TAP);

      if (disabled === undefined) {
        currentEvent = "on";
        tapHammer.on(eventList, event);
      } else {
        scope.$watch(disabled, function(newValue, oldValue) {
          var method = null;
          if (newValue === true && currentEvent === "on") {
            currentEvent = method = "off";
          } else if (
            (newValue === false && currentEvent === "off") ||
            (newValue === false && currentEvent === null)) {
            currentEvent = method = "on";
          }

          if (method) {
            tapHammer[method](eventList, event);
          }
        });
      }
    }
  }
});

/**
 * <someting kind-touch-swipe="<Callback>" kind-touch-swipe-disabled="<Boolean>"></someting>
 * @example
 *    In the view
 *    <div kind-touch-swipe="callBack" kind-touch-swipe-disabled="swipeDisable"></div>
 *
 *    In the Controller
 *    $scope.swipeDisable = false;
 *    $scope.callBack = function(event){
 *        console.log(event.type);
 *    };
 *    
 *    //Start, End
 *    $scope.swipeHandle = function(event){
 *        if(event.isFirst){
 *            console.log("swipe isFirst");
 *        }
 *    
 *        if(event.isFinal){
 *            console.log("swipe isFinal");
 *        }
 *    };
 */
kindFramework.directive("kindTouchSwipe", function(KIND_TOUCH_SWIPE) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var callBack = attrs.kindTouchSwipe;
      var disabled = attrs.kindTouchSwipeDisabled;

      var elem = element[0];
      var swipeHammer = new Hammer(elem);
      var swipeEvent = new Hammer.Swipe({
        event: 'swipe swipeleft swiperight swipeup swipedown'
      });

      var eventList = "swipeleft swiperight swipeup swipedown";
      var event = function(ev) {
        scope.$eval(callBack)(ev);
        scope.$apply();
      };
      var currentEvent = null;

      swipeHammer.add(swipeEvent);
      swipeHammer.get('swipe').set({
        direction: Hammer.DIRECTION_ALL,
        velocity: KIND_TOUCH_SWIPE.VELOCITY,
        threshold: KIND_TOUCH_SWIPE.THRESHOLD
      });

      setKindTouchTouchAction(elem, KIND_TOUCH_SWIPE);

      if (disabled === undefined) {
        currentEvent = "on";
        swipeHammer.on(eventList, event);
      } else {
        scope.$watch(disabled, function(newValue, oldValue) {
          var method = null;
          if (newValue === true && currentEvent === "on") {
            currentEvent = method = "off";
          } else if (
            (newValue === false && currentEvent === "off") ||
            (newValue === false && currentEvent === null)) {
            currentEvent = method = "on";
          }

          if (method) {
            swipeHammer[method](eventList, event);
          }
        });
      }
    }
  }
});


/**
 * <someting kind-touch-press="<Callback>" kind-touch-press-disabled="<Boolean>"></someting>
 * @example
 *    In the view
 *    <div kind-touch-press="callBack" kind-touch-press-disabled="pressDisable"></div>
 *
 *    In the Controller
 *    $scope.pressDisable = false;
 *    $scope.callBack = function(event){
 *        console.log(event.type);
 *    };
 */
kindFramework.directive("kindTouchPress", function(KIND_TOUCH_PRESS) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var callBack = attrs.kindTouchPress;
      var disabled = attrs.kindTouchPressDisabled;

      var elem = element[0];
      var pressHammer = new Hammer.Manager(elem);
      var pressEvent = new Hammer.Press({
        event: 'press',
        time: KIND_TOUCH_PRESS.TIME,
        threshold: KIND_TOUCH_PRESS.THRESHOLD
      });

      var eventList = "press pressup";
      var event = function(ev) {
        scope.$eval(callBack)(ev);
        scope.$apply();
      };
      var currentEvent = null;

      pressHammer.add(pressEvent);
      pressHammer.get(eventList);

      setKindTouchTouchAction(elem, KIND_TOUCH_PRESS);

      if (disabled === undefined) {
        currentEvent = "on";
        pressHammer.on(eventList, event);
      } else {
        scope.$watch(disabled, function(newValue, oldValue) {
          var method = null;
          if (newValue === true && currentEvent === "on") {
            currentEvent = method = "off";
          } else if (
            (newValue === false && currentEvent === "off") ||
            (newValue === false && currentEvent === null)) {
            currentEvent = method = "on";
          }

          if (method) {
            pressHammer[method](eventList, event);
          }
        });
      }
    }
  }
});