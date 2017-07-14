kindFramework.factory('CameraSpec', function (Attributes, SunapiClient, COMMONUtils) {
  "use strict";
  var cameraSpec = {};

  cameraSpec.RecordEntropyEncoding = 'CABAC';
  cameraSpec.DefaultBaselineProfileEntropyEncoding = 'CAVLC';
  cameraSpec.DefaultRecordEncodingProfile = 'Main';
  cameraSpec.DisabledRecordEncodingProfiles = ['BaseLine'];

  cameraSpec.GammaOptions = ["0.20", "0.25", "0.30", "0.35", "0.40", "0.45", 
                            "0.50", "0.55", "0.60", "0.65", "0.70", "0.75", 
                            "0.80", "0.85", "0.90", "0.95", "1.00"];


  /******************************** Audio Setup Page start ******************************************/
  /* eslint-disable no-magic-numbers */
  //G711
  cameraSpec.G711BitRateOptions = [64];
  cameraSpec.G711SamplingRateOptions = [8000];
  cameraSpec.G711DefaultBitRate = 64;

  //G726
  cameraSpec.G726BitRateOptions = [16, 24, 32, 40];
  cameraSpec.G726SamplingRateOptions = [8000];
  cameraSpec.G726DefaultBitRate = 32;

  cameraSpec.AACBitRateOptions = [48];
  cameraSpec.AACSamplingRateOptions = [16000];
  cameraSpec.AACDefaultBitRate = 48;
  /* eslint-enable no-magic-numbers */
  /********************************  Audio Setup Page End ******************************************/

  cameraSpec.profileBasedEnodingType = function () {
    var profiles = [];

    profiles = [{
      "Profile": 1,
      "SupportedEncoding": ["MJPEG"]
    },
    {
      "Profile": 2,
      "SupportedEncoding": ["H264", "H265"]
    },
    {
      "Profile": 3,
      "SupportedEncoding": ["H264", "H265"]
    },
    {
      "Profile": 4,
      "SupportedEncoding": ["H264", "H265"]
    }];

    return profiles;
  };

  cameraSpec.getSupportedViewModesByMounting = function () {
    var camPos = {};

    camPos = {
      "CameraPositions": [{
        "CameraPosition": "Ceiling",
        "ViewModes": [
          "Panorama",
          "QuadView",
          "DoublePanorama"
        ],
      },
      {
        "CameraPosition": "Wall",
        "ViewModes": [
          "QuadView",
          "Panorama"
        ],
      }]
    };

    return camPos;
  };

  cameraSpec.getShutterSpeeds = function () {
    var ShutterSpeedDetails = {};

    ShutterSpeedDetails = {
      "ShutterSpeedDetails": {
        "CompensationModes": [{
          "CompensationMode": "WDR",
          "DefaultAutoShortShutterSpeed": "1/5",
          "DefaultAutoLongShutterSpeed": "1/240",
          "SensorCaptureFrameRates": [{
            "SensorCaptureFrameRate": "20",
            "AutoShortShutterSpeed": ["2", "1", "1/2", "1/4", "1/5", "1/8", "1/15", 
              "1/20", "1/25", "1/30", "1/50", "1/60", "1/100", 
              "1/120", "1/150", "1/180", "1/200", "1/240"
            ],
            "AutoLongShutterSpeed": ["1/20", "1/25", "1/30", "1/50", "1/60", "1/100", 
              "1/120", "1/150", "1/180", "1/200", "1/240"],
            "DefaultAutoShortShutterSpeed": "1/20",
            "DefaultAutoLongShutterSpeed": "1/240"
          }, {
            "SensorCaptureFrameRate": "25",
            "AutoShortShutterSpeed": ["2", "1", "1/2", "1/4", "1/5", "1/8", "1/15", 
              "1/20", "1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240"
            ],
            "AutoLongShutterSpeed": ["1/25", "1/30", "1/50", "1/60", "1/100", "1/120", 
              "1/150", "1/180", "1/200", "1/240"],
            "DefaultAutoShortShutterSpeed": "1/25",
            "DefaultAutoLongShutterSpeed": "1/240"
          }, {
            "SensorCaptureFrameRate": "30",
            "AutoShortShutterSpeed": ["2", "1", "1/2", "1/4", "1/5", "1/8", "1/15", "1/20", 
              "1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240"
            ],
            "AutoLongShutterSpeed": ["1/30", "1/50", "1/60", "1/100", "1/120", "1/150", 
              "1/180", "1/200", "1/240"],
            "DefaultAutoShortShutterSpeed": "1/30",
            "DefaultAutoLongShutterSpeed": "1/240"
          }, {
            "SensorCaptureFrameRate": "50",
            "AutoShortShutterSpeed": ["1", "1/2", "1/4", "1/5", "1/8", "1/15", "1/20", 
              "1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240"
            ],
            "AutoLongShutterSpeed": ["1/50", "1/60", "1/100", "1/120", "1/150", "1/180", 
              "1/200", "1/240"],
            "DefaultAutoShortShutterSpeed": "1/50",
            "DefaultAutoLongShutterSpeed": "1/240"
          }, {
            "SensorCaptureFrameRate": "60",
            "AutoShortShutterSpeed": ["1", "1/2", "1/4", "1/5", "1/8", "1/15", "1/20", 
              "1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240"
            ],
            "AutoLongShutterSpeed": ["1/60", "1/100", "1/120", "1/150", "1/180", "1/200", "1/240"],
            "DefaultAutoShortShutterSpeed": "1/60",
            "DefaultAutoLongShutterSpeed": "1/240"
          }]
        }, {
          "CompensationMode": "Off",
          "DefaultAutoShortShutterSpeed": "1/5",
          "DefaultAutoLongShutterSpeed": "1/12000",
          "SensorCaptureFrameRates": [{
            "SensorCaptureFrameRate": "20",
            "AutoShortShutterSpeed": ["2", "1", "1/2", "1/4", "1/5", "1/8", "1/15", "1/20", 
              "1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "AutoLongShutterSpeed": ["1/20", "1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "DefaultAutoShortShutterSpeed": "1/20",
            "DefaultAutoLongShutterSpeed": "1/12000"
          }, {
            "SensorCaptureFrameRate": "25",
            "AutoShortShutterSpeed": ["2", "1", "1/2", "1/4", "1/5", "1/8", "1/15", "1/20", 
              "1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "AutoLongShutterSpeed": ["1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "DefaultAutoShortShutterSpeed": "1/25",
            "DefaultAutoLongShutterSpeed": "1/12000"
          }, {
            "SensorCaptureFrameRate": "30",
            "AutoShortShutterSpeed": ["2", "1", "1/2", "1/4", "1/5", "1/8", "1/15", "1/20", 
              "1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "AutoLongShutterSpeed": ["1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "DefaultAutoShortShutterSpeed": "1/30",
            "DefaultAutoLongShutterSpeed": "1/12000"
          }, {
            "SensorCaptureFrameRate": "50",
            "AutoShortShutterSpeed": ["1", "1/2", "1/4", "1/5", "1/8", "1/15", "1/20", "1/25", 
              "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "AutoLongShutterSpeed": ["1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "DefaultAutoShortShutterSpeed": "1/50",
            "DefaultAutoLongShutterSpeed": "1/12000"
          }, {
            "SensorCaptureFrameRate": "60",
            "AutoShortShutterSpeed": ["1", "1/2", "1/4", "1/5", "1/8", "1/15", "1/20", "1/25", 
              "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "AutoLongShutterSpeed": ["1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "DefaultAutoShortShutterSpeed": "1/60",
            "DefaultAutoLongShutterSpeed": "1/12000"
          }]
        }, {
          "CompensationMode": "BLC",
          "DefaultAutoShortShutterSpeed": "1/5",
          "DefaultAutoLongShutterSpeed": "1/12000",
          "SensorCaptureFrameRates": [{
            "SensorCaptureFrameRate": "20",
            "AutoShortShutterSpeed": ["2", "1", "1/2", "1/4", "1/5", "1/8", "1/15", "1/20", 
              "1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "AutoLongShutterSpeed": ["1/20", "1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "DefaultAutoShortShutterSpeed": "1/20",
            "DefaultAutoLongShutterSpeed": "1/12000"
          }, {
            "SensorCaptureFrameRate": "25",
            "AutoShortShutterSpeed": ["2", "1", "1/2", "1/4", "1/5", "1/8", "1/15", "1/20", 
              "1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "AutoLongShutterSpeed": ["1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "DefaultAutoShortShutterSpeed": "1/25",
            "DefaultAutoLongShutterSpeed": "1/12000"
          }, {
            "SensorCaptureFrameRate": "30",
            "AutoShortShutterSpeed": ["2", "1", "1/2", "1/4", "1/5", "1/8", "1/15", "1/20", 
              "1/25", "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "AutoLongShutterSpeed": ["1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "DefaultAutoShortShutterSpeed": "1/30",
            "DefaultAutoLongShutterSpeed": "1/12000"
          }, {
            "SensorCaptureFrameRate": "50",
            "AutoShortShutterSpeed": ["1", "1/2", "1/4", "1/5", "1/8", "1/15", "1/20", "1/25",
              "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "AutoLongShutterSpeed": ["1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "DefaultAutoShortShutterSpeed": "1/50",
            "DefaultAutoLongShutterSpeed": "1/12000"
          }, {
            "SensorCaptureFrameRate": "60",
            "AutoShortShutterSpeed": ["1", "1/2", "1/4", "1/5", "1/8", "1/15", "1/20", "1/25", 
              "1/30", "1/50", "1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "AutoLongShutterSpeed": ["1/60", "1/100", "1/120",
              "1/150", "1/180", "1/200", "1/240", "1/250", "1/300", "1/360", "1/480", "1/500", 
              "1/600", "1/700",
              "1/1000", "1/1500", "1/2500", "1/5000", "1/10000", "1/12000"
            ],
            "DefaultAutoShortShutterSpeed": "1/60",
            "DefaultAutoLongShutterSpeed": "1/12000"
          }]
        }]
      }

    };
    return ShutterSpeedDetails;
  };

  cameraSpec.getDefaultShutterSpeed = function (maxSensorFrameRate) {
    var ShutterSpeedDetails = {};

    if (maxSensorFrameRate == 60) {
      ShutterSpeedDetails = {
        "ShutterSpeedDetails": {
          "CompensationModes": [{
            "CompensationMode": "Off",
            "SensorCaptureFrameRates": [{
              "SensorCaptureFrameRate": "25",
              "DefaultAutoShortShutterSpeed": "1/25",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }, {
              "SensorCaptureFrameRate": "30",
              "DefaultAutoShortShutterSpeed": "1/30",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }, {
              "SensorCaptureFrameRate": "50",
              "DefaultAutoShortShutterSpeed": "1/50",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }, {
              "SensorCaptureFrameRate": "60",
              "DefaultAutoShortShutterSpeed": "1/60",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }]
          }, {
            "CompensationMode": "BLC",
            "SensorCaptureFrameRates": [{
              "SensorCaptureFrameRate": "25",
              "DefaultAutoShortShutterSpeed": "1/25",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }, {
              "SensorCaptureFrameRate": "30",
              "DefaultAutoShortShutterSpeed": "1/30",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }, {
              "SensorCaptureFrameRate": "50",
              "DefaultAutoShortShutterSpeed": "1/50",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }, {
              "SensorCaptureFrameRate": "60",
              "DefaultAutoShortShutterSpeed": "1/60",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }]
          }, {
            "CompensationMode": "HLC",
            "SensorCaptureFrameRates": [{
              "SensorCaptureFrameRate": "25",
              "DefaultAutoShortShutterSpeed": "1/25",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }, {
              "SensorCaptureFrameRate": "30",
              "DefaultAutoShortShutterSpeed": "1/30",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }, {
              "SensorCaptureFrameRate": "50",
              "DefaultAutoShortShutterSpeed": "1/50",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }, {
              "SensorCaptureFrameRate": "60",
              "DefaultAutoShortShutterSpeed": "1/60",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }]
          }, {
            "CompensationMode": "WDR",
            "SensorCaptureFrameRates": [{
              "SensorCaptureFrameRate": "25",
              "DefaultAutoShortShutterSpeed": "1/100",
              "DefaultAutoLongShutterSpeed": "1/1500"
            }, {
              "SensorCaptureFrameRate": "30",
              "DefaultAutoShortShutterSpeed": "1/120",
              "DefaultAutoLongShutterSpeed": "1/1500"
            }, {
              "SensorCaptureFrameRate": "50",
              "DefaultAutoShortShutterSpeed": "1/100",
              "DefaultAutoLongShutterSpeed": "1/1500"
            }, {
              "SensorCaptureFrameRate": "60",
              "DefaultAutoShortShutterSpeed": "1/120",
              "DefaultAutoLongShutterSpeed": "1/1500"
            }]
          }]
        }
      };
    } else {
      ShutterSpeedDetails = {
        "ShutterSpeedDetails": {
          "CompensationModes": [{
            "CompensationMode": "Off",
            "SensorCaptureFrameRates": [{
              "SensorCaptureFrameRate": "25",
              "DefaultAutoShortShutterSpeed": "1/25",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }, {
              "SensorCaptureFrameRate": "30",
              "DefaultAutoShortShutterSpeed": "1/30",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }]
          }, {
            "CompensationMode": "BLC",
            "SensorCaptureFrameRates": [{
              "SensorCaptureFrameRate": "25",
              "DefaultAutoShortShutterSpeed": "1/25",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }, {
              "SensorCaptureFrameRate": "30",
              "DefaultAutoShortShutterSpeed": "1/30",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }]
          }, {
            "CompensationMode": "HLC",
            "SensorCaptureFrameRates": [{
              "SensorCaptureFrameRate": "25",
              "DefaultAutoShortShutterSpeed": "1/25",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }, {
              "SensorCaptureFrameRate": "30",
              "DefaultAutoShortShutterSpeed": "1/30",
              "DefaultAutoLongShutterSpeed": "1/12000"
            }]
          }, {
            "CompensationMode": "WDR",
            "SensorCaptureFrameRates": [{
              "SensorCaptureFrameRate": "25",
              "DefaultAutoShortShutterSpeed": "1/50",
              "DefaultAutoLongShutterSpeed": "1/1500"
            }, {
              "SensorCaptureFrameRate": "30",
              "DefaultAutoShortShutterSpeed": "1/60",
              "DefaultAutoLongShutterSpeed": "1/1500"
            }]
          }]
        }
      };
    }

    return ShutterSpeedDetails;
  };


  /******************************** OSD Related end ******************************************/

  return cameraSpec;
});