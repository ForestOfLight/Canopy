import { InfoDisplayRule } from '../../../lib/canopy/Canopy';

class InfoDisplayElement {
    identifier;
    rule;
    isWorldwide;
    onEnable;
    onDisable;

    static getRuleIdentifier() {
        throw new Error(`${this.name} must implement a static getRuleIdentifier() method.`);
    }

    constructor(ruleData, isWorldwide = false) {
        if (this.constructor === InfoDisplayElement)
            throw new TypeError("Abstract class 'InfoDisplayElement' cannot be instantiated directly.");
        if (!ruleData.description)
            throw new Error("ruleData must have a 'description' property.");
        this.identifier = this.constructor.getRuleIdentifier();
        const { onEnableCallback, onDisableCallback, ...ruleOptions } = ruleData;
        this.onEnable = onEnableCallback || (() => {});
        this.onDisable = onDisableCallback || (() => {});
        this.rule = InfoDisplayRule.get(this.identifier) || new InfoDisplayRule({ identifier: this.identifier, ...ruleOptions });
        this.isWorldwide = isWorldwide;
    }

    destroy() {
        /* pass */
    }
}

export { InfoDisplayElement };
