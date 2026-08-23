import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityComponentTypes, ItemStack, Player, world } from '@minecraft/server';
import { PlayerStartLookingAtUnderstudyEvent } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/events/PlayerStartLookingAtUnderstudyEvent';
import Understudies from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';

describe('PlayerStartLookingAtUnderstudyEvent', () => {
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
        event = new PlayerStartLookingAtUnderstudyEvent();

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

    it('fires while the player holds a spyglass', () => {
        hold('minecraft:spyglass');

        const events = event.provideEvents();

        expect(events).toHaveLength(1);
        expect(events[0].understudy).toBe(understudy);
    });

    it('fires while the player holds an arrow', () => {
        hold('minecraft:arrow');

        expect(event.provideEvents()).toHaveLength(1);
    });

    it('does not fire while the player holds no editor tool', () => {
        hold('minecraft:diamond_sword');

        expect(event.provideEvents()).toEqual([]);
    });

    it('does not raycast while the player holds no editor tool', () => {
        hold('minecraft:diamond_sword');

        event.provideEvents();

        expect(player.getEntitiesFromViewDirection).not.toHaveBeenCalled();
    });

    it('fires when the player equips a spyglass without looking away', () => {
        hold('minecraft:diamond_sword');
        event.provideEvents();

        hold('minecraft:spyglass');

        expect(event.provideEvents()).toHaveLength(1);
    });

    it('does not fire twice while the tool stays equipped', () => {
        hold('minecraft:spyglass');
        event.provideEvents();

        expect(event.provideEvents()).toEqual([]);
    });
});
