export const TRACK_KINDS = Object.freeze({ EVENT: 'event', HOLD: 'hold' });

function trackType(type, kind, labelKey, { parameterised = false, reassert = false } = {}) {
    return Object.freeze({ type, kind, labelKey, parameterised, reassert });
}

function actionEvent(type) {
    return trackType(type, TRACK_KINDS.EVENT, `simplayer.action.${type}`);
}

function timelineHold(type, reassert = false) {
    return trackType(type, TRACK_KINDS.HOLD, `simplayer.timeline.track.${type}`, { reassert });
}

export const TRACK_TYPES = Object.freeze({
    attack: actionEvent('attack'),
    interact: actionEvent('interact'),
    use: trackType('use', TRACK_KINDS.EVENT, 'simplayer.timeline.track.use'),
    usehold: timelineHold('usehold'),
    build: actionEvent('build'),
    break: actionEvent('break'),
    drop: actionEvent('drop'),
    dropstack: actionEvent('dropstack'),
    dropall: actionEvent('dropall'),
    jump: actionEvent('jump'),
    sneak: timelineHold('sneak', true),
    sprint: timelineHold('sprint', true),
    glide: timelineHold('glide'),
    select: trackType('select', TRACK_KINDS.EVENT, 'simplayer.timeline.track.select', { parameterised: true }),
    look: trackType('look', TRACK_KINDS.EVENT, 'simplayer.timeline.track.look', { parameterised: true }),
    move: trackType('move', TRACK_KINDS.HOLD, 'simplayer.timeline.track.move', { parameterised: true }),
    moveto: trackType('moveto', TRACK_KINDS.EVENT, 'simplayer.timeline.track.moveto', { parameterised: true })
});

export const TRACK_TYPE_ORDER = Object.freeze(Object.keys(TRACK_TYPES));

export const PARAMETERISED_TYPES = Object.freeze(['select', 'look', 'move', 'moveto']);

const MAX_TARGET_NAME_LENGTH = 24;

export const MOVE_DIRECTIONS = Object.freeze(['forward', 'backward', 'left', 'right']);

function joinCoordinates(location, separator) {
    return [location.x, location.y, location.z].join(separator);
}

function roundCoordinate(value) {
    return String(Math.round(value * 10) / 10);
}

function targetKey(target) {
    switch (target.kind) {
        case 'cardinal':
            return `cardinal:${target.direction}`;
        case 'rotation':
            return `rotation:${target.rotation.x},${target.rotation.y}`;
        case 'location':
            return `location:${joinCoordinates(target.location, ',')}`;
        case 'block':
            return `block:${target.block.dimension.id}:${joinCoordinates(target.block.location, ',')}`;
        case 'entity':
            return `entity:${target.entity.id}`;
        default:
            throw new Error(`[Canopy] Unknown track target kind: ${target.kind}`);
    }
}

function shorten(text) {
    return text.length > MAX_TARGET_NAME_LENGTH ? `${text.slice(0, MAX_TARGET_NAME_LENGTH - 1)}…` : text;
}

function targetLabel(target) {
    switch (target.kind) {

        case 'rotation':
            return [{ text: ` ${roundCoordinate(target.rotation.x)} ${roundCoordinate(target.rotation.y)}` }];
        case 'location':
            return [{ text: ` ${[target.location.x, target.location.y, target.location.z].map(roundCoordinate).join(' ')}` }];
        case 'block':
            return [{ text: ` ${joinCoordinates(target.block.location, ' ')}` }];
        case 'entity':
            return [{ text: ` ${shorten(target.entity.nameTag || target.entity.typeId.replace(/^minecraft:/, ''))}` }];
        default:
            throw new Error(`[Canopy] Unknown track target kind: ${target.kind}`);
    }
}

export function trackKey(type, params) {
    switch (type) {
        case 'select':
            return `select:${params.slot}`;
        case 'move':
            return `move:${params.direction}`;
        case 'look':
        case 'moveto':
            return `${type}:${targetKey(params.target)}`;
        default:
            return type;
    }
}

export function trackLabel(type, params) {
    switch (type) {
        case 'select':
            return [{ translate: TRACK_TYPES.select.labelKey, with: [String(params.slot + 1)] }];
        case 'move':
            return [{ translate: `${TRACK_TYPES.move.labelKey}.${params.direction}` }];
        case 'look':
        case 'moveto':
            if (params.target.kind === 'cardinal')
                return [{ translate: `${TRACK_TYPES[type].labelKey}.${params.target.direction}` }];
            return [{ translate: TRACK_TYPES[type].labelKey }, ...targetLabel(params.target)];
        default:
            return [{ translate: TRACK_TYPES[type].labelKey }];
    }
}

export function trackTypeLabel(type) {
    if (TRACK_TYPES[type].parameterised)
        return { translate: `simplayer.timeline.addtrack.${type}` };
    return { translate: TRACK_TYPES[type].labelKey };
}
