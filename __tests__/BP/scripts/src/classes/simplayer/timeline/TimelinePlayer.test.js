import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TimelinePlayer } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelinePlayer';
import { Timeline } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';
import { performEvent, startHold, stopHold } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TrackHandlers';

vi.mock('../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TrackHandlers', () => ({
    performEvent: vi.fn(),
    startHold: vi.fn(),
    stopHold: vi.fn()
}));

const FOREVER = { length: 1, ticks: [0] };

describe('TimelinePlayer', () => {
    let timeline;
    let understudy;
    let player;

    function performedTypes() {
        return performEvent.mock.calls.map(call => call[1]);
    }

    function track(type) {
        return timeline.getOrCreate(type);
    }

    beforeEach(() => {
        vi.clearAllMocks();
        understudy = { name: 'Bot' };
        timeline = new Timeline();
        timeline.setLoopLength(40);
        player = new TimelinePlayer(understudy, timeline);
    });

    describe('events', () => {
        it('performs a shared track on its tick of the world-aligned loop', () => {
            track('jump').setActive(5, true, 40);
            player.onTick(45);
            expect(performedTypes()).toEqual(['jump']);
            player.onTick(46);
            expect(performedTypes()).toEqual(['jump']);
        });

        it('passes the understudy and params to the event', () => {
            timeline.getOrCreate('select', { slot: 4 }).setActive(0, true, 40);
            player.onTick(0);
            expect(performEvent).toHaveBeenCalledWith(understudy, 'select', { slot: 4 });
        });

        it('starts a command looping track on the first tick it is played', () => {
            timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            for (let tick = 103; tick <= 110; tick++)
                player.onTick(tick);
            expect(performedTypes()).toEqual(['jump', 'jump']);
        });

        it('fires a once track on the next tick played and then removes it', () => {
            const once = timeline.addOneShot('attack', void 0, { delay: 0 });
            player.onTick(500);
            player.onTick(501);
            expect(performedTypes()).toEqual(['attack']);
            expect(timeline.getTrack(once.key)).toBeUndefined();
        });

        it('fires an after track only after its delay', () => {
            const after = timeline.addOneShot('jump', void 0, { delay: 3 });
            for (let tick = 10; tick <= 12; tick++)
                player.onTick(tick);
            expect(performedTypes()).toEqual([]);
            player.onTick(13);
            expect(performedTypes()).toEqual(['jump']);
            expect(timeline.getTrack(after.key)).toBeUndefined();
        });

        it('performs a type at most once per tick', () => {
            track('jump').setActive(0, true, 40);
            timeline.addOneShot('jump', void 0, { delay: 0 });
            player.onTick(0);
            expect(performedTypes()).toEqual(['jump']);
        });

        it('lets the later track of a type win', () => {
            timeline.addOneShot('select', { slot: 1 }, { delay: 0 });
            timeline.addOneShot('select', { slot: 5 }, { delay: 0 });
            player.onTick(0);
            expect(performEvent).toHaveBeenCalledTimes(1);
            expect(performEvent).toHaveBeenCalledWith(understudy, 'select', { slot: 5 });
        });

        it('performs different types in track order', () => {
            track('attack').setActive(3, true, 40);
            track('jump').setActive(3, true, 40);
            player.onTick(3);
            expect(performedTypes()).toEqual(['attack', 'jump']);
        });

        it('does nothing for an empty timeline', () => {
            for (let tick = 0; tick < 5; tick++)
                player.onTick(tick);
            expect(performEvent).not.toHaveBeenCalled();
            expect(startHold).not.toHaveBeenCalled();
            expect(stopHold).not.toHaveBeenCalled();
        });
    });

    describe('holds', () => {
        it('holds across a span and releases after it', () => {
            for (const tick of [10, 11, 12])
                track('usehold').setActive(tick, true, 40);
            player.onTick(9);
            expect(startHold).not.toHaveBeenCalled();
            player.onTick(10);
            player.onTick(11);
            player.onTick(12);
            expect(startHold).toHaveBeenCalledTimes(1);
            expect(startHold).toHaveBeenCalledWith(understudy, 'usehold', void 0);
            expect(stopHold).not.toHaveBeenCalled();
            player.onTick(13);
            expect(stopHold).toHaveBeenCalledWith(understudy, 'usehold');
            expect(player.isHolding).toBe(false);
        });

        it('keeps holding through a span that wraps around the loop', () => {
            track('usehold').setActive(39, true, 40);
            track('usehold').setActive(0, true, 40);
            player.onTick(39);
            player.onTick(40);
            expect(startHold).toHaveBeenCalledTimes(1);
            expect(stopHold).not.toHaveBeenCalled();
        });

        it('reasserts sneak on every active tick', () => {
            timeline.setLooping('sneak', void 0, FOREVER);
            player.onTick(0);
            player.onTick(1);
            player.onTick(2);
            expect(startHold).toHaveBeenCalledTimes(3);
        });

        it('starts glide once while it stays held', () => {
            timeline.setLooping('glide', void 0, FOREVER);
            player.onTick(0);
            player.onTick(1);
            player.onTick(2);
            expect(startHold).toHaveBeenCalledTimes(1);
        });

        it('restarts a hold when its track is replaced with the same key', () => {
            timeline.setLooping('glide', void 0, FOREVER);
            player.onTick(0);
            player.onTick(1);
            timeline.setLooping('glide', void 0, FOREVER);
            player.onTick(2);
            expect(stopHold).toHaveBeenCalledWith(understudy, 'glide');
            expect(startHold).toHaveBeenCalledTimes(2);
            expect(stopHold.mock.invocationCallOrder[0]).toBeLessThan(startHold.mock.invocationCallOrder[1]);
        });

        it('lets the later move direction win', () => {
            timeline.setLooping('move', { direction: 'forward' }, FOREVER);
            timeline.setLooping('move', { direction: 'backward' }, FOREVER);
            player.onTick(0);
            expect(startHold).toHaveBeenCalledTimes(1);
            expect(startHold).toHaveBeenCalledWith(understudy, 'move', { direction: 'backward' });
            expect(stopHold).not.toHaveBeenCalled();
        });

        it('switches direction when an earlier direction is re-issued', () => {
            timeline.setLooping('move', { direction: 'forward' }, FOREVER);
            timeline.setLooping('move', { direction: 'backward' }, FOREVER);
            player.onTick(0);
            timeline.setLooping('move', { direction: 'forward' }, FOREVER);
            player.onTick(1);
            expect(stopHold).toHaveBeenCalledWith(understudy, 'move');
            expect(startHold).toHaveBeenLastCalledWith(understudy, 'move', { direction: 'forward' });
        });

        it('releases a hold on the tick after its track is removed', () => {
            timeline.setLooping('move', { direction: 'left' }, FOREVER);
            player.onTick(0);
            timeline.removeType('move');
            player.onTick(1);
            expect(stopHold).toHaveBeenCalledWith(understudy, 'move');
            expect(player.isHolding).toBe(false);
        });

        it('releases every held type when stopped', () => {
            timeline.setLooping('sneak', void 0, FOREVER);
            timeline.setLooping('move', { direction: 'left' }, FOREVER);
            player.onTick(0);
            player.stop();
            expect(stopHold).toHaveBeenCalledWith(understudy, 'sneak');
            expect(stopHold).toHaveBeenCalledWith(understudy, 'move');
            expect(player.isHolding).toBe(false);
        });

        it('does not release when stopped without holding', () => {
            player.stop();
            expect(stopHold).not.toHaveBeenCalled();
        });
    });
});
