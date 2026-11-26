import { world } from "@minecraft/server";
import { PresetV1 } from "./PresetV1";
import { trackKey } from "../TrackTypes";
import { InvalidPresetError } from "../../../errors/InvalidPresetError";

export const PRESET_CODECS = Object.freeze({ v1: PresetV1 });
export const LATEST_PRESET_VERSION = 'v1';

export function exportPreset(timeline) {
    return `${LATEST_PRESET_VERSION};${PRESET_CODECS[LATEST_PRESET_VERSION].encode(timeline)}`;
}

function findBlock(dimensionId, location) {
    try {
        return world.getDimension(dimensionId.includes(':') ? dimensionId : `minecraft:${dimensionId}`).getBlock(location);
    } catch {
        return void 0;
    }
}

function resolveTarget(target) {
    switch (target.kind) {
        case 'entity': {
            const entity = world.getEntity(target.id);
            return entity && { kind: 'entity', entity };
        }
        case 'block': {
            const block = findBlock(target.dimension, target.location);
            return block && { kind: 'block', block };
        }
        default:
            return target;
    }
}

function resolveSpec(spec) {
    if (spec.params?.target === void 0)
        return spec;
    const target = resolveTarget(spec.params.target);
    return target && { ...spec, params: { ...spec.params, target } };
}

function decode(text) {
    const trimmed = text.trim();
    const separator = trimmed.indexOf(';');
    const tag = separator === -1 ? trimmed : trimmed.slice(0, separator);
    if (!Object.hasOwn(PRESET_CODECS, tag))
        throw new InvalidPresetError({ translate: 'simplayer.timeline.preset.error.version', with: [tag] });
    return PRESET_CODECS[tag].decode(separator === -1 ? '' : trimmed.slice(separator + 1));
}

export function applyPreset(timeline, text) {
    const { loopLength, tracks } = decode(text);
    const resolved = [];
    const dropped = [];
    const keys = new Set();
    for (const spec of tracks) {
        const track = resolveSpec(spec);
        if (track === void 0) {
            dropped.push(spec.source);
            continue;
        }
        const key = trackKey(track.type, track.params);
        if (keys.has(key))
            throw new InvalidPresetError({ translate: 'simplayer.timeline.preset.error.duplicate', with: [spec.source] });
        keys.add(key);
        resolved.push(track);
    }
    timeline.replace(loopLength, resolved);
    return { dropped };
}
