import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPermissionLevel, CustomCommandParamType, Player } from "@minecraft/server";
import { quickFillModeCommand } from "../../../../../Canopy[BP]/scripts/src/commands/quickfillmode";
import { quickFillContainer } from "../../../../../Canopy[BP]/scripts/src/rules/quickFillContainer";
import { quickFillModes } from "../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/QuickFillModes";
import { BulkMode } from "../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/BulkMode";
import { ClipboardMode } from "../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/ClipboardMode";
import { LogicalBulkMode } from "../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/LogicalBulkMode";
import { PlayerCommandOrigin } from "../../../../../Canopy[BP]/scripts/lib/canopy/Canopy";

describe('quickfillmode command', () => {
    let player;
    let origin;

    beforeEach(() => {
        player = new Player();
        player.id = 'quickfill-player';
        origin = new PlayerCommandOrigin({ sourceEntity: player });
        quickFillContainer.enableForPlayer(player);
    });

    afterEach(() => {
        quickFillContainer.onDisable();
        quickFillContainer.activePlayerIds.clear();
    });

    describe('definition', () => {
        const definition = quickFillModeCommand.customCommand;

        it('is registered as canopy:quickfillmode', () => {
            expect(definition.name).toBe('canopy:quickfillmode');
        });

        it('is available to every player, and only to players', () => {
            expect(definition.permissionLevel).toBe(CommandPermissionLevel.Any);
            expect(definition.allowedSources).toEqual([PlayerCommandOrigin]);
        });

        it('takes a mandatory enum argument listing every mode name', () => {
            const [parameter] = definition.mandatoryParameters;

            expect(parameter.type).toBe(CustomCommandParamType.Enum);
            expect(parameter.name).toBe(definition.enums[0].name);
            expect(definition.enums[0].values).toEqual(Object.values(quickFillModes).map(mode => mode.name));
        });

        it('documents every mode in the wiki', () => {
            expect(Object.keys(definition.subCommandWikiDescription).sort())
                .toEqual(Object.values(quickFillModes).map(mode => mode.name).sort());
        });
    });

    describe('quickFillCommand()', () => {
        it('starts every player in bulk mode', () => {
            expect(quickFillContainer.getActiveQuickFillPlayer(player).mode).toBeInstanceOf(BulkMode);
        });

        it.each([
            ['bulk', BulkMode],
            ['clipboard', ClipboardMode],
            ['logicalBulk', LogicalBulkMode]
        ])('switches the caller to %s mode', (modeName, ModeClass) => {
            quickFillModeCommand.quickFillCommand(origin, modeName === 'bulk' ? 'clipboard' : 'bulk');

            const result = quickFillModeCommand.quickFillCommand(origin, modeName);

            expect(result).toBeUndefined();
            expect(quickFillContainer.getActiveQuickFillPlayer(player).mode).toBeInstanceOf(ModeClass);
        });

        it('builds the new mode for the calling player', () => {
            quickFillModeCommand.quickFillCommand(origin, 'clipboard');

            expect(quickFillContainer.getActiveQuickFillPlayer(player).mode.player).toBe(player);
        });

        it('rejects an unknown mode with a failure and keeps the current mode', () => {
            quickFillModeCommand.quickFillCommand(origin, 'clipboard');
            const modeBefore = quickFillContainer.getActiveQuickFillPlayer(player).mode;

            const result = quickFillModeCommand.quickFillCommand(origin, 'turbo');

            expect(result).toEqual({ status: 'Failure', message: 'commands.quickfillmode.invalidmode' });
            expect(quickFillContainer.getActiveQuickFillPlayer(player).mode).toBe(modeBefore);
        });

        it('matches mode names exactly, case included', () => {
            const result = quickFillModeCommand.quickFillCommand(origin, 'Clipboard');

            expect(result.status).toBe('Failure');
            expect(quickFillContainer.getActiveQuickFillPlayer(player).mode).toBeInstanceOf(BulkMode);
        });

        it('only changes the calling player\'s mode', () => {
            const other = new Player();
            other.id = 'other-player';
            quickFillContainer.enableForPlayer(other);

            quickFillModeCommand.quickFillCommand(origin, 'clipboard');

            expect(quickFillContainer.getActiveQuickFillPlayer(other).mode).toBeInstanceOf(BulkMode);
        });

        it('destroys the previous mode when switching', () => {
            const previousMode = quickFillContainer.getActiveQuickFillPlayer(player).mode;
            const destroySpy = vi.spyOn(previousMode, 'destroy');

            quickFillModeCommand.quickFillCommand(origin, 'logicalBulk');

            expect(destroySpy).toHaveBeenCalledTimes(1);
        });
    });
});
