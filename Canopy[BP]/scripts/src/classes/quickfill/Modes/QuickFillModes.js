import { BulkMode } from "./BulkMode";
import { ClipboardMode } from "./ClipboardMode";
import { LogicalBulkMode } from "./LogicalBulkMode";
import { MergeMode } from "./MergeMode";

export const quickFillModes = Object.freeze({
    BULK: { name: 'bulk', localizationKey: 'rules.quickFillContainer.mode.bulk', class: BulkMode },
    CLIPBOARD: { name: 'clipboard', localizationKey: 'rules.quickFillContainer.mode.clipboard', class: ClipboardMode },
    LOGICAL_BULK: { name: 'logicalBulk', localizationKey: 'rules.quickFillContainer.mode.logicalbulk', class: LogicalBulkMode },
    MERGE: { name: 'merge', localizationKey: 'rules.quickFillContainer.mode.merge', class: MergeMode },
});

export function getQuickFillModeConfigFromName(name) {
    return Object.values(quickFillModes).find((m => m.name === name));
}
