(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//==================================================//
//                                                  //
//      jsTrails (v0.0.1)                           //
//      javascript library for data provenance      //
//      @author Chaitanya Chandurkar                //
//      @since Sept, 2015                           //
//                                                  //
//==================================================//

// ----------------------------------------------------------------------- //
// Terms used in this library:                                             //
// ----------------------------------------------------------------------- //
//                                                                         //
// 1. User          - The person who is using the library to develop       //
//                    the app and not the end-user who is using that app.  //
//                                                                         //
// 2. Developer     - The person who is using the library to develop       //
//                    the app and not the one who developed this one.      //
//                                                                         //
// ----------------------------------------------------------------------- //

var Trail = require('./src/js/');

/**
 * Module that wraps the functionality in `jstrails` namespace. An
 * exported `jstrail` keyword is an instance of JsTrails.
 * @module jstrail
 */
module.exports = jstrails = (function() {

  // ------------------------------
  // Basic Setup
  // ------------------------------

  /**
   * jsTrails functionality is wrapped in a contextual function and
   * instance of jsTrails is returned.
   */
  var JsTrails = function() {

    // ------------------------------
    // Fields
    // ------------------------------

    /**
     * Backs up the old `jstrail` global instance for the sake of non
     * conflicts.
     * @type {JsTrails}
     */
    var _jstrails = window.jstrails || {};

    /**
     * Hold `this` instance. Using `jstrails.methodName` looks more intuitive
     * than using `this.methodName`.
     * @type {JsTrails}
     */
    var jstrails = this;

    // ------------------------------
    // Methods
    // ------------------------------

    /**
     * Creates a master trails
     * @return {Trail} - Master trail from which sub-trails can be created to watch over events.
     */
    jstrails.create = function() {
      return new Trail();
    };

  };

  // ------------------------------
  // Non Conflict
  // ------------------------------

  return new JsTrails();

}());
},{"./src/js/":35}],2:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],3:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    this.length = 0
    this.parent = undefined
  }

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
} else {
  // pre-set for values that may exist in the future
  Buffer.prototype.length = undefined
  Buffer.prototype.parent = undefined
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":2,"ieee754":11,"isarray":4}],4:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],5:[function(require,module,exports){
(function (Buffer){
var clone = (function() {
'use strict';

/**
 * Clones (copies) an Object using deep copying.
 *
 * This function supports circular references by default, but if you are certain
 * there are no circular references in your object, you can save some CPU time
 * by calling clone(obj, false).
 *
 * Caution: if `circular` is false and `parent` contains circular references,
 * your program may enter an infinite loop and crash.
 *
 * @param `parent` - the object to be cloned
 * @param `circular` - set to true if the object to be cloned may contain
 *    circular references. (optional - true by default)
 * @param `depth` - set to a number if the object is only to be cloned to
 *    a particular depth. (optional - defaults to Infinity)
 * @param `prototype` - sets the prototype to be used when cloning an object.
 *    (optional - defaults to parent prototype).
*/
function clone(parent, circular, depth, prototype) {
  var filter;
  if (typeof circular === 'object') {
    depth = circular.depth;
    prototype = circular.prototype;
    filter = circular.filter;
    circular = circular.circular
  }
  // maintain two arrays for circular references, where corresponding parents
  // and children have the same index
  var allParents = [];
  var allChildren = [];

  var useBuffer = typeof Buffer != 'undefined';

  if (typeof circular == 'undefined')
    circular = true;

  if (typeof depth == 'undefined')
    depth = Infinity;

  // recurse this function so we don't reset allParents and allChildren
  function _clone(parent, depth) {
    // cloning null always returns null
    if (parent === null)
      return null;

    if (depth == 0)
      return parent;

    var child;
    var proto;
    if (typeof parent != 'object') {
      return parent;
    }

    if (clone.__isArray(parent)) {
      child = [];
    } else if (clone.__isRegExp(parent)) {
      child = new RegExp(parent.source, __getRegExpFlags(parent));
      if (parent.lastIndex) child.lastIndex = parent.lastIndex;
    } else if (clone.__isDate(parent)) {
      child = new Date(parent.getTime());
    } else if (useBuffer && Buffer.isBuffer(parent)) {
      child = new Buffer(parent.length);
      parent.copy(child);
      return child;
    } else {
      if (typeof prototype == 'undefined') {
        proto = Object.getPrototypeOf(parent);
        child = Object.create(proto);
      }
      else {
        child = Object.create(prototype);
        proto = prototype;
      }
    }

    if (circular) {
      var index = allParents.indexOf(parent);

      if (index != -1) {
        return allChildren[index];
      }
      allParents.push(parent);
      allChildren.push(child);
    }

    for (var i in parent) {
      var attrs;
      if (proto) {
        attrs = Object.getOwnPropertyDescriptor(proto, i);
      }

      if (attrs && attrs.set == null) {
        continue;
      }
      child[i] = _clone(parent[i], depth - 1);
    }

    return child;
  }

  return _clone(parent, depth);
}

/**
 * Simple flat clone using prototype, accepts only objects, usefull for property
 * override on FLAT configuration object (no nested props).
 *
 * USE WITH CAUTION! This may not behave as you wish if you do not know how this
 * works.
 */
clone.clonePrototype = function clonePrototype(parent) {
  if (parent === null)
    return null;

  var c = function () {};
  c.prototype = parent;
  return new c();
};

// private utility functions

function __objToStr(o) {
  return Object.prototype.toString.call(o);
};
clone.__objToStr = __objToStr;

function __isDate(o) {
  return typeof o === 'object' && __objToStr(o) === '[object Date]';
};
clone.__isDate = __isDate;

function __isArray(o) {
  return typeof o === 'object' && __objToStr(o) === '[object Array]';
};
clone.__isArray = __isArray;

function __isRegExp(o) {
  return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
};
clone.__isRegExp = __isRegExp;

function __getRegExpFlags(re) {
  var flags = '';
  if (re.global) flags += 'g';
  if (re.ignoreCase) flags += 'i';
  if (re.multiline) flags += 'm';
  return flags;
};
clone.__getRegExpFlags = __getRegExpFlags;

return clone;
})();

if (typeof module === 'object' && module.exports) {
  module.exports = clone;
}

}).call(this,require("buffer").Buffer)
},{"buffer":3}],6:[function(require,module,exports){
var Tree = require('./src/tree');
module.exports = dataTree = (function(){
  return {
    create: function(){
      return new Tree();
    }
  };
}());

},{"./src/tree":9}],7:[function(require,module,exports){

module.exports = (function(){

  // Flag bad practises
  'use strict';

  // ------------------------------------
  // Basic Setup
  // ------------------------------------

  /**
   * @class Traverser
   * @constructor
   * @classdesc Represents a traverser which searches/traverses the tree in BFS and DFS fashion.
   * @param tree - {@link Tree} that has to be traversed or search.
   */
  function Traverser(tree){

    if(!tree)
    throw new Error('Could not find a tree that is to be traversed');

    /**
     * Represents the {@link Tree} which has to be traversed.
     *
     * @property _tree
     * @type {object}
     * @default "null"
     */
    this._tree = tree;

  }

  // ------------------------------------
  // Methods
  // ------------------------------------

  /**
   * Searches a tree in DFS fashion. Requires a search criteria to be provided.
   *
   * @method searchDFS
   * @memberof Traverser
   * @instance
   * @param {function} criteria - MUST BE a callback function that specifies the search criteria.
   * Criteria callback here receives {@link TreeNode#_data} in parameter and MUST return boolean
   * indicating whether that data satisfies your criteria.
   * @return {object} - first {@link TreeNode} in tree that matches the given criteria.
   * @example
   * // Search DFS
   * var node = tree.traverser().searchDFS(function(data){
   *  return data.key === '#greenapple';
   * });
   */
  Traverser.prototype.searchDFS = function(criteria){

    // Hold the node when found
    var foundNode = null;

    // Find node recursively
    (function recur(node){
      if(node.matchCriteria(criteria)){
        foundNode = node;
        return foundNode;
      } else {
        node._childNodes.some(recur);
      }
    }(this._tree._rootNode));

    return foundNode;
  };

  /**
   * Searches a tree in BFS fashion. Requires a search criteria to be provided.
   *
   * @method searchBFS
   * @memberof Traverser
   * @instance
   * @param {function} criteria - MUST BE a callback function that specifies the search criteria.
   * Criteria callback here receives {@link TreeNode#_data} in parameter and MUST return boolean
   * indicating whether that data satisfies your criteria.
   * @return {object} - first {@link TreeNode} in tree that matches the given criteria.
   * @example
   * // Search BFS
   * var node = tree.traverser().searchBFS(function(data){
   *  return data.key === '#greenapple';
   * });
   */
  Traverser.prototype.searchBFS = function(criteria){

    // Hold the node when found
    var foundNode = null;

    // Find nodes recursively
    (function expand(queue){
      while(queue.length){
        var current = queue.splice(0, 1)[0];
        if(current.matchCriteria(criteria)){
          foundNode = current;
          return;
        }
        current._childNodes.forEach(function(_child){
          queue.push(_child);
        });
      }
    }([this._tree._rootNode]));


    return foundNode;

  };

  /**
   * Traverses an entire tree in DFS fashion.
   *
   * @method traverseDFS
   * @memberof Traverser
   * @instance
   * @param {function} callback - Gets triggered when @{link TreeNode} is explored. Explored node is passed as parameter to callback.
   * @example
   * // Traverse DFS
   * tree.traverser().traverseDFS(function(node){
   *  console.log(node.data);
   * });
   */
  Traverser.prototype.traverseDFS = function(callback){
    (function recur(node){
      callback(node);
      node._childNodes.forEach(recur);
    }(this._tree._rootNode));
  };

  /**
   * Traverses an entire tree in BFS fashion.
   *
   * @method traverseBFS
   * @memberof Traverser
   * @instance
   * @param {function} callback - Gets triggered when node is explored. Explored node is passed as parameter to callback.
   * @example
   * // Traverse BFS
   * tree.traverser().traverseBFS(function(node){
   *  console.log(node.data);
   * });
   */
  Traverser.prototype.traverseBFS = function(callback){
    (function expand(queue){
      while(queue.length){
        var current = queue.splice(0, 1)[0];
        callback(current);
        current._childNodes.forEach(function(_child){
          queue.push(_child);
        });
      }
    }([this._tree._rootNode]));
  };

  // ------------------------------------
  // Export
  // ------------------------------------

  return Traverser;

}());

},{}],8:[function(require,module,exports){

module.exports = (function(){

  // Flag bad practises
  'use strict';

  // ------------------------------------
  // Basic Setup
  // ------------------------------------

  /**
   * @class TreeNode
   * @classdesc Represents a node in the tree.
   * @constructor
   * @param {object} data - that is to be stored in a node
   */
  function TreeNode(data){

    /**
     * Represents the parent node
     *
     * @property _parentNode
     * @type {object}
     * @default "null"
     */
    this._parentNode = null;

    /**
     * Represents the child nodes
     *
     * @property _childNodes
     * @type {array}
     * @default "[]"
     */
    this._childNodes = [];

    /**
     * Represents the data node has
     *
     * @property _data
     * @type {object}
     * @default "null"
     */
    this._data = data;

    /**
     * Depth of the node represents level in hierarchy
     *
     * @property _depth
     * @type {number}
     * @default -1
     */
    this._depth = -1;

  }

  // ------------------------------------
  // Getters and Setters
  // ------------------------------------

  /**
   * Returns a parent node of current node
   *
   * @method parentNode
   * @memberof TreeNode
   * @instance
   * @return {TreeNode} - parent of current node
   */
  TreeNode.prototype.parentNode = function(){
    return this._parentNode;
  };

  /**
   * Returns an array of child nodes
   *
   * @method childNodes
   * @memberof TreeNode
   * @instance
   * @return {array} - array of child nodes
   */
  TreeNode.prototype.childNodes = function(){
    return this._childNodes;
  };

  /**
   * Sets or gets the data belonging to this node. Data is what user sets using `insert` and `insertTo` methods.
   *
   * @method data
   * @memberof TreeNode
   * @instance
   * @param {object | array | string | number | null} _data - data which is to be stored
   * @return {object | array | string | number | null} - data belonging to this node
   */
  TreeNode.prototype.data = function(_data){
    if(arguments.length > 0){
      this._data = data;
    } else {
      return this._data;
    }
  };

  /**
   * Depth of the node. Indicates the level at which node lies in a tree.
   *
   * @method depth
   * @memberof TreeNode
   * @instance
   * @return {number} - depth of node
   */
  TreeNode.prototype.depth = function(){
    return this._depth;
  };

  // ------------------------------------
  // Methods
  // ------------------------------------

  /**
   * Indicates whether this node matches the specified criteria. It triggers a callback criteria function that returns something.
   *
   * @method matchCriteria
   * @memberof TreeNode
   * @instance
   * @param {function} callback - Callback function that specifies some criteria. It receives {@link TreeNode#_data} in parameter and expects different values in different scenarios.
   * `matchCriteria` is used by following functions and expects:
   * 1. {@link Tree#searchBFS} - {boolean} in return indicating whether given node satisfies criteria.
   * 2. {@link Tree#searchDFS} - {boolean} in return indicating whether given node satisfies criteria.
   * 3. {@link Tree#export} - {object} in return indicating formatted data object.
   */
  TreeNode.prototype.matchCriteria = function(criteria){
    return criteria(this._data);
  };

  /**
   * get sibling nodes.
   *
   * @method siblings
   * @memberof TreeNode
   * @instance
   * @return {array} - array of instances of {@link TreeNode}
   */
  TreeNode.prototype.siblings = function(){
    var thiss = this;
    return !this._parentNode ? [] : this._parentNode._childNodes.filter(function(_child){
      return _child !== thiss;
    });
  };

  /**
   * Finds distance of node from root node
   *
   * @method distanceToRoot
   * @memberof TreeNode
   * @instance
   * @return {array} - array of instances of {@link TreeNode}
   */
  TreeNode.prototype.distanceToRoot = function(){

    // Initialize Distance and Node
    var distance = 0,
        node = this;

    // Loop Over Ancestors
    while(node.parentNode()){
      distance++;
      node = node.parentNode();
    }

    // Return
    return distance;

  };

  /**
   * Gets an array of all ancestor nodes including current node
   *
   * @method getAncestry
   * @memberof TreeNode
   * @instance
   * @return {Array} - array of ancestor nodes
   */
  TreeNode.prototype.getAncestry = function(){

    // Initialize empty array and node
    var ancestors = [this],
        node = this;

    // Loop over ancestors and add them in array
    while(node.parentNode()){
      ancestors.push(node.parentNode());
      node = node.parentNode();
    }

    // Return
    return ancestors;

  };

  /**
   * Exports the node data in format specified. It maintains herirachy by adding
   * additional "children" property to returned value of `criteria` callback.
   *
   * @method export
   * @memberof TreeNode
   * @instance
   * @param {TreeNode~criteria} criteria - Callback function that receives data in parameter
   * and MUST return a formatted data that has to be exported. A new property "children" is added to object returned
   * that maintains the heirarchy of nodes.
   * @return {object} - {@link TreeNode}.
   * @example
   *
   * var rootNode = tree.insert({
   *   key: '#apple',
   *   value: { name: 'Apple', color: 'Red'}
   * });
   *
   * tree.insert({
   *   key: '#greenapple',
   *   value: { name: 'Green Apple', color: 'Green'}
   * });
   *
   * tree.insertToNode(rootNode,  {
   *  key: '#someanotherapple',
   *  value: { name: 'Some Apple', color: 'Some Color' }
   * });
   *
   * // Export the tree
   * var exported = rootNode.export(function(data){
   *  return { name: data.value.name };
   * });
   *
   * // Result in `exported`
   * {
   * "name": "Apple",
   * "children": [
   *   {
   *     "name": "Green Apple",
   *     "children": []
   *   },
   *   {
   *     "name": "Some Apple",
   *     "children": []
   *  }
   * ]
   *}
   *
   */
  TreeNode.prototype.export = function(criteria){

    // Check if criteria is specified
    if(!criteria || typeof criteria !== 'function')
      throw new Error('Export criteria not specified');

    // Export every node recursively
    var exportRecur = function(node){
      var exported = node.matchCriteria(criteria);
      if(!exported || typeof exported !== 'object'){
        throw new Error('Export criteria should always return an object and it cannot be null.');
      } else {
        exported.children = [];
        node._childNodes.forEach(function(_child){
          exported.children.push(exportRecur(_child));
        });

        return exported;
      }
    };

    return exportRecur(this);
  };

  // ------------------------------------
  // Export
  // ------------------------------------

  return TreeNode;

}());

},{}],9:[function(require,module,exports){
var TreeNode = require('./tree-node');
var Traverser = require('./traverser');
module.exports = (function(){

  // Flag bad practises
  'use strict';

  // ------------------------------------
  // Basic Setup
  // ------------------------------------

  /**
   * @class Tree
   * @classdesc Represents the tree in which data nodes can be inserted
   * @constructor
   */
   function Tree(){

    /**
     * Represents the root node of the tree.
     *
     * @member
     * @type {object}
     * @default "null"
     */
    this._rootNode = null;

    /**
     * Represents the current node in question. `_currentNode` points to most recent
     * node inserted or parent node of most recent node removed.
     *
     * @member
    * @memberof Tree.
     * @type {object}
     * @default "null"
     */
    this._currentNode = null;

    /**
     * Represents the traverser which search/traverse a tree in DFS and BFS fashion.
     *
     * @member
     * @memberof Tree
     * @type {object}
     * @instance
     * @default {@link Traverser}
     */
    this._traverser = new Traverser(this);

  }

  // ------------------------------------
  // Getters and Setters
  // ------------------------------------

  /**
   * Returns a root node of the tree.
   *
   * @method rootNode
   * @memberof Tree
   * @instance
   * @return {TreeNode} - root node of the tree.
   */
  Tree.prototype.rootNode = function(){
    return this._rootNode;
  };

  /**
   * Returns a current node in a tree
   *
   * @method currentNode
   * @memberof Tree
   * @instance
   * @return {TreeNode} - current node of the tree.
   */
  Tree.prototype.currentNode = function(){
    return this._currentNode;
  };

  /**
   * Getter function that returns {@link Traverser}.
   *
   * @method traverser
   * @memberof Tree
   * @instance
   * @return {@link Traverser} for the tree.
   */
  Tree.prototype.traverser = function(){
    return this._traverser;
  };

  // ------------------------------------
  // Methods
  // ------------------------------------

  /**
   * Checks whether tree is empty.
   *
   * @method isEmpty
   * @memberof Tree
   * @instance
   * @return {boolean} whether tree is empty.
   */
  Tree.prototype.isEmpty = function(){
    return this._rootNode === null && this._currentNode === null;
  };

  /**
   * Empties the tree. Removes all nodes from tree.
   *
   * @method pruneAllNodes
   * @memberof Tree
   * @instance
   * @return {@link Tree} empty tree.
   */
  Tree.prototype.pruneAllNodes = function(){
    if(this._rootNode && this._currentNode) this.trimBranchFrom(this._rootNode);
    return this;
  };

  /**
   * Creates a {@link TreeNode} that contains the data provided and insert it in a tree.
   * New node gets inserted to the `_currentNode` which updates itself upon every insertion and deletion.
   *
   * @method insert
   * @memberof Tree
   * @instance
   * @param {object} data - data that has to be stored in tree-node.
   * @return {object} - instance of {@link TreeNode} that represents node inserted.
   * @example
   *
   * // Insert single value
   * tree.insert(183);
   *
   * // Insert array of values
   * tree.insert([34, 565, 78]);
   *
  * // Insert complex data
   * tree.insert({
   *   key: '#berries',
   *   value: { name: 'Apple', color: 'Red'}
   * });
   */
  Tree.prototype.insert = function(data){
    var node = new TreeNode(data);
    if(this._rootNode === null && this._currentNode === null){
      node._depth = 1;
      this._rootNode = this._currentNode = node;
    } else {
      node._parentNode = this._currentNode;
      this._currentNode._childNodes.push(node);
      this._currentNode = node;
      node.depth = node._parentNode._depth + 1;
    }
    return node;
  };

  /**
   * Removes a node from tree and updates `_currentNode` to parent node of node removed.
   *
   * @method remove
   * @memberof Tree
   * @instance
   * @param {object} node - {@link TreeNode} that has to be removed.
   * @param {boolean} trim - indicates whether to remove entire branch from the specified node.
   */
  Tree.prototype.remove = function(node, trim){
    if(trim || node === this._rootNode){

      // Trim Entire branch
      this.trimBranchFrom(node);

    } else {

      // Upate children's parent to grandparent
      node._childNodes.forEach(function(_child){
        _child._parentNode = node._parentNode;
        node._parentNode._childNodes.push(_child);
      });

      // Delete itslef from parent child array
      node._parentNode._childNodes.splice(node._parentNode._childNodes.indexOf(node), 1);

      // Update Current Node
      this._currentNode = node._parentNode;

      // Clear Child Array
      node._childNodes = [];
      node._parentNode = null;
      node._data = null;

    }
  };

  /**
   * Remove an entire branch starting with specified node.
   *
   * @method trimBranchFrom
   * @memberof Tree
   * @instance
   * @param {object} node - {@link TreeNode} from which entire branch has to be removed.
   */
  Tree.prototype.trimBranchFrom = function(node){

    // Hold `this`
    var thiss = this;

    // trim brach recursively
    (function recur(node){
      node._childNodes.forEach(recur);
      node._childNodes = [];
      node._data = null;
    }(node));

    // Update Current Node
    if(node._parentNode){
      node._parentNode._childNodes.splice(node._parentNode._childNodes.indexOf(node), 1);
      thiss._currentNode = node._parentNode;
    } else {
      thiss._rootNode = thiss._currentNode = null;
    }
  };

  /**
   * Inserts node to a particular node present in the tree. Particular node here is searched
   * in the tree based on the criteria provided.
   *
   * @method insertTo
   * @memberof Tree
   * @instance
   * @param {function} criteria - Callback function that specifies the search criteria
   * for node to which new node is to be inserted. Criteria callback here receives {@link TreeNode#_data}
   * in parameter and MUST return boolean indicating whether that data satisfies your criteria.
   * @param {object} data - that has to be stored in tree-node.
   * @return {object} - instance of {@link TreeNode} that represents node inserted.
   * @example
   *
   * // Insert data
   * tree.insert({
   *   key: '#apple',
   *   value: { name: 'Apple', color: 'Red'}
   * });
   *
   * // New Data
   * var greenApple = {
   *  key: '#greenapple',
   *  value: { name: 'Green Apple', color: 'Green' }
   * };
   *
   * // Insert data to node which has `key` = #apple
   * tree.insertTo(function(data){
   *  return data.key === '#apple'
   * }, greenApple);
   */
  Tree.prototype.insertTo = function(criteria, data){
    var node = this.traverser().searchDFS(criteria);
    return this.insertToNode(node, data);
  };

  /**
   * Inserts node to a particular node present in the tree. Particular node here is an instance of {@link TreeNode}
   *
   * @method insertToNode
   * @memberof Tree
   * @instance
   * @param {function} node -  {@link TreeNode} to which data node is to be inserted.
   * @param {object} data - that has to be stored in tree-node.
   * @return {object} - instance of {@link TreeNode} that represents node inserted.
   * @example
   *
   * // Insert data
   * var node = tree.insert({
   *   key: '#apple',
   *   value: { name: 'Apple', color: 'Red'}
   * });
   *
   * // New Data
   * var greenApple = {
   *  key: '#greenapple',
   *  value: { name: 'Green Apple', color: 'Green' }
   * };
   *
   * // Insert data to node
   * tree.insertToNode(node, greenApple);
   */
  Tree.prototype.insertToNode = function(node, data){
    var newNode = new TreeNode(data);
    newNode._parentNode = node;
    newNode._depth = newNode._parentNode._depth + 1;
    node._childNodes.push(newNode);
    this._currentNode = newNode;
    return newNode;
  };

  /**
   * Finds a distance between two nodes
   *
   * @method distanceBetween
   * @memberof Tree
   * @instance
   * @param {@link TreeNode} fromNode -  Node from which distance is to be calculated
   * @param {@link TreeNode} toNode - Node to which distance is to be calculated
   * @return {Number} - distance(number of hops) between two nodes.
   */
  Tree.prototype.distanceBetween = function(fromNode, toNode){
    return fromNode.distanceToRoot() + toNode.distanceToRoot() - 2 *  this.findCommonParent(fromNode, toNode).distanceToRoot();
  };

  /**
   * Finds a common parent between nodes
   *
   * @method findCommonParent
   * @memberof Tree
   * @instance
   * @param {@link TreeNode} fromNode
   * @param {@link TreeNode} toNode
   * @return {@link TreeNode} - common parent
   */
  Tree.prototype.findCommonParent = function(fromNode, toNode){

    // Get ancestory of both nodes
    var fromNodeAncestors = fromNode.getAncestry();
    var toNodeAncestors = toNode.getAncestry();

    // Find Commont
    var common = null;
    fromNodeAncestors.some(function(ancestor){
      if(toNodeAncestors.indexOf(ancestor) !== -1){
        common = ancestor;
        return true;
      }
    });

    // Return Common
    return common;

  };

  /**
   * Exports the tree data in format specified. It maintains herirachy by adding
   * additional "children" property to returned value of `criteria` callback.
   *
   * @method export
   * @memberof Tree
   * @instance
   * @param {Tree~criteria} criteria - Callback function that receives data in parameter
   * and MUST return a formatted data that has to be exported. A new property "children" is added to object returned
   * that maintains the heirarchy of nodes.
   * @return {object} - {@link TreeNode}.
   * @example
   *
   * var rootNode = tree.insert({
   *   key: '#apple',
   *   value: { name: 'Apple', color: 'Red'}
   * });
   *
   * tree.insert({
   *   key: '#greenapple',
   *   value: { name: 'Green Apple', color: 'Green'}
   * });
   *
   * tree.insertToNode(rootNode,  {
   *  key: '#someanotherapple',
   *  value: { name: 'Some Apple', color: 'Some Color' }
   * });
   *
   * // Export the tree
   * var exported = tree.export(function(data){
   *  return { name: data.value.name };
   * });
   *
   * // Result in `exported`
   * {
   * "name": "Apple",
   * "children": [
   *   {
   *     "name": "Green Apple",
   *     "children": []
   *   },
   *   {
   *     "name": "Some Apple",
   *     "children": []
   *  }
   * ]
   *}
   *
   */
  Tree.prototype.export = function(criteria){

    // Check if rootNode is not null
    if(!this._rootNode){
      return null;
    }

    return this._rootNode.export(criteria);
  };

  /**
   * Returns a new compressed tree. While compressing it considers nodes that
   * satisfies given criteria and skips the rest of the nodes, making tree compressed.
   *
   * @method compress
   * @memberof Tree
   * @instance
   * @param {Tree~criteria} criteria - Callback function that checks whether node satifies certain criteria. MUST return boolean.
   * @return {@link Tree} - A new compressed tree.
   */
  Tree.prototype.compress = function(criteria){

    // Check if criteria is specified
    if(!criteria || typeof criteria !== 'function')
      throw new Error('Compress criteria not specified');

    // Check if tree is not empty
    if(this.isEmpty()){
      return null;
    }

    // Create New Tree
    var tree = new Tree();

    // Hold `this`
    var thiss = this;

    // Recur DFS
    (function recur(node, parent){

      // Check-in
      var checkIn = thiss.rootNode() === node || node.matchCriteria(criteria);

      // Check if checked-in
      if(checkIn){
        if(tree.isEmpty()){
          parent = tree.insert(node.data());
        } else {
          parent = tree.insertToNode(parent, node.data());
        }
      } else {
        parent._data.hasCompressedNodes = true;
      }

      // For all child nodes
      node.childNodes().forEach(function(_child){
        recur(_child, parent);
      });

    }(this.rootNode(), null));

    return tree;

  };

  /**
   * Imports the JSON data into a tree using the criteria provided.
   * A property indicating the nesting of object must be specified.
   *
   * @method import
   * @memberof Tree
   * @instance
   * @param {object} data - JSON data that has be imported
   * @param {string} childProperty - Name of the property that holds the nested data.
   * @param {Tree~criteria} criteria - Callback function that receives data in parameter
   * and MUST return a formatted data that has to be imported in a tree.
   * @return {object} - {@link Tree}.
   * @example
   *
   * var data = {
   *   "trailId": "h2e67d4ea-f85f40e2ae4a06f4777864de",
   *   "initiatedAt": 1448393492488,
   *   "snapshots": {
   *      "snapshotId": "b3d132131-213c20f156339ea7bdcb6273",
   *      "capturedAt": 1448393495353,
   *      "thumbnail": "data:img",
   *      "children": [
   *       {
   *        "snapshotId": "yeb7ab27c-b36ff1b04aefafa9661243de",
   *        "capturedAt": 1448393499685,
   *        "thumbnail": "data:image/",
   *        "children": [
   *          {
   *            "snapshotId": "a00c9828f-e2be0fc4732f56471e77947a",
   *            "capturedAt": 1448393503061,
   *            "thumbnail": "data:image/png;base64",
   *            "children": []
   *          }
   *        ]
   *      }
   *     ]
   *   }
   * };
   *
   *  // Import
   *  // This will result in a tree having nodes containing `id` and `thumbnail` as data
   *  tree.import(data, 'children', function(nodeData){
   *    return {
   *      id: nodeData.snapshotId,
   *      thumbnail: nodeData.thumbnail
   *     }
   *  });
   *
   */
  Tree.prototype.import = function(data, childProperty, criteria){

    // Empty all tree
    if(this._rootNode) this.trimBranchFrom(this._rootNode);

    // Set Current Node to root node as null
    this._currentNode = this._rootNode = null;

    // Hold `this`
    var thiss = this;

    // Import recursively
    (function importRecur(node, recurData){

      // Format data from given criteria
      var _data = criteria(recurData);

      // Create Root Node
      if(!node){
        node = thiss.insert(_data);
      } else {
        node = thiss.insertToNode(node, _data);
      }

      // For Every Child
      recurData[childProperty].forEach(function(_child){
        importRecur(node, _child);
      });

    }(this._rootNode, data));

    // Set Current Node to root node
    this._currentNode = this._rootNode;

    return this;

  };

  /**
   * Callback that receives a node data in parameter and expects user to return one of following:
   * 1. {@link Traverser#searchBFS} - {boolean} in return indicating whether given node satisfies criteria.
   * 2. {@link Traverser#searchDFS} - {boolean} in return indicating whether given node satisfies criteria.
   * 3. {@link Tree#export} - {object} in return indicating formatted data object.
   * @callback criteria
   * @param data {object} - data of particular {@link TreeNode}
   */

   // ------------------------------------
   // Export
   // ------------------------------------

  return Tree;

}());

},{"./traverser":7,"./tree-node":8}],10:[function(require,module,exports){
/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
var saveAs=saveAs||function(e){"use strict";if("undefined"==typeof navigator||!/MSIE [1-9]\./.test(navigator.userAgent)){var t=e.document,n=function(){return e.URL||e.webkitURL||e},o=t.createElementNS("http://www.w3.org/1999/xhtml","a"),r="download"in o,i=function(e){var t=new MouseEvent("click");e.dispatchEvent(t)},a=e.webkitRequestFileSystem,c=e.requestFileSystem||a||e.mozRequestFileSystem,u=function(t){(e.setImmediate||e.setTimeout)(function(){throw t},0)},f="application/octet-stream",s=0,d=500,l=function(t){var o=function(){"string"==typeof t?n().revokeObjectURL(t):t.remove()};e.chrome?o():setTimeout(o,d)},v=function(e,t,n){t=[].concat(t);for(var o=t.length;o--;){var r=e["on"+t[o]];if("function"==typeof r)try{r.call(e,n||e)}catch(i){u(i)}}},p=function(e){return/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)?new Blob(["﻿",e],{type:e.type}):e},w=function(t,u,d){d||(t=p(t));var w,y,m,S=this,h=t.type,O=!1,R=function(){v(S,"writestart progress write writeend".split(" "))},b=function(){if((O||!w)&&(w=n().createObjectURL(t)),y)y.location.href=w;else{var o=e.open(w,"_blank");void 0==o&&"undefined"!=typeof safari&&(e.location.href=w)}S.readyState=S.DONE,R(),l(w)},g=function(e){return function(){return S.readyState!==S.DONE?e.apply(this,arguments):void 0}},E={create:!0,exclusive:!1};return S.readyState=S.INIT,u||(u="download"),r?(w=n().createObjectURL(t),o.href=w,o.download=u,void setTimeout(function(){i(o),R(),l(w),S.readyState=S.DONE})):(e.chrome&&h&&h!==f&&(m=t.slice||t.webkitSlice,t=m.call(t,0,t.size,f),O=!0),a&&"download"!==u&&(u+=".download"),(h===f||a)&&(y=e),c?(s+=t.size,void c(e.TEMPORARY,s,g(function(e){e.root.getDirectory("saved",E,g(function(e){var n=function(){e.getFile(u,E,g(function(e){e.createWriter(g(function(n){n.onwriteend=function(t){y.location.href=e.toURL(),S.readyState=S.DONE,v(S,"writeend",t),l(e)},n.onerror=function(){var e=n.error;e.code!==e.ABORT_ERR&&b()},"writestart progress write abort".split(" ").forEach(function(e){n["on"+e]=S["on"+e]}),n.write(t),S.abort=function(){n.abort(),S.readyState=S.DONE},S.readyState=S.WRITING}),b)}),b)};e.getFile(u,{create:!1},g(function(e){e.remove(),n()}),g(function(e){e.code===e.NOT_FOUND_ERR?n():b()}))}),b)}),b)):void b())},y=w.prototype,m=function(e,t,n){return new w(e,t,n)};return"undefined"!=typeof navigator&&navigator.msSaveOrOpenBlob?function(e,t,n){return n||(e=p(e)),navigator.msSaveOrOpenBlob(e,t||"download")}:(y.abort=function(){var e=this;e.readyState=e.DONE,v(e,"abort")},y.readyState=y.INIT=0,y.WRITING=1,y.DONE=2,y.error=y.onwritestart=y.onprogress=y.onwrite=y.onabort=y.onerror=y.onwriteend=null,m)}}("undefined"!=typeof self&&self||"undefined"!=typeof window&&window||this.content);"undefined"!=typeof module&&module.exports?module.exports.saveAs=saveAs:"undefined"!=typeof define&&null!==define&&null!=define.amd&&define([],function(){return saveAs});
},{}],11:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],12:[function(require,module,exports){
//! moment.js
//! version : 2.12.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, function () { 'use strict';

    var hookCallback;

    function utils_hooks__hooks () {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback (callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function create_utc__createUTC (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty           : false,
            unusedTokens    : [],
            unusedInput     : [],
            overflow        : -2,
            charsLeftOver   : 0,
            nullInput       : false,
            invalidMonth    : null,
            invalidFormat   : false,
            userInvalidated : false,
            iso             : false
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    function valid__isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m);
            m._isValid = !isNaN(m._d.getTime()) &&
                flags.overflow < 0 &&
                !flags.empty &&
                !flags.invalidMonth &&
                !flags.invalidWeekday &&
                !flags.nullInput &&
                !flags.invalidFormat &&
                !flags.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }
        }
        return m._isValid;
    }

    function valid__createInvalid (flags) {
        var m = create_utc__createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        }
        else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    function isUndefined(input) {
        return input === void 0;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = utils_hooks__hooks.momentProperties = [];

    function copyConfig(to, from) {
        var i, prop, val;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            utils_hooks__hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment (obj) {
        return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
    }

    function absFloor (number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function warn(msg) {
        if (utils_hooks__hooks.suppressDeprecationWarnings === false &&
                (typeof console !==  'undefined') && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (firstTime) {
                warn(msg + '\nArguments: ' + Array.prototype.slice.call(arguments).join(', ') + '\n' + (new Error()).stack);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    utils_hooks__hooks.suppressDeprecationWarnings = false;

    function isFunction(input) {
        return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
    }

    function isObject(input) {
        return Object.prototype.toString.call(input) === '[object Object]';
    }

    function locale_set__set (config) {
        var prop, i;
        for (i in config) {
            prop = config[i];
            if (isFunction(prop)) {
                this[i] = prop;
            } else {
                this['_' + i] = prop;
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _ordinalParseLenient.
        this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + (/\d{1,2}/).source);
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig), prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    // internal storage for locale config files
    var locales = {};
    var globalLocale;

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        // TODO: Find a better way to register and load all the locales in Node
        if (!locales[name] && (typeof module !== 'undefined') &&
                module && module.exports) {
            try {
                oldLocale = globalLocale._abbr;
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we
                // want to undo that for lazy loaded locales
                locale_locales__getSetGlobalLocale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function locale_locales__getSetGlobalLocale (key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = locale_locales__getLocale(key);
            }
            else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale (name, config) {
        if (config !== null) {
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple('defineLocaleOverride',
                        'use moment.updateLocale(localeName, config) to change ' +
                        'an existing locale. moment.defineLocale(localeName, ' +
                        'config) should only be used for creating a new locale');
                config = mergeConfigs(locales[name]._config, config);
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    config = mergeConfigs(locales[config.parentLocale]._config, config);
                } else {
                    // treat as if there is no base config
                    deprecateSimple('parentLocaleUndefined',
                            'specified parentLocale is not defined yet');
                }
            }
            locales[name] = new Locale(config);

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale;
            if (locales[name] != null) {
                config = mergeConfigs(locales[name]._config, config);
            }
            locale = new Locale(config);
            locale.parentLocale = locales[name];
            locales[name] = locale;

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function locale_locales__getLocale (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function locale_locales__listLocales() {
        return Object.keys(locales);
    }

    var aliases = {};

    function addUnitAlias (unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeGetSet (unit, keepTime) {
        return function (value) {
            if (value != null) {
                get_set__set(this, unit, value);
                utils_hooks__hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get_set__get(this, unit);
            }
        };
    }

    function get_set__get (mom, unit) {
        return mom.isValid() ?
            mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
    }

    function get_set__set (mom, unit, value) {
        if (mom.isValid()) {
            mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    // MOMENTS

    function getSet (units, value) {
        var unit;
        if (typeof units === 'object') {
            for (unit in units) {
                this.set(unit, units[unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken (token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(func.apply(this, arguments), token);
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '';
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var match1         = /\d/;            //       0 - 9
    var match2         = /\d\d/;          //      00 - 99
    var match3         = /\d{3}/;         //     000 - 999
    var match4         = /\d{4}/;         //    0000 - 9999
    var match6         = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2      = /\d\d?/;         //       0 - 99
    var match3to4      = /\d\d\d\d?/;     //     999 - 9999
    var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
    var match1to3      = /\d{1,3}/;       //       0 - 999
    var match1to4      = /\d{1,4}/;       //       0 - 9999
    var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned  = /\d+/;           //       0 - inf
    var matchSigned    = /[+-]?\d+/;      //    -inf - inf

    var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
    var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    // includes scottish gaelic two word and hyphenated months
    var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


    var regexes = {};

    function addRegexToken (token, regex, strictRegex) {
        regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
            return (isStrict && strictRegex) ? strictRegex : regex;
        };
    }

    function getParseRegexForToken (token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        }));
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken (token, callback) {
        var i, func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (typeof callback === 'number') {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken (token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;
    var WEEK = 7;
    var WEEKDAY = 8;

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PARSING

    addRegexToken('M',    match1to2);
    addRegexToken('MM',   match1to2, match2);
    addRegexToken('MMM',  function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/;
    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths (m, format) {
        return isArray(this._months) ? this._months[m.month()] :
            this._months[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort (m, format) {
        return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
            this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
    }

    function localeMonthsParse (monthName, format, strict) {
        var i, mom, regex;

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
            }
            if (!strict && !this._monthsParse[i]) {
                regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                return i;
            } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth (mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (typeof value !== 'number') {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth (value) {
        if (value != null) {
            setMonth(this, value);
            utils_hooks__hooks.updateOffset(this, true);
            return this;
        } else {
            return get_set__get(this, 'Month');
        }
    }

    function getDaysInMonth () {
        return daysInMonth(this.year(), this.month());
    }

    var defaultMonthsShortRegex = matchWord;
    function monthsShortRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            return this._monthsShortStrictRegex && isStrict ?
                this._monthsShortStrictRegex : this._monthsShortRegex;
        }
    }

    var defaultMonthsRegex = matchWord;
    function monthsRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            return this._monthsStrictRegex && isStrict ?
                this._monthsStrictRegex : this._monthsRegex;
        }
    }

    function computeMonthsParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')$', 'i');
        this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')$', 'i');
    }

    function checkOverflow (m) {
        var overflow;
        var a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
                a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;
    var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;

    var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

    var isoDates = [
        ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
        ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
        ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
        ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
        ['YYYY-DDD', /\d{4}-\d{3}/],
        ['YYYY-MM', /\d{4}-\d\d/, false],
        ['YYYYYYMMDD', /[+-]\d{10}/],
        ['YYYYMMDD', /\d{8}/],
        // YYYYMM is NOT allowed by the standard
        ['GGGG[W]WWE', /\d{4}W\d{3}/],
        ['GGGG[W]WW', /\d{4}W\d{2}/, false],
        ['YYYYDDD', /\d{7}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
        ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
        ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
        ['HH:mm:ss', /\d\d:\d\d:\d\d/],
        ['HH:mm', /\d\d:\d\d/],
        ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
        ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
        ['HHmmss', /\d\d\d\d\d\d/],
        ['HHmm', /\d\d\d\d/],
        ['HH', /\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
        var i, l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime, dateFormat, timeFormat, tzFormat;

        if (match) {
            getParsingFlags(config).iso = true;

            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);

        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    utils_hooks__hooks.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'https://github.com/moment/moment/issues/1407 for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    function createDate (y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
            date.setFullYear(y);
        }
        return date;
    }

    function createUTCDate (y) {
        var date = new Date(Date.UTC.apply(null, arguments));

        //the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? '' + y : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY',   4],       0, 'year');
    addFormatToken(0, ['YYYYY',  5],       0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PARSING

    addRegexToken('Y',      matchSigned);
    addRegexToken('YY',     match1to2, match2);
    addRegexToken('YYYY',   match1to4, match4);
    addRegexToken('YYYYY',  match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] = input.length === 2 ? utils_hooks__hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = utils_hooks__hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    utils_hooks__hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', false);

    function getIsLeapYear () {
        return isLeapYear(this.year());
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear, resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek, resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(utils_hooks__hooks.now());
        if (config._useUTC) {
            return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray (config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(local__createLocal(), 1, 4).year);
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = defaults(w.gg, config._a[YEAR], weekOfYear(local__createLocal(), dow, doy).year);
            week = defaults(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // constant that refers to the ISO standard
    utils_hooks__hooks.ISO_8601 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === utils_hooks__hooks.ISO_8601) {
            configFromISO(config);
            return;
        }

        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            // console.log('token', token, 'parsedInput', parsedInput,
            //         'regex', getParseRegexForToken(token, config));
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                }
                else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (getParsingFlags(config).bigHour === true &&
                config._a[HOUR] <= 12 &&
                config._a[HOUR] > 0) {
            getParsingFlags(config).bigHour = undefined;
        }
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

        configFromArray(config);
        checkOverflow(config);
    }


    function meridiemFixWrap (locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (!valid__isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i);
        config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
            return obj && parseInt(obj, 10);
        });

        configFromArray(config);
    }

    function createFromConfig (config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig (config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || locale_locales__getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return valid__createInvalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (format) {
            configFromStringAndFormat(config);
        } else if (isDate(input)) {
            config._d = input;
        } else {
            configFromInput(config);
        }

        if (!valid__isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (input === undefined) {
            config._d = new Date(utils_hooks__hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (typeof(input) === 'object') {
            configFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC (input, format, locale, strict, isUTC) {
        var c = {};

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function local__createLocal (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
         'moment().min is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
         function () {
             var other = local__createLocal.apply(null, arguments);
             if (this.isValid() && other.isValid()) {
                 return other < this ? this : other;
             } else {
                 return valid__createInvalid();
             }
         }
     );

    var prototypeMax = deprecate(
        'moment().max is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
        function () {
            var other = local__createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other > this ? this : other;
            } else {
                return valid__createInvalid();
            }
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return local__createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +(new Date());
    };

    function Duration (duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = locale_locales__getLocale();

        this._bubble();
    }

    function isDuration (obj) {
        return obj instanceof Duration;
    }

    // FORMATTING

    function offset (token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset();
            var sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z',  matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = ((string || '').match(matcher) || []);
        var chunk   = matches[matches.length - 1] || [];
        var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        var minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (isMoment(input) || isDate(input) ? +input : +local__createLocal(input)) - (+res);
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(+res._d + diff);
            utils_hooks__hooks.updateOffset(res, false);
            return res;
        } else {
            return local__createLocal(input).local();
        }
    }

    function getDateOffset (m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    utils_hooks__hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset (input, keepLocalTime) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
            } else if (Math.abs(input) < 16) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    add_subtract__addSubtract(this, create__createDuration(input - offset, 'm'), 1, false);
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    utils_hooks__hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone (input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC (keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal (keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset () {
        if (this._tzm) {
            this.utcOffset(this._tzm);
        } else if (typeof this._i === 'string') {
            this.utcOffset(offsetFromString(matchOffset, this._i));
        }
        return this;
    }

    function hasAlignedHourOffset (input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? local__createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime () {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted () {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {};

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            var other = c._isUTC ? create_utc__createUTC(c._a) : local__createLocal(c._a);
            this._isDSTShifted = this.isValid() &&
                compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal () {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset () {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc () {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?\d*)?$/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    // and further modified to allow for strings containing both week and day
    var isoRegex = /^(-)?P(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)W)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?$/;

    function create__createDuration (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms : input._milliseconds,
                d  : input._days,
                M  : input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y  : 0,
                d  : toInt(match[DATE])        * sign,
                h  : toInt(match[HOUR])        * sign,
                m  : toInt(match[MINUTE])      * sign,
                s  : toInt(match[SECOND])      * sign,
                ms : toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y : parseIso(match[2], sign),
                M : parseIso(match[3], sign),
                w : parseIso(match[4], sign),
                d : parseIso(match[5], sign),
                h : parseIso(match[6], sign),
                m : parseIso(match[7], sign),
                s : parseIso(match[8], sign)
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(local__createLocal(duration.from), local__createLocal(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    }

    create__createDuration.fn = Duration.prototype;

    function parseIso (inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return {milliseconds: 0, months: 0};
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    function absRound (number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = create__createDuration(val, period);
            add_subtract__addSubtract(this, dur, direction);
            return this;
        };
    }

    function add_subtract__addSubtract (mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            get_set__set(mom, 'Date', get_set__get(mom, 'Date') + days * isAdding);
        }
        if (months) {
            setMonth(mom, get_set__get(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            utils_hooks__hooks.updateOffset(mom, days || months);
        }
    }

    var add_subtract__add      = createAdder(1, 'add');
    var add_subtract__subtract = createAdder(-1, 'subtract');

    function moment_calendar__calendar (time, formats) {
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || local__createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            diff = this.diff(sod, 'days', true),
            format = diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';

        var output = formats && (isFunction(formats[format]) ? formats[format]() : formats[format]);

        return this.format(output || this.localeData().calendar(format, this, local__createLocal(now)));
    }

    function clone () {
        return new Moment(this);
    }

    function isAfter (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return +this > +localInput;
        } else {
            return +localInput < +this.clone().startOf(units);
        }
    }

    function isBefore (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return +this < +localInput;
        } else {
            return +this.clone().endOf(units) < +localInput;
        }
    }

    function isBetween (from, to, units) {
        return this.isAfter(from, units) && this.isBefore(to, units);
    }

    function isSame (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units || 'millisecond');
        if (units === 'millisecond') {
            return +this === +localInput;
        } else {
            inputMs = +localInput;
            return +(this.clone().startOf(units)) <= inputMs && inputMs <= +(this.clone().endOf(units));
        }
    }

    function isSameOrAfter (input, units) {
        return this.isSame(input, units) || this.isAfter(input,units);
    }

    function isSameOrBefore (input, units) {
        return this.isSame(input, units) || this.isBefore(input,units);
    }

    function diff (input, units, asFloat) {
        var that,
            zoneDelta,
            delta, output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        if (units === 'year' || units === 'month' || units === 'quarter') {
            output = monthDiff(this, that);
            if (units === 'quarter') {
                output = output / 3;
            } else if (units === 'year') {
                output = output / 12;
            }
        } else {
            delta = this - that;
            output = units === 'second' ? delta / 1e3 : // 1000
                units === 'minute' ? delta / 6e4 : // 1000 * 60
                units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
                units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                delta;
        }
        return asFloat ? output : absFloor(output);
    }

    function monthDiff (a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        return -(wholeMonthDiff + adjust);
    }

    utils_hooks__hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';

    function toString () {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function moment_format__toISOString () {
        var m = this.clone().utc();
        if (0 < m.year() && m.year() <= 9999) {
            if (isFunction(Date.prototype.toISOString)) {
                // native implementation is ~50x faster, use it when we can
                return this.toDate().toISOString();
            } else {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        } else {
            return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
    }

    function format (inputString) {
        var output = formatMoment(this, inputString || utils_hooks__hooks.defaultFormat);
        return this.localeData().postformat(output);
    }

    function from (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 local__createLocal(time).isValid())) {
            return create__createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow (withoutSuffix) {
        return this.from(local__createLocal(), withoutSuffix);
    }

    function to (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 local__createLocal(time).isValid())) {
            return create__createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow (withoutSuffix) {
        return this.to(local__createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale (key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = locale_locales__getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData () {
        return this._locale;
    }

    function startOf (units) {
        units = normalizeUnits(units);
        // the following switch intentionally omits break keywords
        // to utilize falling through the cases.
        switch (units) {
        case 'year':
            this.month(0);
            /* falls through */
        case 'quarter':
        case 'month':
            this.date(1);
            /* falls through */
        case 'week':
        case 'isoWeek':
        case 'day':
            this.hours(0);
            /* falls through */
        case 'hour':
            this.minutes(0);
            /* falls through */
        case 'minute':
            this.seconds(0);
            /* falls through */
        case 'second':
            this.milliseconds(0);
        }

        // weeks are a special case
        if (units === 'week') {
            this.weekday(0);
        }
        if (units === 'isoWeek') {
            this.isoWeekday(1);
        }

        // quarters are also special
        if (units === 'quarter') {
            this.month(Math.floor(this.month() / 3) * 3);
        }

        return this;
    }

    function endOf (units) {
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond') {
            return this;
        }
        return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
    }

    function to_type__valueOf () {
        return +this._d - ((this._offset || 0) * 60000);
    }

    function unix () {
        return Math.floor(+this / 1000);
    }

    function toDate () {
        return this._offset ? new Date(+this) : this._d;
    }

    function toArray () {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function toObject () {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds()
        };
    }

    function toJSON () {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function moment_valid__isValid () {
        return valid__isValid(this);
    }

    function parsingFlags () {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt () {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict
        };
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken (token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg',     'weekYear');
    addWeekYearFormatToken('ggggg',    'weekYear');
    addWeekYearFormatToken('GGGG',  'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PARSING

    addRegexToken('G',      matchSigned);
    addRegexToken('g',      matchSigned);
    addRegexToken('GG',     match1to2, match2);
    addRegexToken('gg',     match1to2, match2);
    addRegexToken('GGGG',   match1to4, match4);
    addRegexToken('gggg',   match1to4, match4);
    addRegexToken('GGGGG',  match1to6, match6);
    addRegexToken('ggggg',  match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = utils_hooks__hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input,
                this.week(),
                this.weekday(),
                this.localeData()._week.dow,
                this.localeData()._week.doy);
    }

    function getSetISOWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input, this.isoWeek(), this.isoWeekday(), 1, 4);
    }

    function getISOWeeksInYear () {
        return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear () {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter (input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PARSING

    addRegexToken('w',  match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W',  match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek (mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    };

    function localeFirstDayOfWeek () {
        return this._week.dow;
    }

    function localeFirstDayOfYear () {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek (input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek (input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PARSING

    addRegexToken('D',  match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0], 10);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PARSING

    addRegexToken('d',    match1to2);
    addRegexToken('e',    match1to2);
    addRegexToken('E',    match1to2);
    addRegexToken('dd',   matchWord);
    addRegexToken('ddd',  matchWord);
    addRegexToken('dddd', matchWord);

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    // LOCALES

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays (m, format) {
        return isArray(this._weekdays) ? this._weekdays[m.day()] :
            this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort (m) {
        return this._weekdaysShort[m.day()];
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin (m) {
        return this._weekdaysMin[m.day()];
    }

    function localeWeekdaysParse (weekdayName, format, strict) {
        var i, mom, regex;

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = local__createLocal([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
                this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
                this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
            }
            if (!this._weekdaysParse[i]) {
                regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.
        return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
    }

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PARSING

    addRegexToken('DDD',  match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear (input) {
        var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    function meridiem (token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PARSING

    function matchMeridiem (isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a',  matchMeridiem);
    addRegexToken('A',  matchMeridiem);
    addRegexToken('H',  match1to2);
    addRegexToken('h',  match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM (input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PARSING

    addRegexToken('m',  match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PARSING

    addRegexToken('s',  match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });


    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PARSING

    addRegexToken('S',    match1to3, match1);
    addRegexToken('SS',   match1to3, match2);
    addRegexToken('SSS',  match1to3, match3);

    var token;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }
    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z',  0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr () {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName () {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var momentPrototype__proto = Moment.prototype;

    momentPrototype__proto.add               = add_subtract__add;
    momentPrototype__proto.calendar          = moment_calendar__calendar;
    momentPrototype__proto.clone             = clone;
    momentPrototype__proto.diff              = diff;
    momentPrototype__proto.endOf             = endOf;
    momentPrototype__proto.format            = format;
    momentPrototype__proto.from              = from;
    momentPrototype__proto.fromNow           = fromNow;
    momentPrototype__proto.to                = to;
    momentPrototype__proto.toNow             = toNow;
    momentPrototype__proto.get               = getSet;
    momentPrototype__proto.invalidAt         = invalidAt;
    momentPrototype__proto.isAfter           = isAfter;
    momentPrototype__proto.isBefore          = isBefore;
    momentPrototype__proto.isBetween         = isBetween;
    momentPrototype__proto.isSame            = isSame;
    momentPrototype__proto.isSameOrAfter     = isSameOrAfter;
    momentPrototype__proto.isSameOrBefore    = isSameOrBefore;
    momentPrototype__proto.isValid           = moment_valid__isValid;
    momentPrototype__proto.lang              = lang;
    momentPrototype__proto.locale            = locale;
    momentPrototype__proto.localeData        = localeData;
    momentPrototype__proto.max               = prototypeMax;
    momentPrototype__proto.min               = prototypeMin;
    momentPrototype__proto.parsingFlags      = parsingFlags;
    momentPrototype__proto.set               = getSet;
    momentPrototype__proto.startOf           = startOf;
    momentPrototype__proto.subtract          = add_subtract__subtract;
    momentPrototype__proto.toArray           = toArray;
    momentPrototype__proto.toObject          = toObject;
    momentPrototype__proto.toDate            = toDate;
    momentPrototype__proto.toISOString       = moment_format__toISOString;
    momentPrototype__proto.toJSON            = toJSON;
    momentPrototype__proto.toString          = toString;
    momentPrototype__proto.unix              = unix;
    momentPrototype__proto.valueOf           = to_type__valueOf;
    momentPrototype__proto.creationData      = creationData;

    // Year
    momentPrototype__proto.year       = getSetYear;
    momentPrototype__proto.isLeapYear = getIsLeapYear;

    // Week Year
    momentPrototype__proto.weekYear    = getSetWeekYear;
    momentPrototype__proto.isoWeekYear = getSetISOWeekYear;

    // Quarter
    momentPrototype__proto.quarter = momentPrototype__proto.quarters = getSetQuarter;

    // Month
    momentPrototype__proto.month       = getSetMonth;
    momentPrototype__proto.daysInMonth = getDaysInMonth;

    // Week
    momentPrototype__proto.week           = momentPrototype__proto.weeks        = getSetWeek;
    momentPrototype__proto.isoWeek        = momentPrototype__proto.isoWeeks     = getSetISOWeek;
    momentPrototype__proto.weeksInYear    = getWeeksInYear;
    momentPrototype__proto.isoWeeksInYear = getISOWeeksInYear;

    // Day
    momentPrototype__proto.date       = getSetDayOfMonth;
    momentPrototype__proto.day        = momentPrototype__proto.days             = getSetDayOfWeek;
    momentPrototype__proto.weekday    = getSetLocaleDayOfWeek;
    momentPrototype__proto.isoWeekday = getSetISODayOfWeek;
    momentPrototype__proto.dayOfYear  = getSetDayOfYear;

    // Hour
    momentPrototype__proto.hour = momentPrototype__proto.hours = getSetHour;

    // Minute
    momentPrototype__proto.minute = momentPrototype__proto.minutes = getSetMinute;

    // Second
    momentPrototype__proto.second = momentPrototype__proto.seconds = getSetSecond;

    // Millisecond
    momentPrototype__proto.millisecond = momentPrototype__proto.milliseconds = getSetMillisecond;

    // Offset
    momentPrototype__proto.utcOffset            = getSetOffset;
    momentPrototype__proto.utc                  = setOffsetToUTC;
    momentPrototype__proto.local                = setOffsetToLocal;
    momentPrototype__proto.parseZone            = setOffsetToParsedOffset;
    momentPrototype__proto.hasAlignedHourOffset = hasAlignedHourOffset;
    momentPrototype__proto.isDST                = isDaylightSavingTime;
    momentPrototype__proto.isDSTShifted         = isDaylightSavingTimeShifted;
    momentPrototype__proto.isLocal              = isLocal;
    momentPrototype__proto.isUtcOffset          = isUtcOffset;
    momentPrototype__proto.isUtc                = isUtc;
    momentPrototype__proto.isUTC                = isUtc;

    // Timezone
    momentPrototype__proto.zoneAbbr = getZoneAbbr;
    momentPrototype__proto.zoneName = getZoneName;

    // Deprecations
    momentPrototype__proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    momentPrototype__proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    momentPrototype__proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    momentPrototype__proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. https://github.com/moment/moment/issues/1779', getSetZone);

    var momentPrototype = momentPrototype__proto;

    function moment__createUnix (input) {
        return local__createLocal(input * 1000);
    }

    function moment__createInZone () {
        return local__createLocal.apply(null, arguments).parseZone();
    }

    var defaultCalendar = {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    };

    function locale_calendar__calendar (key, mom, now) {
        var output = this._calendar[key];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
        LTS  : 'h:mm:ss A',
        LT   : 'h:mm A',
        L    : 'MM/DD/YYYY',
        LL   : 'MMMM D, YYYY',
        LLL  : 'MMMM D, YYYY h:mm A',
        LLLL : 'dddd, MMMM D, YYYY h:mm A'
    };

    function longDateFormat (key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
            return val.slice(1);
        });

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate () {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultOrdinalParse = /\d{1,2}/;

    function ordinal (number) {
        return this._ordinal.replace('%d', number);
    }

    function preParsePostFormat (string) {
        return string;
    }

    var defaultRelativeTime = {
        future : 'in %s',
        past   : '%s ago',
        s  : 'a few seconds',
        m  : 'a minute',
        mm : '%d minutes',
        h  : 'an hour',
        hh : '%d hours',
        d  : 'a day',
        dd : '%d days',
        M  : 'a month',
        MM : '%d months',
        y  : 'a year',
        yy : '%d years'
    };

    function relative__relativeTime (number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (isFunction(output)) ?
            output(number, withoutSuffix, string, isFuture) :
            output.replace(/%d/i, number);
    }

    function pastFuture (diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var prototype__proto = Locale.prototype;

    prototype__proto._calendar       = defaultCalendar;
    prototype__proto.calendar        = locale_calendar__calendar;
    prototype__proto._longDateFormat = defaultLongDateFormat;
    prototype__proto.longDateFormat  = longDateFormat;
    prototype__proto._invalidDate    = defaultInvalidDate;
    prototype__proto.invalidDate     = invalidDate;
    prototype__proto._ordinal        = defaultOrdinal;
    prototype__proto.ordinal         = ordinal;
    prototype__proto._ordinalParse   = defaultOrdinalParse;
    prototype__proto.preparse        = preParsePostFormat;
    prototype__proto.postformat      = preParsePostFormat;
    prototype__proto._relativeTime   = defaultRelativeTime;
    prototype__proto.relativeTime    = relative__relativeTime;
    prototype__proto.pastFuture      = pastFuture;
    prototype__proto.set             = locale_set__set;

    // Month
    prototype__proto.months            =        localeMonths;
    prototype__proto._months           = defaultLocaleMonths;
    prototype__proto.monthsShort       =        localeMonthsShort;
    prototype__proto._monthsShort      = defaultLocaleMonthsShort;
    prototype__proto.monthsParse       =        localeMonthsParse;
    prototype__proto._monthsRegex      = defaultMonthsRegex;
    prototype__proto.monthsRegex       = monthsRegex;
    prototype__proto._monthsShortRegex = defaultMonthsShortRegex;
    prototype__proto.monthsShortRegex  = monthsShortRegex;

    // Week
    prototype__proto.week = localeWeek;
    prototype__proto._week = defaultLocaleWeek;
    prototype__proto.firstDayOfYear = localeFirstDayOfYear;
    prototype__proto.firstDayOfWeek = localeFirstDayOfWeek;

    // Day of Week
    prototype__proto.weekdays       =        localeWeekdays;
    prototype__proto._weekdays      = defaultLocaleWeekdays;
    prototype__proto.weekdaysMin    =        localeWeekdaysMin;
    prototype__proto._weekdaysMin   = defaultLocaleWeekdaysMin;
    prototype__proto.weekdaysShort  =        localeWeekdaysShort;
    prototype__proto._weekdaysShort = defaultLocaleWeekdaysShort;
    prototype__proto.weekdaysParse  =        localeWeekdaysParse;

    // Hours
    prototype__proto.isPM = localeIsPM;
    prototype__proto._meridiemParse = defaultLocaleMeridiemParse;
    prototype__proto.meridiem = localeMeridiem;

    function lists__get (format, index, field, setter) {
        var locale = locale_locales__getLocale();
        var utc = create_utc__createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function list (format, index, field, count, setter) {
        if (typeof format === 'number') {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return lists__get(format, index, field, setter);
        }

        var i;
        var out = [];
        for (i = 0; i < count; i++) {
            out[i] = lists__get(format, i, field, setter);
        }
        return out;
    }

    function lists__listMonths (format, index) {
        return list(format, index, 'months', 12, 'month');
    }

    function lists__listMonthsShort (format, index) {
        return list(format, index, 'monthsShort', 12, 'month');
    }

    function lists__listWeekdays (format, index) {
        return list(format, index, 'weekdays', 7, 'day');
    }

    function lists__listWeekdaysShort (format, index) {
        return list(format, index, 'weekdaysShort', 7, 'day');
    }

    function lists__listWeekdaysMin (format, index) {
        return list(format, index, 'weekdaysMin', 7, 'day');
    }

    locale_locales__getSetGlobalLocale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // Side effect imports
    utils_hooks__hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', locale_locales__getSetGlobalLocale);
    utils_hooks__hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', locale_locales__getLocale);

    var mathAbs = Math.abs;

    function duration_abs__abs () {
        var data           = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days         = mathAbs(this._days);
        this._months       = mathAbs(this._months);

        data.milliseconds  = mathAbs(data.milliseconds);
        data.seconds       = mathAbs(data.seconds);
        data.minutes       = mathAbs(data.minutes);
        data.hours         = mathAbs(data.hours);
        data.months        = mathAbs(data.months);
        data.years         = mathAbs(data.years);

        return this;
    }

    function duration_add_subtract__addSubtract (duration, input, value, direction) {
        var other = create__createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days         += direction * other._days;
        duration._months       += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function duration_add_subtract__add (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function duration_add_subtract__subtract (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, -1);
    }

    function absCeil (number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble () {
        var milliseconds = this._milliseconds;
        var days         = this._days;
        var months       = this._months;
        var data         = this._data;
        var seconds, minutes, hours, years, monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0))) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds           = absFloor(milliseconds / 1000);
        data.seconds      = seconds % 60;

        minutes           = absFloor(seconds / 60);
        data.minutes      = minutes % 60;

        hours             = absFloor(minutes / 60);
        data.hours        = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days   = days;
        data.months = months;
        data.years  = years;

        return this;
    }

    function daysToMonths (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return days * 4800 / 146097;
    }

    function monthsToDays (months) {
        // the reverse of daysToMonths
        return months * 146097 / 4800;
    }

    function as (units) {
        var days;
        var months;
        var milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'year') {
            days   = this._days   + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            return units === 'month' ? months : months / 12;
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week'   : return days / 7     + milliseconds / 6048e5;
                case 'day'    : return days         + milliseconds / 864e5;
                case 'hour'   : return days * 24    + milliseconds / 36e5;
                case 'minute' : return days * 1440  + milliseconds / 6e4;
                case 'second' : return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
                default: throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function duration_as__valueOf () {
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs (alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds      = makeAs('s');
    var asMinutes      = makeAs('m');
    var asHours        = makeAs('h');
    var asDays         = makeAs('d');
    var asWeeks        = makeAs('w');
    var asMonths       = makeAs('M');
    var asYears        = makeAs('y');

    function duration_get__get (units) {
        units = normalizeUnits(units);
        return this[units + 's']();
    }

    function makeGetter(name) {
        return function () {
            return this._data[name];
        };
    }

    var milliseconds = makeGetter('milliseconds');
    var seconds      = makeGetter('seconds');
    var minutes      = makeGetter('minutes');
    var hours        = makeGetter('hours');
    var days         = makeGetter('days');
    var months       = makeGetter('months');
    var years        = makeGetter('years');

    function weeks () {
        return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
        s: 45,  // seconds to minute
        m: 45,  // minutes to hour
        h: 22,  // hours to day
        d: 26,  // days to month
        M: 11   // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function duration_humanize__relativeTime (posNegDuration, withoutSuffix, locale) {
        var duration = create__createDuration(posNegDuration).abs();
        var seconds  = round(duration.as('s'));
        var minutes  = round(duration.as('m'));
        var hours    = round(duration.as('h'));
        var days     = round(duration.as('d'));
        var months   = round(duration.as('M'));
        var years    = round(duration.as('y'));

        var a = seconds < thresholds.s && ['s', seconds]  ||
                minutes <= 1           && ['m']           ||
                minutes < thresholds.m && ['mm', minutes] ||
                hours   <= 1           && ['h']           ||
                hours   < thresholds.h && ['hh', hours]   ||
                days    <= 1           && ['d']           ||
                days    < thresholds.d && ['dd', days]    ||
                months  <= 1           && ['M']           ||
                months  < thresholds.M && ['MM', months]  ||
                years   <= 1           && ['y']           || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set a threshold for relative time strings
    function duration_humanize__getSetRelativeTimeThreshold (threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        return true;
    }

    function humanize (withSuffix) {
        var locale = this.localeData();
        var output = duration_humanize__relativeTime(this, !withSuffix, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var iso_string__abs = Math.abs;

    function iso_string__toISOString() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        var seconds = iso_string__abs(this._milliseconds) / 1000;
        var days         = iso_string__abs(this._days);
        var months       = iso_string__abs(this._months);
        var minutes, hours, years;

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes           = absFloor(seconds / 60);
        hours             = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years  = absFloor(months / 12);
        months %= 12;


        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        var Y = years;
        var M = months;
        var D = days;
        var h = hours;
        var m = minutes;
        var s = seconds;
        var total = this.asSeconds();

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        return (total < 0 ? '-' : '') +
            'P' +
            (Y ? Y + 'Y' : '') +
            (M ? M + 'M' : '') +
            (D ? D + 'D' : '') +
            ((h || m || s) ? 'T' : '') +
            (h ? h + 'H' : '') +
            (m ? m + 'M' : '') +
            (s ? s + 'S' : '');
    }

    var duration_prototype__proto = Duration.prototype;

    duration_prototype__proto.abs            = duration_abs__abs;
    duration_prototype__proto.add            = duration_add_subtract__add;
    duration_prototype__proto.subtract       = duration_add_subtract__subtract;
    duration_prototype__proto.as             = as;
    duration_prototype__proto.asMilliseconds = asMilliseconds;
    duration_prototype__proto.asSeconds      = asSeconds;
    duration_prototype__proto.asMinutes      = asMinutes;
    duration_prototype__proto.asHours        = asHours;
    duration_prototype__proto.asDays         = asDays;
    duration_prototype__proto.asWeeks        = asWeeks;
    duration_prototype__proto.asMonths       = asMonths;
    duration_prototype__proto.asYears        = asYears;
    duration_prototype__proto.valueOf        = duration_as__valueOf;
    duration_prototype__proto._bubble        = bubble;
    duration_prototype__proto.get            = duration_get__get;
    duration_prototype__proto.milliseconds   = milliseconds;
    duration_prototype__proto.seconds        = seconds;
    duration_prototype__proto.minutes        = minutes;
    duration_prototype__proto.hours          = hours;
    duration_prototype__proto.days           = days;
    duration_prototype__proto.weeks          = weeks;
    duration_prototype__proto.months         = months;
    duration_prototype__proto.years          = years;
    duration_prototype__proto.humanize       = humanize;
    duration_prototype__proto.toISOString    = iso_string__toISOString;
    duration_prototype__proto.toString       = iso_string__toISOString;
    duration_prototype__proto.toJSON         = iso_string__toISOString;
    duration_prototype__proto.locale         = locale;
    duration_prototype__proto.localeData     = localeData;

    // Deprecations
    duration_prototype__proto.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', iso_string__toISOString);
    duration_prototype__proto.lang = lang;

    // Side effect imports

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    // Side effect imports


    utils_hooks__hooks.version = '2.12.0';

    setHookCallback(local__createLocal);

    utils_hooks__hooks.fn                    = momentPrototype;
    utils_hooks__hooks.min                   = min;
    utils_hooks__hooks.max                   = max;
    utils_hooks__hooks.now                   = now;
    utils_hooks__hooks.utc                   = create_utc__createUTC;
    utils_hooks__hooks.unix                  = moment__createUnix;
    utils_hooks__hooks.months                = lists__listMonths;
    utils_hooks__hooks.isDate                = isDate;
    utils_hooks__hooks.locale                = locale_locales__getSetGlobalLocale;
    utils_hooks__hooks.invalid               = valid__createInvalid;
    utils_hooks__hooks.duration              = create__createDuration;
    utils_hooks__hooks.isMoment              = isMoment;
    utils_hooks__hooks.weekdays              = lists__listWeekdays;
    utils_hooks__hooks.parseZone             = moment__createInZone;
    utils_hooks__hooks.localeData            = locale_locales__getLocale;
    utils_hooks__hooks.isDuration            = isDuration;
    utils_hooks__hooks.monthsShort           = lists__listMonthsShort;
    utils_hooks__hooks.weekdaysMin           = lists__listWeekdaysMin;
    utils_hooks__hooks.defineLocale          = defineLocale;
    utils_hooks__hooks.updateLocale          = updateLocale;
    utils_hooks__hooks.locales               = locale_locales__listLocales;
    utils_hooks__hooks.weekdaysShort         = lists__listWeekdaysShort;
    utils_hooks__hooks.normalizeUnits        = normalizeUnits;
    utils_hooks__hooks.relativeTimeThreshold = duration_humanize__getSetRelativeTimeThreshold;
    utils_hooks__hooks.prototype             = momentPrototype;

    var _moment = utils_hooks__hooks;

    return _moment;

}));
},{}],13:[function(require,module,exports){
(function (global){
/*! rasterizeHTML.js - v1.2.1 - 2016-02-23
* http://www.github.com/cburgmer/rasterizeHTML.js
* Copyright (c) 2016 Christoph Burgmer; Licensed MIT */
/* Integrated dependencies:
 * url (MIT License),
 * css-mediaquery (BSD License),
 * CSSOM.js (MIT License),
 * ayepromise (BSD License & WTFPL),
 * xmlserializer (MIT License),
 * sane-domparser-error (BSD License),
 * css-font-face-src (BSD License),
 * inlineresources (MIT License) */
!function(a){if("object"==typeof exports)module.exports=a();else if("function"==typeof define&&define.amd)define(a);else{var b;"undefined"!=typeof window?b=window:"undefined"!=typeof global?b=global:"undefined"!=typeof self&&(b=self),b.rasterizeHTML=a()}}(function(){var a;return function b(a,c,d){function e(g,h){if(!c[g]){if(!a[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);throw new Error("Cannot find module '"+g+"'")}var j=c[g]={exports:{}};a[g][0].call(j.exports,function(b){var c=a[g][1][b];return e(c?c:b)},j,j.exports,b,a,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(b,c,d){!function(e,f){"function"==typeof a&&a.amd?a(["url","css-mediaquery","xmlserializer","sane-domparser-error","ayepromise","inlineresources"],function(a,b,c,d,g,h){return e.rasterizeHTML=f(a,b,c,d,g,h)}):"object"==typeof d?c.exports=f(b("url"),b("css-mediaquery"),b("xmlserializer"),b("sane-domparser-error"),b("ayepromise"),b("inlineresources")):e.rasterizeHTML=f(url,cssMediaQuery,xmlserializer,sanedomparsererror,ayepromise,inlineresources)}(this,function(a,b,c,d,e,f){var g=function(a){"use strict";var b={},c=[];b.joinUrl=function(b,c){return b?a.resolve(b,c):c},b.getConstantUniqueIdFor=function(a){return c.indexOf(a)<0&&c.push(a),c.indexOf(a)},b.clone=function(a){var b,c={};for(b in a)a.hasOwnProperty(b)&&(c[b]=a[b]);return c};var d=function(a){return"object"==typeof a&&null!==a},e=function(a){return d(a)&&Object.prototype.toString.apply(a).match(/\[object (Canvas|HTMLCanvasElement)\]/i)};return b.parseOptionalParameters=function(a){var c={canvas:null,options:{}};return null==a[0]||e(a[0])?(c.canvas=a[0]||null,c.options=b.clone(a[1])):c.options=b.clone(a[0]),c},b}(a),h=function(a,b){"use strict";var c={},d=function(a,b,c){var d=a[b];return a[b]=function(){var a=Array.prototype.slice.call(arguments);return c.apply(this,[a,d])},d};return c.baseUrlRespectingXhr=function(b,c){var e=function(){var e=new b;return d(e,"open",function(b,d){var e=b.shift(),f=b.shift(),g=a.joinUrl(c,f);return d.apply(this,[e,g].concat(b))}),e};return e},c.finishNotifyingXhr=function(a){var c=0,e=0,f=!1,g=b.defer(),h=function(){var a=c-e;0>=a&&f&&g.resolve({totalCount:c})},i=function(){var b=new a;return d(b,"send",function(a,b){return c+=1,b.apply(this,arguments)}),b.addEventListener("load",function(){e+=1,h()}),b};return i.waitForRequestsToFinish=function(){return f=!0,h(),g.promise},i},c}(g,e),i=function(){"use strict";var a={},b=function(a){return Array.prototype.slice.call(a)};a.addClassName=function(a,b){a.className+=" "+b},a.addClassNameRecursively=function(b,c){a.addClassName(b,c),b.parentNode!==b.ownerDocument&&a.addClassNameRecursively(b.parentNode,c)};var c=function(a,c){var d=a.parentStyleSheet,e=b(d.cssRules).indexOf(a);d.insertRule(c,e+1),d.deleteRule(e)},d=function(a,b){var d=a.cssText.replace(/^[^\{]+/,""),e=b+" "+d;c(a,e)},e=function(a){return b(a).reduce(function(a,b){return a+b.cssText},"")},f=function(a){a.textContent=e(a.sheet.cssRules)},g=function(a){return"((?:^|[^.#:\\w])|(?=\\W))("+a.join("|")+")(?=\\W|$)"},h=function(a,c,e){var h=g(c);b(a.querySelectorAll("style")).forEach(function(a){var c=b(a.sheet.cssRules).filter(function(a){return a.selectorText&&new RegExp(h,"i").test(a.selectorText)});c.length&&(c.forEach(function(a){var b=a.selectorText.replace(new RegExp(h,"gi"),function(a,b,c){return b+e(c)});b!==a.selectorText&&d(a,b)}),f(a))})};return a.rewriteCssSelectorWith=function(a,b,c){h(a,[b],function(){return c})},a.lowercaseCssTypeSelectors=function(a,b){h(a,b,function(a){return a.toLowerCase()})},a.findHtmlOnlyNodeNames=function(a){for(var b,c=a.createTreeWalker(a,NodeFilter.SHOW_ELEMENT),d={},e={};c.nextNode();)b=c.currentNode.tagName.toLowerCase(),"http://www.w3.org/1999/xhtml"===c.currentNode.namespaceURI?d[b]=!0:e[b]=!0;return Object.keys(d).filter(function(a){return!e[a]})},a}(),j=function(a){"use strict";var b={},c=function(a){return Array.prototype.slice.call(a)},d={active:!0,hover:!0,focus:!1,target:!1};return b.fakeUserAction=function(b,c,e){var f=b.querySelector(c),g=":"+e,h="rasterizehtml"+e;f&&(d[e]?a.addClassNameRecursively(f,h):a.addClassName(f,h),a.rewriteCssSelectorWith(b,g,"."+h))},b.persistInputValues=function(a){var b=a.querySelectorAll("input"),d=a.querySelectorAll("textarea"),e=function(a){return"checkbox"===a.type||"radio"===a.type};c(b).filter(e).forEach(function(a){a.checked?a.setAttribute("checked",""):a.removeAttribute("checked")}),c(b).filter(function(a){return!e(a)}).forEach(function(a){a.setAttribute("value",a.value)}),c(d).forEach(function(a){a.textContent=a.value})},b.rewriteTagNameSelectorsToLowerCase=function(b){a.lowercaseCssTypeSelectors(b,a.findHtmlOnlyNodeNames(b))},b}(i),k=function(a){"use strict";var b,c={},d=function(){var a='<svg id="svg" xmlns="http://www.w3.org/2000/svg" width="10" height="10"><style>@media (max-width: 1em) { svg { background: #00f; } }</style></svg>',b="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(a),c=document.createElement("img");return c.src=b,c},f=function(a,b,c,d){var e=document.createElement("canvas");e.width=a.width,e.height=a.height;var f,g=e.getContext("2d");return g.drawImage(a,0,0),f=g.getImageData(0,0,1,1).data,f[0]===b&&f[1]===c&&f[2]===d},g=function(){var a=d(),b=e.defer();return document.querySelector("body").appendChild(a),a.onload=function(){document.querySelector("body").removeChild(a);try{b.resolve(!f(a,0,0,255))}catch(c){b.resolve(!0)}},a.onerror=function(){b.reject()},b.promise};c.needsEmWorkaround=function(){return void 0===b&&(b=g()),b};var h=function(a){return Array.prototype.slice.call(a)},i=function(a){return h(a).map(function(a){return a.cssText}).join("\n")},j=function(a,b){return"@media "+a+"{"+i(b)+"}"},k=function(a,b,c){try{a.insertRule(c,b+1)}catch(d){return}a.deleteRule(b)},l=function(a,b){var c=a.parentStyleSheet,d=h(c.cssRules).indexOf(a);k(c,d,b)},m=function(a){a.textContent=i(a.sheet.cssRules)},n=function(a){var b=a.modifier?a.modifier+"-"+a.feature:a.feature;return a.value?"("+b+": "+a.value+")":"("+b+")"},o=function(a){var b=[];return a.inverse&&b.push("not"),b.push(a.type),a.expressions.length>0&&b.push("and "+a.expressions.map(n).join(" and ")),b.join(" ")};c.serializeQuery=function(a){var b=a.map(o);return b.join(", ")};var p=function(a){return 16*a},q=function(a){var b=/^((?:\d+\.)?\d+)em/.exec(a);return b?p(parseFloat(b[1]))+"px":a},r=function(b){var d=a.parse(b),e=!1;return d.forEach(function(a){a.expressions.forEach(function(a){var b=q(a.value);e|=b!==a.value,a.value=b})}),e?c.serializeQuery(d):void 0},s=function(a){var b=!1;return a.forEach(function(a){var c=r(a.media.mediaText);c&&l(a,j(c,a.cssRules)),b|=!!c}),b};return c.workAroundWebKitEmSizeIssue=function(a){var b=a.querySelectorAll("style");h(b).forEach(function(a){var b=h(a.sheet.cssRules).filter(function(a){return a.type===window.CSSRule.MEDIA_RULE}),c=s(b);c&&m(a)})},c}(b),l=function(a,b,c,d,e){"use strict";var f={},g=function(a,b,c,d){var e=a.createElement(b);return e.style.visibility="hidden",e.style.width=c+"px",e.style.height=d+"px",e.style.position="absolute",e.style.top=-1e4-d+"px",e.style.left=-1e4-c+"px",a.getElementsByTagName("body")[0].appendChild(e),e};f.executeJavascript=function(a,d){var f=g(e.document,"iframe",d.width,d.height),h=a.documentElement.outerHTML,i=[],j=c.defer(),k=d.executeJsTimeout||0,l=function(){var a=f.contentDocument;e.document.getElementsByTagName("body")[0].removeChild(f),j.resolve({document:a,errors:i})},m=function(){var a=c.defer();return k>0?setTimeout(a.resolve,k):a.resolve(),a.promise},n=f.contentWindow.XMLHttpRequest,o=b.finishNotifyingXhr(n),p=b.baseUrlRespectingXhr(o,d.baseUrl);return f.onload=function(){m().then(o.waitForRequestsToFinish).then(l)},f.contentDocument.open(),f.contentWindow.XMLHttpRequest=p,f.contentWindow.onerror=function(a){i.push({resourceType:"scriptExecution",msg:a})},f.contentDocument.write("<!DOCTYPE html>"),f.contentDocument.write(h),f.contentDocument.close(),j.promise};var h=function(a,b,c){var d=a.createElement("iframe");return d.style.width=b+"px",d.style.height=c+"px",d.style.visibility="hidden",d.style.position="absolute",d.style.top=-1e4-c+"px",d.style.left=-1e4-b+"px",d.sandbox="allow-same-origin",d.scrolling="no",d},i=function(a,b,c){var d=Math.floor(a/c),f=Math.floor(b/c);return h(e.document,d,f)},j=function(a,b,c,d){return{width:Math.max(a.width*d,b),height:Math.max(a.height*d,c)}},k=function(a,b,c,d,f){var g,h,i,k,l,m,n,o,p=Math.max(a.documentElement.scrollWidth,a.body.clientWidth),q=Math.max(a.documentElement.scrollHeight,a.body.scrollHeight,a.body.clientHeight);if(b){if(m=a.querySelector(b),!m)throw{message:"Clipping selector not found"};n=m.getBoundingClientRect(),g=n.top,h=n.left,i=n.width,k=n.height}else g=0,h=0,i=p,k=q;return o=j({width:i,height:k},c,d,f),l=e.getComputedStyle(a.documentElement).fontSize,{left:h,top:g,width:o.width,height:o.height,viewportWidth:p,viewportHeight:q,rootFontSize:l}};f.calculateDocumentContentSize=function(a,b){var d,f=a.documentElement.outerHTML,g=c.defer(),h=b.zoom||1;return d=i(b.width,b.height,h),e.document.getElementsByTagName("body")[0].appendChild(d),d.onload=function(){var a,c=d.contentDocument;try{a=k(c,b.clip,b.width,b.height,h),g.resolve(a)}catch(f){g.reject(f)}finally{e.document.getElementsByTagName("body")[0].removeChild(d)}},d.contentDocument.open(),d.contentDocument.write("<!DOCTYPE html>"),d.contentDocument.write(f),d.contentDocument.close(),g.promise};var l=function(a,b){var c,d,f,g,h=/<html((?:\s+[^>]*)?)>/im.exec(b),i=e.document.implementation.createHTMLDocument("");if(h)for(c="<div"+h[1]+"></div>",i.documentElement.innerHTML=c,f=i.querySelector("div"),d=0;d<f.attributes.length;d++)g=f.attributes[d],a.documentElement.setAttribute(g.name,g.value)};f.parseHTML=function(a){var b=e.document.implementation.createHTMLDocument("");return b.documentElement.innerHTML=a,l(b,a),b};var m=function(a){try{return d.failOnParseError(a)}catch(b){throw{message:"Invalid source",originalError:b}}};f.validateXHTML=function(a){var b=new DOMParser,c=b.parseFromString(a,"application/xml");m(c)};var n=null,o=function(a,b){return"none"===b||"repeated"===b?(null!==n&&"repeated"===b||(n=Date.now()),a+"?_="+n):a},p=function(b,d){var e=new window.XMLHttpRequest,f=a.joinUrl(d.baseUrl,b),g=o(f,d.cache),h=c.defer(),i=function(a){h.reject({message:"Unable to load page",originalError:a})};e.addEventListener("load",function(){200===e.status||0===e.status?h.resolve(e.responseXML):i(e.statusText)},!1),e.addEventListener("error",function(a){i(a)},!1);try{e.open("GET",g,!0),e.responseType="document",e.send(null)}catch(j){i(j)}return h.promise};return f.loadDocument=function(a,b){return p(a,b).then(function(a){return m(a)})},f}(g,h,e,d,window),m=function(a,b){"use strict";var c,d={},e=function(a,b){return b?URL.createObjectURL(new Blob([a],{type:"image/svg+xml"})):"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(a)},f=function(a){a instanceof Blob&&URL.revokeObjectURL(a)},g='<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><foreignObject></foreignObject></svg>',h=function(b){var c=document.createElement("canvas"),d=new Image,e=a.defer();return d.onload=function(){var a=c.getContext("2d");try{a.drawImage(d,0,0),c.toDataURL("image/png"),e.resolve(!0)}catch(b){e.resolve(!1)}},d.onerror=e.reject,d.src=b,e.promise},i=function(){var a=e(g,!0);return h(a).then(function(b){return f(a),b?!1:h(e(g,!1)).then(function(a){return a})},function(){return!1})},j=function(){if(b.Blob)try{return new Blob(["<b></b>"],{type:"text/xml"}),!0}catch(a){}return!1},k=function(){var c=a.defer();return j&&b.URL?i().then(function(a){c.resolve(!a)},function(){c.reject()}):c.resolve(!1),c.promise},l=function(){return void 0===c&&(c=k()),c},m=function(a){return l().then(function(b){return e(a,b)})};return d.renderSvg=function(b){var c,d,e=a.defer(),g=function(){d.onload=null,d.onerror=null},h=function(){c&&f(c)};return d=new Image,d.onload=function(){g(),h(),e.resolve(d)},d.onerror=function(){h(),e.reject()},m(b).then(function(a){c=a,d.src=c},e.reject),e.promise},d}(e,window),n=function(a,b,c,d,e){"use strict";var f={},g=function(a,b){var c=b||1,d={width:a.width,height:a.height,"font-size":a.rootFontSize};return 1!==c&&(d.style="transform:scale("+c+"); transform-origin: 0 0;"),d},h=function(a){var b,c,d,e;b=Math.round(a.viewportWidth),c=Math.round(a.viewportHeight),d=-a.left,e=-a.top;var f={x:d,y:e,width:b,height:c};return f},i=function(a){var b=a.style||"";a.style=b+"float: left;"},j=function(a){a.externalResourcesRequired=!0},k=function(){return'<style scoped="">html::-webkit-scrollbar { display: none; }</style>'},l=function(a){var b=Object.keys(a);return b.length?" "+b.map(function(b){return b+'="'+a[b]+'"'}).join(" "):""},m=function(a,c,d){var f=e.serializeToString(a);b.validateXHTML(f);var m=h(c);return i(m),j(m),'<svg xmlns="http://www.w3.org/2000/svg"'+l(g(c,d))+">"+k()+"<foreignObject"+l(m)+">"+f+"</foreignObject></svg>"};return f.getSvgForDocument=function(a,b,e){return c.rewriteTagNameSelectorsToLowerCase(a),d.needsEmWorkaround().then(function(c){return c&&d.workAroundWebKitEmSizeIssue(a),m(a,b,e)})},f.drawDocumentAsSvg=function(a,d){return["hover","active","focus","target"].forEach(function(b){d[b]&&c.fakeUserAction(a,d[b],b)}),b.calculateDocumentContentSize(a,d).then(function(b){return f.getSvgForDocument(a,b,d.zoom)})},f}(g,l,j,k,c),o=function(a,b,c,d,e,f){"use strict";var g={},h=function(a){return{message:"Error rendering page",originalError:a}},i=function(a){return e.renderSvg(a).then(function(b){return{image:b,svg:a}},function(a){throw h(a)})},j=function(a,b){try{b.getContext("2d").drawImage(a,0,0)}catch(c){throw h(c)}},k=function(a,b,c){return d.drawDocumentAsSvg(a,c).then(i).then(function(a){return b&&j(a.image,b),a})},l=function(a,d){return b.executeJavascript(a,d).then(function(a){var b=a.document;return c.persistInputValues(b),{document:b,errors:a.errors}})};return g.rasterize=function(b,c,d){var e;return e=a.clone(d),e.inlineScripts=d.executeJs===!0,f.inlineReferences(b,e).then(function(a){return d.executeJs?l(b,d).then(function(b){return{document:b.document,errors:a.concat(b.errors)}}):{document:b,errors:a}}).then(function(a){return k(a.document,c,d).then(function(b){return{image:b.image,svg:b.svg,errors:a.errors}})})},g}(g,l,j,n,m,f),p=function(a,b,c){"use strict";var d={},e=function(a,b){var c=300,d=200,e=a?a.width:c,f=a?a.height:d,g=void 0!==b.width?b.width:e,h=void 0!==b.height?b.height:f;return{width:g,height:h}},f=function(b){var c,d=e(b.canvas,b.options);return c=a.clone(b.options),c.width=d.width,c.height=d.height,c};d.drawDocument=function(){var b=arguments[0],d=Array.prototype.slice.call(arguments,1),e=a.parseOptionalParameters(d);return c.rasterize(b,e.canvas,f(e))};var g=function(a,c,e){var f=b.parseHTML(a);return d.drawDocument(f,c,e)};d.drawHTML=function(){var b=arguments[0],c=Array.prototype.slice.call(arguments,1),d=a.parseOptionalParameters(c);return g(b,d.canvas,d.options)};var h=function(b,c,d){var e=document.implementation.createHTMLDocument("");e.replaceChild(b.documentElement,e.documentElement);var f=d?a.clone(d):{};return d.baseUrl||(f.baseUrl=c),{document:e,options:f}},i=function(a,c,e){return b.loadDocument(a,e).then(function(b){var f=h(b,a,e);return d.drawDocument(f.document,c,f.options)})};return d.drawURL=function(){var b=arguments[0],c=Array.prototype.slice.call(arguments,1),d=a.parseOptionalParameters(c);return i(b,d.canvas,d.options)},d}(g,l,o);return p})},{ayepromise:2,"css-mediaquery":7,inlineresources:28,"sane-domparser-error":36,url:"j37I/u",xmlserializer:39}],2:[function(b,c,d){!function(b,e){"function"==typeof a&&a.amd?a(e):"object"==typeof d?c.exports=e():b.ayepromise=e()}(this,function(){"use strict";var a={},b=function(){var a=!1;return function(b){return function(){a||(a=!0,b.apply(null,arguments))}}},c=function(a){var b=a&&a.then;return"object"==typeof a&&"function"==typeof b?function(){return b.apply(a,arguments)}:void 0},d=function(b,c){var d=a.defer(),e=function(a,b){setTimeout(function(){var c;try{c=a(b)}catch(e){return void d.reject(e)}c===d.promise?d.reject(new TypeError("Cannot resolve promise with itself")):d.resolve(c)},1)},g=function(a){b&&b.call?e(b,a):d.resolve(a)},h=function(a){c&&c.call?e(c,a):d.reject(a)};return{promise:d.promise,handle:function(a,b){a===f?g(b):h(b)}}},e=0,f=1,g=2;return a.defer=function(){var a,h=e,i=[],j=function(b,c){h=b,a=c,i.forEach(function(b){b.handle(h,a)}),i=null},k=function(a){j(f,a)},l=function(a){j(g,a)},m=function(b,c){var f=d(b,c);return h===e?i.push(f):f.handle(h,a),f.promise},n=function(a){var c=b();try{a(c(o),c(l))}catch(d){c(l)(d)}},o=function(a){var b;try{b=c(a)}catch(d){return void l(d)}b?n(b):k(a)},p=b();return{resolve:p(o),reject:p(l),promise:{then:m,fail:function(a){return m(null,a)}}}},a})},{}],3:[function(b,c,d){(function(b){!function(e){function f(a){throw RangeError(I[a])}function g(a,b){for(var c=a.length;c--;)a[c]=b(a[c]);return a}function h(a,b){return g(a.split(H),b).join(".")}function i(a){for(var b,c,d=[],e=0,f=a.length;f>e;)b=a.charCodeAt(e++),b>=55296&&56319>=b&&f>e?(c=a.charCodeAt(e++),56320==(64512&c)?d.push(((1023&b)<<10)+(1023&c)+65536):(d.push(b),e--)):d.push(b);return d}function j(a){return g(a,function(a){var b="";return a>65535&&(a-=65536,b+=L(a>>>10&1023|55296),a=56320|1023&a),b+=L(a)}).join("")}function k(a){return 10>a-48?a-22:26>a-65?a-65:26>a-97?a-97:x}function l(a,b){return a+22+75*(26>a)-((0!=b)<<5)}function m(a,b,c){var d=0;for(a=c?K(a/B):a>>1,a+=K(a/b);a>J*z>>1;d+=x)a=K(a/J);return K(d+(J+1)*a/(a+A))}function n(a){var b,c,d,e,g,h,i,l,n,o,p=[],q=a.length,r=0,s=D,t=C;for(c=a.lastIndexOf(E),0>c&&(c=0),d=0;c>d;++d)a.charCodeAt(d)>=128&&f("not-basic"),p.push(a.charCodeAt(d));for(e=c>0?c+1:0;q>e;){for(g=r,h=1,i=x;e>=q&&f("invalid-input"),l=k(a.charCodeAt(e++)),(l>=x||l>K((w-r)/h))&&f("overflow"),r+=l*h,n=t>=i?y:i>=t+z?z:i-t,!(n>l);i+=x)o=x-n,h>K(w/o)&&f("overflow"),h*=o;b=p.length+1,t=m(r-g,b,0==g),K(r/b)>w-s&&f("overflow"),s+=K(r/b),r%=b,p.splice(r++,0,s)}return j(p)}function o(a){var b,c,d,e,g,h,j,k,n,o,p,q,r,s,t,u=[];for(a=i(a),q=a.length,b=D,c=0,g=C,h=0;q>h;++h)p=a[h],128>p&&u.push(L(p));for(d=e=u.length,e&&u.push(E);q>d;){for(j=w,h=0;q>h;++h)p=a[h],p>=b&&j>p&&(j=p);for(r=d+1,j-b>K((w-c)/r)&&f("overflow"),c+=(j-b)*r,b=j,h=0;q>h;++h)if(p=a[h],b>p&&++c>w&&f("overflow"),p==b){for(k=c,n=x;o=g>=n?y:n>=g+z?z:n-g,!(o>k);n+=x)t=k-o,s=x-o,u.push(L(l(o+t%s,0))),k=K(t/s);u.push(L(l(k,0))),g=m(c,r,d==e),c=0,++d}++c,++b}return u.join("")}function p(a){return h(a,function(a){return F.test(a)?n(a.slice(4).toLowerCase()):a})}function q(a){return h(a,function(a){return G.test(a)?"xn--"+o(a):a})}var r="object"==typeof d&&d,s="object"==typeof c&&c&&c.exports==r&&c,t="object"==typeof b&&b;t.global!==t&&t.window!==t||(e=t);var u,v,w=2147483647,x=36,y=1,z=26,A=38,B=700,C=72,D=128,E="-",F=/^xn--/,G=/[^ -~]/,H=/\x2E|\u3002|\uFF0E|\uFF61/g,I={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},J=x-y,K=Math.floor,L=String.fromCharCode;if(u={version:"1.2.4",ucs2:{decode:i,encode:j},decode:n,encode:o,toASCII:q,toUnicode:p},"function"==typeof a&&"object"==typeof a.amd&&a.amd)a("punycode",function(){return u});else if(r&&!r.nodeType)if(s)s.exports=u;else for(v in u)u.hasOwnProperty(v)&&(r[v]=u[v]);else e.punycode=u}(this)}).call(this,"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],4:[function(a,b,c){b.exports=function(){function b(a,b){function c(){this.constructor=a}c.prototype=b.prototype,a.prototype=new c}function c(a,b,c,d,e,f){this.message=a,this.expected=b,this.found=c,this.offset=d,this.line=e,this.column=f,this.name="SyntaxError"}function d(b){function d(a){function c(a,c,d){var e,f;for(e=c;d>e;e++)f=b.charAt(e),"\n"===f?(a.seenCR||a.line++,a.column=1,a.seenCR=!1):"\r"===f||"\u2028"===f||"\u2029"===f?(a.line++,a.column=1,a.seenCR=!0):(a.column++,a.seenCR=!1)}return T!==a&&(T>a&&(T=0,U={line:1,column:1,seenCR:!1}),c(U,T,a),T=a),U}function e(a){V>R||(R>V&&(V=R,W=[]),W.push(a))}function f(a,e,f){function g(a){var b=1;for(a.sort(function(a,b){return a.description<b.description?-1:a.description>b.description?1:0});b<a.length;)a[b-1]===a[b]?a.splice(b,1):b++}function h(a,b){function c(a){function b(a){return a.charCodeAt(0).toString(16).toUpperCase()}return a.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\x08/g,"\\b").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\f/g,"\\f").replace(/\r/g,"\\r").replace(/[\x00-\x07\x0B\x0E\x0F]/g,function(a){return"\\x0"+b(a)}).replace(/[\x10-\x1F\x80-\xFF]/g,function(a){return"\\x"+b(a)}).replace(/[\u0180-\u0FFF]/g,function(a){return"\\u0"+b(a)}).replace(/[\u1080-\uFFFF]/g,function(a){return"\\u"+b(a)})}var d,e,f,g=new Array(a.length);for(f=0;f<a.length;f++)g[f]=a[f].description;return d=a.length>1?g.slice(0,-1).join(", ")+" or "+g[a.length-1]:g[0],e=b?'"'+c(b)+'"':"end of input","Expected "+d+" but "+e+" found."}var i=d(f),j=f<b.length?b.charAt(f):null;return null!==e&&g(e),new c(null!==a?a:h(e,j),e,j,f,i.line,i.column)}function g(){var a,b;return a=h(),a===r&&(a=R,b=[],b!==r&&(S=a,b=u()),a=b),a}function h(){var a,c,d,f,g,j;if(a=R,c=i(),c!==r){for(d=[],f=o();f!==r;)d.push(f),f=o();if(d!==r)if(44===b.charCodeAt(R)?(f=w,R++):(f=r,0===X&&e(x)),f!==r){for(g=[],j=o();j!==r;)g.push(j),j=o();g!==r?(j=h(),j!==r?(S=a,c=y(c,j),a=c):(R=a,a=v)):(R=a,a=v)}else R=a,a=v;else R=a,a=v}else R=a,a=v;return a===r&&(a=R,c=i(),c!==r&&(S=a,c=z(c)),a=c),a}function i(){var a;return a=j(),a===r&&(a=m()),a}function j(){var a,b,c,d;if(a=R,b=k(),b!==r){if(c=[],d=o(),d!==r)for(;d!==r;)c.push(d),d=o();else c=v;c!==r?(d=l(),d!==r?(S=a,b=A(b,d),a=b):(R=a,a=v)):(R=a,a=v)}else R=a,a=v;return a===r&&(a=R,b=k(),b!==r&&(S=a,b=B(b)),a=b),a}function k(){var a,c,d,f;return a=R,b.substr(R,4)===C?(c=C,R+=4):(c=r,0===X&&e(D)),c!==r?(d=n(),d!==r?(41===b.charCodeAt(R)?(f=E,R++):(f=r,0===X&&e(F)),f!==r?(S=a,c=G(d),a=c):(R=a,a=v)):(R=a,a=v)):(R=a,a=v),a}function l(){var a,c,d,f;return a=R,b.substr(R,7)===H?(c=H,R+=7):(c=r,0===X&&e(I)),c!==r?(d=n(),d!==r?(41===b.charCodeAt(R)?(f=E,R++):(f=r,0===X&&e(F)),f!==r?(S=a,c=G(d),a=c):(R=a,a=v)):(R=a,a=v)):(R=a,a=v),a}function m(){var a,c,d,f;return a=R,b.substr(R,6)===J?(c=J,R+=6):(c=r,0===X&&e(K)),c!==r?(d=n(),d!==r?(41===b.charCodeAt(R)?(f=E,R++):(f=r,0===X&&e(F)),f!==r?(S=a,c=L(d),a=c):(R=a,a=v)):(R=a,a=v)):(R=a,a=v),a}function n(){var a,c,d;if(a=R,c=[],M.test(b.charAt(R))?(d=b.charAt(R),R++):(d=r,0===X&&e(N)),d!==r)for(;d!==r;)c.push(d),M.test(b.charAt(R))?(d=b.charAt(R),R++):(d=r,0===X&&e(N));else c=v;return c!==r&&(S=a,c=O(c)),a=c}function o(){var a;return P.test(b.charAt(R))?(a=b.charAt(R),R++):(a=r,0===X&&e(Q)),a}var p,q=arguments.length>1?arguments[1]:{},r={},s={start:g},t=g,u=function(){return[]},v=r,w=",",x={type:"literal",value:",",description:'","'},y=function(a,b){return[a].concat(b)},z=function(a){return[a]},A=function(a,b){return{url:a,format:b}},B=function(a){return{url:a}},C="url(",D={type:"literal",value:"url(",description:'"url("'},E=")",F={type:"literal",value:")",description:'")"'},G=function(a){return a},H="format(",I={type:"literal",value:"format(",description:'"format("'},J="local(",K={type:"literal",value:"local(",description:'"local("'},L=function(a){return{local:a}},M=/^[^)]/,N={type:"class",value:"[^)]",description:"[^)]"},O=function(a){return Y.extractValue(a.join(""))},P=/^[ \t\r\n\f]/,Q={type:"class",value:"[ \\t\\r\\n\\f]",description:"[ \\t\\r\\n\\f]"},R=0,S=0,T=0,U={line:1,column:1,seenCR:!1},V=0,W=[],X=0;if("startRule"in q){if(!(q.startRule in s))throw new Error("Can't start parsing from rule \""+q.startRule+'".');t=s[q.startRule]}var Y=a("../util");if(p=t(),p!==r&&R===b.length)return p;throw p!==r&&R<b.length&&e({type:"end",description:"end of input"}),f(null,W,V)}return b(c,Error),{SyntaxError:c,parse:d}}()},{"../util":6}],5:[function(a,b,c){var d=a("./grammar");c.SyntaxError=function(a,b){this.message=a,this.offset=b},c.parse=function(a){try{return d.parse(a)}catch(b){throw new c.SyntaxError(b.message,b.offset)}},c.serialize=function(a){return a.map(function(a){var b;return a.url?(b='url("'+a.url+'")',a.format&&(b+=' format("'+a.format+'")')):b='local("'+a.local+'")',b}).join(", ")}},{"./grammar":4}],6:[function(a,b,c){var d=function(a){var b=/^[\t\r\f\n ]*(.+?)[\t\r\f\n ]*$/;return a.replace(b,"$1")},e=function(a){var b=/^"(.*)"$/,c=/^'(.*)'$/;return b.test(a)?a.replace(b,"$1"):c.test(a)?a.replace(c,"$1"):a};c.extractValue=function(a){return e(d(a))}},{}],7:[function(a,b,c){"use strict";function d(a,b){return e(a).some(function(a){var c=a.inverse,d="all"===a.type||b.type===a.type;if(d&&c||!d&&!c)return!1;var e=a.expressions.every(function(a){var c=a.feature,d=a.modifier,e=a.value,i=b[c];if(!i)return!1;switch(c){case"orientation":case"scan":return i.toLowerCase()===e.toLowerCase();case"width":case"height":case"device-width":case"device-height":e=h(e),i=h(i);break;case"resolution":e=g(e),i=g(i);break;case"aspect-ratio":case"device-aspect-ratio":case"device-pixel-ratio":e=f(e),i=f(i);break;case"grid":case"color":case"color-index":case"monochrome":e=parseInt(e,10)||1,i=parseInt(i,10)||0}switch(d){case"min":return i>=e;case"max":return e>=i;default:return i===e}});return e&&!c||!e&&c})}function e(a){return a.split(",").map(function(a){a=a.trim();var b=a.match(i),c=b[1],d=b[2],e=b[3]||"",f={};return f.inverse=!!c&&"not"===c.toLowerCase(),f.type=d?d.toLowerCase():"all",e=e.match(/\([^\)]+\)/g)||[],f.expressions=e.map(function(a){var b=a.match(j),c=b[1].toLowerCase().match(k);return{modifier:c[1],feature:c[2],value:b[2]}}),f})}function f(a){var b,c=Number(a);return c||(b=a.match(/^(\d+)\s*\/\s*(\d+)$/),c=b[1]/b[2]),c}function g(a){var b=parseFloat(a),c=String(a).match(m)[1];switch(c){case"dpcm":return b/2.54;case"dppx":return 96*b;default:return b}}function h(a){var b=parseFloat(a),c=String(a).match(l)[1];switch(c){case"em":return 16*b;case"rem":return 16*b;case"cm":return 96*b/2.54;case"mm":return 96*b/2.54/10;case"in":return 96*b;case"pt":return 72*b;case"pc":return 72*b/12;default:return b}}c.match=d,c.parse=e;var i=/(?:(only|not)?\s*([^\s\(\)]+)(?:\s*and)?\s*)?(.+)?/i,j=/\(\s*([^\s\:\)]+)\s*(?:\:\s*([^\s\)]+))?\s*\)/,k=/^(?:(min|max)-)?(.+)/,l=/(em|rem|px|cm|mm|in|pt|pc)?$/,m=/(dpi|dpcm|dppx)?$/},{}],8:[function(a,b,c){var d={CSSRule:a("./CSSRule").CSSRule,MatcherList:a("./MatcherList").MatcherList};d.CSSDocumentRule=function(){d.CSSRule.call(this),this.matcher=new d.MatcherList,this.cssRules=[]},d.CSSDocumentRule.prototype=new d.CSSRule,d.CSSDocumentRule.prototype.constructor=d.CSSDocumentRule,d.CSSDocumentRule.prototype.type=10,Object.defineProperty(d.CSSDocumentRule.prototype,"cssText",{get:function(){for(var a=[],b=0,c=this.cssRules.length;c>b;b++)a.push(this.cssRules[b].cssText);return"@-moz-document "+this.matcher.matcherText+" {"+a.join("")+"}"}}),c.CSSDocumentRule=d.CSSDocumentRule},{"./CSSRule":14,"./MatcherList":20}],9:[function(a,b,c){var d={CSSStyleDeclaration:a("./CSSStyleDeclaration").CSSStyleDeclaration,CSSRule:a("./CSSRule").CSSRule};d.CSSFontFaceRule=function(){d.CSSRule.call(this),this.style=new d.CSSStyleDeclaration,this.style.parentRule=this},d.CSSFontFaceRule.prototype=new d.CSSRule,d.CSSFontFaceRule.prototype.constructor=d.CSSFontFaceRule,d.CSSFontFaceRule.prototype.type=5,Object.defineProperty(d.CSSFontFaceRule.prototype,"cssText",{get:function(){return"@font-face {"+this.style.cssText+"}"}}),c.CSSFontFaceRule=d.CSSFontFaceRule},{"./CSSRule":14,"./CSSStyleDeclaration":15}],10:[function(a,b,c){var d={CSSRule:a("./CSSRule").CSSRule,CSSStyleSheet:a("./CSSStyleSheet").CSSStyleSheet,MediaList:a("./MediaList").MediaList};d.CSSImportRule=function(){d.CSSRule.call(this),this.href="",this.media=new d.MediaList,this.styleSheet=new d.CSSStyleSheet},d.CSSImportRule.prototype=new d.CSSRule,d.CSSImportRule.prototype.constructor=d.CSSImportRule,d.CSSImportRule.prototype.type=3,Object.defineProperty(d.CSSImportRule.prototype,"cssText",{get:function(){var a=this.media.mediaText;return"@import url("+this.href+")"+(a?" "+a:"")+";"},set:function(a){for(var b,c,d=0,e="",f="";c=a.charAt(d);d++)switch(c){case" ":case"	":case"\r":case"\n":case"\f":"after-import"===e?e="url":f+=c;break;case"@":e||a.indexOf("@import",d)!==d||(e="after-import",d+="import".length,f="");break;case"u":if("url"===e&&a.indexOf("url(",d)===d){if(b=a.indexOf(")",d+1),-1===b)throw d+': ")" not found';d+="url(".length;var g=a.slice(d,b);g[0]===g[g.length-1]&&('"'!==g[0]&&"'"!==g[0]||(g=g.slice(1,-1))),this.href=g,d=b,e="media"}break;case'"':if("url"===e){if(b=a.indexOf('"',d+1),!b)throw d+": '\"' not found";this.href=a.slice(d+1,b),d=b,e="media"}break;case"'":if("url"===e){if(b=a.indexOf("'",d+1),!b)throw d+': "\'" not found';this.href=a.slice(d+1,b),d=b,e="media"}break;case";":"media"===e&&f&&(this.media.mediaText=f.trim());break;default:"media"===e&&(f+=c)}}}),c.CSSImportRule=d.CSSImportRule},{"./CSSRule":14,"./CSSStyleSheet":17,"./MediaList":21}],11:[function(a,b,c){var d={CSSRule:a("./CSSRule").CSSRule,CSSStyleDeclaration:a("./CSSStyleDeclaration").CSSStyleDeclaration};d.CSSKeyframeRule=function(){d.CSSRule.call(this),this.keyText="",this.style=new d.CSSStyleDeclaration,this.style.parentRule=this},d.CSSKeyframeRule.prototype=new d.CSSRule,d.CSSKeyframeRule.prototype.constructor=d.CSSKeyframeRule,d.CSSKeyframeRule.prototype.type=9,Object.defineProperty(d.CSSKeyframeRule.prototype,"cssText",{get:function(){return this.keyText+" {"+this.style.cssText+"} "}}),c.CSSKeyframeRule=d.CSSKeyframeRule},{"./CSSRule":14,"./CSSStyleDeclaration":15}],12:[function(a,b,c){var d={CSSRule:a("./CSSRule").CSSRule};d.CSSKeyframesRule=function(){d.CSSRule.call(this),this.name="",this.cssRules=[]},d.CSSKeyframesRule.prototype=new d.CSSRule,d.CSSKeyframesRule.prototype.constructor=d.CSSKeyframesRule,d.CSSKeyframesRule.prototype.type=8,Object.defineProperty(d.CSSKeyframesRule.prototype,"cssText",{get:function(){for(var a=[],b=0,c=this.cssRules.length;c>b;b++)a.push("  "+this.cssRules[b].cssText);return"@"+(this._vendorPrefix||"")+"keyframes "+this.name+" { \n"+a.join("\n")+"\n}"}}),c.CSSKeyframesRule=d.CSSKeyframesRule},{"./CSSRule":14}],13:[function(a,b,c){var d={CSSRule:a("./CSSRule").CSSRule,MediaList:a("./MediaList").MediaList};d.CSSMediaRule=function(){d.CSSRule.call(this),this.media=new d.MediaList,this.cssRules=[]},d.CSSMediaRule.prototype=new d.CSSRule,d.CSSMediaRule.prototype.constructor=d.CSSMediaRule,d.CSSMediaRule.prototype.type=4,Object.defineProperty(d.CSSMediaRule.prototype,"cssText",{get:function(){for(var a=[],b=0,c=this.cssRules.length;c>b;b++)a.push(this.cssRules[b].cssText);return"@media "+this.media.mediaText+" {"+a.join("")+"}"}}),c.CSSMediaRule=d.CSSMediaRule},{"./CSSRule":14,"./MediaList":21}],14:[function(a,b,c){var d={};d.CSSRule=function(){this.parentRule=null,this.parentStyleSheet=null},d.CSSRule.UNKNOWN_RULE=0,d.CSSRule.STYLE_RULE=1,d.CSSRule.CHARSET_RULE=2,d.CSSRule.IMPORT_RULE=3,d.CSSRule.MEDIA_RULE=4,d.CSSRule.FONT_FACE_RULE=5,d.CSSRule.PAGE_RULE=6,d.CSSRule.KEYFRAMES_RULE=7,d.CSSRule.KEYFRAME_RULE=8,d.CSSRule.MARGIN_RULE=9,d.CSSRule.NAMESPACE_RULE=10,d.CSSRule.COUNTER_STYLE_RULE=11,d.CSSRule.SUPPORTS_RULE=12,d.CSSRule.DOCUMENT_RULE=13,d.CSSRule.FONT_FEATURE_VALUES_RULE=14,d.CSSRule.VIEWPORT_RULE=15,d.CSSRule.REGION_STYLE_RULE=16,d.CSSRule.prototype={constructor:d.CSSRule},c.CSSRule=d.CSSRule},{}],15:[function(a,b,c){var d={};d.CSSStyleDeclaration=function(){this.length=0,this.parentRule=null,this._importants={}},d.CSSStyleDeclaration.prototype={constructor:d.CSSStyleDeclaration,getPropertyValue:function(a){return this[a]||""},setProperty:function(a,b,c){if(this[a]){var d=Array.prototype.indexOf.call(this,a);0>d&&(this[this.length]=a,this.length++)}else this[this.length]=a,this.length++;this[a]=b,this._importants[a]=c},removeProperty:function(a){if(!(a in this))return"";var b=Array.prototype.indexOf.call(this,a);if(0>b)return"";var c=this[a];return this[a]="",
Array.prototype.splice.call(this,b,1),c},getPropertyCSSValue:function(){},getPropertyPriority:function(a){return this._importants[a]||""},getPropertyShorthand:function(){},isPropertyImplicit:function(){},get cssText(){for(var a=[],b=0,c=this.length;c>b;++b){var d=this[b],e=this.getPropertyValue(d),f=this.getPropertyPriority(d);f&&(f=" !"+f),a[b]=d+": "+e+f+";"}return a.join(" ")},set cssText(a){var b,c;for(b=this.length;b--;)c=this[b],this[c]="";Array.prototype.splice.call(this,0,this.length),this._importants={};var e=d.parse("#bogus{"+a+"}").cssRules[0].style,f=e.length;for(b=0;f>b;++b)c=e[b],this.setProperty(e[b],e.getPropertyValue(c),e.getPropertyPriority(c))}},c.CSSStyleDeclaration=d.CSSStyleDeclaration,d.parse=a("./parse").parse},{"./parse":25}],16:[function(a,b,c){var d={CSSStyleDeclaration:a("./CSSStyleDeclaration").CSSStyleDeclaration,CSSRule:a("./CSSRule").CSSRule};d.CSSStyleRule=function(){d.CSSRule.call(this),this.selectorText="",this.style=new d.CSSStyleDeclaration,this.style.parentRule=this},d.CSSStyleRule.prototype=new d.CSSRule,d.CSSStyleRule.prototype.constructor=d.CSSStyleRule,d.CSSStyleRule.prototype.type=1,Object.defineProperty(d.CSSStyleRule.prototype,"cssText",{get:function(){var a;return a=this.selectorText?this.selectorText+" {"+this.style.cssText+"}":""},set:function(a){var b=d.CSSStyleRule.parse(a);this.style=b.style,this.selectorText=b.selectorText}}),d.CSSStyleRule.parse=function(a){for(var b,c,e,f=0,g="selector",h=f,i="",j={selector:!0,value:!0},k=new d.CSSStyleRule,l="";e=a.charAt(f);f++)switch(e){case" ":case"	":case"\r":case"\n":case"\f":if(j[g])switch(a.charAt(f-1)){case" ":case"	":case"\r":case"\n":case"\f":break;default:i+=" "}break;case'"':if(h=f+1,b=a.indexOf('"',h)+1,!b)throw'" is missing';i+=a.slice(f,b),f=b-1;break;case"'":if(h=f+1,b=a.indexOf("'",h)+1,!b)throw"' is missing";i+=a.slice(f,b),f=b-1;break;case"/":if("*"===a.charAt(f+1)){if(f+=2,b=a.indexOf("*/",f),-1===b)throw new SyntaxError("Missing */");f=b+1}else i+=e;break;case"{":"selector"===g&&(k.selectorText=i.trim(),i="",g="name");break;case":":"name"===g?(c=i.trim(),i="",g="value"):i+=e;break;case"!":"value"===g&&a.indexOf("!important",f)===f?(l="important",f+="important".length):i+=e;break;case";":"value"===g?(k.style.setProperty(c,i.trim(),l),l="",i="",g="name"):i+=e;break;case"}":if("value"===g)k.style.setProperty(c,i.trim(),l),l="",i="";else{if("name"===g)break;i+=e}g="selector";break;default:i+=e}return k},c.CSSStyleRule=d.CSSStyleRule},{"./CSSRule":14,"./CSSStyleDeclaration":15}],17:[function(a,b,c){var d={StyleSheet:a("./StyleSheet").StyleSheet,CSSStyleRule:a("./CSSStyleRule").CSSStyleRule};d.CSSStyleSheet=function(){d.StyleSheet.call(this),this.cssRules=[]},d.CSSStyleSheet.prototype=new d.StyleSheet,d.CSSStyleSheet.prototype.constructor=d.CSSStyleSheet,d.CSSStyleSheet.prototype.insertRule=function(a,b){if(0>b||b>this.cssRules.length)throw new RangeError("INDEX_SIZE_ERR");var c=d.parse(a).cssRules[0];return c.parentStyleSheet=this,this.cssRules.splice(b,0,c),b},d.CSSStyleSheet.prototype.deleteRule=function(a){if(0>a||a>=this.cssRules.length)throw new RangeError("INDEX_SIZE_ERR");this.cssRules.splice(a,1)},d.CSSStyleSheet.prototype.toString=function(){for(var a="",b=this.cssRules,c=0;c<b.length;c++)a+=b[c].cssText+"\n";return a},c.CSSStyleSheet=d.CSSStyleSheet,d.parse=a("./parse").parse},{"./CSSStyleRule":16,"./StyleSheet":22,"./parse":25}],18:[function(a,b,c){var d={};d.CSSValue=function(){},d.CSSValue.prototype={constructor:d.CSSValue,set cssText(a){var b=this._getConstructorName();throw new Error('DOMException: property "cssText" of "'+b+'" is readonly and can not be replaced with "'+a+'"!')},get cssText(){var a=this._getConstructorName();throw new Error('getter "cssText" of "'+a+'" is not implemented!')},_getConstructorName:function(){var a=this.constructor.toString(),b=a.match(/function\s([^\(]+)/),c=b[1];return c}},c.CSSValue=d.CSSValue},{}],19:[function(a,b,c){var d={CSSValue:a("./CSSValue").CSSValue};d.CSSValueExpression=function(a,b){this._token=a,this._idx=b},d.CSSValueExpression.prototype=new d.CSSValue,d.CSSValueExpression.prototype.constructor=d.CSSValueExpression,d.CSSValueExpression.prototype.parse=function(){for(var a,b=this._token,c=this._idx,d="",e="",f="",g=[];;++c){if(d=b.charAt(c),""===d){f="css expression error: unfinished expression!";break}switch(d){case"(":g.push(d),e+=d;break;case")":g.pop(d),e+=d;break;case"/":(a=this._parseJSComment(b,c))?a.error?f="css expression error: unfinished comment in expression!":c=a.idx:(a=this._parseJSRexExp(b,c))?(c=a.idx,e+=a.text):e+=d;break;case"'":case'"':a=this._parseJSString(b,c,d),a?(c=a.idx,e+=a.text):e+=d;break;default:e+=d}if(f)break;if(0===g.length)break}var h;return h=f?{error:f}:{idx:c,expression:e}},d.CSSValueExpression.prototype._parseJSComment=function(a,b){var c,d=a.charAt(b+1);if("/"===d||"*"===d){var e,f,g=b;if("/"===d?f="\n":"*"===d&&(f="*/"),e=a.indexOf(f,g+1+1),-1!==e)return e=e+f.length-1,c=a.substring(b,e+1),{idx:e,text:c};var h="css expression error: unfinished comment in expression!";return{error:h}}return!1},d.CSSValueExpression.prototype._parseJSString=function(a,b,c){var d,e=this._findMatchedIdx(a,b,c);return-1===e?!1:(d=a.substring(b,e+c.length),{idx:e,text:d})},d.CSSValueExpression.prototype._parseJSRexExp=function(a,b){var c=a.substring(0,b).replace(/\s+$/,""),d=[/^$/,/\($/,/\[$/,/\!$/,/\+$/,/\-$/,/\*$/,/\/\s+/,/\%$/,/\=$/,/\>$/,/<$/,/\&$/,/\|$/,/\^$/,/\~$/,/\?$/,/\,$/,/delete$/,/in$/,/instanceof$/,/new$/,/typeof$/,/void$/],e=d.some(function(a){return a.test(c)});if(e){var f="/";return this._parseJSString(a,b,f)}return!1},d.CSSValueExpression.prototype._findMatchedIdx=function(a,b,c){for(var d,e=b,f=-1;;){if(d=a.indexOf(c,e+1),-1===d){d=f;break}var g=a.substring(b+1,d),h=g.match(/\\+$/);if(!h||h[0]%2===0)break;e=d}var i=a.indexOf("\n",b+1);return d>i&&(d=f),d},c.CSSValueExpression=d.CSSValueExpression},{"./CSSValue":18}],20:[function(a,b,c){var d={};d.MatcherList=function(){this.length=0},d.MatcherList.prototype={constructor:d.MatcherList,get matcherText(){return Array.prototype.join.call(this,", ")},set matcherText(a){for(var b=a.split(","),c=this.length=b.length,d=0;c>d;d++)this[d]=b[d].trim()},appendMatcher:function(a){-1===Array.prototype.indexOf.call(this,a)&&(this[this.length]=a,this.length++)},deleteMatcher:function(a){var b=Array.prototype.indexOf.call(this,a);-1!==b&&Array.prototype.splice.call(this,b,1)}},c.MatcherList=d.MatcherList},{}],21:[function(a,b,c){var d={};d.MediaList=function(){this.length=0},d.MediaList.prototype={constructor:d.MediaList,get mediaText(){return Array.prototype.join.call(this,", ")},set mediaText(a){for(var b=a.split(","),c=this.length=b.length,d=0;c>d;d++)this[d]=b[d].trim()},appendMedium:function(a){-1===Array.prototype.indexOf.call(this,a)&&(this[this.length]=a,this.length++)},deleteMedium:function(a){var b=Array.prototype.indexOf.call(this,a);-1!==b&&Array.prototype.splice.call(this,b,1)}},c.MediaList=d.MediaList},{}],22:[function(a,b,c){var d={};d.StyleSheet=function(){this.parentStyleSheet=null},c.StyleSheet=d.StyleSheet},{}],23:[function(a,b,c){var d={CSSStyleSheet:a("./CSSStyleSheet").CSSStyleSheet,CSSStyleRule:a("./CSSStyleRule").CSSStyleRule,CSSMediaRule:a("./CSSMediaRule").CSSMediaRule,CSSStyleDeclaration:a("./CSSStyleDeclaration").CSSStyleDeclaration,CSSKeyframeRule:a("./CSSKeyframeRule").CSSKeyframeRule,CSSKeyframesRule:a("./CSSKeyframesRule").CSSKeyframesRule};d.clone=function e(a){var b=new d.CSSStyleSheet,c=a.cssRules;if(!c)return b;for(var f={1:d.CSSStyleRule,4:d.CSSMediaRule,8:d.CSSKeyframesRule,9:d.CSSKeyframeRule},g=0,h=c.length;h>g;g++){var i=c[g],j=b.cssRules[g]=new f[i.type],k=i.style;if(k){for(var l=j.style=new d.CSSStyleDeclaration,m=0,n=k.length;n>m;m++){var o=l[m]=k[m];l[o]=k[o],l._importants[o]=k.getPropertyPriority(o)}l.length=k.length}i.hasOwnProperty("keyText")&&(j.keyText=i.keyText),i.hasOwnProperty("selectorText")&&(j.selectorText=i.selectorText),i.hasOwnProperty("mediaText")&&(j.mediaText=i.mediaText),i.hasOwnProperty("cssRules")&&(j.cssRules=e(i).cssRules)}return b},c.clone=d.clone},{"./CSSKeyframeRule":11,"./CSSKeyframesRule":12,"./CSSMediaRule":13,"./CSSStyleDeclaration":15,"./CSSStyleRule":16,"./CSSStyleSheet":17}],24:[function(a,b,c){"use strict";c.CSSStyleDeclaration=a("./CSSStyleDeclaration").CSSStyleDeclaration,c.CSSRule=a("./CSSRule").CSSRule,c.CSSStyleRule=a("./CSSStyleRule").CSSStyleRule,c.MediaList=a("./MediaList").MediaList,c.CSSMediaRule=a("./CSSMediaRule").CSSMediaRule,c.CSSImportRule=a("./CSSImportRule").CSSImportRule,c.CSSFontFaceRule=a("./CSSFontFaceRule").CSSFontFaceRule,c.StyleSheet=a("./StyleSheet").StyleSheet,c.CSSStyleSheet=a("./CSSStyleSheet").CSSStyleSheet,c.CSSKeyframesRule=a("./CSSKeyframesRule").CSSKeyframesRule,c.CSSKeyframeRule=a("./CSSKeyframeRule").CSSKeyframeRule,c.MatcherList=a("./MatcherList").MatcherList,c.CSSDocumentRule=a("./CSSDocumentRule").CSSDocumentRule,c.CSSValue=a("./CSSValue").CSSValue,c.CSSValueExpression=a("./CSSValueExpression").CSSValueExpression,c.parse=a("./parse").parse,c.clone=a("./clone").clone},{"./CSSDocumentRule":8,"./CSSFontFaceRule":9,"./CSSImportRule":10,"./CSSKeyframeRule":11,"./CSSKeyframesRule":12,"./CSSMediaRule":13,"./CSSRule":14,"./CSSStyleDeclaration":15,"./CSSStyleRule":16,"./CSSStyleSheet":17,"./CSSValue":18,"./CSSValueExpression":19,"./MatcherList":20,"./MediaList":21,"./StyleSheet":22,"./clone":23,"./parse":25}],25:[function(a,b,c){var d={};d.parse=function(a){for(var b,c,e,f,g,h,i,j,k,l,m=0,n="before-selector",o="",p={selector:!0,value:!0,atRule:!0,"importRule-begin":!0,importRule:!0,atBlock:!0,"documentRule-begin":!0},q=new d.CSSStyleSheet,r=q,s="",t=/@(-(?:\w+-)+)?keyframes/g,u=function(b){var c=a.substring(0,m).split("\n"),d=c.length,e=c.pop().length+1,f=new Error(b+" (line "+d+", char "+e+")");throw f.line=d,f["char"]=e,f.styleSheet=q,f};l=a.charAt(m);m++)switch(l){case" ":case"	":case"\r":case"\n":case"\f":p[n]&&(o+=l);break;case'"':b=m+1;do b=a.indexOf('"',b)+1,b||u('Unmatched "');while("\\"===a[b-2]);switch(o+=a.slice(m,b),m=b-1,n){case"before-value":n="value";break;case"importRule-begin":n="importRule"}break;case"'":b=m+1;do b=a.indexOf("'",b)+1,b||u("Unmatched '");while("\\"===a[b-2]);switch(o+=a.slice(m,b),m=b-1,n){case"before-value":n="value";break;case"importRule-begin":n="importRule"}break;case"/":"*"===a.charAt(m+1)?(m+=2,b=a.indexOf("*/",m),-1===b?u("Missing */"):m=b+1):o+=l,"importRule-begin"===n&&(o+=" ",n="importRule");break;case"@":if(a.indexOf("@-moz-document",m)===m){n="documentRule-begin",k=new d.CSSDocumentRule,k.__starts=m,m+="-moz-document".length,o="";break}if(a.indexOf("@media",m)===m){n="atBlock",g=new d.CSSMediaRule,g.__starts=m,m+="media".length,o="";break}if(a.indexOf("@import",m)===m){n="importRule-begin",m+="import".length,o+="@import";break}if(a.indexOf("@font-face",m)===m){n="fontFaceRule-begin",m+="font-face".length,i=new d.CSSFontFaceRule,i.__starts=m,o="";break}t.lastIndex=m;var v=t.exec(a);if(v&&v.index===m){n="keyframesRule-begin",j=new d.CSSKeyframesRule,j.__starts=m,j._vendorPrefix=v[1],m+=v[0].length-1,o="";break}"selector"===n&&(n="atRule"),o+=l;break;case"{":"selector"===n||"atRule"===n?(f.selectorText=o.trim(),f.style.__starts=m,o="",n="before-name"):"atBlock"===n?(g.media.mediaText=o.trim(),r=c=g,g.parentStyleSheet=q,o="",n="before-selector"):"fontFaceRule-begin"===n?(c&&(i.parentRule=c),i.parentStyleSheet=q,f=i,o="",n="before-name"):"keyframesRule-begin"===n?(j.name=o.trim(),c&&(j.parentRule=c),j.parentStyleSheet=q,r=c=j,o="",n="keyframeRule-begin"):"keyframeRule-begin"===n?(f=new d.CSSKeyframeRule,f.keyText=o.trim(),f.__starts=m,o="",n="before-name"):"documentRule-begin"===n&&(k.matcher.matcherText=o.trim(),c&&(k.parentRule=c),r=c=k,k.parentStyleSheet=q,o="",n="before-selector");break;case":":"name"===n?(e=o.trim(),o="",n="before-value"):o+=l;break;case"(":if("value"===n)if("expression"===o.trim()){var w=new d.CSSValueExpression(a,m).parse();w.error?u(w.error):(o+=w.expression,m=w.idx)}else n="value-parenthesis",o+=l;else o+=l;break;case")":"value-parenthesis"===n&&(n="value"),o+=l;break;case"!":"value"===n&&a.indexOf("!important",m)===m?(s="important",m+="important".length):o+=l;break;case";":switch(n){case"value":f.style.setProperty(e,o.trim(),s),s="",o="",n="before-name";break;case"atRule":o="",n="before-selector";break;case"importRule":h=new d.CSSImportRule,h.parentStyleSheet=h.styleSheet.parentStyleSheet=q,h.cssText=o+l,q.cssRules.push(h),o="",n="before-selector";break;default:o+=l}break;case"}":switch(n){case"value":f.style.setProperty(e,o.trim(),s),s="";case"before-name":case"name":f.__ends=m+1,c&&(f.parentRule=c),f.parentStyleSheet=q,r.cssRules.push(f),o="",n=r.constructor===d.CSSKeyframesRule?"keyframeRule-begin":"before-selector";break;case"keyframeRule-begin":case"before-selector":case"selector":c||u("Unexpected }"),r.__ends=m+1,q.cssRules.push(r),r=q,c=null,o="",n="before-selector"}break;default:switch(n){case"before-selector":n="selector",f=new d.CSSStyleRule,f.__starts=m;break;case"before-name":n="name";break;case"before-value":n="value";break;case"importRule-begin":n="importRule"}o+=l}return q},c.parse=d.parse,d.CSSStyleSheet=a("./CSSStyleSheet").CSSStyleSheet,d.CSSStyleRule=a("./CSSStyleRule").CSSStyleRule,d.CSSImportRule=a("./CSSImportRule").CSSImportRule,d.CSSMediaRule=a("./CSSMediaRule").CSSMediaRule,d.CSSFontFaceRule=a("./CSSFontFaceRule").CSSFontFaceRule,d.CSSStyleDeclaration=a("./CSSStyleDeclaration").CSSStyleDeclaration,d.CSSKeyframeRule=a("./CSSKeyframeRule").CSSKeyframeRule,d.CSSKeyframesRule=a("./CSSKeyframesRule").CSSKeyframesRule,d.CSSValueExpression=a("./CSSValueExpression").CSSValueExpression,d.CSSDocumentRule=a("./CSSDocumentRule").CSSDocumentRule},{"./CSSDocumentRule":8,"./CSSFontFaceRule":9,"./CSSImportRule":10,"./CSSKeyframeRule":11,"./CSSKeyframesRule":12,"./CSSMediaRule":13,"./CSSStyleDeclaration":15,"./CSSStyleRule":16,"./CSSStyleSheet":17,"./CSSValueExpression":19}],26:[function(a,b,c){"use strict";var d=a("./cssSupport"),e=function(a){var b=/^[\t\r\f\n ]*(.+?)[\t\r\f\n ]*$/;return a.replace(b,"$1")};c.extractCssUrl=function(a){var b,c=/^url\(([^\)]+)\)/;if(!c.test(a))throw new Error("Invalid url");return b=c.exec(a)[1],d.unquoteString(e(b))};var f=function(a){var b,c="\\s*(?:\"[^\"]*\"|'[^']*'|[^\\(]+)\\s*",d="(url\\("+c+"\\)|[^,\\s]+)",e="(?:\\s*"+d+")+",f="^\\s*("+e+")(?:\\s*,\\s*("+e+"))*\\s*$",g=new RegExp(e,"g"),h=[],i=function(a){var b,c=new RegExp(d,"g"),e=[];for(b=c.exec(a);b;)e.push(b[1]),b=c.exec(a);return e};if(a.match(new RegExp(f))){for(b=g.exec(a);b;)h.push(i(b[0])),b=g.exec(a);return h}return[]},g=function(a){var b,d;for(b=0;b<a.length;b++)try{return d=c.extractCssUrl(a[b]),{url:d,idx:b}}catch(e){}};c.parse=function(a){var b=f(a);return b.map(function(a){var b=g(a);return b?{preUrl:a.slice(0,b.idx),url:b.url,postUrl:a.slice(b.idx+1)}:{preUrl:a}})},c.serialize=function(a){var b=a.map(function(a){var b=[].concat(a.preUrl);return a.url&&b.push('url("'+a.url+'")'),a.postUrl&&(b=b.concat(a.postUrl)),b.join(" ")});return b.join(", ")}},{"./cssSupport":27}],27:[function(a,b,c){"use strict";var d=a("cssom");c.unquoteString=function(a){var b=/^"(.*)"$/,c=/^'(.*)'$/;return b.test(a)?a.replace(b,"$1"):c.test(a)?a.replace(c,"$1"):a};var e=function(a){var b,c=document.implementation.createHTMLDocument(""),d=document.createElement("style");return d.textContent=a,c.body.appendChild(d),b=d.sheet.cssRules,Array.prototype.slice.call(b)},f=function(){var a=e("a{background:url(i)}");return!a.length||a[0].cssText.indexOf("url()")>=0}(),g=function(){var a=e('@font-face { font-family: "f"; src: url("f"); }');return!a.length||/url\(['"]*\)/.test(a[0].cssText)}();c.rulesForCssText=function(a){return(f||g)&&d.parse?d.parse(a).cssRules:e(a)},c.cssRulesToText=function(a){return a.reduce(function(a,b){return a+b.cssText},"")},c.exchangeRule=function(a,b,d){var e=a.indexOf(b);a[e]=c.rulesForCssText(d)[0]},c.changeFontFaceRuleSrc=function(a,b,d){var e="@font-face { font-family: "+b.style.getPropertyValue("font-family")+"; ";b.style.getPropertyValue("font-style")&&(e+="font-style: "+b.style.getPropertyValue("font-style")+"; "),b.style.getPropertyValue("font-weight")&&(e+="font-weight: "+b.style.getPropertyValue("font-weight")+"; "),e+="src: "+d+"}",c.exchangeRule(a,b,e)}},{cssom:24}],28:[function(a,b,c){"use strict";var d=a("./util"),e=a("./inlineImage"),f=a("./inlineScript"),g=a("./inlineCss"),h=a("./cssSupport"),i=function(a){return d.joinUrl(a,".")},j=function(a){var b=a.map(function(b,c){return c===a.length-1&&(b={baseUrl:i(b.baseUrl)}),JSON.stringify(b)});return b},k=function(a,b){return b.cache!==!1&&"none"!==b.cache&&b.cacheBucket?d.memoize(a,j,b.cacheBucket):a},l=function(a,b,c){var d=h.rulesForCssText(a);return g.loadCSSImportsForRules(d,b,c).then(function(b){return g.loadAndInlineCSSResourcesForRules(d,c).then(function(c){var e=b.errors.concat(c.errors),f=b.hasChanges||c.hasChanges;return f&&(a=h.cssRulesToText(d)),{hasChanges:f,content:a,errors:e}})})},m=function(a,b,c){var e=a.textContent,f=k(l,b);return f(e,c,b).then(function(b){return b.hasChanges&&(a.childNodes[0].nodeValue=b.content),d.cloneArray(b.errors)})},n=function(a){var b=a.getElementsByTagName("style");return Array.prototype.filter.call(b,function(a){return!a.attributes.type||"text/css"===a.attributes.type.value})};c.loadAndInlineStyles=function(a,b){var c,e=n(a),f=[],g=[];return c=d.clone(b),c.baseUrl=c.baseUrl||d.getDocumentBaseUrl(a),d.all(e.map(function(a){return m(a,c,g).then(function(a){f=f.concat(a)})})).then(function(){return f})};var o=function(a,b){var c,d=a.parentNode;b=b.trim(),b&&(c=a.ownerDocument.createElement("style"),c.type="text/css",c.appendChild(a.ownerDocument.createTextNode(b)),d.insertBefore(c,a)),d.removeChild(a)},p=function(a,b){return d.ajax(a,b).then(function(a){var b=h.rulesForCssText(a);return{content:a,cssRules:b}}).then(function(b){var c=g.adjustPathsOfCssResources(a,b.cssRules);return{content:b.content,cssRules:b.cssRules,hasChanges:c}}).then(function(a){return g.loadCSSImportsForRules(a.cssRules,[],b).then(function(b){return{content:a.content,cssRules:a.cssRules,hasChanges:a.hasChanges||b.hasChanges,errors:b.errors}})}).then(function(a){return g.loadAndInlineCSSResourcesForRules(a.cssRules,b).then(function(b){return{content:a.content,cssRules:a.cssRules,hasChanges:a.hasChanges||b.hasChanges,errors:a.errors.concat(b.errors)}})}).then(function(a){var b=a.content;return a.hasChanges&&(b=h.cssRulesToText(a.cssRules)),{content:b,errors:a.errors}})},q=function(a,b){var c=a.attributes.href.value,e=d.getDocumentBaseUrl(a.ownerDocument),f=d.clone(b);!f.baseUrl&&e&&(f.baseUrl=e);var g=k(p,b);return g(c,f).then(function(a){return{content:a.content,errors:d.cloneArray(a.errors)}})},r=function(a){var b=a.getElementsByTagName("link");return Array.prototype.filter.call(b,function(a){return a.attributes.rel&&"stylesheet"===a.attributes.rel.value&&(!a.attributes.type||"text/css"===a.attributes.type.value)})};c.loadAndInlineCssLinks=function(a,b){var c=r(a),e=[];return d.all(c.map(function(a){return q(a,b).then(function(b){o(a,b.content+"\n"),e=e.concat(b.errors)},function(a){e.push({resourceType:"stylesheet",url:a.url,msg:"Unable to load stylesheet "+a.url})})})).then(function(){return e})},c.loadAndInlineImages=e.inline,c.loadAndInlineScript=f.inline,c.inlineReferences=function(a,b){var e=[],f=[c.loadAndInlineImages,c.loadAndInlineStyles,c.loadAndInlineCssLinks];return b.inlineScripts!==!1&&f.push(c.loadAndInlineScript),d.all(f.map(function(c){return c(a,b).then(function(a){e=e.concat(a)})})).then(function(){return e})}},{"./cssSupport":27,"./inlineCss":29,"./inlineImage":30,"./inlineScript":31,"./util":32}],29:[function(a,b,c){"use strict";var d=a("ayepromise"),e=a("./util"),f=a("./cssSupport"),g=a("./backgroundValueParser"),h=a("css-font-face-src"),i=function(a,b,c){a.style.setProperty(b,c,a.style.getPropertyPriority(b))},j=function(a){return a.filter(function(a){return a.type===window.CSSRule.STYLE_RULE&&(a.style.getPropertyValue("background-image")||a.style.getPropertyValue("background"))})},k=function(a){var b=[];return a.forEach(function(a){a.style.getPropertyValue("background-image")?b.push({property:"background-image",value:a.style.getPropertyValue("background-image"),rule:a}):a.style.getPropertyValue("background")&&b.push({property:"background",value:a.style.getPropertyValue("background"),rule:a})}),b},l=function(a){return a.filter(function(a){return a.type===window.CSSRule.FONT_FACE_RULE&&a.style.getPropertyValue("src")})},m=function(a){return a.filter(function(a){return a.type===window.CSSRule.IMPORT_RULE&&a.href})},n=function(a){var b=[];return a.forEach(function(a,c){a.url&&!e.isDataUri(a.url)&&b.push(c)}),b},o=function(a){var b=[];return a.forEach(function(a,c){a.url&&!e.isDataUri(a.url)&&b.push(c)}),b};c.adjustPathsOfCssResources=function(a,b){var c=j(b),d=k(c),p=!1;return d.forEach(function(b){var c,d=g.parse(b.value),f=n(d);f.length>0&&(f.forEach(function(b){var c=d[b].url,f=e.joinUrl(a,c);d[b].url=f}),c=g.serialize(d),i(b.rule,b.property,c),p=!0)}),l(b).forEach(function(c){var d,g,i=c.style.getPropertyValue("src");try{d=h.parse(i)}catch(j){return}g=o(d),g.length>0&&(g.forEach(function(b){var c=d[b].url,f=e.joinUrl(a,c);d[b].url=f}),f.changeFontFaceRuleSrc(b,c,h.serialize(d)),p=!0)}),m(b).forEach(function(c){var d=c.href,g=e.joinUrl(a,d);f.exchangeRule(b,c,"@import url("+g+");"),p=!0}),p};var p=function(a,b,c){var d=a.indexOf(b);a.splice(d,1),c.forEach(function(b,c){a.splice(d+c,0,b)})},q=function(a){var b=d.defer();return b.resolve(a),b.promise},r=function(a,b,d,g){var h,i=b.href;return i=f.unquoteString(i),h=e.joinUrl(g.baseUrl,i),d.indexOf(h)>=0?(p(a,b,[]),q([])):(d.push(h),e.ajax(i,g).then(function(e){var h=f.rulesForCssText(e);return c.loadCSSImportsForRules(h,d,g).then(function(d){return c.adjustPathsOfCssResources(i,h),p(a,b,h),d.errors})},function(a){throw{resourceType:"stylesheet",url:a.url,msg:"Unable to load stylesheet "+a.url}}))};c.loadCSSImportsForRules=function(a,b,c){var d=m(a),f=[],g=!1;return e.all(d.map(function(d){return r(a,d,b,c).then(function(a){f=f.concat(a),g=!0},function(a){f.push(a)})})).then(function(){return{hasChanges:g,errors:f}})};var s=function(a,b){var c=g.parse(a),d=n(c),f=!1;return e.collectAndReportErrors(d.map(function(a){var d=c[a].url;return e.getDataURIForImageURL(d,b).then(function(b){c[a].url=b,f=!0},function(a){throw{resourceType:"backgroundImage",url:a.url,msg:"Unable to load background-image "+a.url}})})).then(function(a){return{backgroundValue:g.serialize(c),hasChanges:f,errors:a}})},t=function(a,b){var c=j(a),d=k(c),f=[],g=!1;return e.all(d.map(function(a){return s(a.value,b).then(function(b){b.hasChanges&&(i(a.rule,a.property,b.backgroundValue),g=!0),f=f.concat(b.errors)})})).then(function(){return{hasChanges:g,errors:f}})},u=function(a,b){var c,d,f=!1;try{c=h.parse(a)}catch(g){c=[]}return d=o(c),e.collectAndReportErrors(d.map(function(a){var d=c[a],g=d.format||"woff";return e.binaryAjax(d.url,b).then(function(a){var b=btoa(a);d.url="data:font/"+g+";base64,"+b,f=!0},function(a){throw{resourceType:"fontFace",url:a.url,msg:"Unable to load font-face "+a.url}})})).then(function(a){return{srcDeclarationValue:h.serialize(c),hasChanges:f,errors:a}})},v=function(a,b){var c=l(a),d=[],g=!1;return e.all(c.map(function(c){var e=c.style.getPropertyValue("src");return u(e,b).then(function(b){b.hasChanges&&(f.changeFontFaceRuleSrc(a,c,b.srcDeclarationValue),g=!0),d=d.concat(b.errors)})})).then(function(){return{hasChanges:g,errors:d}})};c.loadAndInlineCSSResourcesForRules=function(a,b){var c=!1,d=[];return e.all([t,v].map(function(e){return e(a,b).then(function(a){c=c||a.hasChanges,d=d.concat(a.errors)})})).then(function(){return{hasChanges:c,errors:d}})}},{"./backgroundValueParser":26,"./cssSupport":27,"./util":32,ayepromise:2,"css-font-face-src":5}],30:[function(a,b,c){"use strict";var d=a("./util"),e=function(a,b){var c=a.attributes.src?a.attributes.src.value:null,e=d.getDocumentBaseUrl(a.ownerDocument),f=d.clone(b);return!f.baseUrl&&e&&(f.baseUrl=e),d.getDataURIForImageURL(c,f).then(function(a){return a},function(a){throw{resourceType:"image",url:a.url,msg:"Unable to load image "+a.url}})},f=function(a){return a.filter(function(a){var b=a.attributes.src?a.attributes.src.value:null;return null!==b&&!d.isDataUri(b)})},g=function(a){return Array.prototype.filter.call(a,function(a){return"image"===a.type})},h=function(a){return Array.prototype.slice.call(a)};c.inline=function(a,b){var c=h(a.getElementsByTagName("img")),i=g(a.getElementsByTagName("input")),j=f(c.concat(i));return d.collectAndReportErrors(j.map(function(a){return e(a,b).then(function(b){a.attributes.src.value=b})}))}},{"./util":32}],31:[function(a,b,c){"use strict";var d=a("./util"),e=function(a,b){var c=a.attributes.src.value,e=d.getDocumentBaseUrl(a.ownerDocument),f=d.clone(b);return!f.baseUrl&&e&&(f.baseUrl=e),d.ajax(c,f).fail(function(a){throw{resourceType:"script",url:a.url,msg:"Unable to load script "+a.url}})},f=function(a){return a.replace(/<\//g,"<\\/")},g=function(a,b){a.attributes.removeNamedItem("src"),a.textContent=f(b)},h=function(a){var b=a.getElementsByTagName("script");return Array.prototype.filter.call(b,function(a){return!!a.attributes.src})};c.inline=function(a,b){var c=h(a);return d.collectAndReportErrors(c.map(function(a){return e(a,b).then(function(b){g(a,b)})}))}},{"./util":32}],32:[function(a,b,c){"use strict";var d=a("url"),e=a("ayepromise");c.getDocumentBaseUrl=function(a){return"about:blank"!==a.baseURI?a.baseURI:null},c.clone=function(a){var b,c={};for(b in a)a.hasOwnProperty(b)&&(c[b]=a[b]);return c},c.cloneArray=function(a){return Array.prototype.slice.apply(a,[0])},c.joinUrl=function(a,b){return a?d.resolve(a,b):b},c.isDataUri=function(a){return/^data:/.test(a)},c.all=function(a){var b=e.defer(),c=a.length,d=[];return 0===a.length?(b.resolve([]),b.promise):(a.forEach(function(a,e){a.then(function(a){c-=1,d[e]=a,0===c&&b.resolve(d)},function(a){b.reject(a)})}),b.promise)},c.collectAndReportErrors=function(a){var b=[];return c.all(a.map(function(a){return a.fail(function(a){b.push(a)})})).then(function(){return b})};var f=null,g=function(a,b){return b===!1||"none"===b||"repeated"===b?(null!==f&&"repeated"===b||(f=Date.now()),a+"?_="+f):a};c.ajax=function(a,b){var d,f=new window.XMLHttpRequest,h=e.defer(),i=c.joinUrl(b.baseUrl,a),j=function(){h.reject({msg:"Unable to load url",url:i})};d=g(i,b.cache),f.addEventListener("load",function(){200===f.status||0===f.status?h.resolve(f.response):j()},!1),f.addEventListener("error",j,!1);try{f.open("GET",d,!0),f.overrideMimeType(b.mimeType),f.send(null)}catch(k){j()}return h.promise},c.binaryAjax=function(a,b){var d=c.clone(b);return d.mimeType="text/plain; charset=x-user-defined",c.ajax(a,d).then(function(a){for(var b="",c=0;c<a.length;c++)b+=String.fromCharCode(255&a.charCodeAt(c));return b})};var h=function(a){var b=function(a,b){return a.substring(0,b.length)===b};return b(a,"<?xml")||b(a,"<svg")?"image/svg+xml":"image/png"};c.getDataURIForImageURL=function(a,b){return c.binaryAjax(a,b).then(function(a){var b=btoa(a),c=h(a);return"data:"+c+";base64,"+b})};var i=[],j=function(a){return i.indexOf(a)<0&&i.push(a),i.indexOf(a)};c.memoize=function(a,b,c){if("object"!=typeof c)throw new Error("cacheBucket is not an object");return function(){var d,e=Array.prototype.slice.call(arguments),f=b(e),g=j(a);return c[g]&&c[g][f]?c[g][f]:(d=a.apply(null,e),c[g]=c[g]||{},c[g][f]=d,d)}}},{ayepromise:2,url:"j37I/u"}],33:[function(a,b,c){"use strict";function d(a,b){return Object.prototype.hasOwnProperty.call(a,b)}b.exports=function(a,b,c,f){b=b||"&",c=c||"=";var g={};if("string"!=typeof a||0===a.length)return g;var h=/\+/g;a=a.split(b);var i=1e3;f&&"number"==typeof f.maxKeys&&(i=f.maxKeys);var j=a.length;i>0&&j>i&&(j=i);for(var k=0;j>k;++k){var l,m,n,o,p=a[k].replace(h,"%20"),q=p.indexOf(c);q>=0?(l=p.substr(0,q),m=p.substr(q+1)):(l=p,m=""),n=decodeURIComponent(l),o=decodeURIComponent(m),d(g,n)?e(g[n])?g[n].push(o):g[n]=[g[n],o]:g[n]=o}return g};var e=Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)}},{}],34:[function(a,b,c){"use strict";function d(a,b){if(a.map)return a.map(b);for(var c=[],d=0;d<a.length;d++)c.push(b(a[d],d));return c}var e=function(a){switch(typeof a){case"string":return a;case"boolean":return a?"true":"false";case"number":return isFinite(a)?a:"";default:return""}};b.exports=function(a,b,c,h){return b=b||"&",c=c||"=",null===a&&(a=void 0),"object"==typeof a?d(g(a),function(d){var g=encodeURIComponent(e(d))+c;return f(a[d])?a[d].map(function(a){return g+encodeURIComponent(e(a))}).join(b):g+encodeURIComponent(e(a[d]))}).join(b):h?encodeURIComponent(e(h))+c+encodeURIComponent(e(a)):""};var f=Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)},g=Object.keys||function(a){var b=[];for(var c in a)Object.prototype.hasOwnProperty.call(a,c)&&b.push(c);return b}},{}],35:[function(a,b,c){"use strict";c.decode=c.parse=a("./decode"),c.encode=c.stringify=a("./encode")},{"./decode":33,"./encode":34}],36:[function(a,b,c){"use strict";var d=function(a){var b=new XMLSerializer;return Array.prototype.map.call(a.childNodes,function(a){return b.serializeToString(a)}).join("")},e=function(a){return"parsererror"===a.documentElement.tagName&&"http://www.mozilla.org/newlayout/xml/parsererror.xml"===a.documentElement.namespaceURI?a.documentElement:("xml"===a.documentElement.tagName||"html"===a.documentElement.tagName)&&a.documentElement.childNodes&&a.documentElement.childNodes.length>0&&"parsererror"===a.documentElement.childNodes[0].nodeName?a.documentElement.childNodes[0]:"html"===a.documentElement.tagName&&a.documentElement.childNodes&&a.documentElement.childNodes.length>0&&"body"===a.documentElement.childNodes[0].nodeName&&a.documentElement.childNodes[0].childNodes&&a.documentElement.childNodes[0].childNodes.length&&"parsererror"===a.documentElement.childNodes[0].childNodes[0].nodeName?a.documentElement.childNodes[0].childNodes[0]:void 0},f=[new RegExp("^<h3[^>]*>This page contains the following errors:</h3><div[^>]*>(.+?)\n?</div>"),new RegExp("^(.+)\n")],g=function(a){var b,c,e=d(a);for(b=0;b<f.length;b++)if(c=f[b].exec(e))return c[1]},h=function(a){var b;if(null===a)throw new Error("Parse error");var c=e(a);if(void 0!==c)throw b=g(c)||"Parse error",new Error(b)};c.failOnParseError=function(a){return h(a),a}},{}],url:[function(a,b,c){b.exports=a("j37I/u")},{}],"j37I/u":[function(a,b,c){function d(){this.protocol=null,this.slashes=null,this.auth=null,this.host=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.query=null,this.pathname=null,this.path=null,this.href=null}function e(a,b,c){if(a&&j(a)&&a instanceof d)return a;var e=new d;return e.parse(a,b,c),e}function f(a){return i(a)&&(a=e(a)),a instanceof d?a.format():d.prototype.format.call(a)}function g(a,b){return e(a,!1,!0).resolve(b)}function h(a,b){return a?e(a,!1,!0).resolveObject(b):b}function i(a){return"string"==typeof a}function j(a){return"object"==typeof a&&null!==a}function k(a){return null===a}function l(a){return null==a}var m=a("punycode");c.parse=e,c.resolve=g,c.resolveObject=h,c.format=f,c.Url=d;var n=/^([a-z0-9.+-]+:)/i,o=/:[0-9]*$/,p=["<",">",'"',"`"," ","\r","\n","	"],q=["{","}","|","\\","^","`"].concat(p),r=["'"].concat(q),s=["%","/","?",";","#"].concat(r),t=["/","?","#"],u=255,v=/^[a-z0-9A-Z_-]{0,63}$/,w=/^([a-z0-9A-Z_-]{0,63})(.*)$/,x={javascript:!0,"javascript:":!0},y={javascript:!0,"javascript:":!0},z={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0},A=a("querystring");d.prototype.parse=function(a,b,c){if(!i(a))throw new TypeError("Parameter 'url' must be a string, not "+typeof a);var d=a;d=d.trim();var e=n.exec(d);if(e){e=e[0];var f=e.toLowerCase();this.protocol=f,d=d.substr(e.length)}if(c||e||d.match(/^\/\/[^@\/]+@[^@\/]+/)){var g="//"===d.substr(0,2);!g||e&&y[e]||(d=d.substr(2),this.slashes=!0)}if(!y[e]&&(g||e&&!z[e])){
for(var h=-1,j=0;j<t.length;j++){var k=d.indexOf(t[j]);-1!==k&&(-1===h||h>k)&&(h=k)}var l,o;o=-1===h?d.lastIndexOf("@"):d.lastIndexOf("@",h),-1!==o&&(l=d.slice(0,o),d=d.slice(o+1),this.auth=decodeURIComponent(l)),h=-1;for(var j=0;j<s.length;j++){var k=d.indexOf(s[j]);-1!==k&&(-1===h||h>k)&&(h=k)}-1===h&&(h=d.length),this.host=d.slice(0,h),d=d.slice(h),this.parseHost(),this.hostname=this.hostname||"";var p="["===this.hostname[0]&&"]"===this.hostname[this.hostname.length-1];if(!p)for(var q=this.hostname.split(/\./),j=0,B=q.length;B>j;j++){var C=q[j];if(C&&!C.match(v)){for(var D="",E=0,F=C.length;F>E;E++)D+=C.charCodeAt(E)>127?"x":C[E];if(!D.match(v)){var G=q.slice(0,j),H=q.slice(j+1),I=C.match(w);I&&(G.push(I[1]),H.unshift(I[2])),H.length&&(d="/"+H.join(".")+d),this.hostname=G.join(".");break}}}if(this.hostname.length>u?this.hostname="":this.hostname=this.hostname.toLowerCase(),!p){for(var J=this.hostname.split("."),K=[],j=0;j<J.length;++j){var L=J[j];K.push(L.match(/[^A-Za-z0-9_-]/)?"xn--"+m.encode(L):L)}this.hostname=K.join(".")}var M=this.port?":"+this.port:"",N=this.hostname||"";this.host=N+M,this.href+=this.host,p&&(this.hostname=this.hostname.substr(1,this.hostname.length-2),"/"!==d[0]&&(d="/"+d))}if(!x[f])for(var j=0,B=r.length;B>j;j++){var O=r[j],P=encodeURIComponent(O);P===O&&(P=escape(O)),d=d.split(O).join(P)}var Q=d.indexOf("#");-1!==Q&&(this.hash=d.substr(Q),d=d.slice(0,Q));var R=d.indexOf("?");if(-1!==R?(this.search=d.substr(R),this.query=d.substr(R+1),b&&(this.query=A.parse(this.query)),d=d.slice(0,R)):b&&(this.search="",this.query={}),d&&(this.pathname=d),z[f]&&this.hostname&&!this.pathname&&(this.pathname="/"),this.pathname||this.search){var M=this.pathname||"",L=this.search||"";this.path=M+L}return this.href=this.format(),this},d.prototype.format=function(){var a=this.auth||"";a&&(a=encodeURIComponent(a),a=a.replace(/%3A/i,":"),a+="@");var b=this.protocol||"",c=this.pathname||"",d=this.hash||"",e=!1,f="";this.host?e=a+this.host:this.hostname&&(e=a+(-1===this.hostname.indexOf(":")?this.hostname:"["+this.hostname+"]"),this.port&&(e+=":"+this.port)),this.query&&j(this.query)&&Object.keys(this.query).length&&(f=A.stringify(this.query));var g=this.search||f&&"?"+f||"";return b&&":"!==b.substr(-1)&&(b+=":"),this.slashes||(!b||z[b])&&e!==!1?(e="//"+(e||""),c&&"/"!==c.charAt(0)&&(c="/"+c)):e||(e=""),d&&"#"!==d.charAt(0)&&(d="#"+d),g&&"?"!==g.charAt(0)&&(g="?"+g),c=c.replace(/[?#]/g,function(a){return encodeURIComponent(a)}),g=g.replace("#","%23"),b+e+c+g+d},d.prototype.resolve=function(a){return this.resolveObject(e(a,!1,!0)).format()},d.prototype.resolveObject=function(a){if(i(a)){var b=new d;b.parse(a,!1,!0),a=b}var c=new d;if(Object.keys(this).forEach(function(a){c[a]=this[a]},this),c.hash=a.hash,""===a.href)return c.href=c.format(),c;if(a.slashes&&!a.protocol)return Object.keys(a).forEach(function(b){"protocol"!==b&&(c[b]=a[b])}),z[c.protocol]&&c.hostname&&!c.pathname&&(c.path=c.pathname="/"),c.href=c.format(),c;if(a.protocol&&a.protocol!==c.protocol){if(!z[a.protocol])return Object.keys(a).forEach(function(b){c[b]=a[b]}),c.href=c.format(),c;if(c.protocol=a.protocol,a.host||y[a.protocol])c.pathname=a.pathname;else{for(var e=(a.pathname||"").split("/");e.length&&!(a.host=e.shift()););a.host||(a.host=""),a.hostname||(a.hostname=""),""!==e[0]&&e.unshift(""),e.length<2&&e.unshift(""),c.pathname=e.join("/")}if(c.search=a.search,c.query=a.query,c.host=a.host||"",c.auth=a.auth,c.hostname=a.hostname||a.host,c.port=a.port,c.pathname||c.search){var f=c.pathname||"",g=c.search||"";c.path=f+g}return c.slashes=c.slashes||a.slashes,c.href=c.format(),c}var h=c.pathname&&"/"===c.pathname.charAt(0),j=a.host||a.pathname&&"/"===a.pathname.charAt(0),m=j||h||c.host&&a.pathname,n=m,o=c.pathname&&c.pathname.split("/")||[],e=a.pathname&&a.pathname.split("/")||[],p=c.protocol&&!z[c.protocol];if(p&&(c.hostname="",c.port=null,c.host&&(""===o[0]?o[0]=c.host:o.unshift(c.host)),c.host="",a.protocol&&(a.hostname=null,a.port=null,a.host&&(""===e[0]?e[0]=a.host:e.unshift(a.host)),a.host=null),m=m&&(""===e[0]||""===o[0])),j)c.host=a.host||""===a.host?a.host:c.host,c.hostname=a.hostname||""===a.hostname?a.hostname:c.hostname,c.search=a.search,c.query=a.query,o=e;else if(e.length)o||(o=[]),o.pop(),o=o.concat(e),c.search=a.search,c.query=a.query;else if(!l(a.search)){if(p){c.hostname=c.host=o.shift();var q=c.host&&c.host.indexOf("@")>0?c.host.split("@"):!1;q&&(c.auth=q.shift(),c.host=c.hostname=q.shift())}return c.search=a.search,c.query=a.query,k(c.pathname)&&k(c.search)||(c.path=(c.pathname?c.pathname:"")+(c.search?c.search:"")),c.href=c.format(),c}if(!o.length)return c.pathname=null,c.search?c.path="/"+c.search:c.path=null,c.href=c.format(),c;for(var r=o.slice(-1)[0],s=(c.host||a.host)&&("."===r||".."===r)||""===r,t=0,u=o.length;u>=0;u--)r=o[u],"."==r?o.splice(u,1):".."===r?(o.splice(u,1),t++):t&&(o.splice(u,1),t--);if(!m&&!n)for(;t--;t)o.unshift("..");!m||""===o[0]||o[0]&&"/"===o[0].charAt(0)||o.unshift(""),s&&"/"!==o.join("/").substr(-1)&&o.push("");var v=""===o[0]||o[0]&&"/"===o[0].charAt(0);if(p){c.hostname=c.host=v?"":o.length?o.shift():"";var q=c.host&&c.host.indexOf("@")>0?c.host.split("@"):!1;q&&(c.auth=q.shift(),c.host=c.hostname=q.shift())}return m=m||c.host&&o.length,m&&!v&&o.unshift(""),o.length?c.pathname=o.join("/"):(c.pathname=null,c.path=null),k(c.pathname)&&k(c.search)||(c.path=(c.pathname?c.pathname:"")+(c.search?c.search:"")),c.auth=a.auth||c.auth,c.slashes=c.slashes||a.slashes,c.href=c.format(),c},d.prototype.parseHost=function(){var a=this.host,b=o.exec(a);b&&(b=b[0],":"!==b&&(this.port=b.substr(1)),a=a.substr(0,a.length-b.length)),a&&(this.hostname=a)}},{punycode:3,querystring:35}],39:[function(a,b,c){var d=function(a){return a.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,"")},e=function(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")},f=function(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")},g=function(a){var b=a.value;return" "+a.name+'="'+e(b)+'"'},h=function(a){var b=a.tagName;return"http://www.w3.org/1999/xhtml"===a.namespaceURI&&(b=b.toLowerCase()),b},i=function(a){var b=Array.prototype.map.call(a.attributes||a.attrs,function(a){return a.name}).indexOf("xmlns")>=0;return b||a.parentNode&&a.namespaceURI===a.parentNode.namespaceURI&&"html"!==h(a)?"":' xmlns="'+a.namespaceURI+'"'},j=function(a){return Array.prototype.map.call(a.childNodes,function(a){return o(a)}).join("")},k=function(a){var b="<"+h(a);return b+=i(a),Array.prototype.forEach.call(a.attributes||a.attrs,function(a){b+=g(a)}),a.childNodes.length>0?(b+=">",b+=j(a),b+="</"+h(a)+">"):b+="/>",b},l=function(a){var b=a.nodeValue||a.value||"";return f(b)},m=function(a){return"<!--"+a.data.replace(/-/g,"&#45;")+"-->"},n=function(a){return"<![CDATA["+a.nodeValue+"]]>"},o=function(a){return"#document"===a.nodeName||"#document-fragment"===a.nodeName?j(a):a.tagName?k(a):"#text"===a.nodeName?l(a):"#comment"===a.nodeName?m(a):"#cdata-section"===a.nodeName?n(a):void 0};c.serializeToString=function(a){return d(o(a))}},{}]},{},[1])(1)});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],14:[function(require,module,exports){
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.7.0';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var createCallback = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  _.iteratee = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return createCallback(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    if (obj == null) return obj;
    iteratee = createCallback(iteratee, context);
    var i, length = obj.length;
    if (length === +length) {
      for (i = 0; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    if (obj == null) return [];
    iteratee = _.iteratee(iteratee, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length),
        currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index = 0, currentKey;
    if (arguments.length < 3) {
      if (!length) throw new TypeError(reduceError);
      memo = obj[keys ? keys[index++] : index++];
    }
    for (; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== + obj.length && _.keys(obj),
        index = (keys || obj).length,
        currentKey;
    if (arguments.length < 3) {
      if (!index) throw new TypeError(reduceError);
      memo = obj[keys ? keys[--index] : --index];
    }
    while (index--) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    predicate = _.iteratee(predicate, context);
    _.some(obj, function(value, index, list) {
      if (predicate(value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    predicate = _.iteratee(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(_.iteratee(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    if (obj == null) return true;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    if (obj == null) return false;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (obj.length !== +obj.length) obj = _.values(obj);
    return _.indexOf(obj, target) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = obj && obj.length === +obj.length ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = low + high >>> 1;
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return obj.length === +obj.length ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = _.iteratee(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!_.isArray(value) && !_.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        push.apply(output, value);
      } else {
        flatten(value, shallow, strict, output);
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = _.iteratee(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      if (isSorted) {
        if (!i || seen !== value) result.push(value);
        seen = value;
      } else if (iteratee) {
        var computed = iteratee(value, i, array);
        if (_.indexOf(seen, computed) < 0) {
          seen.push(computed);
          result.push(value);
        }
      } else if (_.indexOf(result, value) < 0) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true, []));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(slice.call(arguments, 1), true, true, []);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function(array) {
    if (array == null) return [];
    var length = _.max(arguments, 'length').length;
    var results = Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var idx = array.length;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var Ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    args = slice.call(arguments, 2);
    bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      Ctor.prototype = func.prototype;
      var self = new Ctor;
      Ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (_.isObject(result)) return result;
      return self;
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = hasher ? hasher.apply(this, arguments) : key;
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last > 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed before being called N times.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      } else {
        func = null;
      }
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    if (!_.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
            obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj, iteratee, context) {
    var result = {}, key;
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      iteratee = createCallback(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
      obj = new Object(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (key in obj) result[key] = obj[key];
      }
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    if (!_.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (
      aCtor !== bCtor &&
      // Handle Object.create(x) cases
      'constructor' in a && 'constructor' in b &&
      !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
        _.isFunction(bCtor) && bCtor instanceof bCtor)
    ) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size, result;
    // Recursively compare objects and arrays.
    if (className === '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size === b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      size = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      result = _.keys(b).length === size;
      if (result) {
        while (size--) {
          // Deep compare each member
          key = keys[size];
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
  if (typeof /./ !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    var pairs = _.pairs(attrs), length = pairs.length;
    return function(obj) {
      if (obj == null) return !length;
      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i], key = pair[0];
        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = createCallback(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? object[property]() : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],15:[function(require,module,exports){
var helpers = require('./helpers'),
    Class = require('./class');

/**
 * Action encodes user-driven interaction with visualization.
 *
 * @module Action
 */
module.exports = (function() {

    'use strict';

    // ------------------------------
    // Basic Setup
    // ------------------------------

    var Action = Class.create( /** @lends Action */ {

        /**
         * Initializes the class
         *
         * @name initialize
         * @memberof Action
         * @instance
         */
        initialize: function(label, trail) {

            // Create GUID
            this._id = helpers.guid();

            // Trail
            this._trail = trail;

            // Add  Label
            this._label = label;

            this._toStringCallback = null;

            this._grammar = {
                pastTense: null,
                preposition: null,
                dataFormat: function(data) {
                    return '';
                },
            };

            // Post fix callback
            this._postfixCallback = null;

            // Forward Action Callback
            this._forwardCallback = null;

            // Inverse Action Callback
            this._inverseCallback = null;

            // Action Done Callback
            this._doneCallback = null;

        },

        // ------------------------------
        // Getters and Setters
        // ------------------------------

        /**
         * Return a GUID that uniqly identifies the action. GUID is a 16 character alphanumeric string.
         *
         * @name id
         * @memberof Action
         * @instance
         * @return {String} - GUID created for action
         */
        id: function() {
            return this._id;
        },

        /**
         * Returns a label
         *
         * @name label
         * @memberof Action
         * @instance
         * @return {String} - Label
         */
        label: function() {
            return this._label;
        },

        /**
         * Adds a grammar
         *
         * @name grammar
         * @memberof Action
         * @instance
         * @return {String} - Label
         */
        grammar: function(grammarObject) {
            if (arguments.length > 0) {
                var thiss = this;
                Object.keys(thiss._grammar).forEach(function(key) {
                    if (grammarObject.hasOwnProperty(key)) {
                        thiss._grammar[key] = grammarObject[key];
                    }
                });
                return this;
            } else {
                return this._grammar;
            }
        },


        toString: function(callback) {
            if (arguments.length > 0) {
                this._toStringCallback = callback;
                return this;
            }
            return this._toStringCallback;

        },

        /**
         * Registers a forward action callback
         *
         * @name forward
         * @memberof Action
         * @instance
         * @return {Action} - an action
         */
        forward: function(callback) {
            if (arguments.length > 0) {
                this._forwardCallback = callback;
                return this;
            }
            return this._forwardCallback;
        },

        /**
         * Registers an inverse action callback
         *
         * @name inverse
         * @memberof Action
         * @instance
         * @return {Action} - an action
         */
        inverse: function(callback) {
            if (arguments.length > 0) {
                this._inverseCallback = callback;
                return this;
            }
            return this._inverseCallback;
        },

        /**
         * Registers an action done callback
         *
         * @name done
         * @memberof Action
         * @instance
         * @return {Action} - an action
         */
        done: function(callback) {
            if (arguments.length > 0) {
                this._doneCallback = callback;
                return this;
            }
            return this._doneCallback;
        },

        /**
         * Registers a postfix callback
         *
         * @name postfix
         * @memberof Action
         * @instance
         * @return {Action} - an action
         */
        postfix: function(callback) {
            if (arguments.length > 0) {
                this._postfixCallback = callback;
                return this;
            }
        },

        // ------------------------------
        // Methods
        // ------------------------------

        runPostfix: function(change) {
            return this._postfixCallback ? this._postfixCallback(change.data()) : '';
        },

    });

    // ------------------------------
    // Export
    // ------------------------------

    return Action;

}());
},{"./class":18,"./helpers":33}],16:[function(require,module,exports){
var helpers = require('./helpers'),
    Class = require('./class'),
    rasterizer = require('./rasterizer'),
    clone = require('clone');

/**
 * A change represents the data changed in visualization
 *
 * @module Change
 */
module.exports = (function() {

    'use strict';

    // ------------------------------
    // Basic Setup
    // ------------------------------

    var Change = Class.create( /** @lends Change */ {

        /**
         * Initializes the class
         *
         * @name initialize
         * @memberof Action
         * @instance
         */
        initialize: function(action, data, trail) {

            // Create GUID
            this._id = helpers.guid();

            // Attributes
            this._attrs = {};

            // Recorded At
            this._recordedAt = new Date().getTime();

            // TimeZone
            this._timezoneOffset = new Date().getTimezoneOffset();

            // Action
            this._action = action;

            // Data recorded
            this._data = data;

            // Checkpoint
            this._checkpointData = null;

            // Trail
            this._trail = trail;

            // Thumbnail
            this._thumbnail = null;

            // Node in Master
            this._nodeInMasterTrail = null;

            // Node in Master
            this._nodeInSubTrail = null;

            // Comments
            this._comments = [];

        },

        // ------------------------------
        // Getters and Setters
        // ------------------------------

        /**
         * Return a GUID that uniqly identifies the change. GUID is a 16 character alphanumeric string.
         *
         * @name id
         * @memberof Change
         * @instance
         * @return {String} - GUID created for action
         */
        id: function() {
            return this._id;
        },

        /**
         * Gets or sets attributes
         *
         * @method attr
         * @memberof Change
         * @instance
         * @param {String} key - using which value is to be set or get
         * @param {Object | Array | String | Number} value - data that is to be stored
         * @return {BaseTrail} - An instance of trail
         * @return {object | array | string | number | null} - data for provided key (if found)
         */
        attr: function(key, value) {
            if (!key || typeof key !== 'string') {
                return this._attrs;
            } else {
                if (arguments.length > 1) {
                    this._attrs[key] = value;
                    return this;
                } else if (this._attrs.hasOwnProperty(key)) {
                    return this._attrs[key];
                }
            }
        },

        attrs: function() {
            if (arguments.length > 0) {

            } else {
                return this._attrs;
            }
        },

        /**
         * Returns a timestamp at which change was recorded
         *
         * @name recordedAt
         * @memberof Change
         * @instance
         * @return {Number} - timestamp
         */
        recordedAt: function() {
            return this._recordedAt;
        },

        /**
         * Returns a timezoneOffset at which change was recorded
         *
         * @name timezoneOffset
         * @memberof Change
         * @instance
         * @return {Number} - timezone offset
         */
        timezoneOffset: function() {
            return this._timezoneOffset;
        },

        /**
         * Returns an action that was recorded into change
         *
         * @name action
         * @memberof Change
         * @instance
         * @return {@link Action} - Action
         */
        action: function() {
            return this._action;
        },

        /**
         * Describes the change based on action
         *
         * @name describe
         * @memberof Change
         * @instance
         * @return {String} - description
         */
      describe: function(){
	if (this._action) {
          var stringify = this._action.toString();
          return stringify ? stringify(this.data()) : this._action.label();
	}
	return null;
        },

        /**
         * Returns a trail which recorded an action
         *
         * @name trail
         * @memberof Change
         * @instance
         * @return {@link BaseTrail} - Trial which recorded this change
         */
        trail: function() {
            return this._trail;
        },

        /**
         * Data that was recorded as a change
         *
         * @name data
         * @memberof Change
         * @instance
         * @return {Object | Array | Number | String } - data recorded
         */
        data: function() {
            return this._data;
        },

        /**
         * Data that was recorded as a change
         *
         * @name data
         * @memberof Change
         * @instance
         * @return {Object | Array | Number | String } - data recorded
         */
        checkpointData: function(data) {
            if (arguments.length > 0) {
                this._checkpointData = clone(data);
                return this;
            } else {
                return this._checkpointData;
            }
        },

        /**
         * Checks if change has checkpoint
         *
         * @name isCheckpoint
         * @memberof Change
         * @instance
         * @return {Boolean}
         */
        isCheckpoint: function(data) {
            return this._checkpointData !== null;
        },

        /**
         * Returns a base64 representation of the thumbnail set or rendered
         *
         * @name thumbnail
         * @memberof Change
         * @instance
         * @return {String} - thumbnail recorded
         */
        thumbnail: function() {
            return this._thumbnail;
        },

        /**
         * Returns a node instance from sub trail
         *
         * @name nodeInSubTrail
         * @memberof Change
         * @instance
         * @return {Object} - node
         */
        nodeInSubTrail: function(node) {
            if (arguments.length > 0) {
                this._nodeInSubTrail = node;
            } else {
                return this._nodeInSubTrail;
            }
        },

        /**
         * Returns a node instance from master trail
         *
         * @name nodeInMasterTrail
         * @memberof Change
         * @instance
         * @return {Object} - node
         */
        nodeInMasterTrail: function(node) {
            if (arguments.length > 0) {
                this._nodeInMasterTrail = node;
            } else {
                return this._nodeInMasterTrail;
            }
        },

        /**
         * Returns a node instance from master trail
         *
         * @name node
         * @memberof Change
         * @instance
         * @return {Object} - node
         */
        node: function() {
            if (this.trail()._masterTrail) {
                return this._nodeInSubTrail;
            } else {
                return this._nodeInMasterTrail;
            }
        },

        /**
         * Returns an array of comments
         *
         * @name comments
         * @memberof Change
         * @instance
         * @return {Array} - comments
         */
        comments: function() {
            return this._comments;
        },

        // ------------------------------
        // Methods
        // ------------------------------

        /**
         * Adds a comment
         *
         * @name openGallery
         * @memberof MasterTrail
         * @instance
         * @param {Boolean} showCheckpoints - whether to show checkpoints or not.
         */
        addComment: function(comment) {

          // Validate comment
          if(!comment || typeof comment !== 'object' || !comment.hasOwnProperty('id') || !comment.hasOwnProperty('date') || !comment.hasOwnProperty('text'))
          throw new Error("Invalid comment object");

          // Add comment to change
          this._comments.push(comment);

        },

        /**
         * Sets a thumbnail
         *
         * @name setThumbnail
         * @memberof Change
         * @instance
         * @param {String} thumbnail - base64 representation of image
         */
        setThumbnail: function(thumbnail) {

            // Set Thumbnail
            this._thumbnail = thumbnail;

            // Hold `this`
            var thiss = this;

            // Trigger Event
            this.trail()._events.thumbnailCaptured.forEach(function(handler) {
                handler(thiss);
            });

            // Return a change
            return thiss;

        },

        /**
         * Captures a thumbnail
         *
         * @name captureThumbnail
         * @memberof Change
         * @instance
         * @param {String} selector - a query selector which contents are to be rastered as a thumbnail
         * @param {Number} delay - delay after which capture should start
         */
        captureThumbnail: function(selector, delay) {

            // Hold `this`
            var thiss = this;

            // Rasterize
            if (selector && typeof selector === 'string') {
                setTimeout(function() {
                    try {
                        rasterizer.captureHTML(selector, function(imageBase64) {
                            thiss.setThumbnail(imageBase64);
                        });
                    } catch (e) {
                        rasterizer.captureThumbnail(selector, function(imageBase64) {
                            thiss.setThumbnail(imageBase64);
                        });
                    }
                }, delay && typeof delay === 'number' && delay > 0 ? delay : 0);
            }

        },

        /**
         * Inverts a change
         *
         * @name invert
         * @memberof Change
         * @instance
         * @return {Object} - node
         */
        undo: function() {

            // Undo only if there is a prev state
            if (this.trail().currentNode().parentNode()) {

                // Get Required Data
                var undoCallback = this.trail().undo();
                var doneCallback = this.trail().done();
                var prevNodeKey = this.trail().currentNode().parentNode().data().key;
                var prevChangeData = prevNodeKey !== 'root-node' ? this.trail().versionStore()[prevNodeKey].data() : null;

                // If callback is registered
                if (undoCallback && doneCallback) {

                    // Fire Callback
                    undoCallback(this.data(), prevChangeData);

                    // Done
                    doneCallback();

                    // Update Current Node in both sub trail and master trail
                    this.trail().currentNode(this.trail().currentNode().parentNode());
                    if (this.trail()._masterTrail) this.trail().masterTrail().currentNode(this.trail().masterTrail().currentNode().parentNode());

                    // Success
                    return true;

                }

            }

            // Failed
            return false;

        },

        /**
         * Inverts a change
         *
         * @name invert
         * @memberof Change
         * @instance
         * @return {Object} - node
         */
        redo: function() {

            // Undo only if there is a prev state
            if (this.trail().currentNode().childNodes().length) {

                // Get Required Data
                var redoCallback = this.trail().redo();
                var doneCallback = this.trail().done();
                var nextChangeData = this.data();
                var currentNodeKey = this.trail().currentNode().data().key;
                var currentChangeData = currentNodeKey !== 'root-node' ? this.trail().versionStore()[currentNodeKey].data() : null;

                // If callback is registered
                if (redoCallback && doneCallback) {

                    // Fire Callback
                    redoCallback(currentChangeData, nextChangeData);

                    // Done
                    doneCallback();

                    // Update Current Node
                    this.trail().currentNode(this.node());
                    if (this.trail()._masterTrail) this.trail().masterTrail().currentNode(this.nodeInMasterTrail());

                    // Success
                    return true;

                }

            }

            // Failed
            return false;

        },

        /**
         * Exports a change
         *
         * @name export
         * @memberof Change
         * @instance
         * @return {Object} - exported object
         */
        export: function() {
            var thiss = this;
            return {
                id: thiss.id(),
                attrs: this.attrs(),
                recordedAt: thiss.recordedAt(),
                timezoneOffset: thiss.timezoneOffset(),
                trailId: thiss.trail().id(),
                data: thiss.data(),
                checkpointData: this.checkpointData(),
                thumbnail: thiss.thumbnail(),
            };
        }

    });


    // ------------------------------
    // Export
    // ------------------------------

    return Change;

}());

},{"./class":18,"./helpers":33,"./rasterizer":41,"clone":5}],17:[function(require,module,exports){
var Class = require('../class'),
    nearestCheckpoint = require('../navigation/nearestCheckpoint'),
    clone = require('clone'),
    stateManager = require('../navigation/stateManager');

module.exports = (function() {

  // ------------------------------
  // Basic Setup
  // ------------------------------

  var CheckpointManager = Class.create( /** @lends CheckpointManager */ {

    /**
     * Initializes the class
     *
     * @name initialize
     * @memberof CheckpointManager
     * @instance
     */
    initialize: function(trail) {

      // Trail
      this._trail = trail;

      // Get Checkpoint
      this._getCheckpointCallback = null;

      // Set Checkpoint
      this._setCheckpointCallback = null;

      // Checkpoint Rules
      this._rules = [];

    },

    /**
     * gets a checkpoint
     *
     * @name get
     * @memberof CheckpointManager
     * @instance
     * @param {Function} callback - that gets a checkpoint
     */
    get: function(callback) {

      // Save Callback
      this._getCheckpointCallback = callback;

      // Get Checkpoint for Root Node
      this._trail._versionStore['root-node'].checkpointData(callback());

    },

    /**
     * sets a checkpoint
     *
     * @name set
     * @memberof CheckpointManager
     * @instance
     * @param {Function} callback - that gets a checkpoint
     */
    set: function(callback) {
      this._setCheckpointCallback = callback;
    },

    /**
     * sets a checkpoint
     *
     * @name set
     * @memberof CheckpointManager
     * @instance
     * @param {Function} callback - that gets a checkpoint
     */
    addRule: function(rule) {
      if (rule && typeof rule === 'function')
        this._rules.push(rule);
    },

    /**
     * Checks if change satifies the any of the checkpoint rule
     *
     * @name applyRules
     * @memberof CheckpointManager
     * @instance
     * @param {@link Change} - change to which rules are to be applied
     */
    applyRules: function(change) {
      return this._rules.some(function(rule) {
        var isTrue = rule(change);
        return isTrue;
      });
    },

    /**
     * Makes a checkpoint
     *
     * @name set
     * @memberof CheckpointManager
     * @instance
     * @param {Function} callback - that gets a checkpoint
     */
    makeCheckpoint: function(change) {

      // Hold `this`
      var thiss = this;

      // If change is the current change then get fresh checkpoint data from viz
      // Else compute a state and set as checkpoint data
      if (change.nodeInMasterTrail() === thiss._trail.currentNode()) {
        change.checkpointData(thiss._getCheckpointCallback());
      } else {
        var state = stateManager.computeState(thiss._trail, thiss._trail.currentNode(), change.nodeInMasterTrail());
        change.checkpointData(state);
      }

    },

    /**
     * Checks sub tree for checkpoint
     *
     * @name set
     * @memberof CheckpointManager
     * @instance
     * @param {Function} callback - that gets a checkpoint
     */
    checkSubTree: function(currentNode) {

      var thiss = this;

      // Recur over outer nodes
      (function recurOuter(outerNode, visited) {

        // Start Exploring Children
        var found = (function recur(node, visited) {

          // Check if already visited
          if (visited.indexOf(node) > -1) return;

          // Add to Visited
          visited.push(node);

          // Change in Node
          var change = thiss._trail.getChangeById(node.data().key);

          // Check for checkpoint
          if (change.isCheckpoint()) return;

          // Apply Rules
          if (thiss.applyRules(change)) {
            thiss.makeCheckpoint(change);
          }

          // Recur over childs
          node.childNodes().forEach(function(_child) {
            recur(_child, visited);
          });

        }(outerNode, visited));

        // Go to Parent
        if (outerNode.parentNode()) {
          return recurOuter(outerNode.parentNode(), visited);
        }

      }(currentNode, []));

    },

  });

  // ------------------------------
  // Export
  // ------------------------------

  return CheckpointManager;

}());

},{"../class":18,"../navigation/nearestCheckpoint":36,"../navigation/stateManager":37,"clone":5}],18:[function(require,module,exports){
/**
 * Class provides a way to create and extend object for simple inheritance
 *
 * @module class
 */
module.exports = (function() {

    'use strict';

    // ------------------------------
    // Basic Setup
    // ------------------------------

    var Class = {

        /**
         * Creates a class
         *
         * @name create
         * @memberof Class
         * @return {object}
         */
        create: function(props) {

            // Validate Scope
            if (!props) {
                throw new Error('Invalid properties provided to create class');
            }

            // Create a New Object
            var classObject = function() {
                if (this.initialize && typeof this.initialize === 'function') {
                    this.initialize.apply(this, arguments);
                }
            };

            // Add the properties
            Object.keys(props).forEach(function(key) {
                classObject.prototype[key] = props[key];
            });

            // Return the class
            return classObject;

        },

        extend: function(parentClass, props) {


            // Create Child Class using pros
            var childClass = Class.create(props);

            // Add Provided Child's Properties
            Object.keys(parentClass.prototype).forEach(function(key) {
                if (!childClass.prototype.hasOwnProperty(key)) {
                    childClass.prototype[key] = parentClass.prototype[key];
                }
            });

            // Add Super
            childClass.prototype.super = parentClass.prototype;

            // Return the class
            return childClass;

        },

    };

    return Class;

}());
},{}],19:[function(require,module,exports){
var exporter = require('../share/exporter');

module.exports = (function(doc) {

  // Flag bad practises
  'use strict';

  // --------------------------------
  // Basic Setup
  // --------------------------------

  var gistControl = {

    // Create control
    create: function(trail) {

      // Create Wrapper
      var control = doc.createElement('li');

      // Create controls
      d3.select(control)
        .attr('id', 'trails-' + trail.id() + '-control-gist')
        .attr('clsas', 'trails-control control-gist')
        .text('Export Gist')
        .on('click', function() {
          trail.exportToGist(trail.githubAccessToken(), function(err, gist) {
            if(!err){
              alert("Gist Exported: " + gist.id);
            } else {
              alert('Export Failed:\n\n' + e.message);
            }
          });
        });

      // Append
      d3.select(trail._controlBox)
        .select('.trails-controls-dropdown-sub-menu')[0][0]
        .appendChild(control);

      return control;

    },


    formatGist: function(trail, exportable) {

      // Month Names
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Format Date
      var date = new Date();
      var formattedTime = months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear() + " - " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

      // Template
      var gistTemplate = {
        "description": "jsTrail exported at: " + formattedTime,
        "public": trail.githubAccessToken() === null,
        "files": {}
      };

      // Add File
      gistTemplate.files["trail-" + trail.id() + ".json"] = {};
      gistTemplate.files["trail-" + trail.id() + ".json"].content = JSON.stringify(exportable, null, 2);

      // Return formatted gist
      return JSON.stringify(gistTemplate);

    },

  };

  // --------------------------------
  // Export
  // --------------------------------

  return gistControl;

});

},{"../share/exporter":42}],20:[function(require,module,exports){
module.exports = (function(doc) {

  // Flag bad practises
  'use strict';

  // --------------------------------
  // Basic Setup
  // --------------------------------

  var gistImport = {

    // Create control
    create: function(trail) {

      // Create Wrapper
      var control = doc.createElement('li');

      // Create controls
      d3.select(control)
        .attr('id', 'trails-' + trail.id() + '-import-gist')
        .attr('clsas', 'trails-control control-import-gist')
        .text('Import Gist')
        .on('click', function() {
          trail.importGist(prompt("Enter a gist id"), function(err, success){
            if(err || !success){
              alert("Import Failed:\n\n" + err.message);
            } else {
              if(success){
                alert("Gist Imported");
              }
            }
          });
        });

      // Append
      d3.select(trail._controlBox)
        .select('.trails-controls-dropdown-sub-menu')[0][0]
        .appendChild(control);

      return control;

    },

  };

  // --------------------------------
  // Export
  // --------------------------------

  return gistImport;

});

},{}],21:[function(require,module,exports){
var importer = require('../share/importer');

module.exports = (function(doc) {

  // Flag bad practises
  'use strict';

  // --------------------------------
  // Basic Setup
  // --------------------------------

  var loadControl = {

    // Create control
    create: function(trail) {

      // Create Wrapper
      var control = doc.createElement('li');
      var inputBox = doc.createElement('input');

      // Create controls
      d3.select(control)
        .attr('id', 'trails-' + trail.id() + '-control-load')
        .attr('class', 'trails-control control-load')
        .text('Load JSON')
        .on('click', function() {
          trail.loadJSON();
        });

      // Create Control Box
      d3.select(inputBox)
        .attr('id', 'trails-' + trail.id() + '-control-input')
        .attr('class', 'control-input')
        .attr('type', 'file')
        .style('display', 'none')
        .on('change', function() {
          if (window.FileReader) {
            var file = d3.event.target.files[0];
            var reader = new FileReader();
            reader.onload = function(e) {
              var fileContents = e.target.result;
              var dataObject = JSON.parse(fileContents);
              trail.waitFor(function() {
                importer.import(trail, dataObject);
              });
            };
            reader.readAsText(file);
          } else {
            alert("Your browser does not support FileReader. Please consider upgrading.");
          }
        });

      // Append
      d3.select(trail._controlBox)
        .select('.trails-controls-dropdown-sub-menu')[0][0]
        .appendChild(control);

      // Append
      d3.select(trail._controlBox)
        .select('.trails-control-box')[0][0]
        .appendChild(inputBox);

      return control;

    }
  };

  // --------------------------------
  // Export
  // --------------------------------

  return loadControl;

});

},{"../share/importer":43}],22:[function(require,module,exports){
var helpers = require('../../helpers');

module.exports = (function(doc) {

  // Flag bad practises
  'use strict';

  // --------------------------------
  // Basic Setup
  // --------------------------------

  var controlBox = {

  };

  // --------------------------------
  // Methods
  // --------------------------------

  controlBox.create = function(trail) {

    // Create a container
    // NOTE: this container is temporary
    // When control box is returned by this function and attached to document
    // container no longer remains as a parent of control box.
    var container = doc.createElement("div");

    // Read and Parse HTML
    var html = "<div class=\"trails-control-box-container\">\n  <div class=\"trails-control-box\">\n    <div class=\"trails-controls-container\">\n      <ul class=\"trails-controls-list\">\n      \t<li class=\"trails-icon-logo\">Trail</li>\n      \t<li class=\"trails-icon-actions\">\n      \t  <ul class=\"trails-controls-dropdown-sub-menu\">\n      \t  </ul>\n      \t</li>\n      </ul>\n    </div>\n    <div class=\"trails-thumbnails-container hidden\">\n      <div class=\"trails-thumbnails-container-inner-wrapper\">\n    \t<div class=\"trails-thumbnails-gallery\">\n    \t</div>\n      </div>\n    </div>\n    <div class=\"trails-info-container hidden\">\n      <p class=\"trails-title\">Trail ID</p>\n      <div class=\"trails-comment-box-container\">\n        <div class=\"trails-comment-box\">\n          <div class=\"trails-comment-list\">\n          </div>\n          <div class=\"trails-comment-input-container\">\n            <input type=\"text\" placeholder=\"Comment\" class=\"trails-comment-input\" value=\"\" />\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"trails-tooltip hidden\">\n    </div>\n  </div>\n</div>\n";
    var addId = function (node) {
      if (node.tagName) {
        var cls = node.getAttribute('class');
        if (cls) {
          node.setAttribute('id', trail.id() + '-' + cls.split(' ', 1)[0]);
        }
      }
      node = node.firstChild;
      while(node) {
        addId(node);
        node = node.nextSibling;
      }
    };

    // Insert Parsed HTML into temp container
    container.insertAdjacentHTML('beforeend', html);
    addId(container);

    // NOTE: When `container.firstChild` is returned by this function,
    // it gets attached to the document. Hence container is no longer is parent.
    // Container.firstChild will return invalid childNode and shoulw not be used
    // in callback functions like "mousemove" below. Use trail.controlBox() to get
    // attached control box.

    // Comment Box
    d3.select(container.firstChild).select('#' + trail.id() + '-trails-comment-input').on("keyup" , function(){
      if(d3.event.keyCode === 13){

        // Validate Comment
        var commentText = d3.select(this).node().value;
        if(commentText.trim().length === 0) return;

        // Create Object
        var comment = {
          id: helpers.guid(),
          date: new Date().getTime(),
          text: commentText.trim(),
          vid: trail.currentVersion(),
        };

        // Add comment to change
        trail.currentChange().addComment(comment);

        // Add comment to UI
        trail.addCommentToUI(comment, comment.vid);

        // Clear Input Box
        d3.select(this).node().value = "";

      }
    });

    // Update tooltip position on mousemove
    d3.select(container.firstChild).on("mousemove", function(){

      // Get Tooltip
      var tooltip = d3.select(trail.controlBox()).select('#' + trail.id() + '-trails-tooltip');

      // Get Cordinates
      var coordinates = [0, 0];
      coordinates = d3.mouse(this);
      var x = coordinates[0];
      var y = coordinates[1];

      // If tooltip if partially going out of the window
      // Change the direction of tooltip
      if( d3.select(this).node().offsetLeft + (+x) + tooltip.node().offsetWidth > window.innerWidth){
        x = ((+x) - 10) - tooltip.node().offsetWidth;
      } else {
        x = ((+x) + 10);
      }

      // Set
      tooltip.style('left', x + "px")
      .style('top', ((+y) + 10) + "px");

    });

    // Drag the minimal control box
    var dragstartsTargetId = null;
    var drag = d3.behavior.drag()
      .origin(function(d) {
        return {
          x: trail.controlBox().offsetLeft,
          y: trail.controlBox().offsetTop
        };
      })
      .on("dragstart", function() {
        dragstartsTargetId = d3.event.sourceEvent.target.id;
        d3.event.sourceEvent.stopPropagation();
        d3.select(trail.controlBox()).classed("dragging", true);
      })
      .on("drag", function() {
        if (dragstartsTargetId === trail.id() + '-trails-icon-logo') {
          trail.controlBox().style.right = (window.innerWidth - 40 - (+d3.event.x)) + "px";
          trail.controlBox().style.top = (+d3.event.y) + "px";
        }
      })
      .on("dragend", function() {
        d3.select(trail.controlBox()).classed("dragging", false);
        dragstartsTargetId = null;
      });

    // // Call drag on container
    d3.select(container.firstChild).call(drag);

    return container.firstChild;
  };


  // --------------------------------
  // Export
  // --------------------------------

  return controlBox;

});

},{"../../helpers":33}],23:[function(require,module,exports){

var treeView = require('../treeView'),
    tableView = require('../tableView');

module.exports = (function(doc) {

  // Flag bad practises
  'use strict';

  // --------------------------------
  // Basic Setup
  // --------------------------------

  var galleryControl = {

    // Create control
    create: function(trail) {

      // Create a container
      // NOTE: this container is temporary
      // When gallery is returned by this function and attached to document
      // container no longer remains as a parent of gallery.
      var container = doc.createElement("div");

      // Read and Parse HTML
      var html = "<div class=\"trails-overlay hidden\">\n  <div class=\"trails-overlay-inner-wrapper\">\n    <div class=\"trails-overlay-table-container\">\n      <table class=\"trails-overlay-table\" cellpadding=\"0\" cellspacing=\"0\">\n        <thead>\n          <tr>\n            <th id=\"col-thumbnail\">Thumbnail</th>\n            <th id=\"col-id\">ID</th>\n            <th id=\"col-recorded-at\">Recorded At</th>\n            <th id=\"col-actions\">Actions</th>\n          </tr>\n        </thead>\n        <tbody>\n\n        </tbody>\n      </table>\n    </div>\n    <div class=\"trails-overlay-tree-container\">\n    </div>\n  </div>\n</div>\n";

      // Append HTML to container
      container.insertAdjacentHTML('beforeend', html);
      var addId = function (node) {
        if (node.tagName) {
          var cls = node.getAttribute('class');
          if (cls) {
            node.setAttribute('id', trail.id() + '-' + cls.split(' ', 1)[0]);
          }
        }
        node = node.firstChild;
        while(node) {
          addId(node);
          node = node.nextSibling;
        }
      };
      addId(container);
      doc.body.appendChild(container.firstChild);

      // Create Wrapper
      var node = d3.select(trail._controlBox)
  	  .select('.trails-controls-list')
  	  .insert('li', '.trails-icon-actions')
  	  .attr('class', 'trails-icon-gallery')
      .on('click', function() {
         galleryControl.openGallery(trail, false);
      });

      // On Pressing esc hide overlay
      d3.select(doc.body)
        .on("keydown", function() {
          if (d3.event.keyCode === 27) {
            d3.select('#' + trail.id() + '-trails-overlay').classed('hidden', true);
            d3.select(doc.body).style("overflow", "auto");
          }
        });

      // // Append
      // d3.select(trail._controlBox)
      //   .select('.trails-controls-dropdown-right')[0][0]
      //   .appendChild(control);

      return node;

    },

    // Opens a Gallery
    openGallery: function(trail, showCheckpoints) {

      // Overlay and wrapper
      var overlay = d3.select('#' + trail.id() + '-trails-overlay').classed('hidden', false);
      var overlayWrapper = d3.select('#' + trail.id() + '-trails-overlay-inner-wrapper');

      // Disable Body Scrolling
      d3.select(doc.body).style("overflow", "hidden");

      // Export all Snapshots
      var versionList = [];
      var versionTree = trail.versionTree().export(function(data) {
        versionList.push({ key: data.key, trailId: data.trailId, });
        return data;
      });

      // Show Table
      tableView.show(trail, overlayWrapper, versionList, doc);

      // to show checkpoints
      // treeView.show(trail, overlayWrapper, versionTree, doc, true);
      treeView.show(trail, overlayWrapper, versionTree, doc, showCheckpoints);

      // Locate Clicked
      // tableView.onLocateClicked(function(trail, vid){
      //   treeView.locate(trail, vid);
      // });


    }

  };

  // --------------------------------
  // Export
  // --------------------------------

  return galleryControl;

});

},{"../tableView":30,"../treeView":31}],24:[function(require,module,exports){
module.exports = (function(doc) {

  return {

    // ControlBox that holds the snapshot gallery and controls
    controlBox: require('./controlBox')(doc),

    // List of posible controls
    list: {
      importGist: require('../importGist')(doc),
      exportGist: require('../exportGist')(doc),
      saveJSON: require('../saveJSON')(doc),
      loadJSON: require('../loadJSON')(doc),
      undo: require('./undo')(doc),
      redo: require('./redo')(doc),
      info: require('./info')(doc),
      thumbs: require('./thumbs')(doc),
      gallery: require('./gallery')(doc),
    },

    all: function() {
      return Object.keys(this.list);
    },

  };


});

},{"../exportGist":19,"../importGist":20,"../loadJSON":21,"../saveJSON":29,"./controlBox":22,"./gallery":23,"./info":25,"./redo":26,"./thumbs":27,"./undo":28}],25:[function(require,module,exports){
module.exports = (function(doc) {

  // Flag bad practises
  'use strict';

  var control = {
    
    // Create control
    create: function(trail) {
      var node = d3.select(trail._controlBox)
	  .select('.trails-controls-list')
	  .insert('li', '.trails-icon-actions')
	  .attr('class', 'trails-icon-info')
          .on('click', function() {
	    var infoContainer = d3.select(trail._controlBox)
		.select('.trails-info-container');
	    infoContainer.classed('hidden', !infoContainer.classed('hidden'));
          });
      return node;
    }
  };

  return control;

});


},{}],26:[function(require,module,exports){
module.exports = (function(doc) {

  // Flag bad practises
  'use strict';

  var control = {
    
    // Create control
    create: function(trail) {
      var node = d3.select(trail._controlBox)
	  .select('.trails-controls-list')
	  .insert('li', '.trails-icon-actions')
	  .attr('class', 'trails-icon-redo')
          .on('click', function() {
            trail.next();
          });
      return node;
    }
  };

  return control;

});


},{}],27:[function(require,module,exports){
module.exports = (function(doc) {

  // Flag bad practises
  'use strict';

  var control = {
    
    // Create control
    create: function(trail) {
      var node = d3.select(trail._controlBox)
	  .select('.trails-controls-list')
	  .insert('li', '.trails-icon-actions')
	  .attr('class', 'trails-icon-list')
          .on('click', function() {
	    var thumbContainer = d3.select(trail._controlBox)
		.select('.trails-thumbnails-container');
	    thumbContainer.classed('hidden', !thumbContainer.classed('hidden'));
          });
      return node;
    }
  };

  return control;

});


},{}],28:[function(require,module,exports){
module.exports = (function(doc) {

  // Flag bad practises
  'use strict';

  var control = {
    
    // Create control
    create: function(trail) {
      var node = d3.select(trail._controlBox)
	  .select('.trails-controls-list')
	  .insert('li', '.trails-icon-actions')
	  .attr('class', 'trails-icon-undo')
	  .on('click', function() {
            trail.previous();
          });
      return node;
    }
  };

  return control;

});


},{}],29:[function(require,module,exports){

    exporter = require('../share/exporter');

module.exports = (function(doc) {

  // Flag bad practises
  'use strict';

  // --------------------------------
  // Basic Setup
  // --------------------------------

  var saveControl = {

    // Create control
    create: function(trail) {

      // Create Wrapper
      var control = doc.createElement('li');

      // Create controls
      d3.select(control)
        .attr('id', 'trails-' + trail.id() + '-control-save')
        .attr('clsas', 'trails-control control-save')
        .text('Save JSON')
        .on('click', function() {
          trail.saveJSON();
        });

      // Append
      d3.select(trail._controlBox)
        .select('.trails-controls-dropdown-sub-menu')[0][0]
        .appendChild(control);

      return control;

    }
  };

  // --------------------------------
  // Export
  // --------------------------------

  return saveControl;

});

},{"../share/exporter":42}],30:[function(require,module,exports){
var stateManager = require('../navigation/stateManager'),
    moment = require('moment'),
    clone = require('clone'),
    _ = require('underscore');


module.exports = (function() {

  // --------------------------------
  // Table View
  // --------------------------------

  var tableView = {

  };

  // --------------------------------
  // Methods
  // --------------------------------

  tableView.create = function(trail, overlayWrapper) {
    // Create and Append Table Container
    var tableContainer = overlayWrapper.append('div')
      .attr('id', trail.id() + '-trails-overlay-table-container')
      .attr('class', 'trails-overlay-table-container');
  };

  tableView.show = function(trail, overlayWrapper, versionList, doc) {
    var tableContainer = d3.select('#' + trail.id() + '-trails-overlay-table-container');

    // FIXME: recreate table, should be updated dynamically
    tableContainer.html("");

    // Create and append table
    var table = tableContainer.append('table')
      .attr('id', trail.id() + '-trails-overlay-table')
      .attr('class', 'trails-overlay-table')
      .attr('cellpadding', 0)
      .attr('cellspacing', 0);

    // Append thead
    var thead = table.append('thead')
      .attr('id', trail.id() + '-trails-overlay-table-thead')
      .attr('class', 'trails-overlay-table-thead')
      .append("tr");

    // Append tbody
    var tbody = table.append('tbody')
      .attr('id', trail.id() + '-trails-overlay-table-tbody')
      .attr('class', 'trails-overlay-table-tbody');

    // --------------------------------
    // Appending Headers
    // --------------------------------

    // Id colThumbnail
    var colThumbnail = thead.append('th')
      .attr('id', 'col-thumbnail')
      .text('Thumbnail');

    // Id col
    var colId = thead.append('th')
      .attr('sorting', 'none')
      .attr('id', 'col-id')
      .text('Id');

    // Id colCapturedAt
    var colRecordedAt = thead.append('th')
      .attr('id', 'col-recorded-at')
      .attr('sorting', 'ascending')
      .style('cursor', 's-resize')
      .text('Recorded At')
      .on('click', sortRecordedAtCol);

    // Actions
    var colActions = thead.append('th')
      .attr('id', 'col-action')
      .text('Actions');

    // --------------------------------
    // Appending Rows and Columns
    // --------------------------------

    // Month Names
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Append rows (tr)
    var tr = tbody.selectAll('tr')
      .data(versionList)
      .enter().append('tr')
      .attr('id', function(d) {
        return 'row-' + d.key;
      });

    // Append Thumbnail
    tr.append('td')
      .append('div')
      .attr('class', 'td-wrapper')
      .append('img')
      .attr('class', 'table-thumbnail')
      .attr('src', function(d) {
        return trail.versionStore()[d.key].thumbnail();
      });

    // Append Id
    tr.append('td')
      .append('div')
      .attr('class', 'td-wrapper')
      .text(function(d, i) {
        return d.key !== 'root-node' ? d.key.split('-')[0].substr(0, 7) : 'Initial State';
      });

    // Append Capture At
    tr.append('td')
      .append('div')
      .attr('class', 'td-wrapper')
      .html(function(d, i) {
        var change = trail.versionStore()[d.key];
        var date = new Date(change.recordedAt() + change.timezoneOffset());
        return moment(date).format('MMMM D YYYY, h:mm:ss a'); // March 29th 2016, 10:57:55 pm
    });

    // Append Load
    var actionUl = tr.append('td')
      .append('div')
      .attr('class', 'td-wrapper')
      .append('ul')
      .attr('class', 'action-list');

    // Load State
    var loadState = actionUl.append("li")
      .attr('data-change', function(d) { return d.key; })
      .attr('class', 'action-load-state')
      .attr("title", "Load State")
      .on("click", function(d){

        // Load State
        trail.waitFor(function() {
          trail.changeVersion(d.key, stateManager);
        });

        // Exit Overlay
        d3.select('#' + trail.id() + '-trails-overlay').classed('hidden', true);
        d3.select(doc.body).style("overflow", "auto");

      });

    // Locate Node
    var locateNode = actionUl.append("li")
      .attr('data-change', function(d) { return d.key; })
      .attr('class', 'action-locate-node')
      .attr("title", "Locate in Tree")
      .on("click", function(d){
        trail.paneToNode(d);
        d3.select('#' + trail.id() + "-trails-overlay-tree-container").selectAll(".node ellipse").classed('highlight', function(d2){
          return d2.key === d.key;
        });
      });

    // Comment
    var commentBtn = actionUl.append("li")
      .attr('data-change', function(d) { return d.key; })
      .attr('class', 'action-comment-display')
      .attr("title", "Show Comments")
      .classed("disabled", function(d){ return trail.getChangeById(d.key).comments().length === 0; })
      .on("click", function(d){

        // If no comments return
        if(trail.getChangeById(d.key).comments().length === 0){
          return;
        }

        // Current Row
        var currentRow = tbody.select('#row-'+d.key);
        var commentRow = tbody.select('#row-comment-' + d.key);

        if(!commentRow.empty()){
          commentRow.remove();
        } else {

          // Insert Row
          commentRow = d3.select(document.createElement('tr'))
            .attr('id', 'row-comment-' + d.key)
            .attr('data-vid', d.key);

          // Append next to current row
          currentRow.node().parentNode.insertBefore(commentRow.node(), currentRow.node().nextSibling);

          // Insert col
          var commentTd = commentRow.append("td")
            .attr("colspan", 4)
            .append("div")
            .attr("class", "trails-comment-box-popup");

          commentTd.append("p").attr("class", "title").text("Comments");

          // Comment List
          var commentList = commentTd.append('div')
            .attr('class', 'trails-comment-list');

          // Append Comments
          trail.getChangeById(d.key).comments().forEach(function(comment){

            // Clone so that original comment object remains un affected
            var commentHTML = "<div class='comment-row'>";
                commentHTML += "<p class='comment-text'>"+ comment.text +"</p>";
                commentHTML += "<span class='date'>"+ moment(new Date(comment.date)).from(new Date()) +"</span>";
                commentHTML += "</div>";

            commentList.node().insertAdjacentHTML('beforeend', commentHTML);

          });


        }

        // // Insert comment row
        // currentRow = d3.select('tr#'+d.key);


      });

    // --------------------------------
    // Events
    // --------------------------------

    function sortRecordedAtCol() {

      // Select element
      var element = d3.select(this);

      // Sort
      tr.sort(function(changeA, changeB) {
        return !changeA || !changeB ? -1 : element.attr('sorting') !== 'ascending' ? d3.ascending(changeA.recordedAt(), changeB.recordedAt()) : d3.descending(changeA.recordedAt(), changeB.recordedAt());
      });

      // Toggle attr
      element.attr('sorting', function() {
        return element.attr('sorting') !== 'ascending' ? 'ascending' : 'descending';
      });

      // Toggle cursor
      element.style('cursor', function() {
        return element.attr('sorting') === 'ascending' ? 's-resize' : 'n-resize';
      });

    }

  };

  // --------------------------------
  // Export
  // --------------------------------

  return tableView;

}());

},{"../navigation/stateManager":37,"clone":5,"moment":12,"underscore":14}],31:[function(require,module,exports){
module.exports = (function() {

  // --------------------------------
  // Tree View
  // --------------------------------

  var treeView = {

  };

  // --------------------------------
  // Methods
  // --------------------------------
  treeView.create = function(trail, overlayWrapper) {
    // Create and Append Tree Container
    var treeContainer = overlayWrapper.append('div')
      .attr('id', trail.id() + '-trails-overlay-tree-container')
      .attr('class', 'trails-overlay-tree-container');

  };


  treeView.zoomTo = function(trail, vid){

    // Get SVG
    var svg = d3.select('#' + trail.id() + "-trails-overlay")
      .select('.trails-overlay-tree-container')
      .select("svg");

    // Create Zoom
    var zoom = d3.behavior.zoom()
      .center([width / 2, 0])
      .scaleExtent([0.5, 2])
      .on("zoom", zoomed);

    // On Zoomed
    function zoomed() {

      // Check Event and Update
      if (scale != d3.event.scale) {
        container.transition()
          .duration(20)
          .attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      } else {
        container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }

      // Hold Current Scale
      var scale = 1;

      // Update Scale
      scale = d3.event.scale;

    }

  };


  treeView.show = function(trail, overlayWrapper, versionTree, doc, showCheckpoints) {
    var treeContainer = d3.select('#' + trail.id() + '-trails-overlay-tree-container');

    // FIXME: recreate tree, should be updated dynamically
    treeContainer.html("");

    var svg = treeContainer.append('svg')
      .attr('width', '100%')
      .attr('height', '100%');

    var margin = {
      top: 10,
      right: 0,
      bottom: 0,
      left: 10
    };
    var width = parseInt(svg.style('width')),
      height = parseInt(svg.style('height'));
    width -= margin.left + margin.right;
    height -= margin.top + margin.bottom;

    // Create Zoom
    var zoom = d3.behavior.zoom()
      .center([width / 2, 0])
      .scaleExtent([0.5, 2])
      .on("zoom", zoomed);

    svg.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(zoom);

    // Zoomable Group
    var container = svg.append('g')
      .attr('class', 'zoomable');

    // Counter
    var i = 0;

    // tree Layout
    var tree = d3.layout.tree()
      .separation(function separation(a, b) {
        return a.parent === b.parent ? 1 : 1.5;
      })
      .nodeSize([180, 180]);

    // Projection
    var diagonal = d3.svg.diagonal()
      .projection(function(d) {
        return [d.x + width / 2, d.y + 50];
      });

    // Numeric Settings
    var nodeDepth = 120;

    // Update Tree
    update(versionTree);

    // Hold Current Scale
    var scale = 1;

    // On Zoomed
    function zoomed() {

      // Check Event and Update
      if (scale != d3.event.scale) {
        container.transition()
          .duration(20)
          .attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      } else {
        container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }

      // Update Scale
      scale = d3.event.scale;

    }

    // Update Tree
    function update(versionTree) {

      // Compute the new tree layout.
      var nodes = tree.nodes(versionTree);
      var links = tree.links(nodes);

      // Normalize for fixed-depth.
      nodes.forEach(function(d) {
        d.y = d.depth * nodeDepth;
      });

      // Declare the nodes…
      var node = container.selectAll("g.node")
        .data(nodes, function(d) {
          return d.key;
        });

      var paneToNode = function(d){
        nodes.some(function(d2){
          if(d.key === d2.key){

            // Get translateX and translateY
            var translateX = (d2.x + width / 2);
            var translateY = (d2.y + 50);

            // Compute Translation
            var cur = zoom.translate(),
                src = [ cur[0] + width / 2, cur[0] + height / 2 ],
                dst = [translateX, translateY],
                diff = [ - dst[0] + src[0], - dst[1] + src[1]];

            // Translate
            zoom.translate(diff);
            svg.transition().duration(100).call(zoom.event);

          }
        });
      };

      // FIXME: An ugliest hack ever seen
      // treeview and table view does not share context
      // Cannot access zoom function of tree in table
      trail.paneToNode = paneToNode;

      // Enter the nodes.
      var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {

          // Get translateX and translateY
          var translateX = (d.x + width / 2);
          var translateY = (d.y + 50);

          // Check if current node is out of the box or partially visible near the edges
          if(d.key === trail.currentVersion() && ( translateX > width - 50 || translateY > height - 50 ) ){

            // Compute Translation
            var cur = zoom.translate(),
                src = [ cur[0] + width / 2, cur[0] + height / 2 ],
                dst = [translateX, translateY],
                diff = [ - dst[0] + src[0], - dst[1] + src[1]];

            // Translate
            zoom.translate(diff);
            svg.transition().duration(100).call(zoom.event);



          }

          // Set
          return "translate(" + (translateX) + "," + (translateY) + ")";

        }).on('click', highlightNode);

      var nodeEllipse = nodeEnter.append("ellipse")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("rx", 70)
        .attr("ry", 35)
        .attr('id', function(d) {
          return 'node-' + d.key;
        })
        .attr('class', 'tree-node')
        // .attr("transform", "translate(" + [100, 100] + ")")
        .classed('root-node', function(d) {
          return d.key === 'root-node';
        })
        .classed('current', function(d) {
          return trail.currentNode().data().key === d.key;
        })
        .on("mouseover", function(d){

          // Add Highlight
          nodeEllipse.classed('highlight', function(d2){
            return d.key === d2.key;
          });

          // Highlight
          var rows = d3.select('#' + trail.id() + "-trails-overlay")
            .select('#' + trail.id() + '-trails-overlay-table tbody')
            .selectAll('tr')
            .classed('highlight', function(d2){ return d2 && d2.key === d.key; });

          // ScrollTo
          d3.select('#' + trail.id() + "-trails-overlay").select('#row-' + d.key)
            .node().scrollIntoView(true);

        })
        .on("mouseout", function(d){

          // Clear
          nodeEllipse.classed('highlight', false);

          // Clear Highlighting
          var rows = d3.select('#' + trail.id() + "-trails-overlay")
            .select('#' + trail.id() + '-trails-overlay-table tbody')
            .selectAll('tr').classed('highlight', false);

        });

      if (showCheckpoints) {
        nodeEllipse.classed('checkpoint', function(d) {
          return d.key !== 'root-node' && trail.versionStore()[d.key].isCheckpoint();
        });

      }

      // based on https://github.com/mbostock/d3/issues/1642
      // modified to vertically center
      function wrap(text, width) {
        text.each(function() {
          var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            allTspans = [],
            line = [],
            lineNumber = 0,
            lineHeight = 1.2, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y);
          word = words.pop();
          allTspans.push(tspan);
          while (word) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan").attr("x", 0).attr("y", y).text(word);
              allTspans.push(tspan);
            }
            word = words.pop();
          }
          allTspans.forEach(function(d, i) {
            d.attr("dy", -(allTspans.length - 1) / 2.0 * lineHeight + i * lineHeight + dy + "em");
          });
        });
      }

      // Add Text
      nodeEnter.append("text")
        .attr("y", 0)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(function(d) {
          if (d.key !== 'root-node') {

            // Get Action
            var change = trail.versionStore()[d.key];
            var statement = change.action().toString();

            return statement ? statement(change.data()) : change.action().label();

          } else {
            return 'Initial State';
          }

        })
        .style("fill-opacity", 1)
        .call(wrap, 80);

      // Declare the links…
      var link = container.selectAll("path.link")
        .data(links, function(d) {
          return d.target.key;
        });

      // Enter the links.
      link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", diagonal);

    }


    function highlightNode(d) {

      trail.waitFor(function() {
        trail.changeVersion(d.key);
      });

      // Exit Overlay
      d3.select('#' + trail.id() + '-trails-overlay').classed('hidden', true);
      d3.select(doc.body).style("overflow", "auto");
    }

  };

  // --------------------------------
  // Export
  // --------------------------------

  return treeView;

}());

},{}],32:[function(require,module,exports){
module.exports = (function() {
  return function() {
    function s1() {
      return String.fromCharCode(97 + Math.floor(Math.random() * 6));
    }

    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s1() + s4() + s4() + '-' + s4() + s4() + s4() + s4() + s4() + s4();
  };
}());

},{}],33:[function(require,module,exports){
module.exports = (function() {
  return {
    guid: require('./guid'),
    parseTime: require('./parseTime')
  };
}());

},{"./guid":32,"./parseTime":34}],34:[function(require,module,exports){
module.exports = (function() {
  return function(timestamp, timezoneOffset){

    // Validate offset
    if(!timezoneOffset) timezoneOffset = 0;

    // Month Names
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Create Date
    var date = new Date(timestamp + timezoneOffset);

    // Return Parsed Date
    return months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

  };
}());

},{}],35:[function(require,module,exports){
// Write Current Dir
module.exports = require('./trails/masterTrail');

},{"./trails/masterTrail":45}],36:[function(require,module,exports){
module.exports = (function() {

  var nearestCheckpoint = {

    find: function(trail, toNode) {

      // Check if destination itself is checkpoint
      if (toNode && trail.versionStore()[toNode.data().key].isCheckpoint()) {
        return {
          node: toNode,
          distance: 0,
        };
      }

      // Radius of search
      var maxDistance = trail._config.checkpointStepSize;

      // Current Checkpoint and Distance
      var chkDistance = Infinity;
      var checkpoint = null;

      // Recur over outer nodes
      (function recurOuter(outerNode, visited, distance) {

        // Start Exploring Children
        var found = (function recur(node, visited, distance) {

          // Check if already visited
          if (visited.indexOf(node) > -1)
            return;

          // Check Distance
          if (distance > maxDistance || distance > chkDistance)
            return;

          // Check for checkpoint
          if (node && trail.versionStore()[node.data().key].isCheckpoint() && distance < chkDistance) {
            checkpoint = node;
            chkDistance = distance;
            return true;
          }

          // Recur over childs
          node.childNodes().some(function(_child) {
            return recur(_child, visited, distance + 1);
          });

        }(outerNode, visited, distance));

        // Return if checkpoint is found
        if (found) return;

        // Go to Parent
        if (outerNode.parentNode()) {
          return recurOuter(outerNode.parentNode(), visited, distance + 1);
        }

      }(toNode, [], 0));

      return {
        node: checkpoint,
        distance: chkDistance,
      };

    }

  };

  return nearestCheckpoint;

}());
},{}],37:[function(require,module,exports){
var nearestCheckpoint = require('./nearestCheckpoint'),
    clone = require('clone');

module.exports = (function() {

  var stateManager = {

    computeState: function(trail, fromNode, toNode, fwdCallback, invCallback) {

      // Get Nearest Checkpoint
      var chk = nearestCheckpoint.find(trail, toNode);

      // Distance between from and to
      var distance = trail.versionTree().distanceBetween(fromNode, toNode);

      // Get From Node State
      var state = null;
      if (distance > chk.distance) {
        fromNode = chk.node;
        state = clone(trail.versionStore()[fromNode.data().key].checkpointData());
      } else {
        state = clone(trail.checkpoint()._getCheckpointCallback());
      }

      // Get Common Parent
      var commonParent = trail.versionTree().findCommonParent(fromNode, toNode);

      // If common parent is from node
      // common parent is above toNode - forward all
      if (commonParent === fromNode) {
        state = stateManager.forwardAll(trail, state, fromNode, toNode, fwdCallback);
      } else if (commonParent === toNode) { // toNode is above fromNode - inverse all
        state = stateManager.inverseAll(trail, state, fromNode, toNode, invCallback);
      } else { // Sequence of inverses followed by sequence of forwards
        state = stateManager.inverseAll(trail, state, fromNode, commonParent, invCallback, true);
        state = stateManager.forwardAll(trail, state, commonParent, toNode, fwdCallback, true);
      }

      return state;

    },


    forwardAll: function(trail, state, fromNode, toNode, fwdCallback, shouldUpdateThumb) {

      // Forward All
      (function recurForward(node) {

        // Recur Until Top Node is reached
        if (node.parentNode() && node.parentNode() !== fromNode) recurForward(node.parentNode());

        // Get Change and Forward Action
        var change = trail.versionStore()[node.data().key];
        var fwdAction = change.action().forward();

        // Forward
        state = fwdAction(state, change.data());

        // Update
        if (shouldUpdateThumb) {
          trail._currentBranchVersions.push(change.id());
        }

        // Trigger Forward Action Callback
        if (fwdCallback) fwdCallback(change);

      }(toNode));

      // Return modified state
      return state;

    },

    inverseAll: function(trail, state, fromNode, toNode, invCallback, shouldUpdateThumb) {

      // Inverse All
      (function recurInverse(node) {

        // Get Change and Inverse Action
        var change = trail.versionStore()[node.data().key];
        var invAction = change.action().inverse();

        // Inverse
        state = invAction(state, change.data(), trail.versionStore()[change.node().parentNode().data().key].data());

        // Update
        if (shouldUpdateThumb) {
          var idx = trail.currentBranchVersions().indexOf(change.id());
          if (idx > -1) {
            trail._currentBranchVersions.splice(idx, 1);
          }
        }

        // Update Current Node in Trail
        // if(shouldUpdateCurrent) change.trail().currentNode(change.node().parentNode());
        if (invCallback) invCallback(change);

        // Recur Inverse
        if (node.parentNode() && node.parentNode() !== toNode) recurInverse(node.parentNode());

      }(fromNode));

      // Return modified state
      return state;

    },


  };


  return stateManager;

}());

},{"./nearestCheckpoint":36,"clone":5}],38:[function(require,module,exports){
var rasterizeHTML = require('rasterizehtml/dist/rasterizeHTML.allinone'),
    cssExtractor = require('./css-extractor');

module.exports = (function(doc) {

  var extractedCSSDOM = null;

  var captureHTML = function(selector, callback) {

    // Extract and Save CSS
    if (!extractedCSSDOM) {
      extractedCSSDOM = cssExtractor.extract(doc);
    }

    // Clone Selector
    var clonedDocument = doc.cloneNode(true);
    var clonedSelector = clonedDocument.querySelector(selector).cloneNode(true);
    clonedSelector.appendChild(extractedCSSDOM);

    // Get Body and HTML
    var body = doc.body,
      html = doc.documentElement;

    // Compute Max Height
    var maxHeight = Math.max(body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight);

    // Compute Max Width
    var maxWidth = Math.max(body.scrollWidth, body.offsetWidth,
      html.clientWidth, html.scrollWidth, html.offsetWidth);

    // Create temporary canvas element
    var canvas = clonedDocument.createElement("canvas");
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    canvas.id = "ra-canvas";

    // Modify Context of Canvas
    var context = canvas.getContext("2d");
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Rasterize the entire document
    var elementDOM = doc.querySelector(selector);

    // Size and Offsets
    var height = Math.max(elementDOM.clientHeight, elementDOM.scrollHeight),
      width = Math.max(elementDOM.clientWidth, elementDOM.scrollWidth),
      topOffset = elementDOM.offsetTop,
      leftOffset = elementDOM.offsetLeft;


    // Draw HTML
    // Draw rasterized document
    rasterizeHTML.drawHTML(clonedSelector.outerHTML, canvas).then(function(renderResult) {

      // Create Magnified Canvas
      var scalingCanvas = clonedDocument.createElement("canvas");
      scalingCanvas.width = (renderResult.image.width * 2);
      scalingCanvas.height = (renderResult.image.height * 2);
      scalingCanvas.id = "sa-canvas";

      // Modify Context of Canvas
      var scalingCanvasCtx = scalingCanvas.getContext("2d");
      scalingCanvasCtx.fillStyle = "#FFFFFF";
      scalingCanvasCtx.fillRect(0, 0, scalingCanvas.width, scalingCanvas.height);

      // Draw Image
      scalingCanvasCtx.drawImage(renderResult.image, 0, 0, scalingCanvas.width, scalingCanvas.height);

      // Get base64
      var imageBase64 = scalingCanvas.toDataURL("image/png", 1.0);

      // Send result back
      if (callback) callback(imageBase64);

    }, function error(e) {

      // Throw Error
      throw new Error(e);

    });


  };


  return captureHTML;

}(document));

},{"./css-extractor":40,"rasterizehtml/dist/rasterizeHTML.allinone":13}],39:[function(require,module,exports){
var rasterizeHTML = require('rasterizehtml/dist/rasterizeHTML.allinone');

module.exports = (function(doc) {

  var captureThumbnail = function(element, callback) {

    // If required arguments are passed
    if (arguments.length > 0) {

      // Check If rasterizeHTML is included
      if (!rasterizeHTML || rasterizeHTML === 'undefined') {
        if (callback) callback(null);
        return;
      }

      if (!document.querySelector(element)) {
        if (callback) callback(null);
        return;
      }

      // Clone and Hold current document
      var currentDocument = doc;
      var clonnedDocument = currentDocument.cloneNode(true);

      // Remove all <script /> tags
      var scripts = clonnedDocument.getElementsByTagName('script');
      for (var i = scripts.length; i--;) {
        scripts[i].parentNode.removeChild(scripts[i]);
      }

      // Remove Inline Javascript
      var anchors = clonnedDocument.getElementsByTagName('a');
      for (var j = anchors.length; j--;) {
        if (anchors[j].href.indexOf('javascript') > -1) {
          anchors[j].href = "#";
        }
      }

      // Get Body and HTML
      var body = currentDocument.body,
        html = currentDocument.documentElement;

      // Compute Max Height
      var maxHeight = Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);

      // Compute Max Width
      var maxWidth = Math.max(body.scrollWidth, body.offsetWidth,
        html.clientWidth, html.scrollWidth, html.offsetWidth);

      // Create temporary canvas element
      var canvas = clonnedDocument.createElement("canvas");
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      canvas.id = "ra-canvas";

      // Modify Context of Canvas
      var context = canvas.getContext("2d");
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Rasterize the entire document
      var elementDOM = currentDocument.querySelector(element);

      // Size and Offsets
      var height = Math.max(elementDOM.clientHeight, elementDOM.scrollHeight),
        width = Math.max(elementDOM.clientWidth, elementDOM.scrollWidth),
        topOffset = elementDOM.offsetTop,
        leftOffset = elementDOM.offsetLeft;

      // Draw rasterized document
      rasterizeHTML.drawDocument(clonnedDocument, canvas).then(function(renderResult) {

        // Get Canvas context
        var ctx = canvas.getContext("2d");

        // Get Image Data
        var imageData = ctx.getImageData(leftOffset, topOffset, width, height);

        // Clear Canvas Rect
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Resize Canvas
        canvas.width = width;
        canvas.height = height;

        // Put cropped data back
        ctx.putImageData(imageData, 0, 0);

        // Get base64
        var imageBase64 = canvas.toDataURL("image/png", 1.0);

        // Send result back
        if (callback) callback(imageBase64);

      }, function error(e) {
        throw new Error(e);
      });

    }
  };

  return captureThumbnail;

}(document));
},{"rasterizehtml/dist/rasterizeHTML.allinone":13}],40:[function(require,module,exports){
module.exports = (function() {

  var cssExtractor = {
    extract: function(doc) {

      // Create Style Element
      var styleDOM = doc.createElement('style');
      styleDOM.type = 'text/css';

      // Hold Extracted CSS
      var css = "";

      // Loop Over Stylesheets
      for (var s = doc.styleSheets.length - 1; s >= 0; s--) {
        var cssRules = doc.styleSheets[s].rules || doc.styleSheets[s].cssRules || []; // IE supp
        for (var c = 0; c < cssRules.length; c++) {
          css += cssRules[c].cssText;
        }
      }

      // Add css to created style element
      if (styleDOM.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        styleDOM.appendChild(doc.createTextNode(css));
      }

      return styleDOM;

    }
  };

  return cssExtractor;

}());
},{}],41:[function(require,module,exports){
module.exports = (function() {
  return {
    captureThumbnail: require('./captureThumbnail'),
    captureHTML: require('./captureHTML'),
  };
}());
},{"./captureHTML":38,"./captureThumbnail":39}],42:[function(require,module,exports){
/**
 * Exports the trail information in json
 *
 * @module share/exporter
 */
module.exports = (function() {

  'use strict';

  // ------------------------------
  // Basic Setup
  // ------------------------------

  var exporter = {

    /**
     * Exports the trail
     *
     * @name export
     * @memberof exporter
     */
    export: function(trail) {

      return {

        // Trail Setup
        trailId: trail.id(),
        createdAt: trail.createdAt(),
        timezoneOffset: trail.timezoneOffset(),
        attrs: trail.attrs(),
        controls: trail.controlsSelected(),
        renderTo: trail.renderedTo(),
        url: window.location.href,

        // Current Version Tracking
        currentVersion: trail.currentVersion(),
        currentBranchVersions: trail.currentBranchVersions(),

        // Mark Master
        isMaster: true,

        // Version Store
        // version Store gets exported in an array
        versionStore: Object.keys(trail.versionStore()).map(function(key) {
          return exporter.exportChange(trail.versionStore()[key]);
        }),

        // Version Tree
        versionTree: trail.versionTree().export(function(data) {
          return {
            key: data.key,
            trailId: data.trailId
          };
        }),

        // Sub Trail
        subTrails: trail.subTrails().map(exporter.exportSubTrail)

      };

    },

    /**
     * Exports a sub trail
     *
     * @name exportSubTrail
     * @memberof exporter
     */
    exportSubTrail: function(st) {

      return {

        // Trail Setup
        trailId: st.id(),
        createdAt: st.createdAt(),
        timezoneOffset: st.timezoneOffset(),
        attrs: st.attrs(),

        // Identification
        label: st.label(),
        masterTrail: st.masterTrail().id(),

        // Current Version In Sub Trail
        currentVersion: st.currentVersion(),

        // Version Tree
        versionTree: st.versionTree().export(function(data) {
          return {
            key: data.key
          };
        }),

      };

    },

    /**
     * Exports a change
     *
     * @name exportChange
     * @memberof exporter
     */
    exportChange: function(change) {
      return {
        id: change.id(),
        attrs: change.attrs(),
        recordedAt: change.recordedAt(),
        timezoneOffset: change.timezoneOffset(),
        trailId: change.trail().id(),
        data: change.data(),
        action: change.action() ? change.action().label() : null,
        checkpointData: change.checkpointData(),
        thumbnail: change.thumbnail(),
        comments: change.comments(),
      };
    },

  };

  return exporter;

}());

},{}],43:[function(require,module,exports){
var dataTree = require('data-tree'),
    Change = require('../change'),
    stateManager = require('../navigation/stateManager');

/**
 * Imports the trail
 *
 * @module share/exporter
 */
module.exports = (function() {

  'use strict';

  // ------------------------------
  // Basic Setup
  // ------------------------------

  var importer = {

    /**
     * Imports the trail
     *
     * @name importer
     * @memberof importer
     */
    import: function(trail, trailData) {

      // Validate
      if (!trailData || !trailData.trailId || typeof trailData.trailId !== 'string')
        return alert('Import Failed.\nError: Invalid trail id');

      // Backup old id
      var oldId = trail.id();

      // Import and override trail properties
      trail._id = trailData.trailId;
      trail._initiatedAt = trailData.initiatedAt;
      trail._currentBranchVersions = trailData.currentBranchVersions;

      // Import and Override attributes
      trail._attrs = trailData.attrs;

      // Import Sub Trails
      // Does not imports version tree
      // Becasue we need to set currentNode in changes
      // Trails and sub trails info will be need while importing version store
      if (trailData.subTrails) {
        trailData.subTrails.forEach(function(stData) {
          importer.importSubTrail(stData, trail);
        });
      }

      // Import Version Store
      // Also creates and imports changes
      // Does not set nodeInMasterTrail and nodeInSubTrail
      var comments = [];
      trail._versionStore = {};
      if (trailData.versionStore) {
        trailData.versionStore.forEach(function(record) {
          if (record.id) {
            trail._versionStore[record.id] = importer.importChange(record, trail);
            comments = comments.concat(trail._versionStore[record.id].comments());
          }
        });
      }

      // Import Master Version Tree
      // ALso sets nodeInMasterTrail to versionStore changes
      trail._versionTree = dataTree.create();
      trail._versionTree.import(trailData.versionTree, 'children', function(nodeData) {
        return nodeData;
      });
      trail._versionTree.traverser().traverseBFS(function(node) {
        trail._versionStore[node.data().key].nodeInMasterTrail(node);
        if (trailData.currentVersion === node.data().key) {
          trail._versionTree._currentNode = node;
        }
      });

      // Import Sub Trail Version Trees
      trailData.subTrails.forEach(function(stData) {
        var st = importer.getTrailById(trail, stData.trailId);
        st._versionTree = dataTree.create();
        st._versionTree.import(stData.versionTree, 'children', function(nodeData) {
          return nodeData;
        });
        st._versionTree.traverser().traverseBFS(function(node) {
          if (node.data().key === stData.currentVersion) {
            trail._versionStore[node.data().key].nodeInSubTrail(node);
            st._versionTree._currentNode = node;
          }
        });
      });

      // Recreate Control Box
      trail.recreateControlBox();
      d3.select("#" + oldId + "-trails-overlay").remove();

      // Import and Override controls
      // This removes and recreates the control box
      trail._controlsSelected = [];
      trail.addControls(trailData.controls);
      trail.renderTo(trailData.renderTo);

      // Sort Comments
      comments = comments.sort(function(c1, c2){ return d3.ascending(c1.date, c2.date); });

      // Add comment to UI
      comments.forEach(function(c){
        trail.addCommentToUI(c, c.vid);
      });

      // Import is success
      // Compute State and Load
      var state = stateManager.computeState(trail, trail.versionTree().rootNode(), trail.currentNode());
      trail.checkpoint()._setCheckpointCallback(state);

      // Refresh Thumbnail Gallery
      trail.refreshThumbnailGallery();

    },


    /**
     * Imports a sub trail
     *
     * @name importSubTrail
     * @memberof importer
     */
    importSubTrail: function(stData, trail) {
      trail.subTrails().forEach(function(st) {
        if (st.label() === stData.label) {
          st._id = stData.trailId;
          st._attrs = stData.attrs;
          st._createdAt = stData.createdAt;
          st._masterTrail = trail;
          st._timezoneOffset = stData.timezoneOffset;
        }
      });
    },

    /**
     * Builds a version tree
     *
     * @name buildVersionTree
     * @memberof importer
     */
    buildVersionTree: function(data) {
      var tree = dataTree.create();
      tree.import(data, 'children', function(nodeData) {
        return nodeData;
      });
      return tree;
    },

    /**
     * Imports a change
     *
     * @name importer
     * @memberof importer
     */
    importChange: function(record, trail) {
      var change = new Change();
      change._id = record.id;
      change._recordedAt = record.recordedAt;
      change._data = record.data;
      change._checkpointData = record.checkpointData;
      change._thumbnail = record.thumbnail;
      change._timezoneOffset = record.timezoneOffset;
      change._comments = record.comments;
      change._trail = importer.getTrailById(trail, record.trailId);
      change._action = importer.getActionByLabel(trail, record.action);
      return change;
    },

    getActionByLabel: function(trail, label) {
      var action = null;
      trail.actions().some(function(ac) {
        if (ac.label() === label) {
          action = ac;
          return true;
        }
      });
      return action;
    },

    getTrailById: function(trail, id) {
      if (trail.id() === id) {
        return trail;
      } else {
        var subTrail = null;
        trail.subTrails().some(function(st) {
          if (st.id() === id) {
            subTrail = st;
          }
        });
        return subTrail;
      }
    },


  };

  return importer;

}());

},{"../change":16,"../navigation/stateManager":37,"data-tree":6}],44:[function(require,module,exports){
var helpers = require('../helpers'),
    Action = require('../action'),
    Class = require('../class'),
    Change = require('../change'),
    dataTree = require('data-tree'),
    clone = require('clone');

/**
 *
 * Base Trail creates a base structure required for creating master trail and sub trail.
 *
 * Trail represents a master trail using which sub trails can be created.
 * Sub trails watches over the state of visualization and records changes
 * upon interaction while master trail maintains the sequence of records
 * occured in sub trails.
 *
 * @module trails/baseTrail
 */
module.exports = (function() {

  'use strict';

  // ------------------------------
  // Basic Setup
  // ------------------------------

  // Change Count
  var changeCount = 0;

  var BaseTrail = Class.create( /** @lends BaseTrail */ {

    // ------------------------------
    // Constructor
    // ------------------------------

    /**
     * Initializes the class
     *
     * @name initialize
     * @memberof BaseTrail
     * @instance
     */
    initialize: function() {

      // Guid that uniqly identifies the trail
      this._id = helpers.guid();

      // Timestamp at which trail was created
      this._createdAt = new Date().getTime();

      // Timezone in which trail is created
      this._timezoneOffset = new Date().getTimezoneOffset();

      // Attributes
      this._attrs = {};

      // Undo Callback
      this._undoCallback = null;

      // Undo Callback
      this._redoCallback = null;

      // Done Callback
      this._doneCallback = null;

      // Version Tree
      this._versionTree = dataTree.create();

      // Hold this
      var thiss = this;

      // Current Version Node
      this.versionTree().insert({
        key: 'root-node',
        trailId: thiss.id(),
      });

      // Events
      this._events = {
        'changeRecorded': [],
        'thumbnailCaptured': [],
      };

    },

    // Provenance ANgle

    // ------------------------------
    // Getters and Setters
    // ------------------------------

    /**
     * Return a GUID that uniqly identifies the trail. GUID is a 16 character alphanumeric string.
     *
     * @name id
     * @memberof BaseTrail
     * @instance
     * @return {String} - GUID
     */
    id: function() {
      return this._id;
    },

    /**
     * Returns a timestamp at which trail was created.
     *
     * @name id
     * @memberof BaseTrail
     * @instance
     * @return {Number} - Timestamp in milliseconds
     */
    createdAt: function() {
      return this._createdAt;
    },

    /**
     * Returns a timezone offset
     *
     * @name timezoneOffset
     * @memberof BaseTrail
     * @instance
     * @return {Number} - Timezone Offset
     */
    timezoneOffset: function() {
      return this._timezoneOffset;
    },

    /**
     * Gets or sets attributes
     *
     * @method attr
     * @memberof BaseTrail
     * @instance
     * @param {String} key - using which value is to be set or get
     * @param {Object | Array | String | Number} value - data that is to be stored
     * @return {BaseTrail} - An instance of trail
     * @return {object | array | string | number | null} - data for provided key (if found)
     */
    attr: function(key, value) {
      if (!key || typeof key !== 'string') {
        return this._attrs;
      } else {
        if (arguments.length > 1) {
          this._attrs[key] = value;
          return this;
        } else if (this._attrs.hasOwnProperty(key)) {
          return this._attrs[key];
        }
      }
    },

    /**
     * Gets or sets all attrs
     *
     * @method attr
     * @memberof BaseTrail
     * @instance
     * @return {BaseTrail} - An instance of trail
     * @return {object} - attributes
     */
    attrs: function(args) {
      if (arguments.length > 0) {

      } else {
        return this._attrs;
      }
    },

    /**
     * Returns a version tree
     *
     * @name versionTree
     * @memberof BaseTrail
     * @instance
     * @return {object} - a version tree
     */
    versionTree: function() {
      return this._versionTree;
    },

    /**
     * Returns current version
     *
     * @name currentVersion
     * @memberof BaseTrail
     * @instance
     * @return {String} - Version Key
     */
    currentVersion: function(callback) {
      return this.currentNode().data().key;
    },

    /**
     * Returns current change
     *
     * @name currentChange
     * @memberof BaseTrail
     * @instance
     * @return {@link Change} - current change
     */
    currentChange: function(callback) {
      return this.versionStore()[this.currentVersion()];
    },

    /**
     * Returns current version node
     *
     * @name currentNode
     * @memberof BaseTrail
     * @instance
     * @return {object} - current node of version tree
     */
    currentNode: function(node) {
      if (arguments.length > 0) {
        this.versionTree()._currentNode = node;
        return this;
      }
      return this.versionTree().currentNode();
    },

    /**
     * Returns a change by id
     *
     * @name versionStore
     * @memberof BaseTrail
     * @instance
     * @return {@link Change} - change that matches id provided
     */
    getChangeById: function(id) {
      if (this.versionStore().hasOwnProperty(id)) {
        return this.versionStore()[id];
      }
      return null;
    },

    /**
     * Undo callback
     *
     * @name undo
     * @memberof BaseTrail
     * @instance
     * @return {@link BaseTrail} - trail
     */
    undo: function(callback) {
      if (callback) {
        this._undoCallback = callback;
        return this;
      }
      return this._undoCallback;
    },

    /**
     * Undo callback
     *
     * @name undo
     * @memberof BaseTrail
     * @instance
     * @return {@link BaseTrail} - trail
     */
    redo: function(callback) {
      if (callback) {
        this._redoCallback = callback;
        return this;
      }
      return this._redoCallback;
    },

    /**
     * Done callback
     *
     * @name undo
     * @memberof BaseTrail
     * @instance
     * @return {@link BaseTrail} - trail
     */
    done: function(callback) {
      if (callback) {
        this._doneCallback = callback;
        return this;
      }
      return this._doneCallback;
    },

    // ------------------------------
    // Methods
    // ------------------------------

    /**
     * Registers an event
     *
     * @name on
     * @memberof SubTrail
     * @instance
     * @param {@link Change} - A change recorded
     */
    on: function(evt, callback) {
      if (evt && this._events.hasOwnProperty(evt)) {
        this._events[evt].push(callback);
      }
      return this;
    },

    /**
     * Records a change
     *
     * @name record
     * @memberof BaseTrail
     * @instance
     */
    record: function(action, data, callback, dontClone) {

      // Create a change
      data = dontClone ? data : clone(data);
      var change = new Change(action, data, this);

      // Count
      change.attr('count', ++changeCount);

      // Add Change to Version Store
      this.versionStore()[change.id()] = change;

      // Hold This
      var trail = this;

      // Add Change to version tree and update the current version
      this.versionTree().insertToNode(this.currentNode(), {
        key: change.id(),
        trailId: trail.id(),
      });

      // Return change
      return change;

    },

  });

  // ------------------------------
  // Export
  // ------------------------------

  return BaseTrail;

}());

},{"../action":15,"../change":16,"../class":18,"../helpers":33,"clone":5,"data-tree":6}],45:[function(require,module,exports){
var helpers = require('../helpers'),
    BaseTrail = require('./baseTrail'),
    SubTrail = require('./subTrail'),
    Action = require('../action'),
    Class = require('../class'),
    Change = require('../change'),
    // controls = require('../controls')(document),
    controls = require('../controls/minimal')(document),
    CheckpointManager = require('../checkpoint/checkpointManager'),
    stateManager = require('../navigation/stateManager'),
    exporter = require('../share/exporter'),
    moment = require('moment'),
    importer = require('../share/importer'),
    fileSaver = require('filesaver.js/FileSaver.min.js'),
    clone = require('clone'),
    _ = require('underscore');

/**
 * Trail represents a master trail using which sub trails can be created.
 * Sub trails watches over the state of visualization and records changes
 * upon interaction while master trail maintains the sequence of records
 * occured in sub trails.
 *
 * @module trails/masterTrail
 */
module.exports = (function() {

  'use strict';

  // ------------------------------
  // Basic Setup
  // ------------------------------

  var Trail = Class.extend(BaseTrail, /** @lends Trail */ {

    /**
     * Initializes the class
     *
     * @name initialize
     * @memberof Trail
     * @instance
     */
    initialize: function() {

      // Hold `this`
      var thiss = this;

      // Initialize Super
      this.super.initialize.call(this);

      // Sub Trails
      this._subTrails = [];

      // Config
      this._config = {
        checkpointStepSize: 5
      };

      // Version Store
      // Add a root node
      this._versionStore = {};

      // Control Box
      this._controlBox = controls.controlBox.create(this);

      // Selected Controls
      this._controlsSelected = [];

      // Selector in which controls are rendered
      this._renderedTo = null;

      // Current Branch versions
      this._currentBranchVersions = ['root-node'];

      // Wait State
      this._isIdle = false;

      // Add CheckpointManager
      this._checkpointManager = new CheckpointManager(this);

      // Github access token
      this._githubAccessToken = null;

      // Holds actions created so that they should not get
      // lost across trail import. Actions does not get overwritten
      // upon new trail import.
      this._actions = [];

      // Add Root Node and Update Id
      this._versionStore['root-node'] = new Change(null, null, thiss);
      this._versionStore['root-node']._id = 'root-node';
      this._versionStore['root-node'].nodeInMasterTrail(this._versionTree.rootNode());

      // Add Listener
      this.on('thumbnailCaptured', function(change) {
        addThumbnailToGallery(thiss, change);
      });

      // Add Checkpoint Rule
      this.checkpoint().addRule(function(change) {
        return change.attr('count') % thiss._config.checkpointStepSize === 0;
      });

    },

    // ------------------------------
    // Getters and Setters
    // ------------------------------

    /**
     * Return an array of sub trails
     *
     * @name subTrails
     * @memberof Trail
     * @instance
     * @return {Array} - Sub trails created
     */
    subTrails: function() {
      return this._subTrails;
    },

    /**
     * Return a version store
     *
     * @name versionStore
     * @memberof Trail
     * @instance
     * @return {Array} - array of version ids
     */
    versionStore: function() {
      return this._versionStore;
    },

    /**
     * Return an array of sub trails
     *
     * @name controlsSelected
     * @memberof Trail
     * @instance
     * @return {Array} - Array of control names selected
     */
    controlsSelected: function() {
      return this._controlsSelected;
    },

    /**
     * Return a control box
     *
     * @name controlBox
     * @memberof Trail
     * @instance
     * @return {Object} - DOM of control box
     */
    controlBox: function() {
      return this._controlBox;
    },

    /**
     * Return a selector in which control box is rendered
     *
     * @name renderedTo
     * @memberof Trail
     * @instance
     * @return {String} - Query Seelctor in which control box is rendered
     */
    renderedTo: function() {
      return this._renderedTo;
    },

    /**
     * Sets or gets the github access token
     *
     * @name renderedTo
     * @memberof Trail
     * @instance
     * @return {String} - Query Seelctor in which control box is rendered
     */
    githubAccessToken: function(token) {
      if (arguments.length > 0) {
        this._githubAccessToken = token;
        return this;
      } else {
        return this._githubAccessToken;
      }
    },

    /**
     * Return weather trail is idle
     *
     * @name isIdle
     * @memberof Trail
     * @instance
     * @return {Boolean} - whether state is idle
     */
    isIdle: function() {
      return this._isIdle;
    },

    /**
     * Returns current branch version
     *
     * @name currentBranchVersions
     * @memberof Trail
     * @instance
     * @return {Array} - current versions
     */
    currentBranchVersions: function() {
      return this._currentBranchVersions;
    },

    /**
     * Gets a checkpoint Manager
     *
     * @name checkpointManager
     * @memberof Trail
     * @instance
     * @return {@link CheckpointManager}
     */
    checkpoint: function() {
      return this._checkpointManager;
    },

    /**
     * Gets an array of actions
     *
     * @name actions
     * @memberof Trail
     * @instance
     * @return {Array} actions
     */
    actions: function() {
      return this._actions;
    },

    // ------------------------------
    // Methods
    // ------------------------------

    /**
     * Does not records event if trail is idle
     *
     * @name waitFor
     * @memberof Trail
     * @instance
     * @param {Function} callback
     * @return {@link Trail}
     */
    waitFor: function(callback) {
      this._isIdle = true;
      callback();
      this._isIdle = false;
    },

    /**
     * Does not records event if trail is idle
     *
     * @name waitFor
     * @memberof Trail
     * @instance
     * @param {Function} callback
     * @return {@link Trail}
     */
    waitForAsync: function(callback) {
      var thiss = this;
      thiss._isIdle = true;
      callback(function() {
        thiss._isIdle = false;
      });
    },

    /**
     * Add a single control
     *
     * @name addControls
     * @memberof Trail
     * @instance
     * @param {String} ctrl - name of control
     * @return {@link Trail}
     */
    addControl: function(ctrl) {
      if (typeof ctrl === 'string' && controls.list.hasOwnProperty(ctrl) && this.controlsSelected().indexOf(ctrl) === -1) {
        controls.list[ctrl].create(this);
        this._controlsSelected.push(ctrl);
      }
      return this;
    },

    /**
     * Add an array of controls
     *
     * @name addControls
     * @memberof Trail
     * @instance
     * @param {Array} ctrls - list of controls to be rendered
     */
    addControls: function(ctrls) {

      // Validate Controls
      if (!ctrls || !Array.isArray(ctrls)) {
        ctrls = controls.all();
      }

      // Hold `this`
      var thiss = this;

      // Add Each Control
      ctrls.forEach(function(ctrl) {
        thiss.addControl(ctrl);
      });

      // Allow method chaining
      return this;

    },

    /**
     * Renders a control box to given selector
     *
     * @name renderTo
     * @memberof Trail
     * @instance
     * @param {String} selector - A query selector in which control box is to be rendered
     */
    renderTo: function(selector) {

      // Check if already rendered
      // Remove it
      if (this.renderedTo() && document.querySelector("#" + this.controlBox().id)) {
        document.querySelector("#" + this.controlBox().id).parentNode.removeChild(this.controlBox());
      }

      // Attach control box
      if (selector) {
        document.querySelector(selector).appendChild(this.controlBox());
        this._renderedTo = selector;
      } else {
        document.body.appendChild(this.controlBox());
        this._renderedTo = null;
      }

      // Allow Method Chaining
      return this;

    },

    /**
     * Recreates a control box and prepares it to add new controls.
     *
     * @name recreateControlBox
     * @memberof Trail
     * @instance
     */
    recreateControlBox: function() {

      // Remove Control Box adn Overlay Container
      if (document.querySelector('#' + this.controlBox().id)) {
        document.querySelector('#' + this.controlBox().id).parentNode.removeChild(this.controlBox());
      }

      // Recreate a new one
      this._controlBox = controls.controlBox.create(this);

    },

    /**
     * Creates a sub trail
     *
     * @name subTrail
     * @memberof Trail
     * @instance
     * @param {String} label - A label given to sub trail
     */
    subTrail: function(label) {

      // Label is necessary in order to recognize while importing
      if (arguments.length === 0 || !label || label.length === 0) {
        throw new Error("subTrail must have a label. trail.subTrail(\"some-label\"); ");
      }

      // Hold trail
      var subTrail = null;

      // Hold This
      var thiss = this;

      // Search for Label
      this.subTrails().some(function(st) {
        if (st.label() === label) {
          subTrail = st;
          return true;
        }
      });

      // Create new one if no existing matches the label
      if (!subTrail) {

        // Create new trail
        subTrail = new SubTrail(label, this);

        // On Thumbnails are captured.
        subTrail.on('thumbnailCaptured', function(change) {
          addThumbnailToGallery(thiss, change);
        });

        // Add to sub trails array
        this._subTrails.push(subTrail);

      }

      return subTrail;

    },

    /**
     * Creates an action
     *
     * @name createAction
     * @memberof Trail
     * @instance
     * @param {String} label - A label for an action
     */
    createAction: function(label) {
      return this._actions[this._actions.push(new Action(label, this)) - 1];
    },

    /**
     * Records a change
     *
     * @name record
     * @memberof Trail
     * @instance
     * @param {@link Change} - A change recorded
     */
    record: function(action, data, callback, dontClone) {

      if (this.isIdle()) return;

      // Call Super
      var change = this.super.record.apply(this, arguments);

      // Hold `this`
      var thiss = this;

      // Add Node
      change.nodeInMasterTrail(this.currentNode());

      // Filter Current Branch
      this._currentBranchVersions = this.currentBranchVersions().filter(function(key) {
        return thiss.versionStore()[key].nodeInMasterTrail().depth() < change.nodeInMasterTrail().depth();
      });

      // Add to Current Branch version
      this._currentBranchVersions.push(change.id());

      // Return change
      if (callback) callback(change);

      // Checkpoint
      this.checkpoint().checkSubTree(this.currentNode());

    },

    /**
     * Changes the version
     *
     * @name changeVersion
     * @memberof Trail
     * @instance
     * @param {String} vid - The version id to change to
     * @param {@link StateManager} stateManager
     */
    changeVersion: function(vid) {
      var trail = this;

      // Return if Current Version
      if(vid === trail.currentVersion()){ return; }

      // State
      var state = null;

      // If state loading itself is a checkpoint
      if (trail.getChangeById(vid).isCheckpoint()) {
        state = trail.getChangeById(vid).checkpointData();
      } else {

        // Forward Action Callback
        var fwdCallback = function(change) {
          change.trail().currentNode(change.node());
        };

        // Inverse Action Callback
        var invCallback = function(change) {
          change.trail().currentNode(change.node().parentNode());
        };

        // Compute State
        state = stateManager.computeState(trail, trail.currentNode(), trail.getChangeById(vid).nodeInMasterTrail(), fwdCallback, invCallback);

      }


      // Set State to Visualization
      trail.checkpoint()._setCheckpointCallback(state);

      // Update Current
      trail.currentNode(trail.getChangeById(vid).nodeInMasterTrail());

      // NOTE: If state is loaded using nearest checkpoint followed by sequence of forward and inverse actions,
      // there is a possibility that few sub trails (which does not accounts to changes required to load destination state)
      // will not update their current state. So it will not be possible (at this moment) to recognize exact state of sub trail
      // when destination state loads. (if sequence of inverse and forward action is taken then it is possible to move current state)
      // of sub trail along the way, but directly loading checkpoint could make sub trail update states accurately.
      // FIXME: Temporary solution for this is: reset all sub trails to initial state, go up from loaded state to default state of visualization
      // to see which sub trails were updated.
      if(trail.subTrails().length > 0){

        // Reset Sub trails to initial state
        trail.subTrails().forEach(function(st){
          st.versionTree()._currentNode = st.versionTree().rootNode();
        });

        // Recurse back
        (function recur(node){
          if(node.parentNode()){ recur(node.parentNode()); }
          if(node.data().key !== 'root-node'){
            var change = trail.versionStore()[node.data().key];
            change.trail().versionTree()._currentNode = change.nodeInSubTrail();
          }
        }(trail.currentNode()));

      }

      // Filter Current Branch
      trail._currentBranchVersions = [];

      // Get Parent Thumbnails
      var node = trail.currentNode();
      while (node.childNodes().length > 0) {
        node = node.childNodes()[node.childNodes().length - 1];
      }

      // Get Ancestry of node
      node.getAncestry().reverse().forEach(function(node) {
        //if (node.data().key !== 'root-node') {
        trail._currentBranchVersions.push(node.data().key);
      //}
      });

      // Refresh Gallery
      trail.refreshThumbnailGallery();
    },

    /**
     * Adds comment to UI
     *
     * @name addCommentToUI
     * @memberof Trail
     * @instance
     * @param {@link Change} - A change recorded
     */
    addCommentToUI: function(comment, vid) {

      // Verify Comment
      if(!comment || typeof comment !== 'object' || !comment.hasOwnProperty('id') || !comment.hasOwnProperty('text') || !comment.hasOwnProperty('date'))
      throw new Error('Invalid comment object passed:', comment);

      var trail = this;

      // Verify Version Id
      if(!vid) vid = trail.currentVersion();

      // Clone comment before pusing to UI
      comment = clone(comment);

      // Update comment fields for UI
      comment.dateshort = moment(new Date(comment.date)).calendar();
      comment.vidshort = comment.vid === 'root-node' ? 'initial-state' : '#' + comment.vid.split('-')[0].substring(0, 7);

      // Comment List
      var commentList = d3.select(trail.controlBox()).select('.trails-comment-list');

      // Add comment to info field
      var compiled = _.template("<div class=\"comment-row\" id=\"comment-<%= id %>\">\n  <p class=\"comment-text\">\n    <%= text %>\n  </p>\n  <span class=\"date\" data-date=\"date\"><%= dateshort %></span> | <span class=\"change\" data-id=\"<%= vid %>\"><%= vidshort %></span>\n  <span class=\"delete\">&times</span>\n</div>\n")(comment);
      commentList.node().insertAdjacentHTML('beforeend', compiled);

      // Version Load Click Listener
      commentList.select("#comment-" + comment.id)
        .select('.change')
        .on("click", function(){
          var thiss = this;
          trail.waitFor(function(){
            trail.changeVersion(d3.select(thiss).attr('data-id'));
          });
        });

      // Delete Click Listener
      commentList.select("#comment-" + comment.id)
        .select('.delete').on('click', function(){

          // Remove From Change
          var change = trail.getChangeById(vid);
          change._comments = change.comments().filter(function(c){
            return c.id !== comment.id;
          });

          // Remove From UI
          d3.select(this.parentNode).remove();

        });

    },

    /**
     * Updates a thumbnail
     *
     * @name refreshThumbnailGallery
     * @memberof Trail
     * @instance
     * @param {@link Change} - A change recorded
     */
    refreshThumbnailGallery: function() {

      // Hold This
      var trail = this;

      // Check if controls are rendered
      if (trail.controlBox()) {

        // Get Gallery
        var galleryWrapper = d3.select(trail.controlBox()).select('.trails-thumbnails-container-inner-wrapper');
        var thumbnailGallery = d3.select(trail.controlBox()).selectAll('.trails-thumbnails-gallery');

        // Image Map
        var imageArray = trail._currentBranchVersions.map(function(key) {
          return {
            id: key,
            image: trail.versionStore()[key].thumbnail()
          };
        }).filter(function(d) {
          return d.image !== null;
        });

        // Select All Img
        var allThumbs = thumbnailGallery.selectAll("img")
          .data(imageArray, function(d) {
            return d.id;
          });

        // Tooltip
        var tooltip = d3.select(trail.controlBox()).select('.trails-tooltip');

        // New Image
        allThumbs.enter()
          .append('img')
          .attr('src', function(d) {
            return d.image;
          })
          .attr('id', function(d) {
            return 'thumb-' + d.id;
          })
          .attr('height', 200)
          .attr('class', 'trails-thumbnail')
          .on("click", function(d){
            trail.waitFor(function(){
              trail.changeVersion(d.id);
            });
          });

        // Remove outgoing
        allThumbs.exit().remove();

        // Update Highlighting
        allThumbs.classed('highlight', function(d) {
          return trail.currentNode().data().key === d.id;
        });

        // Append Multiple class
        allThumbs.classed('multiple', function(d) {
          return trail.versionStore()[d.id].nodeInMasterTrail().childNodes().length > 1;
        });

        // Tooltip Show and Hide
        // Movement of tooltip is controlled in 'controls/controlBox'
        allThumbs.on("mouseenter", function(d){

          // Show tooltip
          tooltip.classed("hidden", false);

          // Get Change
          var change = trail.versionStore()[d.id];

          // Remove Old Data
          tooltip.selectAll("p").remove();

          // Date Options
          var dateOptions = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          };

          // Set New Data
          tooltip.append("p").html("<b>Recorded</b>: " + moment(new Date(change.recordedAt())).from(new Date()));
	  if (change.describe()) {
            tooltip.append("p").html("<b>Action</b>: " + change.describe());
	  }
        }).on("mouseout", function(d){
          tooltip.classed("hidden", true);
        });

      }

    },

    /**
     * Loads previous version from trail
     *
     * @name previous
     * @memberof MasterTrail
     * @instance
     */
    previous: function() {

      // Hold `this`
      var trail = this;

      // Get Change in Current Version
      var currentChange = trail.currentChange();

      // If Root Node
      if (currentChange.id() === 'root-node') return;

      // Call Undo on Change
      trail.waitFor(function() {
        if (currentChange.undo()) {
          trail.refreshThumbnailGallery();
        }
      });

    },

    /**
     * Loads next version from trail
     *
     * @name next
     * @memberof MasterTrail
     * @instance
     */
    next: function() {

      // Hold `this`
      var trail = this;

      // Get Current Node
      var currentNode = trail.currentNode();

      // If has child nodes
      if (currentNode.childNodes().length) {

        // Get Index from current version
        var idx = trail.currentBranchVersions().indexOf(currentNode.data().key);

        // If There is a trail ahead of current node already in current branch
        var nextChildVersion = trail.versionStore()[idx < trail.currentBranchVersions().length - 1 ? trail.currentBranchVersions()[idx + 1] : currentNode.childNodes()[currentNode.childNodes().length - 1].key];

        // Forward on current node
        trail.waitFor(function() {
          nextChildVersion.redo();
        });

        // Update Highlighted Thumbnail
        trail.refreshThumbnailGallery();

      }

    },

    /**
     * Opens a gallery view
     *
     * @name openGallery
     * @memberof MasterTrail
     * @instance
     * @param {Boolean} showCheckpoints - whether to show checkpoints or not.
     */
    openGallery: function(showCheckpoints) {
      controls.list.gallery.openGallery(this, showCheckpoints);
    },

    /**
     * Exports a trail
     *
     * @name export
     * @memberof BaseTrail
     * @instance
     */
    export: function() {
      return exporter.export(this);
    },

    /**
     * Saves a JSON representation of trail locally
     *
     * @name saveJSON
     * @memberof BaseTrail
     * @instance
     */
    saveJSON: function() {
      if(typeof window !== 'undefined'){
        var blob = new Blob([JSON.stringify(this.export())], {
          type: "text/json;charset=utf-8"
        }); fileSaver.saveAs(blob, 'trail-' + this.id() + '.json');
      }
    },


    /**
     * Exports a trail
     *
     * @name export
     * @memberof BaseTrail
     * @instance
     */
    exportToGist: function(accessToken, callback) {

      // Export
      var exportable = this.export();

      // Hold `this`
      var trail = this;

      // Prepare Gist Template
      var gistTemplate = {
        "description": "jsTrail exported at: " + new Date().toLocaleTimeString('en-US', {
          weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        }),
        "public": accessToken === null,
        "files": {}
      };

      // Add File
      gistTemplate.files["trail-" + trail.id() + ".json"] = {};
      gistTemplate.files["trail-" + trail.id() + ".json"].content = JSON.stringify(exportable, null, 2);

      // Use d3 xhr to post gist
      var url = accessToken ? "https://api.github.com/gists?access_token=" + accessToken : 'https://api.github.com/gists';
      d3.xhr(url)
        .header("Content-Type", "application/json")
        .post(JSON.stringify(gistTemplate), function(err, data) {
          if (data && data.response) {
            var parsed = JSON.parse(data.response);
            if (parsed && parsed.id) {
              callback(null, parsed);
            } else {
              callback(new Error('Unknown Error'), null);
            }
          } else {
            var msg = trail.githubAccessToken() ? 'Make sure that provided access token is valid.' : 'Unknown Error';
            callback(new Error(msg), null);
          }
        });

    },


    /**
     * Exports a trail
     *
     * @name export
     * @memberof BaseTrail
     * @instance
     */
    import: function(trailData) {
      importer.import(this, trailData);
    },

    /**
     * Pops-up a file selection window to load json from local storage
     *
     * @name loadJSON
     * @memberof BaseTrail
     * @instance
     */
    loadJSON: function() {
      if(typeof window !== 'undefined'){
        d3.select('#trails-' + this.id() + '-control-input').node().click();
      }
    },

    /**
     * Imports data from gist
     *
     * @name importGist
     * @memberof BaseTrail
     * @instance
     */
    importGist: function(gistId, callback){
      if (gistId) {
        gistId = gistId.trim();
        var trail = this;
        getGistData('https://api.github.com/gists/' + gistId, function(err, response) {
          if(err) if(callback && typeof callback === 'function') return callback(err);
          if (response && response.id) {
            var fileName = Object.keys(response.files)[0];
            var content = null;
            if (response.files[fileName].truncated) {
              getGistData(response.files[fileName].raw_url, function(err, _content) {
                if(err) if(callback && typeof callback === 'function') return callback(err);
                content = _content;
                trail.waitFor(function() {
                  trail.import(content);
                }); if(callback && typeof callback === 'function') callback(null, true);
              });
            } else {
              content = JSON.parse(response.files[fileName].content);
              trail.waitFor(function() {
                trail.import(content);
              }); if(callback && typeof callback === 'function') callback(null, true);
            }
          }
        });
      }
    }

  });


  // ------------------------------
  // Private Functions
  // ------------------------------

  function addThumbnailToGallery(trail, change) {

    // Might require some validation or filtration before adding to gallery
    // Be careful on null images

    // Refresh Thumbnails
    trail.refreshThumbnailGallery();

  }

  // Gets the Gist Data
  function getGistData(url, callback) {

    // XMLHTTP
    var xmlhttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");

    // On Ready State Change
    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {
        if (xmlhttp.status == 200) {
          var response = JSON.parse(xmlhttp.responseText);
          callback(null, response);
        } else if (xmlhttp.status == 400) {
          callback(new Error('Status 400'), null);
        } else {
          callback(new Error('Unknown Error'), null);
        }
      }
    };

    // Send Request
    xmlhttp.open("GET", url, true);
    xmlhttp.send();

  }

  // ------------------------------
  // Export
  // ------------------------------

  return Trail;

}());

},{"../action":15,"../change":16,"../checkpoint/checkpointManager":17,"../class":18,"../controls/minimal":24,"../helpers":33,"../navigation/stateManager":37,"../share/exporter":42,"../share/importer":43,"./baseTrail":44,"./subTrail":46,"clone":5,"filesaver.js/FileSaver.min.js":10,"moment":12,"underscore":14}],46:[function(require,module,exports){
var helpers = require('../helpers'),
    BaseTrail = require('./baseTrail'),
    Action = require('../action'),
    Class = require('../class');

/**
 * Sub trail
 * @module trails/subTrail
 */
module.exports = (function() {

  'use strict';

  // ------------------------------
  // Basic Setup
  // ------------------------------

  var SubTrail = Class.extend(BaseTrail, /** @lends Trail */ {

    /**
     * Initializes the class
     *
     * @name initialize
     * @memberof SubTrail
     * @param {String} label - Label that identifies the sub trail
     * @param {@link Trail} masterTrail - to which sub trail belongs
     * @instance
     */
    initialize: function(label, masterTrail) {

      // Initialize Super
      this.super.initialize.call(this);

      // Add Label
      this._label = label;

      // Add master trail
      this._masterTrail = masterTrail;

      // Has Master
      this._hasMaster = true;

      // Events
      this._events = {
        'changeRecorded': [],
        'thumbnailCaptured': [],
      };

    },

    // ------------------------------
    // Getters and Setters
    // ------------------------------

    /**
     * Return a label of sub trail
     *
     * @name label
     * @memberof SubTrail
     * @instance
     * @return {String} - Label
     */
    label: function() {
      return this._label;
    },

    /**
     * Return a master trail
     *
     * @name masterTrail
     * @memberof SubTrail
     * @instance
     * @return {@link Trail} - master trail to which this sub trail belongs
     */
    masterTrail: function() {
      return this._masterTrail;
    },

    /**
     * Return a version store
     *
     * @name versionStore
     * @memberof Trail
     * @instance
     * @return {Array} - array of version ids
     */
    versionStore: function() {
      return this.masterTrail().versionStore();
    },

    // ------------------------------
    // Methods
    // ------------------------------

    /**
     * Records a change
     *
     * @name record
     * @memberof Trail
     * @instance
     * @param {@link Change} - A change recorded
     */
    record: function(action, data, callback, dontClone) {

      if (this.masterTrail().isIdle()) return;

      // Hold `this`
      var thiss = this;

      // Create Change
      // This change is already been added to version store and version tree of current sub trail.
      var change = this.super.record.apply(this, arguments);

      // Add This Change to Master Tree
      // Master Tree has not yet updated
      // this.masterTrail().currentNode() refers to the old node
      this.masterTrail().versionTree().insertToNode(this.masterTrail().currentNode(), {
        key: change.id(),
        trailId: thiss.id(),
      });

      // Add Node
      // Adding node in master could be simplified
      change.nodeInSubTrail(this.currentNode());
      change.nodeInMasterTrail(this.masterTrail().currentNode());

      // Filter Current Branch
      this.masterTrail()._currentBranchVersions = this.masterTrail().currentBranchVersions().filter(function(key) {
        return thiss.versionStore()[key].nodeInMasterTrail().depth() < change.nodeInMasterTrail().depth();
      });

      // Add to Current Branch version
      this.masterTrail()._currentBranchVersions.push(change.id());

      // Fire `changeRecorded` event
      this._events.changeRecorded.forEach(function(cb) {
        cb(change);
      });

      // Return a change
      if (callback) callback(change);

      // Checkpoint
      this.masterTrail().checkpoint().checkSubTree(this.masterTrail().currentNode());

    },

    /**
     * Exports a sub trail
     *
     * @name export
     * @memberof BaseTrail
     * @instance
     */
    export: function() {

      // Hold Trail
      var trail = this;

      return {

        // Trail Setup
        trailId: trail.id(),
        createdAt: trail.createdAt(),
        timezoneOffset: trail.timezoneOffset(),
        attrs: trail.attrs(),

        // Identification
        label: trail.label(),
        masterTrail: trail.masterTrail().id(),

        // Current Version In Sub Trail
        currentVersion: trail.currentVersion(),

        // Version Tree
        versionTree: trail.versionTree().export(function(data) {
          return {
            key: data.key
          };
        }),

      };

    },


  });

  // ------------------------------
  // Export
  // ------------------------------

  return SubTrail;

}());

},{"../action":15,"../class":18,"../helpers":33,"./baseTrail":44}]},{},[1]);
