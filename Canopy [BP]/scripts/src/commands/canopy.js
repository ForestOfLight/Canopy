import { Rule, Command } from 'lib/canopy/Canopy';
import { resetCounterMap } from 'src/commands/counter';

const cmd = new Command({
    name: 'canopy',
    description: 'Enable or disable a rule.',
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
        return sender.sendMessage(`§cInvalid rule: ${ruleID}`);

    const rule = Rule.getRule(ruleID);
    const ruleValue = await rule.getValue();
    if (enable === null)
        return sender.sendMessage(`§7${rule.getID()} is currently ${ruleValue ? '§l§aenabled' : '§l§cdisabled'}§r§7.`);
    if (ruleValue === enable)
        return sender.sendMessage(`§7${rule.getID()} is already ${enable ? '§l§aenabled' : '§l§cdisabled'}§r§7.`);

    if (ruleID === 'hopperCounters' && !enable)
        resetCounterMap();

    updateRules(sender, rule.getContigentRuleIDs(), enable);
    updateRules(sender, rule.getIndependentRuleIDs(), !enable);
    
    updateRule(sender, ruleID, ruleValue, enable);
}

function updateRule(sender, ruleID, ruleValue, enable) {
    if (ruleValue === enable) return;
    Rule.getRule(ruleID).setValue(enable);
    sender.sendMessage(`§7${ruleID} is now ${enable ? '§l§aenabled' : '§l§cdisabled'}§r§7.`);
}

function updateRules(sender, ruleIDs, enable) {
    for (const ruleID of ruleIDs) {
        const rule = Rule.getRule(ruleID);
        updateRule(sender, rule, enable);
    }
}
