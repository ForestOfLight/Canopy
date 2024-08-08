import { world } from '@minecraft/server'
import { module } from 'stickycore/dynamic'
import Command from 'stickycore/command'
import Data from 'stickycore/data'
import { resetCounterMap } from 'src/commands/counter'

class RelatedFeatures {
    constructor() {
        this.dependancies = [
            { validFeature: 'commandJump', dependantFeature: 'commandJumpSurvival' },
            { validFeature: 'commandWarp', dependantFeature: 'commandWarpSurvival' },
            { validFeature: 'hotbarSwitching', dependantFeature: 'hotbarSwitchingSurvival' },
            { validFeature: 'instantTame', dependantFeature: 'instantTameSurvival' },
        ];
        this.independancies = [
            { featureOne: 'explosionChainReactionOnly', featureTwo: 'explosionNoBlockDamage' },
        ]
    }
}

new Command()
    .setName('feature')
    .addArgument('string', 'feature')
    .addArgument('boolean', 'enable')
    .setCallback(featureCommand)
    .build()

function featureCommand(sender, args) {
    const globalFeatures = module.exports['features'];
    const { feature, enable } = args;
    const loweredFeature = feature.toLowerCase();

    if (feature === null || enable === null)
        return sender.sendMessage(`§cUsage: ./feature <feature> <true/false>`);
    if (!isValidFeature(loweredFeature)) 
        return sender.sendMessage(`§cInvalid feature: ${feature}`);

    const isGlobal = true;
    const validFeature = globalFeatures[loweredFeature];

    if (!sender.hasTag('CanopyAdmin'))
        return sender.sendMessage(`§cYou do not have permission to modify ${feature}.`);
    else if (enable === world.getDynamicProperty(validFeature))
        return sender.sendMessage(`§7${feature} is already ${enable ? '§l§aenabled' : '§l§cdisabled'}§r§7.`);

    if (validFeature === 'hopperCounters' && !enable)
        resetCounterMap();

    updateIndependantFeatures(sender, validFeature, enable, isGlobal);
    updateDependantFeatures(sender, validFeature, enable, isGlobal);
    
    Data.updateFeature(sender, validFeature, enable, isGlobal);
}

function isValidFeature(feature) {
    return module.exports['features'][feature] !== undefined;
}

function updateIndependantFeatures(sender, feature, enable, isGlobal) {
    for (const featurePair of new RelatedFeatures().independancies) {
        if (feature === featurePair.featureOne || feature === featurePair.featureTwo) {
            let targetFeature;
            if (feature === featurePair.featureOne && enable && world.getDynamicProperty(featurePair.featureTwo)) {
                targetFeature = featurePair.featureTwo;
            } else if (feature === featurePair.featureTwo && enable && world.getDynamicProperty(featurePair.featureOne)) {
                targetFeature = featurePair.featureOne;
            } else continue;

            enable = false;
            Data.updateFeature(sender, targetFeature, enable, isGlobal);
        }
    }
}

function updateDependantFeatures(sender, feature, enable, isGlobal) {
    for (const featurePair of new RelatedFeatures().dependancies) {
        let targetFeature;
        if (enable && feature === featurePair.dependantFeature && !world.getDynamicProperty(featurePair.validFeature))
            targetFeature = featurePair.validFeature;
        else if (!enable && feature === featurePair.validFeature && world.getDynamicProperty(featurePair.dependantFeature))
            targetFeature = featurePair.dependantFeature;
        else continue;

        Data.updateFeature(sender, targetFeature, enable, isGlobal);
    }
}