import { CommandOrigin } from "./CommandOrigin";
import { FeedbackMessageType } from "./FeedbackMessageType";

export class ServerCommandOrigin extends CommandOrigin {
    getSource() {
        return this.source.sourceType;
    }

    sendMessage(message) {
        console.log(message);
        return FeedbackMessageType.ConsoleInfo;
    }
}