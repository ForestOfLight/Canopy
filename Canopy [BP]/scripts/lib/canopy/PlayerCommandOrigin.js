import { CommandOrigin } from "./CommandOrigin";
import { FeedbackMessageType } from "./FeedbackMessageType";

export class PlayerCommandOrigin extends CommandOrigin {
    getType() {
        return "Player";
    }

    getSource() {
        return this.source.sourceEntity;
    }

    sendMessage(message) {
        this.source.sourceEntity.sendMessage(message);
        return FeedbackMessageType.ChatMessage;
    }
}