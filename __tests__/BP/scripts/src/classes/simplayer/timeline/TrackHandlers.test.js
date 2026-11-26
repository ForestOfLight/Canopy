import { vi, describe, it, expect, beforeEach } from 'vitest';
import { performEvent, startHold, stopHold } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TrackHandlers';
import { RepeatableAction } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/RepeatableAction';
import { Vector } from '../../../../../../../Canopy[BP]/scripts/lib/Vector';

describe('TrackHandlers', () => {
    let simulatedPlayer;
    let understudy;
    let performed;

    beforeEach(() => {
        vi.restoreAllMocks();
        performed = [];
        vi.spyOn(RepeatableAction.prototype, 'perform').mockImplementation(function perform() { performed.push(this.type); });
        simulatedPlayer = { useItemInSlot: vi.fn(), stopUsingItem: vi.fn(), selectedSlotIndex: 2 };
        understudy = {
            simulatedPlayer,
            selectSlot: vi.fn(),
            look: vi.fn(),
            moveLocation: vi.fn(),
            moveRelative: vi.fn(),
            stopMoving: vi.fn(),
            sneak: vi.fn(),
            sprint: vi.fn(),
            glide: vi.fn()
        };
    });

    describe('performEvent', () => {
        it('performs a plain action through RepeatableAction', () => {
            performEvent(understudy, 'jump');
            expect(performed).toEqual(['jump']);
        });

        it('selects a slot', () => {
            performEvent(understudy, 'select', { slot: 4 });
            expect(understudy.selectSlot).toHaveBeenCalledWith(4);
        });

        it('looks in a cardinal direction', () => {
            performEvent(understudy, 'look', { target: { kind: 'cardinal', direction: 'up' } });
            expect(understudy.look).toHaveBeenCalledWith({ x: -90, y: 0 });
        });

        it('looks at a rotation', () => {
            performEvent(understudy, 'look', { target: { kind: 'rotation', rotation: { x: 10, y: 90 } } });
            expect(understudy.look).toHaveBeenCalledWith({ x: 10, y: 90 });
        });

        it('looks at a location as a Vector', () => {
            performEvent(understudy, 'look', { target: { kind: 'location', location: { x: 1, y: 2, z: 3 } } });
            const target = understudy.look.mock.calls[0][0];
            expect(target).toBeInstanceOf(Vector);
            expect({ x: target.x, y: target.y, z: target.z }).toEqual({ x: 1, y: 2, z: 3 });
        });

        it('looks at an entity', () => {
            const entity = { isValid: true };
            performEvent(understudy, 'look', { target: { kind: 'entity', entity } });
            expect(understudy.look).toHaveBeenCalledWith(entity);
        });

        it('moves to a block', () => {
            const block = { isValid: true };
            performEvent(understudy, 'moveto', { target: { kind: 'block', block } });
            expect(understudy.moveLocation).toHaveBeenCalledWith(block);
        });

        it('moves to an entity', () => {
            const entity = { isValid: true };
            performEvent(understudy, 'moveto', { target: { kind: 'entity', entity } });
            expect(understudy.moveLocation).toHaveBeenCalledWith(entity);
        });

        it('moves to a location as a Vector', () => {
            performEvent(understudy, 'moveto', { target: { kind: 'location', location: { x: 1, y: 2, z: 3 } } });
            expect(understudy.moveLocation.mock.calls[0][0]).toBeInstanceOf(Vector);
        });

        it('skips a look at an invalid entity', () => {
            expect(() => performEvent(understudy, 'look', { target: { kind: 'entity', entity: { isValid: false } } })).not.toThrow();
            expect(understudy.look).not.toHaveBeenCalled();
        });

        it('skips a move to an invalid block', () => {
            expect(() => performEvent(understudy, 'moveto', { target: { kind: 'block', block: { isValid: false } } })).not.toThrow();
            expect(understudy.moveLocation).not.toHaveBeenCalled();
        });

        it('skips a move to an invalid entity', () => {
            performEvent(understudy, 'moveto', { target: { kind: 'entity', entity: { isValid: false } } });
            expect(understudy.moveLocation).not.toHaveBeenCalled();
        });
    });

    describe('holds', () => {
        it('moves relative while held and stops on release', () => {
            startHold(understudy, 'move', { direction: 'forward' });
            expect(understudy.moveRelative).toHaveBeenCalledWith('forward');
            stopHold(understudy, 'move');
            expect(understudy.stopMoving).toHaveBeenCalled();
        });

        it('uses the selected slot item while held', () => {
            startHold(understudy, 'usehold');
            expect(simulatedPlayer.useItemInSlot).toHaveBeenCalledWith(2);
            stopHold(understudy, 'usehold');
            expect(simulatedPlayer.stopUsingItem).toHaveBeenCalled();
        });

        it.each(['sneak', 'sprint', 'glide'])('toggles %s', (type) => {
            startHold(understudy, type);
            expect(understudy[type]).toHaveBeenCalledWith(true);
            stopHold(understudy, type);
            expect(understudy[type]).toHaveBeenLastCalledWith(false);
        });
    });
});
