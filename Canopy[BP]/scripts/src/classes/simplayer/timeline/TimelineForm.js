import { system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { Timeline } from "./Timeline";
import { TIMELINE_TRACKS } from "./TimelineTracks";
import { forceShow } from "../../../../include/utils";
import Understudies from "../Understudies";

export const TIMELINE_FORM_MARKER = '§t§i§m§e§l§i§n§e§r';

export class TimelineForm {
    static DISABLED_CELL_LABEL = '-';
    static ROW_STRIDE = Timeline.PAGE_WIDTH;
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
            for (let column = 0; column < Timeline.PAGE_WIDTH; column++) {
                const tick = this.#tickAt(column);
                const label = tick < timeline.loopLength ? String(tick + 1) : TimelineForm.DISABLED_CELL_LABEL;
                form.toggle(label, { defaultValue: timeline.isActive(track.id, tick) });
            }
        }
        form.slider({ translate: 'simplayer.timeline.looplength' }, Timeline.MIN_LOOP_LENGTH, Timeline.MAX_LOOP_LENGTH, { valueStep: 1, defaultValue: timeline.loopLength });
        if (timeline.pageCount > 1)
            form.slider({ translate: 'simplayer.timeline.page' }, 1, timeline.pageCount, { valueStep: 1, defaultValue: this.#page + 1 });
        form.label({ translate: 'simplayer.timeline.page.current', with: [String(this.#page + 1), String(timeline.pageCount)] });
        form.submitButton({ translate: 'simplayer.timeline.save' });
        return form;
    }

    apply(formValues) {
        const timeline = this.#timeline;
        const selectedPage = this.#selectedPage(formValues[TimelineForm.PAGE_INDEX], timeline.pageCount);
        const lengthChanged = this.#applyLoopLength(timeline, formValues[TimelineForm.LOOP_LENGTH_INDEX]);
        TIMELINE_TRACKS.forEach((track, row) => this.#applyTrack(timeline, track, row, formValues));
        if (!lengthChanged && selectedPage === this.#page)
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
        for (let column = 0; column < Timeline.PAGE_WIDTH; column++)
            timeline.setActive(track.id, this.#tickAt(column), formValues[rowStart + column] === true);
    }

    #applyLoopLength(timeline, loopLength) {
        if (loopLength === timeline.loopLength)
            return false;
        return timeline.setLoopLength(loopLength);
    }

    #tickAt(column) {
        return this.#page * Timeline.PAGE_WIDTH + column;
    }

    #selectedPage(pageNumber, pageCount) {
        if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pageCount)
            return this.#page;
        return pageNumber - 1;
    }
}
