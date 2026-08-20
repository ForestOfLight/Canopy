import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container, EntityComponentTypes, Player } from '@minecraft/server';
import { UnderstudyEditSession } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/editor/UnderstudyEditSession';

const makeItem = typeId => ({
    typeId,
    amount: 1,
    isStackable: true,
    nameTag: void 0,
    isStackableWith: other => other.typeId === typeId,
    getComponent: () => void 0,
    clone() {
        return makeItem(this.typeId);
    }
});

describe('UnderstudyEditSession', () => {
    let player;
    let playerInventory;
    let understudy;
    let understudyInventory;
    let proxyContainer;
    let proxy;

    beforeEach(() => {
        playerInventory = new Container({ size: 36 });
        player = new Player();
        player.id = 'player-1';
        player.getHeadLocation.mockReturnValue({ x: 0, y: 66, z: 0 });
        player.getComponent.mockImplementation(componentId => {
            if (componentId === EntityComponentTypes.Inventory)
                return { container: playerInventory };
            return void 0;
        });

        understudyInventory = new Container({ size: 36 });
        understudy = {
            name: 'Steve',
            isConnected: vi.fn(() => true),
            getInventory: vi.fn(() => understudyInventory),
            getEquippable: vi.fn(() => void 0)
        };

        proxyContainer = new Container({ size: 54 });
        proxy = {
            isValid: true,
            container: proxyContainer,
            teleportTo: vi.fn(),
            remove: vi.fn()
        };
    });

    const makeSession = () => new UnderstudyEditSession(player, understudy, proxy);

    describe('while closed', () => {
        it('teleports the proxy to the player head each tick', () => {
            const session = makeSession();
            session.onTick();
            expect(proxy.teleportTo).toHaveBeenCalledWith({ x: 0, y: 66, z: 0 });
        });
    });

    describe('while open', () => {
        it('stops teleporting the proxy', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxy.teleportTo.mockClear();
            session.onTick();
            expect(proxy.teleportTo).not.toHaveBeenCalled();
        });

        it('fills the proxy from the understudy on open', () => {
            understudyInventory.setItem(0, makeItem('minecraft:dirt'));
            const session = makeSession();
            session.onContainerOpened();
            expect(proxyContainer.getItem(0).typeId).toBe('minecraft:dirt');
        });

        it('writes a player edit into the understudy on the next tick', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxyContainer.setItem(3, makeItem('minecraft:diamond'));
            session.onTick();
            expect(understudyInventory.getItem(3).typeId).toBe('minecraft:diamond');
        });

        it('streams an understudy change into the proxy on the next tick', () => {
            const session = makeSession();
            session.onContainerOpened();
            understudyInventory.setItem(5, makeItem('minecraft:cobblestone'));
            session.onTick();
            expect(proxyContainer.getItem(5).typeId).toBe('minecraft:cobblestone');
        });
    });

    describe('deferred disposal', () => {
        it('disposes immediately when stop-looking happens while closed', () => {
            const session = makeSession();
            session.onStopLooking();
            expect(session.isDisposed).toBe(true);
            expect(proxy.remove).toHaveBeenCalled();
        });

        it('defers disposal when stop-looking happens while open', () => {
            const session = makeSession();
            session.onContainerOpened();
            session.onStopLooking();
            expect(session.isDisposed).toBe(false);
            expect(proxy.remove).not.toHaveBeenCalled();
        });

        it('disposes on container close when disposal was deferred', () => {
            const session = makeSession();
            session.onContainerOpened();
            session.onStopLooking();
            session.onContainerClosed();
            expect(session.isDisposed).toBe(true);
            expect(proxy.remove).toHaveBeenCalled();
        });

        it('cancels a deferred disposal when the player looks back', () => {
            const session = makeSession();
            session.onContainerOpened();
            session.onStopLooking();
            session.onStartLooking();
            session.onContainerClosed();
            expect(session.isDisposed).toBe(false);
            expect(proxy.remove).not.toHaveBeenCalled();
        });

        it('resumes teleporting after a close with no pending disposal', () => {
            const session = makeSession();
            session.onContainerOpened();
            session.onContainerClosed();
            session.onTick();
            expect(proxy.teleportTo).toHaveBeenCalled();
        });
    });

    describe('overflow slots', () => {
        it('returns items left beyond the understudy view to the player on close', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxyContainer.setItem(50, makeItem('minecraft:emerald'));

            session.onContainerClosed();

            expect(playerInventory.getItem(0).typeId).toBe('minecraft:emerald');
            expect(proxyContainer.getItem(50)).toBeUndefined();
        });

        it('drops overflow items when the player inventory is full', () => {
            const session = makeSession();
            session.onContainerOpened();
            for (let slotIndex = 0; slotIndex < 36; slotIndex++)
                playerInventory.setItem(slotIndex, makeItem('minecraft:stone'));
            const emerald = makeItem('minecraft:emerald');
            proxyContainer.setItem(50, emerald);

            session.onContainerClosed();

            expect(player.dimension.spawnItem).toHaveBeenCalledWith(emerald, player.location);
        });
    });

    describe('invalid targets', () => {
        it('disposes on tick when the player is no longer valid', () => {
            const session = makeSession();
            player.isValid = false;
            session.onTick();
            expect(session.isDisposed).toBe(true);
        });

        it('disposes on tick when the understudy disconnects, even while open', () => {
            const session = makeSession();
            session.onContainerOpened();
            understudy.isConnected.mockReturnValue(false);
            session.onTick();
            expect(session.isDisposed).toBe(true);
        });
    });

    describe('matchesUnderstudy', () => {
        it('is true for its own understudy', () => {
            expect(makeSession().matchesUnderstudy(understudy)).toBe(true);
        });

        it('is false for a different understudy', () => {
            expect(makeSession().matchesUnderstudy({ name: 'Alex' })).toBe(false);
        });
    });
});
