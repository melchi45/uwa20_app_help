/*global kindFramework */
/*global console */
/*global alert, CryptoJS*/

kindFramework.controller('userCtrl', function($scope, SunapiClient, Attributes, 
COMMONUtils, $timeout, $translate, SessionOfUserManager, $q) {
  "use strict";

  var mAttr = Attributes.get();

  var CurrentPasswordValidated = false;

  COMMONUtils.getResponsiveObjects($scope);

  $scope.getTranslatedOption = function(Option) {
    return COMMONUtils.getTranslatedOption(Option);
  };


  $scope.CurrentPassword = "";
  $scope.NewPassword = "";
  $scope.ConfirmNewPassword = "";
  $scope.UserProfileOptions = ["Default", "All"];
  $scope.selecteduser = 0;
  var pageData = {};
  $scope.AdminUser = "";
  $scope.isAdduser = false;
  $scope.isDeleteuser = false;
  $scope.IsPasswordChange = false;
  $scope.DeleteUserList = [];
  $scope.selected = 0;

  $scope.CamSpecialType = false;

  var promises = [];
  var promisesData = [];

  function getAttributes() {

    var deferred = $q.defer();

    if (typeof mAttr.MaxUser !== 'undefined') {
      $scope.MaxUser = mAttr.MaxUser;
    }

    if (typeof mAttr.MaxAlarmOutput !== 'undefined') {
      $scope.MaxAlarmOutput = mAttr.MaxAlarmOutput;
    }

    if (typeof mAttr.MaxAudioInput !== 'undefined') {
      $scope.MaxAudioInput = mAttr.MaxAudioInput;
    }

    if (typeof mAttr.MaxAudioOutput !== 'undefined') {
      $scope.MaxAudioOutput = mAttr.MaxAudioOutput;
    }
    if (typeof mAttr.ContinousZoom !== 'undefined') {
      $scope.ContinousZoom = mAttr.ContinousZoom;
    }

    if (typeof mAttr.UserIDLen !== 'undefined') {
      $scope.UserIDLen = mAttr.UserIDLen.maxLength;
    }

    if (typeof mAttr.PasswordLen !== 'undefined') {
      $scope.PasswordLen = mAttr.PasswordLen.maxLength;
    }

    if (typeof mAttr.CamSpecialModel !== 'undefined') {
      $scope.CamSpecialType = mAttr.CamSpecialModel;
    }

    $scope.AlphaNumericStr = mAttr.AlphaNumericStr;

    deferred.resolve('success');

    return deferred.promise;
  }

  function usersView() {
    return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=users&action=view', '',
      function(response) {

        var idx = 0;
        $scope.Users = response.data.Users;
        $scope.AdminPassword = SessionOfUserManager.getPassword();
        pageData.AdminPassword = angular.copy($scope.AdminPassword);
        //$scope.CurrentPassword = $scope.AdminPassword;
        $scope.Users.splice(0, 1);

        for (idx = 0; idx < $scope.Users.length; idx +=1) {
          if ($scope.Users[idx].VideoProfileAccess === true) {
            $scope.Users[idx].VideoProfileAccess = "All";
          } else {
            $scope.Users[idx].VideoProfileAccess = "Default";
          }
        }

        pageData.Users = angular.copy($scope.Users);
        // guestview();
      },
      function(errorData) {}, '', true);

  }

  function guestview() {
    return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=guest&action=view', '',
      function(response) {
        $scope.GuestAccess = response.data.Enable;
        pageData.GuestAccess = angular.copy($scope.GuestAccess);
        // rtspview();
      },
      function(errorData) {}, '', true);

  }

  function rtspview() {
    return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=rtsp&action=view', '',
      function(response) {
        if (response.data.RTSPAuthentication === "Protected") {
          $scope.RTSPAccess = false;
        } else {
          $scope.RTSPAccess = true;
        }
        pageData.RTSPAccess = angular.copy($scope.RTSPAccess);

      },
      function(errorData) {}, '', true);

  }

  function GuestAccessSet() {
    var setData = {};

    setData.Enable = pageData.GuestAccess = $scope.GuestAccess;

    return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=guest&action=set', setData,
      function(response) {},
      function(errorData) {
        console.log(errorData);
      }, '', true);

  }

  function RTSPAccessSet() {
    var setData = {};

    pageData.RTSPAccess = $scope.RTSPAccess;

    if ($scope.RTSPAccess === false) {
      setData.RTSPAuthentication = "Protected";
    } else {
      setData.RTSPAuthentication = "Anonymous";
    }

    return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=rtsp&action=set', setData,
      function(response) {},
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function RefreshPage() {
    window.location.reload(true);
  }

  function AdminPasswordSet() {
    var setData = {};
    setData.UserID = "admin";
    setData.Password = encodeURIComponent($scope.NewPassword);
    setData.Index = 0;

    return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=users&action=update', setData,
      function(response) {
        $scope.AdminPassword = $scope.NewPassword;
        pageData.AdminPassword = angular.copy($scope.AdminPassword);
        $scope.CurrentPassword = $scope.NewPassword = $scope.ConfirmNewPassword = "";
        /** After Admin password is changed, refresh the page to prompt new password popup  */
        window.setTimeout(RefreshPage, 500);
      },
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function addUserAsync() {
    var setData = promisesData.shift();

    return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=users&action=add', setData,
      function(response) {},
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function deleteUserAsync() {
    var setData = promisesData.shift();
    return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=users&action=remove', setData,
      function(response) {},
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function modifyUserAsync() {
    var setData = promisesData.shift();

    return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=users&action=update', setData,
      function(response) {},
      function(errorData) {
        console.log(errorData);
      }, '', true);
  }

  function UserAccessSet() {
    var setData = {},
      idx = 0;

    promises = [];
    promisesData = [];

    //only for deleted users
    if ($scope.DeleteUserList.length > 0) {
      for (idx = 0; idx < $scope.DeleteUserList.length; idx +=1) {
        if ($scope.DeleteUserList[idx] > 0) {
          setData.Index = $scope.DeleteUserList[idx];

          promisesData.push(angular.copy(setData));
          promises.push(deleteUserAsync);
        }
      }
      $scope.DeleteUserList = [];
    }

    //only for new users
    for (idx = 0; idx < $scope.Users.length; idx +=1) {
      setData = {};
      if (IsNewUser($scope.Users[idx].Index)) {
        setData.UserID = $scope.Users[idx].UserID;
        if ($scope.Users[idx].Password !== "") {
          setData.Password = encodeURIComponent($scope.Users[idx].Password);
        }

        setData.Enable = $scope.Users[idx].Enable;
        if ($scope.Users[idx].VideoProfileAccess === "All") {
          setData.VideoProfileAccess = true;
        } else {
          setData.VideoProfileAccess = false;
        }

        //if(mAttr.PTZModel === true || mAttr.ExternalPTZModel === true || mAttr.FisheyeLens === true)
        if (typeof mAttr.ContinousZoom !== 'undefined') {
          setData.PTZAccess = $scope.Users[idx].PTZAccess;
        }

        if (mAttr.MaxAudioInput > 0) {
          setData.AudioInAccess = $scope.Users[idx].AudioInAccess;
        }

        if (mAttr.MaxAudioOutput > 0) {
          setData.AudioOutAccess = $scope.Users[idx].AudioOutAccess;
        }
        if (mAttr.MaxAlarmOutput > 0) {
          setData.AlarmOutputAccess = $scope.Users[idx].AlarmOutputAccess;
        }
        promisesData.push(angular.copy(setData));
        promises.push(addUserAsync);
      }
    }

    //only for modified users
    for (idx = 0; idx < $scope.Users.length; idx +=1) {
      if (!IsNewUser($scope.Users[idx].Index) && IsUserParamChange($scope.Users[idx])) {
        setData.UserID = $scope.Users[idx].UserID;
        setData.Index = $scope.Users[idx].Index;
        if ($scope.Users[idx].Password !== "") {
          setData.Password = encodeURIComponent($scope.Users[idx].Password);
        }

        setData.Enable = $scope.Users[idx].Enable;
        if ($scope.Users[idx].VideoProfileAccess === "All") {
          setData.VideoProfileAccess = true;
        } else {
          setData.VideoProfileAccess = false;
        }

        //if(mAttr.PTZModel === true || mAttr.ExternalPTZModel === true || mAttr.FisheyeLens === true)
        if (typeof mAttr.ContinousZoom !== 'undefined') {
          setData.PTZAccess = $scope.Users[idx].PTZAccess;
        }

        if (mAttr.MaxAudioInput > 0) {
          setData.AudioInAccess = $scope.Users[idx].AudioInAccess;
        }

        if (mAttr.MaxAudioOutput > 0) {
          setData.AudioOutAccess = $scope.Users[idx].AudioOutAccess;
        }
        if (mAttr.MaxAlarmOutput > 0) {
          setData.AlarmOutputAccess = $scope.Users[idx].AlarmOutputAccess;
        }

        promisesData.push(angular.copy(setData));
        promises.push(modifyUserAsync);
      }
    }

    $q.seqAll(promises).then(
      function(result) {
        pageData.Users = angular.copy($scope.Users);
        view();
      },
      function(error) {
        console.log(error);
      });
  }

  function IsNewUser(index) {
    var i = 0;
    for (i = 0; i < pageData.Users.length; i += 1) {
      if (pageData.Users[i].Index === index) {
        return false;
      }
    }
    return true;
  }

  function IsUserParamChange(user) {
    var i = 0;
    for (i = 0; i < pageData.Users.length; i += 1) {

      if (pageData.Users[i].Index === user.Index) {

        if (!angular.equals(pageData.Users[i], user)) {

          return true;
        }
      }
    }
    return false;
  }

  function IsEmptyUser() {
    var i = 0;
    for (i = 0; i < $scope.Users.length; i += 1) {

      if ($scope.Users[i].UserID === "") {
        return true;
      }
    }
    return false;
  }

  function IsUserNameExits() {
    var index = 0,
      index1 = 0;
    var maxuser = $scope.Users.length;
    for (index = 0; index < maxuser - 1; index +=1) {
      for (index1 = (index + 1); index1 < maxuser; index1 +=1) {
        if ($scope.Users[index].UserID === $scope.Users[index1].UserID) {
          return true;
        }
      }
    }
    return false;
  }


  function set() {
    if ($scope.CurrentPassword === "" && $scope.NewPassword === "" && 
        $scope.ConfirmNewPassword === "") {
      var ret = validatePageContinue();
      if (ret === true) {
        COMMONUtils.ApplyConfirmation(saveUserSettings);
        return;
      }
      return;
    }
    ValidateCurrentPassword().then(
      function(result) {
        var errorMessage = '';
        //console.log("CURRENT Password VALID",CurrentPasswordValidated);
        if (CurrentPasswordValidated !== true) {
          errorMessage = 'lang_msg_invalid_userPW';
          COMMONUtils.ShowError(errorMessage);
          return;
        }
        if ($scope.NewPassword === "" && $scope.ConfirmNewPassword === "") {
          errorMessage = 'lang_msg_pw_rule1';
          COMMONUtils.ShowError(errorMessage);
          return;
        }
        var ret = validatePageContinue();
        if (ret === true) {
          COMMONUtils.ApplyConfirmation(saveUserSettings);
          return;
        }
        return;
      },
      function(error) {
        console.log(error);
        return;
      });
  }

  function validatePageContinue() {

    var idx = 0,
      ret = 0;
    var errorMessage = '';
    if (!CheckNamePw() || !CheckAdminPW()) {
      return false;
    }

    if (IsUserNameExits()) {
      errorMessage = 'lang_msg_id_duplicate';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if (IsEmptyUser()) {
      errorMessage = 'lang_msg_invalid_id';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    for (idx = 0; idx < $scope.Users.length; idx += 1) {

      if ($scope.Users[idx].UserID.toLowerCase() === "admin" || 
          $scope.Users[idx].UserID.toLowerCase() === "guest") {
        errorMessage = 'lang_msg_adminguest';
        COMMONUtils.ShowError(errorMessage);
        return false;
      }

      //if ($scope.Users[idx].Enable === false) continue;

      if ($scope.Users[idx].Password.length > 0) {
        ret = COMMONUtils.SafePassword($scope.Users[idx].Password, $scope.Users[idx].UserID);

        if ($scope.Users[idx].UserID === "" || ($scope.Users[idx].Password === "" && ret !== 0)) {
          errorMessage = $translate.instant('lang_msg_id_pw_msg') + "[" + $scope.Users[idx].UserID + "]";
          COMMONUtils.ShowError(errorMessage);
          return false;
        }

        if ($scope.Users[idx].UserID.indexOf(" ") >= 0 || $scope.Users[idx].Password.indexOf(" ") >= 0) {
          errorMessage = $translate.instant('lang_msg_invalid_id_pw') + "[" + $scope.Users[idx].UserID + "]";
          COMMONUtils.ShowError(errorMessage);
          return false;
        }
      }
    }
    return true;
  }

  function CheckAdminPW() {
    var ret=0;
    var errorMessage ='';
    var pwErrorMessage='';
    if ($scope.NewPassword === "" && $scope.ConfirmNewPassword === "") {
      return true;
    }

    if ($scope.CamSpecialType === false) {
      if (!COMMONUtils.CheckNumCharSym($scope.NewPassword)) {
        //$scope.CurrentPassword = $scope.NewPassword = $scope.ConfirmNewPassword = "";
        errorMessage = $translate.instant('lang_msg_invalid_id_pw') + " [admin]";
        COMMONUtils.ShowError(errorMessage);
        return false;
      }
    }

    var tempuser = "admin";
    if ($scope.CamSpecialType === true) {
      ret = COMMONUtils.isSafePassword_S1($scope.NewPassword, tempuser);
    } else {
      ret = COMMONUtils.isSafePassword($scope.NewPassword, tempuser);
    }

    if (ret !== 0) {
      pwErrorMessage = "lang_msg_pw_rule" + ret;
      //$scope.CurrentPassword = $scope.NewPassword = $scope.ConfirmNewPassword = "";
      errorMessage = $translate.instant(pwErrorMessage) + " [admin]";
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if ($scope.CamSpecialType === true) {
      ret = COMMONUtils.isSafePassword_S1($scope.ConfirmNewPassword, tempuser);
    } else {
      ret = COMMONUtils.isSafePassword($scope.ConfirmNewPassword, tempuser);
    }


    if (ret !== 0) {
      pwErrorMessage = "lang_msg_pw_rule" + ret;
      errorMessage = $translate.instant(pwErrorMessage) + " [admin]";
      //$scope.CurrentPassword = $scope.NewPassword = $scope.ConfirmNewPassword = "";
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    if ($scope.NewPassword !== $scope.ConfirmNewPassword) {
      //$scope.CurrentPassword = $scope.NewPassword = $scope.ConfirmNewPassword = "";
      errorMessage = 'lang_msg_chek_Admin_pw';
      COMMONUtils.ShowError(errorMessage);
      return false;
    }

    return true;
  }

  function CheckNamePw() {
    var index = 0,
      ret = 0;
    var errorMessage = '';
    var pwErrorMessage = '';

    for (index = 0; index < $scope.Users.length; index += 1) {
      if (!COMMONUtils.TypeCheck($scope.Users[index].UserID, 
                                COMMONUtils.getALPHA() + COMMONUtils.getNUM())) {
        if ($scope.Users[index].UserID === '') {
          COMMONUtils.ShowError('lang_msg_invalid_id');
        } else {
          errorMessage= $translate.instant('lang_msg_invalid_id') + " [" + 
                        $scope.Users[index].UserID + "]";
          COMMONUtils.ShowError(errorMessage);
        }
        return false;
      }

      //if ($scope.Users[index].Enable == false) continue;

      if ($scope.Users[index].Password.length === 0 && 
          ((IsNewUser($scope.Users[index].Index) && 
          $scope.Users[index].Enable === true) || ($scope.Users[index].Enable === true &&
          pageData.Users[index].Enable === false))) {
        ret = COMMONUtils.SafePassword($scope.Users[index].Password, $scope.Users[index].UserID);
        if (ret === 0) {
          continue;
        } else {
          pwErrorMessage = "lang_msg_pw_rule" + ret;
          errorMessage = " \"" + $scope.Users[index].UserID + "\"" + ":" + $translate.instant(pwErrorMessage);
          COMMONUtils.ShowError(errorMessage);
          return false;
        }
      }

      if ($scope.CamSpecialType === false && $scope.Users[index].Password.length > 0) {
        if (!COMMONUtils.CheckNumCharSym($scope.Users[index].Password)) {
          errorMessage = $translate.instant('lang_msg_invalid_id_pw') + " [" + $scope.Users[index].UserID + "]";
          COMMONUtils.ShowError(errorMessage);
          return false;
        }
      }

      if ($scope.Users[index].Password.length > 0) {
        if ($scope.CamSpecialType === true) {
          ret = COMMONUtils.isSafePassword_S1($scope.Users[index].Password, 
                                              $scope.Users[index].UserID);
        } else {
          ret = COMMONUtils.isSafePassword($scope.Users[index].Password, 
                                          $scope.Users[index].UserID);
        }
      }

      if (ret !== 0) {
        pwErrorMessage = "lang_msg_pw_rule" + ret;
        errorMessage = $translate.instant(pwErrorMessage) + " [" + $scope.Users[index].UserID + "]";
        COMMONUtils.ShowError(errorMessage);
        return false;
      }
    }
    return true;
  }


  function ValidateCurrentPassword() {
    CurrentPasswordValidated = false;
    var setData = {};
    var hashstr = "admin:" + $scope.CurrentPassword;
    var authHash = CryptoJS.MD5(hashstr).toString();
    setData.Digest = authHash;

    return SunapiClient.get('/stw-cgi/security.cgi?msubmenu=verifyauth&action=test', setData,
      function(response) {
        CurrentPasswordValidated = true;
      },
      function(errorData) {}, '', true);
  }



  function saveUserSettings() {

    var tPromises = [];

    if ($scope.CurrentPassword !== "") {
      tPromises.push(AdminPasswordSet);
    }

    if (!angular.equals(pageData.GuestAccess, $scope.GuestAccess)) {
      tPromises.push(GuestAccessSet);
    }

    if (!angular.equals(pageData.RTSPAccess, $scope.RTSPAccess)) {
      tPromises.push(RTSPAccessSet);
    }

    if (tPromises.length > 0) {
      $q.seqAll(tPromises).then(
        function(result) {
          if (!angular.equals(pageData.Users, $scope.Users)) {
            UserAccessSet();
          }
        },
        function(error) {

        });
    } else {
      if (!angular.equals(pageData.Users, $scope.Users)) {
        UserAccessSet();
      }
    }

    $scope.isAdduser = $scope.isDeleteuser = false;
    $scope.DeleteUserList = [];
  }

  function IsUserProfileAccess($index) {
    return !($scope.Users[$index].VideoProfileAccess);
  }

  function view() {
    $scope.isAdduser = $scope.isDeleteuser = false;
    $scope.DeleteUserList = [];
    $q.seqAll([getAttributes, usersView, guestview, rtspview]).then(
      function(result) {
        $scope.CurrentPassword = "";
        $scope.NewPassword = "";
        $scope.ConfirmNewPassword = "";
        $scope.pageLoaded = true;
        $("#userpage").show();
      },
      function(error) {
        console.log(error);
      });
  }

  function adduser() {
    if ($scope.Users.length === $scope.MaxUser - 1) {
      COMMONUtils.ShowError('lang_msg_cannot_add');
      return;
    }
    var user = {};
    user = angular.copy($scope.Users[0]);
    if (typeof user === 'undefined') {
      user = {};
    }

    user.Index = 0;
    user.UserID = "";
    user.Password = "";
    user.Enable = false;
    user.VideoProfileAccess = "Default";
    user.PTZAccess = false;
    user.AudioInAccess = false;
    user.AudioOutAccess = false;
    user.AlarmOutputAccess = false;

    $scope.Users.push(user);
    $scope.isAdduser = true;
    $scope.selected = $scope.Users.length - 1;
  }

  function deleteuser(index) {
    if (typeof index !== 'undefined' && $scope.Users.length > 0) {
      if ($scope.Users[index].UserID !== "") {
        //add the user to delete user list
        $scope.DeleteUserList.push($scope.Users[index].Index);
      }
      $scope.Users.splice(index, 1);
      $scope.isDeleteuser = true;
      if ($scope.Users.length > 1) {
        if ($scope.Users.length === index) {
          $scope.selected = index - 1;
        } else {
          $scope.selected = index;
        }
      } else {
        $scope.selected = 0;
      }
    }
  }

  (function wait() {
    if (!mAttr.Ready) {
      $timeout(function() {
        mAttr = Attributes.get();
        wait();
      }, 500);
    } else {
      view();
    }
  })();


  function validatepassword(elem) {
    var name = $scope[elem];
    var reg = /[^a-zA-Z0-9-~`!@#$%^*()_\-\+=|{}\[\].?/]/;
    // var bfound = false;
    var match=null;
    while ((match = reg.exec(name)) !== null) {
      var re=null;
      if (match[0] === '\\') {
        re = new RegExp("\\\\", 'g');
      } else {
        re = new RegExp(match[0], 'g');
      }

      $scope[elem] = name.replace(re, '');
      name = $scope[elem];
      // bfound = true;
    }

    // if (bfound) {
    //   alert($translate.instant('lang_msg_pw_rule9'));
    // }

  }

  function validateuserpassword() {
    var vvar = $scope.Users[$scope.selected];
    var reg = /[^a-zA-Z0-9-~`!@#$%^*()_\-\+=|{}\[\].?/]/;
    // var bfound = false;
    var match=null;
    while ((match = reg.exec(vvar.Password)) !== null) {
      var re=null;
      if (match[0] === '\\') {
        re = new RegExp("\\\\", 'g');
      } else {
        re = new RegExp(match[0], 'g');
      }

      $scope.Users[$scope.selected].Password = vvar.Password.replace(re, '');
      vvar.Password = $scope.Users[$scope.selected].Password;
      // bfound = true;
    }
    // if (bfound) {
    //   alert($translate.instant('lang_msg_pw_rule9'));
    // }
  }

  $scope.validatepassword = validatepassword;
  $scope.validateuserpassword = validateuserpassword;
  $scope.submit = set;
  $scope.view = view;
  $scope.IsUserProfileAccess = IsUserProfileAccess;
  $scope.deleteuser = deleteuser;
  $scope.adduser = adduser;
});