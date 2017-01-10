"use strict";
kindFramework.controller('dptzSetupCtrl', function ($scope, $interval, $timeout, SessionOfUserManager,
  ConnectionSettingService, kindStreamInterface, SunapiClient, Attributes, DPTZSetupModel, $q,
  COMMONUtils, ERROR_CODE) {
  var mAttr = Attributes.get();

  var pageData = {};
  pageData.Groups = [];
  var ERROR_CODE = ERROR_CODE.ErrorCode;
  var needReload = false;
  var MAX_CHANNEL_COUNT = 1;

  $scope.pageLoaded = false;
  $scope.AlphaNumericStr = mAttr.AlphaNumericStr;
  $scope.PresetNameMaxLen = ((mAttr.PresetNameMaxLen && mAttr.PresetNameMaxLen.maxLength)?mAttr.PresetNameMaxLen.maxLength:"12");

  $scope.quadrant = {
    select: '1'
  };

  $scope.presetsetup = {
    selectedPresetNumber: '1',
    selectedPresetName: null
  };

  function showVideo(){
      var getData = {};
      return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=flip&action=view', getData,
              function (response) {
                  var viewerWidth = 640;
                  var viewerHeight = 360;
                  var maxWidth = mAttr.MaxROICoordinateX;
                  var maxHeight = mAttr.MaxROICoordinateY;
                  var rotate = response.data.Flip[0].Rotate;
                  var flip = response.data.Flip[0].VerticalFlipEnable;
                  var mirror = response.data.Flip[0].HorizontalFlipEnable;
                  var adjust = mAttr.AdjustMDIVRuleOnFlipMirror;

                  $scope.videoinfo = {
                      width: viewerWidth,
                      height: viewerHeight,
                      maxWidth: maxWidth,
                      maxHeight: maxHeight,
                      flip: flip,
                      mirror: mirror,
                      support_ptz: (mAttr.FisheyeLens ? 'Digital PTZ' : false),
                      rotate: rotate,
                      adjust: adjust
                  };
                  $scope.ptzinfo = {
                      autoOpen: false,
                      type: (mAttr.FisheyeLens ? 'DPTZ' : 'none')
                  };

              },
              function (errorData) {
                  //alert(errorData);
              }, '', true);
  }

  function set(){

  }

  function getAttributes() {
    $scope.OnlyNumStr = mAttr.OnlyNumStr;
    $scope.group = [];
    $scope.preset={};
    for( var i=0 ; i< mAttr.MaxGroupCount ; i++ ) {
      $scope.group.push({
        id : i+1,
        presetlist : [],
        selectedIndex : 0
      });
      pageData.Groups[i] = {PresetSequences:[]};
    }
    $scope.group.dwellTime = {
      min : 1,
      max : 128,
      default: 3
    };
    $scope.group.maxSpeed = 64;

    $scope.savedPresetList =[];
    $scope.selectedQuadrant = [1,2,3,4];
  }

  function getPresetName(presetInfo) {
    for( var i=0 ; i< $scope.savedPresetList.length ; i++ ) {
      if( presetInfo.Preset === $scope.savedPresetList[i].id ) {
        return $scope.savedPresetList[i].name;
      }
    }
    return "";
  }

  function DigitalPTZPTZModeSet() {
    return SunapiClient.get("/stw-cgi/ptzconfig.cgi?msubmenu=ptzmode&action=set&Mode=DigitalPTZ", "",
        function () {},
        function (errorData) {
          console.log(errorData);
        }, "", true);
  }

  function getGroupInfo() {
    var getData = {};
    return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=group&action=view',getData,
      function(response){
        for( var ch_index=0 ; ch_index< MAX_CHANNEL_COUNT; ch_index++ ) {
          var Groups = response.data.PTZGroups[ch_index].Groups;
          for( var grp_idx = 0 ; grp_idx < Groups.length; grp_idx++ ) {
            var groupIndex = Groups[grp_idx].Group - 1;
            var presetlists = Groups[grp_idx].PresetSequences;
            for( var preset_idx = 0 ; preset_idx < presetlists.length; preset_idx++ ) {
              var name = getPresetName(presetlists[preset_idx]);
              $scope.group[groupIndex].presetlist.push({
                id : presetlists[preset_idx].Preset,
                name :presetlists[preset_idx].Preset + " : " + name,
                dwellTime : presetlists[preset_idx].DwellTime
              });
            }
            pageData.Groups[groupIndex].PresetSequences = angular.copy($scope.group[groupIndex].presetlist);
          }
        }
      },
      function(errorData){
        if( errorData !== 'Configuration Not Found') {
          console.log(errorData);
        }
      },'',true);
  }

  function getViewMode() {
    return SunapiClient.get('/stw-cgi/image.cgi?msubmenu=viewmodes&action=view', {},
      function(response){
        if( response.data.Viewmodes[0].Type === "QuadView") {
          //Currently, there is no way to set viewmode, So just set quadviewMode to be false for testing.
          //$scope.quadviewMode = true;
          $scope.quadviewMode = false;
        }
        else {
          $scope.quadviewMode = false;
        }
      },
      function(errorData){
        console.log(errorData);
      }, '', true);
  }

  function getPresetList() {
    var getData = {};
    $scope.savedPresetList = [];
    return SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=view', getData,
        function (response) {
            /** Populate values from SUNAPI and store in the SCOPE */
            $scope.PTZPresets = response.data.PTZPresets[0].Presets;

            for(var i=0; i<$scope.PTZPresets.length; i++)
            {
              $scope.savedPresetList.push({
                id : $scope.PTZPresets[i].Preset,
                name : $scope.PTZPresets[i].Name
              });
            }

            $scope.presetInfoList = getPresetListwithNumber(mAttr.MaxPreset, $scope.PTZPresets);
            $scope.presetsetup.selectedPresetNumber = '1';
        },
        function (errorData) {
          if( errorData !== 'Configuration Not Found' ) {
            console.log(errorData);
          }
          else
          {
            $scope.PTZPresets = null;
            $scope.presetInfoList = getPresetListwithNumber(mAttr.MaxPreset, $scope.PTZPresets);
            $scope.presetsetup.selectedPresetNumber = '1';
          }
        }, '', true);
  }

  function getPresetListwithNumber(presetMaxLength, presetList){
    var PresetListwithNumber = [];

    for(var i=0; i<presetMaxLength; i++)
    {
      PresetListwithNumber.push({Preset:i+1});
    }

    if(presetList !== null)
    {
        presetList.forEach(function(elem){
            PresetListwithNumber[elem.Preset - 1].Name = elem.Name;
        });
    }

    return PresetListwithNumber;
  }

  function view(){
    var functionList = [];


    functionList.push(showVideo);
    functionList.push(getAttributes);
    functionList.push(getViewMode);
    functionList.push(getPresetList);

    if(mAttr.GroupSupport)
    {
      functionList.push(getGroupInfo);
    }

    $q.seqAll(functionList).then(
      function(){
        $scope.pageLoaded = true;

        setInitialValue();
        //End of sample data
      },
      function(error) {
        console.log(error);
      }
    );
  }

  $scope.view = view;
  $scope.submit = set;

  (function wait(){
        if (!mAttr.Ready) {
            $timeout(function () {
                mAttr = Attributes.get();
                wait();
            }, 500);
        } else {
            try{
                Attributes.getAttributeSection().then(function(){
                    console.log("Attributes.getAttributeSection()");
                    mAttr = Attributes.get();
                    view();
                });
            }catch(e){
                view();
            }
        }
  })();

  $scope.getPresetNameWithIndex = function( presetInfo){
    return presetInfo.id +" : "+presetInfo.name;
  };

  var deleteGroupPreset = function() {
    var group = $scope.group[$scope.group.selectedId-1];
    group.presetlist.splice(group.selectedIndex,1);
    group.selectedIndex--;
    if( Number(group.selectedIndex) < 0 && group.presetlist.length > 0 ) {
      group.selectedIndex = 0;
    }
  };

  var setInitialValue = function() {
    if(mAttr.GroupSupport)
    {
      $scope.group.selectedId = $scope.group[0].id;
      $scope.sequenceDwell = $scope.group.dwellTime.default;
    }
    $scope.preset = { select : $scope.savedPresetList[0] };
  };

  var addGroupPresetlist = function() {
    var group = $scope.group[$scope.group.selectedId-1];
    if( $scope.savedPresetList.length < 0 ) {
      group.selectedIndex = 0;
    }

    var presetlist = $scope.group[$scope.group.selectedId-1].presetlist;

    if( presetlist.length >= mAttr.MaxPresetsPerGroup ) {
      return ERROR_CODE.INVALID_MAX_PRESET;
    } else if( presetlist.length === 0 ) {
      group.selectedIndex = 0;
    }

    if( $scope.savedPresetList.length <= 0 ) {
      return ERROR_CODE.INVALID_GROUP_SETTING;
    }

    if( $scope.sequenceDwell === "" ||
        $scope.sequenceDwell*1 < $scope.group.dwellTime.min ||
        $scope.sequenceDwell*1 > $scope.group.dwellTime.max ) {
      return ERROR_CODE.INVALID_DWELL;
    }
    presetlist.push({
      id : $scope.preset.select.id,
      name : $scope.preset.select.id + ' : ' +$scope.preset.select.name,
      dwellTime:$scope.sequenceDwell*1
    });
    return ERROR_CODE.VALID;
  };

  $scope.changeGroupPreset = function(index) {
    var targetName = $scope.group[$scope.group.selectedId-1].presetlist[index].name;
    for( var i=0 ; i< $scope.savedPresetList.length; i++ ) {
      var presetName = $scope.savedPresetList[i].id+ " : " + $scope.savedPresetList[i].name;

      if( presetName === targetName) {
        $scope.group[$scope.group.selectedId-1].presetlist[index].id = $scope.savedPresetList[i].id;
        $scope.group[$scope.group.selectedId-1].presetlist[index].name = targetName;
        break;
      }
    }
  };

  var checkGroupSequence = function(operatorType) {
    if( $scope.group.selectedId === undefined || $scope.group.selectedId < 0) {
      return ERROR_CODE.INVALID_PRESET;
    }
    var presetlist = $scope.group[$scope.group.selectedId-1].presetlist;
    if( presetlist.length < 1 ) {
      return ERROR_CODE.INVALID_PRESET;
    }
    if( operatorType === "Start") {
      if( !angular.equals(pageData.Groups[$scope.group.selectedId-1].PresetSequences, presetlist)) {
        return ERROR_CODE.INVALID_NEED_TO_SET;
      }
    }
    else if( operatorType === "Set") {
      for( var i=0 ; i< presetlist.length; i++ ) {
        if( presetlist[i].dwellTime === null || presetlist[i].dwellTime === undefined ||
          presetlist[i].dwellTime === "" ||
          presetlist[i].dwellTime*1 < $scope.group.dwellTime.min ||
          presetlist[i].dwellTime*1 > $scope.group.dwellTime.max ) {
          return ERROR_CODE.INVALID_DWELL;
        }
      }
    }
    else if( operatorType === "Remove") {
        if( pageData.Groups[$scope.group.selectedId-1].PresetSequences.length === 0 ) {
            return ERROR_CODE.INVALID_JUST_RELOAD;
        }
    }
    return ERROR_CODE.VALID;
  };

  var doGroupSequence = function(mode) {
    var _functionList = [];

    _functionList.push(DigitalPTZPTZModeSet);
    _functionList.push(function(){
      var setData = {};
      setData.Group = $scope.group.selectedId;
      setData.Mode = mode;
      if(mAttr.FisheyeLens)
      {
        setData.SubViewIndex =$scope.quadrant.select;
      }

      return SunapiClient.get("/stw-cgi/ptzcontrol.cgi?msubmenu=group&action=control", setData,
          function () {},
          function (errorData)
          {
            console.log(errorData);
          }, "", true);
    });

    $q.seqAll(_functionList).then(
        function(){
        },
        function(error) {
          console.log(error);
        }
    );
    return ERROR_CODE.VALID;
  };


  var addGroupPreset = function(deferred, index, list) {
    var specialHeaders = [];
    specialHeaders[0] = {};
    specialHeaders[0].Type = 'Content-Type';
    specialHeaders[0].Header = 'application/x-www-form-urlencoded';

    var setData = {
      'PTZGroups' : [
        {
          'Channel' : 0,
          'Groups' : [
            {
              'Group' : 1
            }
            ]
          }
        ]
    };
    setData.PTZGroups[0].Groups[0].Group = $scope.group.selectedId;
    setData.PTZGroups[0].Groups[0].PresetSequences = [];

    for( var i=0 ; i< list.length ; i++ ) {
      var presetInfo = {};
      presetInfo.PresetSequence = i+1;
      presetInfo.Preset = list[i].id;
      presetInfo.Speed = $scope.group.maxSpeed;
      presetInfo.DwellTime = list[i].dwellTime*1;
      setData.PTZGroups[0].Groups[0].PresetSequences.push(presetInfo);
    }
    console.log(setData);

    var jsonString = JSON.stringify(setData);

    var encodeddata = encodeURI(jsonString);

    SunapiClient.post('/stw-cgi/ptzconfig.cgi?msubmenu=group&action=set', {},
      function (response)
      {
        deferred.resolve(response);
      },
      function (errorData)
      {
        $scope.group[$scope.group.selectedId-1].presetlist = [];
        $scope.group[$scope.group.selectedId-1].selectedIndex = 0;
        console.log(errorData);
        deferred.reject(errorData);
      }, $scope, encodeddata, specialHeaders);
      return deferred.promise;
  };

  var addPresetToGroup = function() {
    var defered=$q.defer();
    if( pageData.Groups[$scope.group.selectedId-1].PresetSequences.length > 0 ) {
      SunapiClient.get('/stw-cgi/ptzconfig.cgi?msubmenu=group&action=remove',
        {Group:$scope.group.selectedId},
        function(){
          return addGroupPreset(defered, 0, $scope.group[$scope.group.selectedId-1].presetlist);
        },
        function(errorData){
          $scope.group[$scope.group.selectedId-1].presetlist = [];
          $scope.group[$scope.group.selectedId-1].selectedIndex = 0;
          console.log(errorData);
          defered.reject(errorData);
        },'', true);
    } else {
        return addGroupPreset(defered, 0, $scope.group[$scope.group.selectedId-1].presetlist);
    }
    return defered.promise;
  };

  var setGroupSequence = function() {
    var _functionList = [];
    _functionList.push(DigitalPTZPTZModeSet);
    _functionList.push(addPresetToGroup);

    $q.seqAll(_functionList).then(
        function(){
          needReload = true;
          setTimeout(RefreshPage,1000);
        },
        function(error) {
          console.log(error);
        }
    );
    return ERROR_CODE.VALID;
  };

  var removeGroupSequence = function() {
    var _functionList = [];

    _functionList.push(DigitalPTZPTZModeSet);
    _functionList.push(function () {
      var setData = {};
      setData.Group = $scope.group.selectedId;
      return SunapiClient.get("/stw-cgi/ptzconfig.cgi?msubmenu=group&action=remove", setData,
          function () {},
          function (errorData)
          {
            console.log(errorData);
          }, "", true);
    });

    $q.seqAll(_functionList).then(
        function(){
          //remove preset list in table.
          $scope.group[$scope.group.selectedId-1].presetlist = [];
          $scope.group[$scope.group.selectedId-1].selectedIndex = 0;
          needReload = true;
          window.setTimeout(RefreshPage, 1000);
        },
        function(error) {
          console.log(error);
        }
    );
    return ERROR_CODE.VALID;
  };

  var resetGroupUI = function() {
    setInitialValue();

    //reset preset list UI
    for(var groupIndex=0; groupIndex<pageData.Groups.length; groupIndex++)
    {
      $scope.group[groupIndex].presetlist = angular.copy(pageData.Groups[groupIndex].PresetSequences);
    }
  };

  function RefreshPage() {
        //window.location.href = $scope.relocateUrl;
        if (needReload === true) {
            needReload = false;
            window.location.reload(true);
        }
  }

  function add_preset(){
    var _functionList = [];
    _functionList.push(DigitalPTZPTZModeSet);
    _functionList.push(function(){
      var setData = {};
      setData.Name =$scope.presetsetup.selectedPresetName;
      setData.Preset =$scope.presetsetup.selectedPresetNumber;
      if(mAttr.FisheyeLens)
      {
        setData.SubViewIndex =$scope.quadrant.select;
      }

      return SunapiClient.get("/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=add", setData,
          function () {
          },
          function (errorData) {
            console.log(errorData);
          }, "", true);
    });

    $q.seqAll(_functionList).then(
        function(){
          view();
          $scope.presetsetup.selectedPresetName = "";
        },
        function(error) {
          console.log(error);
        }
    );
  }

  $scope.addPreset = function() {
    if($scope.presetsetup.selectedPresetName === null)
    {
      COMMONUtils.ShowError('lang_msg_selValidPresetNumber');
      return;
    }

    COMMONUtils.ShowConfirmation(add_preset,"lang_add_question");
  };

  function remove_preset(){
    var _functionList = [];

    _functionList.push(DigitalPTZPTZModeSet);
    _functionList.push(function(){
      var setData = {};
      setData.Preset =$scope.presetsetup.selectedPresetNumber;
      return SunapiClient.get("/stw-cgi/ptzconfig.cgi?msubmenu=preset&action=remove", setData,
          function () {},
          function (errorData) {
            console.log(errorData);
          }, "", true);
    });

    $q.seqAll(_functionList).then(
        function(){
          view();
          $scope.presetsetup.selectedPresetName = "";
        },
        function(error) {
          console.log(error);
        }
    );
  }

  $scope.removePreset = function () {
    if($scope.presetInfoList[$scope.presetsetup.selectedPresetNumber-1].Name === undefined)
    {
      COMMONUtils.ShowError('lang_msg_selValidPresetNumber');
      return;
    }

    COMMONUtils.ShowConfirmation(remove_preset,'lang_msg_confirm_remove_profile');
  };

  $scope.goPreset = function(){
    var _functionList = [];
    if($scope.presetInfoList[$scope.presetsetup.selectedPresetNumber-1].Name === undefined)
    {
      return;
    }

    _functionList.push(DigitalPTZPTZModeSet);
    _functionList.push(function(){
      var setData = {};
      setData.Preset =$scope.presetsetup.selectedPresetNumber;
      if(mAttr.FisheyeLens)
      {
        setData.SubViewIndex = $scope.quadrant.select;
      }
      return SunapiClient.get("/stw-cgi/ptzcontrol.cgi?msubmenu=preset&action=control", setData,
          function () {},
          function (errorData) {
            console.log(errorData);
          }, "", true);
    });

    $q.seqAll(_functionList).then(
        function(){
          console.log("gogo");
        },
        function(error) {
          console.log(error);
        }
    );
  };

  $scope.operator = {
    do : function(mode) {
      var checkResult = checkGroupSequence(mode);
      if( checkResult === ERROR_CODE.INVALID_NEED_TO_SET ) {
        COMMONUtils.ShowError('lang_msg_presetListChange');
      }
      else if( checkResult === ERROR_CODE.INVALID_PRESET ) {
        COMMONUtils.ShowError('lang_msg_selValidPresetNumber');
      }
      else {
        doGroupSequence(mode);
      }
    },
    set : function() {
      var checkResult = checkGroupSequence("Set");
      if( checkResult === ERROR_CODE.INVALID_DWELL) {
        COMMONUtils.ShowError('lang_dwt'); // Should be 'Enter a number between 1~128'
      }
      else if( checkResult === ERROR_CODE.INVALID_PRESET ) {
        COMMONUtils.ShowError('lang_msg_selValidPresetNumber');
      }
      else if( checkResult === ERROR_CODE.VALID) {
        COMMONUtils.ShowConfirmation(setGroupSequence,'lang_apply_question');
      }
    },
    remove : function() {
      var checkResult = checkGroupSequence("Remove");
      if( checkResult === ERROR_CODE.INVALID_PRESET ) {
        COMMONUtils.ShowError('lang_msg_selValidPresetNumber');
      }
      else if( checkResult === ERROR_CODE.INVALID_JUST_RELOAD) {
        needReload = true;
        setTimeout(RefreshPage,1000);
      }
      else if( checkResult === ERROR_CODE.VALID) {
        COMMONUtils.ShowConfirmation(removeGroupSequence, 'lang_msg_confirm_remove_profile');

      }
    },
    add : function() {
      var checkResult = addGroupPresetlist();
      if( checkResult === ERROR_CODE.INVALID_DWELL ) {
        COMMONUtils.ShowError('lang_dwt'); // Should be 'Enter a number between 1~128'
      }
      else if( checkResult === ERROR_CODE.INVALID_MAX_PRESET ) {
        COMMONUtils.ShowError('lang_msg_cannot_add');
      }
      else if( checkResult === ERROR_CODE.INVALID_GROUP_SETTING ) {
        COMMONUtils.ShowError('lang_msg_checkGroupSettingValue');
      }
    },
    delete : function() {
      deleteGroupPreset();
    },
    cancel : function() {
      resetGroupUI();
    }
  };
});