import { Command, InfoDisplayRule, Extensions, Rules, Commands } from "../../lib/canopy/Canopy";
import { PACK_VERSION } from "../../constants";
import CounterChannels from '../classes/CounterChannels';

const cmd = new Command({
    name: 'canopy',
    description: { translate: 'commands.canopy' },
    usage: 'canopy <rule/version> [true/false]',
    args: [
        { type: 'string|array', name: 'ruleIDs' },
        { type: 'boolean', name: 'enable' },
    ],
    callback: canopyCommand,
    helpEntries: [
        { usage: 'canopy version', description: { translate: 'commands.canopy.version' } },
        { usage: 'canopy <rule> [true/false]', description: { translate: 'commands.canopy.single' } },
        { usage: 'canopy <[rule1,rule2,...]> [true/false]', description: { translate: 'commands.canopy.multiple' } },
    ],
    adminOnly: true
});

async function canopyCommand(sender, args) {
    const { ruleIDs, enable } = args;
    if (ruleIDs === null && enable === null)
        return cmd.sendUsage(sender);

    if (typeof ruleIDs === 'string' && ruleIDs === 'version')
        return sender.sendMessage(getVersionMessage());
    else if (typeof ruleIDs === 'string')
        return handleRuleChange(sender, ruleIDs, enable);
    for (const ruleID of ruleIDs)
        await handleRuleChange(sender, ruleID, enable);
}

function getVersionMessage() {
    const message = { rawtext: [
        { translate: 'commands.canopy.version.message', with: [PACK_VERSION] },
        { text: '§r§7.' }
    ]};
    const extensionNames = Extensions.getVersionedNames();
    if (extensionNames.length === 0) return message;
    message.rawtext.push({ translate: 'commands.canopy.version.extensions' });
    for (const extensionName of extensionNames)
        message.rawtext.push({ text: ` ${extensionName}` });
    message.rawtext.push({ text: '§r§7.' });
    return message;
}

async function handleRuleChange(sender, ruleID, enable) {
    if (!Rules.exists(ruleID))
        return sender.sendMessage({ translate: 'rules.generic.unknown', with: [ruleID, Commands.getPrefix()] });
    const rule = Rules.get(ruleID);
    if (rule instanceof InfoDisplayRule)
        return sender.sendMessage({ translate: 'commands.canopy.infodisplayRule', with: [ruleID, Commands.getPrefix()] });
    const ruleValue = await rule.getValue();
    const enabledRawText = ruleValue ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' }
    if (enable === null)
        return sender.sendMessage({ rawtext: [{ translate: 'rules.generic.status', with: [rule.getID()] }, enabledRawText, { text: '§r§7.' }] });
    if (ruleValue === enable)
        return sender.sendMessage({ rawtext: [{ translate: 'rules.generic.nochange', with: [rule.getID()] }, enabledRawText, { text: '§r§7.' }] });

    if (ruleID === 'hopperCounters' && !enable)
        CounterChannels.resetAllCounts();

    if (enable)
        await updateRules(sender, rule.getContigentRuleIDs(), enable);
    else
        await updateRules(sender, rule.getDependentRuleIDs(), enable);
    await updateRules(sender, rule.getIndependentRuleIDs(), false);
    
    await updateRule(sender, ruleID, enable);
}

async function updateRule(sender, ruleID, enable) {
    const ruleValue = await Rules.getValue(ruleID);
    if (ruleValue === enable) return;
    Rules.get(ruleID).setValue(enable);
    const enabledRawText = enable ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
    return sender.sendMessage({ rawtext: [{ translate: 'rules.generic.updated', with: [ruleID] }, enabledRawText, { text: '§r§7.' }] });
}

async function updateRules(sender, ruleIDs, enable) {
    for (const ruleID of ruleIDs) 
        await updateRule(sender, ruleID, enable);
}
