import { EntityComponentTypes, GameMode } from "@minecraft/server";
import { ItemClipboard } from "../ItemClipboard";
import { CustomForm, ObservableNumber } from "@minecraft/server-ui";
import { quickFillModes } from "./QuickFillModes";

export class ClipboardMode {
    player;
    clipboard;
    takeCopies = 0;

    constructor(player) {
        this.player = player;
        this.playerContainer = player.getComponent(EntityComponentTypes.Inventory)?.container;
        this.clipboard = new ItemClipboard();
    }

    destroy() {}

    get name() {
        return quickFillModes.CLIPBOARD.name;
    }

    onFillInteraction(container, heldItemStack, blockLocalizationKey) {
        const transferredAmount = this.player.getGameMode() === GameMode.Creative
            ? this.clipboard.insertIntoEmptySlotsWithoutCost(container, heldItemStack)
            : this.clipboard.transfer(this.playerContainer, container, heldItemStack).transferredAmount;
        if (transferredAmount === 0 && container.emptySlotsCount === 0)
            this.sendContainerFullFeedback(blockLocalizationKey);
        else if (transferredAmount === 0)
            this.sendNothingFilledFeedback(blockLocalizationKey);
        else
            this.sendFilledFeedback(container, blockLocalizationKey);
    }

    onTakeInteraction(container, heldItemStack, blockLocalizationKey) {
        if (this.clipboard.isEmpty) {
            this.sendNothingTakenFeedback(blockLocalizationKey);
            return;
        }
        let transferredAmount = 0;
        if (this.takeCopies === 0) {
            let lastTransferCompleted = true;
            while (lastTransferCompleted) {
                const result = this.clipboard.transferLikeVanilla(container, this.playerContainer, heldItemStack);
                transferredAmount += result.transferredAmount;
                lastTransferCompleted = result.completed;
            }
        } else {
            for (let i = 0; i < this.takeCopies; i++)
                transferredAmount += this.clipboard.transferLikeVanilla(container, this.playerContainer, heldItemStack).transferredAmount;
        }
        if (transferredAmount === 0)
            this.sendNothingTakenFeedback(blockLocalizationKey);
        else
            this.sendTakenFeedback(container, blockLocalizationKey);
    }

    hasConfigureInteraction() {
        return true;
    }

    onConfigureInteraction(container, blockLocalizationKey) {
        const form = new CustomForm(this.player, { translate: 'rules.quickFillContainer.menu.title' });

        const observableWildcard = new ObservableNumber(0, { clientWritable: true });
        const dropdownOptions = {
            description: { translate: 'rules.quickFillContainer.menu.wildcard.description' }
        };
        const dropdownItems = this.getDropdownItems(container);
        form.dropdown({ translate: 'rules.quickFillContainer.menu.wildcard' }, observableWildcard, dropdownItems, dropdownOptions);

        const observableTakeCopies = new ObservableNumber(0, { clientWritable: true });
        const sliderOptions = {
            description: { translate: 'rules.quickFillContainer.menu.takecopies.description' },
            step: 1
        };
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
        this.sendCopiedFeedback(container, blockLocalizationKey);
    }

    sendFilledFeedback(container, blockLocalizationKey) {
        const fullSlotsCount = container.size - container.emptySlotsCount;
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.filled.clipboard', with: { rawtext: [{ translate: blockLocalizationKey }] } },
            { text: ` (${fullSlotsCount}/${container.size})`}
        ]});
    }

    sendTakenFeedback(container, blockLocalizationKey) {
        const fullSlotsCount = container.size - container.emptySlotsCount;
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.taken.clipboard', with: { rawtext: [{ translate: blockLocalizationKey }] } },
            { text: ` (${fullSlotsCount}/${container.size})`}
        ]});
    }

    sendCopiedFeedback(container, blockLocalizationKey) {
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.saved.clipboard', with: { rawtext: [{ translate: blockLocalizationKey }] } },
            { text: ` (${container.size}/${container.size})`}
        ]});
    }

    sendContainerFullFeedback(blockLocalizationKey) {
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.filled.full', with: { rawtext: [{ translate: blockLocalizationKey }] } }
        ]});
    }

    sendNothingFilledFeedback(blockLocalizationKey) {
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.filled.empty', with: { rawtext: [{ translate: blockLocalizationKey }] } }
        ]});
    }

    sendNothingTakenFeedback(blockLocalizationKey) {
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.taken.empty', with: { rawtext: [{ translate: blockLocalizationKey }] } }
        ]});
    }
}