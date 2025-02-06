import { InfoDisplayRule } from 'lib/canopy/Canopy';
import Rules from '../../../lib/canopy/Rules';

class InfoDisplayElement {
    identifier;
    rule;
    lineNumber;
    isWorldwide;

    constructor(ruleData, lineNumber, isWorldwide = false) {
        if (this.constructor === InfoDisplayElement) 
            throw new TypeError("Abstract class 'InfoDisplayElement' cannot be instantiated directly.");
        if (!ruleData.identifier || !ruleData.description) 
            throw new Error("ruleData must have 'identifier' and 'description' properties.");
        this.identifier = ruleData.identifier;
        this.rule = Rules.get(this.identifier) || new InfoDisplayRule({ identifier: this.identifier, description: ruleData.description, contingentRules: ruleData.contingentRules });
        this.isWorldwide = isWorldwide;
        this.lineNumber = lineNumber;
    }

    getFormattedDataOwnLine() {
        throw new Error("Method 'getFormattedDataOwnLine()' must be implemented.");
    }

    getFormattedDataSharedLine() {
        throw new Error("Method 'getFormattedDataSharedLine()' must be implemented.");
    }
}

export default InfoDisplayElement;