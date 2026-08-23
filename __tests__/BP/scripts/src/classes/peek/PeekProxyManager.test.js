import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container, Entity, EntityComponentTypes, GameMode, Player, world } from '@minecraft/server';
import { PeekProxyManager } from '../../../../../../Canopy[BP]/scripts/src/classes/peek/PeekProxyManager';
import { ProxySessionRegistry } from '../../../../../../Canopy[BP]/scripts/src/classes/proxy/ProxySessionRegistry';
import { PeekArming } from '../../../../../../Canopy[BP]/scripts/src/classes/peek/PeekArming';

describe('PeekProxyManager', () => {
    let registry;
    let manager;
    let player;
    let spawnedEntities;

    const makeContainerTarget = (typeId, size, overrides = {}) => {
        const container = new Container({ size });
        return {
            typeId,
            isValid: true,
            localizationKey: 'tile.chest.name',
            location: { x: 10, y: 64, z: 10 },
            getComponent: vi.fn(componentId => {
                if (componentId === EntityComponentTypes.Inventory)
                    return { container };
                return void 0;
            }),
            ...overrides
        };
    };

    const lookAtBlock = block => {
        player.getBlockFromViewDirection.mockReturnValue(block === void 0 ? void 0 : { block });
        player.getEntitiesFromViewDirection.mockReturnValue([]);
    };

    const lookAtEntity = entity => {
        player.getBlockFromViewDirection.mockReturnValue(void 0);
        player.getEntitiesFromViewDirection.mockReturnValue([{ entity }]);
    };

    const holdSpyglass = (typeId = 'minecraft:spyglass') => {
        const heldContainer = new Container({ size: 36 });
        heldContainer.setItem(0, { typeId, amount: 1 });
        player.selectedSlotIndex = 0;
        player.getComponent.mockImplementation(componentId => {
            if (componentId === EntityComponentTypes.Inventory)
                return { container: heldContainer };
            return void 0;
        });
    };

    beforeEach(() => {
        vi.restoreAllMocks();
        spawnedEntities = [];
        registry = new ProxySessionRegistry();
        manager = new PeekProxyManager(registry);

        player = new Player();
        player.id = 'player-1';
        player.getGameMode.mockReturnValue(GameMode.Creative);
        player.getHeadLocation.mockReturnValue({ x: 0, y: 66, z: 0 });
        player.dimension.spawnEntity = vi.fn(typeId => {
            const entity = new Entity();
            entity.typeId = typeId;
            entity.teleport = vi.fn();
            entity.dimension = player.dimension;
            const container = new Container({ size: 27 });
            entity.getComponent.mockImplementation(componentId => {
                if (componentId === EntityComponentTypes.Inventory)
                    return { container };
                return void 0;
            });
            spawnedEntities.push(entity);
            return entity;
        });
        holdSpyglass();
        vi.spyOn(world, 'getAllPlayers').mockReturnValue([player]);
    });

    describe('creative gate', () => {
        it('never parks a proxy for a player outside creative', () => {
            player.getGameMode.mockReturnValue(GameMode.Survival);
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));

            manager.updateFor(player);

            expect(manager.sessionCount).toBe(0);
            expect(player.dimension.spawnEntity).not.toHaveBeenCalled();
        });

        it('never parks a proxy in adventure or spectator', () => {
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));

            player.getGameMode.mockReturnValue(GameMode.Adventure);
            manager.updateFor(player);
            player.getGameMode.mockReturnValue(GameMode.Spectator);
            manager.updateFor(player);

            expect(manager.sessionCount).toBe(0);
        });

        it('gives up an open session when the player leaves creative', () => {
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));
            manager.updateFor(player);
            expect(manager.sessionCount).toBe(1);

            player.getGameMode.mockReturnValue(GameMode.Survival);
            manager.updateFor(player);

            expect(manager.sessionCount).toBe(0);
            expect(spawnedEntities[0].remove).toHaveBeenCalled();
        });

        it('reports creative status from the player game mode', () => {
            expect(PeekProxyManager.isCreative({ getGameMode: () => GameMode.Creative })).toBe(true);
            expect(PeekProxyManager.isCreative({ getGameMode: () => GameMode.Survival })).toBe(false);
            expect(PeekProxyManager.isCreative(void 0)).toBe(false);
        });
    });

    describe('arming', () => {
        it('does nothing while the player holds something other than a spyglass', () => {
            holdSpyglass('minecraft:stick');
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));

            manager.updateFor(player);

            expect(manager.sessionCount).toBe(0);
        });

        it('parks a proxy without a spyglass once /peek armed the player', () => {
            holdSpyglass('minecraft:stick');
            manager.armFromCommand(player);
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));

            manager.updateFor(player);

            expect(manager.sessionCount).toBe(1);
        });

        it('raycasts at the configured range for each arming source', () => {
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));
            manager.updateFor(player);
            const [spyglassOptions] = player.getBlockFromViewDirection.mock.calls[0];

            manager.armFromCommand(player);
            manager.updateFor(player);
            const [commandOptions] = player.getBlockFromViewDirection.mock.calls.at(-1);

            expect(spyglassOptions.maxDistance).toBe(PeekProxyManager.SPYGLASS_RANGE);
            expect(commandOptions.maxDistance).toBe(PeekProxyManager.COMMAND_RANGE);
        });

    });

    describe('arming until the next interaction', () => {
        const armAndLookAway = () => {
            manager.armFromCommand(player);
            lookAtBlock(void 0);
            manager.updateFor(player);
        };

        it('stays armed while the player has nothing to peek at', () => {
            armAndLookAway();

            expect(manager.isArmedFromCommand(player.id)).toBe(true);
        });

        it('parks a capture entity at the head of an armed player with no target', () => {
            armAndLookAway();

            expect(player.dimension.spawnEntity).toHaveBeenCalledWith(
                'canopy:peek_capture',
                { x: 0, y: 66, z: 0 },
                expect.anything()
            );
        });

        it('reuses the parked capture entity on later ticks', () => {
            armAndLookAway();
            manager.updateFor(player);

            expect(spawnedEntities).toHaveLength(1);
        });

        it('never parks a capture entity for a spyglass holder', () => {
            lookAtBlock(void 0);

            manager.updateFor(player);

            expect(player.dimension.spawnEntity).not.toHaveBeenCalled();
        });

        it('reports a failed peek in chat when the armed player interacts with nothing', () => {
            armAndLookAway();

            manager.onPlayerInteractWithEntity({ player, target: spawnedEntities[0] });

            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'commands.peek.fail.notarget' });
        });

        it('disarms and clears the capture entity after a failed peek', () => {
            armAndLookAway();

            manager.onPlayerInteractWithEntity({ player, target: spawnedEntities[0] });

            expect(manager.isArmedFromCommand(player.id)).toBe(false);
            expect(spawnedEntities[0].remove).toHaveBeenCalled();
        });

        it('swaps the capture entity for a mirrored proxy once the player looks at a container', () => {
            armAndLookAway();
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));

            manager.updateFor(player);

            expect(manager.sessionCount).toBe(1);
            expect(spawnedEntities[0].remove).toHaveBeenCalled();
            expect(spawnedEntities[1].typeId).toBe('canopy:inventory_proxy');
        });

        it('disarms once the mirrored container opens', () => {
            manager.armFromCommand(player);
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));
            manager.updateFor(player);
            registry.onContainerOpened({ entity: spawnedEntities[0], openSource: { entity: player } });

            manager.updateFor(player);

            expect(manager.isArmedFromCommand(player.id)).toBe(false);
            expect(manager.sessionCount).toBe(1);
        });

        it('stays armed right up until the timeout', () => {
            armAndLookAway();

            for (let tick = 0; tick < PeekArming.TIMEOUT_TICKS - 2; tick++)
                manager.updateFor(player);

            expect(manager.isArmedFromCommand(player.id)).toBe(true);
        });

        it('expires the arm when the player never interacts', () => {
            armAndLookAway();

            for (let tick = 0; tick < PeekArming.TIMEOUT_TICKS; tick++)
                manager.updateFor(player);

            expect(manager.isArmedFromCommand(player.id)).toBe(false);
            expect(spawnedEntities[0].remove).toHaveBeenCalled();
        });

        it('reports an expired peek in chat', () => {
            armAndLookAway();

            for (let tick = 0; tick < PeekArming.TIMEOUT_TICKS; tick++)
                manager.updateFor(player);

            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'commands.peek.expired' });
        });

        it('restarts the timeout when the player runs the command again', () => {
            armAndLookAway();
            for (let tick = 0; tick < PeekArming.TIMEOUT_TICKS - 2; tick++)
                manager.updateFor(player);

            manager.armFromCommand(player);
            manager.updateFor(player);
            manager.updateFor(player);

            expect(manager.isArmedFromCommand(player.id)).toBe(true);
        });

        it('tells an armed player who left creative why the peek stopped', () => {
            armAndLookAway();
            player.getGameMode.mockReturnValue(GameMode.Survival);

            manager.updateFor(player);

            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'commands.peek.fail.notcreative' });
            expect(manager.isArmedFromCommand(player.id)).toBe(false);
            expect(spawnedEntities[0].remove).toHaveBeenCalled();
        });

        it('gives up its capture entities when the rule is turned off', () => {
            armAndLookAway();

            manager.stop();

            expect(manager.isArmedFromCommand(player.id)).toBe(false);
            expect(spawnedEntities[0].remove).toHaveBeenCalled();
        });

        it('never parks a capture entity on top of an understudy edit session', () => {
            registry.add({
                playerId: player.id,
                isDisposed: false,
                proxyEntity: { entity: new Entity() },
                onTick: vi.fn(),
                onStartLooking: vi.fn(),
                onStopLooking: vi.fn(),
                dispose: vi.fn()
            }, 'understudy');

            armAndLookAway();

            expect(player.dimension.spawnEntity).not.toHaveBeenCalled();
        });

        it('never targets the capture entity parked at its own head', () => {
            armAndLookAway();
            lookAtEntity(spawnedEntities[0]);

            manager.updateFor(player);

            expect(manager.sessionCount).toBe(0);
            expect(spawnedEntities).toHaveLength(1);
        });

        it('clears the arm and its capture entity when the player leaves', () => {
            armAndLookAway();

            manager.onPlayerLeave({ playerId: player.id });

            expect(manager.isArmedFromCommand(player.id)).toBe(false);
            expect(spawnedEntities[0].remove).toHaveBeenCalled();
        });

        it('ignores interactions with entities it did not park', () => {
            armAndLookAway();

            manager.onPlayerInteractWithEntity({ player, target: new Entity() });

            expect(manager.isArmedFromCommand(player.id)).toBe(true);
            expect(player.sendMessage).not.toHaveBeenCalled();
        });
    });

    describe('target selection', () => {
        it('ignores the proxy parked at its own head instead of mirroring itself', () => {
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));
            manager.updateFor(player);
            const parkedProxy = spawnedEntities[0];
            parkedProxy.typeId = 'canopy:inventory_proxy';
            parkedProxy.id = 'proxy-1';
            lookAtEntity(parkedProxy);

            manager.updateFor(player);

            expect(manager.sessionCount).toBe(0);
        });

        it('never peeks at another player', () => {
            const other = makeContainerTarget('minecraft:player', 36, { id: 'player-2' });
            lookAtEntity(other);

            manager.updateFor(player);

            expect(manager.sessionCount).toBe(0);
            expect(player.dimension.spawnEntity).not.toHaveBeenCalled();
        });

        it('leaves understudies to the understudy editor', () => {
            lookAtEntity(makeContainerTarget('minecraft:player', 36, { id: 'understudy-1' }));

            manager.updateFor(player);

            expect(manager.sessionCount).toBe(0);
        });

        it('ignores a target with no inventory', () => {
            lookAtBlock(makeContainerTarget('minecraft:stone', 0, { getComponent: vi.fn(() => void 0) }));

            manager.updateFor(player);

            expect(manager.sessionCount).toBe(0);
        });

        it('does not peek at the player doing the peeking', () => {
            lookAtEntity(makeContainerTarget('minecraft:player', 36, { id: player.id }));

            manager.updateFor(player);

            expect(manager.sessionCount).toBe(0);
        });
    });

    describe('proxy layout', () => {
        it('spawns a hopper proxy for a hopper', () => {
            lookAtBlock(makeContainerTarget('minecraft:hopper', 5));

            manager.updateFor(player);

            expect(player.dimension.spawnEntity).toHaveBeenCalledWith(
                'canopy:inventory_proxy_hopper',
                expect.anything(),
                expect.anything()
            );
        });

        it('spawns a plain chest proxy for a double chest, which is shown one half at a time', () => {
            lookAtBlock(makeContainerTarget('minecraft:chest', 54));

            manager.updateFor(player);

            expect(player.dimension.spawnEntity).toHaveBeenCalledWith(
                'canopy:inventory_proxy',
                expect.anything(),
                expect.anything()
            );
        });

        it('spawns a plain chest proxy for a furnace', () => {
            lookAtBlock(makeContainerTarget('minecraft:furnace', 3));

            manager.updateFor(player);

            expect(player.dimension.spawnEntity).toHaveBeenCalledWith(
                'canopy:inventory_proxy',
                expect.anything(),
                expect.anything()
            );
        });
    });

    describe('session lifecycle', () => {
        it('reuses the session while the player keeps looking at the same block', () => {
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));

            manager.updateFor(player);
            manager.updateFor(player);

            expect(manager.sessionCount).toBe(1);
            expect(spawnedEntities).toHaveLength(1);
        });

        it('swaps to a new proxy when the player looks at a different container', () => {
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));
            manager.updateFor(player);

            lookAtBlock(makeContainerTarget('minecraft:barrel', 27, { location: { x: 20, y: 64, z: 20 } }));
            manager.updateFor(player);

            expect(manager.sessionCount).toBe(1);
            expect(spawnedEntities).toHaveLength(2);
            expect(spawnedEntities[0].remove).toHaveBeenCalled();
        });

        it('disposes the session when the player looks away', () => {
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));
            manager.updateFor(player);

            lookAtBlock(void 0);
            manager.updateFor(player);

            expect(manager.sessionCount).toBe(0);
            expect(spawnedEntities[0].remove).toHaveBeenCalled();
        });

        it('keeps an open container alive when the player looks away', () => {
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));
            manager.updateFor(player);
            registry.onContainerOpened({ entity: spawnedEntities[0], openSource: { entity: player } });

            lookAtBlock(void 0);
            manager.updateFor(player);

            expect(manager.sessionCount).toBe(1);
        });

        it('does not swap the proxy out from under an open container', () => {
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));
            manager.updateFor(player);
            registry.onContainerOpened({ entity: spawnedEntities[0], openSource: { entity: player } });

            lookAtBlock(makeContainerTarget('minecraft:barrel', 27, { location: { x: 20, y: 64, z: 20 } }));
            manager.updateFor(player);

            expect(spawnedEntities).toHaveLength(1);
        });

        it('gives up its proxies when the rule is turned off', () => {
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));
            manager.updateFor(player);
            manager.armFromCommand(player);

            manager.stop();

            expect(manager.sessionCount).toBe(0);
            expect(manager.isArmedFromCommand(player.id)).toBe(false);
            expect(spawnedEntities[0].remove).toHaveBeenCalled();
        });
    });

    describe('one proxy per player', () => {
        it('does not park a peek proxy on top of an understudy edit session', () => {
            const understudySession = {
                playerId: player.id,
                isDisposed: false,
                proxyEntity: { entity: new Entity() },
                onTick: vi.fn(),
                onStartLooking: vi.fn(),
                onStopLooking: vi.fn(),
                dispose: vi.fn()
            };
            registry.add(understudySession, 'understudy');
            lookAtBlock(makeContainerTarget('minecraft:chest', 27));

            manager.updateFor(player);

            expect(manager.sessionCount).toBe(0);
            expect(player.dimension.spawnEntity).not.toHaveBeenCalled();
            expect(understudySession.dispose).not.toHaveBeenCalled();
        });
    });
});
