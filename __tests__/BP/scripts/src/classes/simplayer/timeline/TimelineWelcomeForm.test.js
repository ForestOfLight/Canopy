import { vi, describe, it, expect, beforeEach } from 'vitest';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import { CustomForm, ObservableNumber } from '@minecraft/server-ui';
import { TimelineWelcomeForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineWelcomeForm';
import { TimelineForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineForm';
import { AddTrackForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/AddTrackForm';
import { Timeline } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';
import { TRACK_TYPE_ORDER } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TrackTypes';

vi.mock('../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        getNotOnlineMessage: vi.fn(name => ({ translate: 'simplayer.notonline', with: [name] }))
    }
}));

vi.mock('../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/AddTrackForm', () => ({
    AddTrackForm: vi.fn(function MockAddTrackForm() { this.show = vi.fn(); })
}));

describe('TimelineWelcomeForm', () => {
    let timeline;
    let understudy;
    let player;
    let showSpy;

    function open() {
        new TimelineWelcomeForm(player, understudy).show();
        return CustomForm.instances.at(-1);
    }

    function start(form, type, loopLength) {
        form.getControl('dropdown').observable.setData(TRACK_TYPE_ORDER.indexOf(type));
        if (loopLength !== void 0)
            form.getControl('slider').observable.setData(loopLength);
        form.controls.find(control => control.type === 'button' && control.label.translate === 'simplayer.timeline.welcome.start').onClick();
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
        it('shows a data-driven welcome form for the player', () => {
            const form = open();
            expect(form.player).toBe(player);
            expect(form.title).toEqual({ translate: 'simplayer.timeline.welcome.title', with: ['Bot'] });
            expect(form.controls.some(control => control.type === 'label' && control.label.translate === 'simplayer.timeline.welcome.description')).toBe(true);
            expect(form.show).toHaveBeenCalled();
            expect(form.closeButton).toHaveBeenCalled();
        });

        it('offers every track type for the first track', () => {
            const dropdown = open().getControl('dropdown');
            expect(dropdown.label).toEqual({ translate: 'simplayer.timeline.welcome.track' });
            expect(dropdown.observable).toBeInstanceOf(ObservableNumber);
            expect(dropdown.observable.options).toEqual({ clientWritable: true });
            expect(dropdown.items).toHaveLength(TRACK_TYPE_ORDER.length);
            expect(dropdown.items[0]).toEqual({ label: { translate: 'simplayer.action.attack' }, value: 0 });
        });

        it('offers the timeline loop length on a slider starting at the current length', () => {
            const slider = open().getControl('slider');
            expect(slider.label).toEqual({ translate: 'simplayer.timeline.looplength' });
            expect(slider.observable).toBeInstanceOf(ObservableNumber);
            expect(slider.observable.options).toEqual({ clientWritable: true });
            expect(slider.observable.getData()).toBe(20);
            expect(slider.min).toBe(1);
            expect(slider.max).toBe(800);
            expect(slider.options).toEqual({ step: 1 });
        });
    });

    describe('starting', () => {
        it('adds a first track without parameters, sets the loop length and opens the timeline', () => {
            const form = open();
            start(form, 'jump', 40);
            scheduler.advanceTicks(1);
            expect(timeline.loopLength).toBe(40);
            expect(timeline.tracks.map(track => track.key)).toEqual(['jump']);
            expect(timeline.getTrack('jump').isEmpty()).toBe(true);
            expect(form.close).toHaveBeenCalled();
            expect(showSpy).toHaveBeenCalledTimes(1);
            expect(showSpy.mock.contexts[0].page).toBe(0);
            expect(showSpy.mock.contexts[0].trackPage).toBe(0);
        });

        it('sets the loop length and opens the add-track form for a first track with parameters', () => {
            const form = open();
            start(form, 'look', 60);
            scheduler.advanceTicks(1);
            expect(timeline.loopLength).toBe(60);
            expect(timeline.tracks).toEqual([]);
            expect(AddTrackForm).toHaveBeenCalledWith(player, understudy, 'look', 0, 0);
            expect(vi.mocked(AddTrackForm).mock.instances[0].show).toHaveBeenCalled();
            expect(showSpy).not.toHaveBeenCalled();
        });

        it('keeps the loop length when the slider gives an invalid value', () => {
            const form = open();
            start(form, 'jump', 2.5);
            expect(timeline.loopLength).toBe(20);
            expect(timeline.getTrack('jump')).toBeDefined();
        });

        it('reports a simplayer that left while the form was open', () => {
            const form = open();
            understudy.isConnected = () => false;
            start(form, 'jump', 40);
            expect(form.close).toHaveBeenCalled();
            expect(timeline.tracks).toEqual([]);
            expect(timeline.loopLength).toBe(20);
            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['Bot'] });
        });
    });
});
