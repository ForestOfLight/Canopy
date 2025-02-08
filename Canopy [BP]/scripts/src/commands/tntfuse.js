import { Rule, Rules, Command } from "../../lib/canopy/Canopy";
import { system, world } from '@minecraft/server'

const MIN_FUSE_TICKS = 1;
const MAX_FUSE_TICKS = 72000;

new Rule({
    category: 'Rules',
    identifier: 'commandTntFuse',
    description: { translate: 'rules.commandTntFuse' }
});

const cmd = new Command({
    name: 'tntfuse',
    description: { translate: 'commands.tntfuse' },
    usage: 'tntfuse <ticks/reset>',
    args: [
        { type: 'number|string', name: 'ticks' }
    ],
    callback: tntfuseCommand,
    contingentRules: ['commandTntFuse']
});

world.afterEvents.entitySpawn.subscribe((event) => {
    if (event.entity?.typeId !== 'minecraft:tnt') return;
    const fuseTimeProperty = world.getDynamicProperty('tntFuseTime');
    let fuseTime = 80;
    if (fuseTimeProperty !== undefined && Rules.getNativeValue('commandTntFuse'))
        fuseTime = fuseTimeProperty;

    if (fuseTime === 1) {
        event.entity.triggerEvent('canopy:explode');
    } else {
        event.entity.triggerEvent('canopy:fuse');
        system.runTimeout(() => {
            if (event.entity.isValid())
                event.entity.triggerEvent('canopy:explode');
        }, fuseTime - 1);
    }
});

function tntfuseCommand(sender, args) {
    let { ticks } = args;
    if (ticks === null) {
        return cmd.sendUsage(sender);
    } else if (ticks === 'reset') {
        ticks = 80;
        sender.sendMessage({ translate: 'commands.tntfuse.reset.success' });
    } else if (ticks < MIN_FUSE_TICKS || ticks > MAX_FUSE_TICKS)
        {return sender.sendMessage({ translate: 'commands.tntfuse.set.fail', with: [String(ticks), String(MIN_FUSE_TICKS), String(MAX_FUSE_TICKS)] });}
    else {
        sender.sendMessage({ translate: 'commands.tntfuse.set.success', with: [String(ticks)] });
    }
    world.setDynamicProperty('tntFuseTime', ticks);
}
