import { VanillaCommand, PlayerCommandOrigin, InfoDisplayRule, Commands, Rules } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { forceShow } from "../../include/utils";
import { INFODISPLAY_RULE_IDENTIFIERS } from "../rules/infodisplay/infoDisplayIdentifiers";

export class InfoDisplayCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:info',
            description: 'commands.info',
            enums: [{ name: 'canopy:infoRule', values: () => InfoDisplayCommand.getRuleEnumValues() }],
            mandatoryParameters: [{ name: 'canopy:infoRule', type: CustomCommandParamType.Enum }],
            optionalParameters: [{ name: 'value', type: CustomCommandParamType.Boolean }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin],
            callback: (origin, ...args) => this.infoCommand(origin, ...args),
            wikiDescription: 'Toggle InfoDisplay rules for yourself, or open the InfoDisplay menu.',
            subCommandWikiDescription: {
                '<rule: InfoDisplayRule>': {
                    description: 'Enable or disable an InfoDisplay rule for yourself. Omit the value to query the current setting.',
                    params: ['value']
                },
                menu: {
                    description: 'Opens a form with a toggle for every InfoDisplay rule.',
                    params: []
                }
            }
        });
    }

    static getRuleEnumValues() {
        return [...INFODISPLAY_RULE_IDENTIFIERS, 'menu'];
    }

    infoCommand(origin, rule, value) {
        const player = origin.getSource();
        if (rule === 'menu') {
            system.run(() => this.openMenu(player));
            return { status: CustomCommandStatus.Success };
        }
        system.run(() => this.handleRuleChange(player, rule, value ?? null));
        return { status: CustomCommandStatus.Success };
    }

    async handleRuleChange(player, ruleID, enable) {
        if (!InfoDisplayRule.exists(ruleID)) {
            if (Rules.exists(ruleID))
                return player.sendMessage({ translate: 'commands.info.canopyRule', with: [ruleID, Commands.getPrefix()] });
            return player.sendMessage({ rawtext: [ { translate: 'rules.generic.unknown', with: [ruleID, Commands.getPrefix()] } ] });
        }
        const ruleValue = InfoDisplayRule.getValue(player, ruleID);
        if (enable === null) {
            const enabledRawText = ruleValue ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
            return player.sendMessage({ rawtext: [ { translate: 'rules.generic.status', with: [ruleID] }, enabledRawText, { text: '§r§7.' } ] });
        }
        if (enable === ruleValue) {
            const enabledRawText = enable ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
            return player.sendMessage({ rawtext: [ { translate: 'rules.generic.nochange', with: [ruleID] }, enabledRawText, { text: '§r§7.' } ] });
        }

        const rule = InfoDisplayRule.get(ruleID);
        const blockingGlobalContingents = await this.getBlockingGlobalContingents(rule);
        if (enable && blockingGlobalContingents.length > 0) {
            for (const blockingRuleID of blockingGlobalContingents)
                player.sendMessage({ translate: 'rules.generic.blocked', with: [blockingRuleID] });
            return;
        }
        if (enable)
            this.updateRules(player, rule.getContingentRuleIDs(), enable);
        else
            this.updateRules(player, rule.getDependentRuleIDs(), enable);
        this.updateRules(player, rule.getIndependentRuleIDs(), !enable);

        this.updateRule(player, ruleID, enable);
    }

    updateRule(player, ruleID, enable) {
        const ruleValue = InfoDisplayRule.getValue(player, ruleID);
        if (ruleValue === enable) return;
        InfoDisplayRule.setValue(player, ruleID, enable);
        const enabledRawText = enable ? { translate: 'rules.generic.enabled' } : { translate: 'rules.generic.disabled' };
        player.sendMessage({ rawtext: [ { translate: 'rules.generic.updated', with: [ruleID] }, enabledRawText, { text: '§r§7.' } ] });
    }

    updateRules(player, ruleIDs, enable) {
        for (const ruleID of ruleIDs)
            this.updateRule(player, ruleID, enable);
    }

    async getBlockingGlobalContingents(rule) {
        const blockingGlobalContingents = [];
        const globalContingentRules = rule.getGlobalContingentRuleIDs();
        for (const contingentRuleID of globalContingentRules) {
            const contingentRule = Rules.get(contingentRuleID);
            if (!(await contingentRule.getValue()))
                blockingGlobalContingents.push(contingentRuleID);
        }
        return blockingGlobalContingents;
    }

    openMenu(player) {
        const form = new ModalFormData().title("§2InfoDisplay Rules");
        const rules = this.getRulesInAlphabeticalOrder();
        for (const rule of rules) {
            try {
                const ruleValue = rule.getValue(player);
                form.toggle(rule.getID(), { defaultValue: ruleValue, tooltip: rule.getDescription() });
            } catch (error) {
                player.sendMessage(`§cError: ${error.message} for rule ${rule.getID()}`);
            }
        }
        form.submitButton({ translate: 'commands.canopy.menu.submit' });
        forceShow(player, form, { timeout: 1000 })
            .then(response => {
                if (response.canceled)
                    player.sendMessage({ translate: 'commands.canopy.menu.canceled' });
                else
                    this.updateChangedValues(player, response.formValues);
            })
            .catch(error => {
                player.sendMessage(`§cError: ${error.message}`);
            });
    }

    updateChangedValues(player, formValues) {
        const rules = this.getRulesInAlphabeticalOrder();
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            if (rule.getValue(player) !== formValues[i])
                this.handleRuleChange(player, rule.getID(), formValues[i]);
        }
    }

    getRulesInAlphabeticalOrder() {
        return Rules.getByCategory("InfoDisplay").sort((a, b) => a.getID().localeCompare(b.getID()));
    }
}

export const infoCommand = new InfoDisplayCommand();
