kindFramework
    .service('SessionOfUserManager', function($rootScope, ROUTE_CONFIG,RESTCLIENT_CONFIG,$cookies,$cookieStore,$window,$location){
        "use strict";

        var username;
        var password;
        var serviceType;
        var loggedin = false;
        var IsWMF = false;
        var loginSuccess = false;



        var getUsername = function(){
            return username;
        };

        var getPassword = function(){
            return password;
        };

        var getServiceType = function(){
          return serviceType;
        };

        var AddSession = function(usrname, passwd, type){
            username = usrname;
            password = passwd;
            serviceType = type;
        };

        var RemoveSession = function(){
           username = null;
           password = null;
        };

        var CheckPlugin = function() {
          if ($window.sessionStorage !== undefined) {
            if ( !$window.sessionStorage.isPlugin && $location.$$search.isPlugin === '1' ) {
                $window.sessionStorage.isPlugin = true;
            }
          }
          return IsPlugin(); // jshint ignore:line
        };

				var IsPlugin = function(){
          if ($window.sessionStorage !== undefined) {
            return $window.sessionStorage.isPlugin ? true : false;
          } else {
            return false;
          }

				};

        var SetLogin = function()
        {
            var restClientConfig = RESTCLIENT_CONFIG.digest;
          if (RESTCLIENT_CONFIG.serverType === 'camera')
          {
          restClientConfig.hostName = window.location.hostname;
          }

            var Authen= {};
            Authen.username = username;
            Authen.password = password;
            Authen.isWMF = true;

            /* Commenting encryption temporarily till old web implements cookie encryption
             * var IPHash = CryptoJS.MD5(restClientConfig.hostName).toString();
             * var authstr = JSON.stringify(Authen);
             * var encAuth = CryptoJS.AES.encrypt(authstr,IPHash).toString();
             * $cookieStore.put(restClientConfig.hostName,encAuth);
            */
             if (RESTCLIENT_CONFIG.serverType !== 'camera')
             {
                $cookieStore.put(restClientConfig.hostName,Authen);
             }
            IsWMF = true;
            loggedin = true;

            /* Create cookie 'isNonPlugin'
             * So that apply setup style as white through Universal menu to old webviewer
             * If linked from Universal setup, isNonPlugin = 1
             * Old webviewer dark style will be changed to white
             */
            //$cookieStore.put('isNonPlugin', 1);
            //console.log("Create cookie : isNonPlugin");
        };

        var UnSetLogin = function()
        {
            loggedin = false;
            var restClientConfig = RESTCLIENT_CONFIG.digest;
            if (RESTCLIENT_CONFIG.serverType === 'camera')
             {
                restClientConfig.hostName = window.location.hostname;
             }

             if (RESTCLIENT_CONFIG.serverType !== 'camera')
             {
               $cookieStore.remove(restClientConfig.hostName);
              }

            /* Destroy cookie 'isNonPlugin'
             * Will be removed sesseion close or logout
             */
            //$cookieStore.remove('isNonPlugin');
            //console.log("Remove cookie : isNonPlugin");
        };

        var IsLoggedin = function()
        {
            if(loggedin === false)
            {
            var Authen;
            var restClientConfig = RESTCLIENT_CONFIG.digest;
            if (RESTCLIENT_CONFIG.serverType === 'camera')
             {
                restClientConfig.hostName = window.location.hostname;
             }
            Authen = $cookieStore.get(restClientConfig.hostName);
            if(typeof Authen !== 'undefined')
            {
               /* Commenting encryption temporarily till old web implements cookie encryption*/
              /*var IPHash = CryptoJS.MD5(restClientConfig.hostName).toString();
              var decres = CryptoJS.AES.decrypt(Authen,IPHash);
              var AuthenNW;
              try{
                 AuthenNW = JSON.parse(decres.toString(CryptoJS.enc.Utf8));
              }
              catch(e)
              {
                 loggedin = false;
                 return loggedin;
              }
              */
              var AuthenNW = Authen;

               if(typeof AuthenNW.username  !== 'undefined')
               {
                 username = AuthenNW.username;
               }
               if(typeof AuthenNW.password  !== 'undefined')
               {
                 password = AuthenNW.password;
               }

               if(typeof AuthenNW.isWMF  !== 'undefined')
               {
                 IsWMF = AuthenNW.isWMF;
               }

               loggedin = true;
               loginSuccess = true;
            }
          }

            return loggedin;
        };

        var IsWMFApp = function()
        {
            return IsWMF;
        };

        var IsLoginSuccess = function()
        {
          return loginSuccess;
        };

        var MarkLoginSuccess = function()
        {
          loginSuccess = true;
        };

        var UnMarkLoginSuccess = function()
        {
          loginSuccess = false;
        };

        var SetClientIPAddress = function( clientAddr)
        {
          var restClientConfig = RESTCLIENT_CONFIG.digest;
          restClientConfig.ClientIPAddress = clientAddr;
        };

        var GetClientIPAddress = function()
        {
          var restClientConfig = RESTCLIENT_CONFIG.digest;
          return restClientConfig.ClientIPAddress;
        };



        this.getUsername = getUsername;
        this.getPassword = getPassword;
        this.AddSession = AddSession;
        this.RemoveSession = RemoveSession;
        this.SetLogin = SetLogin;
        this.UnSetLogin = UnSetLogin;
        this.IsLoggedin = IsLoggedin;
        this.IsPlugin = IsPlugin;
        this.CheckPlugin = CheckPlugin;
        this.IsWMFApp = IsWMFApp;
        this.IsLoginSuccess = IsLoginSuccess;
        this.MarkLoginSuccess = MarkLoginSuccess;
        this.UnMarkLoginSuccess = UnMarkLoginSuccess;
        this.SetClientIPAddress = SetClientIPAddress;
        this.GetClientIPAddress = GetClientIPAddress;

    });