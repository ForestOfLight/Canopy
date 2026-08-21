import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container, Entity, EntityComponentTypes, Player, world } from '@minecraft/server';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import { understudyInventoryEditor } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/UnderstudyInventoryEditor';
import { ProxyInventoryEntity } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/editor/ProxyInventoryEntity';
import { playerStartLookingAtUnderstudy } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/events/PlayerStartLookingAtUnderstudyEvent';
import { playerStopLookingAtUnderstudy } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/events/PlayerStopLookingAtUnderstudyEvent';

describe('UnderstudyInventoryEditor', () => {
    let containerOpened;
    let containerClosed;
    let spawnedEntities;

    const makeUnderstudy = name => ({
        name,
        isConnected: vi.fn(() => true),
        getInventory: vi.fn(() => new Container({ size: 36 })),
        getEquippable: vi.fn(() => void 0)
    });

    const makePlayer = id => {
        const player = new Player();
        player.id = id;
        player.getHeadLocation.mockReturnValue({ x: 0, y: 66, z: 0 });
        player.getComponent.mockImplementation(componentId => {
            if (componentId === EntityComponentTypes.Inventory)
                return { container: new Container({ size: 36 }) };
            return void 0;
        });
        player.dimension.spawnEntity = vi.fn(() => {
            const entity = new Entity();
            entity.teleport = vi.fn();
            const container = new Container({ size: 54 });
            entity.getComponent.mockImplementation(componentId => {
                if (componentId === EntityComponentTypes.Inventory)
                    return { container };
                return void 0;
            });
            spawnedEntities.push(entity);
            return entity;
        });
        return player;
    };

    beforeEach(() => {
        spawnedEntities = [];
        containerOpened = { subscribe: vi.fn(), unsubscribe: vi.fn() };
        containerClosed = { subscribe: vi.fn(), unsubscribe: vi.fn() };
        world.afterEvents.entityContainerOpened = containerOpened;
        world.afterEvents.entityContainerClosed = containerClosed;
        vi.spyOn(playerStartLookingAtUnderstudy, 'subscribe').mockImplementation(() => void 0);
        vi.spyOn(playerStopLookingAtUnderstudy, 'subscribe').mockImplementation(() => void 0);
        vi.spyOn(playerStartLookingAtUnderstudy, 'unsubscribe').mockImplementation(() => void 0);
        vi.spyOn(playerStopLookingAtUnderstudy, 'unsubscribe').mockImplementation(() => void 0);
        world.afterEvents.playerLeave = { subscribe: vi.fn(), unsubscribe: vi.fn() };
        understudyInventoryEditor.reset();
    });

    describe('start', () => {
        it('subscribes to both container events filtered to tagged proxy entities', () => {
            understudyInventoryEditor.start();
            const expectedFilter = {
                entityFilter: {
                    type: 'canopy:nbt_item_database',
                    tags: ['canopy:inventory_proxy']
                }
            };
            expect(containerOpened.subscribe).toHaveBeenCalledWith(expect.any(Function), expectedFilter);
            expect(containerClosed.subscribe).toHaveBeenCalledWith(expect.any(Function), expectedFilter);
        });

        it('only subscribes once', () => {
            understudyInventoryEditor.start();
            understudyInventoryEditor.start();
            expect(containerOpened.subscribe).toHaveBeenCalledTimes(1);
        });

        it('takes the proxy entity type from ProxyInventoryEntity', () => {
            understudyInventoryEditor.start();
            const [, options] = containerOpened.subscribe.mock.calls[0];
            expect(options.entityFilter.type).toBe(ProxyInventoryEntity.entityTypeId);
        });
    });

    describe('reset', () => {
        it('unsubscribes every handler it registered', () => {
            understudyInventoryEditor.start();
            const [openedHandler] = containerOpened.subscribe.mock.calls[0];
            const [closedHandler] = containerClosed.subscribe.mock.calls[0];
            const [startHandler] = playerStartLookingAtUnderstudy.subscribe.mock.calls[0];
            const [stopHandler] = playerStopLookingAtUnderstudy.subscribe.mock.calls[0];
            const [leaveHandler] = world.afterEvents.playerLeave.subscribe.mock.calls[0];

            understudyInventoryEditor.reset();

            expect(containerOpened.unsubscribe).toHaveBeenCalledWith(openedHandler);
            expect(containerClosed.unsubscribe).toHaveBeenCalledWith(closedHandler);
            expect(playerStartLookingAtUnderstudy.unsubscribe).toHaveBeenCalledWith(startHandler);
            expect(playerStopLookingAtUnderstudy.unsubscribe).toHaveBeenCalledWith(stopHandler);
            expect(world.afterEvents.playerLeave.unsubscribe).toHaveBeenCalledWith(leaveHandler);
        });

        it('does not leave a double subscription behind when start is called again', () => {
            understudyInventoryEditor.start();
            understudyInventoryEditor.reset();
            understudyInventoryEditor.start();

            expect(containerOpened.subscribe).toHaveBeenCalledTimes(2);
            expect(containerOpened.unsubscribe).toHaveBeenCalledTimes(1);
        });

        it('does not unsubscribe the same handler twice', () => {
            understudyInventoryEditor.start();
            understudyInventoryEditor.reset();
            containerOpened.unsubscribe.mockClear();

            understudyInventoryEditor.reset();

            expect(containerOpened.unsubscribe).not.toHaveBeenCalled();
        });
    });

    describe('session routing', () => {
        it('creates one session per player id', () => {
            const playerA = makePlayer('player-a');
            const playerB = makePlayer('player-b');

            understudyInventoryEditor.onStartLooking({ player: playerA, understudy: makeUnderstudy('Steve') });
            understudyInventoryEditor.onStartLooking({ player: playerB, understudy: makeUnderstudy('Alex') });

            expect(understudyInventoryEditor.sessionCount).toBe(2);
            expect(spawnedEntities).toHaveLength(2);
        });

        it('does not create a second session for the same player', () => {
            const player = makePlayer('player-a');
            const understudy = makeUnderstudy('Steve');

            understudyInventoryEditor.onStartLooking({ player, understudy });
            understudyInventoryEditor.onStartLooking({ player, understudy });

            expect(understudyInventoryEditor.sessionCount).toBe(1);
        });

        it('ignores an invalid player', () => {
            const player = makePlayer('player-a');
            player.isValid = false;

            understudyInventoryEditor.onStartLooking({ player, understudy: makeUnderstudy('Steve') });

            expect(understudyInventoryEditor.sessionCount).toBe(0);
        });

        it('disposes the session on stop-looking while closed', () => {
            const player = makePlayer('player-a');
            understudyInventoryEditor.onStartLooking({ player, understudy: makeUnderstudy('Steve') });

            understudyInventoryEditor.onStopLooking({ player });

            expect(understudyInventoryEditor.sessionCount).toBe(0);
            expect(spawnedEntities[0].remove).toHaveBeenCalled();
        });

        it('keeps the session on stop-looking while the container is open', () => {
            const player = makePlayer('player-a');
            understudyInventoryEditor.onStartLooking({ player, understudy: makeUnderstudy('Steve') });
            understudyInventoryEditor.onContainerOpened({ entity: spawnedEntities[0], openSource: { entity: player } });

            understudyInventoryEditor.onStopLooking({ player });

            expect(understudyInventoryEditor.sessionCount).toBe(1);
        });

        it('drops the session once the container closes after a deferred stop', () => {
            const player = makePlayer('player-a');
            understudyInventoryEditor.onStartLooking({ player, understudy: makeUnderstudy('Steve') });
            understudyInventoryEditor.onContainerOpened({ entity: spawnedEntities[0], openSource: { entity: player } });
            understudyInventoryEditor.onStopLooking({ player });

            understudyInventoryEditor.onContainerClosed({ entity: spawnedEntities[0] });

            expect(understudyInventoryEditor.sessionCount).toBe(0);
        });

        it('ignores a start-looking event for a different understudy while open', () => {
            const player = makePlayer('player-a');
            const steve = makeUnderstudy('Steve');
            understudyInventoryEditor.onStartLooking({ player, understudy: steve });
            understudyInventoryEditor.onContainerOpened({ entity: spawnedEntities[0], openSource: { entity: player } });

            understudyInventoryEditor.onStartLooking({ player, understudy: makeUnderstudy('Alex') });

            expect(understudyInventoryEditor.sessionCount).toBe(1);
            expect(spawnedEntities).toHaveLength(1);
        });

        it('disposes the session when the player leaves', () => {
            const player = makePlayer('player-a');
            understudyInventoryEditor.onStartLooking({ player, understudy: makeUnderstudy('Steve') });
            understudyInventoryEditor.onContainerOpened({ entity: spawnedEntities[0], openSource: { entity: player } });

            understudyInventoryEditor.onPlayerLeave({ playerId: 'player-a' });

            expect(understudyInventoryEditor.sessionCount).toBe(0);
            expect(spawnedEntities[0].remove).toHaveBeenCalled();
        });
    });

    describe('tick loop', () => {
        it('starts on the first session and stops after the last', () => {
            const player = makePlayer('player-a');

            understudyInventoryEditor.onStartLooking({ player, understudy: makeUnderstudy('Steve') });
            expect(understudyInventoryEditor.isTicking).toBe(true);

            understudyInventoryEditor.onStopLooking({ player });
            expect(understudyInventoryEditor.isTicking).toBe(false);
        });

        it('ticks each live session', () => {
            const player = makePlayer('player-a');
            understudyInventoryEditor.onStartLooking({ player, understudy: makeUnderstudy('Steve') });

            scheduler.advanceTicks(1);

            expect(spawnedEntities[0].teleport).toHaveBeenCalled();
        });

        it('drops a session that disposed itself during a tick', () => {
            const player = makePlayer('player-a');
            understudyInventoryEditor.onStartLooking({ player, understudy: makeUnderstudy('Steve') });
            player.isValid = false;

            scheduler.advanceTicks(1);

            expect(understudyInventoryEditor.sessionCount).toBe(0);
            expect(understudyInventoryEditor.isTicking).toBe(false);
        });
    });
});
