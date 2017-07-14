"use strict";

kindFramework.constant('WISE_FACE_DETECTION', {
  HEIGHT_RATIO: 4,
  _2M: {
    BASIC: {
      MIN: {
        WIDTH: 854,
        HEIGHT: 480
      },
      MAX: {
        WIDTH: 1920,
        HEIGHT: 1080
      },
      RATIO: [1.77, 1]
    },
    HALLWAY: {
      MIN: {
        WIDTH: 640,
        HEIGHT: 480
      },
      MAX: {
        WIDTH: 1080,
        HEIGHT: 810
      },
      RATIO: [1.33, 1]
    }
  },
  _5M: {
    BASIC: {
      MIN: {
        WIDTH: 640,
        HEIGHT: 480
      },
      MAX: {
        WIDTH: 2560,
        HEIGHT: 1920
      },
      RATIO: [1.33, 1]
    },
    HALLWAY: {
      MIN: {
        WIDTH: 640,
        HEIGHT: 480
      },
      MAX: {
        WIDTH: 1920,
        HEIGHT: 1440
      },
      RATIO: [1.33, 1]
    }
  }
});