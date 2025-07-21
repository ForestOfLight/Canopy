import { Rule } from './Rule';
import { Rules } from './Rules';

class InfoDisplayRule extends Rule {
    globalContingentRules;

    constructor(options) {
        options.category = "InfoDisplay";
        super({ ...options });
        this.globalContingentRules = options.globalContingentRules || [];
    }

    getGlobalContingentRuleIDs() {
        return this.globalContingentRules;
    }

    getValue(player) {
        return player.getDynamicProperty(super.getID());
    }

    setValue(player, value) {
        player.setDynamicProperty(super.getID(), value);
        if (value === true)
            this.enableForPlayer(player);
        else if (value === false)
            this.disableForPlayer(player);
    }

    static get(identifier) {
        const rule = Rules.get(identifier);
        if (rule?.getCategory() === "InfoDisplay")
            return rule;
        return undefined;
    }

    static exists(identifier) {
        return Rules.exists(identifier) && Rules.get(identifier).getCategory() === "InfoDisplay";
    }

    static getValue(player, identifier) {
        return this.get(identifier).getValue(player);
    }
    
    static setValue(player, identifier, value) {
        this.get(identifier).setValue(player, value);
    }
    
    static getAll() {
        return Object.values(Rules.getAll()).filter(rule => rule.getCategory() === "InfoDisplay");
    }
}

export { InfoDisplayRule };