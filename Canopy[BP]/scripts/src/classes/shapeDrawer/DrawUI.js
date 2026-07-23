import { CustomForm, ObservableString, ObservableBoolean, ObservableUIRawMessage } from '@minecraft/server-ui';
import { system } from '@minecraft/server';
import { DrawableShape } from './DrawableShape.js';
import { ConfigForm } from './configForm.js';

export class DrawUI {
    #configForm;

    constructor(player, manager) {
        this.player = player;
        this.manager = manager;
        this.#configForm = new ConfigForm(player);
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
            form.button(drawableShape.name, () => {
                form.close();
                system.run(() => this.showEditForm(drawableShape));
            });
        }
        form.show();
    }

    showCreateForm(prefill, initialError) {
        const form = new CustomForm(this.player, { translate: 'commands.draw.ui.create.title' });
        const inputs = this.#configForm.build(form, prefill ?? null, true);
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
        const inputs = this.#configForm.build(form, drawableShape.serialize().config, false);
        const showError = this.#addErrorLabel(form);
        form.button({ translate: 'commands.draw.ui.edit.submit' }, () => this.#submitEdit(form, drawableShape, inputs, nameObservable, renderObservable, showError));
        form.button({ translate: 'commands.draw.ui.edit.remove' }, () => this.#submitRemove(form, drawableShape));
        form.closeButton();
        form.show();
    }

    #submitCreate(form, inputs, showError) {
        const config = this.#configForm.read(inputs);
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
        const config = this.#configForm.read(inputs);
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
