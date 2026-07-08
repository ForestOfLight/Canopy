import { CommandOrigin } from "./CommandOrigin";
import { FeedbackMessageType } from "./FeedbackMessageType";

export class BlockCommandOrigin extends CommandOrigin {
    getName() {
        return 'Command Block';
    }

    getSource() {
        return this.source.sourceBlock;
    }

    sendMessage() {
        return FeedbackMessageType.None;
    }
}