import { Command, InfoDisplayRule, Commands, Rules } from "../../lib/canopy/Canopy";
import ProbeManager from "../classes/ProbeManager";
import { ModalFormData } from "@minecraft/server-ui";
import { forceShow } from "../../include/utils";

const cmd = new Command({
    name: 'info',
    description: { translate: 'commands.info' },
    usage: 'info <menu/rule/all> [true/false]',
    args: [
        { type: 'string|array', name: 'ruleIDs' },
        { type: 'boolean', name: 'enable' }
    ],
    callback: infoCommand,
    helpEntries: [
        { usage: 'info menu', description: { translate: 'commands.info.menu' } },
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
    if (ruleIDs === null && enable === null) {
        cmd.sendUsage(sender);
        return;
    }
    if (ruleIDs === 'menu') {
        openMenu(sender);
        return;
    }
    if (ruleIDs === 'all') {
        changeAll(sender, enable);
        return;
    }
    if (typeof ruleIDs === 'string') {
        handleRuleChange(sender, ruleIDs, enable);
        return;
    }
    for (const ruleID of ruleIDs)
        handleRuleChange(sender, ruleID, enable);
}

function handleRuleChange(sender, ruleID, enable) {
    if (!InfoDisplayRule.exists(ruleID))
        return sender.sendMessage({ rawtext: [ { translate: 'rules.generic.unknown', with: [ruleID, Commands.getPrefix()] } ] });
    
    if (!(InfoDisplayRule.get(ruleID) instanceof InfoDisplayRule))
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
    
    const rule = InfoDisplayRule.get(ruleID);
    if (enable)
        updateRules(sender, rule.getContigentRuleIDs(), enable);
    else
        updateRules(sender, rule.getDependentRuleIDs(), enable);
    updateRules(sender, rule.getIndependentRuleIDs(), !enable);

    updateRule(sender, ruleID, enable);
}

function changeAll(sender, enable) {
    for (const entry of InfoDisplayRule.getAll()) 
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

function openMenu(sender) {
    const formTitle = "§aInfoDisplay Rules";
    const form = new ModalFormData().title(formTitle);
    const rules = Rules.getByCategory("InfoDisplay").sort((a, b) => a.getID().localeCompare(b.getID()));
    for (const rule of rules) {
        try {
            const ruleValue = rule.getValue(sender);
            form.toggle(rule.getID(), ruleValue);
        } catch (error) {
            sender.sendMessage(`§cError: ${error.message} for rule ${rule.getID()}`);
        }
    }
    form.submitButton("Apply");

    forceShow(sender, formTitle, form, 1000)
        .then(response => {
            if (response.canceled) 
                sender.sendMessage(`§8Form canceled. Rules were not updated.`);
            else
                updateChangedValues(sender, response.formValues);
        })
        .catch(error => {
            sender.sendMessage(`§cError: ${error.message}`);
        });
}

function updateChangedValues(sender, formValues) {
    const rules = Rules.getByCategory("InfoDisplay").sort((a, b) => a.getID().localeCompare(b.getID()));
    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if (rule.getValue(sender) !== formValues[i]) {
            handleRuleChange(sender, rule.getID(), formValues[i]);
        }
    }
}