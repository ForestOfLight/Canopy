import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityComponentTypes, ItemStack, Player, world } from '@minecraft/server';
import { PlayerStopLookingAtUnderstudyEvent } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/events/PlayerStopLookingAtUnderstudyEvent';
import Understudies from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';

describe('PlayerStopLookingAtUnderstudyEvent', () => {
    let event;
    let player;
    let understudyPlayer;
    let understudy;

    const hold = typeId => {
        const container = player.getComponent(EntityComponentTypes.Inventory).container;
        container.setItem(0, typeId === void 0 ? void 0 : new ItemStack(typeId, 1));
        player.selectedSlotIndex = 0;
    };

    beforeEach(() => {
        vi.restoreAllMocks();
        event = new PlayerStopLookingAtUnderstudyEvent();

        player = new Player();
        player.id = 'player-1';
        player.name = 'Viewer';

        understudyPlayer = new Player();
        understudyPlayer.id = 'understudy-1';
        understudyPlayer.name = 'Bot';
        understudy = { name: 'Bot' };

        player.getEntitiesFromViewDirection.mockReturnValue([{ entity: understudyPlayer }]);
        vi.spyOn(world, 'getAllPlayers').mockReturnValue([player]);
        vi.spyOn(world, 'getEntity').mockReturnValue(player);
        vi.spyOn(Understudies, 'isUnderstudy').mockImplementation(entity => entity?.name === 'Bot');
        vi.spyOn(Understudies, 'get').mockReturnValue(understudy);
    });

    it('fires when the player swaps away from the editor tool while still looking', () => {
        hold('minecraft:spyglass');
        event.provideEvents();

        hold('minecraft:diamond_sword');
        const events = event.provideEvents();

        expect(events).toHaveLength(1);
        expect(events[0].understudy).toBe(understudy);
    });

    it('fires when the player looks away while still holding the editor tool', () => {
        hold('minecraft:spyglass');
        event.provideEvents();

        player.getEntitiesFromViewDirection.mockReturnValue([]);

        expect(event.provideEvents()).toHaveLength(1);
    });

    it('does not fire while the tool stays equipped and aimed', () => {
        hold('minecraft:spyglass');
        event.provideEvents();

        expect(event.provideEvents()).toEqual([]);
    });
});
