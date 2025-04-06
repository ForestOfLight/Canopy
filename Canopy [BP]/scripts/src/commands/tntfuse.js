import { Command } from "../../lib/canopy/Canopy";
import { isNumeric } from "../../include/utils";
import { commandTntFuse } from "../rules/commandTntFuse";

const MIN_FUSE_TICKS = 1;
const MAX_FUSE_TICKS = 72000;

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

export function tntfuseCommand(sender, args) {
    let { ticks } = args;
    if (ticks === 'reset') {
        ticks = 80;
        sender.sendMessage({ translate: 'commands.tntfuse.reset.success' });
        commandTntFuse.setGlobalFuseTicks(ticks);
    } else if (isNumeric(ticks) && ticks >= MIN_FUSE_TICKS && ticks <= MAX_FUSE_TICKS) {
        sender.sendMessage({ translate: 'commands.tntfuse.set.success', with: [String(ticks)] });
        commandTntFuse.setGlobalFuseTicks(ticks);
    } else if (ticks !== null && (!isNumeric(ticks) || ticks < MIN_FUSE_TICKS || ticks > MAX_FUSE_TICKS)) {
        sender.sendMessage({ translate: 'commands.tntfuse.set.fail', with: [String(ticks), String(MIN_FUSE_TICKS), String(MAX_FUSE_TICKS)] });
    } else {
        cmd.sendUsage(sender);
    }
}
