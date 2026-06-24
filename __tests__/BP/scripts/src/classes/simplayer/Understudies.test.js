import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { system, world } from '@minecraft/server';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';

vi.mock('@minecraft/server', async () => await import('@forestoflight/minecraft-vitest-mocks/server'));
vi.mock('@minecraft/server-gametest', async () => await import('@forestoflight/minecraft-vitest-mocks/server-gametest'));
vi.mock('../../../../../../Canopy[BP]/scripts/src/rules/simplayer/simplayerSaving', () => ({
    simplayerSaving: { getNativeValue: vi.fn(() => true), getID: vi.fn(() => 'simplayerSaving') }
}));

let Understudies;

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
    it('saves player info when an understudy changes game mode', () => {
        const u = Understudies.create('Alice');
        Understudies.onConnect();
        u.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
        const saveSpy = vi.spyOn(u, 'savePlayerInfo');
        Understudies.onPlayerGameModeChange({ player: { name: 'Alice' } });
        expect(saveSpy).toHaveBeenCalled();
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
