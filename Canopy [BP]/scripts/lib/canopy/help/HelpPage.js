import { RuleHelpEntry, CommandHelpEntry, InfoDisplayRuleHelpEntry } from './HelpEntry.js';
import Rule from '../Rule.js';
import InfoDisplayRule from '../InfoDisplayRule.js';
import Command from '../Command.js';

class HelpPage {
    entries = [];

    constructor(title, description = '', extensionName = false) {
        if (extensionName)
            this.title = extensionName + ':' + title;
        else
            this.title = title;
        this.description = description;
        this.extensionName = extensionName;
    }

    getEntries() {
        return this.entries;
    }

    getPrintStarter() {
        let extensionFormat = '';
        let titleFormat = this.title;
        if (this.extensionName) {
            extensionFormat = '§a' + this.extensionName + '§f:';
            titleFormat = this.title.split(':')[1];
        }
        return { rawtext: [{ translate: 'commands.help.page.header', with: [extensionFormat+titleFormat] }] };
    }
}

class RuleHelpPage extends HelpPage {
    constructor(title, description, usage, extensionName = false) {
        super(title, description, extensionName);
        this.usage = usage;
    }

    addEntry(rule) {
        if (!(rule instanceof Rule)) {
            throw new Error('[HelpPage] Entry must be an instance of Rule');
        }
        if (this.hasEntry(rule))
            return;
        this.entries.push(new RuleHelpEntry(rule));
    }

    hasEntry(rule) {
        return this.entries.some(entry => entry.rule.getID() === rule.getID());
    }

    async toRawMessage() {
        let message = this.getPrintStarter();
        message.rawtext.push({ rawtext: [ { text: `\n§2${this.usage}§8 - ` }, this.description ] });
        for (let entry of this.entries) {
            message.rawtext.push({ rawtext: [ { text: '\n  ' }, await entry.toRawMessage() ] });
        }
        return message;
    }
}

class CommandHelpPage extends HelpPage {
    constructor(title, description = null, extensionName = false) {
        super(title, description, extensionName);
    }

    addEntry(command) {
        if (!(command instanceof Command)) {
            throw new Error('[HelpPage] Entry must be an instance of Command');
        }
        if (this.hasEntry(command))
            return;
        this.entries.push(new CommandHelpEntry(command));
    }

    hasEntry(command) {
        return this.entries.some(entry => entry.command.getName() === command.getName());
    }

    toRawMessage() {
        let message = this.getPrintStarter();
        if (this.description !== null)
            message.rawtext.push({ rawtext: [ { text: `\n§2` }, this.description ] });
        for (let entry of this.entries) {
            message.rawtext.push({ rawtext: [ { text: '\n  ' }, entry.toRawMessage() ] });
        }
        return message;
    }
}

class InfoDisplayRuleHelpPage extends RuleHelpPage {
    constructor(title, description, usage, extensionName = false) {
        super(title, description, usage, extensionName);
    }

    addEntry(rule, player) {
        if (!(rule instanceof InfoDisplayRule)) {
            throw new Error('[HelpPage] Entry must be an instance of InfoDisplayRule');
        }
        if (this.hasEntry(rule))
            return;
        this.entries.push(new InfoDisplayRuleHelpEntry(rule, player));
    }
}

export { HelpPage, RuleHelpPage, CommandHelpPage, InfoDisplayRuleHelpPage };