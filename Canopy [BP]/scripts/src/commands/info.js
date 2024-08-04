import Command from 'stickycore/command'
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

new Command()
    .setName('info')
    .addArgument('string', 'feature')
    .addArgument('boolean', 'enable')
    .setCallback(infoDisplayFeatures)
    .build()

new Command()
    .setName('i')
    .addArgument('string', 'feature')
    .addArgument('boolean', 'enable')
    .setCallback(infoDisplayFeatures)
    .build()

function infoDisplayFeatures(sender, args) {
    const features = module.exports['infoDisplay'];
    const { feature, enable } = args;
    if (feature === null || enable === null) return sender.sendMessage(`§cUsage: ./info <feature/all> <true/false>`);

    if (feature.toLowerCase() === 'all') {
        for (let entry of Object.values(features)) {
            sender.setDynamicProperty(entry, enable);
        }
        return sender.sendMessage(`${enable ? '§l§aEnabled' : '§l§cDisabled'}§r§7 all InfoDisplay features.`);
    }
    
    const validFeature = features[feature.toLowerCase()];
    if (!validFeature) return sender.sendMessage(`§c${feature} not found.`);
    if (enable === sender.getDynamicProperty(validFeature)) return sender.sendMessage(`§7${feature} is already ${enable ? '§l§aenabled' : '§l§cdisabled'}.`);

    if (validFeature === 'light' && !enable) 
        ProbeManager.removeProbe(sender);
    updateDependantFeatures(sender, validFeature, enable);

    Data.updateFeature(sender, validFeature, enable);
}

function updateDependantFeatures(sender, validFeature, enable) {
    for (const dependantFeature of new DependantFeatures().dependantFeatures) {
        let targetFeature = null;
        if (shouldEnableDependantFeature(sender, validFeature, dependantFeature))
            targetFeature = dependantFeature.dependantFeature;
        else if (shouldDisableDependantFeature(sender, validFeature, dependantFeature))
            targetFeature = dependantFeature.validFeature;
        else continue;

        Data.updateFeature(sender, targetFeature, enable);
    }
}

function shouldEnableDependantFeature(sender, validFeature, dependantFeature) {
    return enable && validFeature === dependantFeature.validFeature && !sender.getDynamicProperty(dependantFeature.dependantFeature);
}

function shouldDisableDependantFeature(sender, validFeature, dependantFeature) {
    return !enable && validFeature === dependantFeature.dependantFeature && sender.getDynamicProperty(dependantFeature.validFeature);
}
