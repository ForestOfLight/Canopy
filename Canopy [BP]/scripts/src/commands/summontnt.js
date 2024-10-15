import { Rule, Command } from 'lib/canopy/Canopy'
import Utils from 'stickycore/utils'

new Rule({
    category: 'Rules',
    identifier: 'commandSummonTnt',
    description: { translate: 'rules.commandSummonTnt' }
});

new Command({
    name: 'summontnt',
    description: { translate: 'commands.summontnt' },
    usage: 'summontnt <amount>',
    args: [
        { type: 'number', name: 'amount' }
    ],
    callback: summonTntCommand,
    contingentRules: ['commandSummonTnt']
});

function summonTntCommand(sender, args) {
    if (!['creative', 'spectator'].includes(sender.getGameMode()))
        return sender.sendMessage({ translate: 'commands.generic.blocked.survival' });
    let { amount } = args;

    amount = Math.max(0, Math.min(amount, 5000));
    if (amount === 0)
        return sender.sendMessage({ translate: 'commands.summontnt.fail.none' });
    const message = { translate: 'commands.summontnt.success', with: [String(amount)] };
    sender.sendMessage(message);
    Utils.broadcastActionBar({ rawtext: [{ text: `[${sender.name}] ` }, message] }, sender);
    for (let i = 0; i < amount; i++) {
        sender.dimension.spawnEntity('minecraft:tnt', sender.location);
    }
}