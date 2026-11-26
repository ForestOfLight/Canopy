import { system } from "@minecraft/server";
import { CustomForm, ObservableBoolean, ObservableNumber, ObservableString, ObservableUIRawMessage } from "@minecraft/server-ui";
import { TRACK_TYPES, TRACK_TYPE_ORDER, trackTypeLabel } from "./TrackTypes";
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
        this.#addAddTrack(form);
        form.divider();
        this.#addRemoveTrack(form);
        form.divider();
        this.#addLengthSection(form);
        form.button({ translate: 'simplayer.timeline.settings.back' }, () => {
            form.close();
            this.#reopenTimeline();
        });
        form.closeButton();
        form.show();
    }

    #addAddTrack(form) {
        const choice = new ObservableNumber(0, { clientWritable: true });
        form.header({ translate: 'simplayer.timeline.settings.addtrack' });
        form.spacer();
        form.dropdown({ translate: 'simplayer.timeline.settings.addtrack.type' }, choice, TRACK_TYPE_ORDER.map((type, value) => ({ label: trackTypeLabel(type), value })));
        form.spacer();
        form.button({ translate: 'simplayer.timeline.settings.addtrack' }, () => this.#addTrack(form, TRACK_TYPE_ORDER[choice.getData()]));
        form.spacer();
    }

    #addTrack(form, type) {
        if (TRACK_TYPES[type].parameterised) {
            form.close();
            system.run(() => new AddTrackForm(this.#player, this.#understudy, type, this.#page, this.#trackPage).show());
            return;
        }
        if (!this.#isConnected(form))
            return;
        const timeline = this.#timeline;
        const track = timeline.getOrCreate(type);
        form.close();
        this.#reopenTimeline(TimelineForm.trackPageOf(timeline, track));
    }

    #addRemoveTrack(form) {
        const tracks = this.#timeline.tracks;
        form.header({ translate: 'simplayer.timeline.settings.remove.header' });
        form.spacer();
        if (tracks.length === 0) {
            form.label({ translate: 'simplayer.timeline.settings.remove.none' });
            form.spacer();
            return;
        }
        const choice = new ObservableNumber(0, { clientWritable: true });
        form.dropdown({ translate: 'simplayer.timeline.settings.remove.track' }, choice, tracks.map((track, value) => ({ label: { rawtext: track.baseLabel() }, value })));
        const showError = this.#addErrorLabel(form);
        form.button({ translate: 'simplayer.timeline.settings.remove' }, () => this.#removeTrack(form, tracks[choice.getData()], showError));
        form.spacer();
    }

    #removeTrack(form, track, showError) {
        if (!this.#isConnected(form))
            return;
        const timeline = this.#timeline;
        if (timeline.getTrack(track.key) !== track) {
            showError({ translate: 'simplayer.timeline.settings.trackgone' });
            return;
        }
        timeline.remove(track.key);
        form.close();
        this.#reopenTimeline();
    }

    #isConnected(form) {
        if (this.#understudy.isConnected())
            return true;
        form.close();
        this.#player.sendMessage(Understudies.getNotOnlineMessage(this.#understudy.name));
        return false;
    }

    #addLengthSection(form) {
        const timeline = this.#timeline;
        const tracks = timeline.tracks.filter(track => track.loops);
        form.header({ translate: 'simplayer.timeline.settings.looplength' });
        form.spacer();
        form.label({ translate: 'simplayer.timeline.settings.looplength.description' });
        form.spacer();
        if (tracks.length === 0) {
            form.label({ translate: 'simplayer.timeline.settings.looplength.none' });
            form.spacer();
            return;
        }
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
        form.dropdown({ translate: 'simplayer.timeline.settings.track' }, choice, tracks.map((track, value) => ({ label: { rawtext: track.baseLabel() }, value })));
        form.toggle({ translate: 'simplayer.timeline.settings.shared' }, shared);
        form.textField({ translate: 'simplayer.timeline.settings.ticks' }, ticks, { visible: ticksVisible });
        form.spacer();
        const showError = this.#addErrorLabel(form);
        form.button({ translate: 'simplayer.timeline.settings.apply' }, () => this.#applyLength(form, { tracks, choice, shared, ticks }, showError));
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
        if (!this.#isConnected(form))
            return;
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

    #reopenTimeline(trackPage = this.#trackPage) {
        system.run(() => new TimelineForm(this.#player, this.#understudy, this.#page, trackPage).show());
    }
}
