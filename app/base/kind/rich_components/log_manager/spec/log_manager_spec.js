describe("kindFramework:logManager", function(){
    var LogManager = null;
    var LOGMANAGER_CONFIG = null;
    
    var setTwoLetter = function(data){
        return data.toString().length == 1 ? "0" + data : data;
    };
    
    var getDate = function(){
        var newDate = new Date();
        var year = newDate.getFullYear();
        var month = newDate.getMonth() + 1;
        var day  = newDate.getDate();
        var hour = newDate.getHours();
        var minutes = newDate.getMinutes();
        var seconds = newDate.getSeconds();
        
        month = setTwoLetter(month);
        day = setTwoLetter(day);
        hour = setTwoLetter(hour);
        minutes = setTwoLetter(minutes);
        seconds = setTwoLetter(seconds);
        
        return year + '-' + month + '-' + day + ' ' + hour + ':' + minutes + ':' + seconds;
    };
    
    beforeEach(module("kindFramework"));
    
    beforeEach(inject(function($injector){
        LogManager = $injector.get("LogManager");
        LOGMANAGER_CONFIG = $injector.get("LOGMANAGER_CONFIG");
        
        spyOn(console, 'info');
        spyOn(console, 'error');
        spyOn(console, 'warn');
        spyOn(console, 'debug');
    }));
    
    it("should success console.info", function(){
        var msg = "console.info";
        LogManager.info(msg);
        var loggedMsg = getDate() + ' [INFO] ' + msg;
        
        expect(console.info).toHaveBeenCalledWith(loggedMsg);
    });
    
    it("should success console.error", function(){
        var msg = "console.error";
        LogManager.error(msg);
        var loggedMsg = getDate() + ' [ERROR] ' + msg;
        
        expect(console.error).toHaveBeenCalledWith(loggedMsg);
    });
    
    it("should success console.debug", function(){
        var msg = "console.debug";
        LogManager.debug(msg);
        var loggedMsg = getDate() + ' [DEBUG] ' + msg;
        
        expect(console.debug).toHaveBeenCalledWith(loggedMsg);
    });
    
    it("should success console.warn", function(){
        var msg = "console.warn";
        LogManager.warn(msg);
        var loggedMsg = getDate() + ' [WARN] ' + msg;
        
        expect(console.warn).toHaveBeenCalledWith(loggedMsg);
    });
});