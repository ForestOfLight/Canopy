import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { system, world } from '@minecraft/server';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';

vi.mock('@minecraft/server', async () => await import('@forestoflight/minecraft-vitest-mocks/server'));
vi.mock('@minecraft/server-gametest', async () => await import('@forestoflight/minecraft-vitest-mocks/server-gametest'));
vi.mock('../../../../../../Canopy[BP]/scripts/src/rules/simplayer/noSimplayerSaving', () => ({
    noSimplayerSaving: { getNativeValue: vi.fn(() => false), getID: vi.fn(() => 'noSimplayerSaving') }
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
