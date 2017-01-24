/**
 * @reference http://hammerjs.github.io/recognizer-tap/
 */
kindFramework.constant("KIND_TOUCH_DOUBLE_TAP", {
    //Maximum press time in ms.
    "TIME": 250,
    //Maximum time in ms between multiple taps.
    "INTERVAL": 500,
    //While doing a tap some small movement is allowed.
    "THRESHOLD": 50,
    //The maximum position difference between multiple taps.
    "POSTHRESHOLD": 100,
    "TOUCHACTION": "pan-x pan-y"
});

kindFramework.constant("KIND_TOUCH_PRESS", {
    //Minimal press time in ms.
    "TIME": 200,
    //Minimal movement that is allowed while pressing.
    "THRESHOLD": 200,
    "TOUCHACTION": "auto"
});

/**
 * @reference http://hammerjs.github.io/recognizer-tap/
 */
kindFramework.constant("KIND_TOUCH_TAP", {
    //Required pointers.
    "POINTERS": 1,
    //While doing a tap some small movement is allowed.
    "THRESHOLD": 50,
    "TOUCHACTION": "pan-x pan-y"
});

/**
 * @reference http://hammerjs.github.io/recognizer-swipe/
 */
kindFramework.constant("KIND_TOUCH_SWIPE", {
    //Minimal velocity required before recognizing, unit is in px per ms.
    "VELOCITY": 0.65,
    //Minimal distance required before recognizing.
    "THRESHOLD": 10,
    "TOUCHACTION": "pan-x pan-y"
});

/**
 * @reference http://hammerjs.github.io/recognizer-pinch/
 */
kindFramework.constant("KIND_TOUCH_PINCH", {
    //Required pointers, with a minimal of 2.
    "POINTERS": 2,
    //Minimal scale before recognizing.
    "THRESHOLD": 0,
    "TOUCHACTION": "pan-x pan-y"
});

/**
 * @reference http://hammerjs.github.io/recognizer-pan/
 */
kindFramework.constant("KIND_TOUCH_PAN", {
    //Required pointers. 0 for all pointers.
    "POINTERS": 1,
    //Minimal pan distance required before recognizing.
    "THRESHOLD": 10,
    "TOUCHACTION": "pan-x pan-y"
});