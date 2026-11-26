import { system } from "@minecraft/server";
import { CustomForm, ObservableBoolean, ObservableNumber, ObservableString, ObservableUIRawMessage } from "@minecraft/server-ui";
import { PARAMETERISED_TYPES } from "./TrackTypes";
import { Track } from "./Track";
import { TimelineForm } from "./TimelineForm";
import { AddTrackForm } from "./AddTrackForm";
import Understudies from "../Understudies";

export class TimelineSettingsForm {
    #player;
    #understudy;
    #page;
    #trackPage;

    constructor(player, understudy, page = 0, trackPage = 0) {
        this.#player = player;
        this.#understudy = understudy;
        this.#page = page;
        this.#trackPage = trackPage;
    }

    get #timeline() {
        return this.#understudy.actions.timeline;
    }

    show() {
        const form = new CustomForm(this.#player, { translate: 'simplayer.timeline.settings.title', with: [this.#understudy.name] });
        this.#addTrackButtons(form);
        form.divider();
        const lengthInputs = this.#addLengthInputs(form);
        const showError = this.#addErrorLabel(form);
        form.button({ translate: 'simplayer.timeline.settings.apply' }, () => this.#applyLength(form, lengthInputs, showError));
        form.button({ translate: 'simplayer.timeline.settings.back' }, () => {
            form.close();
            this.#reopenTimeline();
        });
        form.closeButton();
        form.show();
    }

    #addTrackButtons(form) {
        form.header({ translate: 'simplayer.timeline.settings.addtrack' });
        for (const type of PARAMETERISED_TYPES) {
            form.button({ translate: `simplayer.timeline.addtrack.${type}` }, () => {
                form.close();
                system.run(() => new AddTrackForm(this.#player, this.#understudy, type, this.#page, this.#trackPage).show());
            });
        }
    }

    #addLengthInputs(form) {
        const timeline = this.#timeline;
        const tracks = timeline.tracks.filter(track => track.loops);
        const choice = new ObservableNumber(0, { clientWritable: true });
        const shared = new ObservableBoolean(true, { clientWritable: true });
        const ticks = new ObservableString('', { clientWritable: true });
        const ticksVisible = new ObservableBoolean(false);
        const showTrack = (index) => {
            const track = tracks[index];
            shared.setData(track.length === Track.SHARED);
            ticksVisible.setData(track.length !== Track.SHARED);
            ticks.setData(String(track.effectiveLength(timeline.loopLength)));
        };
        shared.subscribe(isShared => ticksVisible.setData(!isShared));
        choice.subscribe(showTrack);
        showTrack(0);
        form.header({ translate: 'simplayer.timeline.settings.looplength' });
        form.label({ translate: 'simplayer.timeline.settings.looplength.description' });
        form.dropdown({ translate: 'simplayer.timeline.settings.track' }, choice, tracks.map((track, value) => ({ label: { rawtext: track.baseLabel() }, value })));
        form.toggle({ translate: 'simplayer.timeline.settings.shared' }, shared);
        form.textField({ translate: 'simplayer.timeline.settings.ticks' }, ticks, { visible: ticksVisible });
        return { tracks, choice, shared, ticks };
    }

    #addErrorLabel(form) {
        const text = new ObservableUIRawMessage({ text: '' });
        const visible = new ObservableBoolean(false);
        form.label(text, { visible });
        return (message) => {
            text.setData(message);
            visible.setData(true);
        };
    }

    #applyLength(form, { tracks, choice, shared, ticks }, showError) {
        if (!this.#understudy.isConnected()) {
            form.close();
            this.#player.sendMessage(Understudies.getNotOnlineMessage(this.#understudy.name));
            return;
        }
        const timeline = this.#timeline;
        const track = tracks[choice.getData()];
        if (timeline.getTrack(track.key) !== track) {
            showError({ translate: 'simplayer.timeline.settings.trackgone' });
            return;
        }
        const length = shared.getData() ? Track.SHARED : this.#parseTicks(ticks.getData());
        if (length === void 0 || !timeline.setTrackLength(track.key, length)) {
            showError({ translate: 'simplayer.timeline.settings.invalidticks' });
            return;
        }
        form.close();
        this.#reopenTimeline();
    }

    #parseTicks(text) {
        if (!/^\d+$/.test(text.trim()))
            return void 0;
        return Number(text.trim());
    }

    #reopenTimeline() {
        system.run(() => new TimelineForm(this.#player, this.#understudy, this.#page, this.#trackPage).show());
    }
}
