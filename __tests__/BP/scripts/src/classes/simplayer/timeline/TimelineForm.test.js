import { vi, describe, it, expect, beforeEach } from 'vitest';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import { TimelineForm, TIMELINE_FORM_MARKER } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineForm';
import { Timeline } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';

vi.mock('../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        getNotOnlineMessage: vi.fn(name => ({ translate: 'simplayer.notonline', with: [name] }))
    }
}));

const ROW = 20;
const LOOP_INDEX = 260;
const PAGE_INDEX = 261;
const ATTACK = 0;
const JUMP = 9;

function defaultValues(form) {
    return form.elements.map(element => element.options?.defaultValue);
}

function cellIndex(row, column) {
    return row * ROW + column;
}

describe('TimelineForm', () => {
    let timeline;
    let understudy;
    let player;

    beforeEach(() => {
        vi.clearAllMocks();
        scheduler.reset();
        timeline = new Timeline();
        understudy = { name: 'Bot', isConnected: () => true, actions: { timeline } };
        player = { sendMessage: vi.fn() };
    });

    describe('build', () => {
        it('lays out 260 cell toggles, then the loop length slider, the page slider, and the page label', () => {
            timeline.setLoopLength(40);
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements).toHaveLength(263);
            expect(form.elements.slice(0, LOOP_INDEX).every(element => element.type === 'toggle')).toBe(true);
            expect(form.elements[LOOP_INDEX].type).toBe('slider');
            expect(form.elements[PAGE_INDEX].type).toBe('slider');
            expect(form.elements[262].type).toBe('label');
        });

        it('leaves out the page slider when the loop fits on one page', () => {
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements).toHaveLength(262);
            expect(form.elements[LOOP_INDEX].type).toBe('slider');
            expect(form.elements[PAGE_INDEX].type).toBe('label');
        });

        it('labels the current page out of the page count', () => {
            timeline.setLoopLength(100);
            const form = new TimelineForm(player, understudy, 2).build();
            expect(form.elements.at(-1).text).toEqual({ translate: 'simplayer.timeline.page.current', with: ['3', '5'] });
        });

        it('labels cells with their one-indexed tick and disables cells past the loop', () => {
            timeline.setLoopLength(30);
            const form = new TimelineForm(player, understudy, 1).build();
            expect(form.elements[cellIndex(ATTACK, 0)].label).toBe('21');
            expect(form.elements[cellIndex(ATTACK, 9)].label).toBe('30');
            expect(form.elements[cellIndex(ATTACK, 10)].label).toBe(TimelineForm.DISABLED_CELL_LABEL);
            expect(form.elements[cellIndex(JUMP, 19)].label).toBe('-');
        });

        it('defaults cells to their active state', () => {
            timeline.setActive('attack', 5, true);
            timeline.fillTrack('jump');
            const values = defaultValues(new TimelineForm(player, understudy).build());
            expect(values[cellIndex(ATTACK, 5)]).toBe(true);
            expect(values[cellIndex(ATTACK, 6)]).toBe(false);
            expect(values[cellIndex(JUMP, 0)]).toBe(true);
            expect(values[cellIndex(JUMP, 19)]).toBe(true);
        });

        it('starts the title with the timeline marker', () => {
            const form = new TimelineForm(player, understudy).build();
            expect(form.titleText.rawtext[0]).toEqual({ text: TIMELINE_FORM_MARKER });
            expect(form.titleText.rawtext[1]).toEqual({ translate: 'simplayer.timeline.title', with: ['Bot'] });
        });

        it('offers a page slider over every page at the current page', () => {
            timeline.setLoopLength(100);
            const slider = new TimelineForm(player, understudy, 2).build().elements[PAGE_INDEX];
            expect(slider.label).toEqual({ translate: 'simplayer.timeline.page' });
            expect(slider.minimumValue).toBe(1);
            expect(slider.maximumValue).toBe(5);
            expect(slider.options).toEqual({ valueStep: 1, defaultValue: 3 });
        });

        it('offers a loop length slider over the allowed range at the current length', () => {
            const slider = new TimelineForm(player, understudy).build().elements[LOOP_INDEX];
            expect(slider.minimumValue).toBe(1);
            expect(slider.maximumValue).toBe(200);
            expect(slider.options).toEqual({ valueStep: 1, defaultValue: 20 });
        });
    });

    describe('apply', () => {
        function submit(timelineForm, edit) {
            const values = defaultValues(timelineForm.build());
            edit(values);
            return timelineForm.apply(values);
        }

        it('applies painted cells and closes', () => {
            const result = submit(new TimelineForm(player, understudy), values => { values[cellIndex(ATTACK, 5)] = true; });
            expect(timeline.isActive('attack', 5)).toBe(true);
            expect(result).toBeUndefined();
        });

        it('applies cells for the page being edited', () => {
            timeline.setLoopLength(80);
            submit(new TimelineForm(player, understudy, 1), values => { values[cellIndex(ATTACK, 2)] = true; });
            expect(timeline.isActive('attack', 22)).toBe(true);
            expect(timeline.isActive('attack', 2)).toBe(false);
        });

        it('ignores cells past the loop on the last page', () => {
            timeline.setLoopLength(30);
            submit(new TimelineForm(player, understudy, 1), values => { values[cellIndex(ATTACK, 15)] = true; });
            expect(timeline.isEmpty()).toBe(true);
        });

        it('selects a whole row when every cell is painted', () => {
            submit(new TimelineForm(player, understudy), values => {
                for (let column = 0; column < ROW; column++)
                    values[cellIndex(ATTACK, column)] = true;
            });
            expect(timeline.isTrackFull('attack')).toBe(true);
        });

        it('adds empty ticks to a full row when the loop is lengthened', () => {
            timeline.fillTrack('usehold');
            submit(new TimelineForm(player, understudy), values => { values[LOOP_INDEX] = 40; });
            expect(timeline.isActive('usehold', 19)).toBe(true);
            expect(timeline.isActive('usehold', 20)).toBe(false);
        });

        it('keeps a full row full when saved unchanged', () => {
            timeline.fillTrack('attack');
            const result = submit(new TimelineForm(player, understudy), () => {});
            expect(timeline.isTrackFull('attack')).toBe(true);
            expect(result).toBeUndefined();
        });

        it.each([0, 201, 12.5, -3, '40', undefined])('keeps the loop length for invalid input %j', (value) => {
            const result = submit(new TimelineForm(player, understudy), values => { values[LOOP_INDEX] = value; });
            expect(timeline.loopLength).toBe(20);
            expect(result).toBeUndefined();
        });

        it('changes the loop length and reopens on the same page', () => {
            const result = submit(new TimelineForm(player, understudy), values => { values[LOOP_INDEX] = 100; });
            expect(timeline.loopLength).toBe(100);
            expect(result).toBe(0);
        });

        it('reopens on the last remaining page when the loop shrinks below it', () => {
            timeline.setLoopLength(100);
            timeline.setActive('attack', 90, true);
            const result = submit(new TimelineForm(player, understudy, 2), values => { values[LOOP_INDEX] = 30; });
            expect(result).toBe(1);
            expect(timeline.isActive('attack', 90)).toBe(false);
        });

        it('applies cells on a page that survives a shortened loop', () => {
            timeline.setLoopLength(100);
            const result = submit(new TimelineForm(player, understudy, 1), values => {
                values[cellIndex(JUMP, 1)] = true;
                values[LOOP_INDEX] = 60;
            });
            expect(timeline.isActive('jump', 21)).toBe(true);
            expect(result).toBe(1);
        });

        it('reopens on a newly selected page', () => {
            timeline.setLoopLength(80);
            const result = submit(new TimelineForm(player, understudy), values => { values[PAGE_INDEX] = 2; });
            expect(result).toBe(1);
        });

        it('clamps a selected page to the last page of a shortened loop', () => {
            timeline.setLoopLength(100);
            const result = submit(new TimelineForm(player, understudy), values => {
                values[PAGE_INDEX] = 4;
                values[LOOP_INDEX] = 30;
            });
            expect(result).toBe(1);
        });

        it.each([0, 5, 1.5, '2', undefined])('stays on the current page for invalid page %j', (value) => {
            timeline.setLoopLength(80);
            const result = submit(new TimelineForm(player, understudy, 1), values => { values[PAGE_INDEX] = value; });
            expect(result).toBeUndefined();
        });

        it('closes when a single-page timeline is saved', () => {
            const result = submit(new TimelineForm(player, understudy), values => { values[cellIndex(ATTACK, 3)] = true; });
            expect(timeline.isActive('attack', 3)).toBe(true);
            expect(result).toBeUndefined();
        });
    });

    describe('show', () => {
        it('applies the response when submitted', async () => {
            const timelineForm = new TimelineForm(player, understudy);
            const form = timelineForm.build();
            const values = defaultValues(form);
            values[cellIndex(JUMP, 7)] = true;
            vi.spyOn(timelineForm, 'build').mockReturnValue(form);
            form.show.mockResolvedValue({ canceled: false, formValues: values });
            await timelineForm.show();
            expect(timeline.isActive('jump', 7)).toBe(true);
        });

        it('leaves the timeline alone when canceled', async () => {
            const timelineForm = new TimelineForm(player, understudy);
            await timelineForm.show();
            expect(timeline.isEmpty()).toBe(true);
        });

        it('reports a simplayer that left while the form was open', async () => {
            const timelineForm = new TimelineForm(player, understudy);
            const form = timelineForm.build();
            const values = defaultValues(form);
            values[cellIndex(JUMP, 7)] = true;
            vi.spyOn(timelineForm, 'build').mockReturnValue(form);
            form.show.mockResolvedValue({ canceled: false, formValues: values });
            understudy.isConnected = () => false;
            await timelineForm.show();
            expect(timeline.isEmpty()).toBe(true);
            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['Bot'] });
        });

        it('reopens on the next tick when the page changes', async () => {
            timeline.setLoopLength(80);
            const timelineForm = new TimelineForm(player, understudy);
            const form = timelineForm.build();
            const values = defaultValues(form);
            values[PAGE_INDEX] = 2;
            vi.spyOn(timelineForm, 'build').mockReturnValue(form);
            form.show.mockResolvedValue({ canceled: false, formValues: values });
            const showSpy = vi.spyOn(TimelineForm.prototype, 'show');
            await timelineForm.show();
            showSpy.mockImplementation(async () => {});
            scheduler.advanceTicks(1);
            expect(showSpy).toHaveBeenCalledTimes(2);
            expect(showSpy.mock.contexts[1].page).toBe(1);
        });
    });
});
