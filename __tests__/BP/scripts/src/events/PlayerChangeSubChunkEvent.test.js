import { PlayerChangeSubChunkEvent, playerChangeSubChunkEvent } from "../../../../../Canopy [BP]/scripts/src/events/PlayerChangeSubChunkEvent";
import { expect, it, describe, vi, beforeEach } from "vitest";

const mockPlayer1 = { id: 'player1' };
const mockPlayer2 = { id: 'player2' };

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
    world: {
        getAllPlayers: vi.fn(() => [void 0, mockPlayer1, mockPlayer2])
    }
}));

describe('PlayerChangeSubChunkEvent', () => {
    let tracker;
    let callback;

    beforeEach(() => {
        tracker = new PlayerChangeSubChunkEvent();
        tracker.playerLocationsLastTick = {};
        tracker.playerLocationsThisTick = {};
        vi.clearAllMocks();
        callback = vi.fn();
    });

    it('should send events for players who changed chunks', () => {
        tracker.subscribe(callback);
        tracker.playerLocationsThisTick[mockPlayer1.id] = { x: 0, y: 0, z: 0 };
        mockPlayer1.location = { x: 16, y: 0, z: 0 };
        tracker.onTick();
        expect(callback).toHaveBeenCalledWith({ player: mockPlayer1 });
    });

    it('should not send events for players who stayed in the same chunk', () => {
        tracker.subscribe(callback);
        tracker.playerLocationsThisTick[mockPlayer1.id] = { x: 0, y: 0, z: 0 };
        mockPlayer1.location = { x: 1, y: 0, z: 0 };
        tracker.onTick();
        expect(callback).not.toHaveBeenCalledWith({ player: mockPlayer1 });
    });

    it('should not send events for SimPlayers', () => {
        tracker.subscribe(callback);
        tracker.playerLocationsThisTick[void 0] = void 0;
        tracker.onTick();
        expect(callback).not.toHaveBeenCalledWith({ player: void 0 });
    });

    it('should send an event when a player spawns', () => {
        tracker.subscribe(callback);
        mockPlayer1.location = { x: 0, y: 0, z: 0 };
        tracker.onTick();
        expect(callback).toHaveBeenCalledWith({ player: mockPlayer1 });
    });

    it('should export an instance of the class', () => {
        expect(playerChangeSubChunkEvent).toBeInstanceOf(PlayerChangeSubChunkEvent);
    });
});