import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { AreaAnalysisManager } from "../classes/analyzearea/AreaAnalysisManager";
import { Analysis } from "../classes/analyzearea/Analysis";
import { AnalyzeAreaUI } from "../classes/analyzearea/AnalyzeAreaUI";

const REMOVE_TOKEN = 'remove';

export class AnalyzeAreaCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:analyzearea',
            description: 'commands.analyzearea',
            optionalParameters: [
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
                + "- Liquid source block: `permutation.getState('liquid_depth') == 0`",
            subCommandWikiDescription: {
                '': {
                    description: 'Open the area analyses menu.'
                },
                '<from: Location> <to: Location>': {
                    description: 'Open the saved analysis for those coordinates, or a prefilled create form.'
                },
                '<from: Location> <to: Location> remove': {
                    description: 'Remove the saved analysis for those coordinates.'
                },
                '<from: Location> <to: Location> <expression: String>': {
                    description: 'Create and run an analysis.'
                }
            }
        });
    }

    analyzeAreaCommand(origin, from, to, expression) {
        const manager = AreaAnalysisManager.getInstance();

        if (from && to && expression !== void 0) {
            if (expression === REMOVE_TOKEN)
                return this.#removeAnalysis(origin, manager, from, to);
            return this.#createAndRun(origin, manager, from, to, expression);
        }

        if (!(origin instanceof PlayerCommandOrigin))
            return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
        const player = origin.getSource();
        const ui = new AnalyzeAreaUI(player, manager);

        if (from && to) {
            const existing = manager.findByCoords(from, to, player.dimension.id);
            system.run(() => {
                if (existing)
                    ui.showAnalysisPage(existing);
                else
                    ui.showCreateForm({ from, to });
            });
            return { status: CustomCommandStatus.Success };
        }

        system.run(() => ui.showSelector());
        return { status: CustomCommandStatus.Success };
    }

    #removeAnalysis(origin, manager, from, to) {
        const dimensionId = origin.getSource().dimension.id;
        const existing = manager.findByCoords(from, to, dimensionId);
        if (!existing)
            return { status: CustomCommandStatus.Failure, message: 'commands.analyzearea.removenotfound' };
        system.run(() => manager.remove(existing));
        return { status: CustomCommandStatus.Success, message: 'commands.analyzearea.removed' };
    }

    #createAndRun(origin, manager, from, to, expression) {
        const source = origin.getSource();
        const result = Analysis.tryCreate(from, to, source.dimension.id, expression);
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
