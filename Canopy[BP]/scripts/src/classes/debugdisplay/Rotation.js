import { DebugDisplayTextElement } from './DebugDisplayTextElement.js';

export class Rotation extends DebugDisplayTextElement {
    getFormattedData() {
        const rotation = this.entity.getRotation();
        return `§7<${rotation.x}, ${rotation.y}>`;
    }
}