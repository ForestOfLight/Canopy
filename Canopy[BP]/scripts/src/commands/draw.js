import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { DrawManager } from "../classes/shapeDrawer/DrawManager";
import { DrawUI } from "../classes/shapeDrawer/DrawUI";

const SHAPE_ACTIONS = Object.freeze({
    REMOVE: 'remove',
    EDIT: 'edit'
});

export class DrawCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:draw',
            description: 'commands.draw',
            enums: [{name: 'canopy:shapeAction', values: Object.values(SHAPE_ACTIONS)}],
            optionalParameters: [
                { name: 'canopy:shapeAction', type: CustomCommandParamType.Enum },
                { name: 'name', type: CustomCommandParamType.String }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.drawCommand(origin, ...args),
            wikiDescription: 'Draw shapes.',
            subCommandWikiDescription: {
                '': {
                    description: 'Open the shape drawer menu.'
                },
                [SHAPE_ACTIONS.EDIT]: {
                    description: "Open the shape menu for the given name, or a prefilled create form if it doesn't exist.",
                    params: ['name']
                },
                [SHAPE_ACTIONS.REMOVE]: {
                    description: 'Remove the saved shape for the given name.',
                    params: ['name']
                }
            }
        });
    }

    drawCommand(origin, shapeAction, name) {
        const manager = DrawManager.getInstance();
        switch (shapeAction) {
            case SHAPE_ACTIONS.EDIT:
                return this.#createAndRun(origin, manager, name);
            case SHAPE_ACTIONS.REMOVE:
                if (!name)
                    return { status: CustomCommandStatus.Failure, message: 'commands.draw.specifyname' };
                return this.#removeShape(origin, manager, name);
            default:
                return this.#showUI(origin, manager);
        }
    }

    #showUI(origin, manager) {
        if (!(origin instanceof PlayerCommandOrigin))
            return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
        const player = origin.getSource();
        const ui = new DrawUI(player, manager);
        system.run(() => ui.showSelector());
        return { status: CustomCommandStatus.Success };
    }

    #removeShape(origin, manager, name) {
        const existing = manager.list().find((a) => a.name === name);
        if (!existing) {
            origin.sendMessage({ translate: 'commands.draw.removenotfound', with: [name] });
            return;
        }
        system.run(() => manager.remove(existing));
        origin.sendMessage({ translate: 'commands.draw.removed', with: [name] });
        return { status: CustomCommandStatus.Success };
    }

    #createAndRun(origin, manager, name = void 0) {
        const source = origin.getSource();
        const isPlayer = origin instanceof PlayerCommandOrigin;
        system.run(() => {
            if (isPlayer) {
                const ui = new DrawUI(source, manager);
                const existing = manager.list().find((a) => a.name === name);
                if (existing)
                    ui.showEditForm(existing);
                else
                    ui.showCreateForm({ name });
            }
        });
        return { status: CustomCommandStatus.Success };
    }
}

export const drawCommand = new DrawCommand();
