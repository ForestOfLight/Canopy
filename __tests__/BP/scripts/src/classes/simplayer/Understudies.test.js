import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { system, world, Player } from '@minecraft/server';
import { SimulatedPlayer } from '@minecraft/server-gametest';
import { scheduler, worldDynamicPropertyStore } from '@forestoflight/minecraft-vitest-mocks';

vi.mock('@minecraft/server', async () => await import('@forestoflight/minecraft-vitest-mocks/server'));
vi.mock('@minecraft/server-gametest', async () => await import('@forestoflight/minecraft-vitest-mocks/server-gametest'));
vi.mock('../../../../../../Canopy[BP]/scripts/src/rules/simplayer/simplayerSaving', () => ({
    simplayerSaving: { getNativeValue: vi.fn(() => true), getID: vi.fn(() => 'simplayerSaving') }
}));

let Understudies;

function simulatedPlayer(name) {
    const player = new SimulatedPlayer();
    player.name = name;
    return player;
}

function invalidatedPlayer() {
    return {
        isValid: false,
        get name() {
            throw new Error("Failed to get property 'name'.");
        }
    };
}

beforeEach(async () => {
    vi.resetModules();
    system.runInterval.mockImplementation((cb, interval) => scheduler.scheduleInterval(cb, interval ?? 1));
    system.clearRun.mockImplementation(id => scheduler.delete(id));
    system.run.mockImplementation(cb => scheduler.scheduleDelay(cb, 1));
    system.runTimeout.mockImplementation((cb, d) => scheduler.scheduleDelay(cb, d));
    ({ default: Understudies } = await import('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies'));
});

afterEach(() => {
    scheduler.reset();
});

describe('isUnderstudy', () => {
    it('returns false when no understudies exist', () => {
        expect(Understudies.isUnderstudy({ name: 'Bob' })).toBe(false);
    });

    it('returns false for a player whose name matches a disconnected understudy', () => {
        Understudies.create('Bob');
        expect(Understudies.isUnderstudy({ name: 'Bob' })).toBe(false);
    });

    it('returns false for null', () => {
        expect(Understudies.isUnderstudy(null)).toBe(false);
    });
});

describe('lazy interval management', () => {
    it('does not start the interval before any understudy connects', () => {
        expect(scheduler.scheduled.size).toBe(0);
    });

    it('starts the interval when onConnect is called for the first time', () => {
        Understudies.create('Alice');
        Understudies.onConnect();
        expect(scheduler.scheduled.size).toBeGreaterThan(0);
    });

    it('does not start a second interval when onConnect is called again', () => {
        Understudies.create('Alice');
        Understudies.onConnect();
        const countAfterFirst = scheduler.scheduled.size;
        Understudies.onConnect();
        expect(scheduler.scheduled.size).toBe(countAfterFirst);
    });
});

describe('create and get', () => {
    it('creates and retrieves an understudy by name', () => {
        const u = Understudies.create('Charlie');
        expect(Understudies.get('Charlie')).toBe(u);
    });

    it('throws when creating a duplicate name that is already online', () => {
        Understudies.create('Dave');
        expect(() => Understudies.create('Dave')).toThrow();
    });
});

describe('adoptExisting', () => {
    it('adopts a live simulated player that has no understudy', () => {
        world.getAllPlayers.mockReturnValue([simulatedPlayer('Alice')]);
        Understudies.adoptExisting();
        expect(Understudies.get('Alice')?.isConnected()).toBe(true);
    });

    it('attaches the live entity rather than spawning a replacement', () => {
        const alice = simulatedPlayer('Alice');
        world.getAllPlayers.mockReturnValue([alice]);
        Understudies.adoptExisting();
        expect(Understudies.get('Alice').simulatedPlayer).toBe(alice);
    });

    it('ignores real players', () => {
        const steve = new Player();
        steve.name = 'Steve';
        world.getAllPlayers.mockReturnValue([steve]);
        Understudies.adoptExisting();
        expect(Understudies.isOnline('Steve')).toBe(false);
    });

    it('skips a name that already has an understudy', () => {
        const existing = Understudies.create('Alice');
        world.getAllPlayers.mockReturnValue([simulatedPlayer('Alice')]);
        Understudies.adoptExisting();
        expect(Understudies.get('Alice')).toBe(existing);
        expect(Understudies.length()).toBe(1);
    });

    it('adopts each player only once across repeated calls', () => {
        world.getAllPlayers.mockReturnValue([simulatedPlayer('Alice')]);
        Understudies.adoptExisting();
        Understudies.adoptExisting();
        expect(Understudies.length()).toBe(1);
    });

    it('starts the processing interval for adopted players', () => {
        world.getAllPlayers.mockReturnValue([simulatedPlayer('Alice')]);
        Understudies.adoptExisting();
        expect(scheduler.scheduled.size).toBeGreaterThan(0);
    });

    it('applies the nametag prefix to adopted players', () => {
        worldDynamicPropertyStore.set('nametagPrefix', 'Bot');
        const alice = simulatedPlayer('Alice');
        world.getAllPlayers.mockReturnValue([alice]);
        Understudies.adoptExisting();
        expect(alice.nameTag).toBe('\u00a7r[Bot\u00a7r] Alice');
    });

    it('does nothing when nobody is online', () => {
        world.getAllPlayers.mockReturnValue([]);
        Understudies.adoptExisting();
        expect(Understudies.length()).toBe(0);
    });
});

