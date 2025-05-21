// Import all required polyfills here
import 'react-native-get-random-values'; // Required for UUID to work properly

// Add type declaration for global namespace
declare global {
  var Buffer: typeof import('buffer').Buffer;
  var util: typeof import('util');
  interface Global {
    Buffer: typeof import('buffer').Buffer;
    util: typeof import('util');
    [key: string]: any;
  }
}

// Node.js Buffer polyfill
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Node.js util polyfills
import * as util from 'util';
global.util = util;

// isBuffer polyfill (specifically for the error we're encountering)
if (!global.Buffer.isBuffer) {
  global.Buffer.isBuffer = function(obj): obj is Buffer {
    return obj != null && obj.constructor != null && 
      typeof obj.constructor.isBuffer === 'function' && 
      obj.constructor.isBuffer(obj);
  };
}
