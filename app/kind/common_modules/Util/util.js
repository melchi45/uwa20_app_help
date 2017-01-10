/* jshint bitwise: false */
'use strict';


function error(message) {
    console.error(message);
    console.trace();
}

function assert(condition, message) {
    if (!condition) {
        error(message);
    }
}

function isPowerOfTwo(x) {
    return (x & (x - 1)) === 0;
}

/**
 * Joins a list of lines using a newline separator, not the fastest
 * thing in the world but good enough for initialization code.
 */
function text(lines) {
    return lines.join("\n");
}

/**
 * Rounds up to the next highest power of two.
 */
function nextHighestPowerOfTwo(x) {
    --x;
    for (var i = 1; i < 32; i <<= 1) {
        x = x | x >> i;
    }
    return x + 1;
}

/**
 * Represents a 2-dimensional size value.
 */
function Size(width, height) {
    function Constructor(width, height) {
        Constructor.prototype.w = width;
        Constructor.prototype.h = height;
    }
    Constructor.prototype = {
        toString: function () {
            return "(" + Constructor.prototype.w + ", " + Constructor.prototype.h + ")";
        },
        getHalfSize: function () {
            return new Size(Constructor.prototype.w >>> 1, Constructor.prototype.h >>> 1);
        },
        length: function () {
            return Constructor.prototype.w * Constructor.prototype.h;
        }
    };
    return new Constructor(width, height);
}

/**
 * Creates a new prototype object derived from another objects prototype along with a list of additional properties.
 *
 * @param base object whose prototype to use as the created prototype object's prototype
 * @param properties additional properties to add to the created prototype object
 */
function inherit(base, properties) {
    var prot = Object.create(base.prototype);
    var keyList = Object.keys(properties);
    for (var i = 0; i < keyList.length; i++) {
        prot[keyList[i]] = properties[keyList[i]];
    }
    return prot;
}

function inheritObject(base, properties) {
    var keyList = Object.keys(properties);
    for (var i = 0; i < keyList.length; i++) {
        base[keyList[i]] = properties[keyList[i]];
    }
    return base;
}

function isApp() {
    var isApplication = false;
    if (document.URL.indexOf("http://") === -1 && document.URL.indexOf("https://") === -1) {
        isApplication = true;
    }
    return isApplication;
}

function BrowserDetect() {
    var agent = navigator.userAgent.toLowerCase(),
    name = navigator.appName,
    browser;

    if(name === 'Microsoft Internet Explorer' || agent.indexOf('trident') > -1 || agent.indexOf('edge/') > -1) {
        browser = 'ie';
        if(name === 'Microsoft Internet Explorer') { // IE old version (IE 10 or Lower)
            agent = /msie ([0-9]{1,}[\.0-9]{0,})/.exec(agent);
            browser += parseInt(agent[1]);
        } else { // IE 11+
            if(agent.indexOf('trident') > -1) { // IE 11 
                browser += 11;
            } else if(agent.indexOf('edge/') > -1) { // Edge
                browser = 'edge';
            }
        }
    } else if(agent.indexOf('safari') > -1) { // Chrome or Safari
        if(agent.indexOf('chrome') > -1) { // Chrome
            browser = 'chrome';
        } else { // Safari
            browser = 'safari';
        }
    } else if(agent.indexOf('firefox') > -1) { // Firefox
        browser = 'firefox';
    }

    return browser;
}

function doCapture(data, filename){
    var link = document.createElement('a');        
    var dataAtob = atob( data.substring( "data:image/png;base64,".length ) );
    var asArray = new Uint8Array(dataAtob.length);

    for( var i = 0, len = dataAtob.length; i < len; ++i ) {
        asArray[i] = dataAtob.charCodeAt(i);    
    }

    var blob = new Blob([ asArray.buffer ], {type: "image/png"});
    saveAs(blob, filename + ".png");
}

var base64ArrayBuffer = function (arrayBuffer) {
    var base64 = '';
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    var bytes = new Uint8Array(arrayBuffer);
    var byteLength = bytes.byteLength;
    var byteRemainder = byteLength % 3;
    var mainLength = byteLength - byteRemainder;

    var a, b, c, d;
    var chunk;

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
        d = chunk & 63; // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength];

        a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4; // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '==';
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

        a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2; // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '=';
    }

    return base64;
};

