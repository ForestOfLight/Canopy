import { describe, it, expect, vi, beforeEach } from 'vitest';
import { world, Player } from '@minecraft/server';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import { PlayerCommandOrigin } from '../../../../../Canopy[BP]/scripts/lib/canopy/Canopy';

const uiConstructor = vi.fn();
const showSelector = vi.fn();
const showCreateForm = vi.fn();
const showAnalysisPage = vi.fn();
vi.mock('../../../../../Canopy[BP]/scripts/src/classes/analyzearea/AnalyzeAreaUI', () => ({
    LIST_PAGE_SIZE: 50,
    AnalyzeAreaUI: class {
        constructor(player, manager) { uiConstructor(player, manager); }
        showSelector(...a) { return showSelector(...a); }
        showCreateForm(...a) { return showCreateForm(...a); }
        showAnalysisPage(...a) { return showAnalysisPage(...a); }
    }
}));

const managerApi = { findByCoords: vi.fn(), remove: vi.fn(), add: vi.fn(), list: vi.fn(() => []) };
vi.mock('../../../../../Canopy[BP]/scripts/src/classes/analyzearea/AreaAnalysisManager', () => ({
    PROPERTY_KEY: 'areaanalyses',
    AreaAnalysisManager: { getInstance: () => managerApi }
}));

import { analyzeAreaCommand } from '../../../../../Canopy[BP]/scripts/src/commands/analyzearea';

describe('analyzeAreaCommand', () => {
    let player;
    let origin;

    beforeEach(() => {
        vi.clearAllMocks();
        scheduler.reset();
        player = new Player();
        player.name = 'Tester';
        player.dimension = { id: 'minecraft:overworld' };
        origin = new PlayerCommandOrigin({ sourceType: 'Entity', sourceEntity: player });
    });

    it('opens the selector with no args for a player', () => {
        analyzeAreaCommand.analyzeAreaCommand(origin);
        scheduler.advanceTicks(1);
        world.getDimension('minecraft:overworld'); // noop to keep world imported
        expect(uiConstructor).toHaveBeenCalledWith(player, managerApi);
        expect(showSelector).toHaveBeenCalledWith();
    });

    it('opens a matching analysis page for <from> <to>', () => {
        const analysis = { id: 'a1' };
        managerApi.findByCoords.mockReturnValue(analysis);
        analyzeAreaCommand.analyzeAreaCommand(origin, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 });
        scheduler.advanceTicks(1);
        expect(uiConstructor).toHaveBeenCalledWith(player, managerApi);
        expect(showAnalysisPage).toHaveBeenCalledWith(analysis);
    });

    it('opens a prefilled create form when no analysis matches', () => {
        managerApi.findByCoords.mockReturnValue(undefined);
        analyzeAreaCommand.analyzeAreaCommand(origin, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 });
        scheduler.advanceTicks(1);
        expect(showCreateForm).toHaveBeenCalledWith({ from: { x: 0, y: 0, z: 0 }, to: { x: 1, y: 1, z: 1 } });
    });

    it('removes a matching analysis for the reserved `remove` token', () => {
        const analysis = { id: 'a1' };
        managerApi.findByCoords.mockReturnValue(analysis);
        analyzeAreaCommand.analyzeAreaCommand(origin, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, 'remove');
        scheduler.advanceTicks(1);
        expect(managerApi.remove).toHaveBeenCalledWith(analysis);
    });

    it('rejects UI-only forms for non-player origins', () => {
        const blockOrigin = { getType: () => 'Block', sendMessage: vi.fn() };
        const result = analyzeAreaCommand.analyzeAreaCommand(blockOrigin);
        expect(result).toEqual({ status: 'Failure', message: 'commands.generic.invalidsource' });
    });
});
