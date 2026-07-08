import { CustomForm, ObservableString, ObservableNumber, ObservableBoolean } from '@minecraft/server-ui';
import { GameMode } from '@minecraft/server';
import { Analysis } from './Analysis.js';
import { ExpressionEvaluator } from './ExpressionEvaluator.js';
import { stringifyLocation, getColoredDimensionName } from '../../../include/utils';

export const LIST_PAGE_SIZE = 50;

const DIMENSIONS = ['minecraft:overworld', 'minecraft:nether', 'minecraft:the_end'];

function writable() {
    return { clientWritable: true };
}

export function showSelector(player, manager) {
    const form = new CustomForm(player, { translate: 'commands.analyzearea.ui.selector.title' });
    form.button({ translate: 'commands.analyzearea.ui.selector.new' }, () => showCreateForm(player, manager, null));
    const analyses = manager.list();
    if (analyses.length === 0)
        form.label({ translate: 'commands.analyzearea.ui.selector.empty' });
    for (const analysis of analyses) {
        const label = `${getColoredDimensionName(analysis.dimensionId.replace('minecraft:', ''))} §7${stringifyLocation(analysis.min, 0)}→${stringifyLocation(analysis.max, 0)}\n§8${truncate(analysis.expression, 40)}`;
        form.button(label, () => showAnalysisPage(player, manager, analysis));
    }
    form.show();
}

export function showCreateForm(player, manager, prefill) {
    const from = prefill?.from ?? player.location;
    const to = prefill?.to ?? player.location;
    const form = new CustomForm(player, { translate: 'commands.analyzearea.ui.create.title' });
    const fields = {
        fromX: new ObservableString(String(Math.floor(from.x)), writable()),
        fromY: new ObservableString(String(Math.floor(from.y)), writable()),
        fromZ: new ObservableString(String(Math.floor(from.z)), writable()),
        toX: new ObservableString(String(Math.floor(to.x)), writable()),
        toY: new ObservableString(String(Math.floor(to.y)), writable()),
        toZ: new ObservableString(String(Math.floor(to.z)), writable())
    };
    const dimIndex = Math.max(0, DIMENSIONS.indexOf(player.dimension.id));
    const dimObservable = new ObservableNumber(dimIndex, writable());
    const expression = new ObservableString('', writable());

    form.textField({ translate: 'commands.analyzearea.ui.create.fromX' }, fields.fromX);
    form.textField({ translate: 'commands.analyzearea.ui.create.fromY' }, fields.fromY);
    form.textField({ translate: 'commands.analyzearea.ui.create.fromZ' }, fields.fromZ);
    form.textField({ translate: 'commands.analyzearea.ui.create.toX' }, fields.toX);
    form.textField({ translate: 'commands.analyzearea.ui.create.toY' }, fields.toY);
    form.textField({ translate: 'commands.analyzearea.ui.create.toZ' }, fields.toZ);
    form.dropdown({ translate: 'commands.analyzearea.ui.create.dimension' }, dimObservable, DIMENSIONS);
    form.textField({ translate: 'commands.analyzearea.ui.create.expression' }, expression);

    form.button({ translate: 'commands.analyzearea.ui.create.submit' }, () => {
        const parsedFrom = parseCorner(fields.fromX, fields.fromY, fields.fromZ);
        const parsedTo = parseCorner(fields.toX, fields.toY, fields.toZ);
        const expr = expression.getData().trim();
        if (!parsedFrom || !parsedTo || expr.length === 0) {
            player.sendMessage({ translate: 'commands.analyzearea.create.invalid' });
            return;
        }
        try {
            void new ExpressionEvaluator(expr); // throws on syntax error
        } catch {
            player.sendMessage({ translate: 'commands.analyzearea.syntaxerror' });
            return;
        }
        const analysis = Analysis.create(parsedFrom, parsedTo, DIMENSIONS[dimObservable.getData()], expr);
        manager.add(analysis);
        analysis.run(player.dimension)
            .then(() => showAnalysisPage(player, manager, analysis))
            .catch(() => player.sendMessage({ translate: 'commands.analyzearea.loadcapacity' }));
    });
    form.closeButton();
    form.show();
}

export function showAnalysisPage(player, manager, analysis) {
    const form = new CustomForm(player, { translate: 'commands.analyzearea.ui.page.title' });
    form.label(pageHeader(analysis));

    const slots = [];
    for (let i = 0; i < LIST_PAGE_SIZE; i++) {
        const label = new ObservableString('');
        const visible = new ObservableBoolean(false);
        slots.push({ label, visible, location: null });
        form.button(label, () => teleportTo(player, slots[i].location), { visible });
    }

    const pageIndicator = new ObservableString('');
    let page = 0;
    const totalPages = () => Math.max(1, Math.ceil(analysis.matches.length / LIST_PAGE_SIZE));
    const renderPage = () => {
        const start = page * LIST_PAGE_SIZE;
        for (let i = 0; i < LIST_PAGE_SIZE; i++) {
            const match = analysis.matches[start + i];
            slots[i].location = match ?? null;
            slots[i].label.setData(match ? stringifyLocation(match, 0) : '');
            slots[i].visible.setData(Boolean(match));
        }
        pageIndicator.setData(`${page + 1} / ${totalPages()}`);
    };

    form.label(pageIndicator);
    form.button({ translate: 'commands.analyzearea.ui.page.prev' }, () => { if (page > 0) { page--; renderPage(); } });
    form.button({ translate: 'commands.analyzearea.ui.page.next' }, () => { if (page < totalPages() - 1) { page++; renderPage(); } });
    form.divider();
    form.button({ translate: 'commands.analyzearea.ui.page.reanalyze' }, () => {
        analysis.run(player.dimension)
            .then(() => { page = 0; renderPage(); })
            .catch(() => player.sendMessage({ translate: 'commands.analyzearea.loadcapacity' }));
    });
    form.button({ translate: 'commands.analyzearea.ui.page.toggleboxes' }, () => analysis.toggleBoxes());
    form.button({ translate: 'commands.analyzearea.ui.page.remove' }, () => { manager.remove(analysis); showSelector(player, manager); });
    form.button({ translate: 'commands.analyzearea.ui.page.back' }, () => showSelector(player, manager));
    form.closeButton();

    renderPage();
    form.show();
}

function pageHeader(analysis) {
    if (!analysis.hasRun)
        return { translate: 'commands.analyzearea.ui.page.notrun' };
    return { translate: 'commands.analyzearea.ui.page.header', with: [analysis.expression, String(analysis.matches.length)] };
}

function teleportTo(player, location) {
    if (!location) return;
    const mode = player.getGameMode();
    if (mode === GameMode.Creative || mode === GameMode.Spectator)
        player.teleport({ x: location.x + 0.5, y: location.y, z: location.z + 0.5 }, { dimension: player.dimension });
    else
        player.sendMessage({ translate: 'commands.analyzearea.teleport.gamemode' });
}

function parseCorner(xObs, yObs, zObs) {
    const x = Number(xObs.getData());
    const y = Number(yObs.getData());
    const z = Number(zObs.getData());
    if ([x, y, z].some((n) => !Number.isFinite(n))) return null;
    return { x, y, z };
}

function truncate(text, max) {
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