describe('onEntityDie', () => {
    it('does nothing when the dead entity is not a player', () => {
        const u = Understudies.create('Alice');
        Understudies.onConnect();
        u.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
        Understudies.onEntityDie({ deadEntity: { typeId: 'minecraft:zombie', name: 'Alice' } });
        expect(u.isConnected()).toBe(true);
    });

    it('disconnects and removes an understudy when their player entity dies', () => {
        const u = Understudies.create('Alice');
        Understudies.onConnect();
        u.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
        Understudies.onEntityDie({ deadEntity: { typeId: 'minecraft:player', name: 'Alice' } });
        expect(u.isConnected()).toBe(false);
    });
});

describe('onPlayerGameModeChange', () => {
    it('ignores game mode changes from an invalidated player handle', () => {
        const u = Understudies.create('Alice');
        Understudies.onConnect();
        u.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
        const saveSpy = vi.spyOn(u, 'savePlayerInfo');
        expect(() => Understudies.onPlayerGameModeChange({ player: invalidatedPlayer() })).not.toThrow();
        expect(saveSpy).not.toHaveBeenCalled();
    });

    it('saves player info when an understudy changes game mode', () => {
        const u = Understudies.create('Alice');
        Understudies.onConnect();
        u.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
        const saveSpy = vi.spyOn(u, 'savePlayerInfo');
        Understudies.onPlayerGameModeChange({ player: { isValid: true, name: 'Alice' } });
        expect(saveSpy).toHaveBeenCalled();
    });
});

describe('onPlayerInventoryItemChange', () => {
    it('subscribes to inventory changes once processing starts', () => {
        Understudies.onConnect();
        expect(world.afterEvents.playerInventoryItemChange.subscribe).toHaveBeenCalled();
    });

    it('marks the inventory dirty when an understudy picks up or loses an item', () => {
        const u = Understudies.create('Alice');
        Understudies.onConnect();
        u.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
        const spy = vi.spyOn(u, 'markInventoryDirty');
        Understudies.onPlayerInventoryItemChange({ player: { isValid: true, name: 'Alice' } });
        expect(spy).toHaveBeenCalled();
    });

    it('ignores inventory changes belonging to real players', () => {
        const u = Understudies.create('Alice');
        Understudies.onConnect();
        u.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
        const spy = vi.spyOn(u, 'markInventoryDirty');
        Understudies.onPlayerInventoryItemChange({ player: { isValid: true, name: 'Steve' } });
        expect(spy).not.toHaveBeenCalled();
    });

    it('ignores inventory changes from an invalidated player handle', () => {
        const u = Understudies.create('Alice');
        Understudies.onConnect();
        u.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
        const spy = vi.spyOn(u, 'markInventoryDirty');
        expect(() => Understudies.onPlayerInventoryItemChange({ player: invalidatedPlayer() })).not.toThrow();
        expect(spy).not.toHaveBeenCalled();
    });
});

describe('remove', () => {
    it('disconnects the understudy immediately', () => {
        const u = Understudies.create('Alice');
        Understudies.onConnect();
        u.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
        Understudies.remove(u);
        expect(u.isConnected()).toBe(false);
    });

    it('removes the understudy from the list after the disconnect is processed', () => {
        const u = Understudies.create('Alice');
        Understudies.onConnect();
        u.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
        scheduler.advanceTicks(1); // drain join's system.run before disconnecting
        Understudies.remove(u);
        scheduler.advanceTicks(1); // let remove's runInterval fire
        expect(Understudies.length()).toBe(0);
    });
});

describe('removeAll', () => {
    it('removes all online understudies', () => {
        const a = Understudies.create('Alice');
        const b = Understudies.create('Bob');
        Understudies.onConnect();
        a.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
        b.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
        scheduler.advanceTicks(1); // drain join callbacks before disconnecting
        Understudies.removeAll();
        scheduler.advanceTicks(1); // let remove intervals fire
        expect(Understudies.length()).toBe(0);
    });
});

describe('setNametagPrefix', () => {
    let u;

    beforeEach(() => {
        u = Understudies.create('Alice');
        Understudies.onConnect();
        u.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
    });

    it('sets nameTag to [prefix] name format when prefix is non-empty', () => {
        Understudies.setNametagPrefix('Bot');
        expect(u.simulatedPlayer.nameTag).toBe('§r[Bot§r] Alice');
    });

    it('resets nameTag to just the name when prefix is empty string', () => {
        Understudies.setNametagPrefix('Bot');
        Understudies.setNametagPrefix('');
        expect(u.simulatedPlayer.nameTag).toBe('Alice');
    });

    it('stores the prefix in world dynamic property', () => {
        Understudies.setNametagPrefix('Bot');
        expect(world.setDynamicProperty).toHaveBeenCalledWith('nametagPrefix', 'Bot');
    });
});

describe('addNametagPrefix', () => {
    let u;

    beforeEach(() => {
        u = Understudies.create('Alice');
        Understudies.onConnect();
        u.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
    });

    it('sets nameTag when a prefix is stored in world properties', () => {
        world.getDynamicProperty.mockReturnValueOnce('Bot');
        Understudies.addNametagPrefix(u);
        expect(u.simulatedPlayer.nameTag).toBe('§r[Bot§r] Alice');
    });

    it('does not change nameTag when no prefix is stored', () => {
        world.getDynamicProperty.mockReturnValueOnce(undefined);
        const before = u.simulatedPlayer.nameTag;
        Understudies.addNametagPrefix(u);
        expect(u.simulatedPlayer.nameTag).toBe(before);
    });
});

describe('message helpers', () => {
    it('returns the correct not-online message', () => {
        expect(Understudies.getNotOnlineMessage('TestBot')).toEqual({ translate: 'simplayer.notonline', with: ['TestBot'] });
    });

    it('returns the correct already-online message', () => {
        expect(Understudies.getAlreadyOnlineMessage('TestBot')).toEqual({ translate: 'simplayer.alreadyonline', with: ['TestBot'] });
    });
});
