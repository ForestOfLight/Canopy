/**
 * @license
 * MIT License
 *
 * Copyright (c) 2024 OmniacDev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { world, system, ScriptEventSource } from '@minecraft/server';
var IPC;
(function (IPC) {
    class Connection {
        *MAYBE_ENCRYPT(args) {
            return this._enc !== false ? yield* CRYPTO.encrypt(JSON.stringify(args), this._enc) : args;
        }
        *MAYBE_DECRYPT(args) {
            return this._enc !== false ? JSON.parse(yield* CRYPTO.decrypt(args[1], this._enc)) : args[1];
        }
        get from() {
            return this._from;
        }
        get to() {
            return this._to;
        }
        constructor(from, to, encryption) {
            this._from = from;
            this._to = to;
            this._enc = encryption;
            this._terminators = new Array();
        }
        terminate(notify = true) {
            const $ = this;
            $._terminators.forEach(terminate => terminate());
            $._terminators.length = 0;
            if (notify) {
                system.runJob(NET.emit('ipc', 'terminate', $._to, [$._from]));
            }
        }
        send(channel, ...args) {
            const $ = this;
            system.runJob((function* () {
                const data = yield* $.MAYBE_ENCRYPT(args);
                yield* NET.emit('ipc', 'send', `${$._to}:${channel}`, [$._from, data]);
            })());
        }
        invoke(channel, ...args) {
            const $ = this;
            system.runJob((function* () {
                const data = yield* $.MAYBE_ENCRYPT(args);
                yield* NET.emit('ipc', 'invoke', `${$._to}:${channel}`, [$._from, data]);
            })());
            return new Promise(resolve => {
                const terminate = NET.listen('ipc', 'handle', `${$._from}:${channel}`, function* (args) {
                    if (args[0] === $._to) {
                        const data = yield* $.MAYBE_DECRYPT(args);
                        resolve(data);
                        terminate();
                    }
                });
            });
        }
        on(channel, listener) {
            const $ = this;
            const terminate = NET.listen('ipc', 'send', `${$._from}:${channel}`, function* (args) {
                if (args[0] === $._to) {
                    const data = yield* $.MAYBE_DECRYPT(args);
                    listener(...data);
                }
            });
            $._terminators.push(terminate);
            return terminate;
        }
        once(channel, listener) {
            const $ = this;
            const terminate = NET.listen('ipc', 'send', `${$._from}:${channel}`, function* (args) {
                if (args[0] === $._to) {
                    const data = yield* $.MAYBE_DECRYPT(args);
                    listener(...data);
                    terminate();
                }
            });
            $._terminators.push(terminate);
            return terminate;
        }
        handle(channel, listener) {
            const $ = this;
            const terminate = NET.listen('ipc', 'invoke', `${$._from}:${channel}`, function* (args) {
                if (args[0] === $._to) {
                    const data = yield* $.MAYBE_DECRYPT(args);
                    const result = listener(...data);
                    const return_data = yield* $.MAYBE_ENCRYPT(result);
                    yield* NET.emit('ipc', 'handle', `${$._to}:${channel}`, [$._from, return_data]);
                }
            });
            $._terminators.push(terminate);
            return terminate;
        }
    }
    IPC.Connection = Connection;
    class ConnectionManager {
        *MAYBE_ENCRYPT(args, encryption) {
            return encryption !== false ? yield* CRYPTO.encrypt(JSON.stringify(args), encryption) : args;
        }
        *MAYBE_DECRYPT(args, encryption) {
            return encryption !== false ? JSON.parse(yield* CRYPTO.decrypt(args[1], encryption)) : args[1];
        }
        get id() {
            return this._id;
        }
        constructor(id, force_encryption = false) {
            const $ = this;
            this._id = id;
            this._enc_map = new Map();
            this._con_map = new Map();
            this._enc_force = force_encryption;
            NET.listen('ipc', 'handshake', `${this._id}:SYN`, function* (args) {
                const secret = CRYPTO.make_secret(args[4]);
                const public_key = yield* CRYPTO.make_public(secret, args[4], args[3]);
                const enc = args[1] === 1 || $._enc_force ? yield* CRYPTO.make_shared(secret, args[2], args[3]) : false;
                $._enc_map.set(args[0], enc);
                yield* NET.emit('ipc', 'handshake', `${args[0]}:ACK`, [$._id, $._enc_force ? 1 : 0, public_key]);
            });
            NET.listen('ipc', 'terminate', this._id, function* (args) {
                $._enc_map.delete(args[0]);
            });
        }
        connect(to, encrypted = false, timeout = 20) {
            const $ = this;
            return new Promise((resolve, reject) => {
                const con = this._con_map.get(to);
                if (con !== undefined) {
                    con.terminate(false);
                    resolve(con);
                }
                else {
                    const secret = CRYPTO.make_secret();
                    const enc_flag = encrypted ? 1 : 0;
                    system.runJob((function* () {
                        const public_key = yield* CRYPTO.make_public(secret);
                        yield* NET.emit('ipc', 'handshake', `${to}:SYN`, [$._id, enc_flag, public_key, CRYPTO.PRIME, CRYPTO.MOD]);
                    })());
                    function clear() {
                        terminate();
                        system.clearRun(timeout_handle);
                    }
                    const timeout_handle = system.runTimeout(() => {
                        reject();
                        clear();
                    }, timeout);
                    const terminate = NET.listen('ipc', 'handshake', `${this._id}:ACK`, function* (args) {
                        if (args[0] === to) {
                            const enc = args[1] === 1 || encrypted ? yield* CRYPTO.make_shared(secret, args[2]) : false;
                            const new_con = new Connection($._id, to, enc);
                            $._con_map.set(to, new_con);
                            resolve(new_con);
                            clear();
                        }
                    });
                }
            });
        }
        send(channel, ...args) {
            const $ = this;
            system.runJob((function* () {
                for (const [key, value] of $._enc_map) {
                    const data = yield* $.MAYBE_ENCRYPT(args, value);
                    yield* NET.emit('ipc', 'send', `${key}:${channel}`, [$._id, data]);
                }
            })());
        }
        invoke(channel, ...args) {
            const $ = this;
            const promises = [];
            for (const [key, value] of $._enc_map) {
                system.runJob((function* () {
                    const data = yield* $.MAYBE_ENCRYPT(args, value);
                    yield* NET.emit('ipc', 'invoke', `${key}:${channel}`, [$._id, data]);
                })());
                promises.push(new Promise(resolve => {
                    const terminate = NET.listen('ipc', 'handle', `${$._id}:${channel}`, function* (args) {
                        if (args[0] === key) {
                            const data = yield* $.MAYBE_DECRYPT(args, value);
                            resolve(data);
                            terminate();
                        }
                    });
                }));
            }
            return promises;
        }
        on(channel, listener) {
            const $ = this;
            return NET.listen('ipc', 'send', `${$._id}:${channel}`, function* (args) {
                const enc = $._enc_map.get(args[0]);
                if (enc !== undefined) {
                    const data = yield* $.MAYBE_DECRYPT(args, enc);
                    listener(...data);
                }
            });
        }
        once(channel, listener) {
            const $ = this;
            const terminate = NET.listen('ipc', 'send', `${$._id}:${channel}`, function* (args) {
                const enc = $._enc_map.get(args[0]);
                if (enc !== undefined) {
                    const data = yield* $.MAYBE_DECRYPT(args, enc);
                    listener(...data);
                    terminate();
                }
            });
            return terminate;
        }
        handle(channel, listener) {
            const $ = this;
            return NET.listen('ipc', 'invoke', `${$._id}:${channel}`, function* (args) {
                const enc = $._enc_map.get(args[0]);
                if (enc !== undefined) {
                    const data = yield* $.MAYBE_DECRYPT(args, enc);
                    const result = listener(...data);
                    const return_data = yield* $.MAYBE_ENCRYPT(result, enc);
                    yield* NET.emit('ipc', 'handle', `${args[0]}:${channel}`, [$._id, return_data]);
                }
            });
        }
    }
    IPC.ConnectionManager = ConnectionManager;
    /** Sends a message with `args` to `channel` */
    function send(channel, ...args) {
        system.runJob(NET.emit('ipc', 'send', channel, args));
    }
    IPC.send = send;
    /** Sends an `invoke` message through IPC, and expects a result asynchronously. */
    function invoke(channel, ...args) {
        system.runJob(NET.emit('ipc', 'invoke', channel, args));
        return new Promise(resolve => {
            const terminate = NET.listen('ipc', 'handle', channel, function* (args) {
                resolve(args[0]);
                terminate();
            });
        });
    }
    IPC.invoke = invoke;
    /** Listens to `channel`. When a new message arrives, `listener` will be called with `listener(args)`. */
    function on(channel, listener) {
        return NET.listen('ipc', 'send', channel, function* (args) {
            listener(...args);
        });
    }
    IPC.on = on;
    /** Listens to `channel` once. When a new message arrives, `listener` will be called with `listener(args)`, and then removed. */
    function once(channel, listener) {
        const terminate = NET.listen('ipc', 'send', channel, function* (args) {
            listener(...args);
            terminate();
        });
        return terminate;
    }
    IPC.once = once;
    /** Adds a handler for an `invoke` IPC. This handler will be called whenever `invoke(channel, ...args)` is called */
    function handle(channel, listener) {
        return NET.listen('ipc', 'invoke', channel, function* (args) {
            const result = listener(...args);
            yield* NET.emit('ipc', 'handle', channel, [result]);
        });
    }
    IPC.handle = handle;
})(IPC || (IPC = {}));
export default IPC;
var SERDE;
(function (SERDE) {
    const INVALID_START_CODES = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57];
    const INVALID_CODES = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
        31, 32, 33, 34, 35, 36, 37, 38, 39, 42, 43, 44, 47, 58, 59, 60, 61, 62, 63, 64, 91, 92, 93, 94, 96, 123, 124, 125,
        126, 127
    ];
    const sequence_regex = /\?[0-9a-zA-Z.\-]{2}|[^?]+/g;
    const encoded_regex = /^\?[0-9a-zA-Z.\-]{2}$/;
    const BASE64 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-';
    function* b64_encode(char) {
        let encoded = '';
        for (let code = char.charCodeAt(0); code > 0; code = Math.floor(code / 64)) {
            encoded = BASE64[code % 64] + encoded;
            yield;
        }
        return encoded;
    }
    function* b64_decode(enc) {
        let code = 0;
        for (let i = 0; i < enc.length; i++) {
            code += 64 ** (enc.length - 1 - i) * BASE64.indexOf(enc[i]);
            yield;
        }
        return String.fromCharCode(code);
    }
    function* encode(str) {
        let result = '';
        for (let i = 0; i < str.length; i++) {
            const char = str.charAt(i);
            const char_code = char.charCodeAt(0);
            if ((i === 0 && INVALID_START_CODES.includes(char_code)) || INVALID_CODES.includes(char_code)) {
                result += `?${(yield* b64_encode(char)).padStart(2, '0')}`;
            }
            else {
                result += char;
            }
            yield;
        }
        return result;
    }
    SERDE.encode = encode;
    function* decode(str) {
        let result = '';
        const seqs = str.match(sequence_regex) ?? [];
        for (let i = 0; i < seqs.length; i++) {
            const seq = seqs[i];
            if (seq.startsWith('?') && encoded_regex.test(seq))
                result += yield* b64_decode(seq.slice(1));
            else {
                result += seq;
            }
            yield;
        }
        return result;
    }
    SERDE.decode = decode;
})(SERDE || (SERDE = {}));
var CRYPTO;
(function (CRYPTO) {
    CRYPTO.PRIME = 19893121;
    CRYPTO.MOD = 341;
    const to_HEX = (n) => n.toString(16).toUpperCase();
    const to_NUM = (h) => parseInt(h, 16);
    function* mod_exp(base, exp, mod) {
        let result = 1;
        let b = base % mod;
        for (let e = exp; e > 0; e = Math.floor(e / 2)) {
            if (e % 2 === 1) {
                result = (result * b) % mod;
            }
            b = (b * b) % mod;
            yield;
        }
        return result;
    }
    function make_secret(mod = CRYPTO.MOD) {
        return Math.floor(Math.random() * (mod - 1)) + 1;
    }
    CRYPTO.make_secret = make_secret;
    function* make_public(secret, mod = CRYPTO.MOD, prime = CRYPTO.PRIME) {
        return to_HEX(yield* mod_exp(mod, secret, prime));
    }
    CRYPTO.make_public = make_public;
    function* make_shared(secret, other, prime = CRYPTO.PRIME) {
        return to_HEX(yield* mod_exp(to_NUM(other), secret, prime));
    }
    CRYPTO.make_shared = make_shared;
    function* encrypt(raw, key) {
        let encrypted = '';
        for (let i = 0; i < raw.length; i++) {
            encrypted += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            yield;
        }
        return encrypted;
    }
    CRYPTO.encrypt = encrypt;
    function* decrypt(encrypted, key) {
        let decrypted = '';
        for (let i = 0; i < encrypted.length; i++) {
            decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            yield;
        }
        return decrypted;
    }
    CRYPTO.decrypt = decrypt;
})(CRYPTO || (CRYPTO = {}));
export var NET;
(function (NET) {
    const FRAG_MAX = 2048;
    const namespace_listeners = new Map();
    system.afterEvents.scriptEventReceive.subscribe(event => {
        system.runJob((function* () {
            const ids = event.id.split(':');
            const namespace = yield* SERDE.decode(ids[0]);
            const listeners = namespace_listeners.get(namespace);
            if (event.sourceType === ScriptEventSource.Server && listeners) {
                const payload = Payload.fromString(yield* SERDE.decode(ids[1]));
                for (let i = 0; i < listeners.length; i++) {
                    yield* listeners[i](payload, event.message);
                }
            }
        })());
    });
    function create_listener(namespace, listener) {
        let listeners = namespace_listeners.get(namespace);
        if (!listeners) {
            listeners = new Array();
            namespace_listeners.set(namespace, listeners);
        }
        listeners.push(listener);
        return () => {
            const idx = listeners.indexOf(listener);
            if (idx !== -1)
                listeners.splice(idx, 1);
            if (listeners.length === 0) {
                namespace_listeners.delete(namespace);
            }
        };
    }
    let Payload;
    (function (Payload) {
        function toString(p) {
            return JSON.stringify(p);
        }
        Payload.toString = toString;
        function fromString(s) {
            return JSON.parse(s);
        }
        Payload.fromString = fromString;
    })(Payload || (Payload = {}));
    function generate_id() {
        const r = (Math.random() * 0x100000000) >>> 0;
        return ((r & 0xff).toString(16).padStart(2, '0') +
            ((r >> 8) & 0xff).toString(16).padStart(2, '0') +
            ((r >> 16) & 0xff).toString(16).padStart(2, '0') +
            ((r >> 24) & 0xff).toString(16).padStart(2, '0')).toUpperCase();
    }
    function* emit(namespace, event, channel, args) {
        const id = generate_id();
        const enc_namespace = yield* SERDE.encode(namespace);
        const enc_args_str = yield* SERDE.encode(JSON.stringify(args));
        const RUN = function* (payload, data_str) {
            const enc_payload = yield* SERDE.encode(Payload.toString(payload));
            world.getDimension('overworld').runCommand(`scriptevent ${enc_namespace}:${enc_payload} ${data_str}`);
        };
        let len = 0;
        let str = '';
        let str_size = 0;
        for (let i = 0; i < enc_args_str.length; i++) {
            const char = enc_args_str[i];
            const code = char.charCodeAt(0);
            const char_size = code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
            if (str_size + char_size < FRAG_MAX) {
                str += char;
                str_size += char_size;
            }
            else {
                yield* RUN([event, channel, id, len], str);
                len++;
                str = char;
                str_size = char_size;
            }
            yield;
        }
        yield* RUN(len === 0 ? [event, channel, id] : [event, channel, id, len, 1], str);
    }
    NET.emit = emit;
    function listen(namespace, event, channel, callback) {
        const buffer = new Map();
        const listener = function* ([p_event, p_channel, p_id, p_index, p_final], data) {
            if (p_event === event && p_channel === channel) {
                if (p_index === undefined) {
                    yield* callback(JSON.parse(yield* SERDE.decode(data)));
                }
                else {
                    let fragment = buffer.get(p_id);
                    if (!fragment) {
                        fragment = { size: -1, data_strs: [], data_size: 0 };
                        buffer.set(p_id, fragment);
                    }
                    if (p_final === 1)
                        fragment.size = p_index + 1;
                    fragment.data_strs[p_index] = data;
                    fragment.data_size += p_index + 1;
                    if (fragment.size !== -1 && fragment.data_size === (fragment.size * (fragment.size + 1)) / 2) {
                        let full_str = '';
                        for (let i = 0; i < fragment.data_strs.length; i++) {
                            full_str += fragment.data_strs[i];
                            yield;
                        }
                        yield* callback(JSON.parse(yield* SERDE.decode(full_str)));
                        buffer.delete(p_id);
                    }
                }
            }
        };
        return create_listener(namespace, listener);
    }
    NET.listen = listen;
})(NET || (NET = {}));
