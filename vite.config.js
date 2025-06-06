import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ...(process.env.NODE_ENV !== 'production' ? [visualizer({ open: true, gzipSize: true, brotliSize: true })] : [])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    // Complete process object with all required properties
    process: `(function() {
      const processObj = {
         _events: {},
         listenerCount(type) {
           return this._events[type] ? this._events[type].length : 0;
         },
         on(type, listener) {
           if (!this._events[type]) this._events[type] = [];
           this._events[type].push(listener);
           return this;
         },
         emit(type, ...args) {
           if (this._events[type]) {
             this._events[type].forEach(fn => fn.apply(this, args));
             return true;
           }
           return false;
         },
         removeListener(type, listener) {
           if (this._events[type]) {
             this._events[type] = this._events[type].filter(fn => fn !== listener);
           }
           return this;
         }
       };
      
      Object.assign(processObj, {
        version: '${process.version || 'v18.0.0'}',
        platform: 'browser',
        arch: 'x64',
        env: {},
        nextTick: (fn, ...args) => Promise.resolve().then(() => fn(...args)),
        stdout: { write: () => {}, on: () => {} },
        stderr: { write: () => {}, on: () => {} },
        stdin: { on: () => {}, setRawMode: () => {} },
        exit: () => {},
        cwd: () => "/",
        chdir: () => {},
        umask: () => 0,
        getuid: () => 1000,
        getgid: () => 1000,
        hrtime: () => [0, 0],
        uptime: () => 0,
        memoryUsage: () => ({ rss: 0, heapTotal: 0, heapUsed: 0, external: 0 }),
        cpuUsage: () => ({ user: 0, system: 0 }),
        binding: () => {},
        _linkedBinding: () => {},
        dlopen: () => {},
        _eventsCount: 0,
        _maxListeners: undefined,
        listenerCount(type) {
           if (!this._events || !this._events[type]) return 0;
           return this._events[type].length;
         }
      });
      
      return processObj;
    })()`,
    global: 'globalThis',
    // Node.js module polyfills with complete implementations
    'util': `({
      inherits: (ctor, superCtor) => {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: { value: ctor, enumerable: false, writable: true, configurable: true }
        });
      },
      inspect: (obj) => JSON.stringify(obj),
      isDate: (obj) => obj instanceof Date,
      format: (f, ...args) => f.replace(/%[sdj%]/g, (x) => args.shift())
    })`,
    'buffer': `({
      Buffer: typeof Buffer !== "undefined" ? Buffer : class Buffer {
        static alloc(size) { return new Uint8Array(size); }
        static from(data) { return new Uint8Array(data); }
        static isBuffer(obj) { return obj instanceof Uint8Array; }
      }
    })`,
    'events': `({
      EventEmitter: class EventEmitter {
        constructor() {
          this._events = {};
          this._maxListeners = 10;
        }
        on(event, listener) {
          if (!this._events[event]) this._events[event] = [];
          this._events[event].push(listener);
          return this;
        }
        emit(event, ...args) {
          if (this._events[event]) {
            this._events[event].forEach(listener => listener(...args));
            return true;
          }
          return false;
        }
        removeListener(event, listener) {
          if (this._events[event]) {
            this._events[event] = this._events[event].filter(l => l !== listener);
          }
          return this;
        }
        listenerCount(event) {
          return this._events[event] ? this._events[event].length : 0;
        }
        once(event, listener) {
          const onceWrapper = (...args) => {
            this.removeListener(event, onceWrapper);
            listener(...args);
          };
          this.on(event, onceWrapper);
          return this;
        }
        removeAllListeners(event) {
          if (event) {
            delete this._events[event];
          } else {
            this._events = {};
          }
          return this;
        }
      }
    })`,
    'stream': `({
      Readable: class Readable {
        constructor() {
          this._readableState = { flowing: false };
          this._events = {};
        }
        pipe() { return this; }
        on() { return this; }
        emit() { return false; }
        listenerCount() { return 0; }
      },
      Writable: class Writable {
        constructor() {
          this._writableState = {};
          this._events = {};
        }
        write() { return true; }
        end() { return this; }
        on() { return this; }
        emit() { return false; }
        listenerCount() { return 0; }
      },
      Transform: class Transform {
        constructor() {
          this._transformState = {};
          this._events = {};
        }
        pipe() { return this; }
        on() { return this; }
        emit() { return false; }
        listenerCount() { return 0; }
      }
    })`,
    'net': `({
      Socket: class Socket {
        constructor() {
          this._events = {};
        }
        connect() { return this; }
        write() { return true; }
        end() { return this; }
        on() { return this; }
        emit() { return false; }
        listenerCount() { return 0; }
      }
    })`
  }
})