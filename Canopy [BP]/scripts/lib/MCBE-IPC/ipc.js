/**
 * @license
 * MIT License
 *
 * Copyright (c) 2025 OmniacDev
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
import { ScriptEventSource, system, world } from '@minecraft/server';
export var PROTO;
(function (PROTO) {
    class ByteQueue {
        get end() {
            return this._length + this._offset;
        }
        get front() {
            return this._offset;
        }
        get data_view() {
            return this._data_view;
        }
        constructor(size = 256) {
            this._buffer = new Uint8Array(size);
            this._data_view = new DataView(this._buffer.buffer);
            this._length = 0;
            this._offset = 0;
        }
        write(...values) {
            this.ensure_capacity(values.length);
            this._buffer.set(values, this.end);
            this._length += values.length;
        }
        read(amount = 1) {
            if (this._length > 0) {
                const max_amount = amount > this._length ? this._length : amount;
                const values = this._buffer.subarray(this._offset, this._offset + max_amount);
                this._length -= max_amount;
                this._offset += max_amount;
                return globalThis.Array.from(values);
            }
            return [];
        }
        ensure_capacity(size) {
            if (this.end + size > this._buffer.length) {
                const larger_buffer = new Uint8Array((this.end + size) * 2);
                larger_buffer.set(this._buffer.subarray(this._offset, this.end), 0);
                this._buffer = larger_buffer;
                this._offset = 0;
                this._data_view = new DataView(this._buffer.buffer);
            }
        }
        static from_uint8array(array) {
            const byte_queue = new ByteQueue();
            byte_queue._buffer = array;
            byte_queue._length = array.length;
            byte_queue._offset = 0;
            byte_queue._data_view = new DataView(array.buffer);
            return byte_queue;
        }
        to_uint8array() {
            return this._buffer.subarray(this._offset, this.end);
        }
    }
    PROTO.ByteQueue = ByteQueue;
    let MIPS;
    (function (MIPS) {
        function* serialize(byte_queue) {
            const uint8array = byte_queue.to_uint8array();
            let str = '(0x';
            for (let i = 0; i < uint8array.length; i++) {
                const hex = uint8array[i].toString(16).padStart(2, '0').toUpperCase();
                str += hex;
                yield;
            }
            str += ')';
            return str;
        }
        MIPS.serialize = serialize;
        function* deserialize(str) {
            if (str.startsWith('(0x') && str.endsWith(')')) {
                const result = [];
                const hex_str = str.slice(3, str.length - 1);
                for (let i = 0; i < hex_str.length; i++) {
                    const hex = hex_str[i] + hex_str[++i];
                    result.push(parseInt(hex, 16));
                    yield;
                }
                return ByteQueue.from_uint8array(new Uint8Array(result));
            }
            return new ByteQueue();
        }
        MIPS.deserialize = deserialize;
    })(MIPS = PROTO.MIPS || (PROTO.MIPS = {}));
    PROTO.Void = {
        *serialize() { },
        *deserialize() { }
    };
    PROTO.Null = {
        *serialize() { },
        *deserialize() {
            return null;
        }
    };
    PROTO.Undefined = {
        *serialize() { },
        *deserialize() {
            return undefined;
        }
    };
    PROTO.Int8 = {
        *serialize(value, stream) {
            const length = 1;
            stream.write(...globalThis.Array(length).fill(0));
            stream.data_view.setInt8(stream.end - length, value);
        },
        *deserialize(stream) {
            const value = stream.data_view.getInt8(stream.front);
            stream.read(1);
            return value;
        }
    };
    PROTO.Int16 = {
        *serialize(value, stream) {
            const length = 2;
            stream.write(...globalThis.Array(length).fill(0));
            stream.data_view.setInt16(stream.end - length, value);
        },
        *deserialize(stream) {
            const value = stream.data_view.getInt16(stream.front);
            stream.read(2);
            return value;
        }
    };
    PROTO.Int32 = {
        *serialize(value, stream) {
            const length = 4;
            stream.write(...globalThis.Array(length).fill(0));
            stream.data_view.setInt32(stream.end - length, value);
        },
        *deserialize(stream) {
            const value = stream.data_view.getInt32(stream.front);
            stream.read(4);
            return value;
        }
    };
    PROTO.UInt8 = {
        *serialize(value, stream) {
            const length = 1;
            stream.write(...globalThis.Array(length).fill(0));
            stream.data_view.setUint8(stream.end - length, value);
        },
        *deserialize(stream) {
            const value = stream.data_view.getUint8(stream.front);
            stream.read(1);
            return value;
        }
    };
    PROTO.UInt16 = {
        *serialize(value, stream) {
            const length = 2;
            stream.write(...globalThis.Array(length).fill(0));
            stream.data_view.setUint16(stream.end - length, value);
        },
        *deserialize(stream) {
            const value = stream.data_view.getUint16(stream.front);
            stream.read(2);
            return value;
        }
    };
    PROTO.UInt32 = {
        *serialize(value, stream) {
            const length = 4;
            stream.write(...globalThis.Array(length).fill(0));
            stream.data_view.setUint32(stream.end - length, value);
        },
        *deserialize(stream) {
            const value = stream.data_view.getUint32(stream.front);
            stream.read(4);
            return value;
        }
    };
    PROTO.UVarInt32 = {
        *serialize(value, stream) {
            while (value >= 0x80) {
                stream.write((value & 0x7f) | 0x80);
                value >>= 7;
                yield;
            }
            stream.write(value);
        },
        *deserialize(stream) {
            let value = 0;
            let size = 0;
            let byte;
            do {
                byte = stream.read()[0];
                value |= (byte & 0x7f) << (size * 7);
                size += 1;
                yield;
            } while ((byte & 0x80) !== 0 && size < 10);
            return value;
        }
    };
    PROTO.Float32 = {
        *serialize(value, stream) {
            const length = 4;
            stream.write(...globalThis.Array(length).fill(0));
            stream.data_view.setFloat32(stream.end - length, value);
        },
        *deserialize(stream) {
            const value = stream.data_view.getFloat32(stream.front);
            stream.read(4);
            return value;
        }
    };
    PROTO.Float64 = {
        *serialize(value, stream) {
            const length = 8;
            stream.write(...globalThis.Array(length).fill(0));
            stream.data_view.setFloat64(stream.end - length, value);
        },
        *deserialize(stream) {
            const value = stream.data_view.getFloat64(stream.front);
            stream.read(8);
            return value;
        }
    };
    PROTO.String = {
        *serialize(value, stream) {
            yield* PROTO.UVarInt32.serialize(value.length, stream);
            for (let i = 0; i < value.length; i++) {
                const code = value.charCodeAt(i);
                yield* PROTO.UVarInt32.serialize(code, stream);
            }
        },
        *deserialize(stream) {
            const length = yield* PROTO.UVarInt32.deserialize(stream);
            let value = '';
            for (let i = 0; i < length; i++) {
                const code = yield* PROTO.UVarInt32.deserialize(stream);
                value += globalThis.String.fromCharCode(code);
            }
            return value;
        }
    };
    PROTO.Boolean = {
        *serialize(value, stream) {
            stream.write(value ? 1 : 0);
        },
        *deserialize(stream) {
            const value = stream.read()[0];
            return value === 1;
        }
    };
    PROTO.UInt8Array = {
        *serialize(value, stream) {
            yield* PROTO.UVarInt32.serialize(value.length, stream);
            stream.write(...value);
        },
        *deserialize(stream) {
            const length = yield* PROTO.UVarInt32.deserialize(stream);
            return new Uint8Array(stream.read(length));
        }
    };
    PROTO.Date = {
        *serialize(value, stream) {
            yield* PROTO.Float64.serialize(value.getTime(), stream);
        },
        *deserialize(stream) {
            return new globalThis.Date(yield* PROTO.Float64.deserialize(stream));
        }
    };
    function Object(obj) {
        return {
            *serialize(value, stream) {
                for (const key in obj) {
                    yield* obj[key].serialize(value[key], stream);
                }
            },
            *deserialize(stream) {
                const result = {};
                for (const key in obj) {
                    result[key] = yield* obj[key].deserialize(stream);
                }
                return result;
            }
        };
    }
    PROTO.Object = Object;
    function Array(value) {
        return {
            *serialize(array, stream) {
                const actualValue = typeof value === 'function' ? value() : value;
                yield* PROTO.UVarInt32.serialize(array.length, stream);
                for (const item of array) {
                    yield* actualValue.serialize(item, stream);
                }
            },
            *deserialize(stream) {
                const actualValue = typeof value === 'function' ? value() : value;
                const result = [];
                const length = yield* PROTO.UVarInt32.deserialize(stream);
                for (let i = 0; i < length; i++) {
                    result[i] = yield* actualValue.deserialize(stream);
                }
                return result;
            }
        };
    }
    PROTO.Array = Array;
    function Tuple(...values) {
        return {
            *serialize(tuple, stream) {
                for (let i = 0; i < values.length; i++) {
                    yield* values[i].serialize(tuple[i], stream);
                }
            },
            *deserialize(stream) {
                const result = [];
                for (let i = 0; i < values.length; i++) {
                    result[i] = yield* values[i].deserialize(stream);
                }
                return result;
            }
        };
    }
    PROTO.Tuple = Tuple;
    function Optional(value) {
        return {
            *serialize(optional, stream) {
                yield* PROTO.Boolean.serialize(optional !== undefined, stream);
                if (optional !== undefined) {
                    yield* value.serialize(optional, stream);
                }
            },
            *deserialize(stream) {
                const defined = yield* PROTO.Boolean.deserialize(stream);
                if (defined) {
                    return yield* value.deserialize(stream);
                }
                return undefined;
            }
        };
    }
    PROTO.Optional = Optional;
    function Map(key, value) {
        return {
            *serialize(map, stream) {
                yield* PROTO.UVarInt32.serialize(map.size, stream);
                for (const [k, v] of map.entries()) {
                    yield* key.serialize(k, stream);
                    yield* value.serialize(v, stream);
                }
            },
            *deserialize(stream) {
                const size = yield* PROTO.UVarInt32.deserialize(stream);
                const result = new globalThis.Map();
                for (let i = 0; i < size; i++) {
                    const k = yield* key.deserialize(stream);
                    const v = yield* value.deserialize(stream);
                    result.set(k, v);
                }
                return result;
            }
        };
    }
    PROTO.Map = Map;
    function Set(value) {
        return {
            *serialize(set, stream) {
                yield* PROTO.UVarInt32.serialize(set.size, stream);
                for (const [_, v] of set.entries()) {
                    yield* value.serialize(v, stream);
                }
            },
            *deserialize(stream) {
                const size = yield* PROTO.UVarInt32.deserialize(stream);
                const result = new globalThis.Set();
                for (let i = 0; i < size; i++) {
                    const v = yield* value.deserialize(stream);
                    result.add(v);
                }
                return result;
            }
        };
    }
    PROTO.Set = Set;
    PROTO.Endpoint = PROTO.String;
    PROTO.Header = PROTO.Object({
        guid: PROTO.String,
        encoding: PROTO.String,
        index: PROTO.UVarInt32,
        final: PROTO.Boolean
    });
})(PROTO || (PROTO = {}));
export var NET;
(function (NET) {
    const FRAG_MAX = 2048;
    const ENCODING = 'mcbe-ipc:v3';
    const ENDPOINTS = new Map();
    function* serialize(byte_queue, max_size = Infinity) {
        const uint8array = byte_queue.to_uint8array();
        const result = [];
        let acc_str = '';
        let acc_size = 0;
        for (let i = 0; i < uint8array.length; i++) {
            const char_code = uint8array[i] | (uint8array[++i] << 8);
            const utf16_size = char_code <= 0x7f ? 1 : char_code <= 0x7ff ? 2 : char_code <= 0xffff ? 3 : 4;
            const char_size = char_code > 0xff ? utf16_size : 2;
            if (acc_size + char_size > max_size) {
                result.push(acc_str);
                acc_str = '';
                acc_size = 0;
            }
            if (char_code > 0xff) {
                acc_str += String.fromCharCode(char_code);
                acc_size += utf16_size;
            }
            else {
                acc_str += char_code.toString(16).padStart(2, '0').toUpperCase();
                acc_size += 2;
            }
            yield;
        }
        result.push(acc_str);
        return result;
    }
    NET.serialize = serialize;
    function* deserialize(strings) {
        const result = [];
        for (let i = 0; i < strings.length; i++) {
            const str = strings[i];
            for (let j = 0; j < str.length; j++) {
                const char_code = str.charCodeAt(j);
                if (char_code <= 0xff) {
                    const hex = str[j] + str[++j];
                    const hex_code = parseInt(hex, 16);
                    result.push(hex_code & 0xff);
                    result.push(hex_code >> 8);
                }
                else {
                    result.push(char_code & 0xff);
                    result.push(char_code >> 8);
                }
                yield;
            }
            yield;
        }
        return PROTO.ByteQueue.from_uint8array(new Uint8Array(result));
    }
    NET.deserialize = deserialize;
    system.afterEvents.scriptEventReceive.subscribe(event => {
        system.runJob((function* () {
            const [serialized_endpoint, serialized_header] = event.id.split(':');
            const endpoint_stream = yield* PROTO.MIPS.deserialize(serialized_endpoint);
            const endpoint = yield* PROTO.Endpoint.deserialize(endpoint_stream);
            const listeners = ENDPOINTS.get(endpoint);
            if (event.sourceType === ScriptEventSource.Server && listeners) {
                const header_stream = yield* PROTO.MIPS.deserialize(serialized_header);
                const header = yield* PROTO.Header.deserialize(header_stream);
                for (let i = 0; i < listeners.length; i++) {
                    yield* listeners[i](header, event.message);
                }
            }
        })());
    });
    function create_listener(endpoint, listener) {
        let listeners = ENDPOINTS.get(endpoint);
        if (!listeners) {
            listeners = new Array();
            ENDPOINTS.set(endpoint, listeners);
        }
        listeners.push(listener);
        return () => {
            const idx = listeners.indexOf(listener);
            if (idx !== -1)
                listeners.splice(idx, 1);
            if (listeners.length === 0) {
                ENDPOINTS.delete(endpoint);
            }
        };
    }
    function generate_id() {
        const r = (Math.random() * 0x100000000) >>> 0;
        return ((r & 0xff).toString(16).padStart(2, '0') +
            ((r >> 8) & 0xff).toString(16).padStart(2, '0') +
            ((r >> 16) & 0xff).toString(16).padStart(2, '0') +
            ((r >> 24) & 0xff).toString(16).padStart(2, '0')).toUpperCase();
    }
    function* emit(endpoint, serializer, value) {
        const guid = generate_id();
        const endpoint_stream = new PROTO.ByteQueue();
        yield* PROTO.Endpoint.serialize(endpoint, endpoint_stream);
        const serialized_endpoint = yield* PROTO.MIPS.serialize(endpoint_stream);
        const RUN = function* (header, serialized_packet) {
            const header_stream = new PROTO.ByteQueue();
            yield* PROTO.Header.serialize(header, header_stream);
            const serialized_header = yield* PROTO.MIPS.serialize(header_stream);
            world
                .getDimension('overworld')
                .runCommand(`scriptevent ${serialized_endpoint}:${serialized_header} ${serialized_packet}`);
        };
        const packet_stream = new PROTO.ByteQueue();
        yield* serializer.serialize(value, packet_stream);
        const serialized_packets = yield* serialize(packet_stream, FRAG_MAX);
        for (let i = 0; i < serialized_packets.length; i++) {
            const serialized_packet = serialized_packets[i];
            yield* RUN({ guid, encoding: ENCODING, index: i, final: i === serialized_packets.length - 1 }, serialized_packet);
        }
    }
    NET.emit = emit;
    function listen(endpoint, serializer, callback) {
        const buffer = new Map();
        const listener = function* (payload, serialized_packet) {
            let fragment = buffer.get(payload.guid);
            if (!fragment) {
                fragment = { size: -1, serialized_packets: [], data_size: 0 };
                buffer.set(payload.guid, fragment);
            }
            if (payload.final) {
                fragment.size = payload.index + 1;
            }
            fragment.serialized_packets[payload.index] = serialized_packet;
            fragment.data_size += payload.index + 1;
            if (fragment.size !== -1 && fragment.data_size === (fragment.size * (fragment.size + 1)) / 2) {
                const stream = yield* deserialize(fragment.serialized_packets);
                const value = yield* serializer.deserialize(stream);
                yield* callback(value);
                buffer.delete(payload.guid);
            }
        };
        return create_listener(endpoint, listener);
    }
    NET.listen = listen;
})(NET || (NET = {}));
export var IPC;
(function (IPC) {
    /** Sends a message with `args` to `channel` */
    function send(channel, serializer, value) {
        system.runJob(NET.emit(`ipc:${channel}:send`, serializer, value));
    }
    IPC.send = send;
    /** Sends an `invoke` message through IPC, and expects a result asynchronously. */
    function invoke(channel, serializer, value, deserializer) {
        system.runJob(NET.emit(`ipc:${channel}:invoke`, serializer, value));
        return new Promise(resolve => {
            const terminate = NET.listen(`ipc:${channel}:handle`, deserializer, function* (value) {
                resolve(value);
                terminate();
            });
        });
    }
    IPC.invoke = invoke;
    /** Listens to `channel`. When a new message arrives, `listener` will be called with `listener(args)`. */
    function on(channel, deserializer, listener) {
        return NET.listen(`ipc:${channel}:send`, deserializer, function* (value) {
            listener(value);
        });
    }
    IPC.on = on;
    /** Listens to `channel` once. When a new message arrives, `listener` will be called with `listener(args)`, and then removed. */
    function once(channel, deserializer, listener) {
        const terminate = NET.listen(`ipc:${channel}:send`, deserializer, function* (value) {
            listener(value);
            terminate();
        });
        return terminate;
    }
    IPC.once = once;
    /** Adds a handler for an `invoke` IPC. This handler will be called whenever `invoke(channel, ...args)` is called */
    function handle(channel, deserializer, serializer, listener) {
        return NET.listen(`ipc:${channel}:invoke`, deserializer, function* (value) {
            const result = listener(value);
            yield* NET.emit(`ipc:${channel}:handle`, serializer, result);
        });
    }
    IPC.handle = handle;
})(IPC || (IPC = {}));
export default IPC;
