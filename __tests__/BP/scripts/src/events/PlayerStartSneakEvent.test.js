import { PlayerStartSneakEvent, playerStartSneakEvent } from "../../../../../Canopy [BP]/scripts/src/events/PlayerStartSneakEvent";
import { expect, test, describe, vi } from "vitest";

const mockPlayer1 = { id: 'player1', inputInfo: { getButtonState: vi.fn(() => "Pressed" ) }, isOnGround: true, location: { x: 0, y: 0, z: 0 }, getRotation: vi.fn(() => ({ x: 0, y: 0 })) };
const mockPlayer2 = { id: 'player2', inputInfo: { getButtonState: vi.fn(() => "Released" ) }, isOnGround: true, location: { x: 1, y: 1, z: 1 }, getRotation: vi.fn(() => ({ x: 0, y: 0 })) };

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
        getAllPlayers: vi.fn(() => [undefined, mockPlayer1, mockPlayer2])
    }
}));

describe('SneakTracker', () => {
    test('should initialize properties correctly', () => {
        const tracker = new PlayerStartSneakEvent();
        expect(tracker.playersSneakingLastTick).toEqual([]);
        expect(tracker.playersSneakingThisTick).toEqual([]);
        expect(tracker.callbacks).toEqual([]);
    });

    test('should have a method that subscribes a callback to player sneak events', () => {
        const tracker = new PlayerStartSneakEvent();
        expect(typeof tracker.subscribe).toBe('function');
    });

    test('should start a sneak tracking interval on first subscribe', () => {
        const tracker = new PlayerStartSneakEvent();
        const subscribeSpy = vi.spyOn(tracker, 'startTrackingEvent');
        tracker.subscribe(() => {});
        expect(subscribeSpy).toHaveBeenCalled();
    });

    test('should not start a new interval if already started', () => {
        const tracker = new PlayerStartSneakEvent();
        const subscribeSpy = vi.spyOn(tracker, 'startTrackingEvent');
        tracker.subscribe(() => {});
        tracker.subscribe(() => {});
        expect(subscribeSpy).toHaveBeenCalledTimes(1);
    });

    test('should have a method that unsubscribes a callback from player sneak events', () => {
        const tracker = new PlayerStartSneakEvent();
        const callback = () => {};
        tracker.subscribe(callback);
        tracker.unsubscribe(callback);
        expect(tracker.callbacks.length).toBe(0);
    });

    test('should clear the interval when all callbacks are unsubscribed', () => {
        const tracker = new PlayerStartSneakEvent();
        const callback = () => {};
        const clearRunSpy = vi.spyOn(tracker, 'stopTrackingEvent');
        tracker.subscribe(callback);
        tracker.unsubscribe(callback);
        expect(clearRunSpy).toHaveBeenCalled();
    });

    test('should not clear the interval if there are still callbacks subscribed', () => {
        const tracker = new PlayerStartSneakEvent();
        const callback = () => {};
        const clearRunSpy = vi.spyOn(tracker, 'stopTrackingEvent');
        tracker.subscribe(callback);
        tracker.subscribe(() => {});
        tracker.unsubscribe(callback);
        expect(clearRunSpy).not.toHaveBeenCalled();
    });

    test('should send events to all subscribed callbacks when a player starts sneaking', () => {
        const tracker = new PlayerStartSneakEvent();
        const callback = vi.fn();
        tracker.subscribe(callback);
        tracker.playersSneakingThisTick = [];
        tracker.playersSneakingLastTick = [];
        tracker.onTick();
        expect(callback).toHaveBeenCalledWith({ player: mockPlayer1 });
    });

    test('should only send events for players who started sneaking', () => {
        const tracker = new PlayerStartSneakEvent();
        const callback = vi.fn();
        tracker.subscribe(callback);
        tracker.playersSneakingThisTick = [mockPlayer1];
        tracker.playersSneakingLastTick = [mockPlayer1];
        tracker.onTick();
        expect(callback).not.toHaveBeenCalledWith({ player: mockPlayer1 });
    });

    test('should export an instance of the class', () => {
        expect(playerStartSneakEvent).toBeInstanceOf(PlayerStartSneakEvent);
    });
});