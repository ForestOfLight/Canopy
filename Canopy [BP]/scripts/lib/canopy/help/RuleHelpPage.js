import HelpPage from './HelpPage';
import RuleHelpEntry from './RuleHelpEntry';
import { Rule } from '../Rule';

class RuleHelpPage extends HelpPage {
    constructor({ title, description, usage }, extensionId = false) {
        super(title, description, extensionId);
        this.usage = usage;
    }

    addEntry(rule) {
        if (!(rule instanceof Rule))
            throw new Error('[HelpPage] Entry must be an instance of Rule');
        
        if (this.hasEntry(rule))
            return;
        this.entries.push(new RuleHelpEntry(rule));
    }

    hasEntry(rule) {
        return this.entries.some(entry => entry.rule.getID() === rule.getID());
    }

    async toRawMessage() {
        const message = this.getPrintStarter();
        message.rawtext.push({ rawtext: [ { text: `\n§2${this.usage}§8 - ` }, this.description ] });
        for (const entry of this.entries) 
            message.rawtext.push({ rawtext: [ { text: '\n  ' }, await entry.toRawMessage() ] });
        
        return message;
    }
}

export default RuleHelpPage;