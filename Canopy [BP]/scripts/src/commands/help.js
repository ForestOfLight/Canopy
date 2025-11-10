import { Commands, Command, InfoDisplayRule, Extensions, HelpBook, CommandHelpPage, RuleHelpPage, InfoDisplayRuleHelpPage, Rules } from '../../lib/canopy/Canopy';

const COMMANDS_PER_PAGE = 6;

new Command({
    name: 'help',
    description: { translate: 'commands.help' },
    usage: 'help [page/searchTerm]',
    args: [
        { type: 'string|integer', name: 'pageName' }
    ],
    callback: helpCommand
});

function helpCommand(sender, args) {
    const helpBook = new HelpBook();
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
            helpBook.newPage(new CommandHelpPage({ title: helpBook.numNativeCommandPages }));
        }
        const command = commands[i];
        helpBook.addEntry(helpBook.numNativeCommandPages, command);
    }
}

function populateNativeRulePages(helpBook, player) {
    const infoDisplayPage = new InfoDisplayRuleHelpPage({ title: 'InfoDisplay', description: { translate: 'commands.help.infodisplay' }, usage: Commands.getPrefix() + 'info <rule/all> <true/false>' });
    const infoDisplayRules = InfoDisplayRule.getAll();
    helpBook.newPage(infoDisplayPage);
    for (const infoDisplayRule of infoDisplayRules)
        helpBook.addEntry(infoDisplayRule.getCategory(), infoDisplayRule, player);

    const rulesPage = new RuleHelpPage({ title: 'Rules', description: { translate: 'commands.help.rules' }, usage: Commands.getPrefix() + 'canopy <rule> <true/false>' });
    const globalRules = Rules.getByCategory('Rules').sort((a, b) => a.getID().localeCompare(b.getID())).filter(rule => !rule.getExtension());
    helpBook.newPage(rulesPage);
    for (const rule of globalRules)
        helpBook.addEntry(rule.getCategory(), rule);
}

function populateExtensionPages(helpBook) {
    populateExtensionRulePages(helpBook);
    populateExtensionCommandPages(helpBook);
}

function populateExtensionRulePages(helpBook) {
    const extensions = Extensions.getAll();
    for (const extension of extensions) {
        const rules = extension.getRules();
        if (rules.length > 0) {
            const rulePage = new RuleHelpPage({ title: `Rules`, description: { translate: 'commands.help.extension.rules', with: [extension.getName()] }, usage: Commands.getPrefix() + `canopy <rule> <true/false>` }, extension.getName());
            helpBook.newPage(rulePage);
            for (const rule of rules) 
                helpBook.addEntry(rulePage.title, rule);
        }
    }
}

function populateExtensionCommandPages(helpBook) {
    const extensions = Extensions.getAll();
    for (const extension of extensions) {
        let commands = extension.getCommands();
        commands = commands.filter(cmd => !cmd.isHelpHidden());
        if (commands.length > 0) {
            const commandPage = new CommandHelpPage({ title: `Commands`, description: { translate: 'commands.help.extension.commands', with: [extension.getName()] } }, extension.getName());
            helpBook.newPage(commandPage);
            for (const command of commands) 
                helpBook.addEntry(commandPage.title, command);
        }
    }
}
