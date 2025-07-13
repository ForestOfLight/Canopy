import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';

export class AttributeDebugDisplayElement extends ComponentDebugDisplayElement {
    getFormattedData() {
        if (!this.component?.isValid)
            return '';
        return `§7${this.component.currentValue}/${this.component.defaultValue} (effective: ${this.component.effectiveMin} to ${this.component.effectiveMax})`;
    }
}