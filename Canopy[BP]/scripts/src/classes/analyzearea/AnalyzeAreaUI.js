import { CustomForm, ObservableString, ObservableNumber, ObservableBoolean, ObservableUIRawMessage } from '@minecraft/server-ui';
import { DimensionTypes, GameMode, system, world } from '@minecraft/server';
import { Analysis } from './Analysis.js';
import { stringifyLocation } from '../../../include/utils';

export const LIST_PAGE_SIZE = 50;

export class AnalyzeAreaUI {
    constructor(player, manager) {
        this.player = player;
        this.manager = manager;
    }

    showSelector() {
        const form = new CustomForm(this.player, { translate: 'commands.analyzearea.ui.selector.title' });
        const analyses = this.manager.list();
        if (analyses.length === 0) {
            form.label({ translate: 'commands.analyzearea.ui.selector.empty' });
            form.divider();
        }
        form.button({ translate: 'commands.analyzearea.ui.selector.new' }, () => {
            form.close();
            system.run(() => this.showCreateForm(null));
        });
        for (const analysis of analyses) {
            const label = analysis.name || `${stringifyLocation(analysis.min, 0)} -> ${stringifyLocation(analysis.max, 0)} (${analysis.dimensionId})`;
            form.button(label, () => {
                form.close();
                system.run(() => this.showAnalysisPage(analysis));
            });
        }
        form.show();
    }

    showCreateForm(prefill, initialError) {
        const from = prefill?.from ?? this.player.location;
        const to = prefill?.to ?? this.player.location;
        const form = new CustomForm(this.player, { translate: 'commands.analyzearea.ui.create.title' });
        const inputs = this.#buildInputs(form, { name: prefill?.name ?? '', from, to, dimensionId: this.player.dimension.id, expression: '' });
        const showError = this.#addErrorLabel(form);
        if (initialError)
            showError(initialError);
        form.button({ translate: 'commands.analyzearea.ui.create.submit' }, () => this.#submitCreate(form, inputs, showError));
        form.closeButton();
        form.show();
    }

    showEditForm(analysis, prefill) {
        const form = new CustomForm(this.player, { translate: 'commands.analyzearea.ui.edit.title' });
        const inputs = this.#buildInputs(form, {
            name: analysis.name,
            from: prefill?.from ?? analysis.min,
            to: prefill?.to ?? analysis.max,
            dimensionId: analysis.dimensionId,
            expression: analysis.expression
        });
        const showError = this.#addErrorLabel(form);
        form.button({ translate: 'commands.analyzearea.ui.edit.submit' }, () => this.#submitEdit(form, analysis, inputs, showError));
        form.button({ translate: 'commands.analyzearea.ui.page.back' }, () => {
            form.close();
            system.run(() => this.showAnalysisPage(analysis));
        });
        form.show();
    }

    #buildInputs(form, initial) {
        const { from, to } = initial;
        const name = new ObservableString(initial.name, { clientWritable: true });
        const fields = {
            fromX: new ObservableString(String(Math.floor(from.x)), { clientWritable: true }),
            fromY: new ObservableString(String(Math.floor(from.y)), { clientWritable: true }),
            fromZ: new ObservableString(String(Math.floor(from.z)), { clientWritable: true }),
            toX: new ObservableString(String(Math.floor(to.x)), { clientWritable: true }),
            toY: new ObservableString(String(Math.floor(to.y)), { clientWritable: true }),
            toZ: new ObservableString(String(Math.floor(to.z)), { clientWritable: true })
        };
        const dimensions = DimensionTypes.getAll().map((dimensionType) => dimensionType.typeId);
        const dimObservable = new ObservableNumber(Math.max(0, dimensions.indexOf(initial.dimensionId)), { clientWritable: true });
        const expression = new ObservableString(initial.expression, { clientWritable: true });
        const dimensionLabels = dimensions.map((id, index) => ({ label: id.replace('minecraft:', ''), value: index }));

