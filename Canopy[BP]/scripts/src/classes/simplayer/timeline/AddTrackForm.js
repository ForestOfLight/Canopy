import { system } from "@minecraft/server";
import { CustomForm, ObservableBoolean, ObservableNumber, ObservableString, ObservableUIRawMessage } from "@minecraft/server-ui";
import { MOVE_DIRECTIONS } from "./TrackTypes";
import { TimelineForm } from "./TimelineForm";
import { TimelineSettingsForm } from "./TimelineSettingsForm";
import { CARDINAL_ROTATIONS, getViewedBlock, getViewedBlockFaceLocation, getViewedEntity } from "../targeting";
import Understudies from "../Understudies";
import { InvalidTrackTargetError } from "../../errors/InvalidTrackTargetError";

const SLOT_COUNT = 9;
const AXES = Object.freeze(['X', 'Y', 'Z']);
const CARDINAL_DIRECTIONS = Object.freeze(Object.keys(CARDINAL_ROTATIONS));
const TARGET_OPTIONS = Object.freeze({
    look: Object.freeze([...CARDINAL_DIRECTIONS, 'rotation', 'coordinates', 'block', 'entity', 'me']),
    moveto: Object.freeze(['coordinates', 'block', 'entity', 'me'])
});
const AXES_USED_BY_TARGET = Object.freeze({ rotation: 2, coordinates: 3 });

export class AddTrackForm {
    #player;
    #understudy;
    #type;
    #page;
    #trackPage;

    constructor(player, understudy, type, page, trackPage = 0) {
        this.#player = player;
        this.#understudy = understudy;
        this.#type = type;
        this.#page = page;
        this.#trackPage = trackPage;
    }

    show() {
        const form = new CustomForm(this.#player, { translate: `simplayer.timeline.addtrack.${this.#type}` });
        const choice = new ObservableNumber(0, { clientWritable: true });
        form.dropdown({ translate: this.#dropdownLabelKey() }, choice, this.#dropdownItems());
        const axes = this.#addAxisFields(form, choice);
        const showError = this.#addErrorLabel(form);
        form.button({ translate: 'simplayer.timeline.addtrack.submit' }, () => this.#submit(form, choice, axes, showError));
        form.button({ translate: 'simplayer.timeline.addtrack.back' }, () => {
            form.close();
            system.run(() => new TimelineSettingsForm(this.#player, this.#understudy, this.#page, this.#trackPage).show());
        });
        form.closeButton();
        form.show();
    }

    #dropdownLabelKey() {
        switch (this.#type) {
            case 'select':
                return 'simplayer.timeline.addtrack.slot';
            case 'move':
                return 'simplayer.timeline.addtrack.direction';
            default:
                return 'simplayer.timeline.addtrack.target';
        }
    }

    #dropdownItems() {
        switch (this.#type) {
            case 'select':
                return Array.from({ length: SLOT_COUNT }, (_, slot) => ({ label: String(slot + 1), value: slot }));
            case 'move':
                return MOVE_DIRECTIONS.map((direction, value) => ({ label: { translate: `simplayer.timeline.track.move.${direction}` }, value }));
            default:
                return TARGET_OPTIONS[this.#type].map((target, value) => ({ label: { translate: `simplayer.timeline.target.${target}` }, value }));
        }
    }

    #addAxisFields(form, choice) {
        if (TARGET_OPTIONS[this.#type] === void 0)
            return [];
        const axes = AXES.map(() => ({ text: new ObservableString('', { clientWritable: true }), visible: new ObservableBoolean(false) }));
        const showAxesFor = (index) => {
            const used = AXES_USED_BY_TARGET[TARGET_OPTIONS[this.#type][index]] ?? 0;
            axes.forEach((axis, axisIndex) => axis.visible.setData(axisIndex < used));
        };
        showAxesFor(choice.getData());
        choice.subscribe(showAxesFor);
        axes.forEach((axis, index) => form.textField(AXES[index], axis.text, { visible: axis.visible }));
        return axes;
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

    #submit(form, choice, axes, showError) {
        if (!this.#understudy.isConnected()) {
            form.close();
            this.#player.sendMessage(Understudies.getNotOnlineMessage(this.#understudy.name));
            return;
        }
        let params;
        try {
            params = this.#params(choice.getData(), axes.map(axis => axis.text.getData()));
        } catch (error) {
            if (!(error instanceof InvalidTrackTargetError))
                throw error;
            showError(error.reason);
            return;
        }
        const timeline = this.#understudy.actions.timeline;
        const track = timeline.getOrCreate(this.#type, params);
        form.close();
        this.#reopenTimeline(TimelineForm.trackPageOf(timeline, track));
    }

    #reopenTimeline(trackPage) {
        system.run(() => new TimelineForm(this.#player, this.#understudy, this.#page, trackPage).show());
    }

    #params(choice, fields) {
        switch (this.#type) {
            case 'select':
                return { slot: choice };
            case 'move':
                return { direction: MOVE_DIRECTIONS[choice] };
            default:
                return { target: this.#target(TARGET_OPTIONS[this.#type][choice], fields) };
        }
    }

    #target(option, fields) {
        if (CARDINAL_DIRECTIONS.includes(option))
            return { kind: 'cardinal', direction: option };
        switch (option) {
            case 'rotation': {
                const [x, y] = this.#numbers(fields.slice(0, 2));
                return { kind: 'rotation', rotation: { x, y } };
            }
            case 'coordinates': {
                const [x, y, z] = this.#numbers(fields);
                return { kind: 'location', location: { x, y, z } };
            }
            case 'block':
                return this.#viewedBlockTarget();
            case 'entity': {
                const entity = getViewedEntity(this.#player);
                if (entity === void 0)
                    throw new InvalidTrackTargetError({ translate: 'commands.playerlook.entity.noentity' });
                return { kind: 'entity', entity };
            }
            default:
                return { kind: 'entity', entity: this.#player };
        }
    }

    #viewedBlockTarget() {
        if (this.#type === 'look') {
            const location = getViewedBlockFaceLocation(this.#player);
            if (location !== void 0)
                return { kind: 'location', location: { x: location.x, y: location.y, z: location.z } };
        } else {
            const block = getViewedBlock(this.#player);
            if (block !== void 0)
                return { kind: 'block', block };
        }
        throw new InvalidTrackTargetError({ translate: 'commands.playerlook.block.noblock' });
    }

    #numbers(fields) {
        const numbers = fields.map(field => (typeof field === 'string' && field.trim() !== '') ? Number(field) : NaN);
        if (numbers.some(Number.isNaN))
            throw new InvalidTrackTargetError({ translate: 'simplayer.timeline.addtrack.invalidnumber' });
        return numbers;
    }
}
