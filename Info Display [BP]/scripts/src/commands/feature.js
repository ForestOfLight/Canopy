import Command from 'stickycore/command'
import { module } from 'stickycore/dynamic'
import Data from 'stickycore/data'

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

    if (!sender.isOp()) return sender.sendMessage('§cYou do not have permission to use this command.');
    if (!validFeature) return sender.sendMessage(`§c${feature} not found.`);

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