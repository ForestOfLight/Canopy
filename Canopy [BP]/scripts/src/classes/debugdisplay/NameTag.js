import { DebugDisplayTextElement } from './DebugDisplayTextElement.js';

export class NameTag extends DebugDisplayTextElement {
    getFormattedData() {
        const nameTag = this.entity.nameTag;
        if (!nameTag)
            return '§7None';
        return '§o§a' + nameTag;
    }
}