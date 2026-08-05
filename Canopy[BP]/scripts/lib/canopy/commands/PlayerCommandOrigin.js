import { CommandOrigin } from "./CommandOrigin";
import { FeedbackMessageType } from "./FeedbackMessageType";

export class PlayerCommandOrigin extends CommandOrigin {
    getType() {
        return "Player";
    }

    getName() {
        return this.getSource().name;
    }

    getSource() {
        return this.source.sourceEntity;
    }

    sendMessage(message) {
        this.getSource().sendMessage(message);
        return FeedbackMessageType.ChatMessage;
    }
}