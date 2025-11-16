import { HelpEntry } from "./HelpEntry";

export class RuleHelpEntry extends HelpEntry {
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
        switch(this.rule.getType()) {
            case ('boolean'):
                return value ? '§atrue§r' : '§cfalse§r';
            case('integer'):
                return '§u' + value;
            case('float'):
                return '§d' + value;
            default:
                return value;
        }
    }
}