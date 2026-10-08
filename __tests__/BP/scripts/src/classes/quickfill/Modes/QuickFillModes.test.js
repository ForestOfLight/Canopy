import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { quickFillModes } from "../../../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/QuickFillModes";
import { BulkMode } from "../../../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/BulkMode";
import { ClipboardMode } from "../../../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/ClipboardMode";
import { LogicalBulkMode } from "../../../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/LogicalBulkMode";

const enLang = readFileSync(new URL("../../../../../../../Canopy[RP]/texts/en_US.lang", import.meta.url), 'utf8');
const langKeys = new Set(enLang.split('\n').map(line => line.split('=')[0].trim()));

describe('quickFillModes', () => {
    const modes = Object.values(quickFillModes);

    test('maps each mode to its implementation', () => {
        expect(quickFillModes.BULK.class).toBe(BulkMode);
        expect(quickFillModes.CLIPBOARD.class).toBe(ClipboardMode);
        expect(quickFillModes.LOGICAL_BULK.class).toBe(LogicalBulkMode);
    });

    test('uses a unique command name per mode', () => {
        const names = modes.map(mode => mode.name);

        expect(new Set(names).size).toBe(names.length);
    });

    test('every mode implements the interface QuickFillPlayer relies on', () => {
        for (const mode of modes) {
            for (const method of ['destroy', 'onFillInteraction', 'onGrabInteraction', 'hasConfigureInteraction'])
                expect(mode.class.prototype[method], `${mode.name}.${method}`).toBeTypeOf('function');
        }
    });

    test('only modes that declare a configure interaction implement it', () => {
        for (const mode of modes) {
            const ModeClass = mode.class;
            const instance = new ModeClass({ getComponent: () => ({ container: {} }) });
            if (instance.hasConfigureInteraction())
                expect(instance.onConfigureInteraction, mode.name).toBeTypeOf('function');
        }
    });

    test('every mode has an English localization entry', () => {
        for (const mode of modes)
            expect(langKeys.has(mode.localizationKey), mode.localizationKey).toBe(true);
    });
});
