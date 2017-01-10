var DigestGenerator = function () {
    var module = {};

    module.formulateResponse = function (username, password, url, realm, method, nonce) {
        var HA1 = CryptoJS.MD5(username + ':' + realm + ':' + password).toString();
        var HA2 = CryptoJS.MD5(method + ':' + url).toString();
        var response = CryptoJS.MD5(HA1 + ':' + nonce + ':' + HA2).toString();
        return response;
    };

    module.getDigestInfoInWwwAuthenticate = function (wwwAuthenticate) {
        var digestHeaders = wwwAuthenticate;
        var realm = null;
        var nonce = null;

        if (digestHeaders !== null) {
            digestHeaders = digestHeaders.split(',');

            for (var i = 0; i < digestHeaders.length; i++) {
                var keyVal = digestHeaders[i].split('=');
                var key = keyVal[0];
                var val = keyVal[1].replace(/\"/g, '').trim();

                if (key.match(/realm/i) !== null) {
                    realm = val;
                }

                if (key.match(/nonce/i) !== null) {
                    nonce = val;
                }
            }
        }

        return {
            "realm": realm,
            "nonce": nonce,
        };
    };
    
    return module;
};