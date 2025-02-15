import { Command } from "../../lib/canopy/Canopy";
import { sit } from "../rules/playerSit";

new Command({
    name: 'sit',
    description: { translate: 'commands.sit' },
    usage: 'sit',
    args: [
        { type: 'number', name: 'distance' },
    ],
    callback: sitCommand,
    contingentRules: ['playerSit']
});

function sitCommand(sender, args) {
    if (sender?.getComponent('riding')?.entityRidingOn)
        return sender.sendMessage({ translate: 'commands.sit.busy' });
    sit(sender, args);
}