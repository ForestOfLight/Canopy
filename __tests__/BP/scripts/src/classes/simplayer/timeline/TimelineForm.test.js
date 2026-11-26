import { vi, describe, it, expect, beforeEach } from 'vitest';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import { TimelineForm, TIMELINE_FORM_MARKER, TIMELINE_ROW_MARKER } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineForm';
import { AddTrackForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/AddTrackForm';
import { Timeline } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';

vi.mock('../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        getNotOnlineMessage: vi.fn(name => ({ translate: 'simplayer.notonline', with: [name] }))
    }
}));

vi.mock('../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/AddTrackForm', () => ({
    AddTrackForm: vi.fn(function MockAddTrackForm() { this.show = vi.fn(); })
}));

const STRIDE = 21;
const BASE_ROWS = 13;
const ATTACK = 0;
const JUMP = 9;

function rowIndex(row) {
    return row * STRIDE;
}

function cellIndex(row, column) {
    return row * STRIDE + 1 + column;
}

function trailing(rows) {
    const start = rows * STRIDE;
    return { loop: start, page: start + 1, add: start + 2, label: start + 3 };
}

const BASE = trailing(BASE_ROWS);

function defaultValues(form) {
    return form.elements.map(element => element.type === 'dropdown' ? element.options?.defaultValueIndex : element.options?.defaultValue);
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
        it('lays out a label and twenty cells per track, then four trailing controls', () => {
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements).toHaveLength(BASE_ROWS * STRIDE + 4);
            expect(form.elements[rowIndex(0)].type).toBe('label');
            expect(form.elements[rowIndex(0)].text.rawtext[0]).toEqual({ text: TIMELINE_ROW_MARKER });
            expect(form.elements.slice(1, STRIDE).every(element => element.type === 'toggle')).toBe(true);
            expect(form.elements[BASE.loop].type).toBe('slider');
            expect(form.elements[BASE.add].type).toBe('dropdown');
            expect(form.elements[BASE.label].type).toBe('label');
        });

        it('labels each row with its track label', () => {
            timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements[rowIndex(ATTACK)].text.rawtext[1]).toEqual({ translate: 'simplayer.action.attack' });
            expect(form.elements[rowIndex(JUMP)].text.rawtext[1]).toEqual(timeline.getTrack('jump').label());
        });

        it('keeps a placeholder label in place of the page slider on one page', () => {
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements[BASE.page]).toMatchObject({ type: 'label', text: { text: '' } });
        });

        it('offers a page slider over every page at the current page', () => {
            timeline.setLoopLength(100);
            const slider = new TimelineForm(player, understudy, 2).build().elements[BASE.page];
            expect(slider.type).toBe('slider');
            expect(slider.label).toEqual({ translate: 'simplayer.timeline.page' });
            expect(slider.minimumValue).toBe(1);
            expect(slider.maximumValue).toBe(5);
            expect(slider.options).toEqual({ valueStep: 1, defaultValue: 3 });
        });

        it('offers a loop length slider over the allowed range at the current length', () => {
            const slider = new TimelineForm(player, understudy).build().elements[BASE.loop];
            expect(slider.minimumValue).toBe(1);
            expect(slider.maximumValue).toBe(200);
            expect(slider.options).toEqual({ valueStep: 1, defaultValue: 20 });
        });

        it('offers the parameterised track types to add', () => {
            const dropdown = new TimelineForm(player, understudy).build().elements[BASE.add];
            expect(dropdown.label).toEqual({ translate: 'simplayer.timeline.addtrack' });
            expect(dropdown.items).toEqual(['none', 'select', 'look', 'move', 'moveto'].map(type => ({ translate: `simplayer.timeline.addtrack.${type}` })));
            expect(dropdown.options).toEqual({ defaultValueIndex: 0 });
        });

        it('labels the current page out of the page count', () => {
            timeline.setLoopLength(100);
            const form = new TimelineForm(player, understudy, 2).build();
            expect(form.elements.at(-1).text).toEqual({ translate: 'simplayer.timeline.page.current', with: ['3', '5'] });
        });

        it('adds a row for each extra track', () => {
            timeline.getOrCreate('select', { slot: 2 });
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements).toHaveLength(14 * STRIDE + 4);
            expect(form.elements[rowIndex(13)].text.rawtext[1]).toEqual({ translate: 'simplayer.timeline.track.select', with: ['3'] });
        });

        it('shows at most the row limit', () => {
            for (let slot = 0; slot < 9; slot++)
                timeline.getOrCreate('select', { slot });
            for (let i = 0; i < 30; i++)
                timeline.addOneShot('jump', void 0, { delay: 0 });
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements).toHaveLength(TimelineForm.MAX_ROWS * STRIDE + 4);
        });

        it('labels cells with their one-indexed tick and disables cells past the loop', () => {
            timeline.setLoopLength(30);
            const form = new TimelineForm(player, understudy, 1).build();
            expect(form.elements[cellIndex(ATTACK, 0)].label).toBe('21');
            expect(form.elements[cellIndex(ATTACK, 9)].label).toBe('30');
            expect(form.elements[cellIndex(ATTACK, 10)].label).toBe(TimelineForm.DISABLED_CELL_LABEL);
        });

        it('disables cells past a fixed-length row', () => {
            timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements[cellIndex(JUMP, 6)].label).toBe('7');
            expect(form.elements[cellIndex(JUMP, 7)].label).toBe('-');
            expect(form.elements[cellIndex(ATTACK, 7)].label).toBe('8');
        });

        it('defaults cells to their active state', () => {
            timeline.getTrack('attack').setActive(5, true, timeline.loopLength);
            const values = defaultValues(new TimelineForm(player, understudy).build());
            expect(values[cellIndex(ATTACK, 5)]).toBe(true);
            expect(values[cellIndex(ATTACK, 6)]).toBe(false);
        });

        it('starts the title with the timeline marker', () => {
            const form = new TimelineForm(player, understudy).build();
            expect(form.titleText.rawtext[0]).toEqual({ text: TIMELINE_FORM_MARKER });
            expect(form.titleText.rawtext[1]).toEqual({ translate: 'simplayer.timeline.title', with: ['Bot'] });
        });
    });

    describe('apply', () => {
        function submit(timelineForm, edit) {
            const values = defaultValues(timelineForm.build());
            edit(values);
            return timelineForm.apply(values);
        }

        it('applies painted cells and closes', () => {
            const result = submit(new TimelineForm(player, understudy), values => { values[cellIndex(JUMP, 3)] = true; });
            expect(timeline.getTrack('jump').isActive(3)).toBe(true);
            expect(result).toEqual({ nextPage: void 0, addTrackType: void 0 });
        });

        it('applies cells for the page being edited', () => {
            timeline.setLoopLength(80);
            submit(new TimelineForm(player, understudy, 1), values => { values[cellIndex(ATTACK, 2)] = true; });
            expect(timeline.getTrack('attack').isActive(22)).toBe(true);
            expect(timeline.getTrack('attack').isActive(2)).toBe(false);
        });

        it('ignores cells past the loop on the last page', () => {
            timeline.setLoopLength(30);
            submit(new TimelineForm(player, understudy, 1), values => { values[cellIndex(ATTACK, 15)] = true; });
            expect(timeline.isEmpty()).toBe(true);
        });

        it('keeps a full row full when saved unchanged', () => {
            timeline.setLooping('attack', void 0, { length: 20, ticks: Array.from({ length: 20 }, (_, tick) => tick) });
            submit(new TimelineForm(player, understudy), () => {});
            expect(timeline.getTrack('attack').activeOffsets()).toHaveLength(20);
        });

        it.each([0, 201, 12.5, -3, '40', undefined])('keeps the loop length for invalid input %j', (value) => {
            const result = submit(new TimelineForm(player, understudy), values => { values[BASE.loop] = value; });
            expect(timeline.loopLength).toBe(20);
            expect(result.nextPage).toBeUndefined();
        });

        it('changes the loop length and reopens on the same page', () => {
            const result = submit(new TimelineForm(player, understudy), values => { values[BASE.loop] = 100; });
            expect(timeline.loopLength).toBe(100);
            expect(result.nextPage).toBe(0);
        });

        it('reopens on the last remaining page when the loop shrinks below it', () => {
            timeline.setLoopLength(100);
            timeline.getTrack('attack').setActive(90, true, timeline.loopLength);
            const result = submit(new TimelineForm(player, understudy, 2), values => { values[BASE.loop] = 30; });
            expect(result.nextPage).toBe(1);
            expect(timeline.getTrack('attack').isActive(90)).toBe(false);
        });

        it('reopens on a newly selected page', () => {
            timeline.setLoopLength(80);
            const result = submit(new TimelineForm(player, understudy), values => { values[BASE.page] = 2; });
            expect(result.nextPage).toBe(1);
        });

        it.each([0, 5, 1.5, '2', undefined])('stays on the current page for invalid page %j', (value) => {
            timeline.setLoopLength(80);
            const result = submit(new TimelineForm(player, understudy, 1), values => { values[BASE.page] = value; });
            expect(result.nextPage).toBeUndefined();
        });

        it('applies a fixed-length row inside its length only', () => {
            const jump = timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            submit(new TimelineForm(player, understudy), values => {
                values[cellIndex(JUMP, 3)] = true;
                values[cellIndex(JUMP, 10)] = true;
            });
            expect(jump.activeOffsets()).toEqual([0, 3]);
        });

        it('applies rows by track even when a track was removed while the form was open', () => {
            timeline.getOrCreate('select', { slot: 2 }).setActive(0, true, 20);
            const timelineForm = new TimelineForm(player, understudy);
            const values = defaultValues(timelineForm.build());
            values[cellIndex(JUMP, 4)] = true;
            timeline.removeType('select');
            expect(() => timelineForm.apply(values)).not.toThrow();
            expect(timeline.getTrack('jump').isActive(4)).toBe(true);
            expect(timeline.getTrack('select:2')).toBeUndefined();
        });

        it('leaves a track added while the form was open untouched', () => {
            const timelineForm = new TimelineForm(player, understudy);
            const values = defaultValues(timelineForm.build());
            const move = timeline.setLooping('move', { direction: 'left' }, { length: 1, ticks: [0] });
            timelineForm.apply(values);
            expect(timeline.getTrack('move:left')).toBe(move);
            expect(move.activeOffsets()).toEqual([0]);
        });

        it('leaves an always-present track replaced by a command while the form was open untouched', () => {
            const timelineForm = new TimelineForm(player, understudy);
            const values = defaultValues(timelineForm.build());
            const interval = timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            timelineForm.apply(values);
            expect(timeline.getTrack('jump')).toBe(interval);
            expect(interval.activeOffsets()).toEqual([0]);
        });

        it('leaves an always-present track cleared by a command while the form was open untouched', () => {
            timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            const timelineForm = new TimelineForm(player, understudy);
            const values = defaultValues(timelineForm.build());
            timeline.clearTrack('jump');
            timelineForm.apply(values);
            expect(timeline.getTrack('jump').isEmpty()).toBe(true);
        });

        it('removes an extra track saved with no active cells', () => {
            timeline.getOrCreate('select', { slot: 2 }).setActive(0, true, 20);
            submit(new TimelineForm(player, understudy), values => { values[cellIndex(13, 0)] = false; });
            expect(timeline.getTrack('select:2')).toBeUndefined();
        });

        it('keeps an always-present track saved with no active cells', () => {
            timeline.getTrack('jump').setActive(0, true, timeline.loopLength);
            submit(new TimelineForm(player, understudy), values => { values[cellIndex(JUMP, 0)] = false; });
            expect(timeline.getTrack('jump')).toBeDefined();
        });

        it('keeps an extra track that has active cells on another page', () => {
            timeline.setLoopLength(40);
            timeline.getOrCreate('select', { slot: 2 }).setActive(30, true, 40);
            submit(new TimelineForm(player, understudy), () => {});
            expect(timeline.getTrack('select:2')).toBeDefined();
        });

        it('returns the chosen track type to add', () => {
            const result = submit(new TimelineForm(player, understudy), values => { values[BASE.add] = 2; });
            expect(result.addTrackType).toBe('look');
        });
    });

    describe('show', () => {
        async function showWith(timelineForm, edit) {
            const form = timelineForm.build();
            const values = defaultValues(form);
            edit(values);
            vi.spyOn(timelineForm, 'build').mockReturnValue(form);
            form.show.mockResolvedValue({ canceled: false, formValues: values });
            await timelineForm.show();
        }

        it('applies the response when submitted', async () => {
            await showWith(new TimelineForm(player, understudy), values => { values[cellIndex(JUMP, 7)] = true; });
            expect(timeline.getTrack('jump').isActive(7)).toBe(true);
        });

        it('leaves the timeline alone when canceled', async () => {
            await new TimelineForm(player, understudy).show();
            expect(timeline.isEmpty()).toBe(true);
        });

        it('reports a simplayer that left while the form was open', async () => {
            understudy.isConnected = () => false;
            await showWith(new TimelineForm(player, understudy), values => { values[cellIndex(JUMP, 7)] = true; });
            expect(timeline.isEmpty()).toBe(true);
            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['Bot'] });
        });

        it('reopens on the next tick when the page changes', async () => {
            timeline.setLoopLength(80);
            const showSpy = vi.spyOn(TimelineForm.prototype, 'show');
            await showWith(new TimelineForm(player, understudy), values => { values[trailing(BASE_ROWS).page] = 2; });
            showSpy.mockImplementation(async () => {});
            scheduler.advanceTicks(1);
            expect(showSpy).toHaveBeenCalledTimes(2);
            expect(showSpy.mock.contexts[1].page).toBe(1);
        });

        it('opens the add-track form for the chosen type on the current page', async () => {
            timeline.setLoopLength(80);
            await showWith(new TimelineForm(player, understudy, 1), values => { values[BASE.add] = 1; });
            scheduler.advanceTicks(1);
            expect(AddTrackForm).toHaveBeenCalledWith(player, understudy, 'select', 1);
            expect(vi.mocked(AddTrackForm).mock.instances[0].show).toHaveBeenCalled();
        });

        it('refuses to add a track once the row limit is reached', async () => {
            for (let i = 0; i < TimelineForm.MAX_ROWS - BASE_ROWS; i++)
                timeline.addOneShot('jump', void 0, { delay: 100 });
            const rows = TimelineForm.MAX_ROWS;
            const showSpy = vi.spyOn(TimelineForm.prototype, 'show');
            await showWith(new TimelineForm(player, understudy), values => { values[trailing(rows).add] = 1; });
            showSpy.mockImplementation(async () => {});
            scheduler.advanceTicks(1);
            expect(player.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.timeline.addtrack.full', with: [String(TimelineForm.MAX_ROWS)] });
            expect(AddTrackForm).not.toHaveBeenCalled();
            expect(showSpy).toHaveBeenCalledTimes(2);
        });
    });
});
