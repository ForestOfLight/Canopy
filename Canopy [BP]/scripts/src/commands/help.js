import { world } from '@minecraft/server'
import Command from 'stickycore/command'
import { module } from 'stickycore/dynamic'
import Utils from 'stickycore/utils'

class CommandItem {
    constructor(name, syntax, description) {
        this.name = name;
        this.syntax = syntax;
        this.description = description;
    }
}

class DynamicItem {
    constructor(name) {
        this.name = name;
    }
}

class HelpPage {
    constructor(title, isDynamic = false) {
        this.title = title;
        this.description = '';
        this.items = [];
        this.isDynamic = isDynamic;
    }

    addItem(name, syntax, description) {
        this.items.push(new CommandItem(name, syntax, description));
    }

    addDynamicItems(itemNames) {
        for (let itemName of itemNames) {
            this.items.push(new DynamicItem(itemName));
        }
    }

    setDescription(description) {
        this.description = description;
    }
}

class HelpBook {
    numDynamicPages = 0;

    constructor() {
        this.helpPages = {};
    }

    addPage(name, page) {
        this.helpPages[name] = page;
    }

    addDynamicPages() {
        const infoDisplayModule = module.exports['infoDisplay'];
        const featuresModule = module.exports['features'];
        const dynamicPages = { 'infodisplay': infoDisplayModule, 'features': featuresModule };
    
        for (let pageName of Object.keys(dynamicPages)) {
            this.numDynamicPages++;
            this.addPage(pageName, new HelpPage(pageName, true));
            const dynamicNames = Object.values(dynamicPages[pageName]);
            this.helpPages[pageName].addDynamicItems(dynamicNames);
        }
        this.helpPages['infodisplay'].setDescription('./info <feature/all> <true/false>');
        this.helpPages['features'].setDescription('./feature <feature> <true/false>');
    }

    addCommandPages() {
        this.addPage(1, new HelpPage(1));
        this.addPage(2, new HelpPage(2));
        this.addPage(3, new HelpPage(3));
        this.addPage(4, new HelpPage(4));
    
        this.helpPages[1].addItem('help', './help [infodisplay/features/page number]', 'Displays help pages.');
        this.helpPages[1].addItem('camera', './camera place', 'Places a camera at your current location. (alias: ./cp)');
        this.helpPages[1].addItem('camera', './camera view', 'Toggles viewing your latest camera placement. (alias: ./cv)');
        this.helpPages[1].addItem('camera', './camera spectate', 'Survival-friendly spectator mode. Toggles freecam. (alias: ./cs)');
        this.helpPages[1].addItem('changedimension', './changedimension <dimension> [x y z]', 'Teleports you to the specified dimension.');
        this.helpPages[1].addItem('claimprojectiles', './claimprojectiles [playerName]', 'Changes the owner of all projectiles within a 10 block radius.');
        this.helpPages[1].addItem('hopper counters', './counter [color/all]', 'Displays the count and rates of the hopper counters. (alias: ./ct)');
        this.helpPages[1].addItem('hopper counters', './counter <color/all> <mode>', 'Sets the mode of a hopper counter: countMode, perhourMode, perminuteMode, or persecondMode. (alias: ./ct)');
        this.helpPages[1].addItem('hopper counters', './counter realtime', 'Toggles real-world time and tick-based time to do rate calculations. (alias: ./ct)');
        this.helpPages[1].addItem('data', './data', 'Displays information about the block you are looking at.');

        this.helpPages[2].addItem('distance', './distance target', 'Calculates the distance between you and the block or entity you are looking at. (alias: ./d)');
        this.helpPages[2].addItem('distance', './distance from <x y z> to [x y z]', 'Calculates the distance between two points. (alias: ./d)');
        this.helpPages[2].addItem('distance', './distance from [x y z]', 'Saves a location to calculate distance to later. (alias: ./d)');
        this.helpPages[2].addItem('distance', './distance to [x y z]', 'Calculates the distance from the saved location to the specified location. (alias: ./d)');
        this.helpPages[2].addItem('entity density', './entitydensity [dimension] <grid size>', 'Identifies dense areas of entities in the specified dimension.');
        this.helpPages[2].addItem('gamemode', './s, ./c, ./sp', 'Easy gamemode switching.');
        this.helpPages[2].addItem('health', './health', 'Displays the server\'s current TPS, MSPT, and entity counts.');
        this.helpPages[2].addItem('jump', './jump', 'Teleports you to the block you\'re looking at. (alias: ./j)');
        this.helpPages[2].addItem('log', './log <tnt/projectiles/falling_blocks> [precision]', 'Logs the location of the specified entity type in chat.');
        this.helpPages[2].addItem('peek', './peek [search term]', 'Peeks at a block or entity\'s inventory. Use the search term to highlight items that include it. (alias: ./p)');
        
        this.helpPages[3].addItem('spawn', './spawn entities', 'Displays a list of all entities in the world.');
        this.helpPages[3].addItem('spawn', './spawn recent [mobname]', 'Displays all mob spawns in the last 30s. Optionally specify a mob name to filter results.');
        this.helpPages[3].addItem('spawn', './spawn tracking start [x1 y1 z1] [x2 y2 z2]', 'Starts tracking mob spawns. Specify coords to track spawns within that area.');
        this.helpPages[3].addItem('spawn', './spawn tracking <mobname> [x1 y1 z1] [x2 y2 z2]', 'Starts tracking a specific mob spawn. Specify coords to track spawns within that area. Run this again to add more mob types to track.');
        this.helpPages[3].addItem('spawn', './spawn tracking', 'Displays a summary of all spawns that have occurred since the start of your test.');
        this.helpPages[3].addItem('spawn', './spawn tracking stop', 'Stops tracking mob spawns.');
        this.helpPages[3].addItem('spawn', './spawn mocking <true/false>', 'Enables/disables mob spawning while allowing the spawning algorithm to run.');
        this.helpPages[3].addItem('spawn', './spawn test', 'Resets spawn tracking data and all hopper counters.');
        this.helpPages[3].addItem('summon tnt', './summontnt <amount>', 'Summons the specified amount of primed TNT entity at your location.');
        this.helpPages[3].addItem('tick', './tick <mspt>', 'Slows down the server tick speed to the specified mspt.');
        
        this.helpPages[4].addItem('tick', './tick step [steps]', 'Allows the server to run at normal speed for the specified amount of steps.');
        this.helpPages[4].addItem('tick', './tick reset', 'Resets the server tick speed to normal.');
        this.helpPages[4].addItem('trackevent', './trackevent <eventName> [beforeEvent/afterEvent]', 'Toggles counting the specified event in the InfoDisplay.');
        this.helpPages[4].addItem('warp', './warp <name>', 'Teleports you to a warp. (alias: ./w)');
        this.helpPages[4].addItem('warp', './warp <add/remove> <name>', 'Adds or removes a warp. (alias: ./w)');
        this.helpPages[4].addItem('warps', './warps', 'Lists all available warps.');
        this.helpPages[4].addItem('reset all', './resetall', 'Resets all §l§aCanopy§r§7 features and data.');
    }
}

