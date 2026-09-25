import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { PlayerCommandOrigin, VanillaCommand } from "../../lib/canopy/Canopy";
import { QuickFillClipboardController } from "../classes/quickfill/QuickFillClipboardController";
import { QuickFillClipboardStore } from "../classes/quickfill/QuickFillClipboardStore";
import { QuickFillPresetStore } from "../classes/quickfill/QuickFillPresetStore";

const QUICK_FILL_ACTIONS = Object.freeze({
    SAVE: 'save',
    SET: 'set',
    DELETE: 'delete',
    LIST: 'list'
});

export class QuickFillCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:quickfill',
            description: 'commands.quickfill',
            enums: [{
                name: 'canopy:quickFillAction',
                values: Object.values(QUICK_FILL_ACTIONS)
            }],
            mandatoryParameters: [{
                name: 'canopy:quickFillAction',
                type: CustomCommandParamType.Enum
            }],
            optionalParameters: [{
                name: 'name',
                type: CustomCommandParamType.String
            }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin],
            callback: (origin, ...args) => this.quickFillCommand(origin, ...args),
            wikiDescription: 'Saves, selects, deletes, and lists persistent Quick Fill clipboard presets.',
            subCommandWikiDescription: {
                save: {
                    description: 'Saves the active container clipboard as a named preset.',
                    params: ['name']
                },
                set: {
                    description: 'Sets the active container clipboard from a saved preset.',
                    params: ['name']
                },
                delete: {
                    description: 'Deletes a saved clipboard preset.',
                    params: ['name']
                },
                list: {
                    description: 'Lists saved clipboard preset names.',
                    params: []
                }
            }
        });
    }

    quickFillCommand(origin, action, name) {
        if (!Object.values(QUICK_FILL_ACTIONS).includes(action))
            return this.failure('commands.generic.invalidaction');

        if (action === QUICK_FILL_ACTIONS.LIST) {
            if (name !== void 0)
                return this.failure('commands.quickfill.list.unexpectedname');
        } else if (typeof name !== 'string' || name.trim().length === 0) {
            return this.failure('commands.quickfill.missingname');
        }

        const player = origin.getSource();
        const normalizedName = name?.trim();

        system.run(() => {
            this.runAction(player, action, normalizedName);
        });

        return { status: CustomCommandStatus.Success };
    }

    runAction(player, action, name) {
        switch (action) {
            case QUICK_FILL_ACTIONS.SAVE:
                this.savePreset(player, name);
                break;
            case QUICK_FILL_ACTIONS.SET:
                this.setPreset(player, name);
                break;
            case QUICK_FILL_ACTIONS.DELETE:
                this.deletePreset(player, name);
                break;
            case QUICK_FILL_ACTIONS.LIST:
                this.listPresets(player);
                break;
            default:
                break;
        }
    }

    savePreset(player, name) {
        const clipboard = QuickFillClipboardController.get(player);
        if (!clipboard) {
            player.sendMessage({ translate: 'commands.quickfill.noactive' });
            return;
        }

        if (!QuickFillPresetStore.save(player, name, clipboard)) {
            player.sendMessage({ translate: 'commands.quickfill.save.fail' });
            return;
        }

        player.sendMessage({ translate: 'commands.quickfill.save.success', with: [name] });
    }

    setPreset(player, name) {
        const clipboard = QuickFillPresetStore.load(player, name);
        if (!clipboard) {
            player.sendMessage({ translate: 'commands.quickfill.noexist', with: [name] });
            return;
        }

        QuickFillClipboardStore.set(player, clipboard);
        player.sendMessage({ translate: 'commands.quickfill.set.success', with: [name] });
    }

    deletePreset(player, name) {
        if (!QuickFillPresetStore.delete(player, name)) {
            player.sendMessage({ translate: 'commands.quickfill.noexist', with: [name] });
            return;
        }

        player.sendMessage({ translate: 'commands.quickfill.delete.success', with: [name] });
    }

    listPresets(player) {
        player.sendMessage(this.getPresetListMessage(player));
    }

    getPresetListMessage(player) {
        const presetNames = QuickFillPresetStore.getNames(player);
        if (presetNames.length === 0)
            return { translate: 'commands.quickfill.list.empty' };

        const message = {
            rawtext: [{ translate: 'commands.quickfill.list.header' }]
        };

        for (const presetName of presetNames)
            message.rawtext.push({ text: `\n§7- ${presetName}` });

        return message;
    }

    failure(message) {
        return {
            status: CustomCommandStatus.Failure,
            message
        };
    }
}

export const quickFillCommand = new QuickFillCommand();
