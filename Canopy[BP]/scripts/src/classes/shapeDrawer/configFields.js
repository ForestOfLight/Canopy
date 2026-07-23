import { ObservableString, ObservableNumber, ObservableBoolean } from '@minecraft/server-ui';

const VECTOR_SLIDERS = {
    rotation: { min: 0, max: 360, step: 1, default: 0, toDisplay: (value) => value, toConfig: (value) => value },
    color: { min: 0, max: 255, step: 1, default: 255, axes: ['red', 'green', 'blue'], fixed: { alpha: 1 }, toDisplay: (value) => Math.round(value * 255), toConfig: (value) => value / 255 }
};

const NUMBER_SLIDERS = {
    startAngle: { min: 0, max: 360, step: 1, default: 0 },
    endAngle: { min: 0, max: 360, step: 1, default: 90 }
};

export function prettyLabel(key) {
    const spaced = key.replace(/([A-Z])/g, ' $1');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function parseNumber(rawValue) {
    return Number.parseFloat(String(rawValue));
}

function forceRepaint(observable) {
    const currentValue = observable.getData();
    observable.setData('');
    observable.setData(currentValue);
}

function buildVectorSlider(form, descriptor, value, visible, sliderSpec) {
    const label = prettyLabel(descriptor.key);
    const axisInputs = (sliderSpec.axes ?? descriptor.axes).map((axis) => {
        const initialValue = value && value[axis] !== undefined ? sliderSpec.toDisplay(value[axis]) : sliderSpec.default;
        const observable = new ObservableNumber(initialValue, { clientWritable: true });
        form.slider(`${label} ${axis}`, observable, sliderSpec.min, sliderSpec.max, { step: sliderSpec.step, visible });
        return { axis, observable };
    });
    const read = () => {
        const vector = {};
        for (const axisInput of axisInputs)
            vector[axisInput.axis] = sliderSpec.toConfig(axisInput.observable.getData());
        if (sliderSpec.fixed)
            Object.assign(vector, sliderSpec.fixed);
        return vector;
    };
    return { descriptor, visible, read };
}

function buildVectorText(form, descriptor, value, visible) {
    const label = prettyLabel(descriptor.key);
    const axisInputs = descriptor.axes.map((axis) => {
        const initialText = value && value[axis] !== undefined ? String(value[axis]) : '';
        const observable = new ObservableString(initialText, { clientWritable: true });
        form.textField(`${label} ${axis}`, observable, { visible });
        return { axis, observable };
    });
    const read = () => {
        const rawValues = axisInputs.map((axisInput) => axisInput.observable.getData());
        if (descriptor.optional && rawValues.every((rawValue) => rawValue.trim() === ''))
            return undefined;
        const vector = {};
        axisInputs.forEach((axisInput, index) => {
            const parsed = parseNumber(rawValues[index]);
            vector[axisInput.axis] = Number.isNaN(parsed) ? 0 : parsed;
        });
        return vector;
    };
    const refresh = () => {
        for (const axisInput of axisInputs)
            forceRepaint(axisInput.observable);
    };
    return { descriptor, visible, read, refresh };
}

function buildNumberSlider(form, descriptor, value, visible, sliderSpec) {
    const initialValue = value === undefined ? sliderSpec.default : value;
    const observable = new ObservableNumber(initialValue, { clientWritable: true });
    form.slider(prettyLabel(descriptor.key), observable, sliderSpec.min, sliderSpec.max, { step: sliderSpec.step, visible });
    return { descriptor, visible, read: () => observable.getData() };
}

function buildNumberText(form, descriptor, value, visible) {
    const observable = new ObservableString(value === undefined ? '' : String(value), { clientWritable: true });
    form.textField(prettyLabel(descriptor.key), observable, { visible });
    const read = () => {
        const rawValue = observable.getData().trim();
        if (rawValue === '')
            return descriptor.optional ? undefined : 0;
        const parsed = parseNumber(rawValue);
        if (Number.isNaN(parsed))
            return descriptor.optional ? undefined : 0;
        return parsed;
    };
    return { descriptor, visible, read, refresh: () => forceRepaint(observable) };
}

function buildToggle(form, descriptor, value, visible) {
    const initialValue = value === undefined ? Boolean(descriptor.default) : Boolean(value);
    const observable = new ObservableBoolean(initialValue, { clientWritable: true });
    form.toggle(prettyLabel(descriptor.key), observable, { visible });
    return { descriptor, visible, read: () => observable.getData() };
}

function buildDropdown(form, descriptor, value, visible) {
    const { options } = descriptor;
    const initialIndex = Math.max(0, options.indexOf(value ?? descriptor.default));
    const observable = new ObservableNumber(initialIndex, { clientWritable: true });
    const items = options.map((option, index) => ({ label: option, value: index }));
    form.dropdown(prettyLabel(descriptor.key), observable, items, { visible });
    return { descriptor, visible, observable, options, read: () => options[observable.getData()] };
}

export function buildField(form, descriptor, value, visible) {
    if (descriptor.kind === 'vector') {
        const sliderSpec = VECTOR_SLIDERS[descriptor.key];
        if (sliderSpec)
            return buildVectorSlider(form, descriptor, value, visible, sliderSpec);
        return buildVectorText(form, descriptor, value, visible);
    }
    if (descriptor.kind === 'number') {
        const sliderSpec = NUMBER_SLIDERS[descriptor.key];
        if (sliderSpec)
            return buildNumberSlider(form, descriptor, value, visible, sliderSpec);
        return buildNumberText(form, descriptor, value, visible);
    }
    if (descriptor.kind === 'boolean')
        return buildToggle(form, descriptor, value, visible);
    return buildDropdown(form, descriptor, value, visible);
}
