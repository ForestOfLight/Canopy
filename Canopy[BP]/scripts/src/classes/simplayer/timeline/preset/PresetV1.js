import { Timeline } from "../Timeline";
import { Track } from "../Track";
import { MOVE_DIRECTIONS, TRACK_TYPES } from "../TrackTypes";
import { CARDINAL_ROTATIONS } from "../../targeting";
import { InvalidPresetError } from "../../../errors/InvalidPresetError";

const SLOT_COUNT = 9;
const CARDINAL_DIRECTIONS = Object.freeze(Object.keys(CARDINAL_ROTATIONS));
const WHOLE_NUMBER = /^\d+$/;
const INTEGER = /^-?\d+$/;
const DECIMAL = /^-?\d+(\.\d+)?$/;
const DIMENSION = /^[a-z_]+$/;

function formatDecimal(value) {
    return String(Math.round(value * 1000) / 1000);
}

function formatTicks(offsets) {
    const runs = [];
    for (const offset of offsets) {
        const last = runs.at(-1);
        if (last !== void 0 && last[1] === offset - 1)
            last[1] = offset;
        else
            runs.push([offset, offset]);
    }
    return runs.map(([start, end]) => (start === end ? String(start) : `${start}-${end}`)).join(',');
}

function encodeTarget(target) {
    switch (target.kind) {
        case 'cardinal':
            return target.direction;
        case 'rotation':
            return `rot/${[target.rotation.x, target.rotation.y].map(formatDecimal).join(',')}`;
        case 'location':
            return `pos/${[target.location.x, target.location.y, target.location.z].map(formatDecimal).join(',')}`;
        case 'block': {
            const { x, y, z } = target.block.location;
            return `block/${target.block.dimension.id.replace(/^minecraft:/, '')}/${x},${y},${z}`;
        }
        case 'entity':
            return `entity/${target.entity.id}`;
        default:
            throw new Error(`[Canopy] Unknown track target kind: ${target.kind}`);
    }
}

function encodePath(track) {
    switch (track.type) {
        case 'select':
            return `select/${track.params.slot + 1}`;
        case 'move':
            return `move/${track.params.direction}`;
        case 'look':
        case 'moveto':
            return `${track.type}/${encodeTarget(track.params.target)}`;
        default:
            return track.type;
    }
}

function encodeTrack(track) {
    const length = track.length === Track.SHARED ? '' : `@${track.length}`;
    return `${encodePath(track)}${length}:${formatTicks(track.activeOffsets())}`;
}

function encode(timeline) {
    const tracks = timeline.tracks.filter(track => track.loops).map(encodeTrack);
    return [String(timeline.loopLength), ...tracks].join(';');
}

function parseLoopLength(text) {
    const length = WHOLE_NUMBER.test(text) ? Number(text) : NaN;
    if (!Timeline.isValidLoopLength(length))
        throw new InvalidPresetError({ translate: 'simplayer.timeline.preset.error.looplength' });
    return length;
}

function parseNumbers(text, count, pattern) {
    const parts = text.split(',');
    if (parts.length !== count || !parts.every(part => pattern.test(part)))
        return void 0;
    return parts.map(Number);
}

function parseTarget(type, args) {
    const [kind, ...rest] = args;
    if (type === 'look' && rest.length === 0 && CARDINAL_DIRECTIONS.includes(kind))
        return { kind: 'cardinal', direction: kind };
    if (type === 'look' && kind === 'rot' && rest.length === 1) {
        const numbers = parseNumbers(rest[0], 2, DECIMAL);
        return numbers && { kind: 'rotation', rotation: { x: numbers[0], y: numbers[1] } };
    }
    if (kind === 'pos' && rest.length === 1) {
        const numbers = parseNumbers(rest[0], 3, DECIMAL);
        return numbers && { kind: 'location', location: { x: numbers[0], y: numbers[1], z: numbers[2] } };
    }
    if (type === 'moveto' && kind === 'block' && rest.length === 2 && DIMENSION.test(rest[0])) {
        const numbers = parseNumbers(rest[1], 3, INTEGER);
        return numbers && { kind: 'block', dimension: rest[0], location: { x: numbers[0], y: numbers[1], z: numbers[2] } };
    }
    if (kind === 'entity' && rest.length === 1 && INTEGER.test(rest[0]))
        return { kind: 'entity', id: rest[0] };
    return void 0;
}

function parseParams(type, args) {
    if (!Object.hasOwn(TRACK_TYPES, type))
        return { valid: false };
    switch (type) {
        case 'select': {
            const slot = args.length === 1 && WHOLE_NUMBER.test(args[0]) ? Number(args[0]) : NaN;
            return { valid: slot >= 1 && slot <= SLOT_COUNT, params: { slot: slot - 1 } };
        }
        case 'move':
            return { valid: args.length === 1 && MOVE_DIRECTIONS.includes(args[0]), params: { direction: args[0] } };
        case 'look':
        case 'moveto': {
            const target = parseTarget(type, args);
            return { valid: target !== void 0, params: { target } };
        }
        default:
            return { valid: args.length === 0, params: void 0 };
    }
}

function parseTicks(text) {
    if (text === '')
        return [];
    const ticks = new Set();
    for (const part of text.split(',')) {
        const bounds = part.split('-');
        if (bounds.length > 2 || !bounds.every(bound => WHOLE_NUMBER.test(bound)))
            return void 0;
        const [start, end = start] = bounds.map(Number);
        if (start > end)
            return void 0;
        for (let tick = start; tick <= end; tick++)
            ticks.add(tick);
    }
    return [...ticks].sort((a, b) => a - b);
}

function parseTrack(source, loopLength) {
    const unreadable = new InvalidPresetError({ translate: 'simplayer.timeline.preset.error.track', with: [source] });
    const colon = source.indexOf(':');
    if (colon === -1)
        throw unreadable;
    const [path, lengthText, ...extra] = source.slice(0, colon).split('@');
    if (extra.length > 0)
        throw unreadable;
    const [type, ...args] = path.split('/');
    const { valid, params } = parseParams(type, args);
    const ticks = parseTicks(source.slice(colon + 1));
    if (!valid || ticks === void 0)
        throw unreadable;
    const length = lengthText === void 0 ? Track.SHARED : parseLoopLength(lengthText);
    if (ticks.some(tick => tick >= (length ?? loopLength)))
        throw new InvalidPresetError({ translate: 'simplayer.timeline.preset.error.tick', with: [source] });
    return { source, type, params, length, ticks };
}

function decode(body) {
    const [loopLengthText, ...segments] = body.split(';');
    const loopLength = parseLoopLength(loopLengthText);
    const tracks = segments.filter(segment => segment !== '').map(segment => parseTrack(segment, loopLength));
    return { loopLength, tracks };
}

export const PresetV1 = Object.freeze({ encode, decode });
