import Rule from './Rule';
import Rules from './Rules';

class InfoDisplayRule extends Rule {
    constructor({ identifier, description = '', contingentRules = [], independentRules = [], extensionName = false }) {
        super({ category: "InfoDisplay", identifier, description, contingentRules, independentRules, extensionName });
    }

    getValue(player) {
        return player.getDynamicProperty(super.getID());
    }

    setValue(player, value) {
        player.setDynamicProperty(super.getID(), value);
    }

    static getValue(player, identifier) {
        return this.getRule(identifier).getNativeValue(player);
    }
    
    static setValue(player, identifier, value) {
        this.getRule(identifier).setValue(player, value);
    }
    
    static getAll() {
        return Object.values(Rules.getAll()).filter(rule => rule.getCategory() === "InfoDisplay");
    }
}

export default InfoDisplayRule;