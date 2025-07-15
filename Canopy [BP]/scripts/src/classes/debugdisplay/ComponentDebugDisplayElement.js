import { Entity } from "@minecraft/server";
import { DebugDisplayElement } from "./DebugDisplayElement";
import { getNameFromEntityId } from "../../../include/utils";

export class ComponentDebugDisplayElement extends DebugDisplayElement {
    commonIrrelevantProperties = ['componentId', 'entity', 'typeId', 'isValid'];
    relevantProperties = [];

    constructor(entity, componentType) {
        super(entity);
        this.component = entity.getComponent(componentType);
        this.componentType = componentType;
        this.populateRelevantProperties();
    }

    populateRelevantProperties() {
        const props = new Set();
        let obj = this.component;
        while (obj && obj !== Object.prototype) {
            Object.getOwnPropertyNames(obj).forEach(p => {
                if (typeof this.component[p] !== 'function')
                    props.add(p);
            });
            obj = Object.getPrototypeOf(obj);
        }
        this.relevantProperties = Array.from(props);
        this.commonIrrelevantProperties.forEach(property => {
            const index = this.relevantProperties.indexOf(property);
            if (index !== -1)
                this.relevantProperties.splice(index, 1);
        });
    }

    getFormattedComponent({ hide = [], noLinebreak = false, valueColorCode = '§7' } = {}) {
        this.component = this.entity.getComponent(this.componentType);
        const componentData = {};
        this.relevantProperties.forEach(prop => {
            if (hide.includes(prop))
                delete componentData[prop];
            else if (this.component[prop] instanceof Entity)
                componentData[prop] = this.component[prop] ? (getNameFromEntityId(this.component[prop].id) ?? 'Unknown') : 'None';
            else
                componentData[prop] = this.component[prop] === void 0 ? 'None' : this.component[prop];
        });
        if (noLinebreak)
           return Object.keys(componentData).map((prop) => `§7${prop}: ${valueColorCode}${componentData[prop]}`).join('§r '); 
        return '\n' + Object.keys(componentData).map((prop) => `§7${prop}: ${valueColorCode}${componentData[prop]}`).join('§r\n');
    }
}