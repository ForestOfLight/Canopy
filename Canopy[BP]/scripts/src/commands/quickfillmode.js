import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from "@minecraft/server";
import { PlayerCommandOrigin, VanillaCommand } from "../../lib/canopy/Canopy";
import { getQuickFillModeConfigFromName, quickFillModes } from "../classes/quickfill/Modes/QuickFillModes";
import { quickFillContainer } from "../rules/quickFillContainer";

export class QuickFillModeCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:quickfillmode',
            description: 'commands.quickfillmode',
            enums: [{
                name: 'canopy:quickFillModeAction',
                values: Object.values(quickFillModes).map(modeConfig => modeConfig.name)
            }],
            mandatoryParameters: [{
                name: 'canopy:quickFillModeAction',
                type: CustomCommandParamType.Enum
            }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin],
            callback: (origin, ...args) => this.quickFillCommand(origin, ...args),
            wikiDescription: 'Changes your current Quick Fill mode.',
            subCommandWikiDescription: {
                bulk: {
                    description: 'Sets the active mode to Bulk. Bulk mode moves all items that match the item in your hand.',
                    params: []
                },
                clipboard: {
                    description: "Sets the active mode to Clipboard. Clipboard mode allows you to copy a container's contents to your clipboard and move items that match your clipboard. Clipboards also support wildcards items (decided with the UI at copy time), which will be replaced by the item in your hand when you paste the clipboard.",
                    params: []
                },
                logicalBulk: {
                    description: 'Sets the active mode to Logical Bulk. Logical Bulk mode moves all items that match the dominant item in a container.',
                    params: []
                }
            }
        });
    }

    quickFillCommand(origin, mode) {
        const modeConfig = getQuickFillModeConfigFromName(mode);
        if (!modeConfig)
            return { status: CustomCommandStatus.Failure, message: 'commands.quickfillmode.invalidmode' };
        quickFillContainer.setQuickFillPlayerMode(origin.getSource(), mode);
        origin.sendMessage({ translate: 'commands.quickfillmode.updated', with: [mode] });
    }
}

export const quickFillModeCommand = new QuickFillModeCommand();
