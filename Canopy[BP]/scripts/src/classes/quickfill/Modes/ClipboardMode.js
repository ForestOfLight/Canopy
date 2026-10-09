import { GameMode } from "@minecraft/server";
import { ItemClipboard } from "../ItemClipboard";
import { SearchTransferStrategy } from "../TransferStrategies/SearchTransferStrategy";
import { SlotTransferStrategy } from "../TransferStrategies/SlotTransferStrategy";
import { ConjureTransferStrategy } from "../TransferStrategies/ConjureTransferStrategy";
import { VanillaTransferStrategy } from "../TransferStrategies/VanillaTransferStrategy";
import { FirstEmptySlotTransferStrategy } from "../TransferStrategies/FirstEmptySlotTransferStrategy";
import { CustomForm, ObservableNumber } from "@minecraft/server-ui";
import { QuickFillMode } from "./QuickFillMode";
import { quickFillModes } from "./QuickFillModes";

export class ClipboardMode extends QuickFillMode {
    clipboard;
    takeCopies = 0;

    constructor(player) {
        super(player);
        this.clipboard = new ItemClipboard();
    }

    get name() {
        return quickFillModes.CLIPBOARD.name;
    }

    onFillInteraction(container, heldItemStack, blockLocalizationKey) {
        let transferOptions;
        if (this.player.getGameMode() === GameMode.Creative) {
            transferOptions = {
                take: ConjureTransferStrategy,
                put: FirstEmptySlotTransferStrategy,
                to: container,
                wildcardItemStack: heldItemStack
            };
        } else {
            transferOptions = {
                take: SearchTransferStrategy,
                put: SlotTransferStrategy,
                from: this.playerContainer,
                to: container,
                wildcardItemStack: heldItemStack
            };
        }
        const { transferredAmount } = this.clipboard.transfer(transferOptions);
        this.sendFeedback(this.getFillInteractionFeedback(container, transferredAmount, blockLocalizationKey));
    }

    onTakeInteraction(container, heldItemStack, blockLocalizationKey) {
        if (this.clipboard.isEmpty) {
            this.sendFeedback(this.getNothingTakenFeedback(blockLocalizationKey));
            return;
        }
        let copiesTaken = 0;
        let transferredAmount = 0;
        if (this.takeCopies === 0) {
            let lastTransferCompleted = true;
            while (lastTransferCompleted) {
                const result = this.#takeFromContainer(container, heldItemStack);
                transferredAmount += result.transferredAmount;
                if (result.transferredAmount > 0)
                    copiesTaken++;
                lastTransferCompleted = result.completed;
            }
        } else {
            for (let i = 0; i < this.takeCopies; i++) {
                const result = this.#takeFromContainer(container, heldItemStack);
                transferredAmount += result.transferredAmount;
                if (result.transferredAmount > 0)
                    copiesTaken++;
            }
        }
        if (transferredAmount === 0)
            this.sendFeedback(this.getNothingTakenFeedback(blockLocalizationKey));
        else
            this.sendFeedback(this.getTakenFeedback(container, transferredAmount, blockLocalizationKey, copiesTaken));
    }

    #takeFromContainer(container, heldItemStack) {
        return this.clipboard.transfer({
            take: SlotTransferStrategy,
            put: VanillaTransferStrategy,
            from: container,
            to: this.playerContainer,
            wildcardItemStack: heldItemStack
        });
    }

    hasConfigureInteraction() {
        return true;
    }

    onConfigureInteraction(container, blockLocalizationKey) {
        const observableWildcard = new ObservableNumber(0, { clientWritable: true });
        const observableTakeCopies = new ObservableNumber(0, { clientWritable: true });
        const dropdownItems = this.getDropdownItems(container);
        const dropdownOptions = {
            description: { translate: 'rules.quickFillContainer.menu.wildcard.description' }
        };
        const sliderOptions = {
            description: { translate: 'rules.quickFillContainer.menu.takecopies.description' },
            step: 1
        };
        
        const form = new CustomForm(this.player, { translate: 'rules.quickFillContainer.menu.title' });
        form.dropdown({ translate: 'rules.quickFillContainer.menu.wildcard' }, observableWildcard, dropdownItems, dropdownOptions);
        form.slider({ translate: 'rules.quickFillContainer.menu.takecopies' }, observableTakeCopies, 0, 64, sliderOptions);
        form.spacer();
        form.button({ translate: 'rules.quickFillContainer.menu.apply' }, () => {
            form.close();
            this.#onAppliedCopy(container, { observableWildcard, observableTakeCopies, dropdownItems }, blockLocalizationKey)
        });
        form.closeButton();
        form.show();
    }

    getDropdownItems(container) {
        const items = [];
        for (let i = 0; i < container.size; i++) {
            const itemStack = container.getItem(i);
            if (itemStack)
                items.push(itemStack);
        }
        return items.reduce((uniqueItems, item) => {
            if (!uniqueItems.some(entry => entry.label === item.typeId))
                uniqueItems.push({ label: item.typeId, value: uniqueItems.length });
            return uniqueItems;
        }, [{ label: 'None', value: 0 }]);
    }

    #onAppliedCopy(container, { observableWildcard, observableTakeCopies, dropdownItems }, blockLocalizationKey) {
        this.clipboard.copy(container);
        const selectedOption = dropdownItems.find(option => option.value === observableWildcard.getData());
        const wildcardTypeId = selectedOption?.value === 0 ? void 0 : selectedOption?.label;
        this.clipboard.setWildcardTypeId(wildcardTypeId);
        this.takeCopies = observableTakeCopies.getData();
        this.sendFeedback(this.getCopiedFeedback(container, blockLocalizationKey));
    }

    getFilledFeedback(container, transferredAmount, blockLocalizationKey) {
        return { rawtext: [
            { translate: 'rules.quickFillContainer.filled.clipboard', with: { rawtext: [{ translate: blockLocalizationKey }] } },
            { text: ` (${transferredAmount})`}
        ]};
    }

    getTakenFeedback(container, transferredAmount, blockLocalizationKey, copiesTaken) {
        return { rawtext: [
            { translate: 'rules.quickFillContainer.taken.clipboard', with: { rawtext: [{ text: String(copiesTaken) }, { translate: blockLocalizationKey }] } },
            { text: ` (${transferredAmount})`}
        ]};
    }

    getCopiedFeedback(container, blockLocalizationKey) {
        return { rawtext: [
            { translate: 'rules.quickFillContainer.saved.clipboard', with: { rawtext: [{ translate: blockLocalizationKey }] } },
            { text: ` (${container.size})`}
        ]};
    }

    getNothingFilledFeedback(blockLocalizationKey) {
        return { rawtext: [
            { translate: 'rules.quickFillContainer.filled.empty', with: { rawtext: [{ translate: blockLocalizationKey }] } }
        ]};
    }
}