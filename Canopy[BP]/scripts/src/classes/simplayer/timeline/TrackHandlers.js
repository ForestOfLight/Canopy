import { RepeatableAction } from "../RepeatableAction";
import { CARDINAL_ROTATIONS } from "../targeting";
import { Vector } from "../../../../lib/Vector";

const HOLD_HANDLERS = Object.freeze({
    usehold: {
        start: understudy => understudy.simulatedPlayer.useItemInSlot(understudy.simulatedPlayer.selectedSlotIndex),
        stop: understudy => understudy.simulatedPlayer.stopUsingItem()
    },
    sneak: {
        start: understudy => understudy.sneak(true),
        stop: understudy => understudy.sneak(false)
    },
    sprint: {
        start: understudy => understudy.sprint(true),
        stop: understudy => understudy.sprint(false)
    },
    glide: {
        start: understudy => understudy.glide(true),
        stop: understudy => understudy.glide(false)
    },
    move: {
        start: (understudy, params) => understudy.moveRelative(params.direction),
        stop: understudy => understudy.stopMoving()
    }
});

function resolveTarget(target) {
    switch (target.kind) {
        case 'cardinal':
            return CARDINAL_ROTATIONS[target.direction];
        case 'rotation':
            return target.rotation;
        case 'location':
            return Vector.from(target.location);
        case 'block':
            return target.block.isValid === false ? void 0 : target.block;
        case 'entity':
            return target.entity.isValid === false ? void 0 : target.entity;
        default:
            return void 0;
    }
}

export function performEvent(understudy, type, params) {
    switch (type) {
        case 'select':
            understudy.selectSlot(params.slot);
            break;
        case 'look': {
            const target = resolveTarget(params.target);
            if (target !== void 0)
                understudy.look(target);
            break;
        }
        case 'moveto': {
            const target = resolveTarget(params.target);
            if (target !== void 0)
                understudy.moveLocation(target);
            break;
        }
        default:
            new RepeatableAction(understudy, type).perform();
    }
}

export function startHold(understudy, type, params) {
    HOLD_HANDLERS[type].start(understudy, params);
}

export function stopHold(understudy, type) {
    HOLD_HANDLERS[type].stop(understudy);
}
