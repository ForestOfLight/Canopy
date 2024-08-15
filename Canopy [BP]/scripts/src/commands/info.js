import { Command } from 'lib/canopy/Canopy'
import { module } from 'stickycore/dynamic'
import Data from 'stickycore/data'
import ProbeManager from 'src/classes/ProbeManager';

class DependantFeature {
    constructor(validFeature, dependantFeature) {
        this.validFeature = validFeature;
        this.dependantFeature = dependantFeature;
    }
}

class DependantFeatures {
    constructor() {
        this.dependantFeatures = [
            new DependantFeature('peekInventory', 'lookingAt'),
        ];
    }
}

const cmd = new Command({
    name: 'info',
    description: 'Toggle InfoDisplay features.',
    usage: 'info <feature/all> <true/false>',
    args: [
        { type: 'string', name: 'feature' },
        { type: 'boolean', name: 'enable' }
    ],
    callback: infoCommand
});

new Command({
    name: 'i',
    description: 'Toggle InfoDisplay features.',
    usage: 'i <feature/all> [true/false]',
    args: [
        { type: 'string', name: 'feature' },
        { type: 'boolean', name: 'enable' }
    ],
    callback: infoCommand
});

function infoCommand(sender, args) {
    const features = module.exports['infoDisplay'];
    const { feature, enable } = args;
    if (feature === null && enable === null) return cmd.sendUsage(sender);

    if (enable === null) return sender.sendMessage(`§7${feature} is currently ${sender.getDynamicProperty(features[feature.toLowerCase()]) ? '§l§aenabled' : '§l§cdisabled'}.`);

    if (feature.toLowerCase() === 'all') {
        for (let entry of Object.values(features)) {
            sender.setDynamicProperty(entry, enable);
        }
        if (!enable) clearInfoDisplay(sender);
        return sender.sendMessage(`${enable ? '§l§aEnabled' : '§l§cDisabled'}§r§7 all InfoDisplay features.`);
    }
    
    const validFeature = features[feature.toLowerCase()];
    if (!validFeature) return sender.sendMessage(`§c${feature} not found.`);
    if (enable === sender.getDynamicProperty(validFeature)) return sender.sendMessage(`§7${feature} is already ${enable ? '§l§aenabled' : '§l§cdisabled'}.`);

    if (validFeature === 'light' && !enable) 
        ProbeManager.removeProbe(sender);
    if (validFeature === 'showDisplay' && !enable)
        clearInfoDisplay(sender);
    updateDependantFeatures(sender, validFeature, enable);

    Data.updateFeature(sender, validFeature, enable);
}

function clearInfoDisplay(sender) {
    sender.onScreenDisplay.setTitle('');
}

function updateDependantFeatures(sender, validFeature, enable) {
    for (const dependantFeature of new DependantFeatures().dependantFeatures) {
        let targetFeature = null;
        if (shouldEnableDependantFeature(sender, validFeature, dependantFeature, enable))
            targetFeature = dependantFeature.dependantFeature;
        else if (shouldDisableDependantFeature(sender, validFeature, dependantFeature, enable))
            targetFeature = dependantFeature.validFeature;
        else continue;

        Data.updateFeature(sender, targetFeature, enable);
    }
}

function shouldEnableDependantFeature(sender, validFeature, dependantFeature, enable) {
    return enable && validFeature === dependantFeature.validFeature && !sender.getDynamicProperty(dependantFeature.dependantFeature);
}

function shouldDisableDependantFeature(sender, validFeature, dependantFeature, enable) {
    return !enable && validFeature === dependantFeature.dependantFeature && sender.getDynamicProperty(dependantFeature.validFeature);
}
