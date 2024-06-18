import * as mc from '@minecraft/server'
import Command from 'stickycore/command'

new Command()
    .setName('plotlist')
    .setCallback(plotListCommand)
    .build()

new Command()
    .setName('plot')
    .addArgument('string', 'action')
    .addArgument('string', 'name')
    .setCallback(plotActionCommand)
    .build()

new Command()
    .setName('pl')
    .addArgument('string', 'action')
    .addArgument('string', 'name')
    .setCallback(plotActionCommand)
    .build()

class Plot {
    constructor(name, location, dimension) {
        this.name = name;
        this.location = location;
        this.dimension = dimension;
    }
}

class Plots {
    constructor() {
        this.plotList = new Map();
    }
}

function getPlotMapCopy() {
    let plots = mc.world.getDynamicProperty('plots');
    if (plots === undefined) {
        let initPlots = new Plots();
        mc.world.setDynamicProperty(`plots`, JSON.stringify(initPlots));
        plots = mc.world.getDynamicProperty('plots');
    } 
    return new Map(Object.entries(JSON.parse(plots).plotList));
}

function setPlotMap(newPlotMap) {
    let plots = JSON.parse(mc.world.getDynamicProperty('plots'));

    let newPlotList = {};
    for (let [key, value] of Object.entries(plots.plotList)) {
        if (!newPlotMap.has(key)) continue;
        newPlotList[key] = newPlotMap.get(key);
    }
    plots.plotList = newPlotList;
    mc.world.setDynamicProperty(`plots`, JSON.stringify(plots));
}

function addPlot(name, sender) {
    const { location, dimension } = sender;
    let plotMap = getPlotMapCopy();

    if (plotMap.has(name)) {
        sender.sendMessage(`§cPlot "${name}" already exists. Use ./plotlist to see the list of plots.`);
        return;
    }

    let plots = JSON.parse(mc.world.getDynamicProperty('plots'));
    plots.plotList[name] = new Plot(name, location, dimension);
    mc.world.setDynamicProperty(`plots`, JSON.stringify(plots));
    sender.sendMessage(`§aPlot "${name}" has been added.`);
}

function removePlot(name, sender) {
    let plotMap = getPlotMapCopy();

    if (!plotMap.has(name)) {
        sender.sendMessage(`§cPlot "${name}" not found. Use ./plotlist to see the list of plots.`);
        return;
    }

    plotMap.delete(name);
    setPlotMap(plotMap);
    sender.sendMessage(`§7Plot "${name}" has been removed.`);
}

function plotListCommand(sender) {
    let plotMap = getPlotMapCopy();

    if (plotMap.size === 0) {
        sender.sendMessage('§7There are no plots.');
        return;
    }

    let output = '§2Available Plots:§r';
    plotMap.forEach((currPlot) => {
        output += `\n§7- ${currPlot.name}§r`;
    });

    sender.sendMessage(output);
}

function plotTPCommand(sender, args) {
    if (sender.getGameMode() === 'survival' || sender.getGameMode() === 'adventure') {
        sender.sendMessage('§cYou cannot teleport while in survival mode.');
        return;
    }

    const { name } = args;
    const plotMap = getPlotMapCopy();
    const plot = plotMap.get(name);

    if (plot === undefined) {
        sender.sendMessage(`§cPlot "${name}" not found. Use ./plotlist to see the list of plots.`);
        return;
    } else if (plot.dimension.id !== sender.dimension.id) {
        sender.sendMessage(`§cPlease go to ${plot.dimension.id} to teleport to "${name}".`);
        return;
    }

    sender.teleport({ x: plot.location.x, y: plot.location.y, z: plot.location.z });
    sender.sendMessage(`§aTeleported to plot "${name}".`);
}

function plotActionCommand(sender, args) {
    const { action, name } = args;
    const plotMap = getPlotMapCopy();

    if (action === 'add') {
        addPlot(name, sender);
    } else if (action === 'remove') {
        removePlot(name, sender);
    } else if (action === 'tp') {
        plotTPCommand(sender, args);
    } else {
        sender.sendMessage('§cInvalid command. Usage: ./plot <tp/add/remove> <name>');
    }
}