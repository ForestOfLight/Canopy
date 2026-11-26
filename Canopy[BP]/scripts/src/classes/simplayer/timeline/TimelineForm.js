import { system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { Timeline } from "./Timeline";
import { ALWAYS_PRESENT_TYPES } from "./TrackTypes";
import { TimelineSettingsForm } from "./TimelineSettingsForm";
import { forceShow } from "../../../../include/utils";
import Understudies from "../Understudies";

export const TIMELINE_FORM_MARKER = '§t§i§m§e§l§i§n§e§r';
export const TIMELINE_ROW_MARKER = '§r§o§w§r';
export const TIMELINE_CELL_MARKER = '§c§e§l§r';
export const TIMELINE_PAGE_MARKER = '§p§a§g§r';
export const TIMELINE_TRACK_PAGE_MARKER = '§t§p§g§r';
export const TIMELINE_DISABLED_CELL_MARKER = '§d§i§s§r';
export const TIMELINE_SETTINGS_MARKER = '§s§e§t§r';

export class TimelineForm {
    static ROW_STRIDE = Timeline.PAGE_WIDTH + 1;
    static TRAILING_CONTROL_COUNT = 5;
    static ROWS_PER_PAGE = ALWAYS_PRESENT_TYPES.length;

    #player;
    #understudy;
    #page;
    #trackPage;
    #rows = [];

    constructor(player, understudy, page = 0, trackPage = 0) {
        this.#player = player;
        this.#understudy = understudy;
        this.#page = page;
        this.#trackPage = trackPage;
    }

    static trackPageCount(timeline) {
        return Math.max(1, Math.ceil(timeline.tracks.length / TimelineForm.ROWS_PER_PAGE));
    }

    static trackPageOf(timeline, track) {
        return Math.max(0, Math.floor(timeline.tracks.indexOf(track) / TimelineForm.ROWS_PER_PAGE));
    }

    get page() {
        return this.#page;
    }

    get trackPage() {
        return this.#trackPage;
    }

    get #timeline() {
        return this.#understudy.actions.timeline;
    }

    build() {
        const timeline = this.#timeline;
        const trackPageCount = TimelineForm.trackPageCount(timeline);
        this.#trackPage = Math.min(this.#trackPage, trackPageCount - 1);
        this.#page = Math.min(this.#page, timeline.pageCount - 1);
        const form = new ModalFormData().title({ rawtext: [
            { text: TIMELINE_FORM_MARKER },
            { translate: 'simplayer.timeline.title', with: [this.#understudy.name] }
        ] });
        const firstRow = this.#trackPage * TimelineForm.ROWS_PER_PAGE;
        this.#rows = timeline.tracks.slice(firstRow, firstRow + TimelineForm.ROWS_PER_PAGE);
        for (const track of this.#rows)
            this.#addRow(form, track, timeline.loopLength);
        form.slider({ translate: 'simplayer.timeline.looplength' }, Timeline.MIN_LOOP_LENGTH, Timeline.MAX_LOOP_LENGTH, { valueStep: 1, defaultValue: timeline.loopLength });
        this.#addPageSlider(form, TIMELINE_PAGE_MARKER, 'simplayer.timeline.page', this.#page, timeline.pageCount);
        this.#addPageSlider(form, TIMELINE_TRACK_PAGE_MARKER, 'simplayer.timeline.trackpage', this.#trackPage, trackPageCount);
        form.toggle({ rawtext: [{ text: TIMELINE_SETTINGS_MARKER }, { translate: 'simplayer.timeline.settings.open' }] }, { defaultValue: false });
        form.label({ rawtext: this.#pageLabel(timeline.pageCount, trackPageCount) });
        form.submitButton({ translate: 'simplayer.timeline.save' });
        return form;
    }

    apply(formValues) {
        const timeline = this.#timeline;
        const trailingStart = this.#rows.length * TimelineForm.ROW_STRIDE;
        const selectedPage = this.#selectedPage(formValues[trailingStart + 1], this.#page, timeline.pageCount);
        const selectedTrackPage = this.#selectedPage(formValues[trailingStart + 2], this.#trackPage, TimelineForm.trackPageCount(timeline));
        const lengthChanged = this.#applyLoopLength(timeline, formValues[trailingStart]);
        const rowsRemoved = this.#rows.filter((track, row) => this.#applyRow(timeline, track, row, formValues)).length > 0;
        const openSettings = formValues[trailingStart + 3] === true;
        if (!lengthChanged && !rowsRemoved && selectedPage === this.#page && selectedTrackPage === this.#trackPage)
            return { nextPage: void 0, nextTrackPage: void 0, openSettings };
        return {
            nextPage: Math.min(selectedPage, timeline.pageCount - 1),
            nextTrackPage: Math.min(selectedTrackPage, TimelineForm.trackPageCount(timeline) - 1),
            openSettings
        };
    }

    async show() {
        try {
            const response = await forceShow(this.#player, this.build());
            if (response.canceled)
                return;
            if (!this.#understudy.isConnected()) {
                this.#player.sendMessage(Understudies.getNotOnlineMessage(this.#understudy.name));
                return;
            }
            const { nextPage, nextTrackPage, openSettings } = this.apply(response.formValues);
            const page = nextPage ?? this.#page;
            const trackPage = nextTrackPage ?? this.#trackPage;
            if (openSettings)
                system.run(() => new TimelineSettingsForm(this.#player, this.#understudy, page, trackPage).show());
            else if (nextPage !== void 0)
                system.run(() => new TimelineForm(this.#player, this.#understudy, page, trackPage).show());
        } catch (error) {
            this.#player.sendMessage(`§cError: ${error.message}`);
        }
    }

    #addPageSlider(form, marker, labelKey, page, pageCount) {
        if (pageCount > 1)
            form.slider({ rawtext: [{ text: marker }, { translate: labelKey }] }, 1, pageCount, { valueStep: 1, defaultValue: page + 1 });
        else
            form.label({ text: '' });
    }

    #pageLabel(pageCount, trackPageCount) {
        const rawtext = [{ text: TIMELINE_PAGE_MARKER }, { translate: 'simplayer.timeline.page.current', with: [String(this.#page + 1), String(pageCount)] }];
        if (trackPageCount > 1)
            rawtext.push({ text: '   ' }, { translate: 'simplayer.timeline.trackpage.current', with: [String(this.#trackPage + 1), String(trackPageCount)] });
        return rawtext;
    }

    #addRow(form, track, loopLength) {
        form.label({ rawtext: [{ text: TIMELINE_ROW_MARKER }, ...track.labelParts()] });
        const length = track.effectiveLength(loopLength);
        for (let column = 0; column < Timeline.PAGE_WIDTH; column++) {
            const offset = this.#offsetAt(column);
            if (offset < length)
                form.toggle(`${TIMELINE_CELL_MARKER}${offset + 1}`, { defaultValue: track.isActive(offset) });
            else
                form.toggle(`${TIMELINE_CELL_MARKER}${TIMELINE_DISABLED_CELL_MARKER}`, { defaultValue: false });
        }
    }

    #applyRow(timeline, track, row, formValues) {
        if (timeline.getTrack(track.key) !== track)
            return false;
        const cellStart = row * TimelineForm.ROW_STRIDE + 1;
        for (let column = 0; column < Timeline.PAGE_WIDTH; column++)
            track.setActive(this.#offsetAt(column), formValues[cellStart + column] === true, timeline.loopLength);
        if (track.isAlwaysPresent() || !track.isEmpty())
            return false;
        timeline.remove(track.key);
        return true;
    }

    #applyLoopLength(timeline, loopLength) {
        if (loopLength === timeline.loopLength)
            return false;
        return timeline.setLoopLength(loopLength);
    }

    #offsetAt(column) {
        return this.#page * Timeline.PAGE_WIDTH + column;
    }

    #selectedPage(pageNumber, currentPage, pageCount) {
        if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pageCount)
            return currentPage;
        return pageNumber - 1;
    }
}
