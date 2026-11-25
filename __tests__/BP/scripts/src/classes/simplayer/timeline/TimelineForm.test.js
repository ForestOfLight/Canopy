import { vi, describe, it, expect, beforeEach } from 'vitest';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import { TimelineForm, TIMELINE_FORM_MARKER } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineForm';
import { Timeline } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';

vi.mock('../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        getNotOnlineMessage: vi.fn(name => ({ translate: 'simplayer.notonline', with: [name] }))
    }
}));

const ROW = 21;
const LOOP_INDEX = 210;
const PAGE_INDEX = 211;
const ATTACK = 0;
const USEHOLD = 3;
const JUMP = 9;

function defaultValues(form) {
    return form.elements.map(element => {
        if (element.type === 'dropdown')
            return element.options.defaultValueIndex;
        return element.options.defaultValue;
    });
}

function cellIndex(row, column) {
    return row * ROW + 1 + column;
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
        it('lays out 210 toggles, then the loop length field, then the page dropdown', () => {
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements).toHaveLength(212);
            expect(form.elements.slice(0, LOOP_INDEX).every(element => element.type === 'toggle')).toBe(true);
            expect(form.elements[LOOP_INDEX].type).toBe('textField');
            expect(form.elements[PAGE_INDEX].type).toBe('dropdown');
        });

        it('labels each row toggle with its track', () => {
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements[ATTACK * ROW].label).toEqual({ translate: 'simplayer.action.attack' });
            expect(form.elements[USEHOLD * ROW].label).toEqual({ translate: 'simplayer.timeline.track.usehold' });
        });

        it('labels cells with their tick and disables cells past the loop', () => {
            timeline.setLoopLength(30);
            const form = new TimelineForm(player, understudy, 1).build();
            expect(form.elements[cellIndex(ATTACK, 0)].label).toBe('20');
            expect(form.elements[cellIndex(ATTACK, 9)].label).toBe('29');
            expect(form.elements[cellIndex(ATTACK, 10)].label).toBe(TimelineForm.DISABLED_CELL_LABEL);
            expect(form.elements[cellIndex(JUMP, 19)].label).toBe('-');
        });

        it('defaults cells to their active state and row toggles to fullness', () => {
            timeline.setActive('attack', 5, true);
            timeline.fillTrack('jump');
            const values = defaultValues(new TimelineForm(player, understudy).build());
            expect(values[cellIndex(ATTACK, 5)]).toBe(true);
            expect(values[cellIndex(ATTACK, 6)]).toBe(false);
            expect(values[ATTACK * ROW]).toBe(false);
            expect(values[JUMP * ROW]).toBe(true);
        });

        it('starts the title with the timeline marker', () => {
            const form = new TimelineForm(player, understudy).build();
            expect(form.titleText.rawtext[0]).toEqual({ text: TIMELINE_FORM_MARKER });
            expect(form.titleText.rawtext[1]).toEqual({ translate: 'simplayer.timeline.title', with: ['Bot'] });
        });

        it('offers one dropdown item per page and selects the current page', () => {
            timeline.setLoopLength(100);
            const form = new TimelineForm(player, understudy, 2).build();
            const dropdown = form.elements[PAGE_INDEX];
            expect(dropdown.items).toHaveLength(5);
            expect(dropdown.items[2]).toEqual({ translate: 'simplayer.timeline.page.option', with: ['3', '5'] });
            expect(dropdown.options.defaultValueIndex).toBe(2);
        });

        it('defaults the loop length field to the current length', () => {
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements[LOOP_INDEX].options.defaultValue).toBe('40');
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

        it('fills a row whose toggle is on, even with a cell turned off', () => {
            submit(new TimelineForm(player, understudy), values => {
                values[ATTACK * ROW] = true;
                values[cellIndex(ATTACK, 3)] = false;
            });
            expect(timeline.isTrackFull('attack')).toBe(true);
        });

        it('clears a row that was full when opened and is now toggled off', () => {
            timeline.fillTrack('attack');
            submit(new TimelineForm(player, understudy), values => { values[ATTACK * ROW] = false; });
            expect(timeline.isEmpty()).toBe(true);
        });

        it('keeps a full row full when its toggle stays on', () => {
            timeline.fillTrack('attack');
            submit(new TimelineForm(player, understudy), () => {});
            expect(timeline.isTrackFull('attack')).toBe(true);
        });

        it.each(['', 'abc', '0', '1201', '12.5', '-3'])('keeps the loop length for invalid input %j', (text) => {
            const result = submit(new TimelineForm(player, understudy), values => { values[LOOP_INDEX] = text; });
            expect(timeline.loopLength).toBe(40);
            expect(result).toBeUndefined();
        });

        it('changes the loop length and reopens on the same page', () => {
            const result = submit(new TimelineForm(player, understudy), values => { values[LOOP_INDEX] = '100'; });
            expect(timeline.loopLength).toBe(100);
            expect(result).toBe(0);
        });

        it('reopens on the last remaining page when the loop shrinks below it', () => {
            timeline.setLoopLength(100);
            timeline.setActive('attack', 90, true);
            const result = submit(new TimelineForm(player, understudy, 2), values => { values[LOOP_INDEX] = '30'; });
            expect(result).toBe(1);
            expect(timeline.isActive('attack', 90)).toBe(false);
        });

        it('applies cells before shortening the loop', () => {
            timeline.setLoopLength(100);
            const result = submit(new TimelineForm(player, understudy, 1), values => {
                values[cellIndex(JUMP, 1)] = true;
                values[LOOP_INDEX] = '60';
            });
            expect(timeline.isActive('jump', 21)).toBe(true);
            expect(result).toBe(1);
        });

        it('reopens on a newly selected page', () => {
            timeline.setLoopLength(80);
            const result = submit(new TimelineForm(player, understudy), values => { values[PAGE_INDEX] = 1; });
            expect(result).toBe(1);
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
            values[PAGE_INDEX] = 1;
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
