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
declare namespace IPC {
    class Connection {
        private readonly _from;
        private readonly _to;
        private readonly _enc;
        private readonly _terminators;
        private MAYBE_ENCRYPT;
        private MAYBE_DECRYPT;
        get from(): string;
        get to(): string;
        constructor(from: string, to: string, encryption: string | false);
        terminate(notify?: boolean): void;
        send(channel: string, ...args: any[]): void;
        invoke(channel: string, ...args: any[]): Promise<any>;
        on(channel: string, listener: (...args: any[]) => void): () => void;
        once(channel: string, listener: (...args: any[]) => void): () => void;
        handle(channel: string, listener: (...args: any[]) => any): () => void;
    }
    class ConnectionManager {
        private readonly _id;
        private readonly _enc_map;
        private readonly _con_map;
        private readonly _enc_force;
        private MAYBE_ENCRYPT;
        private MAYBE_DECRYPT;
        get id(): string;
        constructor(id: string, force_encryption?: boolean);
        connect(to: string, encrypted?: boolean, timeout?: number): Promise<Connection>;
        send(channel: string, ...args: any[]): void;
        invoke(channel: string, ...args: any[]): Promise<any>[];
        on(channel: string, listener: (...args: any[]) => void): () => void;
        once(channel: string, listener: (...args: any[]) => void): () => void;
        handle(channel: string, listener: (...args: any[]) => any): () => void;
    }
    /** Sends a message with `args` to `channel` */
    function send(channel: string, ...args: any[]): void;
    /** Sends an `invoke` message through IPC, and expects a result asynchronously. */
    function invoke(channel: string, ...args: any[]): Promise<any>;
    /** Listens to `channel`. When a new message arrives, `listener` will be called with `listener(args)`. */
    function on(channel: string, listener: (...args: any[]) => void): () => void;
    /** Listens to `channel` once. When a new message arrives, `listener` will be called with `listener(args)`, and then removed. */
    function once(channel: string, listener: (...args: any[]) => void): () => void;
    /** Adds a handler for an `invoke` IPC. This handler will be called whenever `invoke(channel, ...args)` is called */
    function handle(channel: string, listener: (...args: any[]) => any): () => void;
}
export default IPC;
export declare namespace NET {
    function emit(namespace: string, event: string, channel: string, args: any[]): Generator<void, void, void>;
    function listen(namespace: string, event: string, channel: string, callback: (args: any[]) => Generator<void, void, void>): () => void;
}
