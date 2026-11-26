import { vi, describe, it, expect, beforeEach } from 'vitest';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import { TimelineForm, TIMELINE_FORM_MARKER, TIMELINE_ROW_MARKER, TIMELINE_CELL_MARKER, TIMELINE_PAGE_MARKER, TIMELINE_TRACK_PAGE_MARKER, TIMELINE_DISABLED_CELL_MARKER, TIMELINE_SETTINGS_MARKER, TIMELINE_HEADER_MARKER } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineForm';
import { TimelineSettingsForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineSettingsForm';
import { TimelineWelcomeForm } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineWelcomeForm';
import { Timeline } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/Timeline';

vi.mock('../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        getNotOnlineMessage: vi.fn(name => ({ translate: 'simplayer.notonline', with: [name] }))
    }
}));

vi.mock('../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineSettingsForm', () => ({
    TimelineSettingsForm: vi.fn(function MockTimelineSettingsForm() { this.show = vi.fn(); })
}));

vi.mock('../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/timeline/TimelineWelcomeForm', () => ({
    TimelineWelcomeForm: vi.fn(function MockTimelineWelcomeForm() { this.show = vi.fn(); })
}));

const SEEDED_TYPES = ['attack', 'interact', 'use', 'usehold', 'build', 'break', 'drop', 'dropstack', 'dropall', 'jump', 'sneak', 'sprint', 'glide'];

const STRIDE = 21;
const BASE_ROWS = 13;
const ATTACK = 0;
const JUMP = 9;

function rowIndex(row) {
    return (row + 1) * STRIDE;
}

function cellIndex(row, column) {
    return (row + 1) * STRIDE + 1 + column;
}

function trailing(rows) {
    const start = (rows + 1) * STRIDE;
    return { loop: start, page: start + 1, trackPage: start + 2, settings: start + 3, label: start + 4 };
}

const BASE = trailing(BASE_ROWS);

function addExtraTracks(timeline, count) {
    for (let i = 0; i < count; i++)
        timeline.getOrCreate('look', { target: { kind: 'rotation', rotation: { x: i, y: 0 } } }).setActive(0, true, timeline.loopLength);
}

