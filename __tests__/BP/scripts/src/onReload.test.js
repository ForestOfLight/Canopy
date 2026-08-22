import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../Canopy[BP]/scripts/src/classes/simplayer/LegacyInventoryMigrator', () => ({
    LegacyInventoryMigrator: { migrate: vi.fn(() => Promise.resolve()) }
}));
vi.mock('../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: { adoptExisting: vi.fn() }
}));
vi.mock('../../../../Canopy[BP]/scripts/src/worldStartup', () => ({
    startWorldSystems: vi.fn()
}));

let Understudies;
let startWorldSystems;

async function withPlayersOnline(players) {
    const { world, Player } = await import('@minecraft/server');
    world.getAllPlayers.mockReturnValue(players.map(() => new Player()));
}

async function loadOnReload() {
    await import('../../../../Canopy[BP]/scripts/src/onReload');
    ({ default: Understudies } = await import('../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies'));
    ({ startWorldSystems } = await import('../../../../Canopy[BP]/scripts/src/worldStartup'));
}

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
});

describe('onReload', () => {
    it('starts the world systems again so inventory proxies work after a reload', async () => {
        await withPlayersOnline([1]);
        await loadOnReload();
        await vi.waitFor(() => expect(startWorldSystems).toHaveBeenCalled());
    });

    it('adopts existing simplayers before starting the world systems', async () => {
        await withPlayersOnline([1]);
        await loadOnReload();
        await vi.waitFor(() => expect(startWorldSystems).toHaveBeenCalled());
        expect(Understudies.adoptExisting.mock.invocationCallOrder[0])
            .toBeLessThan(startWorldSystems.mock.invocationCallOrder[0]);
    });

    it('does nothing when no valid player is in the world', async () => {
        await withPlayersOnline([]);
        await loadOnReload();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(startWorldSystems).not.toHaveBeenCalled();
        expect(Understudies.adoptExisting).not.toHaveBeenCalled();
    });
});
