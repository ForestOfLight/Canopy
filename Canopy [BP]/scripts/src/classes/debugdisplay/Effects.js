import { DebugDisplayElement } from './DebugDisplayElement.js';

export class Effects extends DebugDisplayElement {
    getFormattedData() {
        const effects = this.entity.getEffects();
        let message = '';
        for (const effect of effects)
            message += `§d${effect.displayName} (${effect.duration} ticks)\n`;
        return message;
    }
}