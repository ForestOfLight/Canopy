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
export declare namespace PROTO {
    interface Serializable<T> {
        serialize(value: T, stream: ByteQueue): Generator<void, void, void>;
        deserialize(stream: ByteQueue): Generator<void, T, void>;
    }
    class ByteQueue {
        private _buffer;
        private _data_view;
        private _length;
        private _offset;
        get end(): number;
        get front(): number;
        get data_view(): DataView;
        constructor(size?: number);
        write(...values: number[]): void;
        read(amount?: number): number[];
        ensure_capacity(size: number): void;
        static from_uint8array(array: Uint8Array): ByteQueue;
        to_uint8array(): Uint8Array;
    }
    namespace MIPS {
        function serialize(byte_queue: PROTO.ByteQueue): Generator<void, string, void>;
        function deserialize(str: string): Generator<void, PROTO.ByteQueue, void>;
    }
    const Void: PROTO.Serializable<void>;
    const Null: PROTO.Serializable<null>;
    const Undefined: PROTO.Serializable<undefined>;
    const Int8: PROTO.Serializable<number>;
    const Int16: PROTO.Serializable<number>;
    const Int32: PROTO.Serializable<number>;
    const UInt8: PROTO.Serializable<number>;
    const UInt16: PROTO.Serializable<number>;
    const UInt32: PROTO.Serializable<number>;
    const UVarInt32: PROTO.Serializable<number>;
    const Float32: PROTO.Serializable<number>;
    const Float64: PROTO.Serializable<number>;
    const String: PROTO.Serializable<string>;
    const Boolean: PROTO.Serializable<boolean>;
    const UInt8Array: PROTO.Serializable<Uint8Array>;
    const Date: PROTO.Serializable<Date>;
    function Object<T extends object>(obj: {
        [K in keyof T]: PROTO.Serializable<T[K]>;
    }): PROTO.Serializable<T>;
    function Array<T>(value: PROTO.Serializable<T>): PROTO.Serializable<T[]>;
    function Tuple<T extends any[]>(...values: {
        [K in keyof T]: PROTO.Serializable<T[K]>;
    }): PROTO.Serializable<T>;
    function Optional<T>(value: PROTO.Serializable<T>): PROTO.Serializable<T | undefined>;
    function Map<K, V>(key: PROTO.Serializable<K>, value: PROTO.Serializable<V>): PROTO.Serializable<Map<K, V>>;
    function Set<V>(value: PROTO.Serializable<V>): PROTO.Serializable<Set<V>>;
    type Endpoint = string;
    type Header = {
        guid: string;
        encoding: string;
        index: number;
        final: boolean;
    };
    const Endpoint: PROTO.Serializable<Endpoint>;
    const Header: PROTO.Serializable<Header>;
}
export declare namespace NET {
    function serialize(byte_queue: PROTO.ByteQueue, max_size?: number): Generator<void, string[], void>;
    function deserialize(strings: string[]): Generator<void, PROTO.ByteQueue, void>;
    function emit<S extends PROTO.Serializable<T>, T>(endpoint: string, serializer: S & PROTO.Serializable<T>, value: T): Generator<void, void, void>;
    function listen<T, S extends PROTO.Serializable<T>>(endpoint: string, serializer: S & PROTO.Serializable<T>, callback: (value: T) => Generator<void, void, void>): () => void;
}
export declare namespace IPC {
    /** Sends a message with `args` to `channel` */
    function send<S extends PROTO.Serializable<T>, T>(channel: string, serializer: S & PROTO.Serializable<T>, value: T): void;
    /** Sends an `invoke` message through IPC, and expects a result asynchronously. */
    function invoke<TS extends PROTO.Serializable<T>, T, RS extends PROTO.Serializable<R>, R>(channel: string, serializer: TS & PROTO.Serializable<T>, value: T, deserializer: RS & PROTO.Serializable<R>): Promise<R>;
    /** Listens to `channel`. When a new message arrives, `listener` will be called with `listener(args)`. */
    function on<S extends PROTO.Serializable<T>, T>(channel: string, deserializer: S & PROTO.Serializable<T>, listener: (value: T) => void): () => void;
    /** Listens to `channel` once. When a new message arrives, `listener` will be called with `listener(args)`, and then removed. */
    function once<S extends PROTO.Serializable<T>, T>(channel: string, deserializer: S & PROTO.Serializable<T>, listener: (value: T) => void): () => void;
    /** Adds a handler for an `invoke` IPC. This handler will be called whenever `invoke(channel, ...args)` is called */
    function handle<TS extends PROTO.Serializable<T>, T, RS extends PROTO.Serializable<R>, R>(channel: string, deserializer: TS & PROTO.Serializable<T>, serializer: RS & PROTO.Serializable<R>, listener: (value: T) => R): () => void;
}
export default IPC;
