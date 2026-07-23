import { CustomForm, ObservableString, ObservableNumber, ObservableBoolean, ObservableUIRawMessage } from '@minecraft/server-ui';
import { system } from '@minecraft/server';
import { DrawableShape } from './DrawableShape.js';
import { shapeTypeIds, getConfigSchema } from '../../../lib/VoxelizableDebugShapes/index.js';

// The order config fields appear in the form (union across all shape types).
const FIELD_ORDER = [
    'from', 'to', 'center', 'radius', 'radii', 'startAngle', 'endAngle',
    'rotation', 'mode', 'innerEdge', 'outerEdge', 'fill', 'segments',
    'color', 'maximumRenderDistance'
];

/** 'maximumRenderDistance' -> 'Maximum Render Distance'. */
function prettyLabel(key) {
    const spaced = key.replace(/([A-Z])/g, ' $1');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function parseNumber(raw) {
    return Number.parseFloat(String(raw));
}

// Vector fields rendered as per-component sliders instead of text boxes.
// `toDisplay` maps a config value to slider units; `toConfig` maps back.
const SLIDER_FIELDS = {
    rotation: { min: 0, max: 360, step: 1, default: 0, toDisplay: (v) => v, toConfig: (v) => v },
    // alpha is omitted from the form and always set to 1.
    color: { min: 0, max: 255, step: 1, default: 255, axes: ['red', 'green', 'blue'], fixed: { alpha: 1 }, toDisplay: (v) => Math.round(v * 255), toConfig: (v) => v / 255 }
};

// Force a text field to repaint its value. A field revealed by a visibility
// toggle (rather than shown at creation) does not paint its server-set value,
// so clearing then re-setting produces the change the client needs.
function forceRepaint(observable) {
    const current = observable.getData();
    observable.setData('');
    observable.setData(current);
}

// Edge/fill toggles only make sense in voxel mode; segments only in smooth mode.
const VOXEL_ONLY_FIELDS = new Set(['innerEdge', 'outerEdge', 'fill']);
const SMOOTH_ONLY_FIELDS = new Set(['segments']);

function fieldVisible(key, schemaKeys, mode) {
    if (!schemaKeys.has(key))
        return false;
    if (VOXEL_ONLY_FIELDS.has(key))
        return mode === 'voxel';
    if (SMOOTH_ONLY_FIELDS.has(key))
        return mode === 'smooth';
    return true;
}

export class DrawUI {
    constructor(player, manager) {
        this.player = player;
        this.manager = manager;
    }

    showSelector() {
        const form = new CustomForm(this.player, { translate: 'commands.draw.ui.selector.title' });
        const drawableShapes = this.manager.list();
        if (drawableShapes.length === 0) {
            form.label({ translate: 'commands.draw.ui.selector.empty' });
            form.divider();
        }
        form.button({ translate: 'commands.draw.ui.selector.new' }, () => {
            form.close();
            system.run(() => this.showCreateForm(null));
        });
        for (const drawableShape of drawableShapes) {
            const label = drawableShape.name;
            form.button(label, () => {
                form.close();
                system.run(() => this.showEditForm(drawableShape));
            });
        }
        form.show();
    }

    showCreateForm(prefill, initialError) {
        const form = new CustomForm(this.player, { translate: 'commands.draw.ui.create.title' });
        const inputs = this.#buildConfigInputs(form, prefill ?? null, true);
        const showError = this.#addErrorLabel(form);
        if (initialError)
            showError(initialError);
        form.button({ translate: 'commands.draw.ui.create.submit' }, () => this.#submitCreate(form, inputs, showError));
        form.closeButton();
        form.show();
    }

    showEditForm(drawableShape) {
        const form = new CustomForm(this.player, { translate: 'commands.draw.ui.edit.title' });
        const nameObservable = new ObservableString(drawableShape.name, { clientWritable: true });
        form.textField('Name', nameObservable);
        const renderObservable = new ObservableBoolean(drawableShape?.isRendered ?? false, { clientWritable: true });
        form.toggle({ translate: 'commands.draw.ui.edit.render' }, renderObservable);
        const inputs = this.#buildConfigInputs(form, drawableShape.serialize().config, false);
        const showError = this.#addErrorLabel(form);
        form.button({ translate: 'commands.draw.ui.edit.submit' }, () => this.#submitEdit(form, drawableShape, inputs, nameObservable, renderObservable, showError));
        form.button({ translate: 'commands.draw.ui.edit.remove' }, () => this.#submitRemove(form, drawableShape));
        form.closeButton();
        form.show();
    }

    #submitCreate(form, inputs, showError) {
        const config = this.#readConfig(inputs);
        const name = inputs.nameObservable ? inputs.nameObservable.getData() : '';
        const result = DrawableShape.tryCreate(name, config);
        if (!result.ok) {
            showError({ translate: `commands.draw.ui.create.${result.reason}` });
            return;
        }
        this.manager.add(result.drawableShape);
        form.close();
        system.run(() => this.showSelector());
    }

    #submitEdit(form, drawableShape, inputs, nameObservable, renderObservable, showError) {
        const config = this.#readConfig(inputs);
        const result = drawableShape.tryUpdate(config, renderObservable.getData());
        if (!result.ok) {
            showError({ translate: `commands.draw.ui.create.${result.reason}` });
            return;
        }
        const newName = nameObservable.getData().trim();
        if (newName)
            drawableShape.name = newName;
        this.manager.save();
        form.close();
        system.run(() => this.showSelector());
    }

    #submitRemove(form, drawableShape) {
        this.manager.remove(drawableShape);
        form.close();
        system.run(() => this.showSelector());
    }

    #buildConfigInputs(form, prefill, includeName) {
        let nameObservable = null;
        if (includeName) {
            nameObservable = new ObservableString(prefill?.name ?? '', { clientWritable: true });
            form.textField('Name', nameObservable);
        }

        const defaultType = prefill && shapeTypeIds.includes(prefill.type) ? prefill.type : 'box';
        const typeObservable = new ObservableNumber(shapeTypeIds.indexOf(defaultType), { clientWritable: true });
        const typeItems = shapeTypeIds.map((id, index) => ({ label: prettyLabel(id), value: index }));
        form.dropdown('Shape', typeObservable, typeItems);
        form.spacer();

        const defaults = this.#defaultConfig();
        const union = this.#unionFields();
        const defaultKeys = new Set(getConfigSchema(defaultType).map((field) => field.key));
        const defaultMode = prefill?.mode ?? 'voxel';
        const fields = {};
        for (const descriptor of union)
            fields[descriptor.key] = this.#buildField(form, descriptor, prefill, defaults, fieldVisible(descriptor.key, defaultKeys, defaultMode));

        // Repaint a text field's value when it is revealed by a shape/mode change.
        for (const descriptor of union) {
            const field = fields[descriptor.key];
            if (field.refresh) {
                field.visible.subscribe((shown) => {
                    if (shown)
                        field.refresh();
                });
            }
        }

        const modeField = fields.mode;
        const applyVisibility = () => {
            const keys = new Set(getConfigSchema(shapeTypeIds[typeObservable.getData()]).map((field) => field.key));
            const mode = modeField.options[modeField.observable.getData()];
            for (const descriptor of union)
                fields[descriptor.key].visible.setData(fieldVisible(descriptor.key, keys, mode));
        };
        typeObservable.subscribe(applyVisibility);
        modeField.observable.subscribe(applyVisibility);

        return { nameObservable, typeObservable, union, fields };
    }

    #unionFields() {
        const byKey = new Map();
        for (const type of shapeTypeIds) {
            for (const descriptor of getConfigSchema(type)) {
                if (!byKey.has(descriptor.key))
                    byKey.set(descriptor.key, descriptor);
            }
        }
        const ordered = [];
        for (const key of FIELD_ORDER) {
            if (byKey.has(key)) {
                ordered.push(byKey.get(key));
                byKey.delete(key);
            }
        }
        for (const descriptor of byKey.values())
            ordered.push(descriptor);
        return ordered;
    }

    #buildField(form, descriptor, prefill, defaults, initiallyVisible) {
        const visible = new ObservableBoolean(initiallyVisible);
        const label = prettyLabel(descriptor.key);
        const provided = prefill ? prefill[descriptor.key] : undefined;
        const value = provided === undefined ? defaults[descriptor.key] : provided;

        const sliderSpec = SLIDER_FIELDS[descriptor.key];
        if (descriptor.kind === 'vector' && sliderSpec) {
            const axes = (sliderSpec.axes ?? descriptor.axes).map((axis) => {
                const start = value && value[axis] !== undefined ? sliderSpec.toDisplay(value[axis]) : sliderSpec.default;
                const observable = new ObservableNumber(start, { clientWritable: true });
                form.slider(`${label} ${axis}`, observable, sliderSpec.min, sliderSpec.max, { step: sliderSpec.step, visible });
                return { axis, observable };
            });
            return { descriptor, visible, kind: 'slider', axes, spec: sliderSpec };
        }
        if (descriptor.kind === 'vector') {
            const axes = descriptor.axes.map((axis) => {
                const initial = value && value[axis] !== undefined ? String(value[axis]) : '';
                const observable = new ObservableString(initial, { clientWritable: true });
                form.textField(`${label} ${axis}`, observable, { visible });
                return { axis, observable };
            });
            const refresh = () => {
                for (const entry of axes)
                    forceRepaint(entry.observable);
            };
            return { descriptor, visible, kind: 'vector', axes, refresh };
        }
        if (descriptor.kind === 'number') {
            const initial = value === undefined ? '' : String(value);
            const observable = new ObservableString(initial, { clientWritable: true });
            form.textField(label, observable, { visible });
            const refresh = () => forceRepaint(observable);
            return { descriptor, visible, kind: 'number', observable, refresh };
        }
        if (descriptor.kind === 'boolean') {
            const initial = value === undefined ? Boolean(descriptor.default) : Boolean(value);
            const observable = new ObservableBoolean(initial, { clientWritable: true });
            form.toggle(label, observable, { visible });
            return { descriptor, visible, kind: 'boolean', observable };
        }
        // enum
        const options = descriptor.options;
        const initialIndex = Math.max(0, options.indexOf(value ?? descriptor.default));
        const observable = new ObservableNumber(initialIndex, { clientWritable: true });
        const items = options.map((option, index) => ({ label: option, value: index }));
        form.dropdown(label, observable, items, { visible });
        return { descriptor, visible, kind: 'enum', observable, options };
    }

    // Prefill values for a fresh shape: from/to/center at the origin's block
    // position, plus sensible non-empty geometry for the other shapes.
    #defaultConfig() {
        const location = this.player.location;
        const origin = {
            x: Math.floor(location.x),
            y: Math.floor(location.y),
            z: Math.floor(location.z)
        };
        return {
            from: origin,
            to: origin,
            center: origin,
            radius: 5,
            radii: { x: 5, z: 3 },
            startAngle: 0,
            endAngle: 90
        };
    }

    // Assembles a shape config from the controls visible for the selected type.
    // Dimension is taken from the player rather than an input.
    #readConfig(inputs) {
        const type = shapeTypeIds[inputs.typeObservable.getData()];
        const schemaKeys = new Set(getConfigSchema(type).map((field) => field.key));
        const config = { type, dimension: this.player.dimension };
        for (const descriptor of inputs.union) {
            if (!schemaKeys.has(descriptor.key))
                continue;
            const value = this.#readField(inputs.fields[descriptor.key]);
            if (value !== undefined)
                config[descriptor.key] = value;
        }
        return config;
    }

    #readField(field) {
        const { descriptor } = field;
        if (field.kind === 'slider') {
            const out = {};
            for (const entry of field.axes)
                out[entry.axis] = field.spec.toConfig(entry.observable.getData());
            if (field.spec.fixed)
                Object.assign(out, field.spec.fixed);
            return out;
        }
        if (field.kind === 'vector') {
            const raws = field.axes.map((entry) => entry.observable.getData());
            if (descriptor.optional && raws.every((raw) => raw.trim() === ''))
                return undefined;
            const out = {};
            field.axes.forEach((entry, index) => {
                const parsed = parseNumber(raws[index]);
                out[entry.axis] = Number.isNaN(parsed) ? 0 : parsed;
            });
            return out;
        }
        if (field.kind === 'number') {
            const raw = field.observable.getData().trim();
            if (raw === '')
                return descriptor.optional ? undefined : 0;
            const parsed = parseNumber(raw);
            if (Number.isNaN(parsed))
                return descriptor.optional ? undefined : 0;
            return parsed;
        }
        if (field.kind === 'boolean')
            return field.observable.getData();
        return field.options[field.observable.getData()];
    }

    #addErrorLabel(form) {
        const text = new ObservableUIRawMessage({ text: '' });
        const visible = new ObservableBoolean(false);
        form.label(text, { visible });
        form.spacer({ visible });
        return (message) => {
            text.setData(message);
            visible.setData(true);
        };
    }
}
