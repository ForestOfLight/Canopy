import { Command, Rule } from 'lib/canopy/Canopy';
import { HelpBook, CommandHelpPage, RuleHelpPage } from 'lib/canopy/Canopy';

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
    populateNativeRulePages(helpBook);
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
    if (helpBook.numNativeCommandPages >= commands.length / 10)
        return;

    for (let i = 0; i < commands.length; i++) {;
        if (i % 10 === 0) {
            helpBook.numNativeCommandPages++;
            helpBook.newPage(new CommandHelpPage(helpBook.numNativeCommandPages));
        }
        const command = commands[i];
        helpBook.addEntry(helpBook.numNativeCommandPages, command);
    }
}

function populateNativeRulePages(helpBook) {
    const infoDisplayPage = new RuleHelpPage('InfoDisplay', 'Togglable rules for your InfoDisplay.', Command.prefix + 'info <rule/all> <true/false>');
    const infoDisplayRules = Rule.getRulesByCategory('InfoDisplay');
    helpBook.newPage(infoDisplayPage);
    for (let rule of infoDisplayRules) {
        helpBook.addEntry(rule.getCategory(), rule);
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
        const rulePage = new RuleHelpPage(`Rules`, `Togglable rules for ${extensionName}.`, Command.prefix + `canopy <rule> <true/false>`, extensionName);
        const rules = Rule.getRulesByExtension(extensionName);
        helpBook.newPage(rulePage);
        for (let rule of rules) {
            helpBook.addEntry(rulePage.title, rule);
        }
    }

    for (const extensionName of commandExtensions) {
        const commandPage = new CommandHelpPage(`Commands`, `Commands for ${extensionName}.`, extensionName);
        let commands = Command.getCommandsByExtension(extensionName);
        commands = commands.filter(cmd => !cmd.isHelpHidden());
        helpBook.newPage(commandPage);
        for (let command of commands) {
            helpBook.addEntry(commandPage.title, command);
        }
    }
}
