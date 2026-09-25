import { ItemStack, Player } from "@minecraft/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { QuickFillClipboard } from "../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboard";
import { QuickFillClipboardController } from "../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboardController";
import { QuickFillClipboardStore } from "../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboardStore";
import { QuickFillPresetStore } from "../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillPresetStore";
import { quickFillCommand } from "../../../../../Canopy[BP]/scripts/src/commands/quickfill";

function createPlayer() {
    return new Player();
}

function createClipboard() {
    return new QuickFillClipboard({
        shape: 'generic:1',
        slots: [new ItemStack('minecraft:stone')]
    });
}

describe('QuickFillCommand', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    test('save stores the active clipboard under the requested name', () => {
        const player = createPlayer();
        const clipboard = createClipboard();

        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(clipboard);
        const save = vi.spyOn(QuickFillPresetStore, 'save').mockReturnValue(true);

        quickFillCommand.savePreset(player, 'rockets');

        expect(save).toHaveBeenCalledWith(player, 'rockets', clipboard);
    });

    test('set loads a saved preset into the active clipboard store', () => {
        const player = createPlayer();
        const clipboard = createClipboard();

        vi.spyOn(QuickFillPresetStore, 'load').mockReturnValue(clipboard);
        const set = vi.spyOn(QuickFillClipboardStore, 'set').mockReturnValue(true);

        quickFillCommand.setPreset(player, 'rockets');

        expect(set).toHaveBeenCalledWith(player, clipboard, 'rockets');
    });

    test('delete removes the requested preset', () => {
        const player = createPlayer();
        const remove = vi.spyOn(QuickFillPresetStore, 'delete').mockReturnValue(true);

        quickFillCommand.deletePreset(player, 'rockets');

        expect(remove).toHaveBeenCalledWith(player, 'rockets');
    });

    test('wildcard replaces the preset wildcard group using the selected item', () => {
        const player = createPlayer();
        const clipboard = createClipboard();

        vi.spyOn(QuickFillPresetStore, 'load').mockReturnValue(clipboard);
        const save = vi.spyOn(QuickFillPresetStore, 'save').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardStore, 'getPresetName').mockReturnValue('filters');
        const set = vi.spyOn(QuickFillClipboardStore, 'set').mockReturnValue(true);

        quickFillCommand.wildcardPreset(player, 'filters', { id: 'minecraft:stone' });

        expect(clipboard.wildcardGroups).toEqual([0]);
        expect(save).toHaveBeenCalledWith(player, 'filters', clipboard);
        expect(set).toHaveBeenCalledWith(player, clipboard, 'filters');
    });

    test('wildcard does not replace the active clipboard when editing another preset', () => {
        const player = createPlayer();
        const clipboard = createClipboard();

        vi.spyOn(QuickFillPresetStore, 'load').mockReturnValue(clipboard);
        vi.spyOn(QuickFillPresetStore, 'save').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardStore, 'getPresetName').mockReturnValue('active');
        const set = vi.spyOn(QuickFillClipboardStore, 'set').mockReturnValue(true);

        quickFillCommand.wildcardPreset(player, 'filters', { id: 'minecraft:stone' });

        expect(set).not.toHaveBeenCalled();
    });

    test('wildcard does not save when the selected item is absent from the preset', () => {
        const player = createPlayer();
        const clipboard = createClipboard();

        vi.spyOn(QuickFillPresetStore, 'load').mockReturnValue(clipboard);
        const save = vi.spyOn(QuickFillPresetStore, 'save').mockReturnValue(true);

        quickFillCommand.wildcardPreset(player, 'filters', { id: 'minecraft:dirt' });

        expect(clipboard.wildcardGroups).toEqual([null]);
        expect(save).not.toHaveBeenCalled();
    });

    test('list uses the existing Canopy header and per-line item style', () => {
        const player = createPlayer();

        vi.spyOn(QuickFillPresetStore, 'getNames').mockReturnValue([
            'rockets',
            'filters',
            'furnace'
        ]);

        quickFillCommand.listPresets(player);

        expect(player.sendMessage).toHaveBeenCalledWith({
            rawtext: [
                { translate: 'commands.quickfill.list.header' },
                { text: '\n§7- rockets' },
                { text: '\n§7- filters' },
                { text: '\n§7- furnace' }
            ]
        });
    });

    test('list reports when no presets are saved', () => {
        const player = createPlayer();

        vi.spyOn(QuickFillPresetStore, 'getNames').mockReturnValue([]);

        quickFillCommand.listPresets(player);

        expect(player.sendMessage).toHaveBeenCalledWith({
            translate: 'commands.quickfill.list.empty'
        });
    });
});
