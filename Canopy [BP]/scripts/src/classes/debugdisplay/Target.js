import { DebugDisplayElement } from './DebugDisplayElement.js';

export class Target extends DebugDisplayElement {
    getFormattedData() {
        const target = this.entity.target;
        if (!target || !target.id)
            return '§7None';
        return '§7' + target.id;
    }
}