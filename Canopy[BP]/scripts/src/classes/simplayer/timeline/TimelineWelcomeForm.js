import { system } from "@minecraft/server";
import { CustomForm, ObservableNumber } from "@minecraft/server-ui";
import { TRACK_TYPES, TRACK_TYPE_ORDER, trackTypeLabel } from "./TrackTypes";
import { Timeline } from "./Timeline";
import { TimelineForm } from "./TimelineForm";
import { AddTrackForm } from "./AddTrackForm";
import Understudies from "../Understudies";

export class TimelineWelcomeForm {
    #player;
    #understudy;

    constructor(player, understudy) {
        this.#player = player;
        this.#understudy = understudy;
    }

    show() {
        const timeline = this.#understudy.actions.timeline;
        const form = new CustomForm(this.#player, { translate: 'simplayer.timeline.welcome.title', with: [this.#understudy.name] });
        const trackChoice = new ObservableNumber(0, { clientWritable: true });
        const loopLength = new ObservableNumber(timeline.loopLength, { clientWritable: true });
        form.label({ translate: 'simplayer.timeline.welcome.description' });
        form.spacer();
        form.dropdown({ translate: 'simplayer.timeline.welcome.track' }, trackChoice, TRACK_TYPE_ORDER.map((type, value) => ({ label: trackTypeLabel(type), value })));
        form.slider({ translate: 'simplayer.timeline.looplength' }, loopLength, Timeline.MIN_LOOP_LENGTH, Timeline.MAX_LOOP_LENGTH, { step: 1 });
        form.spacer();
        form.button({ translate: 'simplayer.timeline.welcome.start' }, () => this.#start(form, TRACK_TYPE_ORDER[trackChoice.getData()], loopLength.getData()));
        form.closeButton();
        form.show();
    }

    #start(form, type, loopLength) {
        form.close();
        if (!this.#understudy.isConnected()) {
            this.#player.sendMessage(Understudies.getNotOnlineMessage(this.#understudy.name));
            return;
        }
        const timeline = this.#understudy.actions.timeline;
        timeline.setLoopLength(loopLength);
        if (TRACK_TYPES[type].parameterised) {
            system.run(() => new AddTrackForm(this.#player, this.#understudy, type, 0, 0).show());
            return;
        }
        timeline.getOrCreate(type);
        system.run(() => new TimelineForm(this.#player, this.#understudy, 0, 0).show());
    }
}
