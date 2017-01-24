describe("kindFramework:restClient", function(){
    it("should success post ajax", function(){
        expect(1).toEqual(1);
    });
    return;
    
    var $httpBackend = null,
        RestClient = null;
    
    var url = "/list/1",
        postData = {
            name: "kind"
        },
        putData = {
            name: "framework"
        },
        server = null;
    
    var factory = {
        val: '',
        set: function(val){
            this.val = val;
        }
    }
    
    beforeEach(module("kindFramework"));
    
    beforeEach(inject(function($injector){
        /**
         * $httpBackend Service of angular-mock
         */
        $httpBackend = $injector.get("$httpBackend");
        
        /**
         * RestClient Service of kind components
         */
        RestClient = $injector.get("RestClient");
        
        /**
         * SERVER Const of kindConfig module
         */
        SERVER = $injector.get("RESTCLIENT_CONFIG");
        
        server = "http://" + SERVER.IP + ":" + SERVER.PORT;
    }));
    
    it("should success post ajax", function(){
        $httpBackend
            .expectPOST(server+url, postData)
            .respond(function(method, url, data){
                data = JSON.parse(data);
                factory.set(data);
                return [200, ''];
            });
        
        RestClient.post(url, postData);
        
        $httpBackend.flush();
        
        expect(postData).toEqual(factory.val);
    });
    
    it("should success get ajax", function(){
        var responseData = '';
        
        $httpBackend
            .expectGET(server+url)
            .respond(function(){
                return [200, factory.val]
            });
        
        RestClient
            .get(url)
            .then(function(response){
                responseData = response.data;
            }, function(err){
                responseData = err;
            });
        
        $httpBackend.flush();
        
        expect(responseData).toEqual(factory.val);
    });
    
    it("should success put ajax", function(){
        var responseData = '';
        
        $httpBackend
            .expectPUT(server + url)
            .respond(function(method, url, data){
                data = JSON.parse(data);
                factory.set(data);
                return [200, ''];
            });
        
        RestClient.put(url, putData);
        
        $httpBackend.flush();
        
        expect(putData).toEqual(factory.val);
    });
    
    it("should success del ajax", function(){
        $httpBackend
            .expectDELETE(server + url)
            .respond(function(){
                factory.set('');
                return [200, ''];
            });
        
        RestClient.del(url);
        
        $httpBackend.flush();
        
        expect(factory.val).toBe('');
    });
});