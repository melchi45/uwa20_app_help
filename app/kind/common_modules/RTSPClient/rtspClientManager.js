var RtspClientManager = (function(){
              var rtspManagerInstance; 
              var createRtspClientManager = function(){
                         var RtspClientList = [];

                         var CreateRtspClient = function(){
                             var newRtspClient = RtspClient();
                              RtspClientList.push(newRtspClient);
                              return RtspClient;
                         };

                         var DeleteRtspClient = function(rtspclient){
                                 if((idx = RtspClientList.indexOf(rtspclient)) !== -1)
                                 {
                                    RtspClientList.splice(idx,1);
                                 }
                         };

                         var GetRtspClientCount = function(){
                            return RtspClientList.length;
                         };

                         return {
                                CreateRtspClient: CreateRtspClient,
                                DeleteRtspClient: DeleteRtspClient,
                                GetRtspClientCount: GetRtspClientCount
                         };
              };
 
              return {
                    getInstance: function(){
                          if(!rtspManagerInstance){
                              rtspManagerInstance = createRtspClientManager(); 
                          }
                          return rtspManagerInstance; 
                    }
              };
})();


// Example Can use this like below,
//var RtspClientMgr = RtspClientManager.getInstance();
//var RtspClientInst = RtspClientMgr.CreateRtspClient();