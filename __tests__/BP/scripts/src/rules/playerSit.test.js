import { playerSit } from "../../../../../Canopy [BP]/scripts/src/rules/playerSit";
import { expect, test, describe, vi, beforeAll, afterAll, afterEach } from "vitest";
import { playerStartSneakEvent } from "../../../../../Canopy [BP]/scripts/src/events/PlayerStartSneakEvent";

const rideableEntity = {
    type: 'canopy:rideable',
    getComponent: vi.fn(() => ({
        getRiders: vi.fn(() => []),
        addRider: vi.fn()
    })),
    remove: vi.fn(),
    setRotation: vi.fn()
};

vi.mock("@minecraft/server", () => ({
    system: {
        afterEvents: {
            scriptEventReceive: {
                subscribe: vi.fn()
            }
        },
        runJob: vi.fn(),
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
        getAllPlayers: vi.fn(() => [
            undefined,
            { id: 'player1', inputInfo: { getButtonState: vi.fn(() => "Pressed" ) }, isOnGround: true, location: { x: 0, y: 0, z: 0 }, getRotation: vi.fn(() => ({ x: 0, y: 0 })) },
            { id: 'player2', inputInfo: { getButtonState: vi.fn(() => "Released" ) }, isOnGround: true, location: { x: 1, y: 1, z: 1 }, getRotation: vi.fn(() => ({ x: 0, y: 0 })) }
        ]),
        beforeEvents: {
            chatSend: {
                subscribe: vi.fn()
            }
        },
        getDynamicProperty: vi.fn(),
        setDynamicProperty: vi.fn(),
        getDimension: vi.fn(() => ({
            getEntities: vi.fn(() => [rideableEntity])
        }))
    },
    InputButton: {
        Sneak: 'sneak'
    },
    ButtonState: {
        Pressed: 'Pressed',
        Released: 'Released'
    },
    EntityComponentTypes: {
        Rideable: 'rideable'
    },
    DimensionTypes: {
        getAll: vi.fn(() => [{ typeId: 'overworld' }])
    }
}));

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('playerSit', () => {
    beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2000, 1, 1, 0, 0,));
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.advanceTimersByTime(10000);
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    test('should do nothing when rule is not enabled', () => {
        const onPlayerStartSneakSpy = vi.spyOn(playerSit, 'onPlayerStartSneak');
        playerSit.setValue(true);
        playerSit.setValue(false);
        playerStartSneakEvent.sendEvents();
        expect(onPlayerStartSneakSpy).not.toHaveBeenCalled();
    });

    test('should process rule when it is enabled', () => {
        const onPlayerStartSneakSpy = vi.spyOn(playerSit, 'onPlayerStartSneak');
        playerSit.setValue(true);
        playerStartSneakEvent.playersSneakingThisTick.push({ id: 'player1' });
        playerStartSneakEvent.sendEvents();
        expect(onPlayerStartSneakSpy).toHaveBeenCalled();
    })

    test('should have sneakCount and sneakSpeedMs properties', () => {
        expect(playerSit.sneakCount).toBe(3);
        expect(playerSit.sneakSpeedMs).toBe(200);
    });

    test('should make players sit who have sneaked with the correct timing', () => {
        const sitSpy = vi.spyOn(playerSit, 'sit');
        const player1 = { 
            id: 'player1', 
            isOnGround: true, 
            location: { x: 0, y: 0, z: 0 }, 
            getRotation: () => ({ x: 0, y: 0 }), 
            dimension: { spawnEntity: () => rideableEntity } 
        };
        for (let i = 0; i < playerSit.sneakCount; i++) {
            vi.advanceTimersByTime(playerSit.sneakSpeedMs - 1);
            playerSit.onPlayerStartSneak({ players: [player1] });
        }
        expect(sitSpy).toHaveBeenCalledWith(player1);
    });

    test('should not make players sit who have not sneaked enough times', () => {
        const sitSpy = vi.spyOn(playerSit, 'sit');
        const player1 = { 
            id: 'player1',
            isOnGround: true
        };
        for (let i = 0; i < playerSit.sneakCount - 1; i++) {
            vi.advanceTimersByTime(playerSit.sneakSpeedMs - 1);
            playerSit.onPlayerStartSneak({ players: [player1] });
        }
        expect(sitSpy).not.toHaveBeenCalled();
    });

    test('should not make players sit who have sneaked too slowly', () => {
        const sitSpy = vi.spyOn(playerSit, 'sit');
        const player1 = { 
            id: 'player1', 
            isOnGround: true
        };
        for (let i = 0; i < playerSit.sneakCount; i++) {
            vi.advanceTimersByTime(playerSit.sneakSpeedMs + 1);
            playerSit.onPlayerStartSneak({ players: [player1] });
        }
        expect(sitSpy).not.toHaveBeenCalled();
    });

    test('should reset sneak count if player does not sneak within the allowed time', () => {
        const sitSpy = vi.spyOn(playerSit, 'sit');
        const player1 = { 
            id: 'player1', 
            isOnGround: true
        };
        for (let i = 0; i < playerSit.sneakCount - 1; i++) {
            vi.advanceTimersByTime(playerSit.sneakSpeedMs - 1);
            playerSit.onPlayerStartSneak({ players: [player1] });
        }
        vi.advanceTimersByTime(playerSit.sneakSpeedMs + 1);
        playerSit.onPlayerStartSneak({ players: [player1] });
        vi.advanceTimersByTime(playerSit.sneakSpeedMs - 1);
        playerSit.onPlayerStartSneak({ players: [player1] });
        expect(sitSpy).not.toHaveBeenCalled();
    });

    test('should remove ridable entities without a rider', () => {
        const removeSpy = vi.spyOn(playerSit, 'removeEntitiesWithNoRider');
        playerSit.cleanupEntities();
        expect(removeSpy).toHaveBeenCalledWith([rideableEntity]);
    });
});