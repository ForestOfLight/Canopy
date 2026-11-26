import { system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { Timeline } from "./Timeline";
import { PARAMETERISED_TYPES } from "./TrackTypes";
import { AddTrackForm } from "./AddTrackForm";
import { forceShow } from "../../../../include/utils";
import Understudies from "../Understudies";

export const TIMELINE_FORM_MARKER = '§t§i§m§e§l§i§n§e§r';
export const TIMELINE_ROW_MARKER = '§r§o§w';

export class TimelineForm {
    static DISABLED_CELL_LABEL = '-';
    static ROW_STRIDE = Timeline.PAGE_WIDTH + 1;
    static TRAILING_CONTROL_COUNT = 4;
    static MAX_ROWS = 40;

    #player;
    #understudy;
    #page;
    #rowKeys = [];

    constructor(player, understudy, page = 0) {
        this.#player = player;
        this.#understudy = understudy;
        this.#page = page;
    }

    get page() {
        return this.#page;
    }

    get #timeline() {
        return this.#understudy.actions.timeline;
    }

    build() {
        const timeline = this.#timeline;
        const form = new ModalFormData().title({ rawtext: [
            { text: TIMELINE_FORM_MARKER },
            { translate: 'simplayer.timeline.title', with: [this.#understudy.name] }
        ] });
        const tracks = timeline.tracks.slice(0, TimelineForm.MAX_ROWS);
        this.#rowKeys = tracks.map(track => track.key);
        for (const track of tracks)
            this.#addRow(form, track, timeline.loopLength);
        form.slider({ translate: 'simplayer.timeline.looplength' }, Timeline.MIN_LOOP_LENGTH, Timeline.MAX_LOOP_LENGTH, { valueStep: 1, defaultValue: timeline.loopLength });
        if (timeline.pageCount > 1)
            form.slider({ translate: 'simplayer.timeline.page' }, 1, timeline.pageCount, { valueStep: 1, defaultValue: this.#page + 1 });
        else
            form.label({ text: '' });
        form.dropdown({ translate: 'simplayer.timeline.addtrack' }, ['none', ...PARAMETERISED_TYPES].map(type => ({ translate: `simplayer.timeline.addtrack.${type}` })), { defaultValueIndex: 0 });
        form.label({ translate: 'simplayer.timeline.page.current', with: [String(this.#page + 1), String(timeline.pageCount)] });
        form.submitButton({ translate: 'simplayer.timeline.save' });
        return form;
    }

    apply(formValues) {
        const timeline = this.#timeline;
        const trailingStart = this.#rowKeys.length * TimelineForm.ROW_STRIDE;
        const pageCountBefore = timeline.pageCount;
        const selectedPage = this.#selectedPage(formValues[trailingStart + 1], pageCountBefore);
        const lengthChanged = this.#applyLoopLength(timeline, formValues[trailingStart]);
        this.#rowKeys.forEach((key, row) => this.#applyRow(timeline, key, row, formValues));
        const addTrackType = PARAMETERISED_TYPES[formValues[trailingStart + 2] - 1];
        if (!lengthChanged && selectedPage === this.#page)
            return { nextPage: void 0, addTrackType };
        return { nextPage: Math.min(selectedPage, timeline.pageCount - 1), addTrackType };
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
            const { nextPage, addTrackType } = this.apply(response.formValues);
            const page = nextPage ?? this.#page;
            if (addTrackType !== void 0)
                this.#openAddTrack(addTrackType, page);
            else if (nextPage !== void 0)
                system.run(() => new TimelineForm(this.#player, this.#understudy, nextPage).show());
        } catch (error) {
            this.#player.sendMessage(`§cError: ${error.message}`);
        }
    }

    #openAddTrack(type, page) {
        if (this.#timeline.tracks.length >= TimelineForm.MAX_ROWS) {
            this.#player.sendMessage({ translate: 'simplayer.timeline.addtrack.full', with: [String(TimelineForm.MAX_ROWS)] });
            system.run(() => new TimelineForm(this.#player, this.#understudy, page).show());
            return;
        }
        system.run(() => new AddTrackForm(this.#player, this.#understudy, type, page).show());
    }

    #addRow(form, track, loopLength) {
        form.label({ rawtext: [{ text: TIMELINE_ROW_MARKER }, track.label()] });
        const length = track.effectiveLength(loopLength);
        for (let column = 0; column < Timeline.PAGE_WIDTH; column++) {
            const offset = this.#offsetAt(column);
            if (offset < length)
                form.toggle(String(offset + 1), { defaultValue: track.isActive(offset) });
            else
                form.toggle(TimelineForm.DISABLED_CELL_LABEL, { defaultValue: false });
        }
    }

    #applyRow(timeline, key, row, formValues) {
        const track = timeline.getTrack(key);
        if (track === void 0)
            return;
        const cellStart = row * TimelineForm.ROW_STRIDE + 1;
        for (let column = 0; column < Timeline.PAGE_WIDTH; column++)
            track.setActive(this.#offsetAt(column), formValues[cellStart + column] === true, timeline.loopLength);
        if (!track.isAlwaysPresent() && track.isEmpty())
            timeline.remove(key);
    }

    #applyLoopLength(timeline, loopLength) {
        if (loopLength === timeline.loopLength)
            return false;
        return timeline.setLoopLength(loopLength);
    }

    #offsetAt(column) {
        return this.#page * Timeline.PAGE_WIDTH + column;
    }

    #selectedPage(pageNumber, pageCount) {
        if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pageCount)
            return this.#page;
        return pageNumber - 1;
    }
}
