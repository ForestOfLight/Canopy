import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TimelinePlayer } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelinePlayer';
import { Timeline } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';
import { RepeatableAction } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/RepeatableAction';

describe('TimelinePlayer', () => {
    let timeline;
    let simulatedPlayer;
    let player;
    let performed;

    beforeEach(() => {
        vi.restoreAllMocks();
        performed = [];
        vi.spyOn(RepeatableAction.prototype, 'perform').mockImplementation(function perform() { performed.push(this.type); });
        simulatedPlayer = { useItemInSlot: vi.fn(), stopUsingItem: vi.fn(), selectedSlotIndex: 2 };
        timeline = new Timeline();
        timeline.setLoopLength(40);
        player = new TimelinePlayer({ simulatedPlayer }, timeline);
    });

    it('performs an action on its active tick of the loop', () => {
        timeline.setActive('attack', 5, true);
        player.onTick(45);
        expect(performed).toEqual(['attack']);
        player.onTick(46);
        expect(performed).toEqual(['attack']);
    });

    it('performs every track active on the same tick', () => {
        timeline.setActive('attack', 3, true);
        timeline.setActive('jump', 3, true);
        player.onTick(3);
        expect(performed).toEqual(['attack', 'jump']);
    });

    it('uses the item every tick on the use track', () => {
        timeline.setActive('use', 0, true);
        player.onTick(0);
        expect(performed).toEqual(['use']);
        expect(simulatedPlayer.useItemInSlot).not.toHaveBeenCalled();
    });

    it('does nothing for an empty timeline', () => {
        for (let tick = 0; tick < 5; tick++)
            player.onTick(tick);
        expect(performed).toEqual([]);
        expect(simulatedPlayer.useItemInSlot).not.toHaveBeenCalled();
        expect(simulatedPlayer.stopUsingItem).not.toHaveBeenCalled();
    });

    it('holds the item across a span and releases after it', () => {
        for (const tick of [10, 11, 12])
            timeline.setActive('usehold', tick, true);
        player.onTick(9);
        expect(simulatedPlayer.useItemInSlot).not.toHaveBeenCalled();
        player.onTick(10);
        expect(simulatedPlayer.useItemInSlot).toHaveBeenCalledTimes(1);
        expect(simulatedPlayer.useItemInSlot).toHaveBeenCalledWith(2);
        player.onTick(11);
        player.onTick(12);
        expect(simulatedPlayer.useItemInSlot).toHaveBeenCalledTimes(1);
        expect(simulatedPlayer.stopUsingItem).not.toHaveBeenCalled();
        player.onTick(13);
        expect(simulatedPlayer.stopUsingItem).toHaveBeenCalledTimes(1);
        expect(player.isHolding).toBe(false);
        expect(performed).toEqual([]);
    });

    it('keeps holding through a span that wraps around the loop', () => {
        for (const tick of [38, 39, 0, 1])
            timeline.setActive('usehold', tick, true);
        for (let tick = 38; tick <= 41; tick++)
            player.onTick(tick);
        expect(simulatedPlayer.useItemInSlot).toHaveBeenCalledTimes(1);
        expect(simulatedPlayer.stopUsingItem).not.toHaveBeenCalled();
    });

    it('holds forever on a full hold row of a one tick loop', () => {
        timeline.setLoopLength(1);
        timeline.fillTrack('usehold');
        for (let tick = 0; tick < 5; tick++)
            player.onTick(tick);
        expect(simulatedPlayer.useItemInSlot).toHaveBeenCalledTimes(1);
        expect(simulatedPlayer.stopUsingItem).not.toHaveBeenCalled();
    });

    it('releases a hold when stopped', () => {
        timeline.setActive('usehold', 0, true);
        player.onTick(0);
        player.stop();
        expect(simulatedPlayer.stopUsingItem).toHaveBeenCalledTimes(1);
        expect(player.isHolding).toBe(false);
    });

    it('does not release when stopped without holding', () => {
        player.stop();
        expect(simulatedPlayer.stopUsingItem).not.toHaveBeenCalled();
    });

    it('releases on the next tick after the hold track is cleared mid-hold', () => {
        timeline.fillTrack('usehold');
        player.onTick(0);
        timeline.clearTrack('usehold');
        player.onTick(1);
        expect(simulatedPlayer.stopUsingItem).toHaveBeenCalledTimes(1);
    });
});
