import { DebugDisplayElement } from './DebugDisplayElement.js';

export class TypeID extends DebugDisplayElement {
    getFormattedData() {
        return '§a' + this.entity.typeId;
    }
}