import { vi, describe, it, expect, beforeEach } from 'vitest';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import { system, world } from '@minecraft/server';
import { simplayerActionInfo } from '../../../../../../Canopy[BP]/scripts/src/rules/simplayer/simplayerActionInfo';
import { Actions } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Actions';
import { RepeatableAction, REPEATABLE_ACTIONS } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/RepeatableAction';
import { Timeline } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';

describe('Actions', () => {
    let mockUnderstudy;
    let actions;
    let performSpy;
    let repeatableActionOnTickSpy;

    beforeEach(() => {
        mockUnderstudy = { name: 'TestBot', simulatedPlayer: { nameplateRenderDistance: 64 } };
        actions = new Actions(mockUnderstudy);
        performSpy = vi.spyOn(RepeatableAction.prototype, 'perform').mockImplementation(() => {});
        repeatableActionOnTickSpy = vi.spyOn(RepeatableAction.prototype, 'onTick').mockImplementation(() => {});
    });

    describe('constructor', () => {
        it('stores the understudy', () => {
            expect(actions.understudy).toBe(mockUnderstudy);
        });

        it('starts with no actions queued', () => {
            expect(actions.isEmpty()).toBe(true);
        });
    });

    describe('timeline', () => {
        it('exposes one timeline per understudy', () => {
            expect(actions.timeline).toBeInstanceOf(Timeline);
            expect(actions.timeline).toBe(actions.timeline);
        });
    });

    describe('once', () => {
        it('queues a single action', () => {
            actions.once(REPEATABLE_ACTIONS.ATTACK);
            expect(actions.isEmpty()).toBe(false);
        });

        it('performs the action on the next onTick call', () => {
            actions.once(REPEATABLE_ACTIONS.ATTACK);
            actions.onTick();
            expect(performSpy).toHaveBeenCalledOnce();
        });

        it('performs the action only once', () => {
            actions.once(REPEATABLE_ACTIONS.ATTACK);
            actions.onTick();
            actions.onTick();
            expect(performSpy).toHaveBeenCalledOnce();
        });

        it('does not perform the action before the tick delay elapses', () => {
            actions.once(REPEATABLE_ACTIONS.ATTACK, 5);
            actions.onTick();
            expect(performSpy).not.toHaveBeenCalled();
        });

        it('performs the action after the tick delay elapses', () => {
            actions.once(REPEATABLE_ACTIONS.ATTACK, 5);
            scheduler.advanceTicks(5);
            actions.onTick();
            expect(performSpy).toHaveBeenCalledOnce();
        });
    });

    describe('repeat', () => {
        it('adds a repeating action', () => {
            actions.repeat(REPEATABLE_ACTIONS.ATTACK);
            expect(actions.has(REPEATABLE_ACTIONS.ATTACK)).toBe(true);
        });

        it('replaces an existing action of the same type', () => {
            actions.repeat(REPEATABLE_ACTIONS.ATTACK, 5);
            actions.repeat(REPEATABLE_ACTIONS.ATTACK, 10);
            expect(actions.get(REPEATABLE_ACTIONS.ATTACK).intervalTicks).toBe(10);
        });

        it('does not affect other action types when replacing', () => {
            actions.repeat(REPEATABLE_ACTIONS.ATTACK);
            actions.repeat(REPEATABLE_ACTIONS.JUMP);
            actions.repeat(REPEATABLE_ACTIONS.ATTACK, 5);
            expect(actions.has(REPEATABLE_ACTIONS.JUMP)).toBe(true);
        });
    });

    describe('get', () => {
        it('returns the repeating action with the given type', () => {
            actions.repeat(REPEATABLE_ACTIONS.ATTACK);
            const action = actions.get(REPEATABLE_ACTIONS.ATTACK);
            expect(action).toBeInstanceOf(RepeatableAction);
            expect(action.type).toBe(REPEATABLE_ACTIONS.ATTACK);
        });

        it('returns undefined when no action of that type exists', () => {
            expect(actions.get(REPEATABLE_ACTIONS.ATTACK)).toBeUndefined();
        });
    });

    describe('has', () => {
        it('returns true when a repeating action with the given type exists', () => {
            actions.repeat(REPEATABLE_ACTIONS.ATTACK);
            expect(actions.has(REPEATABLE_ACTIONS.ATTACK)).toBe(true);
        });

        it('returns false when no repeating action with the given type exists', () => {
            expect(actions.has(REPEATABLE_ACTIONS.ATTACK)).toBe(false);
        });
    });

    describe('isEmpty', () => {
        it('returns true when no actions are queued', () => {
            expect(actions.isEmpty()).toBe(true);
        });

        it('returns false when a single action is queued', () => {
            actions.once(REPEATABLE_ACTIONS.ATTACK);
            expect(actions.isEmpty()).toBe(false);
        });

        it('returns false when a repeating action is queued', () => {
            actions.repeat(REPEATABLE_ACTIONS.ATTACK);
            expect(actions.isEmpty()).toBe(false);
        });
    });

    describe('remove', () => {
        it('removes the repeating action with the given type', () => {
            actions.repeat(REPEATABLE_ACTIONS.ATTACK);
            actions.remove(REPEATABLE_ACTIONS.ATTACK);
            expect(actions.has(REPEATABLE_ACTIONS.ATTACK)).toBe(false);
        });

        it('does not remove other action types', () => {
            actions.repeat(REPEATABLE_ACTIONS.ATTACK);
            actions.repeat(REPEATABLE_ACTIONS.JUMP);
            actions.remove(REPEATABLE_ACTIONS.ATTACK);
            expect(actions.has(REPEATABLE_ACTIONS.JUMP)).toBe(true);
        });
    });

    describe('clear', () => {
        it('removes all repeating and single actions', () => {
            actions.once(REPEATABLE_ACTIONS.ATTACK);
            actions.repeat(REPEATABLE_ACTIONS.JUMP);
            actions.clear();
            expect(actions.isEmpty()).toBe(true);
        });
    });

    describe('onTick', () => {
        it('calls perform on each pending single action', () => {
            actions.once(REPEATABLE_ACTIONS.ATTACK);
            actions.once(REPEATABLE_ACTIONS.JUMP);
            actions.onTick();
            expect(performSpy).toHaveBeenCalledTimes(2);
        });

        it('clears single actions after performing them', () => {
            actions.once(REPEATABLE_ACTIONS.ATTACK);
            actions.onTick();
            expect(actions.isEmpty()).toBe(true);
        });

        it('calls onTick on each repeating action', () => {
            actions.repeat(REPEATABLE_ACTIONS.ATTACK);
            actions.repeat(REPEATABLE_ACTIONS.JUMP);
            actions.onTick();
            expect(repeatableActionOnTickSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('timeline playback', () => {
        beforeEach(() => {
            Object.assign(mockUnderstudy.simulatedPlayer, { useItemInSlot: vi.fn(), stopUsingItem: vi.fn(), selectedSlotIndex: 0 });
            system.currentTick = 0;
        });

        it('plays the timeline on its active tick', () => {
            actions.timeline.setActive('attack', 3, true);
            system.currentTick = 3;
            actions.onTick();
            expect(performSpy).toHaveBeenCalledTimes(1);
            system.currentTick = 4;
            actions.onTick();
            expect(performSpy).toHaveBeenCalledTimes(1);
        });

        it('is not empty while the timeline has active ticks', () => {
            actions.timeline.setActive('jump', 0, true);
            expect(actions.isEmpty()).toBe(false);
        });

        it('resets the timeline when cleared', () => {
            actions.timeline.setLoopLength(100);
            actions.timeline.setActive('jump', 0, true);
            actions.clear();
            expect(actions.timeline.isEmpty()).toBe(true);
            expect(actions.timeline.loopLength).toBe(Timeline.DEFAULT_LOOP_LENGTH);
        });

        it('releases a held item when cleared and does not hold again', () => {
            actions.timeline.fillTrack('usehold');
            actions.onTick();
            expect(mockUnderstudy.simulatedPlayer.useItemInSlot).toHaveBeenCalledTimes(1);
            actions.clear();
            expect(mockUnderstudy.simulatedPlayer.stopUsingItem).toHaveBeenCalledTimes(1);
            system.currentTick = 1;
            actions.onTick();
            expect(mockUnderstudy.simulatedPlayer.useItemInSlot).toHaveBeenCalledTimes(1);
        });

        it('shows the timeline in the action info', () => {
            vi.spyOn(simplayerActionInfo, 'getNativeValue').mockReturnValue(true);
            mockUnderstudy.nameTag = 'TestBot';
            actions.timeline.setActive('jump', 5, true);
            actions.onTick();
            const textPrimitive = vi.mocked(world.primitiveShapesManager.addText).mock.calls.at(-1)[0];
            expect(textPrimitive.text.rawtext).toContainEqual({ translate: 'simplayer.action.timeline', with: [String(Timeline.DEFAULT_LOOP_LENGTH)] });
        });
    });
});
