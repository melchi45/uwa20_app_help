/**
 * Created by dohyuns.kim on 2016-10-04.
 */
"use strict";

var frameTimestamp = null;
var videoBufferNode = (function () {
  var width, height, codecType, frameType, timeStamp;

  function Constructor(data, width, height, codecType, frameType, timeStamp) {
    BufferNode.call(this, data);
    this.width = width;
    this.height = height;
    this.codecType = codecType;
    this.frameType = frameType;
    this.timeStamp = timeStamp;
  }

  return Constructor;
})();

function VideoBufferList() {
  var MAX_LENGTH,
      BUFFERING = 240,
      bufferFullCallback;

  function Constructor() {
      BufferList.call(this);
      MAX_LENGTH = 360;
      BUFFERING = 240;
      bufferFullCallback = null;
      frameTimestamp = null;
  }

  Constructor.prototype = inherit(BufferList, {
    push: function (data, width, height, codecType, frameType, timeStamp) {
      var node = new videoBufferNode(data, width, height, codecType, frameType, timeStamp);
      if (this._length > 0) {
        this.tail.next = node;
        node.previous = this.tail;
        this.tail = node;
      } else {
        this.head = node;
        this.tail = node;
      }
      this._length += 1;

      (bufferFullCallback != null && this._length >= BUFFERING) ? bufferFullCallback() : 0;//PLAYBACK bufferFull
//      console.log("VideoBufferList after push node count is " + this._length + " frameType is " + frameType);

      return node;
    },
    pop: function () {
//    console.log("before pop node count is " + this._length + " MINBUFFER is " + MINBUFFER);
      var node = null;

      if (this._length > 1) {
        node = this.head;
        this.head = this.head.next;
        if (this.head != null) {
          this.head.previous = null;
          // 2nd use-case: there is no second node
        } else {
          this.tail = null;
        }
        this._length -= 1;
      }
      return node;
    },
    setMaxLength: function (length) {
      MAX_LENGTH = length;
      if(MAX_LENGTH > 360)
        MAX_LENGTH = 360;
      else if(MAX_LENGTH < 30)
        MAX_LENGTH = 30;
    },
    setBUFFERING: function (interval) {
      BUFFERING = interval;
      if(BUFFERING > 240)
        BUFFERING = 240;
      else if(BUFFERING < 20)
        BUFFERING = 20;
    },
    setBufferFullCallback: function (callback) {
      bufferFullCallback = callback;
      // console.log("setBufferFullCallback MAX_LENGTH is " + MAX_LENGTH );
    },
    searchTimestamp: function (frameTimestamp) {
//      console.log("searchTimestamp frameTimestamp = " + frameTimestamp.timestamp + " frameTimestamp usec = " + frameTimestamp.timestamp_usec);
      var currentNode = this.head,
        length = this._length,
        count = 1,
        message = {failure: 'Failure: non-existent node in this list.'};

      // 1st use-case: an invalid position
      if (length === 0 || frameTimestamp <= 0 || currentNode == null) {
        throw new Error(message.failure);
      }

      // 2nd use-case: a valid position
      while (currentNode!=null && (currentNode.timeStamp.timestamp != frameTimestamp.timestamp || currentNode.timeStamp.timestamp_usec != frameTimestamp.timestamp_usec)) {
//        console.log("currentNode Timestamp = " + currentNode.timeStamp.timestamp + " Timestamp usec = " + currentNode.timeStamp.timestamp_usec);
        currentNode = currentNode.next;
        count++;
      }

      if (length < count) {
        currentNode = null;
      } else {
        this.curIdx = count;
        // console.log("searchTimestamp curIdx = " + this.curIdx + " currentNode.timeStamp.timestamp = " + currentNode.timeStamp.timestamp + " currentNode.timestamp_usec = " + currentNode.timeStamp.timestamp_usec + " frameTimestamp = " + frameTimestamp.timestamp + " frameTimestamp usec = " + frameTimestamp.timestamp_usec);
      }

      return currentNode;
    },
    findIFrame: function (isForward) {
      var currentNode = this.head,
          length = this._length,
          count = 1,
          message = {failure: 'Failure: non-existent node in this list.'};

      // 1st use-case: an invalid position
      if (length === 0 ) {
        throw new Error(message.failure);
      }

      // 2nd use-case: a valid position
      while (count < this.curIdx) {
        currentNode = currentNode.next;
        count++;
      }

      if(isForward === true) {
        while (currentNode.frameType !== "I" ){
          currentNode = currentNode.next;
          count++;
        }
      } else {
        while (currentNode.frameType !== "I" ){
          currentNode = currentNode.previous;
          count--;
        }
      }

      if (length < count) {
        currentNode = null;
      } else {
        this.curIdx = count;
        // console.log('findIFrame curIdx ' + this.curIdx + ' count ' + count + ' _length ' + this._length);
      }

      return currentNode;
    }
  });
  return new Constructor();
}


