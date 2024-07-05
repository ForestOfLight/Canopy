import * as mc from '@minecraft/server'
import { module } from 'stickycore/dynamic'
import Command from 'stickycore/command'
import Data from 'stickycore/data'
import { resetCounterMap } from 'src/commands/counter'

class DependantFeature {
    constructor(validFeature, dependantFeature) {
        this.validFeature = validFeature;
        this.dependantFeature = dependantFeature;
    }
}

class DependantFeatures {
    constructor() {
        this.dependantFeatures = [
            new DependantFeature('jumpInSurvival', 'jump'),
            new DependantFeature('warpInSurvival', 'warp'),
        ];
    }
}

new Command()
    .setName('feature')
    .addArgument('string', 'feature')
    .addArgument('boolean', 'enable')
    .setCallback(featureCommand)
    .build()

function featureCommand(sender, args) {
    const features = module.exports['features'];
    const { feature, enable } = args;
    const loweredFeature = feature.toLowerCase();
    const validFeature = features[loweredFeature];

    if (enable === undefined) return sender.sendMessage(`§cUsage: ./feature <feature> <true/false>.`);
    if (!validFeature) return sender.sendMessage(`§cInvalid feature: ${feature}`);
    if (enable === mc.world.getDynamicProperty(validFeature)) return sender.sendMessage(`§7${feature} is already ${enable ? '§l§aenabled' : '§l§cdisabled'}.`);

    if (validFeature === 'hopperCounters' && !enable) resetCounterMap();
    updateDependantFeatures(sender, validFeature, enable);
    
    Data.updateFeature(sender, validFeature, enable, true);
}

function updateDependantFeatures(sender, validFeature, enable) {
    for (const dependantFeature of new DependantFeatures().dependantFeatures) {
        let targetFeature;
        if (enable && validFeature === dependantFeature.validFeature)
            targetFeature = dependantFeature.dependantFeature;
        else if (!enable && validFeature === dependantFeature.dependantFeature)
            targetFeature = dependantFeature.validFeature;
        else continue;

        Data.updateFeature(sender, targetFeature, enable, true);
    }
}