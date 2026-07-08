import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { AreaAnalysisManager } from "../classes/analyzearea/AreaAnalysisManager";
import { Analysis, analysisErrorMessage } from "../classes/analyzearea/Analysis";
import { ExpressionEvaluator } from "../classes/analyzearea/ExpressionEvaluator";
import { SCAN_CAP } from "../classes/analyzearea/AreaAnalyzer";
import { regionCapacity, normalizeCorners } from "../classes/analyzearea/regionMath";
import { showSelector, showCreateForm, showAnalysisPage } from "../classes/analyzearea/AnalyzeAreaUI";

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
                + '[block](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/block?view=minecraft-bedrock-experimental) object '
                + '(does not include the dimension property). The `block` source keyword can be included or not.\n\n'
                + 'Example expressions:\n'
                + "- Stone block: `typeId == 'minecraft:stone'`\n"
                + "- Immovable block: `getComponent('minecraft:movable').movementType == 'Immovable'`\n"
                + "- Liquid source block: `permutation.getState('liquid_depth') == 0`",
            subCommandWikiDescription: {
                '': {
                    description: 'Open the area analyses menu.',
                    params: []
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

        if (from && to) {
            const existing = manager.findByCoords(from, to, player.dimension.id);
            system.run(() => {
                if (existing)
                    showAnalysisPage(player, manager, existing);
                else
                    showCreateForm(player, manager, { from, to });
            });
            return { status: CustomCommandStatus.Success };
        }

        system.run(() => showSelector(player, manager));
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
        const dimensionId = source.dimension.id;
        const { min, max } = normalizeCorners(from, to);
        if (regionCapacity(min, max) > SCAN_CAP)
            return { status: CustomCommandStatus.Failure, message: 'commands.analyzearea.overcapacity' };

        let analysis;
        try {
            void new ExpressionEvaluator(expression);
            analysis = Analysis.create(from, to, dimensionId, expression);
        } catch {
            return { status: CustomCommandStatus.Failure, message: 'commands.analyzearea.syntaxerror' };
        }

        const isPlayer = origin instanceof PlayerCommandOrigin;
        system.run(() => {
            manager.add(analysis);
            if (isPlayer) {
                showAnalysisPage(source, manager, analysis, true);
                return;
            }
            analysis.run()
                .then(() => origin.sendMessage({ translate: 'commands.analyzearea.completed', with: [String(analysis.matches.length)] }))
                .catch((error) => origin.sendMessage(analysisErrorMessage(error)));
        });
        return { status: CustomCommandStatus.Success };
    }
}

export const analyzeAreaCommand = new AnalyzeAreaCommand();
