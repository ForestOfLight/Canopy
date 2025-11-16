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
        { type: 'boolean|float|integer', name: 'newValue' }
    ],
    callback: canopyCommand,
    helpEntries: [
        { usage: 'canopy menu', description: { translate: 'commands.canopy.menu' } },
        { usage: 'canopy <rule> [true/false]', description: { translate: 'commands.canopy.single' } },
        { usage: 'canopy <[rule1,rule2,...]> [true/false]', description: { translate: 'commands.canopy.multiple' } },
        { usage: 'canopy version', description: { translate: 'commands.canopy.version' } }
    ],
    opOnly: true
});

async function canopyCommand(sender, args) {
    const { ruleIDs, newValue } = args;
    if (ruleIDs === null && newValue === null) {
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
        handleRuleChange(sender, ruleIDs, newValue);
        return;
    }
    for (const ruleID of ruleIDs)
        await handleRuleChange(sender, ruleID, newValue);
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

async function handleRuleChange(sender, ruleID, newValue) {
    if (!Rules.exists(ruleID))
        return sender.sendMessage({ translate: 'rules.generic.unknown', with: [ruleID, Commands.getPrefix()] });
    const rule = Rules.get(ruleID);
    if (rule instanceof InfoDisplayRule)
        return sender.sendMessage({ translate: 'commands.canopy.infodisplayRule', with: [ruleID, Commands.getPrefix()] });
    const ruleValue = await rule.getValue();
    if (newValue === null)
        return sender.sendMessage({ rawtext: [{ translate: 'rules.generic.status', with: [rule.getID()] }, getValueRawText(ruleValue, rule.getType()), { text: '§r§7.' }] });
    if (ruleValue === newValue)
        return sender.sendMessage({ rawtext: [{ translate: 'rules.generic.nochange', with: [rule.getID()] }, getValueRawText(newValue, rule.getType()), { text: '§r§7.' }] });

    if (newValue)
        await updateRules(sender, rule.getContigentRuleIDs(), newValue);
    else
        await updateRules(sender, rule.getDependentRuleIDs(), newValue);
    await updateRules(sender, rule.getIndependentRuleIDs(), false);
    
    await updateRule(sender, ruleID, newValue);
}

async function updateRules(sender, ruleIDs, newValue) {
    for (const ruleID of ruleIDs) {
        await updateRule(sender, ruleID, newValue).catch(error => {
            console.warn(`[Canopy] Error updating rule ${ruleID}: ${error.message}`);
        });
    }
}

async function updateRule(sender, ruleID, newValue) {
    const ruleValue = await Rules.getValue(ruleID);
    if (ruleValue === newValue)
        return;
    try {
        Rules.get(ruleID).setValue(newValue);
        sendUpdatedMessage(sender, ruleID, newValue);
    } catch(error) {
        if (error.message.includes('Incorrect value type'))
            return sendIncorrectValueTypeMessage(sender, ruleID);
        if (error.message.includes('Value out of range'))
            return sendValueOutOfRangeMessage(sender, ruleID);
        throw error;
    }
}

function sendIncorrectValueTypeMessage(sender, ruleID) {
    sender.sendMessage({ translate: 'rules.generic.invalidtype', with: [ruleID, Rules.get(ruleID).getType()] });
}

function sendValueOutOfRangeMessage(sender, ruleID) {
    const valueRange = Rules.get(ruleID).getAllowedValues();
    const message = { rawtext: [{ translate: 'rules.generic.outofrange', with: [ruleID, String(valueRange.range.min), String(valueRange.range.max)] }] };
    if (valueRange.other?.length > 0)
        message.rawtext.push({ translate: 'rules.generic.outofrange.withother', with: [valueRange.other.join(', ')] });
    sender.sendMessage(message);
}

function sendUpdatedMessage(sender, ruleID, newValue) {
    const valueRawText = getValueRawText(newValue, Rules.get(ruleID).getType());
    sender.sendMessage({ rawtext: [{ translate: 'rules.generic.updated', with: [ruleID] }, valueRawText, { text: '§r§7.' }] });
}

async function openMenu(sender) {
    const form = new ModalFormData().title("§l§2Canopy§r §2Rules");
    const rules = getRulesInAlphabeticalOrder();
    for (const rule of rules) {
        try {
            const ruleValue = await rule.getValue();
            if (rule.getType() === 'boolean')
                form.toggle(rule.getID(), { defaultValue: ruleValue, tooltip: rule.getDescription() });
            else
                form.textField(rule.getID(), rule.getType(), { defaultValue: String(rule.getDefaultValue()), tooltip: rule.getDescription() });
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
        const interpretedValue = ['integer', 'float'].includes(rule.getType()) ? Number(formValues[i]) : formValues[i];
        if (await rule.getValue() !== interpretedValue) {
            await handleRuleChange(sender, rule.getID(), interpretedValue).catch(error => {
                console.warn(`Error updating rule ${rule.getID()}: ${error.message}`);
            });
        }
    }
}

function getRulesInAlphabeticalOrder() {
    return Rules.getByCategory("Rules").sort((a, b) => a.getID().localeCompare(b.getID()));
}

function getValueRawText(newValue, type) {
    switch(type) {
        case ('boolean'):
            return newValue ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
        case('integer'):
            return { text: '§u' + newValue };
        case('float'):
            return { text: '§d' + newValue };
        default:
            return { text: newValue };
    }
}