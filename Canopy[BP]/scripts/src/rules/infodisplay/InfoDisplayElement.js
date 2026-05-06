import { InfoDisplayRule, Rules } from '../../../lib/canopy/Canopy';

class InfoDisplayElement {
    identifier;
    rule;
    isWorldwide;

    constructor(ruleData, isWorldwide = false) {
        if (this.constructor === InfoDisplayElement) 
            throw new TypeError("Abstract class 'InfoDisplayElement' cannot be instantiated directly.");
        if (!ruleData.identifier || !ruleData.description) 
            throw new Error("ruleData must have 'identifier' and 'description' properties.");
        this.identifier = ruleData.identifier;
        this.rule = Rules.get(this.identifier) || new InfoDisplayRule({ identifier: this.identifier, ...ruleData });
        this.isWorldwide = isWorldwide;
    }
}

export { InfoDisplayElement };
