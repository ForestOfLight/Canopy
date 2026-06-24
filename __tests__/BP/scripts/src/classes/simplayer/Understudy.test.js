import { vi, describe, it, expect, beforeEach } from 'vitest';
import { world, system, Block, Entity, Player } from '@minecraft/server';
import { scheduler, worldDynamicPropertyStore } from '@forestoflight/minecraft-vitest-mocks';
import Understudy from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudy';
import { MOVE_OPTIONS } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playermove';

vi.mock('../../../../../../Canopy[BP]/scripts/src/rules/simplayer/noSimplayerSaving', () => ({
    noSimplayerSaving: { getNativeValue: vi.fn(() => false), getID: vi.fn(() => 'noSimplayerSaving') }
}));
vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: { onConnect: vi.fn() }
}));

describe('Understudy', () => {
    let understudy;

    beforeEach(() => {
        vi.clearAllMocks();
        system.currentTick = 0;
        understudy = new Understudy('TestBot');
    });

    describe('constructor', () => {
        it('stores the given name', () => {
            expect(understudy.name).toBe('TestBot');
        });

        it('captures system.currentTick as createdTick', () => {
            system.currentTick = 42;
            expect(new Understudy('Alice').createdTick).toBe(42);
        });

        it('starts disconnected', () => {
            expect(understudy.isConnected()).toBe(false);
        });
    });

    describe('isConnected', () => {
        it('returns false before join is called', () => {
            expect(understudy.isConnected()).toBe(false);
        });

        it('returns true after join is called', () => {
            understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
            expect(understudy.isConnected()).toBe(true);
        });

        it('returns false after leave is called', () => {
            understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
            understudy.leave();
            expect(understudy.isConnected()).toBe(false);
        });
    });

    describe('createdTick', () => {
        it('returns the tick when the Understudy was created', () => {
            system.currentTick = 100;
            const u = new Understudy('Alice');
            expect(u.createdTick).toBe(100);
        });

        it('cannot be set', () => {
            expect(() => { understudy.createdTick = 50; }).toThrow();
        });
    });

    describe('join', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('creates a new simulated player', () => {
            understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
            expect(understudy.simulatedPlayer).toBeDefined();
        });

        it('sets isConnected to true', () => {
            understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
            expect(understudy.isConnected()).toBe(true);
        });

        it('throws if already connected', () => {
            understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
            expect(() => understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() })).toThrow();
        });

        it('warns if loading player info hits a known error', () => {
            system.run.mockImplementation(cb => { scheduler.scheduleDelay(cb, 1); });
            vi.spyOn(world, 'getDynamicProperty').mockImplementation((key) => {
                if (key === 'TestBot:playerinfo')
                    return 'invalid json';
                return void 0;
            });
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
            scheduler.advanceTicks(1);
            expect(warnSpy).toHaveBeenCalled();
        });

        it('throws if loading player info hits an unknown error', () => {
            system.run.mockImplementation(cb => { cb(); });
            const original = world.getDynamicProperty;
            vi.spyOn(world, 'getDynamicProperty').mockImplementation((key, value) => {
                if (key === 'TestBot:playerinfo')
                    throw new Error('Unexpected error');
                else
                    return original.call(world, key, value);
            });
            expect(() => {
                understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
            }).toThrow();
        });
    });

    describe('rejoin', () => {
        it('calls join with saved player info', () => {
            const savedInfo = { location: { x: 0, y: 64, z: 0 }, dimensionId: 'minecraft:overworld', rotation: { x: 0, y: 0 }, gameMode: 'Survival' };
            worldDynamicPropertyStore.set('TestBot:playerinfo', JSON.stringify(savedInfo));
            vi.spyOn(understudy, 'join');
            understudy.rejoin();
            expect(understudy.join).toHaveBeenCalledWith(
                expect.objectContaining({ location: savedInfo.location, rotation: savedInfo.rotation, gameMode: savedInfo.gameMode })
            );
        });

        it('throws if already connected', () => {
            understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
            expect(() => understudy.rejoin()).toThrow();
        });
    });

    describe('while connected', () => {
        beforeEach(() => {
            understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() });
        });

        describe('onConnectedTick', () => {
            it('updates the player info saver', () => {
                understudy.onConnectedTick();
                expect(world.setDynamicProperty).toHaveBeenCalledWith(
                    expect.stringContaining('TestBot:playerinfo'), expect.any(String)
                );
            });

            it('runs the actions', () => {
                understudy.actions.once('attack');
                understudy.onConnectedTick();
                expect(understudy.actions.isEmpty()).toBe(true);
            });

            it('clears the look target if it is no longer valid', () => {
                const target = new Entity();
                target.isValid = true;
                target.location = { x: 0, y: 64, z: 0 };
                understudy.look(target);
                target.isValid = false;
                understudy.onConnectedTick();
                expect(understudy.lookTarget).toBeUndefined();
            });

            it('keeps the look target if it is still valid', () => {
                const target = new Entity();
                target.isValid = true;
                target.location = { x: 0, y: 64, z: 0 };
                understudy.look(target);
                understudy.onConnectedTick();
                expect(understudy.lookTarget).toBe(target);
            });

            it('refreshes the held item of the simulated player', () => {
                const spy = vi.spyOn(understudy, 'refreshHeldItem');
                understudy.onConnectedTick();
                expect(spy).toHaveBeenCalled();
            });
        });

        describe('simulatedPlayer', () => {
            it('returns the simulated player object', () => {
                expect(understudy.simulatedPlayer).toBeDefined();
            });

            it('cannot be set directly', () => {
                expect(() => { understudy.simulatedPlayer = {}; }).toThrow();
            });

            it('throws when accessed while not connected', () => {
                understudy.leave();
                expect(() => understudy.simulatedPlayer).toThrow();
            });
        });

        describe('actions', () => {
            it('returns the actions object', () => {
                expect(understudy.actions).toBeDefined();
            });

            it('cannot be set directly', () => {
                expect(() => { understudy.actions = {}; }).toThrow();
            });

            it('throws when accessed while not connected', () => {
                understudy.leave();
                expect(() => understudy.actions).toThrow();
            });
        });

        describe('lookTarget / clearLookTarget', () => {
            it('lookTarget returns undefined initially', () => {
                expect(understudy.lookTarget).toBeUndefined();
            });

            it('returns a target after instructed to look', () => {
                const mockBlock = new Block();
                mockBlock.location = { x: 0, y: 64, z: 0 };
                understudy.look(mockBlock);
                expect(understudy.lookTarget).toBeDefined();
            });

            it('clearLookTarget sets lookTarget to undefined', () => {
                understudy.clearLookTarget();
                expect(understudy.lookTarget).toBeUndefined();
            });

            it('cannot be set directly', () => {
                expect(() => { understudy.lookTarget = {}; }).toThrow();
            });

            it('throws an error if the understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.lookTarget).toThrow();
            });
        });

        describe('headRotation', () => {
            it('returns simulatedPlayer.headRotation when there is no look target', () => {
                understudy.simulatedPlayer.headRotation = { x: 10, y: 20 };
                expect(understudy.headRotation).toEqual({ x: 10, y: 20 });
            });

            it('returns simulatedPlayer.headRotation and clears target when target.isValid is false', () => {
                const invalidEntity = new Entity();
                invalidEntity.isValid = false;
                invalidEntity.location = { x: 1, y: 64, z: 1 };
                understudy.look(invalidEntity);
                expect(understudy.headRotation).toEqual({ x: 0, y: 0 });
                expect(understudy.lookTarget).toBeUndefined();
            });

            it('returns a computed rotation toward a non-Entity target with isValid true', () => {
                const blockTarget = new Block();
                blockTarget.isValid = true;
                blockTarget.location = { x: 10, y: 64, z: 0 };
                understudy.look(blockTarget);
                const result = understudy.headRotation;
                expect(result).not.toEqual({ x: 0, y: 0 });
            });

            it('returns a computed rotation toward an Entity target', () => {
                const entityTarget = new Entity();
                entityTarget.isValid = true;
                entityTarget.getHeadLocation = vi.fn(() => ({ x: 10, y: 65, z: 0 }));
                understudy.look(entityTarget);
                const result = understudy.headRotation;
                expect(result).not.toEqual({ x: 0, y: 0 });
            });

            it('returns headRotation when Entity.getHeadLocation throws', () => {
                const entityTarget = new Entity();
                entityTarget.isValid = true;
                entityTarget.getHeadLocation = vi.fn(() => { throw new Error('invalid'); });
                understudy.look(entityTarget);
                expect(understudy.headRotation).toEqual({ x: 0, y: 0 });
            });

            it('cannot be set directly', () => {
                expect(() => { understudy.headRotation = {}; }).toThrow();
            });

            it('throws an error if the understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.headRotation).toThrow();
            });
        });

        describe('savePlayerInfo', () => {
            it('delegates to playerInfoSaver.save()', () => {
                understudy.savePlayerInfo();
                expect(world.setDynamicProperty).toHaveBeenCalled();
            });

            it('throws an error if the understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.savePlayerInfo()).toThrow();
            });
        });

        describe('leave', () => {
            it('removes the simulated player', () => {
                understudy.leave();
                expect(() => understudy.simulatedPlayer).toThrow();
            });

            it('sets isConnected to false', () => {
                understudy.leave();
                expect(understudy.isConnected()).toBe(false);
            });

            it('broadcasts a leave message', () => {
                understudy.leave();
                expect(world.sendMessage).toHaveBeenCalledWith(expect.stringContaining('TestBot'));
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.leave()).toThrow();
            });
        });

        describe('teleport', () => {
            beforeEach(() => {
                vi.clearAllMocks();
            });

            it('teleports the simulatedPlayer to the given location', () => {
                const teleportOptions = { location: { x: 5, y: 70, z: 5 }, dimension: world.getDimension(), rotation: { x: 0, y: 0 } };
                understudy.teleport(teleportOptions);
                expect(understudy.simulatedPlayer.teleport).toHaveBeenCalledWith(
                    teleportOptions.location, expect.any(Object)
                );
            });

            it('passes rotation and dimension in teleport options', () => {
                const teleportOptions = { location: { x: 5, y: 70, z: 5 }, dimension: world.getDimension(), rotation: { x: 10, y: 45 } };
                understudy.teleport(teleportOptions);
                const options = understudy.simulatedPlayer.teleport.mock.calls[0][1];
                expect(options.dimension).toBeDefined();
                expect(options.rotation).toEqual(teleportOptions.rotation);
            });

            it('uses 0, 0 as default rotation', () => {
                const teleportOptions = { location: { x: 5, y: 70, z: 5 }, dimension: world.getDimension() };
                understudy.teleport(teleportOptions);
                const options = understudy.simulatedPlayer.teleport.mock.calls[0][1];
                expect(options.rotation).toEqual({ x: 0, y: 0 });
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.teleport({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension() })).toThrow();
            });
        });

        describe('look', () => {
            it('calls lookAtBlock and stores block as look target', () => {
                const target = new Block();
                target.location = { x: 0, y: 64, z: 0 };
                understudy.look(target);
                expect(understudy.simulatedPlayer.lookAtBlock).toHaveBeenCalledWith(target);
                expect(understudy.lookTarget).toBe(target);
            });

            it('calls lookAtEntity and stores entity as look target', () => {
                const target = new Entity();
                understudy.look(target);
                expect(understudy.simulatedPlayer.lookAtEntity).toHaveBeenCalledWith(target);
                expect(understudy.lookTarget).toBe(target);
            });

            it('calls lookAtLocation for a rotation object without storing a look target', () => {
                understudy.look({ x: 15, y: 90 });
                expect(understudy.simulatedPlayer.lookAtLocation).toHaveBeenCalled();
                expect(understudy.simulatedPlayer.setRotation).toHaveBeenCalledWith({ x: 15, y: 90 });
                expect(understudy.lookTarget).toBeUndefined();
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.look({ x: 0, y: 0 })).toThrow();
            });
        });

        describe('stopLooking', () => {
            beforeEach(() => {
                vi.clearAllMocks();
            });

            it('returns early when there is no look target', () => {
                understudy.stopLooking();
                expect(understudy.simulatedPlayer.lookAtLocation).not.toHaveBeenCalled();
            });

            it('looks at the location for a Block target', () => {
                const target = new Block();
                target.location = { x: 5, y: 64, z: 5 };
                understudy.look(target);
                understudy.stopLooking();
                expect(understudy.lookTarget).toBeUndefined();
                expect(understudy.simulatedPlayer.lookAtLocation).toHaveBeenCalledWith(target.location);
            });

            it('looks at the head location for a Player target', () => {
                const target = new Player();
                target.getHeadLocation = vi.fn(() => ({ x: 5, y: 66, z: 5 }));
                understudy.look(target);
                understudy.stopLooking();
                expect(understudy.lookTarget).toBeUndefined();
                expect(understudy.simulatedPlayer.lookAtLocation).toHaveBeenCalledWith(target.getHeadLocation());
            });

            it('looks at the location for other types of targets', () => {
                const target = new Entity();
                target.x = 20;
                target.y = 45;
                target.z = 20;
                target.location = { x: 20, y: 45, z: 20 };
                understudy.look(target);
                understudy.stopLooking();
                expect(understudy.lookTarget).toBeUndefined();
                expect(understudy.simulatedPlayer.lookAtLocation).toHaveBeenCalledWith(
                    expect.objectContaining({ x: 20, y: 45, z: 20 })
                );
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.stopLooking()).toThrow();
            });
        });

        describe('moveLocation', () => {
            it('navigates to a Block target', () => {
                const target = new Block();
                understudy.moveLocation(target);
                expect(understudy.simulatedPlayer.navigateToBlock).toHaveBeenCalledWith(target);
            });

            it('navigates to an Entity target', () => {
                const target = new Entity();
                understudy.moveLocation(target);
                expect(understudy.simulatedPlayer.navigateToEntity).toHaveBeenCalledWith(target);
            });

            it('navigates to a location', () => {
                const location = { x: 10, y: 64, z: 10 };
                understudy.moveLocation(location);
                expect(understudy.simulatedPlayer.navigateToLocation).toHaveBeenCalledWith(location);
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.moveLocation({ x: 0, y: 64, z: 0 })).toThrow();
            });
        });

        describe('moveRelative', () => {
            it('passes [0, 1] to simulatedPlayer.moveRelative for FORWARD', () => {
                understudy.moveRelative(MOVE_OPTIONS.FORWARD);
                expect(understudy.simulatedPlayer.moveRelative).toHaveBeenCalledWith(0, 1);
            });

            it('passes [0, -1] for BACKWARD', () => {
                understudy.moveRelative(MOVE_OPTIONS.BACKWARD);
                expect(understudy.simulatedPlayer.moveRelative).toHaveBeenCalledWith(0, -1);
            });

            it('passes [1, 0] for LEFT', () => {
                understudy.moveRelative(MOVE_OPTIONS.LEFT);
                expect(understudy.simulatedPlayer.moveRelative).toHaveBeenCalledWith(1, 0);
            });

            it('passes [-1, 0] for RIGHT', () => {
                understudy.moveRelative(MOVE_OPTIONS.RIGHT);
                expect(understudy.simulatedPlayer.moveRelative).toHaveBeenCalledWith(-1, 0);
            });

            it('throws on an invalid direction', () => {
                expect(() => understudy.moveRelative('diagonal')).toThrow();
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.moveRelative(MOVE_OPTIONS.FORWARD)).toThrow();
            });
        });

        describe('stopMoving', () => {
            it('stops the simulated player from moving', () => {
                understudy.stopMoving();
                expect(understudy.simulatedPlayer.stopMoving).toHaveBeenCalled();
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.stopMoving()).toThrow();
            });
        });

        describe('selectSlot', () => {
            it('sets the selected slot for the simulated player', () => {
                understudy.selectSlot(5);
                expect(understudy.simulatedPlayer.selectedSlotIndex).toBe(5);
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.selectSlot(0)).toThrow();
            });
        });

        describe('sprint', () => {
            it('sets the sprinting state for the simulated player', () => {
                understudy.sprint(true);
                expect(understudy.simulatedPlayer.isSprinting).toBe(true);
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.sprint(true)).toThrow();
            });
        });

        describe('sneak', () => {
            it('sets the sneaking state for the simulated player', () => {
                understudy.sneak(true);
                expect(understudy.simulatedPlayer.isSneaking).toBe(true);
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.sneak(true)).toThrow();
            });
        });

        describe('claimProjectiles', () => {
            it('claims projectiles within the given radius', () => {
                const mockComponent = { owner: null, isValid: true };
                const mockEntity = { getComponent: vi.fn(() => mockComponent) };
                const mockDimension = { getEntities: vi.fn(() => [mockEntity]) };
                understudy.simulatedPlayer.dimension = mockDimension;
                understudy.simulatedPlayer.name = 'TestBot';
                understudy.claimProjectiles(10);
                expect(mockComponent.owner).toBe(understudy.simulatedPlayer);
                expect(world.sendMessage).toHaveBeenCalledWith(expect.stringContaining('Successfully became the owner of 1 projectiles'));
            });

            it('sends a message when no projectiles are found', () => {
                understudy.simulatedPlayer.dimension = { getEntities: vi.fn(() => []) };
                understudy.simulatedPlayer.name = 'TestBot';
                understudy.claimProjectiles(10);
                expect(world.sendMessage).toHaveBeenCalledWith(expect.stringContaining('No claimable projectiles found within 10 blocks'));
            });

            it('ignores invalid projectile components', () => {
                const mockComponent = { isValid: false };
                const mockEntity = { getComponent: vi.fn(() => mockComponent) };
                const mockDimension = { getEntities: vi.fn(() => [mockEntity]) };
                understudy.simulatedPlayer.dimension = mockDimension;
                understudy.claimProjectiles(10);
                expect(world.sendMessage).toHaveBeenCalledWith(expect.stringContaining('No claimable projectiles found within 10 blocks'));
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.claimProjectiles(10)).toThrow();
            });
        });

        describe('stopAll', () => {
            it('clears all actions', () => {
                understudy.actions.once('attack');
                understudy.stopAll();
                expect(understudy.actions.isEmpty()).toBe(true);
            });

            it('calls all stop methods on simulatedPlayer', () => {
                understudy.stopAll();
                const simulatedPlayer = understudy.simulatedPlayer;
                expect(simulatedPlayer.stopMoving).toHaveBeenCalled();
                expect(simulatedPlayer.stopBuild).toHaveBeenCalled();
                expect(simulatedPlayer.stopInteracting).toHaveBeenCalled();
                expect(simulatedPlayer.stopBreakingBlock).toHaveBeenCalled();
                expect(simulatedPlayer.stopUsingItem).toHaveBeenCalled();
                expect(simulatedPlayer.stopSwimming).toHaveBeenCalled();
                expect(simulatedPlayer.stopGliding).toHaveBeenCalled();
            });

            it('resets sprint and sneak', () => {
                understudy.sprint(true);
                understudy.sneak(true);
                understudy.stopAll();
                expect(understudy.simulatedPlayer.isSprinting).toBe(false);
                expect(understudy.simulatedPlayer.isSneaking).toBe(false);
            });

            it('clears the look target', () => {
                const target = new Entity();
                target.location = { x: 0, y: 64, z: 0 };
                understudy.look(target);
                understudy.stopAll();
                expect(understudy.lookTarget).toBeUndefined();
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.stopAll()).toThrow();
            });
        });

        describe('getInventory', () => {
            it('returns the inventory container from simulatedPlayer', () => {
                expect(understudy.getInventory()).toBeDefined();
            });

            it('returns undefined when simulatedPlayer has no inventory component', () => {
                understudy.simulatedPlayer.getComponent.mockReturnValue(undefined);
                expect(understudy.getInventory()).toBeUndefined();
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.getInventory()).toThrow();
            });
        });

        describe('swapHeldItemWithPlayer', () => {
            let targetContainer;
            let targetPlayer;

            beforeEach(() => {
                targetContainer = { swapItems: vi.fn() };
                targetPlayer = {
                    getComponent: vi.fn(() => ({ container: targetContainer })),
                    selectedSlotIndex: 1,
                    sendMessage: vi.fn()
                };
            });

            it('swaps items between the understudy and the target player', () => {
                understudy.swapHeldItemWithPlayer(targetPlayer);
                expect(understudy.getInventory().swapItems).toHaveBeenCalledWith(0, 1, targetContainer);
            });

            it('sends an error message when swapItems throws', () => {
                vi.spyOn(understudy.getInventory(), 'swapItems').mockImplementation(() => { throw new Error('swap failed'); });
                understudy.swapHeldItemWithPlayer(targetPlayer);
                expect(targetPlayer.sendMessage).toHaveBeenCalledWith(expect.stringContaining('Error'));
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.swapHeldItemWithPlayer(targetPlayer)).toThrow();
            });
        });

        describe('refreshHeldItem', () => {
            it('re-assigns the selected slot index to visually refresh the held item', () => {
                understudy.refreshHeldItem();
                expect(understudy.simulatedPlayer.selectedSlotIndex).toBe(0);
            });

            it('throws when understudy is not connected', () => {
                understudy.leave();
                expect(() => understudy.refreshHeldItem()).toThrow();
            });
        });
    });
});
