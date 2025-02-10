import RuleHelpEntry from "./RuleHelpEntry";
import { InfoDisplayRule } from "../InfoDisplayRule";

class InfoDisplayRuleHelpEntry extends RuleHelpEntry {
    constructor(infoDisplayRule, player) {
        if (infoDisplayRule instanceof InfoDisplayRule === false)
            throw new TypeError('infoDisplayRule must be an instance of InfoDisplayRule');
        super(infoDisplayRule);
        this.player = player;
    }

    async fetchColoredValue() {
        const value = await this.rule.getValue(this.player);
        return value ? '§atrue§r' : '§cfalse§r';
    }
}

export default InfoDisplayRuleHelpEntry;