import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container, EntityComponentTypes, EquipmentSlot, Player } from '@minecraft/server';
import { UnderstudyEditSession } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/editor/UnderstudyEditSession';
import { UnderstudyEditViewMode } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/editor/UnderstudyEditView';

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
        player.onScreenDisplay = { setActionBar: vi.fn() };

        understudyInventory = new Container({ size: 36 });
        understudy = {
            name: 'Steve',
            isConnected: vi.fn(() => true),
            getInventory: vi.fn(() => understudyInventory),
            getEquippable: vi.fn(() => void 0)
        };

        proxyContainer = new Container({ size: 27 });
        proxy = {
            isValid: true,
            dimensionId: player.dimension.id,
            container: proxyContainer,
            teleportTo: vi.fn(),
            dropItem: vi.fn(() => true),
            setName: vi.fn(),
            remove: vi.fn()
        };
    });

    const makeSession = () => new UnderstudyEditSession(player, understudy, proxy);

    describe('while closed', () => {
        it('teleports the proxy to the player head each tick', () => {
            const session = makeSession();
            session.onTick();
            expect(proxy.teleportTo).toHaveBeenCalledWith({ x: 0, y: 66, z: 0 }, player.dimension);
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
            proxyContainer.setItem(20, makeItem('minecraft:emerald'));

            session.onContainerClosed();

            expect(playerInventory.getItem(0).typeId).toBe('minecraft:emerald');
            expect(proxyContainer.getItem(20)).toBeUndefined();
        });

        it('keeps the overflow item in the proxy when the transfer fails', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxyContainer.setItem(20, makeItem('minecraft:emerald'));
            playerInventory.addItem.mockImplementation(() => {
                throw new Error('container is invalid');
            });

            session.onContainerClosed();

            expect(proxyContainer.getItem(20).typeId).toBe('minecraft:emerald');
        });

        it('keeps sweeping the remaining overflow slots after one slot fails', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxyContainer.setItem(20, makeItem('minecraft:emerald'));
            proxyContainer.setItem(21, makeItem('minecraft:gold_ingot'));
            playerInventory.addItem.mockImplementationOnce(() => {
                throw new Error('container is invalid');
            });

            session.onContainerClosed();

            expect(proxyContainer.getItem(21)).toBeUndefined();
        });

        it('drops overflow items when the player inventory is full', () => {
            const session = makeSession();
            session.onContainerOpened();
            for (let slotIndex = 0; slotIndex < 36; slotIndex++)
                playerInventory.setItem(slotIndex, makeItem('minecraft:stone'));
            const emerald = makeItem('minecraft:emerald');
            proxyContainer.setItem(20, emerald);

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

        it('disposes on tick when the proxy entity has been removed from the world', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxy.isValid = false;
            session.onTick();
            expect(session.isDisposed).toBe(true);
        });

        it('disposes on tick when the player changed dimension away from the proxy', () => {
            const session = makeSession();
            player.dimension = { id: 'minecraft:nether', spawnItem: vi.fn() };
            session.onTick();
            expect(session.isDisposed).toBe(true);
            expect(proxy.teleportTo).not.toHaveBeenCalled();
        });

        it('does not throw out of a container close when the understudy is gone', () => {
            const session = makeSession();
            session.onContainerOpened();
            understudy.getInventory.mockImplementation(() => {
                throw new Error('UnderstudyNotConnectedError');
            });
            expect(() => session.onContainerClosed()).not.toThrow();
        });

        it('still disposes on close when the understudy is gone and disposal was deferred', () => {
            const session = makeSession();
            session.onContainerOpened();
            session.onStopLooking();
            understudy.getInventory.mockImplementation(() => {
                throw new Error('UnderstudyNotConnectedError');
            });
            session.onContainerClosed();
            expect(session.isDisposed).toBe(true);
            expect(proxy.remove).toHaveBeenCalled();
        });
    });

    describe('rejected understudy writes', () => {
        it('returns an item the understudy refused to accept to the player', () => {
            const session = makeSession();
            session.onContainerOpened();
            understudyInventory.setItem.mockImplementation(() => void 0);
            proxyContainer.setItem(4, makeItem('minecraft:diamond_block'));

            session.onTick();

            expect(playerInventory.getItem(0).typeId).toBe('minecraft:diamond_block');
        });

        it('drops a refused item at the player feet when their inventory is full', () => {
            const session = makeSession();
            session.onContainerOpened();
            for (let slotIndex = 0; slotIndex < 36; slotIndex++)
                playerInventory.setItem(slotIndex, makeItem('minecraft:stone'));
            understudyInventory.setItem.mockImplementation(() => void 0);
            const diamondBlock = makeItem('minecraft:diamond_block');
            proxyContainer.setItem(4, diamondBlock);

            session.onTick();

            expect(player.dimension.spawnItem).toHaveBeenCalledWith(diamondBlock, player.location);
        });

        it('does not hand back an item the understudy accepted', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxyContainer.setItem(4, makeItem('minecraft:diamond_block'));

            session.onTick();

            expect(playerInventory.getItem(0)).toBeUndefined();
        });
    });

    describe('disposal safety', () => {
        it('removes the proxy only once across repeated dispose calls', () => {
            const session = makeSession();
            session.dispose();
            session.dispose();
            expect(proxy.remove).toHaveBeenCalledTimes(1);
        });

        it('does nothing on a tick after disposal', () => {
            const session = makeSession();
            session.dispose();
            proxy.teleportTo.mockClear();

            session.onTick();

            expect(proxy.teleportTo).not.toHaveBeenCalled();
            expect(proxy.remove).toHaveBeenCalledTimes(1);
        });

        it('returns overflow items when the session is disposed without a close', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxyContainer.setItem(20, makeItem('minecraft:emerald'));

            session.dispose();

            expect(playerInventory.getItem(0).typeId).toBe('minecraft:emerald');
        });

        it('does not throw out of dispose when returning items fails', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxyContainer.setItem(20, makeItem('minecraft:emerald'));
            player.getComponent.mockImplementation(() => {
                throw new Error('player is gone');
            });

            expect(() => session.dispose()).not.toThrow();
            expect(proxy.remove).toHaveBeenCalled();
        });
    });

    describe('player leave', () => {
        it('drops overflow items at the proxy when the player is already gone', () => {
            const session = makeSession();
            session.onContainerOpened();
            const emerald = makeItem('minecraft:emerald');
            proxyContainer.setItem(20, emerald);
            player.isValid = false;

            session.dispose();

            expect(proxy.dropItem).toHaveBeenCalledWith(emerald);
            expect(proxyContainer.getItem(20)).toBeUndefined();
        });

        it('does not reach for the departed player inventory', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxyContainer.setItem(20, makeItem('minecraft:emerald'));
            player.isValid = false;

            session.dispose();

            expect(playerInventory.addItem).not.toHaveBeenCalled();
            expect(player.dimension.spawnItem).not.toHaveBeenCalled();
        });

        it('drops the overflow items before the proxy entity is removed', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxyContainer.setItem(20, makeItem('minecraft:emerald'));
            player.isValid = false;
            proxy.remove.mockImplementation(() => {
                proxy.isValid = false;
            });

            session.dispose();

            expect(proxy.dropItem).toHaveBeenCalled();
        });

        it('keeps the overflow item in the proxy when the drop fails', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxyContainer.setItem(20, makeItem('minecraft:emerald'));
            player.isValid = false;
            proxy.dropItem.mockImplementation(() => {
                throw new Error('entity is invalid');
            });

            expect(() => session.dispose()).not.toThrow();
            expect(proxyContainer.getItem(20).typeId).toBe('minecraft:emerald');
        });

        it('warns instead of throwing when the proxy cannot take the item either', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => void 0);
            const session = makeSession();
            session.onContainerOpened();
            proxyContainer.setItem(20, makeItem('minecraft:emerald'));
            player.isValid = false;
            proxy.dropItem.mockReturnValue(false);

            expect(() => session.dispose()).not.toThrow();
            expect(warn).toHaveBeenCalled();
            warn.mockRestore();
        });
    });

    describe('split views', () => {
        let equipment;

        beforeEach(() => {
            equipment = {};
            understudy.getEquippable.mockReturnValue({
                getEquipment: vi.fn(slot => equipment[slot]),
                setEquipment: vi.fn((slot, itemStack) => {
                    equipment[slot] = itemStack;
                    return true;
                })
            });
        });

        it('mirrors the hotbar and worn gear when the player is not sneaking', () => {
            understudyInventory.setItem(0, makeItem('minecraft:dirt'));
            understudyInventory.setItem(9, makeItem('minecraft:diamond'));
            equipment[EquipmentSlot.Head] = makeItem('minecraft:diamond_helmet');
            const session = makeSession();

            session.onContainerOpened();

            expect(proxyContainer.getItem(0).typeId).toBe('minecraft:dirt');
            expect(proxyContainer.getItem(9).typeId).toBe('minecraft:diamond_helmet');
            expect(proxyContainer.getItem(13)).toBeUndefined();
        });

        it('mirrors the main inventory when the player is sneaking', () => {
            understudyInventory.setItem(0, makeItem('minecraft:dirt'));
            understudyInventory.setItem(9, makeItem('minecraft:diamond'));
            player.isSneaking = true;
            const session = makeSession();

            session.onContainerOpened();

            expect(proxyContainer.getItem(0).typeId).toBe('minecraft:diamond');
            expect(proxyContainer.getItem(26)).toBeUndefined();
        });

        it('picks up a sneak that started after the session did', () => {
            understudyInventory.setItem(9, makeItem('minecraft:diamond'));
            const session = makeSession();
            player.isSneaking = true;
            session.onTick();

            session.onContainerOpened();

            expect(proxyContainer.getItem(0).typeId).toBe('minecraft:diamond');
        });

        it('holds the opened view steady when the player lets go of sneak', () => {
            understudyInventory.setItem(9, makeItem('minecraft:diamond'));
            player.isSneaking = true;
            const session = makeSession();
            session.onContainerOpened();

            player.isSneaking = false;
            session.onTick();

            expect(session.viewMode).toBe(UnderstudyEditViewMode.Inventory);
            expect(proxyContainer.getItem(0).typeId).toBe('minecraft:diamond');
        });

        it('never mirrors more slots than a single chest can show', () => {
            player.isSneaking = true;
            const session = makeSession();
            session.onContainerOpened();
            understudyInventory.setItem(35, makeItem('minecraft:emerald'));
            session.onTick();

            expect(proxyContainer.getItem(26).typeId).toBe('minecraft:emerald');
            expect(proxyContainer.size).toBe(27);
        });

        it('returns items dropped past the hotbar view when it closes', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxyContainer.setItem(14, makeItem('minecraft:emerald'));

            session.onContainerClosed();

            expect(playerInventory.getItem(0).typeId).toBe('minecraft:emerald');
            expect(proxyContainer.getItem(14)).toBeUndefined();
        });
    });

    describe('proxy title', () => {
        it('names the hotbar view so the container title says what is inside', () => {
            makeSession();
            expect(proxy.setName).toHaveBeenCalledWith('Steve §7- §r%simplayer.editor.view.hotbarAndArmor');
        });

        it('names the inventory view while the player sneaks', () => {
            player.isSneaking = true;
            makeSession();
            expect(proxy.setName).toHaveBeenCalledWith('Steve §7- §r%simplayer.editor.view.inventory');
        });

        it('renames the proxy before the player interacts when they start sneaking', () => {
            const session = makeSession();
            proxy.setName.mockClear();
            player.isSneaking = true;

            session.onTick();

            expect(proxy.setName).toHaveBeenCalledWith('Steve §7- §r%simplayer.editor.view.inventory');
        });

        it('leaves the title alone while the container is open', () => {
            const session = makeSession();
            session.onContainerOpened();
            proxy.setName.mockClear();
            player.isSneaking = true;

            session.onTick();

            expect(proxy.setName).not.toHaveBeenCalled();
        });
    });

    describe('interaction tip', () => {
        it('tells the player how to reach each half of the inventory', () => {
            makeSession();
            expect(player.onScreenDisplay.setActionBar).toHaveBeenCalledWith({ translate: 'simplayer.editor.tip' });
        });

        it('keeps the tip up for as long as the player is looking', () => {
            const session = makeSession();
            player.onScreenDisplay.setActionBar.mockClear();

            session.onTick();

            expect(player.onScreenDisplay.setActionBar).toHaveBeenCalledWith({ translate: 'simplayer.editor.tip' });
        });

        it('stops nagging once the container is open', () => {
            const session = makeSession();
            session.onContainerOpened();
            player.onScreenDisplay.setActionBar.mockClear();

            session.onTick();

            expect(player.onScreenDisplay.setActionBar).not.toHaveBeenCalled();
        });

        it('does not throw when the player has no screen display', () => {
            player.onScreenDisplay = void 0;
            expect(() => makeSession()).not.toThrow();
        });
    });

    describe('matchesUnderstudy', () => {
        it('is true for its own understudy', () => {
            expect(makeSession().matchesUnderstudy(understudy)).toBe(true);
        });

        it('is false for a different understudy', () => {
            expect(makeSession().matchesUnderstudy({ name: 'Alex' })).toBe(false);
        });

        it('never matches an unresolved understudy', () => {
            expect(makeSession().matchesUnderstudy(void 0)).toBe(false);
            expect(new UnderstudyEditSession(player, void 0, proxy).matchesUnderstudy(void 0)).toBe(false);
        });
    });

    describe('closing the container', () => {
        it('empties the mirrored proxy slots so nobody else can loot them', () => {
            understudyInventory.setItem(0, makeItem('minecraft:diamond'));
            const session = makeSession();
            session.onContainerOpened();
            expect(proxyContainer.getItem(0).typeId).toBe('minecraft:diamond');

            session.onContainerClosed();

            expect(proxyContainer.getItem(0)).toBeUndefined();
            expect(understudyInventory.getItem(0).typeId).toBe('minecraft:diamond');
        });

        it('refills the proxy from the understudy when it is reopened', () => {
            understudyInventory.setItem(0, makeItem('minecraft:diamond'));
            const session = makeSession();
            session.onContainerOpened();
            session.onContainerClosed();

            session.onContainerOpened();

            expect(proxyContainer.getItem(0).typeId).toBe('minecraft:diamond');
        });
    });
});
