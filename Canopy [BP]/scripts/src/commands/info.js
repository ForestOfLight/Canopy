import { Command, InfoDisplayRule } from 'lib/canopy/Canopy';
import ProbeManager from 'src/classes/ProbeManager';

const cmd = new Command({
    name: 'info',
    description: 'Toggle InfoDisplay rules.',
    usage: 'info <rule/all> <true/false>',
    args: [
        { type: 'string', name: 'ruleID' },
        { type: 'boolean', name: 'enable' }
    ],
    callback: infoCommand
});

new Command({
    name: 'i',
    description: 'Toggle InfoDisplay rules.',
    usage: 'i',
    args: [
        { type: 'string', name: 'ruleID' },
        { type: 'boolean', name: 'enable' }
    ],
    callback: infoCommand,
    helpHidden: true
});

function infoCommand(sender, args) {
    const { ruleID, enable } = args;
    if (ruleID === null && enable === null) return cmd.sendUsage(sender);
    if (!InfoDisplayRule.exists(ruleID)) return sender.sendMessage(`§cInvalid rule: ${ruleID}.`);
    if (enable === null) return sender.sendMessage(`§7${ruleID} is currently ${InfoDisplayRule.getValue(ruleID) ? '§l§aenabled' : '§l§cdisabled'}.`);

    if (ruleID === 'all') {
        changeAll(sender, enable);
        return;
    }
    
    if (enable === InfoDisplayRule.getValue(ruleID)) return sender.sendMessage(`§7${ruleID} is already ${enable ? '§l§aenabled' : '§l§cdisabled'}.`);

    if (ruleID === 'light' && !enable) 
        ProbeManager.removeProbe(sender);
    if (ruleID === 'showDisplay' && !enable)
        clearInfoDisplay(sender);
    
    const rule = InfoDisplayRule.getRule(ruleID);
    updateRules(sender, rule.getContigentRuleIDs(), enable);
    updateRules(sender, rule.getIndependentRuleIDs(), !enable);

    updateRule(sender, ruleID, InfoDisplayRule.getValue(ruleID), enable);
}

function changeAll(sender, enable) {
    for (let entry of InfoDisplayRule.getRules()) {
        InfoDisplayRule.setValue(entry, enable);
    }
    if (!enable) clearInfoDisplay(sender);
    sender.sendMessage(`${enable ? '§l§aEnabled' : '§l§cDisabled'}§r§7 all InfoDisplay features.`);
}

function clearInfoDisplay(sender) {
    sender.onScreenDisplay.setTitle('');
}

function updateRule(sender, ruleID, ruleValue, enable) {
    if (ruleValue === enable) return;
    InfoDisplayRule.setValue(ruleID, enable);
    sender.sendMessage(`§7${ruleID} is now ${enable ? '§l§aenabled' : '§l§cdisabled'}§r§7.`);
}

function updateRules(sender, ruleIDs, enable) {
    for (const ruleID of ruleIDs) {
        const rule = InfoDisplayRule.getRule(ruleID);
        updateRule(sender, rule, enable);
    }
}
