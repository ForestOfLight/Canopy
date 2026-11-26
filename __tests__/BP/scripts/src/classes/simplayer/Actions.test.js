import { vi, describe, it, expect, beforeEach } from 'vitest';
import { system, world } from '@minecraft/server';
import { simplayerActionInfo } from '../../../../../../Canopy[BP]/scripts/src/rules/simplayer/simplayerActionInfo';
import { Actions } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Actions';
import { RepeatableAction } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/RepeatableAction';
import { Timeline } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';
import { TimelinePlayer } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelinePlayer';

describe('Actions', () => {
    let mockUnderstudy;
    let actions;
    let performSpy;

    function lastActionInfoText() {
        return vi.mocked(world.primitiveShapesManager.addText).mock.calls.at(-1)[0].text.rawtext;
    }

    beforeEach(() => {
        vi.restoreAllMocks();
        system.currentTick = 0;
        mockUnderstudy = {
            name: 'TestBot',
            nameTag: 'TestBot',
            simulatedPlayer: { nameplateRenderDistance: 64, useItemInSlot: vi.fn(), stopUsingItem: vi.fn(), selectedSlotIndex: 0 }
        };
        actions = new Actions(mockUnderstudy);
        performSpy = vi.spyOn(RepeatableAction.prototype, 'perform').mockImplementation(() => {});
    });

    it('stores the understudy', () => {
        expect(actions.understudy).toBe(mockUnderstudy);
    });

    it('starts empty', () => {
        expect(actions.isEmpty()).toBe(true);
    });

    it('exposes one timeline per understudy', () => {
        expect(actions.timeline).toBeInstanceOf(Timeline);
        expect(actions.timeline).toBe(actions.timeline);
    });

    it('is not empty while the timeline has an active track', () => {
        actions.timeline.addOneShot('attack', void 0, { delay: 0 });
        expect(actions.isEmpty()).toBe(false);
    });

    it('plays the timeline at the current world tick', () => {
        const onTickSpy = vi.spyOn(TimelinePlayer.prototype, 'onTick');
        system.currentTick = 37;
        actions.onTick();
        expect(onTickSpy).toHaveBeenCalledWith(37);
    });

    it('performs a once action on the next tick', () => {
        actions.timeline.addOneShot('attack', void 0, { delay: 0 });
        actions.onTick();
        system.currentTick = 1;
        actions.onTick();
        expect(performSpy).toHaveBeenCalledOnce();
        expect(actions.isEmpty()).toBe(true);
    });

    it('stops the player and resets the timeline when cleared', () => {
        const stopSpy = vi.spyOn(TimelinePlayer.prototype, 'stop');
        actions.timeline.setLoopLength(100);
        actions.timeline.getOrCreate('select', { slot: 1 }).setActive(0, true, 100);
        actions.clear();
        expect(stopSpy).toHaveBeenCalled();
        expect(actions.timeline.tracks).toHaveLength(13);
        expect(actions.timeline.isEmpty()).toBe(true);
        expect(actions.timeline.loopLength).toBe(Timeline.DEFAULT_LOOP_LENGTH);
    });

    it('releases a held item when cleared and does not hold again', () => {
        actions.timeline.setLooping('usehold', void 0, { length: 1, ticks: [0] });
        actions.onTick();
        expect(mockUnderstudy.simulatedPlayer.useItemInSlot).toHaveBeenCalledTimes(1);
        actions.clear();
        expect(mockUnderstudy.simulatedPlayer.stopUsingItem).toHaveBeenCalledTimes(1);
        system.currentTick = 1;
        actions.onTick();
        expect(mockUnderstudy.simulatedPlayer.useItemInSlot).toHaveBeenCalledTimes(1);
    });

    describe('action info', () => {
        beforeEach(() => {
            vi.spyOn(simplayerActionInfo, 'getNativeValue').mockReturnValue(true);
        });

        it('lists every non-empty track with its label and length once', () => {
            actions.timeline.setLooping('jump', void 0, { length: 7, ticks: [3] });
            actions.timeline.getTrack('attack').setActive(5, true, 20);
            actions.timeline.addOneShot('select', { slot: 2 }, { delay: 40 });
            actions.onTick();
            expect(lastActionInfoText()).toEqual([
                { text: 'TestBot\n' },
                { translate: 'simplayer.action.track', with: { rawtext: [{ translate: 'simplayer.action.attack' }, { text: '20t' }] } },
                { text: '\n' },
                { translate: 'simplayer.action.track', with: { rawtext: [{ translate: 'simplayer.action.jump' }, { text: '7t' }] } },
                { text: '\n' },
                { translate: 'simplayer.action.track', with: { rawtext: [{ translate: 'simplayer.timeline.track.select', with: ['3'] }, { translate: 'simplayer.action.track.once' }] } },
                { text: '\n' }
            ]);
        });

        it('hides the info and restores the nameplate when every track is empty', () => {
            actions.timeline.getTrack('attack').setActive(5, true, 20);
            actions.onTick();
            expect(mockUnderstudy.simulatedPlayer.nameplateRenderDistance).toBe(0);
            actions.timeline.clearTrack('attack');
            actions.onTick();
            expect(mockUnderstudy.simulatedPlayer.nameplateRenderDistance).toBe(64);
        });
    });
});
