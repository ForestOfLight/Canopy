import './registry/CommandRegistry';
import './registry/RuleRegistry';

import Command from './Command';
import Rule from './Rule';
import InfoDisplayRule from './InfoDisplayRule';
import { RuleHelpEntry, CommandHelpEntry, InfoDisplayRuleHelpEntry } from './help/HelpEntry';
import { RuleHelpPage, CommandHelpPage, InfoDisplayRuleHelpPage } from './help/HelpPage';
import HelpBook from './help/HelpBook';

function getLoadedExtensions() {
    const ruleExtensions = Rule.getExtensionNames();
    const commandExtensions = Command.getExtensionNames();
    return [...new Set([...ruleExtensions, ...commandExtensions])];
}

export { Command, Rule, InfoDisplayRule, RuleHelpEntry, CommandHelpEntry, InfoDisplayRuleHelpEntry, 
    RuleHelpPage, CommandHelpPage, InfoDisplayRuleHelpPage, HelpBook, getLoadedExtensions };