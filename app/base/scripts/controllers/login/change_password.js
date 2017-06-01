kindFramework
    .controller('ChangePasswordCtrl', function(
                 $scope,
                  $state,
                  $timeout,
                  SessionOfUserManager,
                  SunapiClient,
                  $translate,
									ModalManagerService,
									ChangePasswordModel
               ){
        "use strict";
				var changePasswordModel = new ChangePasswordModel();
    
        /*
        if(!SessionOfUserManager.IsLoggedin()){
						var wrongAccess = changePasswordModel.getWrongAccessMessage();
            $('.wrap').html('');
            $translate(wrongAccess).then(function(wrongAccess){
                alert(wrongAccess);
                $state.go("login");
            });
            return;
        }
        */
        
        $scope.loginInfo = {
            id: SessionOfUserManager.getUsername(),
            password: SessionOfUserManager.getPassword(),
            newpassword1: '',
            newpassword2: ''
        };

        $scope.onChangePassword = function(){
          var firstPassword = $scope.loginInfo.newpassword1;
          var secondPassword = $scope.loginInfo.newpassword2;
          
          if($scope.loginInfo.password !== SessionOfUserManager.getPassword()){
            openModal(changePasswordModel.getCurrentPasswordMisMatchMessage());
            return;
          }

          if(!checkEmptyPassword(firstPassword, secondPassword))
          {
            openModal(changePasswordModel.getEmptyPasswordMessage());
            return;
          }

          if(!checkNumCharSym(firstPassword))
          {
            openModal(changePasswordModel.getWrongSpecialChracter());
            return;             
          }

          switch(isSafePassword(firstPassword))
          {
            case 'short_password_length':
              openModal(changePasswordModel.getShortPasswordMessage());
              return;
              //break; //Make block for fix Static Analysis lint error - Unreachable 'break' after 'return'
            case 'Three_Special_Character':
              openModal(changePasswordModel.getThreeSpecialCharacterMessage());
              return;
              //break; //Make block for fix Static Analysis lint error - Unreachable 'break' after 'return'
            case 'Two_Special_Character':
              openModal(changePasswordModel.getTwoSpecialCharacterMessage());
              return;
              //break; //Make block for fix Static Analysis lint error - Unreachable 'break' after 'return'
            case 'Same_Character':
              openModal(changePasswordModel.getSameCharacterMessage());
              return;
              //break; //Make block for fix Static Analysis lint error - Unreachable 'break' after 'return'
          }

          if(firstPassword !== secondPassword)
          {
            openModal(changePasswordModel.getPasswordMisMatchMessage());
            return;
          }

          var setData  = {};
          setData.UserID = $scope.loginInfo.id;
          setData.Index = 0;
          setData.Password = $scope.loginInfo.newpassword2;
          SunapiClient.get(
            '/stw-cgi/security.cgi?msubmenu=users&action=update',
            setData,
            successCallBack,
            failCallBack,
            '',
            true
          );
        };

        function successCallBack(){
            $('#change-password').html('');
            SessionOfUserManager.UnSetLogin();
            
            $translate(changePasswordModel.getSuccessMessage()).then(function(){
                //openModal(translations.lang_msg_savingComplete + " " + translations.lang_msg_tryAgain);
								$timeout(function(){
                    $state.go('login');
								}, 1000);
            });
        }

        function failCallBack(errorData){
            openModal(errorData);
        }
	
				function openModal(msg){
					ModalManagerService.open('message',
						{
							'buttonCount': 0,
							'message': msg 
						} 
					);
				}

        function checkEmptyPassword(firstPassword, secondPassword){
          if($scope.loginInfo.newpassword1 === '' && $scope.loginInfo.newpassword2 === '')
          {
            return false;
          }
          return true;
        }

        function checkNumCharSym(value)
        {
          for(var i=0;i<value.length;i++)
          {
            var ch = value.charAt(i);
            var check = 0;
            if ( ch >= 'a' && ch <= 'z' ){
                check++;
            }else if( ch >= 'A' && ch <= 'Z' ){
                check++;
            }else if( ch >= '0' && ch <= '9' ){
                check++;
            }else if( ch === '~' || ch === '`' || ch === '!' || ch === '@' || ch === '#' || ch === '$' || ch === '%' || ch === '^' || ch === '*' ||
                        ch === '(' || ch === ')' || ch === '_' || ch === '-' || ch === '+' || ch === '=' || ch === '|' ||
                        ch === '{' || ch === '}' || ch === '[' || ch === ']' || ch === '.' || ch === '?' || ch === '/' ){
              check++;
            }
            if (check === 0)
            {
                return false;
            }
          }
          return true;
        }

        function isSafePassword(passwd) {
          var minLen = 8;
          var SecurityCapability_three= 1;

          if (passwd.length < minLen)
          { 
            return 'short_password_length';
          }
          
          function isValidRule1(passwd) {
            var acceptCount = 0;
            var PATTERN_NUM = /\d+/;  
            var PATTERN_UPPER_ALPHA = /[A-Z]/;
            var PATTERN_LOWER_ALPHA = /[a-z]/;
            var PATTERN_SIMBOL4 = /[^\s:\\,a-zA-Z0-9]/;

            if (passwd.match(PATTERN_NUM)) {acceptCount++;}
            if (passwd.match(PATTERN_UPPER_ALPHA)) {acceptCount++;}
            if (passwd.match(PATTERN_LOWER_ALPHA)) {acceptCount++;}
            if (passwd.match(PATTERN_SIMBOL4)) {acceptCount++;}

            if(SecurityCapability_three){
              if (passwd.length < 10)
              {
                if (acceptCount < 3) {return 'Three_Special_Character';}
              }
              else
              {
                if (acceptCount < 2) {return 'Two_Special_Character';}
              }
            }
            else{
              if (acceptCount < 2) {return 'Two_Special_Character';}
            }
            return 0;
          }

          function isValidRule2(value, cnt)
          {
            var result  = 0;
            var checkStr = "";
            var checkAsc = ""; 
            var checkDesc = ""; 
            if(SecurityCapability_three){
              var checkQwerty = "qwertyuiop[]asdfghjklzxcvbnm";
              var checkCapQwerty = "QWERTYUIOP{}ASDFGHJKLZXCVBNM";
              var checkSpecialChar1 = "~!@#$%^";
              var checkSpecialChar2  = "*()_+";
              var seq  = "_" + value.slice(value.length-2,value.length);
            }
            for (var z = 1; z < cnt; z++) 
            {
              checkStr  += "value.charAt(i) == value.charAt(i + " + z + ")";
              checkAsc  += "(value.charCodeAt(i) + " + z + ") == value.charCodeAt(i + " + z + ")";
              checkDesc += "(value.charCodeAt(i) - " + z + ") == value.charCodeAt(i + " + z + ")";
            
              if (z < cnt - 1)
              {
                checkStr  += " && ";
                checkAsc  += " && ";
                checkDesc += " && ";
              }
            }
            for (var i = 0; i < value.length - 2; i++)
            {
               /* jshint ignore:start */
              if(SecurityCapability_three){
                seq = seq.slice(1) + value.charAt(i);
                if (eval(checkStr) || eval(checkAsc) || eval(checkDesc) || checkQwerty.indexOf(seq) > -1 ||
                    checkCapQwerty.indexOf(seq) > -1 || checkSpecialChar1.indexOf(seq) > -1 || checkSpecialChar2.indexOf(seq) > -1)
                {
                  result = 'Same_Character';
                }
              }else{
                if (eval(checkStr) || eval(checkAsc) || eval(checkDesc))
                {
                  result = 'Same_Character';
                }
              }
               /* jshint ignore:end */
            }

            return result;
          }

          var ret = isValidRule1(passwd);
          
          if (0 === ret)
          {
            return isValidRule2(passwd, 3);
          }
          
          return ret;
        }
    });