function rowOf(timeline, key) {
    return timeline.tracks.findIndex(track => track.key === key);
}

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
        for (const type of SEEDED_TYPES)
            timeline.getOrCreate(type);
        understudy = { name: 'Bot', isConnected: () => true, actions: { timeline } };
        player = { sendMessage: vi.fn() };
    });

    describe('build', () => {
        it('lays out a label and twenty cells per track, then five trailing controls', () => {
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements).toHaveLength((BASE_ROWS + 1) * STRIDE + 5);
            expect(form.elements[rowIndex(0)].type).toBe('label');
            expect(form.elements[rowIndex(0)].text.rawtext[0]).toEqual({ text: TIMELINE_ROW_MARKER });
            expect(form.elements.slice(rowIndex(0) + 1, rowIndex(1)).every(element => element.type === 'toggle')).toBe(true);
            expect(form.elements[BASE.loop].type).toBe('slider');
            expect(form.elements[BASE.settings].type).toBe('toggle');
            expect(form.elements[BASE.label].type).toBe('label');
        });

        it('starts with a header row of labels numbering every fifth tick', () => {
            const header = new TimelineForm(player, understudy).build().elements.slice(0, STRIDE);
            expect(header.every(element => element.type === 'label')).toBe(true);
            expect(header.map(element => element.text)).toEqual([
                TIMELINE_HEADER_MARKER,
                ...Array.from({ length: 20 }, (_, column) => (column + 1) % 5 === 0 ? `${TIMELINE_HEADER_MARKER}${column + 1}` : TIMELINE_HEADER_MARKER)
            ]);
        });

        it('numbers the header for the tick page being shown', () => {
            timeline.setLoopLength(40);
            const header = new TimelineForm(player, understudy, 1).build().elements.slice(0, STRIDE);
            expect(header[5].text).toBe(`${TIMELINE_HEADER_MARKER}25`);
            expect(header[20].text).toBe(`${TIMELINE_HEADER_MARKER}40`);
        });

        it('leaves the header blank past the end of the longest loop', () => {
            timeline.setLoopLength(30);
            const header = new TimelineForm(player, understudy, 1).build().elements.slice(0, STRIDE);
            expect(header[10].text).toBe(`${TIMELINE_HEADER_MARKER}30`);
            expect(header[15].text).toBe(TIMELINE_HEADER_MARKER);
            expect(header[20].text).toBe(TIMELINE_HEADER_MARKER);
        });

        it('keeps the header numbers when the first track has a short loop', () => {
            timeline.setLooping('attack', void 0, { length: 3, ticks: [0] });
            timeline.tracks.forEach(track => track.type !== 'attack' && timeline.remove(track.key));
            const header = new TimelineForm(player, understudy).build().elements.slice(0, STRIDE);
            expect(header[20].text).toBe(`${TIMELINE_HEADER_MARKER}20`);
        });

        it('labels each row with its track label', () => {
            timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements[rowIndex(ATTACK)].text.rawtext.slice(1)).toEqual([{ translate: 'simplayer.action.attack' }]);
            expect(form.elements[rowIndex(rowOf(timeline, 'jump'))].text.rawtext.slice(1)).toEqual(timeline.getTrack('jump').labelParts());
        });

        it('marks only the cells, row labels and page controls with distinct markers', () => {
            const markers = [TIMELINE_ROW_MARKER, TIMELINE_CELL_MARKER, TIMELINE_PAGE_MARKER, TIMELINE_TRACK_PAGE_MARKER, TIMELINE_DISABLED_CELL_MARKER, TIMELINE_SETTINGS_MARKER, TIMELINE_HEADER_MARKER];
            expect(new Set(markers).size).toBe(7);
            for (const marker of markers)
                expect(markers.filter(other => other.includes(marker))).toEqual([marker]);
            for (const marker of markers)
                expect(marker.endsWith('§r')).toBe(true);
        });

        it('keeps placeholder labels in place of the page sliders on one page', () => {
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements[BASE.page]).toMatchObject({ type: 'label', text: { text: '' } });
            expect(form.elements[BASE.trackPage]).toMatchObject({ type: 'label', text: { text: '' } });
        });

        it('offers a track page slider when the tracks need more than one page', () => {
            addExtraTracks(timeline, 14);
            const slider = new TimelineForm(player, understudy, 0, 1).build().elements[BASE.trackPage];
            expect(slider.type).toBe('slider');
            expect(slider.label).toEqual({ rawtext: [{ text: TIMELINE_TRACK_PAGE_MARKER }, { translate: 'simplayer.timeline.trackpage' }] });
            expect(slider.minimumValue).toBe(1);
            expect(slider.maximumValue).toBe(3);
            expect(slider.options).toEqual({ valueStep: 1, defaultValue: 2 });
        });

        it('shows the first thirteen tracks on the first track page', () => {
            addExtraTracks(timeline, 2);
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements).toHaveLength((BASE_ROWS + 1) * STRIDE + 5);
            expect(form.elements[rowIndex(0)].text.rawtext[1]).toEqual({ translate: 'simplayer.action.attack' });
        });

        it('shows up to thirteen added tracks on each later track page', () => {
            addExtraTracks(timeline, 15);
            const second = new TimelineForm(player, understudy, 0, 1).build();
            expect(second.elements).toHaveLength((BASE_ROWS + 1) * STRIDE + 5);
            expect(second.elements[rowIndex(0)].text.rawtext[1]).toEqual({ translate: 'simplayer.timeline.track.look' });
            const third = new TimelineForm(player, understudy, 0, 2).build();
            expect(third.elements).toHaveLength(3 * STRIDE + 5);
        });

        it('opens the last track page when the requested one no longer exists', () => {
            addExtraTracks(timeline, 1);
            const form = new TimelineForm(player, understudy, 0, 5).build();
            expect(form.elements).toHaveLength(2 * STRIDE + 5);
        });

        it('offers a page slider over every page at the current page', () => {
            timeline.setLoopLength(100);
            const slider = new TimelineForm(player, understudy, 2).build().elements[BASE.page];
            expect(slider.type).toBe('slider');
            expect(slider.label).toEqual({ rawtext: [{ text: TIMELINE_PAGE_MARKER }, { translate: 'simplayer.timeline.page' }] });
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

        it('offers an unticked settings toggle', () => {
            const toggle = new TimelineForm(player, understudy).build().elements[BASE.settings];
            expect(toggle.label).toEqual({ rawtext: [{ text: TIMELINE_SETTINGS_MARKER }, { translate: 'simplayer.timeline.settings.open' }] });
            expect(toggle.options).toEqual({ defaultValue: false });
        });

        it('labels the current page out of the page count', () => {
            timeline.setLoopLength(100);
            const form = new TimelineForm(player, understudy, 2).build();
            expect(form.elements.at(-1).text).toEqual({ rawtext: [{ text: TIMELINE_PAGE_MARKER }, { translate: 'simplayer.timeline.page.current', with: ['3', '5'] }] });
        });

        it('adds the track page to the page label when there is more than one', () => {
            addExtraTracks(timeline, 1);
            const form = new TimelineForm(player, understudy, 0, 1).build();
            expect(form.elements.at(-1).text).toEqual({ rawtext: [
                { text: TIMELINE_PAGE_MARKER },
                { translate: 'simplayer.timeline.page.current', with: ['1', '1'] },
                { text: '   ' },
                { translate: 'simplayer.timeline.trackpage.current', with: ['2', '2'] }
            ] });
        });

        it('labels cells with their one-indexed tick and disables cells past the loop', () => {
            timeline.setLoopLength(30);
            const form = new TimelineForm(player, understudy, 1).build();
            expect(form.elements[cellIndex(ATTACK, 0)].label).toBe(`${TIMELINE_CELL_MARKER}21`);
            expect(form.elements[cellIndex(ATTACK, 9)].label).toBe(`${TIMELINE_CELL_MARKER}30`);
            expect(form.elements[cellIndex(ATTACK, 10)].label).toBe(`${TIMELINE_CELL_MARKER}${TIMELINE_DISABLED_CELL_MARKER}`);
        });

        it('disables cells past a fixed-length row', () => {
            timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            const jumpRow = rowOf(timeline, 'jump');
            const form = new TimelineForm(player, understudy).build();
            expect(form.elements[cellIndex(jumpRow, 6)].label).toBe(`${TIMELINE_CELL_MARKER}7`);
            expect(form.elements[cellIndex(jumpRow, 7)].label).toBe(`${TIMELINE_CELL_MARKER}${TIMELINE_DISABLED_CELL_MARKER}`);
            expect(form.elements[cellIndex(jumpRow, 19)].label).toBe(`${TIMELINE_CELL_MARKER}${TIMELINE_DISABLED_CELL_MARKER}`);
            expect(form.elements[cellIndex(ATTACK, 7)].label).toBe(`${TIMELINE_CELL_MARKER}8`);
        });

        it('defaults cells to their active state', () => {
            timeline.getTrack('attack').setActive(5, true, timeline.loopLength);
            const values = defaultValues(new TimelineForm(player, understudy).build());
            expect(values[cellIndex(ATTACK, 5)]).toBe(true);
            expect(values[cellIndex(ATTACK, 6)]).toBe(false);
        });

        it('starts the title with the timeline marker', () => {
            const form = new TimelineForm(player, understudy).build();
            expect(form.titleText.rawtext).toEqual([{ text: TIMELINE_FORM_MARKER }, { translate: 'simplayer.timeline.title', with: ['Bot'] }]);
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
            expect(result).toEqual({ nextPage: void 0, nextTrackPage: void 0, openSettings: false });
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

        it('reopens on a newly selected track page', () => {
            addExtraTracks(timeline, 1);
            const result = submit(new TimelineForm(player, understudy), values => { values[BASE.trackPage] = 2; });
            expect(result).toMatchObject({ nextPage: 0, nextTrackPage: 1 });
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
            const jumpRow = rowOf(timeline, 'jump');
            submit(new TimelineForm(player, understudy), values => {
                values[cellIndex(jumpRow, 3)] = true;
                values[cellIndex(jumpRow, 10)] = true;
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

        it('leaves a track replaced by a command while the form was open untouched', () => {
            const timelineForm = new TimelineForm(player, understudy);
            const values = defaultValues(timelineForm.build());
            const interval = timeline.setLooping('jump', void 0, { length: 7, ticks: [0] });
            timelineForm.apply(values);
            expect(timeline.getTrack('jump')).toBe(interval);
            expect(interval.activeOffsets()).toEqual([0]);
        });

        it('does not bring back a track cleared by a command while the form was open', () => {
            const timelineForm = new TimelineForm(player, understudy);
            const values = defaultValues(timelineForm.build());
            values[cellIndex(JUMP, 2)] = true;
            timeline.clearTrack('jump');
            timelineForm.apply(values);
            expect(timeline.getTrack('jump')).toBeUndefined();
        });

        it('keeps an added track saved with no active cells', () => {
            const select = timeline.getOrCreate('select', { slot: 2 });
            select.setActive(0, true, 20);
            const result = submit(new TimelineForm(player, understudy, 0, 1), values => { values[cellIndex(0, 0)] = false; });
            expect(timeline.getTrack('select:2')).toBe(select);
            expect(select.isEmpty()).toBe(true);
            expect(result.nextPage).toBeUndefined();
        });

        it('keeps an extra track that has active cells on another page', () => {
            timeline.setLoopLength(40);
            timeline.getOrCreate('select', { slot: 2 }).setActive(30, true, 40);
            submit(new TimelineForm(player, understudy, 0, 1), () => {});
            expect(timeline.getTrack('select:2')).toBeDefined();
        });

        it('asks to open the settings when the settings toggle is ticked', () => {
            const result = submit(new TimelineForm(player, understudy), values => { values[BASE.settings] = true; });
            expect(result.openSettings).toBe(true);
        });
    });

    describe('show', () => {
        it('opens the welcome page instead when the timeline has no tracks', async () => {
            timeline.reset();
            const timelineForm = new TimelineForm(player, understudy);
            const buildSpy = vi.spyOn(timelineForm, 'build');
            await timelineForm.show();
            expect(TimelineWelcomeForm).toHaveBeenCalledWith(player, understudy);
            expect(vi.mocked(TimelineWelcomeForm).mock.instances[0].show).toHaveBeenCalled();
            expect(buildSpy).not.toHaveBeenCalled();
        });

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

        it('reopens on the next tick on a newly selected track page', async () => {
            addExtraTracks(timeline, 1);
            const showSpy = vi.spyOn(TimelineForm.prototype, 'show');
            await showWith(new TimelineForm(player, understudy), values => { values[BASE.trackPage] = 2; });
            showSpy.mockImplementation(async () => {});
            scheduler.advanceTicks(1);
            expect(showSpy.mock.contexts[1].trackPage).toBe(1);
        });

        it('opens the settings page on the current pages when the settings toggle is ticked', async () => {
            timeline.setLoopLength(80);
            await showWith(new TimelineForm(player, understudy, 1), values => { values[BASE.settings] = true; });
            scheduler.advanceTicks(1);
            expect(TimelineSettingsForm).toHaveBeenCalledWith(player, understudy, 1, 0);
            expect(vi.mocked(TimelineSettingsForm).mock.instances[0].show).toHaveBeenCalled();
        });

        it('opens on the last tick page when the requested one no longer exists', () => {
            const form = new TimelineForm(player, understudy, 4).build();
            expect(form.elements[cellIndex(ATTACK, 0)].label).toBe(`${TIMELINE_CELL_MARKER}1`);
            expect(form.elements.at(-1).text.rawtext[1]).toEqual({ translate: 'simplayer.timeline.page.current', with: ['1', '1'] });
        });
    });
});
