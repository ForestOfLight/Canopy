import { Command, Rule, InfoDisplayRule } from 'lib/canopy/Canopy';
import { HelpBook, CommandHelpPage, RuleHelpPage, InfoDisplayRuleHelpPage } from 'lib/canopy/Canopy';

const COMMANDS_PER_PAGE = 7;
const helpBook = new HelpBook();

const cmd = new Command({
    name: 'help',
    description: 'Displays help pages.',
    usage: 'help [pageName]',
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
    else if (helpBook.getPageNames().includes(pageName))
        helpBook.printPage(pageName, sender);
    else {
        cmd.setUsage(`help [${helpBook.getPageNames().join('/')}]`);
        cmd.sendUsage(sender);
    }
}

function populateNativeCommandPages(helpBook) {
    let commands = Command.getNativeCommands();
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
    const infoDisplayPage = new InfoDisplayRuleHelpPage('InfoDisplay', 'Togglable rules for your InfoDisplay.', Command.prefix + 'info <rule/all> <true/false>');
    const infoDisplayRules = InfoDisplayRule.getRules();
    helpBook.newPage(infoDisplayPage);
    for (let infoDisplayRule of infoDisplayRules) {
        helpBook.addEntry(infoDisplayRule.getCategory(), infoDisplayRule, player);
    }

    const rulesPage = new RuleHelpPage('Rules', 'Togglable global rules.', Command.prefix + 'canopy <rule> <true/false>');
    const globalRules = Rule.getRulesByCategory('Rules');
    helpBook.newPage(rulesPage);
    for (let rule of globalRules) {
        helpBook.addEntry(rule.getCategory(), rule);
    }
}

function populateExtensionPages(helpBook) {
    const ruleExtensions = Rule.getExtensionNames();
    const commandExtensions = Command.getExtensionNames();

    for (const extensionName of ruleExtensions) {
        const rulePage = new RuleHelpPage(`Rules`, `Togglable rules for §a${extensionName}§2.`, Command.prefix + `canopy <rule> <true/false>`, extensionName);
        const rules = Rule.getRulesByExtension(extensionName);
        helpBook.newPage(rulePage);
        for (let rule of rules) {
            helpBook.addEntry(rulePage.title, rule);
        }
    }

    for (const extensionName of commandExtensions) {
        const commandPage = new CommandHelpPage(`Commands`, `Commands for §a${extensionName}§2.`, extensionName);
        let commands = Command.getCommandsByExtension(extensionName);
        commands = commands.filter(cmd => !cmd.isHelpHidden());
        helpBook.newPage(commandPage);
        for (let command of commands) {
            helpBook.addEntry(commandPage.title, command);
        }
    }
}
