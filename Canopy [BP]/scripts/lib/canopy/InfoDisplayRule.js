import Rule from './Rule';

class InfoDisplayRule extends Rule {
    constructor({ category, identifier, description = '', contingentRules = [], independentRules = [], extensionName = false }) {
        super({ category, identifier, description, contingentRules, independentRules, extensionName });
    }
    
    getValue(player) {
        return player.getDynamicProperty(this.getID());
    }
    
    setValue(player, value) {
        player.setDynamicProperty(this.getID(), value);
    }
    
    static getRules() {
        return Rule.getRulesByCategory('InfoDisplay');
    }
}

export default InfoDisplayRule;