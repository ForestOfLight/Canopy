import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ButtonState, Container, EntityComponentTypes } from '@minecraft/server';
import { PeekTarget } from '../../../../../../Canopy[BP]/scripts/src/classes/peek/PeekTarget';
import { PeekViewMode } from '../../../../../../Canopy[BP]/scripts/src/classes/peek/PeekView';

const makePlayer = (isSneaking = false) => ({
    inputInfo: { getButtonState: vi.fn(() => isSneaking ? ButtonState.Pressed : ButtonState.Released) }
});

describe('PeekTarget', () => {
    let container;

    const makeTarget = (overrides = {}) => ({
        typeId: 'minecraft:chest',
        isValid: true,
        localizationKey: 'tile.chest.name',
        dimension: { id: 'minecraft:overworld' },
        location: { x: 1, y: 2, z: 3 },
        getComponent: vi.fn(componentId => {
            if (componentId === EntityComponentTypes.Inventory)
                return { container };
            return void 0;
        }),
        ...overrides
    });

    beforeEach(() => {
        container = new Container({ size: 27 });
    });

    describe('resolveView', () => {
        it('exposes the target container as a mirrorable view', () => {
            const view = new PeekTarget(makeTarget()).resolveView();
            expect(view.size).toBe(27);
        });

        it('has no view once the target lost its inventory', () => {
            const target = makeTarget({ getComponent: vi.fn(() => void 0) });
            expect(new PeekTarget(target).resolveView()).toBeUndefined();
        });

        it('has no view once the target is unloaded', () => {
            const target = makeTarget();
            target.isValid = false;
            expect(new PeekTarget(target).resolveView()).toBeUndefined();
        });

        it('survives a target that throws while being read', () => {
            const target = makeTarget({
                getComponent: vi.fn(() => {
                    throw new Error('block is in an unloaded chunk');
                })
            });
            expect(() => new PeekTarget(target).resolveView()).not.toThrow();
            expect(new PeekTarget(target).resolveView()).toBeUndefined();
        });
    });

    describe('paging', () => {
        const paged = () => makeTarget({ typeId: 'minecraft:chest' });

        it('shows the top half of a double chest by default', () => {
            container = new Container({ size: 54 });
            const target = new PeekTarget(paged());
            expect(target.resolveView().size).toBe(27);
            expect(target.viewMode).toBe(PeekViewMode.Top);
        });

        it('switches to the bottom half when the player sneaks', () => {
            container = new Container({ size: 54 });
            container.setItem(27, { typeId: 'minecraft:emerald', amount: 1 });
            const target = new PeekTarget(paged());

            target.refresh(makePlayer(true));

            expect(target.viewMode).toBe(PeekViewMode.Bottom);
            expect(target.resolveView().getItem(0).typeId).toBe('minecraft:emerald');
        });

        it('names the half in the container title when it pages', () => {
            container = new Container({ size: 54 });
            const target = new PeekTarget(paged());
            expect(target.displayName()).toBe('%tile.chest.name - %commands.peek.view.top');

            target.refresh(makePlayer(true));

            expect(target.displayName()).toBe('%tile.chest.name - %commands.peek.view.bottom');
        });

        it('leaves a single chest title alone and offers no sneak tip', () => {
            const target = new PeekTarget(makeTarget());
            expect(target.displayName()).toBe('%tile.chest.name');
            expect(target.tipTranslateKey).toBeUndefined();
        });

        it('offers the sneak tip only when there is a second half to reach', () => {
            container = new Container({ size: 54 });
            expect(new PeekTarget(paged()).tipTranslateKey).toBe('commands.peek.tip');
        });

        it('ignores sneaking on a container that fits in one page', () => {
            const target = new PeekTarget(makeTarget());
            target.refresh(makePlayer(true));
            expect(target.resolveView().size).toBe(27);
        });
    });

    describe('isAlive', () => {
        it('is alive while the container can still be read', () => {
            expect(new PeekTarget(makeTarget()).isAlive()).toBe(true);
        });

        it('dies with the container', () => {
            const target = makeTarget();
            target.isValid = false;
            expect(new PeekTarget(target).isAlive()).toBe(false);
        });
    });

    describe('displayName', () => {
        it('titles the container with the target localization key', () => {
            expect(new PeekTarget(makeTarget()).displayName()).toBe('%tile.chest.name');
        });

        it('falls back to the type id when there is no localization key', () => {
            const target = makeTarget({ localizationKey: void 0 });
            expect(new PeekTarget(target).displayName()).toBe('minecraft:chest');
        });
    });

    describe('matches', () => {
        it('matches an entity by id so a re-raycast keeps the same session', () => {
            const entity = makeTarget({ id: 'entity-1', typeId: 'minecraft:chest_minecart' });
            expect(new PeekTarget(entity).matches(makeTarget({ id: 'entity-1' }))).toBe(true);
            expect(new PeekTarget(entity).matches(makeTarget({ id: 'entity-2' }))).toBe(false);
        });

        it('matches a block by position, since each raycast returns a fresh block', () => {
            const target = new PeekTarget(makeTarget());
            expect(target.matches(makeTarget())).toBe(true);
            expect(target.matches(makeTarget({ location: { x: 9, y: 2, z: 3 } }))).toBe(false);
        });

        it('does not match a block of a different type at the same position', () => {
            const target = new PeekTarget(makeTarget());
            expect(target.matches(makeTarget({ typeId: 'minecraft:barrel' }))).toBe(false);
        });

        it('does not match a block in another dimension', () => {
            const target = new PeekTarget(makeTarget());
            expect(target.matches(makeTarget({ dimension: { id: 'minecraft:nether' } }))).toBe(false);
        });

        it('never matches an understudy look event', () => {
            expect(new PeekTarget(makeTarget()).matches({ name: 'Steve' })).toBe(false);
            expect(new PeekTarget(makeTarget()).matches(void 0)).toBe(false);
        });
    });

});
