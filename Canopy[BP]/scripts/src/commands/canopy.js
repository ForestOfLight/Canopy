import { VanillaCommand, PlayerCommandOrigin, EntityCommandOrigin, BlockCommandOrigin, ServerCommandOrigin, InfoDisplayRule, Extensions, Rules, Commands } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { PACK_VERSION } from "../../constants";
import { ModalFormData } from "@minecraft/server-ui";
import { forceShow } from "../../include/utils";

export class CanopyCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:canopy',
            description: 'commands.canopy',
            enums: [{ name: 'canopy:rule', values: () => CanopyCommand.getRuleEnumValues() }],
            mandatoryParameters: [{ name: 'canopy:rule', type: CustomCommandParamType.Enum }],
            optionalParameters: [{ name: 'value', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            allowedSources: [PlayerCommandOrigin, EntityCommandOrigin, BlockCommandOrigin, ServerCommandOrigin],
            cheatsRequired: true,
            callback: (origin, ...args) => this.canopyCommand(origin, ...args),
            wikiDescription: 'Enable, disable, or set the value of a rule, open the rules menu, or display the Canopy version.',
            subCommandWikiDescription: {
                '<rule: CanopyRule>': {
                    description: "Enable, disable, or set a rule's value. Omit the value to query the current setting. Numeric values must be wrapped in quotes (e.g. `\"16\"`), as the vanilla command parser will not accept an unquoted number for this argument.",
                    params: ['value']
                },
                menu: {
                    description: 'Opens a form with a toggle or field for every rule.',
                    params: []
                },
                version: {
                    description: 'Displays the Canopy version and all loaded extensions.',
                    params: []
                }
            }
        });
    }

    static getRuleEnumValues() {
        return [...Rules.getSettableRuleIDs(), 'menu', 'version'];
    }

    static parseValue(rawValue, type) {
        if (rawValue === null || rawValue === void 0)
            return null;
        switch (type) {
            case 'boolean':
                if (rawValue === 'true') return true;
                if (rawValue === 'false') return false;
                return NaN;
            case 'integer': {
                const parsed = parseInt(rawValue, 10);
                return Number.isNaN(parsed) ? NaN : parsed;
            }
            case 'float': {
                const parsed = parseFloat(rawValue);
                return Number.isNaN(parsed) ? NaN : parsed;
            }
            default:
                return rawValue;
        }
    }

    canopyCommand(origin, rule, value) {
        if (rule === 'menu') {
            if (!(origin instanceof PlayerCommandOrigin))
                return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
            const player = origin.getSource();
            system.run(() => this.openMenu(player));
            return { status: CustomCommandStatus.Success };
        }
        if (rule === 'version') {
            origin.sendMessage(this.getVersionMessage());
            return { status: CustomCommandStatus.Success };
        }
        system.run(() => this.handleRuleChangeFromCommand(origin, rule, value ?? null));
        return { status: CustomCommandStatus.Success };
    }

    getVersionMessage() {
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

    handleRuleChangeFromCommand(origin, ruleID, rawValue) {
        const rule = Rules.get(ruleID);
        if (!rule)
            return this.handleRuleChange(origin, ruleID, rawValue);
        const newValue = CanopyCommand.parseValue(rawValue, rule.getType());
        if (typeof newValue === 'number' && Number.isNaN(newValue))
            return origin.sendMessage({ translate: 'rules.generic.invalidtype', with: [ruleID, rule.getType()] });
        return this.handleRuleChange(origin, ruleID, newValue);
    }

    async handleRuleChange(origin, ruleID, newValue) {
        if (!Rules.exists(ruleID))
            return origin.sendMessage({ translate: 'rules.generic.unknown', with: [ruleID, Commands.getPrefix()] });
        const rule = Rules.get(ruleID);
        if (rule instanceof InfoDisplayRule)
            return origin.sendMessage({ translate: 'commands.canopy.infodisplayRule', with: [ruleID, Commands.getPrefix()] });
        const ruleValue = await rule.getValue();
        if (newValue === null)
            return origin.sendMessage({ rawtext: [{ translate: 'rules.generic.status', with: [rule.getID()] }, this.getValueRawText(ruleValue, rule.getType()), { text: '§r§7.' }] });
        if (ruleValue === newValue)
            return origin.sendMessage({ rawtext: [{ translate: 'rules.generic.nochange', with: [rule.getID()] }, this.getValueRawText(newValue, rule.getType()), { text: '§r§7.' }] });

        if (newValue)
            await this.updateRules(origin, rule.getContingentRuleIDs(), newValue);
        else
            await this.updateRules(origin, rule.getDependentRuleIDs(), newValue);
        await this.updateRules(origin, rule.getIndependentRuleIDs(), false);

        await this.updateRule(origin, ruleID, newValue);
    }

    async updateRules(origin, ruleIDs, newValue) {
        for (const ruleID of ruleIDs) {
            await this.updateRule(origin, ruleID, newValue).catch(error => {
                console.warn(`[Canopy] Error updating rule ${ruleID}: ${error.message}`);
            });
        }
    }

    async updateRule(origin, ruleID, newValue) {
        const ruleValue = await Rules.getValue(ruleID);
        if (ruleValue === newValue)
            return;
        try {
            Rules.get(ruleID).setValue(newValue);
            this.sendUpdatedMessage(origin, ruleID, newValue);
        } catch (error) {
            if (error.message.includes('Incorrect value type'))
                return this.sendIncorrectValueTypeMessage(origin, ruleID);
            if (error.message.includes('Value out of range'))
                return this.sendValueOutOfRangeMessage(origin, ruleID);
            throw error;
        }
    }

    sendIncorrectValueTypeMessage(origin, ruleID) {
        origin.sendMessage({ translate: 'rules.generic.invalidtype', with: [ruleID, Rules.get(ruleID).getType()] });
    }

    sendValueOutOfRangeMessage(origin, ruleID) {
        const valueRange = Rules.get(ruleID).getAllowedValues();
        const message = { rawtext: [{ translate: 'rules.generic.outofrange', with: [ruleID, String(valueRange.range.min), String(valueRange.range.max)] }] };
        if (valueRange.other?.length > 0)
            message.rawtext.push({ translate: 'rules.generic.outofrange.withother', with: [valueRange.other.join(', ')] });
        origin.sendMessage(message);
    }

    sendUpdatedMessage(origin, ruleID, newValue) {
        const valueRawText = this.getValueRawText(newValue, Rules.get(ruleID).getType());
        origin.sendMessage({ rawtext: [{ translate: 'rules.generic.updated', with: [ruleID] }, valueRawText, { text: '§r§7.' }] });
    }

    async openMenu(player) {
        const form = new ModalFormData().title("§l§2Canopy§r §2Rules");
        const rules = this.getRulesInAlphabeticalOrder();
        for (const rule of rules) {
            try {
                const ruleValue = await rule.getValue();
                if (rule.getType() === 'boolean')
                    form.toggle(rule.getID(), { defaultValue: ruleValue, tooltip: rule.getDescription() });
                else
                    form.textField(rule.getID(), rule.getType(), { defaultValue: String(ruleValue), tooltip: rule.getDescription() });
            } catch (error) {
                player.sendMessage(`§cError: ${error.message} for rule ${rule.getID()}`);
            }
        }
        form.submitButton({ translate: 'commands.canopy.menu.submit' });

        forceShow(player, form, { timeout: 1000 }).then(response => {
            if (response.canceled)
                player.sendMessage({ translate: 'commands.canopy.menu.canceled' });
            else
                this.updateChangedValues(player, response.formValues);
        }).catch(error => {
            player.sendMessage(`§cError: ${error.message}`);
        });
    }

    async updateChangedValues(player, formValues) {
        const rules = this.getRulesInAlphabeticalOrder();
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            const interpretedValue = ['integer', 'float'].includes(rule.getType()) ? Number(formValues[i]) : formValues[i];
            if (await rule.getValue() !== interpretedValue) {
                await this.handleRuleChange(player, rule.getID(), interpretedValue).catch(error => {
                    console.warn(`Error updating rule ${rule.getID()}: ${error.message}`);
                });
            }
        }
    }

    getRulesInAlphabeticalOrder() {
        return Rules.getByCategory("Rules").sort((a, b) => a.getID().localeCompare(b.getID()));
    }

    getValueRawText(newValue, type) {
        switch (type) {
            case ('boolean'):
                return newValue ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
            case ('integer'):
                return { text: '§u' + newValue };
            case ('float'):
                return { text: '§d' + newValue };
            default:
                return { text: newValue };
        }
    }
}

export const canopyCommand = new CanopyCommand();
