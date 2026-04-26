import { InfoDisplayElement } from './InfoDisplayElement';

class InfoDisplayTextElement extends InfoDisplayElement {
    lineNumber;
    isWorldwide;

    constructor(ruleData, lineNumber, isWorldwide = false) {
        super(ruleData, isWorldwide);
        if (this.constructor === InfoDisplayTextElement) 
            throw new TypeError("Abstract class 'InfoDisplayTextElement' cannot be instantiated directly.");
        this.lineNumber = lineNumber;
    }

    getFormattedDataOwnLine() {
        throw new Error("Method 'getFormattedDataOwnLine()' must be implemented.");
    }

    getFormattedDataSharedLine() {
        throw new Error("Method 'getFormattedDataSharedLine()' must be implemented.");
    }
}

export { InfoDisplayTextElement };
