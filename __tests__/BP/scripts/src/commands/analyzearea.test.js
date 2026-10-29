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

const managerApi = { findByCoords: vi.fn(), findByName: vi.fn(), remove: vi.fn(), add: vi.fn(), list: vi.fn(() => []) };
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

    it('opens a blank create form for `create`', () => {
        analyzeAreaCommand.analyzeAreaCommand(origin, 'create');
        scheduler.advanceTicks(1);
        expect(showCreateForm).toHaveBeenCalledWith({ name: undefined, from: undefined, to: undefined });
    });

    it('opens a create form prefilled with only the name for `create <name>`', () => {
        analyzeAreaCommand.analyzeAreaCommand(origin, 'create', 'Stone Farm');
        scheduler.advanceTicks(1);
        expect(showCreateForm).toHaveBeenCalledWith({ name: 'Stone Farm', from: undefined, to: undefined });
    });

    it('opens a matching analysis page for `create <name> <from> <to>`', () => {
        const analysis = { id: 'a1' };
        managerApi.findByCoords.mockReturnValue(analysis);
        analyzeAreaCommand.analyzeAreaCommand(origin, 'create', 'Stone Farm', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 });
        scheduler.advanceTicks(1);
        expect(uiConstructor).toHaveBeenCalledWith(player, managerApi);
        expect(showAnalysisPage).toHaveBeenCalledWith(analysis);
    });

    it('opens a prefilled create form when no analysis matches', () => {
        managerApi.findByCoords.mockReturnValue(undefined);
        analyzeAreaCommand.analyzeAreaCommand(origin, 'create', 'Stone Farm', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 });
        scheduler.advanceTicks(1);
        expect(showCreateForm).toHaveBeenCalledWith({ name: 'Stone Farm', from: { x: 0, y: 0, z: 0 }, to: { x: 1, y: 1, z: 1 } });
    });

    it('creates a named analysis for `create <name> <from> <to> <expression>`', () => {
        managerApi.findByName.mockReturnValue(undefined);
        analyzeAreaCommand.analyzeAreaCommand(origin, 'create', 'Stone Farm', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, 'true');
        scheduler.advanceTicks(1);
        expect(managerApi.add).toHaveBeenCalledTimes(1);
        expect(managerApi.add.mock.calls[0][0].name).toBe('Stone Farm');
        expect(showAnalysisPage).toHaveBeenCalledWith(managerApi.add.mock.calls[0][0], true);
    });

    it('rejects creating an analysis whose name is already taken', () => {
        managerApi.findByName.mockReturnValue({ id: 'a1' });
        const result = analyzeAreaCommand.analyzeAreaCommand(origin, 'create', 'Stone Farm', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, 'true');
        scheduler.advanceTicks(1);
        expect(result).toEqual({ status: 'Failure', message: 'commands.analyzearea.nametaken' });
        expect(managerApi.add).not.toHaveBeenCalled();
    });

    it('removes the analysis with that name for `remove <name>`', () => {
        const analysis = { id: 'a1' };
        managerApi.findByName.mockReturnValue(analysis);
        const result = analyzeAreaCommand.analyzeAreaCommand(origin, 'remove', 'Stone Farm');
        scheduler.advanceTicks(1);
        expect(managerApi.findByName).toHaveBeenCalledWith('Stone Farm');
        expect(managerApi.remove).toHaveBeenCalledWith(analysis);
        expect(result).toEqual({ status: 'Success', message: 'commands.analyzearea.removed' });
    });

    it('fails to remove when no analysis has that name', () => {
        managerApi.findByName.mockReturnValue(undefined);
        const result = analyzeAreaCommand.analyzeAreaCommand(origin, 'remove', 'Nope');
        scheduler.advanceTicks(1);
        expect(managerApi.remove).not.toHaveBeenCalled();
        expect(result).toEqual({ status: 'Failure', message: 'commands.analyzearea.removenotfound' });
    });

    it('removes by name from non-player origins', () => {
        const analysis = { id: 'a1' };
        managerApi.findByName.mockReturnValue(analysis);
        const blockOrigin = { getType: () => 'Block', sendMessage: vi.fn() };
        analyzeAreaCommand.analyzeAreaCommand(blockOrigin, 'remove', 'Stone Farm');
        scheduler.advanceTicks(1);
        expect(managerApi.remove).toHaveBeenCalledWith(analysis);
    });

    it('rejects UI-only forms for non-player origins', () => {
        const blockOrigin = { getType: () => 'Block', sendMessage: vi.fn() };
        const result = analyzeAreaCommand.analyzeAreaCommand(blockOrigin);
        expect(result).toEqual({ status: 'Failure', message: 'commands.generic.invalidsource' });
    });
});
