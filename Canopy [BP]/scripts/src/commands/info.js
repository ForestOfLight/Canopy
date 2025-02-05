import { Command, InfoDisplayRule, Commands } from 'lib/canopy/Canopy';
import ProbeManager from 'src/classes/ProbeManager';

const cmd = new Command({
    name: 'info',
    description: { translate: 'commands.info' },
    usage: 'info <rule/all> [true/false]',
    args: [
        { type: 'string|array', name: 'ruleIDs' },
        { type: 'boolean', name: 'enable' }
    ],
    callback: infoCommand,
    helpEntries: [
        { usage: 'info <rule> [true/false]', description: { translate: 'commands.info.single' } },
        { usage: 'info <[rule1,rule2,...]> [true/false]', description: { translate: 'commands.info.multiple' } },
        { usage: 'info all [true/false]', description: { translate: 'commands.info.all' } }
    ]
});

new Command({
    name: 'i',
    description: { translate: 'commands.info' },
    usage: 'i',
    args: [
        { type: 'string|array', name: 'ruleIDs' },
        { type: 'boolean', name: 'enable' }
    ],
    callback: infoCommand,
    helpHidden: true
});

function infoCommand(sender, args) {
    const { ruleIDs, enable } = args;
    if (ruleIDs === null && enable === null) return cmd.sendUsage(sender);
    
    if (ruleIDs === 'all') {
        changeAll(sender, enable);
        return;
    }
    
    if (typeof ruleIDs === 'string')
        return handleRuleChange(sender, ruleIDs, enable);
    for (const ruleID of ruleIDs)
        handleRuleChange(sender, ruleID, enable);
}

function handleRuleChange(sender, ruleID, enable) {
    if (!InfoDisplayRule.exists(ruleID)) 
        return sender.sendMessage({ rawtext: [ { translate: 'rules.generic.unknown', with: [ruleID, Commands.getPrefix()] }, { text: '§r§7.' } ] });
    
    if (!(InfoDisplayRule.getRule(ruleID) instanceof InfoDisplayRule))
        return sender.sendMessage({ translate: 'commands.info.canopyRule', with: [ruleID, Command.getPrefix()] });

    const ruleValue = InfoDisplayRule.getValue(sender, ruleID);
    if (enable === null) {
        const enabledRawText = ruleValue ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
        return sender.sendMessage({ rawtext: [ { translate: 'rules.generic.status', with: [ruleID] }, enabledRawText, { text: '§r§7.' } ] });
    }

    if (enable === ruleValue) {
        const enabledRawText = enable ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
        return sender.sendMessage({ rawtext: [ { translate: 'rules.generic.nochange', with: [ruleID] }, enabledRawText, { text: '§r§7.' } ] });
    }

    if (['showDisplay', 'light', 'biome'].includes(ruleID))
        ProbeManager.removeProbe(sender);
    if (ruleID === 'showDisplay' && !enable)
        clearInfoDisplay(sender);
    
    const rule = InfoDisplayRule.getRule(ruleID);
    if (enable)
        updateRules(sender, rule.getContigentRuleIDs(), enable);
    else
        updateRules(sender, rule.getDependentRuleIDs(), enable);
    updateRules(sender, rule.getIndependentRuleIDs(), !enable);

    updateRule(sender, ruleID, enable);
}

function changeAll(sender, enable) {
    for (const entry of InfoDisplayRule.getRules()) 
        entry.setValue(sender, enable);
    
    if (!enable) clearInfoDisplay(sender);
    const enabledRawText = enable ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
    sender.sendMessage({ rawtext: [ { translate: 'commands.info.allupdated' }, enabledRawText, { text: '§r§7.' } ] });
}

function clearInfoDisplay(sender) {
    sender.onScreenDisplay.setTitle('');
}

function updateRule(sender, ruleID, enable) {
    const ruleValue = InfoDisplayRule.getValue(sender, ruleID);
    if (ruleValue === enable) return;
    InfoDisplayRule.setValue(sender, ruleID, enable);
    const enabledRawText = enable ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
    sender.sendMessage({ rawtext: [ { translate: 'rules.generic.updated', with: [ruleID] }, enabledRawText, { text: '§r§7.' } ] });
}

function updateRules(sender, ruleIDs, enable) {
    for (const ruleID of ruleIDs)
        updateRule(sender, ruleID, enable);
}
