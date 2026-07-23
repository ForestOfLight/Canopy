import { ObservableString, ObservableNumber, ObservableBoolean } from '@minecraft/server-ui';
import { shapeTypeIds, getConfigSchema, autoSegments } from '../../../lib/VoxelizableDebugShapes/index.js';
import { buildField, prettyLabel } from './configFields.js';

const FIELD_ORDER = [
    'from', 'to', 'center', 'radius', 'radii', 'startAngle', 'endAngle',
    'rotation', 'mode', 'innerEdge', 'outerEdge', 'fill', 'segments', 'color'
];
const VOXEL_ONLY_FIELDS = new Set(['innerEdge', 'outerEdge', 'fill']);
const SMOOTH_ONLY_FIELDS = new Set(['segments']);

function isFieldVisible(key, schemaKeys, mode) {
    if (!schemaKeys.has(key))
        return false;
    if (VOXEL_ONLY_FIELDS.has(key))
        return mode === 'voxel';
    if (SMOOTH_ONLY_FIELDS.has(key))
        return mode === 'smooth';
    return true;
}

function defaultType(prefill) {
    return prefill && shapeTypeIds.includes(prefill.type) ? prefill.type : 'box';
}

function fieldValue(descriptor, prefill, defaults) {
    const provided = prefill ? prefill[descriptor.key] : undefined;
    return provided === undefined ? defaults[descriptor.key] : provided;
}

function activeSegments(prefill, defaults) {
    const radii = prefill?.radii;
    if (radii)
        return autoSegments(Math.max(radii.x ?? 0, radii.z ?? 0));
    return autoSegments(prefill?.radius ?? defaults.radius);
}

function unionFieldDescriptors() {
    const descriptorsByKey = new Map();
    for (const type of shapeTypeIds) {
        for (const descriptor of getConfigSchema(type)) {
            if (!descriptorsByKey.has(descriptor.key))
                descriptorsByKey.set(descriptor.key, descriptor);
        }
    }
    const orderedDescriptors = [];
    for (const key of FIELD_ORDER) {
        if (descriptorsByKey.has(key)) {
            orderedDescriptors.push(descriptorsByKey.get(key));
            descriptorsByKey.delete(key);
        }
    }
    for (const descriptor of descriptorsByKey.values())
        orderedDescriptors.push(descriptor);
    return orderedDescriptors;
}

export class ConfigForm {
    constructor(player) {
        this.player = player;
    }

    build(form, prefill, includeName) {
        const nameObservable = includeName ? this.#addNameField(form, prefill) : null;
        const typeObservable = this.#addTypeDropdown(form, prefill);
        const defaults = this.#defaults(prefill);
        const fieldDescriptors = unionFieldDescriptors();
        const fields = this.#buildFields(form, fieldDescriptors, prefill, defaults);
        this.#wireRepaintOnReveal(fieldDescriptors, fields);
        this.#wireVisibility(typeObservable, fieldDescriptors, fields);
        return { nameObservable, typeObservable, fieldDescriptors, fields };
    }

    read(inputs) {
        const type = shapeTypeIds[inputs.typeObservable.getData()];
        const schemaKeys = new Set(getConfigSchema(type).map((field) => field.key));
        const config = { type, dimension: this.player.dimension };
        for (const descriptor of inputs.fieldDescriptors) {
            if (!schemaKeys.has(descriptor.key))
                continue;
            const value = inputs.fields[descriptor.key].read();
            if (value !== undefined)
                config[descriptor.key] = value;
        }
        return config;
    }

    #addNameField(form, prefill) {
        const observable = new ObservableString(prefill?.name ?? 'My New Shape', { clientWritable: true });
        form.textField('Name', observable);
        return observable;
    }

    #addTypeDropdown(form, prefill) {
        const observable = new ObservableNumber(shapeTypeIds.indexOf(defaultType(prefill)), { clientWritable: true });
        const items = shapeTypeIds.map((id, index) => ({ label: prettyLabel(id), value: index }));
        form.dropdown('Shape', observable, items);
        return observable;
    }

    #defaults(prefill) {
        const { x, y, z } = this.player.location;
        const snapToHalfBlock = (coordinate) => Math.round(coordinate * 2) / 2;
        const origin = { x: snapToHalfBlock(x), y: snapToHalfBlock(y), z: snapToHalfBlock(z) };
        const defaults = {
            from: origin, to: origin, center: origin,
            radius: 5, radii: { x: 5, z: 3 }, startAngle: 0, endAngle: 90
        };
        defaults.segments = activeSegments(prefill, defaults);
        return defaults;
    }

    #buildFields(form, fieldDescriptors, prefill, defaults) {
        const defaultSchemaKeys = new Set(getConfigSchema(defaultType(prefill)).map((field) => field.key));
        const defaultMode = prefill?.mode ?? 'voxel';
        const fields = {};
        for (const descriptor of fieldDescriptors) {
            const value = fieldValue(descriptor, prefill, defaults);
            const visible = new ObservableBoolean(isFieldVisible(descriptor.key, defaultSchemaKeys, defaultMode));
            fields[descriptor.key] = buildField(form, descriptor, value, visible);
        }
        return fields;
    }

    #wireRepaintOnReveal(fieldDescriptors, fields) {
        for (const descriptor of fieldDescriptors) {
            const field = fields[descriptor.key];
            if (field.refresh) {
                field.visible.subscribe((isShown) => {
                    if (isShown)
                        field.refresh();
                });
            }
        }
    }

    #wireVisibility(typeObservable, fieldDescriptors, fields) {
        const modeField = fields.mode;
        const applyVisibility = () => {
            const selectedType = shapeTypeIds[typeObservable.getData()];
            const schemaKeys = new Set(getConfigSchema(selectedType).map((field) => field.key));
            const mode = modeField.options[modeField.observable.getData()];
            for (const descriptor of fieldDescriptors)
                fields[descriptor.key].visible.setData(isFieldVisible(descriptor.key, schemaKeys, mode));
        };
        typeObservable.subscribe(applyVisibility);
        modeField.observable.subscribe(applyVisibility);
    }
}
