import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { AreaAnalysisManager } from "../classes/analyzearea/AreaAnalysisManager";
import { Analysis } from "../classes/analyzearea/Analysis";
import { AnalyzeAreaUI } from "../classes/analyzearea/AnalyzeAreaUI";

const ANALYZE_AREA_ACTIONS = Object.freeze({
    CREATE: 'create',
    REMOVE: 'remove'
});

export class AnalyzeAreaCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:analyzearea',
            description: 'commands.analyzearea',
            enums: [{ name: 'canopy:analyzeAreaAction', values: Object.values(ANALYZE_AREA_ACTIONS) }],
            optionalParameters: [
                { name: 'canopy:analyzeAreaAction', type: CustomCommandParamType.Enum },
                { name: 'name', type: CustomCommandParamType.String },
                { name: 'from', type: CustomCommandParamType.Location },
                { name: 'to', type: CustomCommandParamType.Location },
                { name: 'expression', type: CustomCommandParamType.String }
            ],
            permissionLevel: CommandPermissionLevel.GameDirectors,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.analyzeAreaCommand(origin, ...args),
            wikiDescription: 'Analyze a region of blocks with a JavaScript expression (parsed by jsep). '
                + 'The expression is evaluated for each block in the region, and if it returns a truthy value, the block is considered a match. '
                + 'The expression has access all properties and methods that can be accessed in restricted-execution mode from a '
                + '[block](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/block?view=minecraft-bedrock-experimental) object. '
                + 'The `block` source keyword can be included or not.\n\n'
                + 'Example expressions:\n'
                + "- Stone block: `typeId == 'minecraft:stone'`\n"
                + "- Immovable block: `getComponent('minecraft:movable').movementType == 'Immovable'`\n"
                + "- Liquid source block: `permutation.getState('liquid_depth') == 0`"
                + "- Unlocked hopper: `typeId == 'minecraft:hopper' && getRedstonePower() == 0`",
            subCommandWikiDescription: {
                '': {
                    description: 'Open the area analyses menu.'
                },
                'create [name: String]': {
                    description: 'Open the create form, prefilled with the name if one is given.'
                },
                'create <name: String> <from: Location> <to: Location>': {
                    description: 'Open the saved analysis for those coordinates, or a create form prefilled with that name and those coordinates.'
                },
                'create <name: String> <from: Location> <to: Location> <expression: String>': {
                    description: 'Create and run an analysis with that name. Names must be unique.'
                },
                'remove <name: String>': {
                    description: 'Remove the saved analysis with that name.'
                }
            }
        });
    }

    analyzeAreaCommand(origin, action, rawName, from, to, expression) {
        const manager = AreaAnalysisManager.getInstance();
        const name = rawName?.trim();

        if (action === ANALYZE_AREA_ACTIONS.REMOVE)
            return this.#removeAnalysis(manager, name);
        if (action === ANALYZE_AREA_ACTIONS.CREATE && from && to && expression !== void 0)
            return this.#createAndRun(origin, manager, name, from, to, expression);

        if (!(origin instanceof PlayerCommandOrigin))
            return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
        const player = origin.getSource();
        const ui = new AnalyzeAreaUI(player, manager);

        if (action === ANALYZE_AREA_ACTIONS.CREATE) {
            const existing = from && to ? manager.findByCoords(from, to, player.dimension.id) : void 0;
            system.run(() => {
                if (existing)
                    ui.showAnalysisPage(existing);
                else
                    ui.showCreateForm({ name, from, to });
            });
            return { status: CustomCommandStatus.Success };
        }

        system.run(() => ui.showSelector());
        return { status: CustomCommandStatus.Success };
    }

    #removeAnalysis(manager, name) {
        const existing = manager.findByName(name);
        if (!existing)
            return { status: CustomCommandStatus.Failure, message: 'commands.analyzearea.removenotfound' };
        system.run(() => manager.remove(existing));
        return { status: CustomCommandStatus.Success, message: 'commands.analyzearea.removed' };
    }

    #createAndRun(origin, manager, name, from, to, expression) {
        if (manager.findByName(name))
            return { status: CustomCommandStatus.Failure, message: 'commands.analyzearea.nametaken' };
        const source = origin.getSource();
        const result = Analysis.tryCreate(from, to, source.dimension.id, expression, name);
        if (!result.ok)
            return { status: CustomCommandStatus.Failure, message: `commands.analyzearea.${result.reason}` };

        const analysis = result.analysis;
        const isPlayer = origin instanceof PlayerCommandOrigin;
        system.run(() => {
            manager.add(analysis);
            if (isPlayer) {
                new AnalyzeAreaUI(source, manager).showAnalysisPage(analysis, true);
                return;
            }
            analysis.run()
                .then(() => origin.sendMessage({ translate: 'commands.analyzearea.completed', with: [String(analysis.matches.length)] }))
                .catch((error) => origin.sendMessage(Analysis.errorMessage(error)));
        });
        return { status: CustomCommandStatus.Success };
    }
}

export const analyzeAreaCommand = new AnalyzeAreaCommand();
