import { vi, describe, it, expect, beforeEach } from 'vitest';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import { AddTrackForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/AddTrackForm';
import { TimelineForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineForm';
import { Timeline } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';

vi.mock('../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        getNotOnlineMessage: vi.fn(name => ({ translate: 'simplayer.notonline', with: [name] }))
    }
}));

const LOOK_TARGETS = ['up', 'down', 'north', 'south', 'east', 'west', 'rotation', 'coordinates', 'block', 'entity', 'me'];
const MOVETO_TARGETS = ['coordinates', 'block', 'entity', 'me'];

describe('AddTrackForm', () => {
    let timeline;
    let understudy;
    let player;

    function apply(type, formValues) {
        return new AddTrackForm(player, understudy, type, 0).apply(formValues);
    }

    beforeEach(() => {
        vi.clearAllMocks();
        scheduler.reset();
        timeline = new Timeline();
        understudy = { name: 'Bot', isConnected: () => true, actions: { timeline } };
        player = {
            id: '-7',
            nameTag: 'Alex',
            typeId: 'minecraft:player',
            sendMessage: vi.fn(),
            getBlockFromViewDirection: vi.fn(() => void 0),
            getEntitiesFromViewDirection: vi.fn(() => [])
        };
    });

    describe('build', () => {
        it('asks for a slot from 1 to 9 for select', () => {
            const form = new AddTrackForm(player, understudy, 'select', 0).build();
            expect(form.elements).toHaveLength(1);
            expect(form.elements[0].label).toEqual({ translate: 'simplayer.timeline.addtrack.slot' });
            expect(form.elements[0].items).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
        });

        it('asks for a direction for move', () => {
            const form = new AddTrackForm(player, understudy, 'move', 0).build();
            expect(form.elements[0].items).toEqual(['forward', 'backward', 'left', 'right'].map(direction => ({ translate: `simplayer.timeline.track.move.${direction}` })));
        });

        it('asks for a look target and coordinates', () => {
            const form = new AddTrackForm(player, understudy, 'look', 0).build();
            expect(form.elements[0].label).toEqual({ translate: 'simplayer.timeline.addtrack.target' });
            expect(form.elements[0].items).toEqual(LOOK_TARGETS.map(target => ({ translate: `simplayer.timeline.target.${target}` })));
            expect(form.elements.slice(1).map(element => element.type)).toEqual(['textField', 'textField', 'textField']);
        });

        it('asks for a moveto target and coordinates', () => {
            const form = new AddTrackForm(player, understudy, 'moveto', 0).build();
            expect(form.elements[0].items).toEqual(MOVETO_TARGETS.map(target => ({ translate: `simplayer.timeline.target.${target}` })));
            expect(form.elements).toHaveLength(4);
        });
    });

    describe('apply', () => {
        it('creates a select track with its first tick active', () => {
            const track = apply('select', [3]);
            expect(track.key).toBe('select:3');
            expect(track.activeOffsets()).toEqual([0]);
            expect(timeline.getTrack('select:3')).toBe(track);
        });

        it('creates a move track', () => {
            expect(apply('move', [1]).key).toBe('move:backward');
        });

        it('creates a cardinal look track', () => {
            expect(apply('look', [LOOK_TARGETS.indexOf('north'), '', '', '']).key).toBe('look:cardinal:north');
        });

        it('creates a rotation look track', () => {
            expect(apply('look', [LOOK_TARGETS.indexOf('rotation'), '10', '90', '']).key).toBe('look:rotation:10,90');
        });

        it('creates a coordinates moveto track', () => {
            expect(apply('moveto', [MOVETO_TARGETS.indexOf('coordinates'), '1', '64', '-2.5']).key).toBe('moveto:location:1,64,-2.5');
        });

        it.each([['abc', '90'], ['', '90']])('rejects a rotation of %j %j', (x, y) => {
            expect(apply('look', [LOOK_TARGETS.indexOf('rotation'), x, y, ''])).toBeUndefined();
            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.timeline.addtrack.invalidnumber' });
            expect(timeline.tracks).toHaveLength(13);
        });

        it('rejects missing coordinates', () => {
            expect(apply('moveto', [MOVETO_TARGETS.indexOf('coordinates'), '1', '64', ''])).toBeUndefined();
            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.timeline.addtrack.invalidnumber' });
        });

        it('reports when no block is viewed', () => {
            expect(apply('moveto', [MOVETO_TARGETS.indexOf('block'), '', '', ''])).toBeUndefined();
            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'commands.playerlook.block.noblock' });
        });

        it('reports when no entity is viewed', () => {
            expect(apply('look', [LOOK_TARGETS.indexOf('entity'), '', '', ''])).toBeUndefined();
            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'commands.playerlook.entity.noentity' });
        });

        it('moves to the viewed block', () => {
            const block = { location: { x: 1, y: 64, z: 2 }, dimension: { id: 'minecraft:overworld' } };
            player.getBlockFromViewDirection.mockReturnValue({ block, face: 'North', faceLocation: { x: 0.5, y: 0.5, z: 0 } });
            expect(apply('moveto', [MOVETO_TARGETS.indexOf('block'), '', '', '']).params).toEqual({ target: { kind: 'block', block } });
        });

        it('looks at the viewed block face', () => {
            const block = { location: { x: 1, y: 64, z: 2 }, dimension: { id: 'minecraft:overworld' } };
            player.getBlockFromViewDirection.mockReturnValue({ block, face: 'North', faceLocation: { x: 0.5, y: 0.5, z: 0 } });
            expect(apply('look', [LOOK_TARGETS.indexOf('block'), '', '', '']).key).toBe('look:location:1.5,64.5,2');
        });

        it('looks at the viewed entity', () => {
            const cow = { id: '5', typeId: 'minecraft:cow', nameTag: '' };
            player.getEntitiesFromViewDirection.mockReturnValue([{ entity: cow }]);
            expect(apply('look', [LOOK_TARGETS.indexOf('entity'), '', '', '']).key).toBe('look:entity:5');
        });

        it('looks at the player for me', () => {
            const track = apply('look', [LOOK_TARGETS.indexOf('me'), '', '', '']);
            expect(track.params).toEqual({ target: { kind: 'entity', entity: player } });
        });

        it('keeps the offsets of an existing track with the same key', () => {
            const existing = timeline.getOrCreate('select', { slot: 3 });
            existing.setActive(5, true, 20);
            expect(apply('select', [3])).toBe(existing);
            expect(existing.activeOffsets()).toEqual([5]);
        });
    });

    describe('show', () => {
        async function showWith(addTrackForm, response) {
            const form = addTrackForm.build();
            vi.spyOn(addTrackForm, 'build').mockReturnValue(form);
            form.show.mockResolvedValue(response);
            await addTrackForm.show();
        }

        it('reopens the timeline on its page and the track page holding the new track', async () => {
            const showSpy = vi.spyOn(TimelineForm.prototype, 'show').mockImplementation(async () => {});
            await showWith(new AddTrackForm(player, understudy, 'select', 2, 0), { canceled: false, formValues: [0] });
            scheduler.advanceTicks(1);
            expect(timeline.getTrack('select:0')).toBeDefined();
            expect(showSpy).toHaveBeenCalledTimes(1);
            expect(showSpy.mock.contexts[0].page).toBe(2);
            expect(showSpy.mock.contexts[0].trackPage).toBe(1);
        });

        it('reopens the timeline on the track page it came from when nothing was added', async () => {
            const showSpy = vi.spyOn(TimelineForm.prototype, 'show').mockImplementation(async () => {});
            await showWith(new AddTrackForm(player, understudy, 'look', 0, 3), { canceled: false, formValues: [6, 'abc', '1', ''] });
            scheduler.advanceTicks(1);
            expect(showSpy.mock.contexts[0].trackPage).toBe(3);
        });

        it('does not reopen the timeline when canceled', async () => {
            const showSpy = vi.spyOn(TimelineForm.prototype, 'show').mockImplementation(async () => {});
            await new AddTrackForm(player, understudy, 'select', 0).show();
            scheduler.advanceTicks(1);
            expect(showSpy).not.toHaveBeenCalled();
        });

        it('reports a simplayer that left while the form was open', async () => {
            understudy.isConnected = () => false;
            await showWith(new AddTrackForm(player, understudy, 'select', 0), { canceled: false, formValues: [0] });
            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['Bot'] });
            expect(timeline.getTrack('select:0')).toBeUndefined();
        });
    });
});
