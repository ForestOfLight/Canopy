import RuleHelpEntry from "./RuleHelpEntry";

class InfoDisplayRuleHelpEntry extends RuleHelpEntry {
    constructor(infoDisplayRule, player) {
        super(infoDisplayRule);
        this.player = player;
    }

    async fetchColoredValue() {
        const value = await this.rule.getValue(this.player);
        return value ? '§atrue§r' : '§cfalse§r';
    }
}

export default InfoDisplayRuleHelpEntry;