import { Rule, Command } from 'lib/canopy/Canopy';
import { resetCounterMap } from 'src/commands/counter';

const cmd = new Command({
    name: 'canopy',
    description: { translate: 'commands.canopy' },
    usage: 'canopy <rule> <true/false>',
    args: [
        { type: 'string', name: 'ruleID' },
        { type: 'boolean', name: 'enable' },
    ],
    callback: canopyCommand,
    adminOnly: true
})

async function canopyCommand(sender, args) {
    const { ruleID, enable } = args;
    if (ruleID === null && enable === null)
        return cmd.sendUsage(sender);
    if (!Rule.exists(ruleID)) 
        return sender.sendMessage({ translate: 'rules.generic.unknown', with: [ruleID, Command.prefix] });

    const rule = Rule.getRule(ruleID);
    const ruleValue = await rule.getValue();
    const enabledFormat = ruleValue ? '§l§aenabled' : '§l§cdisabled';
    if (enable === null)
        return sender.sendMessage({ translate: 'rules.generic.status', with: [rule.getID(), enabledFormat] });
    if (ruleValue === enable)
        return sender.sendMessage({ translate: 'rules.generic.nochange', with: [rule.getID(), enabledFormat] });

    if (ruleID === 'hopperCounters' && !enable)
        resetCounterMap();

    if (!enable)
        await updateRules(sender, rule.getDependentRuleIDs(), enable);
    else
        await updateRules(sender, rule.getContigentRuleIDs(), enable);
    await updateRules(sender, rule.getIndependentRuleIDs(), false);
    
    updateRule(sender, ruleID, ruleValue, enable);
}

function updateRule(sender, ruleID, ruleValue, enable) {
    if (ruleValue === enable) return;
    Rule.getRule(ruleID).setValue(enable);
    sender.sendMessage({ translate: 'rules.generic.updated', with: [ruleID, enable ? '§l§aenabled' : '§l§cdisabled'] });
}

async function updateRules(sender, ruleIDs, enable) {
    for (const ruleID of ruleIDs) {
        updateRule(sender, ruleID, await Rule.getValue(ruleID), enable);
    }
}
