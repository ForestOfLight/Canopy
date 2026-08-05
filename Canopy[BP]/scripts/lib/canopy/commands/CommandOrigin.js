import { FeedbackMessageType } from "./FeedbackMessageType";

export class CommandOrigin {
    constructor(source) {
        this.source = source;
    }

    getType() {
        return this.source.sourceType;
    }

    getName() {
        throw new Error("getName() not implemented");
    }

    getSource() {
        throw new Error("getSource() not implemented");
    }

    sendMessage(message) {
        console.error(`Unknown source type: ${this.source.sourceType}`, message);
        return FeedbackMessageType.ConsoleError;
    }
}