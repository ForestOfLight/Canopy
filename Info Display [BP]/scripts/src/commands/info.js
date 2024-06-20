import Command from 'stickycore/command'
import { module } from 'stickycore/dynamic'

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
    const loweredFeature = feature.toLowerCase();
    const validFeature = features[loweredFeature];
    const txtOut = enable ? '§l§aenabled' : '§l§cdisabled';

    if (!validFeature) return sender.sendMessage(`§c${feature} not found.`);

    if (validFeature === 'all') {
        for (let entry of Object.values(features)) {
            sender.setDynamicProperty(entry, enable);
        }
    } else if (validFeature === 'peekInventory' && enable === true) {
        sender.setDynamicProperty('lookingAt', enable);
        sender.sendMessage(`§7lookingAt has been ${txtOut}§r§7.`);
        sender.setDynamicProperty(validFeature, enable);
    } else if (validFeature === 'lookingAt' && enable === false) {
        sender.setDynamicProperty('peekInventory', enable);
        sender.sendMessage(`§7peekInventory has been ${txtOut}§r§7.`);
        sender.setDynamicProperty(validFeature, enable);
    } else sender.setDynamicProperty(validFeature, enable);

    sender.sendMessage(`§7${feature} has been ${txtOut}§r§7.`);
}