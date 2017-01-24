kindFramework.factory('SunapiConverter', function($q) {
  'use strict';

  var sunapiConverter = {};

  var delaySplit = function(str, spliter) {
    var deferred = $q.defer(),
      _arr = str.split(spliter);

    setTimeout(function() {
      deferred.resolve(_arr);
    }, 500);

    return deferred.promise;
  }

  var errorChecker = function(req, res) {
    var _obj = {};

    return _obj;
  }

  var convertKeyValue = function(res) {
    var _obj = {};
    var _lineArr = res.split('\r\n');

    for(var i = 0; i < _lineArr.length; i++) {
      if(_lineArr[i] !== '') {
        var _keyValueArr = _lineArr[i].split('=');
        _obj[_keyValueArr[0]] = _keyValueArr[1];
      }
    }

    // console.log("%c " + JSON.stringify(_obj), "color: #1a0dab;");

    return _obj;
  };

  var convertToProfilePolicy = function(res) {
    var _obj = {"VideoProfilePolicies" : []};
    var _lineArr = res.split('\r\n');

    for(var i = 0; i < _lineArr.length; i++) {
      if(_lineArr[i] !== '') {
        var _profileInfoArr = _lineArr[i].split('.');
        var _channel = _profileInfoArr[1],
          _keyValueArr = _profileInfoArr[_profileInfoArr.length -1].split('=');

         // if don't have channel object==============
        var findChannelIndex = -1;
        for(var j = 0; j < _obj['VideoProfilePolicies'].length; j++) {
          if(_obj['VideoProfilePolicies'][j]['Channel'] === _channel 
            || parseInt(_obj['VideoProfilePolicies'][j]['Channel']) === _channel) {
            findChannelIndex = j;
            break;
          }
        }
        if(findChannelIndex === -1) {
          _obj['VideoProfilePolicies'].push( {"Channel" : _channel } );
          findChannelIndex = _obj['VideoProfilePolicies'].length-1;
        }

        _obj['VideoProfilePolicies'][findChannelIndex][_keyValueArr[0]] = _keyValueArr[1];
      }
    }

    // console.log("%c " + JSON.stringify(_obj), "color: #1a0dab;");

    return _obj;
  };

  var convertToProfileList = function(res) {
    var _obj = {"VideoProfiles" : []};
    var _lineArr = res.split('\r\n');

    for(var i= 0; i < _lineArr.length; i++) {
      if(_lineArr[i] !== '') {
        var _profileInfoArr = _lineArr[i].split('.');
        var _channel = _profileInfoArr[1],
          _profileNo = _profileInfoArr[3],
          _keyValueArr = _profileInfoArr[_profileInfoArr.length -1].split('=');

        // if don't have channel object==============
        var findChannelIndex = -1;
        for(var j = 0; j < _obj['VideoProfiles'].length; j++) {
          if(_obj['VideoProfiles'][j]['Channel'] === _channel 
            || parseInt(_obj['VideoProfiles'][j]['Channel']) === _channel) {
            findChannelIndex = j;
            break;
          }
        }
        if(findChannelIndex === -1) {
          _obj['VideoProfiles'].push( {"Channel" : _channel, "Profiles" : []} );
          findChannelIndex = _obj['VideoProfiles'].length-1;
        }
        // ==========================================

        // if don't have profiles object===============
        var findProfileIndex = -1;
        for(var j = 0; j < _obj['VideoProfiles'][findChannelIndex]['Profiles'].length; j++) {
          if(_obj['VideoProfiles'][findChannelIndex]['Profiles'][j]['Profile'] === _profileNo 
            || parseInt(_obj['VideoProfiles'][findChannelIndex]['Profiles'][j]['Profile']) === _profileNo) {
            findProfileIndex = j;
            break;
          }
        }
        if(findProfileIndex === -1) {
          _obj['VideoProfiles'][findChannelIndex]['Profiles'].push({"Profile" : _profileNo});
          findProfileIndex = _obj['VideoProfiles'][findChannelIndex]['Profiles'].length-1;
        }
        // ==========================================

        _obj['VideoProfiles'][findChannelIndex]['Profiles'][findProfileIndex][_keyValueArr[0]] = _keyValueArr[1];
      }
    }

    // console.log("%c " + JSON.stringify(_obj), "color: #1a0dab;");
    return _obj;
  };

  var convertToStreamURI = function(res) {
    var _obj = {};
    var _lineArr = res.split("\r\n");

    for(var i = 0; i < _lineArr.length; i++) {
      var _keyValueArr = _lineArr[i].split('=');

      _obj[_keyValueArr[0]] = _keyValueArr[1];
    }

    return _obj;
  };

  var convertToUserInfo = function(res) {
    var _obj = {"Users" : []},
      _keyValueArr = [],
      _lineArr = res.split("\r\n");

    for(var i = 0; i < _lineArr.length; i++) {
      var _tempObj = {};

      if(_lineArr[i] === "") break;
      if( i === 0) {
        var _temp = _lineArr[i].split("\"")[1].substring(6);
        var _value = _temp.split("=")[1];

        _keyValueArr = new Array('Index').concat(_value.split('/'));
      } else {
        var _temp = _lineArr[i].substring(6);
        var _index = _temp.split('=')[0],
          _value = _temp.split('=')[1].split('/');

        for(var j = 0; j < _keyValueArr.length; j++) {
          if(j === 0) {
            _tempObj[_keyValueArr[j]] = _index;
          } else {
            _tempObj[_keyValueArr[j]] = _value[j-1];
          }
        }
        _obj["Users"].push(_tempObj);
      }
    }

    // console.log("%c convertToUserInfo " + JSON.stringify(_obj), "color: #1a0dab;");
    return _obj;
  };

  var converToError = function(res) {
    var _obj = {"Response" : "Fail", "Error" : {}},
      _lineArr = res.split("\r\n");

    for (var i = 0; i < _lineArr.length; i++) {
      if(i === 1) {
        _obj["Error"]["Code"] = parseInt(_lineArr[i].split(":")[1]);
      } else if(i === 3) {
        _obj["Error"]["Details"] = _lineArr[i]
      } 
    }
    console.log("%c converToError " + JSON.stringify(_obj), "color: #1a0dab;");
    return _obj;
  }

  var convertToVideosource = function(res) {
    var _obj = {"VideoSourceChannel" : []},
      _lineArr = res.split("\r\n");

    for(var i = 0; i < _lineArr.length; i++) {
      if(_lineArr[i] === '') break;
      var _videoSourceInfoArr = _lineArr[i].split('.');
      var _channel = parseInt(_videoSourceInfoArr[1]),
        _keyValueArr = _videoSourceInfoArr[_videoSourceInfoArr.length -1].split('=');

      // if don't have channel object==============
      var findChannelIndex = -1;
      for(var j = 0; j < _obj['VideoSourceChannel'].length; j++) {
        if(_obj['VideoSourceChannel'][j]['Channel'] === _channel 
          || parseInt(_obj['VideoSourceChannel'][j]['Channel']) === _channel) {
          findChannelIndex = j;
        }
      }
      if(findChannelIndex === -1) {
        _obj['VideoSourceChannel'].push( {"Channel" : _channel } );
        findChannelIndex = _obj['VideoSourceChannel'].length-1;
      }
      // ==========================================

      _obj['VideoSourceChannel'][findChannelIndex][_keyValueArr[0]] = _keyValueArr[1];
    }

    // console.log("%c sunapiConverter::convertToVideosource " + JSON.stringify(_obj), "color:#1a0dab;");

    return _obj;
  };

  var convertToTimeline = function(res) {
    var _obj = {"TimeLineSearchResults" : []},
      _lineArr = res.split("\r\n");

    for(var i = 1; i < _lineArr.length; i++) {
      if(_lineArr[i] === '') break;
      var _timelineInfoArr = _lineArr[i].split('.');
      var _channel = parseInt(_timelineInfoArr[1]),
        _result = parseInt(_timelineInfoArr[3]),
        _keyValueArr = _timelineInfoArr[_timelineInfoArr.length -1].split('=');

      // if don't have channel object==============
      var findChannelIndex = -1;
      for(var j = 0; j < _obj['TimeLineSearchResults'].length; j++) {
        if(_obj['TimeLineSearchResults'][j]['Channel'] === _channel 
          || parseInt(_obj['TimeLineSearchResults'][j]['Channel']) === _channel) {
          findChannelIndex = j;
        }
      }
      if(findChannelIndex === -1) {
        _obj['TimeLineSearchResults'].push( {"Channel" : _channel, "Results" : []} );
        findChannelIndex = _obj['TimeLineSearchResults'].length-1;
      }
      // ==========================================

      // if don't have result object===============
      var findResultIndex = -1;
      for(var j = 0; j < _obj['TimeLineSearchResults'][findChannelIndex]['Results'].length; j++) {
        if(_obj['TimeLineSearchResults'][findChannelIndex]['Results'][j]['Result'] === _result 
          || parseInt(_obj['TimeLineSearchResults'][findChannelIndex]['Results'][j]['Result']) === _result) {
          findResultIndex = j;
        }
      }
      if(findResultIndex === -1) {
        _obj['TimeLineSearchResults'][findChannelIndex]['Results'].push({"Result" : _result});
        findResultIndex = _obj['TimeLineSearchResults'][findChannelIndex]['Results'].length-1;
      }
      // ==========================================

      _obj['TimeLineSearchResults'][findChannelIndex]['Results'][findResultIndex][_keyValueArr[0]] = _keyValueArr[1];
    }

    // console.log("%c sunapiConverter::convertToTimeline " + JSON.stringify(_obj), "color:#1a0dab;");
    return _obj;
  };


  var convertToOverlappedIdList = function(res) {
    var data = convertKeyValue(res);
    data.OverlappedIDList = data.OverlappedIDList.split(',');
    return data;
  };

  var convertToCalendarSearch = function(res) {
    // var data = convertKeyValue(res);
    // data.OverlappedIDList = data.OverlappedIDList.split(',');
    var _obj = {
      CalenderSearchResults: []
    };
    var _lineArr = res.split('\r\n');
    var length = _lineArr.length;

    for(var i = 0; i < length ; i++) {
      if(_lineArr[i] !== '') {
        var _keyValueArr = _lineArr[i].split('=');
        // _obj[_keyValueArr[0]] = _keyValueArr[1];
        var channel = _keyValueArr[0].split('.')[1];
        _obj.CalenderSearchResults.push({
          Channel: channel,
          Result: _keyValueArr[1]
        });
      }
    }

    // console.log("%c " + JSON.stringify(_obj), "color: #1a0dab;");

    return _obj;
  };

  sunapiConverter.covert = function(reqURL, res) {
    if(res.indexOf('NG') !== -1) {
      console.log("%c sunapiConverter::NG ERROR!!", "color:#1a0dab;");

      return converToError(res);
    } else {
      if (reqURL.indexOf("videoprofile") !== -1) {
        if(reqURL.indexOf('policy') !== -1) {

          // console.log("%c sunapiConverter::covert videoprofilepolicy!!", "color:#1a0dab;");
          return convertToProfilePolicy(res);
        } else {

          // console.log("%c sunapiConverter::covert videoprofile!!", "color:#1a0dab;");
          return convertToProfileList(res);
        }
      } else if(reqURL.indexOf("security.cgi?msubmenu=users") !== -1) {

        // console.log("%c sunapiConverter::covert Userinfo!!", "color:#1a0dab;");
        return convertToUserInfo(res);
      } else if (reqURL.indexOf("timeline") !== -1) {

        // console.log("%c sunapiConverter::covert timeline!!", "color:#1a0dab;");
        return convertToTimeline(res);
      } else if (reqURL.indexOf("videosource") !== -1) {

        // console.log("%c sunapiConverter::covert videosource!!", "color:#1a0dab;");
        return convertToVideosource(res);
      } else if (reqURL.indexOf("recording.cgi?msubmenu=overlapped") !== -1) {

        // console.log("%c sunapiConverter::covert overlapped id list!!", "color:#1a0dab;");
        return convertToOverlappedIdList(res);
      } else if (reqURL.indexOf("recording.cgi?msubmenu=calendarsearch") !== -1) {

        // console.log("%c sunapiConverter::covert calendarsearch!!", "color:#1a0dab;");
        return convertToCalendarSearch(res);
      } else {

        console.log("%c sunapiConverter::covert can't recognize this sunapi request", "color:#1a0dab;");
        return convertKeyValue(res);
      }
    }
  };

  return sunapiConverter;
});