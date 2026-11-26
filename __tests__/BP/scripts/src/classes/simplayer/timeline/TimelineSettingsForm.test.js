import { vi, describe, it, expect, beforeEach } from 'vitest';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import { CustomForm, ObservableBoolean, ObservableNumber, ObservableString } from '@minecraft/server-ui';
import { TimelineSettingsForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineSettingsForm';
import { TimelineForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineForm';
import { AddTrackForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/AddTrackForm';
import { Timeline } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';
import { Track } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Track';

vi.mock('../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        getNotOnlineMessage: vi.fn(name => ({ translate: 'simplayer.notonline', with: [name] }))
    }
}));

vi.mock('../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/AddTrackForm', () => ({
    AddTrackForm: vi.fn(function MockAddTrackForm() { this.show = vi.fn(); })
}));

const JUMP = 9;

describe('TimelineSettingsForm', () => {
    let timeline;
    let understudy;
    let player;
    let showSpy;

    function open(page = 0, trackPage = 0) {
        new TimelineSettingsForm(player, understudy, page, trackPage).show();
        return CustomForm.instances.at(-1);
    }

    function button(form, key) {
        return form.controls.find(control => control.type === 'button' && control.label.translate === key);
    }

    function dropdown(form, key) {
        return form.controls.find(control => control.type === 'dropdown' && control.label.translate === key);
    }

    function picker(form) {
        return dropdown(form, 'simplayer.timeline.settings.track');
    }

    function sharedToggle(form) {
        return form.getControl('toggle');
    }

    function ticksField(form) {
        return form.getControl('textField');
    }

    function errorLabel(form) {
        return form.controls.find(control => control.type === 'label' && control.options?.visible !== void 0);
    }

    function choose(form, track) {
        picker(form).observable.setData(timeline.tracks.filter(candidate => candidate.loops).indexOf(track));
    }

    function apply(form) {
        button(form, 'simplayer.timeline.settings.apply').onClick();
    }

    beforeEach(() => {
        vi.clearAllMocks();
        scheduler.reset();
        CustomForm.instances.length = 0;
        showSpy = vi.spyOn(TimelineForm.prototype, 'show').mockImplementation(async () => {});
        timeline = new Timeline();
        understudy = { name: 'Bot', isConnected: () => true, actions: { timeline } };
        player = { sendMessage: vi.fn() };
    });

    describe('layout', () => {
        it('shows a data-driven settings form for the player', () => {
            const form = open();
            expect(form.player).toBe(player);
            expect(form.title).toEqual({ translate: 'simplayer.timeline.settings.title', with: ['Bot'] });
            expect(form.show).toHaveBeenCalled();
            expect(form.closeButton).toHaveBeenCalled();
        });

        it('offers a dropdown of the kinds of track to add', () => {
            const addType = dropdown(open(), 'simplayer.timeline.settings.addtrack.type');
            expect(addType.observable).toBeInstanceOf(ObservableNumber);
            expect(addType.observable.options).toEqual({ clientWritable: true });
            expect(addType.items).toEqual(['select', 'look', 'move', 'moveto'].map((type, value) => ({ label: { translate: `simplayer.timeline.addtrack.${type}` }, value })));
        });

        it('offers a dropdown of the added tracks to remove', () => {
            timeline.getOrCreate('select', { slot: 2 });
            timeline.setLooping('move', { direction: 'left' }, { length: 1, ticks: [0] });
            const remove = dropdown(open(), 'simplayer.timeline.settings.remove.track');
            expect(remove.items).toEqual([
                { label: { rawtext: [{ translate: 'simplayer.timeline.track.select', with: ['3'] }] }, value: 0 },
                { label: { rawtext: [{ translate: 'simplayer.timeline.track.move.left' }] }, value: 1 }
            ]);
            expect(button(open(), 'simplayer.timeline.settings.remove')).toBeDefined();
        });

        it('says there is nothing to remove when no tracks were added', () => {
            const form = open();
            expect(dropdown(form, 'simplayer.timeline.settings.remove.track')).toBeUndefined();
            expect(button(form, 'simplayer.timeline.settings.remove')).toBeUndefined();
            expect(form.controls.some(control => control.type === 'label' && control.label.translate === 'simplayer.timeline.settings.remove.none')).toBe(true);
        });

        it('lists every looping track in the track picker', () => {
            timeline.getOrCreate('select', { slot: 2 });
            timeline.addOneShot('jump', void 0, { delay: 5 });
            const trackPicker = picker(open());
            expect(trackPicker.label).toEqual({ translate: 'simplayer.timeline.settings.track' });
            expect(trackPicker.observable).toBeInstanceOf(ObservableNumber);
            expect(trackPicker.observable.options).toEqual({ clientWritable: true });
            expect(trackPicker.items).toHaveLength(14);
            expect(trackPicker.items[0]).toEqual({ label: { rawtext: [{ translate: 'simplayer.action.attack' }] }, value: 0 });
            expect(trackPicker.items[13]).toEqual({ label: { rawtext: [{ translate: 'simplayer.timeline.track.select', with: ['3'] }] }, value: 13 });
        });

        it('starts on the first track using the shared loop with its ticks field hidden', () => {
            const form = open();
            expect(sharedToggle(form).label).toEqual({ translate: 'simplayer.timeline.settings.shared' });
            expect(sharedToggle(form).observable).toBeInstanceOf(ObservableBoolean);
            expect(sharedToggle(form).observable.getData()).toBe(true);
            expect(ticksField(form).label).toEqual({ translate: 'simplayer.timeline.settings.ticks' });
            expect(ticksField(form).observable).toBeInstanceOf(ObservableString);
            expect(ticksField(form).observable.getData()).toBe('20');
            expect(ticksField(form).options.visible.getData()).toBe(false);
        });

        it('shows the picked track own loop length', () => {
            const jump = timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            const form = open();
            choose(form, jump);
            expect(sharedToggle(form).observable.getData()).toBe(false);
            expect(ticksField(form).observable.getData()).toBe('7');
            expect(ticksField(form).options.visible.getData()).toBe(true);
        });

        it('shows the ticks field once the shared loop is turned off', () => {
            const form = open();
            sharedToggle(form).observable.setData(false);
            expect(ticksField(form).options.visible.getData()).toBe(true);
        });

        it('offers apply and back', () => {
            const form = open();
            expect(button(form, 'simplayer.timeline.settings.apply')).toBeDefined();
            expect(button(form, 'simplayer.timeline.settings.back')).toBeDefined();
            expect(errorLabel(form).options.visible.getData()).toBe(false);
        });
    });

    describe('adding a track', () => {
        it('closes and opens the add-track form for the chosen type on the same pages', () => {
            const form = open(2, 1);
            dropdown(form, 'simplayer.timeline.settings.addtrack.type').observable.setData(1);
            button(form, 'simplayer.timeline.settings.addtrack').onClick();
            scheduler.advanceTicks(1);
            expect(form.close).toHaveBeenCalled();
            expect(AddTrackForm).toHaveBeenCalledWith(player, understudy, 'look', 2, 1);
            expect(vi.mocked(AddTrackForm).mock.instances[0].show).toHaveBeenCalled();
        });
    });

    describe('removing a track', () => {
        it('removes the chosen added track and returns to the timeline', () => {
            timeline.getOrCreate('select', { slot: 2 });
            timeline.setLooping('move', { direction: 'left' }, { length: 1, ticks: [0] });
            const form = open(0, 1);
            dropdown(form, 'simplayer.timeline.settings.remove.track').observable.setData(1);
            button(form, 'simplayer.timeline.settings.remove').onClick();
            scheduler.advanceTicks(1);
            expect(timeline.getTrack('move:left')).toBeUndefined();
            expect(timeline.getTrack('select:2')).toBeDefined();
            expect(form.close).toHaveBeenCalled();
            expect(showSpy.mock.contexts[0].trackPage).toBe(1);
        });

        it('shows an error when the chosen track changed while the form was open', () => {
            timeline.getOrCreate('select', { slot: 2 });
            const form = open();
            timeline.clearTrack('select', { slot: 2 });
            button(form, 'simplayer.timeline.settings.remove').onClick();
            expect(errorLabel(form).label.getData()).toEqual({ translate: 'simplayer.timeline.settings.trackgone' });
            expect(form.close).not.toHaveBeenCalled();
        });

        it('reports a simplayer that left while the form was open', () => {
            timeline.getOrCreate('select', { slot: 2 });
            const form = open();
            understudy.isConnected = () => false;
            button(form, 'simplayer.timeline.settings.remove').onClick();
            expect(form.close).toHaveBeenCalled();
            expect(timeline.getTrack('select:2')).toBeDefined();
            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['Bot'] });
        });
    });

    describe('track loop length', () => {
        it('gives the picked track its own loop length and returns to the timeline', () => {
            const form = open(0, 0);
            choose(form, timeline.tracks[JUMP]);
            sharedToggle(form).observable.setData(false);
            ticksField(form).observable.setData('7');
            apply(form);
            scheduler.advanceTicks(1);
            expect(timeline.getTrack('jump').length).toBe(7);
            expect(form.close).toHaveBeenCalled();
            expect(showSpy).toHaveBeenCalledTimes(1);
        });

        it('returns the picked track to the shared loop', () => {
            const jump = timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            const form = open();
            choose(form, jump);
            sharedToggle(form).observable.setData(true);
            apply(form);
            expect(jump.length).toBe(Track.SHARED);
        });

        it.each(['', 'abc', '0', '-2', '2.5'])('shows an error for %j ticks and stays open', (ticks) => {
            const form = open();
            choose(form, timeline.tracks[JUMP]);
            sharedToggle(form).observable.setData(false);
            ticksField(form).observable.setData(ticks);
            apply(form);
            expect(errorLabel(form).label.getData()).toEqual({ translate: 'simplayer.timeline.settings.invalidticks' });
            expect(errorLabel(form).options.visible.getData()).toBe(true);
            expect(form.close).not.toHaveBeenCalled();
            expect(timeline.getTrack('jump').length).toBe(Track.SHARED);
        });

        it('shows an error when the picked track was replaced while the form was open', () => {
            const form = open();
            choose(form, timeline.tracks[JUMP]);
            timeline.setLooping('jump', void 0, { length: 3, ticks: [0] });
            sharedToggle(form).observable.setData(false);
            ticksField(form).observable.setData('7');
            apply(form);
            expect(errorLabel(form).label.getData()).toEqual({ translate: 'simplayer.timeline.settings.trackgone' });
            expect(timeline.getTrack('jump').length).toBe(3);
        });

        it('reports a simplayer that left while the form was open', () => {
            const form = open();
            understudy.isConnected = () => false;
            apply(form);
            expect(form.close).toHaveBeenCalled();
            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['Bot'] });
        });
    });

    describe('back', () => {
        it('closes and reopens the timeline where it came from', () => {
            const form = open(1, 2);
            button(form, 'simplayer.timeline.settings.back').onClick();
            scheduler.advanceTicks(1);
            expect(form.close).toHaveBeenCalled();
            expect(showSpy.mock.contexts[0].page).toBe(1);
            expect(showSpy.mock.contexts[0].trackPage).toBe(2);
        });
    });
});
