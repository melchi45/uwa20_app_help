kindFramework.constant('PTZ_TYPE',{
  ptzCommand : {
    'PTZ' : 1,
    'AUTOFOCUS' : 2,
    'NEAR' : 3,
    'FAR' : 4,
    'ZOOMIN': 5,
    'ZOOMOUT': 6,
    'AREAZOOM' : 7,
    'PRESET' : 8,
    'SWING' : 9,
    'GROUP' : 10,
    'TOUR' : 11,
    'TRACE' : 12,
    'TRACKING' : 13,
    'STOP' : 14,
    'NONE' : 15,
  },
  swingMode : {
    'PAN' : "lang_pan",
    'TILT' : "lang_tilt",
    'PANTILT' : "lang_pantilt",
  }
});

kindFramework.constant('PTZ_MESSAGE',{
  ptzNoListMessage : {
    'PRESET' : "설정된 리스트가 없습니다. PRESET 설정을 해주세요.",
    'SWING' : "설정된 리스트가 없습니다. SWING 설정을 해주세요.",
    'GROUP' : "설정된 리스트가 없습니다. GROUP 설정을 해주세요.",
    'TOUR' : "설정된 리스트가 없습니다. TOUR 설정을 해주세요.",
    'TRACE' : "TRACE를 지원하지 않습니다. ",
    'NONE' : "설정된 리스트가 없습니다. 설정을 해주세요.",
  }
});