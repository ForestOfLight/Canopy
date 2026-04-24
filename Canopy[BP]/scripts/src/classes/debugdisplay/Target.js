import { DebugDisplayTextElement } from './DebugDisplayTextElement.js';

export class Target extends DebugDisplayTextElement {
    getFormattedData() {
        const target = this.entity.target;
        if (!target || !target.id)
            return '§7None';
        return '§7' + target.id;
    }
}