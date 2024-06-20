import * as mc from '@minecraft/server'
import Command from 'stickycore/command'
import { module } from 'stickycore/dynamic'
import { updatePearls } from 'src/commands/tickPearl'

class DependantFeature {
    constructor(validFeature, dependantFeature, turnsOn) {
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
    const txtOut = enable ? '§l§aenabled' : '§l§cdisabled';

    if (!validFeature) return sender.sendMessage(`§c${feature} not found.`);

    if (validFeature === 'tickingPearls') updatePearls(sender, enable);

    updateDependantFeatures(sender, validFeature, enable, txtOut);

    mc.world.setDynamicProperty(validFeature, enable);
    sender.sendMessage(`§7${feature} has been ${txtOut}§r§7.`);
}

function updateDependantFeatures(sender, validFeature, enable, txtOut) {
    for (const dependantFeature of new DependantFeatures().dependantFeatures) {
        let targetFeature = null;
        if (enable && validFeature === dependantFeature.validFeature)
            targetFeature = dependantFeature.dependantFeature;
        else if (!enable && validFeature === dependantFeature.dependantFeature)
            targetFeature = dependantFeature.validFeature;
        else continue;

        mc.world.setDynamicProperty(targetFeature, enable);
        sender.sendMessage(`§7${targetFeature} has been ${txtOut}§r§7.`);
    }
}