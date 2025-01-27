import RuleHelpPage from './RuleHelpPage';
import InfoDisplayRuleHelpEntry from './InfoDisplayRuleHelpEntry';
import InfoDisplayRule from '../InfoDisplayRule';

class InfoDisplayRuleHelpPage extends RuleHelpPage {
    constructor(title, description, usage, extensionName = false) {
        super(title, description, usage, extensionName);
    }

    addEntry(rule, player) {
        if (!(rule instanceof InfoDisplayRule)) 
            throw new Error('[HelpPage] Entry must be an instance of InfoDisplayRule');
        
        if (this.hasEntry(rule))
            return;
        this.entries.push(new InfoDisplayRuleHelpEntry(rule, player));
    }
}

export default InfoDisplayRuleHelpPage;