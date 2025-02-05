import { Rule, Command, InfoDisplayRule } from 'lib/canopy/Canopy';
import { resetCounterMap } from 'src/commands/counter';

const cmd = new Command({
    name: 'canopy',
    description: { translate: 'commands.canopy' },
    usage: 'canopy <rule> [true/false]',
    args: [
        { type: 'string|array', name: 'ruleIDs' },
        { type: 'boolean', name: 'enable' },
    ],
    callback: canopyCommand,
    helpEntries: [
        { usage: 'canopy <rule> [true/false]', description: { translate: 'commands.canopy.single' } },
        { usage: 'canopy <[rule1,rule2,...]> [true/false]', description: { translate: 'commands.canopy.multiple' } },
    ],
    adminOnly: true
});

async function canopyCommand(sender, args) {
    const { ruleIDs, enable } = args;
    if (ruleIDs === null && enable === null)
        return cmd.sendUsage(sender);

    if (typeof ruleIDs === 'string')
        return handleRuleChange(sender, ruleIDs, enable);
    for (const ruleID of ruleIDs)
        await handleRuleChange(sender, ruleID, enable);
}

async function handleRuleChange(sender, ruleID, enable) {
    if (!Rule.exists(ruleID))
        return sender.sendMessage({ translate: 'rules.generic.unknown', with: [ruleID, Command.prefix] });
    const rule = Rule.getRule(ruleID);
    if (rule instanceof InfoDisplayRule)
        return sender.sendMessage({ translate: 'commands.canopy.infodisplayRule', with: [ruleID, Command.prefix] });
    const ruleValue = await rule.getValue();
    const enabledRawText = ruleValue ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' }
    if (enable === null)
        return sender.sendMessage({ rawtext: [{ translate: 'rules.generic.status', with: [rule.getID()] }, enabledRawText, { text: '§r§7.' }] });
    if (ruleValue === enable)
        return sender.sendMessage({ rawtext: [{ translate: 'rules.generic.nochange', with: [rule.getID()] }, enabledRawText, { text: '§r§7.' }] });

    if (ruleID === 'hopperCounters' && !enable)
        resetCounterMap();

    if (enable)
        await updateRules(sender, rule.getContigentRuleIDs(), enable);
    else
        await updateRules(sender, rule.getDependentRuleIDs(), enable);
    await updateRules(sender, rule.getIndependentRuleIDs(), false);
    
    await updateRule(sender, ruleID, enable);
}

async function updateRule(sender, ruleID, enable) {
    const ruleValue = await Rule.getValue(ruleID);
    if (ruleValue === enable) return;
    Rule.getRule(ruleID).setValue(enable);
    const enabledRawText = enable ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
    return sender.sendMessage({ rawtext: [{ translate: 'rules.generic.updated', with: [ruleID] }, enabledRawText, { text: '§r§7.' }] });
}

async function updateRules(sender, ruleIDs, enable) {
    for (const ruleID of ruleIDs) 
        await updateRule(sender, ruleID, enable);
}