        form.textField({ translate: 'commands.analyzearea.ui.create.name' }, name);
        form.textField({ translate: 'commands.analyzearea.ui.create.fromX' }, fields.fromX);
        form.textField({ translate: 'commands.analyzearea.ui.create.fromY' }, fields.fromY);
        form.textField({ translate: 'commands.analyzearea.ui.create.fromZ' }, fields.fromZ);
        form.textField({ translate: 'commands.analyzearea.ui.create.toX' }, fields.toX);
        form.textField({ translate: 'commands.analyzearea.ui.create.toY' }, fields.toY);
        form.textField({ translate: 'commands.analyzearea.ui.create.toZ' }, fields.toZ);
        form.dropdown({ translate: 'commands.analyzearea.ui.create.dimension' }, dimObservable, dimensionLabels);
        form.textField({ translate: 'commands.analyzearea.ui.create.expression' }, expression);
        form.spacer();
        return { name, fields, dimensions, dimObservable, expression };
    }

    #readInputs(inputs) {
        const from = this.#parseCorner(inputs.fields.fromX, inputs.fields.fromY, inputs.fields.fromZ);
        const to = this.#parseCorner(inputs.fields.toX, inputs.fields.toY, inputs.fields.toZ);
        const expression = inputs.expression.getData().trim();
        if (!from || !to || expression.length === 0)
            return void 0;
        return {
            from,
            to,
            dimensionId: inputs.dimensions[inputs.dimObservable.getData()],
            expression,
            name: inputs.name.getData().trim()
        };
    }

    #submitEdit(form, analysis, inputs, showError) {
        const changes = this.#readInputs(inputs);
        if (!changes) {
            showError({ translate: 'commands.analyzearea.create.invalid' });
            return;
        }
        const result = this.manager.edit(analysis, changes);
        if (!result.ok) {
            showError({ translate: `commands.analyzearea.${result.reason}` });
            return;
        }
        form.close();
        system.run(() => this.showAnalysisPage(analysis, true));
    }

    #submitCreate(form, inputs, showError) {
        const values = this.#readInputs(inputs);
        if (!values) {
            showError({ translate: 'commands.analyzearea.create.invalid' });
            return;
        }
        if (this.manager.findByName(values.name)) {
            showError({ translate: 'commands.analyzearea.nametaken' });
            return;
        }
        const result = Analysis.tryCreate(values.from, values.to, values.dimensionId, values.expression, values.name);
        if (!result.ok) {
            showError({ translate: `commands.analyzearea.${result.reason}` });
            return;
        }
        this.manager.add(result.analysis);
        form.close();
        system.run(() => this.showAnalysisPage(result.analysis, true));
    }

    showAnalysisPage(analysis, autoRun) {
        const form = new CustomForm(this.player, { translate: 'commands.analyzearea.ui.page.title' });
        const status = new ObservableUIRawMessage(analysis.statusMessage());
        form.label(status);
        form.spacer();
        const showError = this.#addErrorLabel(form);
        const list = { refresh: () => {} };
        const { runAnalysis, unsubscribe } = this.#wirePageProgress(analysis, status, showError, list);
        this.#addPageButtons(form, analysis, runAnalysis);
        form.divider();

        list.refresh = this.#buildLocationList(form, analysis, showError, status);
        form.closeButton();

        list.refresh();
        if (autoRun && !analysis.running)
            runAnalysis();
        form.show().then(unsubscribe, unsubscribe);
    }

    #wirePageProgress(analysis, status, showError, list) {
        const syncStatus = () => status.setData(analysis.statusMessage());
        const unsubscribe = analysis.subscribe({
            onProgress: syncStatus,
            onDone: () => list.refresh(),
            onError: (error) => {
                syncStatus();
                showError(Analysis.errorMessage(error));
            }
        });
        const runAnalysis = () => {
            analysis.run().catch(() => {});
            syncStatus();
        };
        return { runAnalysis, unsubscribe };
    }

    #addPageButtons(form, analysis, runAnalysis) {
        form.button({ translate: 'commands.analyzearea.ui.page.reanalyze' }, runAnalysis);
        const toggleLabel = new ObservableUIRawMessage(this.#toggleBoxesMessage(analysis));
        form.button(toggleLabel, () => {
            analysis.toggleBoxes();
            toggleLabel.setData(this.#toggleBoxesMessage(analysis));
        });
        form.button({ translate: 'commands.analyzearea.ui.page.edit' }, () => {
            form.close();
            system.run(() => this.showEditForm(analysis));
        });
        form.button({ translate: 'commands.analyzearea.ui.page.remove' }, () => {
            this.manager.remove(analysis);
            form.close();
            system.run(() => this.showSelector());
        });
        form.button({ translate: 'commands.analyzearea.ui.page.back' }, () => {
            form.close();
            system.run(() => this.showSelector());
        });
    }

    #buildSlots(form, analysis, showError) {
        const slots = [];
        for (let i = 0; i < LIST_PAGE_SIZE; i++) {
            const label = new ObservableString('');
            const visible = new ObservableBoolean(false);
            slots.push({ label, visible, location: void 0 });
            form.button(label, () => {
                if (!this.#teleportTo(slots[i].location, analysis.dimensionId))
                    showError({ translate: 'commands.analyzearea.teleport.gamemode' });
            }, { visible });
        }
        return slots;
    }

    #buildLocationList(form, analysis, showError, status) {
        const slots = this.#buildSlots(form, analysis, showError);
        const pageIndicator = new ObservableString('');
        const pagingVisible = new ObservableBoolean(false);
        let page = 0;
        const totalPages = () => Math.max(1, Math.ceil(analysis.matches.length / LIST_PAGE_SIZE));
        const renderPage = () => {
            const start = page * LIST_PAGE_SIZE;
            for (let i = 0; i < LIST_PAGE_SIZE; i++) {
                const match = analysis.matches[start + i];
                slots[i].location = match ?? void 0;
                slots[i].label.setData(match ? stringifyLocation(match, 0) : '');
                slots[i].visible.setData(Boolean(match));
            }
            pageIndicator.setData(`${page + 1} / ${totalPages()}`);
            pagingVisible.setData(totalPages() > 1);
            status.setData(analysis.statusMessage());
        };

        form.divider({ visible: pagingVisible });
        form.label(pageIndicator, { visible: pagingVisible });
        form.spacer({ visible: pagingVisible });
        form.button({ translate: 'commands.analyzearea.ui.page.next' }, () => {
            if (page < totalPages() - 1)
                page++;
            renderPage();
        }, { visible: pagingVisible });
        form.button({ translate: 'commands.analyzearea.ui.page.prev' }, () => {
            if (page > 0)
                page--;
            renderPage();
        }, { visible: pagingVisible });
        return () => { page = 0; renderPage(); };
    }

    #teleportTo(location, dimensionId) {
        if (!location)
            return true;
        const mode = this.player.getGameMode();
        if (mode !== GameMode.Creative && mode !== GameMode.Spectator)
            return false;
        this.player.teleport({ x: location.x + 0.5, y: location.y, z: location.z + 0.5 }, { dimension: world.getDimension(dimensionId) });
        return true;
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

    #toggleBoxesMessage(analysis) {
        return { translate: analysis.boxesVisible ? 'commands.analyzearea.ui.page.disableboxes' : 'commands.analyzearea.ui.page.enableboxes' };
    }

    #parseCorner(xObs, yObs, zObs) {
        const x = Number(xObs.getData());
        const y = Number(yObs.getData());
        const z = Number(zObs.getData());
        if ([x, y, z].some((n) => !Number.isFinite(n)))
            return void 0;
        return { x, y, z };
    }
}
