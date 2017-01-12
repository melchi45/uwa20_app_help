"use strict"; 
/** 
 *  @const
 */

function MetaDataParser(callback) {
  var updateEvent = null;

  function Constructor() {
    updateEvent = callback;
  }
  /*
  app/exe/main/event/event.cpp

  MAKE_TIMESTAMP(metadata->ptz.tv);
      ADD("<tt:PTZ>");
      ADD(    "<tt:PTZStatus>"
                  "<tt:Position>"
                      "<tt:PanTilt x=\"%f\" y=\"%f\"/>"
                      "<tt:Zoom x=\"%f\"/>"
                  "</tt:Position>",
              metadata->ptz.panPosition, metadata->ptz.tiltPosition, metadata->ptz.zoomPosition);
      ADD(        "<tt:MoveStatus>"
                      "<tt:PanTilt>%s</tt:PanTilt>"
                      "<tt:Zoom>%s</tt:Zoom>"
                  "</tt:MoveStatus>", metadata->ptz.moveStatus.panTilt, metadata->ptz.moveStatus.zoom);
      ADD(        "<tt:UtcTime>%s</tt:UtcTime>", timestamp);
      ADD(    "</tt:PTZStatus>");
      ADD("</tt:PTZ>");
  }
  */
  function extractPTZMetadata(nodes) {
    var data = {};
    for(var i=0; i<nodes.length; i++)
    {
      if(nodes[i].nodeName === "tt:PTZ") {
        var firstNodes = nodes[i].childNodes;
        for(var j=0; j<firstNodes.length; j++)
        {
          if(firstNodes[j].nodeName === "tt:PTZStatus")
          {
            var secondNodes = firstNodes[j].childNodes;
            for(var k=0; k<secondNodes.length; k++)
            {
              if(secondNodes[k].nodeName === "tt:MoveStatus")
              {
                var thirdNodes = secondNodes[k].childNodes;
                for(var l=0; l<thirdNodes.length; l++)
                {
                  if(thirdNodes[l].nodeName === "tt:PanTilt")
                  {
                    data = {
                      "type": "MoveStatus:PanTilt",
                      "value" : thirdNodes[l].childNodes[0].nodeValue
                    };
                    updateEvent(data);
                    continue;
                  }

                  if(thirdNodes[l].nodeName === "tt:Zoom")
                  {
                    data = {
                      "type": "MoveStatus:Zoom",
                      "value" : thirdNodes[l].childNodes[0].nodeValue
                    };
                    updateEvent(data);
                    continue;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  //<wsnt:Topic xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2" Dialect="http://www.onvif.org/ver10/tev/topicExpression/ConcreteSet">tns1:VideoAnalytics/tnssamsung:MotionDetection</wsnt:Topic>
  //<wsnt:Message xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2">
  //     <tt:Message xmlns:tt="http://www.onvif.org/ver10/schema" UtcTime="2000-01-06T23:24:25.472Z" PropertyOperation="Changed">
  //         <tt:Source>
  //             <tt:SimpleItem Name="VideoSourceToken" Value="85a593ef-e6e0-4e40-9e3d-f4252623e776"/>
  //         </tt:Source>
  //         <tt:Key>
  //             <tt:SimpleItemDescription Name="ROIID" Value="0"/>
  //         </tt:Key>
  //         <tt:Data>
  //             <tt:SimpleItem Name="State" Value="false"/>
  //         </tt:Data>
  //     </tt:Message>
  // </wsnt:Message>

  function extractEventMetadata(nodes) { // MetaDataNodes
    var data = {};
    var type = null;
    var dataList = [];

    for(var i=0; i<nodes.length; i++){
      if(nodes[i].nodeName === "tt:Event") { // event cases
        var firstNodes = nodes[i].childNodes;
        for(var j=0; j<firstNodes.length; j++)
        {
          var secondNodes = firstNodes[j].childNodes;
          var topicXml = secondNodes[0];

          var messageXml = secondNodes[1].childNodes[0].childNodes;
          var eventName = topicXml.childNodes[0].nodeValue;

          switch(eventName){
            case "tns1:Device/tns1:Trigger/tns1:DigitalInput" : 
            case "tns1:Device/tns1:Trigger/tnssamsung:DigitalInput" :
              eventName = "DigitalInput"; break;
            case "tns1:VideoSource/tnssamsung:FaceDetection"  : 
              eventName = "FaceDetection"; break;
            case "tns1:VideoSource/ImageTooBlurry/ImagingService" :
            case "tns1:VideoSource/tnssamsung:DefocusDetection" :
              eventName = "DefocusDetection"; break;
            case "tns1:VideoSource/ImageTooBright/ImagingService" : 
            case "tns1:VideoSource/tnssamsung:Fog" :
              eventName = "Fog"; break;
            case "tns1:RuleEngine/MotionRegionDetector/Motion" : 
            case "tns1:VideoAnalytics/tnssamsung:MotionDetection" :
              eventName = "MotionDetection"; break;
            case "tns1:VideoAnalytics/tnssamsung:VideoAnalytics" :
              eventName = "VideoAnalytics"; break;
            case "tns1:VideoSource/GlobalSceneChange/ImagingService" :
            case "tns1:VideoAnalytics/tnssamsung:Tampering" :
              eventName = "TamperingDetection"; break;
            case "tns1:AudioSource/tnssamsung:AudioDetection" : 
              eventName = "AudioDetection"; break;
            case "tns1:Device/tns1:Trigger/tns1:Relay" : 
              eventName = "Relay"; break;
            case "tns1:VideoSource/tnssamsung:DigitalAutoTracking" : 
              eventName = "DigitalAutoTracking"; break;
            case "tns1:AudioAnalytics/Audio/DetectedSound" :
              eventName = "SoundClassification"; break;
            default :
              eventName = "Unknown Event";
          }

          var value = null;
          var eventId = null;
          for(var a=0; a < messageXml.length; a++){
            if(messageXml[a].nodeName == "tt:Source"){
              if (messageXml[a].childNodes[0] !== undefined) {
                var nodeValue = messageXml[a].childNodes[0].getAttribute("Value").split('-');
                eventId = nodeValue[1];
              } else if(messageXml[a].childNodes[1] !== undefined){
                eventId = messageXml[a].childNodes[1].getAttribute("Value");
              }
            }
            if(messageXml[a].nodeName == "tt:Data"){
              value = messageXml[a].childNodes[0].getAttribute("Value");
              if(eventName === "SoundClassification"){
                eventId = messageXml[a].childNodes[2].getAttribute("Value");
              }
            }
          }

          if(value !== null || value !== undefined){
            if(value == "inactive" || value == "false"){
              value = "false";
            }else{
              value = "true";
            }
          }

          data = {
            "id":1,
            "type": eventName,
            "value": value,
            "eventId": eventId,
          };

          dataList.push(data);
        }
      } else if(nodes[i].nodeName === "tt:VideoAnalytics") {
        var firstNodes = nodes[i].childNodes; // tt:frame
        var secondNodes = firstNodes[0].childNodes;
        var transformationNode = secondNodes[0];
        var objectLength = secondNodes.length;

        if(secondNodes[objectLength - 1].nodeName === "tt:Extension") {
          if(secondNodes[objectLength - 1].childNodes[0].nodeName === "tnssamsung:DigitalAutoTracking") {
            objectLength = objectLength - 2;
          }
        }

        for(var k = 1; k < objectLength; k++) {
          var objectNode = secondNodes[k];
          if(objectNode.attributes.length !== 0) {
            var appearanceNode = objectNode.childNodes[0];
            var classNode = appearanceNode.childNodes[1];
            var shapeNode = appearanceNode.childNodes[0];
            var translateNode = transformationNode.childNodes[0];
            var translate = [parseFloat(translateNode.getAttribute('x')), parseFloat(translateNode.getAttribute('y'))];
            var scaleNode = transformationNode.childNodes[1];
            var scale = [parseFloat(scaleNode.getAttribute('x')), parseFloat(scaleNode.getAttribute('y'))];
            var boundingBox = shapeNode.childNodes[0];
            var coordinates = [parseFloat(boundingBox.getAttribute('left')), parseFloat(boundingBox.getAttribute('right')), parseFloat(boundingBox.getAttribute('top')), parseFloat(boundingBox.getAttribute('bottom'))];
            var type;
            if(classNode === undefined){
              type = 'VideoAnalytics';
            } else {
              type = 'FaceDetection';
            }
            if(nodes[0].nodeName === "tt:VideoAnalytics" && nodes.length === 2) {
              data = {
                "id":2,
                "scale": scale,
                "translate": translate,
                "coordinates": coordinates,
                "type": type,
                "color": 0,
              };
            } else {
              if(type === 'FaceDetection') {
                data = {
                  "id":2,
                  "scale": scale,
                  "translate": translate,
                  "coordinates": coordinates,
                  "type": type,
                  "color": 0,
                };
              } else {
                data = {
                  "id":2,
                  "scale": scale,
                  "translate": translate,
                  "coordinates": coordinates,
                  "type": type,
                  "color": 1,
                };
              }
            }
            dataList.push(data);
          }          
        }
      }
    }
    updateEvent(dataList, true);
  }

  Constructor.prototype = {
    parse: function(metaData) {
      var MetaDataNodes = null;
      try{
        var receiveMsg = String.fromCharCode.apply(null, metaData);
        
        if(receiveMsg.indexOf("<?xml") !== -1){
          var xmlDoc = $.parseXML(receiveMsg);
          MetaDataNodes = xmlDoc.documentElement.childNodes;
        }
        xmlDoc = null;
      }catch(e){
        //console.log(e);
        return false;
      }
      
      if(MetaDataNodes !== null){
        try{
          extractPTZMetadata(MetaDataNodes);
          extractEventMetadata(MetaDataNodes);
        }catch(e){
        }
      }
    }
  };
  return new Constructor();
}