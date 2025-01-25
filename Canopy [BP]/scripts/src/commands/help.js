import { Commands, Rule, InfoDisplayRule, Extensions } from 'lib/canopy/Canopy';
import { HelpBook, CommandHelpPage, RuleHelpPage, InfoDisplayRuleHelpPage } from 'lib/canopy/Canopy';

const COMMANDS_PER_PAGE = 8;
const helpBook = new HelpBook();

const cmd = new Command({
    name: 'help',
    description: { translate: 'commands.help' },
    usage: 'help [page/searchTerm]',
    args: [
        { type: 'string|number', name: 'pageName' }
    ],
    callback: helpCommand
});

function helpCommand(sender, args) {
    populateNativeCommandPages(helpBook);
    populateNativeRulePages(helpBook, sender);
    populateExtensionPages(helpBook);

    const { pageName } = args;
    if (pageName === null)
        helpBook.print(sender);
    else if (helpBook.getPageNames().map(name => name.toLowerCase()).includes(String(pageName).toLowerCase()))
        helpBook.printPage(pageName, sender);
    else
        helpBook.printSearchResults(String(pageName), sender);
}

function populateNativeCommandPages(helpBook) {
    let commands = Commands.getNativeCommands();
    commands = commands.filter(cmd => !cmd.isHelpHidden());
    if (helpBook.numNativeCommandPages >= commands.length / COMMANDS_PER_PAGE)
        return;

    for (let i = 0; i < commands.length; i++) {;
        if (i % COMMANDS_PER_PAGE === 0) {
            helpBook.numNativeCommandPages++;
            helpBook.newPage(new CommandHelpPage(helpBook.numNativeCommandPages));
        }
        const command = commands[i];
        helpBook.addEntry(helpBook.numNativeCommandPages, command);
    }
}

function populateNativeRulePages(helpBook, player) {
    const infoDisplayPage = new InfoDisplayRuleHelpPage('InfoDisplay', { translate: 'commands.help.infodisplay' }, Commands.getPrefix() + 'info <rule/all> <true/false>');
    const infoDisplayRules = InfoDisplayRule.getRules();
    helpBook.newPage(infoDisplayPage);
    for (let infoDisplayRule of infoDisplayRules) {
        helpBook.addEntry(infoDisplayRule.getCategory(), infoDisplayRule, player);
    }

    const rulesPage = new RuleHelpPage('Rules', { translate: 'commands.help.rules' }, Commands.getPrefix() + 'canopy <rule> <true/false>');
    const globalRules = Rule.getRulesByCategory('Rules');
    helpBook.newPage(rulesPage);
    for (let rule of globalRules) {
        helpBook.addEntry(rule.getCategory(), rule);
    }
}

function populateExtensionPages(helpBook) {
    populateExtensionRulePages(helpBook);
    populateExtensionCommandPages(helpBook);
}

function populateExtensionRulePages(helpBook) {
    const extensions = Extensions.getAll();
    for (const extension of extensions) {
        const rules = extensions.getRules();
        if (rules.length > 0) {
            const rulePage = new RuleHelpPage(`Rules`, { translate: 'commands.help.extension.rules', with: [extension.getName()] }, Commands.getPrefix() + `canopy <rule> <true/false>`, extension.getName());
            helpBook.newPage(rulePage);
            for (let rule of rules) {
                helpBook.addEntry(rulePage.title, rule);
            }
        }
    }
}

function populateExtensionCommandPages(helpBook) {
    const extensions = Extensions.getAll();
    for (const extension of extensions) {
        const commands = extensions.getCommands();
        if (commands.length > 0) {
            const commandPage = new CommandHelpPage(`Commands`, { translate: 'commands.help.extension.commands', with: [extension.getName()] }, extension.getName());
            helpBook.newPage(commandPage);
            for (let command of commands) {
                helpBook.addEntry(commandPage.title, command);
            }
        }
    }
}
