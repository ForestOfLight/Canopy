import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from "@minecraft/server";
import { AreaAnalysisManager } from "../classes/analyzearea/AreaAnalysisManager";
import { Analysis } from "../classes/analyzearea/Analysis";
import { ExpressionEvaluator } from "../classes/analyzearea/ExpressionEvaluator";
import { regionCapacity, normalizeCorners } from "../classes/analyzearea/regionMath";
import { showSelector, showCreateForm, showAnalysisPage } from "../classes/analyzearea/AnalyzeAreaUI";

const SCAN_CAP = 32767 * 4;
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
            wikiDescription: 'Analyze a region of blocks with a JavaScript expression (parsed by jsep). ' +
                'Run with no arguments to open the analyses menu. `<from> <to>` opens the matching saved analysis ' +
                '(or a prefilled create form). `<from> <to> <expression>` creates and runs an analysis directly; ' +
                'use the expression `remove` to delete the analysis with those coordinates.',
            subCommandWikiDescription: {
                '': { description: 'Open the area-analyses menu.', params: [] },
                '<from: Location> <to: Location>': {
                    description: 'Open the saved analysis for those coordinates, or a prefilled create form.',
                    params: ['from', 'to']
                },
                '<from: Location> <to: Location> <expression: String>': {
                    description: 'Create and run an analysis; the reserved expression `remove` deletes the matching analysis.',
                    params: ['from', 'to', 'expression']
                }
            }
        });
    }

    analyzeAreaCommand(origin, from, to, expression) {
        const manager = AreaAnalysisManager.getInstance();

        // 3-arg form works for all origins.
        if (from && to && expression !== undefined) {
            if (expression === REMOVE_TOKEN)
                return this.#removeAnalysis(origin, manager, from, to);
            return this.#createAndRun(origin, manager, from, to, expression);
        }

        // UI-only forms require a player.
        if (origin.getType() !== 'Player')
            return { status: CustomCommandStatus.Failure, message: 'commands.analyzearea.playeronly' };
        const player = origin.getSource();

        if (from && to) {
            const existing = manager.findByCoords(from, to, player.dimension.id);
            system.run(() => {
                if (existing) showAnalysisPage(player, manager, existing);
                else showCreateForm(player, manager, { from, to });
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
        manager.remove(existing);
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
            // Validate expression syntax before persisting (throws on parse error).
            void new ExpressionEvaluator(expression);
            analysis = Analysis.create(from, to, dimensionId, expression);
        } catch {
            return { status: CustomCommandStatus.Failure, message: 'commands.analyzearea.syntaxerror' };
        }

        const isPlayer = origin.getType() === 'Player';
        // Non-player origins (e.g. command blocks) resolve to a source without sendMessage; guard it.
        const notify = (message) => {
            if (typeof source.sendMessage === 'function')
                source.sendMessage(message);
        };
        system.run(() => {
            manager.add(analysis);
            analysis.run(source.dimension)
                .then(() => {
                    if (isPlayer) showAnalysisPage(source, manager, analysis);
                    else notify({ translate: 'commands.analyzearea.completed', with: [String(analysis.matches.length)] });
                })
                .catch(() => notify({ translate: 'commands.analyzearea.loadcapacity' }));
        });
        return { status: CustomCommandStatus.Success };
    }
}

export const analyzeAreaCommand = new AnalyzeAreaCommand();
