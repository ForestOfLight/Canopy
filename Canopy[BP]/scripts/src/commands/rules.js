import { VanillaCommand, PlayerCommandOrigin, EntityCommandOrigin, BlockCommandOrigin, ServerCommandOrigin, Rules } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { forceShow } from "../../include/utils";

export class RulesCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:rules',
            description: 'commands.canopy',
            enums: [{ name: 'canopy:rulesRule', values: () => RulesCommand.getRuleEnumValues() }],
            optionalParameters: [
                { name: 'canopy:rulesRule', type: CustomCommandParamType.Enum },
                { name: 'value', type: CustomCommandParamType.String }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, EntityCommandOrigin, BlockCommandOrigin, ServerCommandOrigin],
            cheatsRequired: true,
            callback: (origin, ...args) => this.rulesCommand(origin, ...args),
            wikiDescription: 'Lists, queries, or sets Canopy rules, or opens the rules menu.',
            subCommandWikiDescription: {
                '<rule: CanopyRule>': {
                    description: "Display a rule's current value and description, or provide a value to change it. Numeric values must be wrapped in quotes (e.g. `\"16\"`), as the vanilla command parser will not accept an unquoted number for this argument.",
                    params: ['value']
                },
                menu: {
                    description: 'Opens a form with a toggle or field for every rule.',
                    params: []
                }
            }
        });
    }

    static getRuleEnumValues() {
        return [...Rules.getSettableRuleIDs(), 'menu'];
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

    rulesCommand(origin, ruleID, rawValue) {
        if (ruleID === null || ruleID === void 0) {
            system.run(() => this.printRules(origin));
            return { status: CustomCommandStatus.Success };
        }
        if (ruleID === 'menu') {
            if (!(origin instanceof PlayerCommandOrigin))
                return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
            if (!this.canModifyRules(origin))
                return { status: CustomCommandStatus.Failure, message: 'commands.generic.nopermission' };
            system.run(() => this.openMenu(origin.getSource()));
            return { status: CustomCommandStatus.Success };
        }
        if (rawValue !== null && rawValue !== void 0 && !this.canModifyRules(origin))
            return { status: CustomCommandStatus.Failure, message: 'commands.generic.nopermission' };

        system.run(() => this.handleRuleChangeFromCommand(origin, ruleID, rawValue ?? null));
        return { status: CustomCommandStatus.Success };
    }

    canModifyRules(origin) {
        if (!(origin instanceof PlayerCommandOrigin))
            return true;
        return origin.getSource().commandPermissionLevel !== CommandPermissionLevel.Any;
    }

    async printRules(origin) {
        const message = { rawtext: [{ translate: 'commands.help.page.header', with: ['Rules'] }] };
        for (const rule of this.getRulesInAlphabeticalOrder())
            message.rawtext.push({ rawtext: [{ text: '\n  ' }, await this.formatRuleStatus(rule)] });
        origin.sendMessage(message);
    }

    async formatRuleStatus(rule) {
        const value = await rule.getValue();
        return {
            rawtext: [
                { text: `§7${rule.getID()}: ${this.getColoredValue(value, rule.getType())}§8 - ` },
                rule.getDescription()
            ]
        };
    }

    getColoredValue(value, type) {
        switch (type) {
            case 'boolean':
                return value ? '§atrue§r' : '§cfalse§r';
            case 'integer':
                return `§u${value}`;
            case 'float':
                return `§d${value}`;
            default:
                return String(value);
        }
    }

    handleRuleChangeFromCommand(origin, ruleID, rawValue) {
        const rule = Rules.get(ruleID);
        if (!rule)
            return;

        const newValue = RulesCommand.parseValue(rawValue, rule.getType());
        if (typeof newValue === 'number' && Number.isNaN(newValue)) {
            origin.sendMessage({ translate: 'rules.generic.invalidtype', with: [ruleID, rule.getType()] });
            return;
        }
        return this.handleRuleChange(origin, rule, newValue);
    }

    async handleRuleChange(origin, rule, newValue) {
        const ruleValue = await rule.getValue();
        if (newValue === null) {
            origin.sendMessage(await this.formatRuleStatus(rule));
            return;
        }
        if (ruleValue === newValue) {
            origin.sendMessage({
                rawtext: [
                    { translate: 'rules.generic.nochange', with: [rule.getID()] },
                    this.getValueRawText(newValue, rule.getType()),
                    { text: '§r§7.' }
                ]
            });
            return;
        }

        if (newValue)
            await this.updateRules(origin, rule.getContingentRuleIDs(), newValue);
        else
            await this.updateRules(origin, rule.getDependentRuleIDs(), newValue);
        await this.updateRules(origin, rule.getIndependentRuleIDs(), false);
        await this.updateRule(origin, rule.getID(), newValue);
    }

    async updateRules(origin, ruleIDs, newValue) {
        for (const ruleID of ruleIDs) {
            await this.updateRule(origin, ruleID, newValue).catch(error => {
                console.warn(`[Canopy] Error updating rule ${ruleID}: ${error.message}`);
            });
        }
    }

    async updateRule(origin, ruleID, newValue) {
        const rule = Rules.get(ruleID);
        if (await rule.getValue() === newValue)
            return;

        try {
            rule.setValue(newValue);
            this.sendUpdatedMessage(origin, rule, newValue);
        } catch (error) {
            if (error.message.includes('Incorrect value type'))
                return this.sendIncorrectValueTypeMessage(origin, rule);
            if (error.message.includes('Value out of range'))
                return this.sendValueOutOfRangeMessage(origin, rule);
            throw error;
        }
    }

    sendIncorrectValueTypeMessage(origin, rule) {
        origin.sendMessage({ translate: 'rules.generic.invalidtype', with: [rule.getID(), rule.getType()] });
    }

    sendValueOutOfRangeMessage(origin, rule) {
        const valueRange = rule.getAllowedValues();
        const message = {
            rawtext: [{
                translate: 'rules.generic.outofrange',
                with: [rule.getID(), String(valueRange.range.min), String(valueRange.range.max)]
            }]
        };
        if (valueRange.other?.length > 0)
            message.rawtext.push({ translate: 'rules.generic.outofrange.withother', with: [valueRange.other.join(', ')] });
        origin.sendMessage(message);
    }

    sendUpdatedMessage(origin, rule, newValue) {
        origin.sendMessage({
            rawtext: [
                { translate: 'rules.generic.updated', with: [rule.getID()] },
                this.getValueRawText(newValue, rule.getType()),
                { text: '§r§7.' }
            ]
        });
    }

    async openMenu(player) {
        const form = new ModalFormData().title("§l§2Canopy§r §2Rules");
        const rules = this.getRulesInAlphabeticalOrder();

        for (const rule of rules) {
            try {
                this.addRuleToForm(form, rule, await rule.getValue());
            } catch (error) {
                player.sendMessage(`§cError: ${error.message} for rule ${rule.getID()}`);
            }
        }

        form.submitButton({ translate: 'commands.canopy.menu.submit' });
        forceShow(player, form, { timeout: 1000 })
            .then(response => this.handleMenuResponse(player, response))
            .catch(error => player.sendMessage(`§cError: ${error.message}`));
    }

    addRuleToForm(form, rule, value) {
        if (rule.getType() === 'boolean')
            form.toggle(rule.getID(), { defaultValue: value, tooltip: rule.getDescription() });
        else
            form.textField(rule.getID(), rule.getType(), { defaultValue: String(value), tooltip: rule.getDescription() });
    }

    handleMenuResponse(player, response) {
        if (response.canceled)
            player.sendMessage({ translate: 'commands.canopy.menu.canceled' });
        else
            this.updateChangedValues(player, response.formValues);
    }

    async updateChangedValues(player, formValues) {
        const rules = this.getRulesInAlphabeticalOrder();
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            const value = ['integer', 'float'].includes(rule.getType()) ? Number(formValues[i]) : formValues[i];
            if (await rule.getValue() !== value) {
                await this.handleRuleChange(player, rule, value).catch(error => {
                    console.warn(`Error updating rule ${rule.getID()}: ${error.message}`);
                });
            }
        }
    }

    getRulesInAlphabeticalOrder() {
        return Rules.getByCategory("Rules").sort((a, b) => a.getID().localeCompare(b.getID()));
    }

    getValueRawText(value, type) {
        switch (type) {
            case 'boolean':
                return value ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
            case 'integer':
                return { text: `§u${value}` };
            case 'float':
                return { text: `§d${value}` };
            default:
                return { text: String(value) };
        }
    }
}

export const rulesCommand = new RulesCommand();
