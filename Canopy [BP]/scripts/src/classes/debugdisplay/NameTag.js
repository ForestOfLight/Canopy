import { DebugDisplayElement } from './DebugDisplayElement.js';

export class NameTag extends DebugDisplayElement {
    getFormattedData() {
        const nameTag = this.entity.nameTag;
        if (!nameTag)
            return '§7None';
        return '§o§a' + nameTag;
    }
}