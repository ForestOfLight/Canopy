import { DebugDisplayTextElement } from './DebugDisplayTextElement.js';

export class TypeID extends DebugDisplayTextElement {
    getFormattedData() {
        return '§a' + this.entity.typeId;
    }
}