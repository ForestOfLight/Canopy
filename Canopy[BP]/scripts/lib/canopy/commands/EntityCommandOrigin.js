import { CommandOrigin } from "./CommandOrigin";
import { FeedbackMessageType } from "./FeedbackMessageType";

export class EntityCommandOrigin extends CommandOrigin {
    getSource() {
        return this.source.sourceEntity;
    }

    sendMessage(message) {
        this.getSource().sendMessage(message);
        return FeedbackMessageType.ChatMessage;
    }
}