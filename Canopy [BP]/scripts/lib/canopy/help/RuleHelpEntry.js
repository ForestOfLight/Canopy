import { HelpEntry } from "./HelpEntry";

class RuleHelpEntry extends HelpEntry {
    constructor(rule) {
        super(rule.getID(), rule.getDescription());
        this.rule = rule;
    }
    
    async toRawMessage() {
        const coloredValue = await this.fetchColoredValue().then(value => value);
        return { rawtext: [ { text: `§7${this.title}: ${coloredValue}§8 - ` }, this.description ] };
    }

    async fetchColoredValue() {
        const value = await this.rule.getValue();
        return value ? '§atrue§r' : '§cfalse§r';
    }
}

export { RuleHelpEntry };