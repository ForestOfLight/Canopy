import { system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { MOVE_DIRECTIONS } from "./TrackTypes";
import { TimelineForm } from "./TimelineForm";
import { CARDINAL_ROTATIONS, getViewedBlock, getViewedBlockFaceLocation, getViewedEntity } from "../targeting";
import { forceShow } from "../../../../include/utils";
import Understudies from "../Understudies";

const SLOT_COUNT = 9;
const CARDINAL_DIRECTIONS = Object.freeze(Object.keys(CARDINAL_ROTATIONS));
const TARGET_OPTIONS = Object.freeze({
    look: Object.freeze([...CARDINAL_DIRECTIONS, 'rotation', 'coordinates', 'block', 'entity', 'me']),
    moveto: Object.freeze(['coordinates', 'block', 'entity', 'me'])
});

export class AddTrackForm {
    #player;
    #understudy;
    #type;
    #page;

    constructor(player, understudy, type, page) {
        this.#player = player;
        this.#understudy = understudy;
        this.#type = type;
        this.#page = page;
    }

    build() {
        const form = new ModalFormData().title({ translate: `simplayer.timeline.addtrack.${this.#type}` });
        switch (this.#type) {
            case 'select':
                form.dropdown({ translate: 'simplayer.timeline.addtrack.slot' }, Array.from({ length: SLOT_COUNT }, (_, slot) => String(slot + 1)));
                break;
            case 'move':
                form.dropdown({ translate: 'simplayer.timeline.addtrack.direction' }, MOVE_DIRECTIONS.map(direction => ({ translate: `simplayer.timeline.track.move.${direction}` })));
                break;
            default:
                form.dropdown({ translate: 'simplayer.timeline.addtrack.target' }, TARGET_OPTIONS[this.#type].map(target => ({ translate: `simplayer.timeline.target.${target}` })));
                for (const axis of ['x', 'y', 'z'])
                    form.textField(axis, axis);
        }
        return form;
    }

    apply(formValues) {
        const params = this.#params(formValues);
        if (params === void 0)
            return void 0;
        const timeline = this.#understudy.actions.timeline;
        const track = timeline.getOrCreate(this.#type, params);
        if (track.isEmpty())
            track.setActive(0, true, timeline.loopLength);
        return track;
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
            this.apply(response.formValues);
            system.run(() => new TimelineForm(this.#player, this.#understudy, this.#page).show());
        } catch (error) {
            this.#player.sendMessage(`§cError: ${error.message}`);
        }
    }

    #params([choice, x, y, z]) {
        switch (this.#type) {
            case 'select':
                return { slot: choice };
            case 'move':
                return { direction: MOVE_DIRECTIONS[choice] };
            default: {
                const target = this.#target(TARGET_OPTIONS[this.#type][choice], [x, y, z]);
                return target === void 0 ? void 0 : { target };
            }
        }
    }

    #target(option, fields) {
        if (CARDINAL_DIRECTIONS.includes(option))
            return { kind: 'cardinal', direction: option };
        switch (option) {
            case 'rotation': {
                const numbers = this.#numbers(fields.slice(0, 2));
                return numbers && { kind: 'rotation', rotation: { x: numbers[0], y: numbers[1] } };
            }
            case 'coordinates': {
                const numbers = this.#numbers(fields);
                return numbers && { kind: 'location', location: { x: numbers[0], y: numbers[1], z: numbers[2] } };
            }
            case 'block':
                return this.#viewedBlockTarget();
            case 'entity': {
                const entity = getViewedEntity(this.#player);
                if (entity === void 0) {
                    this.#player.sendMessage({ translate: 'commands.playerlook.entity.noentity' });
                    return void 0;
                }
                return { kind: 'entity', entity };
            }
            case 'me':
                return { kind: 'entity', entity: this.#player };
            default:
                return void 0;
        }
    }

    #viewedBlockTarget() {
        const target = this.#type === 'look'
            ? this.#locationTarget(getViewedBlockFaceLocation(this.#player))
            : this.#blockTarget(getViewedBlock(this.#player));
        if (target === void 0)
            this.#player.sendMessage({ translate: 'commands.playerlook.block.noblock' });
        return target;
    }

    #locationTarget(location) {
        return location === void 0 ? void 0 : { kind: 'location', location: { x: location.x, y: location.y, z: location.z } };
    }

    #blockTarget(block) {
        return block === void 0 ? void 0 : { kind: 'block', block };
    }

    #numbers(fields) {
        const numbers = fields.map(field => (typeof field === 'string' && field.trim() !== '') ? Number(field) : NaN);
        if (numbers.some(Number.isNaN)) {
            this.#player.sendMessage({ translate: 'simplayer.timeline.addtrack.invalidnumber' });
            return void 0;
        }
        return numbers;
    }
}
