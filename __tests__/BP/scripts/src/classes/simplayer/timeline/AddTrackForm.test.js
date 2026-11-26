import { vi, describe, it, expect, beforeEach } from 'vitest';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import { CustomForm, ObservableNumber, ObservableString } from '@minecraft/server-ui';
import { AddTrackForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/AddTrackForm';
import { TimelineForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineForm';
import { TimelineSettingsForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineSettingsForm';
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
    let showSpy;

    function open(type, page = 0, trackPage = 0) {
        new AddTrackForm(player, understudy, type, page, trackPage).show();
        return CustomForm.instances.at(-1);
    }

    function fields(form) {
        return form.controls.filter(control => control.type === 'textField');
    }

    function button(form, key) {
        return form.controls.find(control => control.type === 'button' && control.label.translate === key);
    }

    function fill(form, choice, values = []) {
        form.getControl('dropdown').observable.setData(choice);
        values.forEach((value, index) => fields(form)[index].observable.setData(value));
    }

    function add(form) {
        button(form, 'simplayer.timeline.addtrack.submit').onClick();
    }

    function errorLabel(form) {
        return form.controls.find(control => control.type === 'label' && control.options?.visible !== void 0);
    }

    beforeEach(() => {
        vi.clearAllMocks();
        scheduler.reset();
        CustomForm.instances.length = 0;
        showSpy = vi.spyOn(TimelineForm.prototype, 'show').mockImplementation(async () => {});
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

    describe('layout', () => {
        it('shows a data-driven form for the player titled by the track type', () => {
            const form = open('select');
            expect(form.player).toBe(player);
            expect(form.title).toEqual({ translate: 'simplayer.timeline.addtrack.select' });
            expect(form.show).toHaveBeenCalled();
        });

        it('asks for a slot from 1 to 9 for select', () => {
            const dropdown = open('select').getControl('dropdown');
            expect(dropdown.label).toEqual({ translate: 'simplayer.timeline.addtrack.slot' });
            expect(dropdown.observable).toBeInstanceOf(ObservableNumber);
            expect(dropdown.observable.options).toEqual({ clientWritable: true });
            expect(dropdown.items).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((label, value) => ({ label, value })));
        });

        it('asks for a direction for move', () => {
            const dropdown = open('move').getControl('dropdown');
            expect(dropdown.items).toEqual(['forward', 'backward', 'left', 'right'].map((direction, value) => ({ label: { translate: `simplayer.timeline.track.move.${direction}` }, value })));
        });

        it('asks for a look target with writable coordinate fields', () => {
            const form = open('look');
            expect(form.getControl('dropdown').label).toEqual({ translate: 'simplayer.timeline.addtrack.target' });
            expect(form.getControl('dropdown').items).toEqual(LOOK_TARGETS.map((target, value) => ({ label: { translate: `simplayer.timeline.target.${target}` }, value })));
            expect(fields(form).map(field => field.label)).toEqual(['X', 'Y', 'Z']);
            for (const field of fields(form)) {
                expect(field.observable).toBeInstanceOf(ObservableString);
                expect(field.observable.options).toEqual({ clientWritable: true });
            }
        });

        it('asks for a moveto target', () => {
            expect(open('moveto').getControl('dropdown').items).toEqual(MOVETO_TARGETS.map((target, value) => ({ label: { translate: `simplayer.timeline.target.${target}` }, value })));
        });

        it('shows only the coordinate fields the chosen target needs', () => {
            const form = open('look');
            const visible = () => fields(form).map(field => field.options.visible.getData());
            expect(visible()).toEqual([false, false, false]);
            fill(form, LOOK_TARGETS.indexOf('rotation'));
            expect(visible()).toEqual([true, true, false]);
            fill(form, LOOK_TARGETS.indexOf('coordinates'));
            expect(visible()).toEqual([true, true, true]);
            fill(form, LOOK_TARGETS.indexOf('entity'));
            expect(visible()).toEqual([false, false, false]);
        });

        it('starts a moveto form with its coordinate fields showing', () => {
            const form = open('moveto');
            expect(fields(form).map(field => field.options.visible.getData())).toEqual([true, true, true]);
        });

        it('has no coordinate fields for select or move', () => {
            expect(fields(open('select'))).toEqual([]);
            expect(fields(open('move'))).toEqual([]);
        });

        it('offers add, back and close', () => {
            const form = open('select');
            expect(button(form, 'simplayer.timeline.addtrack.submit')).toBeDefined();
            expect(button(form, 'simplayer.timeline.addtrack.back')).toBeDefined();
            expect(form.closeButton).toHaveBeenCalled();
        });

        it('starts with its error label hidden', () => {
            expect(errorLabel(open('select')).options.visible.getData()).toBe(false);
        });
    });

    describe('adding', () => {
        it('creates a select track with no ticks active', () => {
            const form = open('select');
            fill(form, 3);
            add(form);
            const track = timeline.getTrack('select:3');
            expect(track.activeOffsets()).toEqual([]);
            expect(form.close).toHaveBeenCalled();
        });

        it('creates a move track', () => {
            const form = open('move');
            fill(form, 1);
            add(form);
            expect(timeline.getTrack('move:backward')).toBeDefined();
        });

        it('creates a cardinal look track', () => {
            const form = open('look');
            fill(form, LOOK_TARGETS.indexOf('north'));
            add(form);
            expect(timeline.getTrack('look:cardinal:north')).toBeDefined();
        });

        it('creates a rotation look track', () => {
            const form = open('look');
            fill(form, LOOK_TARGETS.indexOf('rotation'), ['10', '90']);
            add(form);
            expect(timeline.getTrack('look:rotation:10,90')).toBeDefined();
        });

        it('creates a coordinates moveto track', () => {
            const form = open('moveto');
            fill(form, MOVETO_TARGETS.indexOf('coordinates'), ['1', '64', '-2.5']);
            add(form);
            expect(timeline.getTrack('moveto:location:1,64,-2.5')).toBeDefined();
        });

        it('moves to the viewed block', () => {
            const block = { location: { x: 1, y: 64, z: 2 }, dimension: { id: 'minecraft:overworld' } };
            player.getBlockFromViewDirection.mockReturnValue({ block, face: 'North', faceLocation: { x: 0.5, y: 0.5, z: 0 } });
            const form = open('moveto');
            fill(form, MOVETO_TARGETS.indexOf('block'));
            add(form);
            expect(timeline.getTrack('moveto:block:minecraft:overworld:1,64,2').params).toEqual({ target: { kind: 'block', block } });
        });

        it('looks at the viewed block face', () => {
            const block = { location: { x: 1, y: 64, z: 2 }, dimension: { id: 'minecraft:overworld' } };
            player.getBlockFromViewDirection.mockReturnValue({ block, face: 'North', faceLocation: { x: 0.5, y: 0.5, z: 0 } });
            const form = open('look');
            fill(form, LOOK_TARGETS.indexOf('block'));
            add(form);
            expect(timeline.getTrack('look:location:1.5,64.5,2')).toBeDefined();
        });

        it('looks at the viewed entity', () => {
            player.getEntitiesFromViewDirection.mockReturnValue([{ entity: { id: '5', typeId: 'minecraft:cow', nameTag: '' } }]);
            const form = open('look');
            fill(form, LOOK_TARGETS.indexOf('entity'));
            add(form);
            expect(timeline.getTrack('look:entity:5')).toBeDefined();
        });

        it('looks at the player for me', () => {
            const form = open('look');
            fill(form, LOOK_TARGETS.indexOf('me'));
            add(form);
            expect(timeline.getTrack('look:entity:-7').params).toEqual({ target: { kind: 'entity', entity: player } });
        });

        it('keeps the offsets of an existing track with the same key', () => {
            const existing = timeline.getOrCreate('select', { slot: 3 });
            existing.setActive(5, true, 20);
            const form = open('select');
            fill(form, 3);
            add(form);
            expect(existing.activeOffsets()).toEqual([5]);
        });

        it('reopens the timeline on its page and the track page holding the new track', () => {
            const form = open('select', 2, 0);
            fill(form, 0);
            add(form);
            scheduler.advanceTicks(1);
            expect(showSpy).toHaveBeenCalledTimes(1);
            expect(showSpy.mock.contexts[0].page).toBe(2);
            expect(showSpy.mock.contexts[0].trackPage).toBe(1);
        });
    });

    describe('rejecting', () => {
        it.each([['abc', '90'], ['', '90']])('shows an error for a rotation of %j %j and stays open', (x, y) => {
            const form = open('look');
            fill(form, LOOK_TARGETS.indexOf('rotation'), [x, y]);
            add(form);
            expect(errorLabel(form).label.getData()).toEqual({ translate: 'simplayer.timeline.addtrack.invalidnumber' });
            expect(errorLabel(form).options.visible.getData()).toBe(true);
            expect(form.close).not.toHaveBeenCalled();
            expect(timeline.tracks).toHaveLength(13);
        });

        it('shows an error for missing coordinates', () => {
            const form = open('moveto');
            fill(form, MOVETO_TARGETS.indexOf('coordinates'), ['1', '64', '']);
            add(form);
            expect(errorLabel(form).label.getData()).toEqual({ translate: 'simplayer.timeline.addtrack.invalidnumber' });
        });

        it('shows an error when no block is viewed', () => {
            const form = open('moveto');
            fill(form, MOVETO_TARGETS.indexOf('block'));
            add(form);
            expect(errorLabel(form).label.getData()).toEqual({ translate: 'commands.playerlook.block.noblock' });
        });

        it('shows an error when no entity is viewed', () => {
            const form = open('look');
            fill(form, LOOK_TARGETS.indexOf('entity'));
            add(form);
            expect(errorLabel(form).label.getData()).toEqual({ translate: 'commands.playerlook.entity.noentity' });
        });

        it('reports a simplayer that left while the form was open', () => {
            const form = open('select');
            understudy.isConnected = () => false;
            add(form);
            expect(form.close).toHaveBeenCalled();
            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['Bot'] });
            expect(timeline.tracks).toHaveLength(13);
        });
    });

    describe('back', () => {
        it('closes and returns to the settings page for the same timeline pages', () => {
            const settingsSpy = vi.spyOn(TimelineSettingsForm.prototype, 'show').mockImplementation(() => {});
            const form = open('look', 1, 3);
            button(form, 'simplayer.timeline.addtrack.back').onClick();
            scheduler.advanceTicks(1);
            expect(form.close).toHaveBeenCalled();
            expect(settingsSpy).toHaveBeenCalledTimes(1);
            expect(showSpy).not.toHaveBeenCalled();
            expect(timeline.tracks).toHaveLength(13);
        });
    });
});
