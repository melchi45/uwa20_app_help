kindFramework.factory(
  'ChangePasswordModel',
  function() {
    "use strict";
    var ChangePasswordModel = function() {
      if (!(this instanceof ChangePasswordModel)) {
        return new ChangePasswordModel();
      }

      this.getWrongAccessMessage = function() {
        return "lang_msg_invalid_address";
      };
      this.getPasswordMisMatchMessage = function() {
        return "lang_new_cpw";
      };

      this.getSuccessMessage = function() {
        return [
          "lang_msg_savingComplete",
          "lang_msg_tryAgain"
        ];
      };

      this.getCurrentPasswordMisMatchMessage = function() {
        return "lang_msg_invalid_userPW";
      };

      this.getEmptyPasswordMessage = function() {
        return "lang_msg_id_pw_msg";
      };

      this.getWrongSpecialChracter = function() {
        return "lang_msg_pw_rule9";
      };

      this.getShortPasswordMessage = function() {
        return "lang_msg_pw_rule1";
      };

      this.getThreeSpecialCharacterMessage = function() {
        return "lang_msg_pw_rule3";
      };

      this.getTwoSpecialCharacterMessage = function() {
        return "lang_msg_pw_rule4";
      };

      this.getSameCharacterMessage = function() {
        return "lang_msg_pw_rule5";
      };
    };

    return ChangePasswordModel;
  });