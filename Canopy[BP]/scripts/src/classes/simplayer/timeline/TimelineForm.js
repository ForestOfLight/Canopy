import { system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { Timeline } from "./Timeline";
import { TIMELINE_TRACKS } from "./TimelineTracks";
import { forceShow } from "../../../../include/utils";
import Understudies from "../Understudies";

export const TIMELINE_FORM_MARKER = '§t§i§m§e§l§i§n§e§r';

export class TimelineForm {
    static DISABLED_CELL_LABEL = '-';
    static ROW_BUTTON_COUNT = 2;
    static ROW_STRIDE = Timeline.PAGE_WIDTH + TimelineForm.ROW_BUTTON_COUNT;
    static LOOP_LENGTH_INDEX = TIMELINE_TRACKS.length * TimelineForm.ROW_STRIDE;
    static PAGE_INDEX = TimelineForm.LOOP_LENGTH_INDEX + 1;

    #player;
    #understudy;
    #page;

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
        for (const track of TIMELINE_TRACKS) {
            const trackName = { rawtext: [{ translate: track.labelKey }] };
            form.toggle({ translate: 'simplayer.timeline.selectall', with: trackName }, { defaultValue: false });
            form.toggle({ translate: 'simplayer.timeline.deselectall', with: trackName }, { defaultValue: false });
            for (let column = 0; column < Timeline.PAGE_WIDTH; column++) {
                const tick = this.#tickAt(column);
                const label = tick < timeline.loopLength ? String(tick) : TimelineForm.DISABLED_CELL_LABEL;
                form.toggle(label, { defaultValue: timeline.isActive(track.id, tick) });
            }
        }
        const loopLength = String(timeline.loopLength);
        form.textField({ translate: 'simplayer.timeline.looplength' }, loopLength, { defaultValue: loopLength });
        form.dropdown({ translate: 'simplayer.timeline.page' }, this.#pageOptions(timeline.pageCount), { defaultValueIndex: this.#page });
        form.submitButton({ translate: 'simplayer.timeline.save' });
        return form;
    }

    apply(formValues) {
        const timeline = this.#timeline;
        const lengthChanged = this.#applyLoopLength(timeline, formValues[TimelineForm.LOOP_LENGTH_INDEX]);
        const rowButtonPressed = TIMELINE_TRACKS
            .map((track, row) => this.#applyTrack(timeline, track, row, formValues))
            .some(pressed => pressed);
        const selectedPage = formValues[TimelineForm.PAGE_INDEX];
        if (!lengthChanged && !rowButtonPressed && selectedPage === this.#page)
            return void 0;
        return Math.min(selectedPage, timeline.pageCount - 1);
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
            const nextPage = this.apply(response.formValues);
            if (nextPage !== void 0)
                system.run(() => new TimelineForm(this.#player, this.#understudy, nextPage).show());
        } catch (error) {
            this.#player.sendMessage(`§cError: ${error.message}`);
        }
    }

    #applyTrack(timeline, track, row, formValues) {
        const rowStart = row * TimelineForm.ROW_STRIDE;
        if (formValues[rowStart] === true) {
            timeline.fillTrack(track.id);
            return true;
        }
        if (formValues[rowStart + 1] === true) {
            timeline.clearTrack(track.id);
            return true;
        }
        const cellStart = rowStart + TimelineForm.ROW_BUTTON_COUNT;
        for (let column = 0; column < Timeline.PAGE_WIDTH; column++)
            timeline.setActive(track.id, this.#tickAt(column), formValues[cellStart + column] === true);
        return false;
    }

    #applyLoopLength(timeline, text) {
        if (typeof text !== 'string' || !/^\d+$/.test(text))
            return false;
        const loopLength = Number(text);
        if (loopLength === timeline.loopLength)
            return false;
        return timeline.setLoopLength(loopLength);
    }

    #tickAt(column) {
        return this.#page * Timeline.PAGE_WIDTH + column;
    }

    #pageOptions(pageCount) {
        const options = [];
        for (let page = 0; page < pageCount; page++)
            options.push({ translate: 'simplayer.timeline.page.option', with: [String(page + 1), String(pageCount)] });
        return options;
    }
}