function cloneArray(array) {
  var bs = array.BYTES_PER_ELEMENT, 
      bo = array.byteOffset, 
      n = array.length;
  return new array.constructor(array.buffer.slice(bo, bo + bs*n));
}

function BufferQueue() {
    this.first = null;
    this.size = 0;
}

function BufferNode(buffer) {
    this.buffer = buffer;//new Uint8Array(buffer.length);
//    this.buffer.set(buffer, 0);
    this.previous = null;
    this.next = null;
}

BufferQueue.prototype.enqueue = function(buffer) {
    var node = new BufferNode(buffer);

    if (this.first == null){
        this.first = node;
    } else {
        var n = this.first;
        while (n.next != null) {
            n = n.next;
        }
        n.next = node;
    }

    this.size += 1;
    return node;
};

BufferQueue.prototype.dequeue = function() {
    var temp = null;
    if (this.first != null){
        temp = this.first;
        this.first = this.first.next;
        this.size -= 1;
    }

    return temp;
};

BufferQueue.prototype.clear = function(){
    console.log('BufferQueue clear!');
    var temp = null;
    while (this.first != null) {
        temp = this.first;
        this.first = this.first.next;
        this.size -= 1;
        temp.buffer = null;
        temp = null;
    }

    this.size = 0;
    this.first = null;
};

function BufferList() {
    this._length = 0;
    this.head = null;
    this.tail = null;
    this.curIdx = 0;
}

BufferList.prototype.getCurIdx = function() {
    return this.curIdx;
};

BufferList.prototype.push = function(buffer) {
    var node = new BufferNode(buffer);

    if (this._length > 0) {
        this.tail.next = node;
        node.previous = this.tail;
        this.tail = node;
    } else {
        this.head = node;
        this.tail = node;
    }
    this._length += 1;

    return node;
};

