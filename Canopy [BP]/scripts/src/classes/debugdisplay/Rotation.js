import { DebugDisplayElement } from './DebugDisplayElement.js';

export class Rotation extends DebugDisplayElement {
    getFormattedData() {
        const rotation = this.entity.getRotation();
        return `§7<${rotation.x}, ${rotation.y}>`;
    }
}