import { InfoDisplayRule } from 'lib/canopy/Canopy';

class InfoDisplayElement {
    identifier;
    rule;
    lineNumber;
    isWorldwide;

    constructor(identifier, description, lineNumber, isWorldwide = false, contingentRules = []) {
        if (this.constructor === InfoDisplayElement) {
            throw new TypeError("Abstract class 'InfoDisplayElement' cannot be instantiated directly.");
        }
        this.identifier = identifier;
        this.rule = InfoDisplayRule.getRule(identifier) || new InfoDisplayRule({ identifier, description, contingentRules });
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