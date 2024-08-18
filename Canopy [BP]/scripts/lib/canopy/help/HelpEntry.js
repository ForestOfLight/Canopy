import Command from "../Command";

class HelpEntry {
    constructor(title, description) {
        this.title = title;
        this.description = description;
    }
}

class RuleHelpEntry extends HelpEntry {
    constructor(rule) {
        super(rule.getID(), rule.getDescription());
        this.rule = rule;
    }
    
    async fetchColoredValue() {
        const value = await this.rule.getValue();
        return value ? '§atrue§r' : '§cfalse§r';
    }
    
    async toString() {
        const coloredValue = await this.fetchColoredValue().then(value => value);
        return `§7${this.title}: ${coloredValue}§8 - ${this.description}`;
    }
}

class CommandHelpEntry extends HelpEntry {
    constructor(command) {
        super(command.getName(), command.getDescription());
        this.command = command;
    }

    toString() {
        let output = `§2${this.command.getUsage()}§8 - ${this.description}`;
        for (let helpEntry of this.command.getHelpEntries()) {
            output += `\n  §7> §2${Command.prefix}${helpEntry.usage} §8- ${helpEntry.description}`;
        }
        return output;
    }
}

class InfoDisplayRuleHelpEntry extends RuleHelpEntry {
    constructor(infoDisplayRule, player) {
        super(infoDisplayRule);
        this.player = player;
    }

    async fetchColoredValue() {
        const value = await this.rule.getValue(this.player);
        return value ? '§atrue§r' : '§cfalse§r';
    }

    async toString() {
        const coloredValue = await this.fetchColoredValue().then(value => value);
        return `§7${this.title}: ${coloredValue}§8 - ${this.description}`;
    }
}


export { HelpEntry, RuleHelpEntry, CommandHelpEntry, InfoDisplayRuleHelpEntry };