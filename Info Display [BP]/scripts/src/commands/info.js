import Command from 'stickycore/command'
import { module } from 'stickycore/dynamic'
import Data from 'stickycore/data'

class DependantFeature {
    constructor(validFeature, dependantFeature, turnsOn) {
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
    const validFeature = features[feature.toLowerCase()];
    const enabledText = enable ? '§l§aenabled' : '§l§cdisabled';

    if (!validFeature) return sender.sendMessage(`§c${feature} not found.`);

    if (validFeature === 'all') {
        for (let entry of Object.values(features)) {
            sender.setDynamicProperty(entry, enable);
        }
        return sender.sendMessage(`${enabledText}§r§7 all InfoDisplay features.`);
    }

    updateDependantFeatures(sender, validFeature, enable);

    Data.updateFeature(sender, validFeature, enable);
}

function updateDependantFeatures(sender, validFeature, enable) {
    for (const dependantFeature of new DependantFeatures().dependantFeatures) {
        let targetFeature = null;
        if (enable && validFeature === dependantFeature.validFeature)
            targetFeature = dependantFeature.dependantFeature;
        else if (!enable && validFeature === dependantFeature.dependantFeature)
            targetFeature = dependantFeature.validFeature;
        else continue;

        Data.updateFeature(sender, targetFeature, enable);
    }
}
