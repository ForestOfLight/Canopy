import { DebugDisplayElement } from "./DebugDisplayElement";

export class ComponentDebugDisplayElement extends DebugDisplayElement {
    commonIrrelevantProperties = ['componentId', 'entity', 'typeId', 'isValid'];
    relevantProperties = [];


    constructor(entity, componentType) {
        super(entity);
        this.component = entity.getComponent(componentType);
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
}