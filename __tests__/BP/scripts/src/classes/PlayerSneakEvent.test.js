import { PlayerSneakEvent } from "../../../../../Canopy [BP]/scripts/src/classes/PlayerSneakEvent";
import { expect, test, describe, vi } from "vitest";

vi.mock("@minecraft/server", () => ({
    system: {
        currentTick: (Date.now() / 50),
        runInterval: vi.fn((callback, interval) => {
            const intervalId = setInterval(callback, interval * 50);
            return {
                clear: () => clearInterval(intervalId)
            };
        }),
        clearRun: vi.fn((runner) => {
            runner.clear();
        })
    },
    InputButton: {
        Sneak: 'sneak'
    },
    ButtonState: {
        Pressed: 'Pressed',
        Released: 'Released'
    },
    world: {
        getAllPlayers: vi.fn(() => [
            undefined,
            { id: 'player1', inputInfo: { getButtonState: vi.fn(() => "Pressed" ) }, isOnGround: true, location: { x: 0, y: 0, z: 0 }, getRotation: vi.fn(() => ({ x: 0, y: 0 })) },
            { id: 'player2', inputInfo: { getButtonState: vi.fn(() => "Released" ) }, isOnGround: true, location: { x: 1, y: 1, z: 1 }, getRotation: vi.fn(() => ({ x: 0, y: 0 })) }
        ])
    }
}));

describe('SneakTracker', () => {
    test('should initialize properties correctly', () => {
        const tracker = new PlayerSneakEvent();
        expect(tracker.playersSneakingLastTick).toEqual([]);
        expect(tracker.playersSneakingThisTick).toEqual([]);
        expect(tracker.callbacks).toEqual([]);
    });

    test('should have a method that subscribes a callback to player sneak events', () => {
        const tracker = new PlayerSneakEvent();
        expect(typeof tracker.subscribe).toBe('function');
    });

    test('should start a sneak tracking interval on first subscribe', () => {
        const tracker = new PlayerSneakEvent();
        const subscribeSpy = vi.spyOn(tracker, 'startSneakTracking');
        tracker.startSneakTracking(() => {});
        expect(subscribeSpy).toHaveBeenCalled();
    });

    test('should not start a new interval if already started', () => {
        const tracker = new PlayerSneakEvent();
        const subscribeSpy = vi.spyOn(tracker, 'startSneakTracking');
        tracker.subscribe(() => {});
        tracker.subscribe(() => {});
        expect(subscribeSpy).toHaveBeenCalledTimes(1);
    });

    test('should have a method that unsubscribes a callback from player sneak events', () => {
        const tracker = new PlayerSneakEvent();
        const callback = () => {};
        tracker.subscribe(callback);
        tracker.unsubscribe(callback);
        expect(tracker.callbacks.length).toBe(0);
    });

    test('should clear the interval when all callbacks are unsubscribed', () => {
        const tracker = new PlayerSneakEvent();
        const callback = () => {};
        const clearRunSpy = vi.spyOn(tracker, 'endSneakTracking');
        tracker.subscribe(callback);
        tracker.unsubscribe(callback);
        expect(clearRunSpy).toHaveBeenCalled();
    });

    test('should not clear the interval if there are still callbacks subscribed', () => {
        const tracker = new PlayerSneakEvent();
        const callback = () => {};
        const clearRunSpy = vi.spyOn(tracker, 'endSneakTracking');
        tracker.subscribe(callback);
        tracker.subscribe(() => {});
        tracker.unsubscribe(callback);
        expect(clearRunSpy).not.toHaveBeenCalled();
    });

    test('should send events to all subscribed callbacks', () => {
        const tracker = new PlayerSneakEvent();
        const callback = vi.fn();
        tracker.subscribe(callback);
        tracker.playersSneakingThisTick = [{ id: 'player1' }];
        tracker.playersSneakingLastTick = [];
        tracker.sendEvents();
        expect(callback).toHaveBeenCalledWith({ playersStartedSneak: [{ id: 'player1' }] });
    });

    test('should only send events for players who started sneaking', () => {
        const tracker = new PlayerSneakEvent();
        const callback = vi.fn();
        const player1 = { id: 'player1' };
        tracker.subscribe(callback);
        tracker.playersSneakingThisTick = [player1];
        tracker.playersSneakingLastTick = [player1];
        tracker.sendEvents();
        expect(callback).not.toHaveBeenCalledWith({ playersStartedSneak: [{ id: 'player1' }] });
    });
});