BufferList.prototype.pop = function() {
    var node = null;
    if (this._length > 1){
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
};

BufferList.prototype.pushPop = function(buffer) {
    var node = null;

    if(buffer != null) {
        node = new BufferNode(buffer);
        if (this._length > 0) {
            this.tail.next = node;
            node.previous = this.tail;
            this.tail = node;
        } else {
            this.head = node;
            this.tail = node;
        }
        this._length += 1;
    } else {
        if (this._length > 1){
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
    }

    return node;
};

BufferList.prototype.searchNodeAt = function(position) {
    var currentNode = this.head,
        length = this._length,
        count = 1,
        message = {failure: 'Failure: non-existent node in this list.'};

    // 1st use-case: an invalid position
    if (length === 0 || position < 1 || position > length) {
        throw new Error(message.failure);
    }

    // 2nd use-case: a valid position
    while (count < position) {
        currentNode = currentNode.next;
        count++;
    }
    this.curIdx = count;

    console.log('searchNodeAt curIdx ' + this.curIdx + ' count ' + count + ' _length ' + this._length);

    return currentNode;
};

BufferList.prototype.clear = function(){
    console.log('BufferList clear!');
    var node = this.head;
    var nodeToDelete = null;

    while (node != null) {
        nodeToDelete = node;
        node = node.next;
        nodeToDelete.buffer = null;
        nodeToDelete = null;
    }

    this._length = 0;
    this.head = null;
    this.tail = null;
    this.curIdx = 0;
};

BufferList.prototype.remove = function(position) {
    var currentNode = this.head,
        length = this._length,
        count = 1,
        message = {failure: 'Failure: non-existent node in this list.'},
        beforeNodeToDelete = null,
        nodeToDelete = null,
        afterNodeToDelete = null,
        deletedNode = null;

    // 1st use-case: an invalid position
    if (length === 0 || position < 1 || position > length) {
        throw new Error(message.failure);
    }

    // 2nd use-case: the first node is removed
    if (position === 1) {
        this.head = currentNode.next;

        // 2nd use-case: there is a second node
        if (!this.head) {
            this.head.previous = null;
            // 2nd use-case: there is no second node
        } else {
            this.tail = null;
        }

        // 3rd use-case: the last node is removed
    } else if (position === this._length) {
        this.tail = this.tail.previous;
        this.tail.next = null;
        // 4th use-case: a middle node is removed
    } else {
        while (count < position) {
            currentNode = currentNode.next;
            count++;
        }

        beforeNodeToDelete = currentNode.previous;
        nodeToDelete = currentNode;
        afterNodeToDelete = currentNode.next;

        beforeNodeToDelete.next = afterNodeToDelete;
        afterNodeToDelete.previous = beforeNodeToDelete;
        deletedNode = nodeToDelete;
        nodeToDelete = null;
    }

    this._length--;

    return message.success;
};

BufferList.prototype.removeTillCurrent = function() {
    var currentNode,
      count = 1,
      message = {failure: 'Failure: non-existent node in this list.'};

    while (count < this.curIdx ) {
        currentNode = this.pop();
        if(currentNode != null) {
            delete currentNode.buffer;
            currentNode.buffer = null;
            currentNode.previous = null;
            currentNode.next = null;
        }
        count++;
    }

    console.log('removeTillCurrent curIdx ' + this.curIdx + ' count ' + count + ' _length ' + this._length);
};

/**
 * Create a new object pool of a certain class
 */
var BufferPool = function(size) {
  // metrics for tracking internals
  this.metrics = {};
  this._clearMetrics();
  // [private] the objpool stack
  this._objpool = [];
  this.bufferSize = size;
};

/**
 * Allocate a new object from the pool
 * @return the object
 */
BufferPool.prototype.alloc = function alloc() {
  var obj;
  if (this._objpool.length == 0) {
    // nothing in the free list, so allocate a new object
    obj = new Uint8Array(this.bufferSize);
    this.metrics.totalalloc++;
  } else {
    // grab one from the top of the objpool
    obj = this._objpool.pop();
    this.metrics.totalfree--;
  }
  return obj;
};

/**
 * Return an object to the object pool
 */
BufferPool.prototype.free = function(obj) {
  var k;
  // fix up the free list pointers
  if(obj.length > 0)
    console.log('It is not zero length = ' + obj.length);
  else
    return;

  this._objpool.push(obj);
  this.metrics.totalfree++;
};

/**
 * Allow collection of all objects in the pool
 */
BufferPool.prototype.collect = function(cls) {
  // just forget the list and let the garbage collector reap them
  this._objpool = []; // fresh and new
  // but we might have allocated objects that are in use/not in
  // the pool--track them in the metrics:
  var inUse = this.metrics.totalalloc - this.metrics.totalfree;
  this._clearMetrics(inUse);
};

/**
 * [private] Clear internal metrics
 */
BufferPool.prototype._clearMetrics = function(allocated) {
  this.metrics.totalalloc = allocated || 0;
  this.metrics.totalfree = 0;
};

/**
 * Create a new image pool of a certain class
 */
var ImagePool = function() {
    // metrics for tracking internals
    this.metrics = {};
    this._clearMetrics();
    // [private] the objpool stack
    this._objpool = [];
};

/**
 * Allocate a new object from the pool
 * @return the object
 */
ImagePool.prototype.alloc = function alloc() {
    var obj;
    if (this._objpool.length == 0) {
        // nothing in the free list, so allocate a new object
        obj = new Image();
        this.metrics.totalalloc++;
    } else {
        // grab one from the top of the objpool
        obj = this._objpool.pop();
        this.metrics.totalfree--;
    }
    return obj;
};

/**
 * Return an object to the object pool
 */
ImagePool.prototype.free = function(obj) {
    var k;
    // fix up the free list pointers
    if(obj.length > 0)
        console.log('It is not zero length = ' + obj.length);
    else
        return;

    this._objpool.push(obj);
    this.metrics.totalfree++;
};

/**
 * Allow collection of all objects in the pool
 */
ImagePool.prototype.collect = function(cls) {
    // just forget the list and let the garbage collector reap them
    this._objpool = []; // fresh and new
    // but we might have allocated objects that are in use/not in
    // the pool--track them in the metrics:
    var inUse = this.metrics.totalalloc - this.metrics.totalfree;
    this._clearMetrics(inUse);
};

/**
 * [private] Clear internal metrics
 */
ImagePool.prototype._clearMetrics = function(allocated) {
    this.metrics.totalalloc = allocated || 0;
    this.metrics.totalfree = 0;
};