new Command()
    .setName('help')
    .addArgument('string|number', 'pageName')
    .setCallback(helpCommand)
    .build()

function helpCommand(sender, args) {
    const helpBook = new HelpBook();
    helpBook.addDynamicPages(helpBook);
    helpBook.addCommandPages(helpBook);

    const { pageName } = args;
    if (pageName === null)
        printAllHelp(sender, helpBook);
    else if (pageName === 'infodisplay' || pageName === 'features' || (pageName > 0 && pageName < helpBook.numDynamicPages + 1))
        printHelpPage(sender, helpBook, pageName)
    else
        sender.sendMessage('§cUsage: ./help [infodisplay/features/page number]');
}

function printAllHelp(sender, helpBook) {
    for (let page of Object.values(helpBook.helpPages)) {
        printHelpPage(sender, helpBook, page.title);
    }
}

function printHelpPage(sender, helpBook, pageName) {
    if (!Utils.isNumeric(pageName))
        pageName = pageName.toLowerCase();
    const page = helpBook.helpPages[pageName];
    const numCommandPages = Object.keys(helpBook.helpPages).length - helpBook.numDynamicPages;
    let output;

    output = `§l§aCanopy§r §2Help Page:§r `;
    if (Utils.isNumeric(pageName)) output += `${pageName} of ${numCommandPages}`;
    else output += `${page.title}\n§2${page.description}`;

    for (let item of page.items) {
        if (page.isDynamic) {
            let value;
            if (pageName == 'infodisplay') value = sender.getDynamicProperty(item.name);
            else if (pageName == 'features') value = world.getDynamicProperty(item.name);
            if (value === undefined) value = false;
            value = value ? '§atrue' : '§cfalse';
            output += `\n  §7- ${item.name}: ${value}`;
        } else {
            output += `\n  §2${item.syntax} §7- ${item.description}`;
        }
    }
    sender.sendMessage(output);
}