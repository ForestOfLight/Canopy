import { Command, InfoDisplayRule, Extensions, Rules, Commands } from "../../lib/canopy/Canopy";
import { PACK_VERSION } from "../../constants";
import { ModalFormData } from "@minecraft/server-ui";
import { forceShow } from "../../include/utils";

const cmd = new Command({
    name: 'canopy',
    description: { translate: 'commands.canopy' },
    usage: 'canopy <menu/rule/version> [true/false]',
    args: [
        { type: 'string|array', name: 'ruleIDs' },
        { type: 'boolean', name: 'enable' }
    ],
    callback: canopyCommand,
    helpEntries: [
        { usage: 'canopy menu', description: { translate: 'commands.canopy.menu' } },
        { usage: 'canopy <rule> [true/false]', description: { translate: 'commands.canopy.single' } },
        { usage: 'canopy <[rule1,rule2,...]> [true/false]', description: { translate: 'commands.canopy.multiple' } },
        { usage: 'canopy version', description: { translate: 'commands.canopy.version' } }
    ],
    adminOnly: true
});

async function canopyCommand(sender, args) {
    const { ruleIDs, enable } = args;
    if (ruleIDs === null && enable === null) {
        cmd.sendUsage(sender);
        return;
    }
    if (typeof ruleIDs === 'string' && ruleIDs === 'menu') {
        openMenu(sender);
        return;
    }
    if (typeof ruleIDs === 'string' && ruleIDs === 'version') {
        sender.sendMessage(getVersionMessage());
        return;
    }
    if (typeof ruleIDs === 'string') {
        handleRuleChange(sender, ruleIDs, enable);
        return;
    }
    for (const ruleID of ruleIDs)
        await handleRuleChange(sender, ruleID, enable);
}

function getVersionMessage() {
    const message = { rawtext: [
        { translate: 'commands.canopy.version.message' },
        { text: ` §av${PACK_VERSION}§r§7.\n` }
    ]};
    const extensionNames = Extensions.getVersionedNames();
    if (extensionNames.length === 0) return message;
    message.rawtext.push({ translate: 'commands.canopy.version.extensions' });
    for (let i = 0; i < extensionNames.length; i++) {
        const extensionName = extensionNames[i];
        if (i > 0)
            message.rawtext.push({ text: '§r§7,' });
        message.rawtext.push({ text: ` §2§o${extensionName.name} v${extensionName.version}` });
    }
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

    if (enable)
        await updateRules(sender, rule.getContigentRuleIDs(), enable);
    else
        await updateRules(sender, rule.getDependentRuleIDs(), enable);
    await updateRules(sender, rule.getIndependentRuleIDs(), false);
    
    await updateRule(sender, ruleID, enable);
}

async function updateRules(sender, ruleIDs, enable) {
    for (const ruleID of ruleIDs) {
        await updateRule(sender, ruleID, enable).catch(error => {
            console.warn(`Error updating rule ${ruleID}: ${error.message}`);
        });
    }
}

async function updateRule(sender, ruleID, enable) {
    const ruleValue = await Rules.getValue(ruleID);
    if (ruleValue === enable) return;
    Rules.get(ruleID).setValue(enable);
    sendUpdatedMessage(sender, ruleID, enable);
}

function sendUpdatedMessage(sender, ruleID, enable) {
    const enabledRawText = enable ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
    sender.sendMessage({ rawtext: [{ translate: 'rules.generic.updated', with: [ruleID] }, enabledRawText, { text: '§r§7.' }] });
}

async function openMenu(sender) {
    const form = new ModalFormData().title("§l§aCanopy§r §aRules");
    const rules = getRulesInAlphabeticalOrder();
    for (const rule of rules) {
        try {
            const ruleValue = await rule.getValue();
            form.toggle(rule.getID(), ruleValue);
        } catch (error) {
            sender.sendMessage(`§cError: ${error.message} for rule ${rule.getID()}`);
        }
    }
    form.submitButton({ translate: 'commands.canopy.menu.submit' });

    forceShow(sender, form, 1000).then(response => {
        if (response.canceled) 
            sender.sendMessage({ translate: 'commands.canopy.menu.canceled' });
        else
            updateChangedValues(sender, response.formValues);
    }).catch(error => {
        sender.sendMessage(`§cError: ${error.message}`);
    });
}

async function updateChangedValues(sender, formValues) {
    const rules = getRulesInAlphabeticalOrder();
    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if (await rule.getValue() !== formValues[i]) {
            await handleRuleChange(sender, rule.getID(), formValues[i]).catch(error => {
                console.warn(`Error updating rule ${rule.getID()}: ${error.message}`);
            });
        }
    }
}

function getRulesInAlphabeticalOrder() {
    return Rules.getByCategory("Rules").sort((a, b) => a.getID().localeCompare(b.getID()));
}