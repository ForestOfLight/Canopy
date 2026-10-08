import { EntityComponentTypes, GameMode } from "@minecraft/server";
import { ItemClipboard } from "../ItemClipboard";
import { CustomForm, ObservableNumber } from "@minecraft/server-ui";

export class ClipboardMode {
    player;
    clipboard;
    grabCopies = 0;

    constructor(player) {
        this.player = player;
        this.playerContainer = player.getComponent(EntityComponentTypes.Inventory)?.container;
        this.clipboard = new ItemClipboard();
    }

    destroy() {}

    onFillInteraction(container, heldItemStack) {
        if (this.player.getGameMode() === GameMode.Creative)
            this.clipboard.insertIntoEmptySlotsWithoutCost(container, heldItemStack);
        else
            this.clipboard.transfer(this.playerContainer, container, heldItemStack);
    }

    onGrabInteraction(container, heldItemStack) {
        if (this.clipboard.isEmpty)
            return;
        if (this.grabCopies === 0) {
            let lastTransferSuccessful = true;
            while (lastTransferSuccessful)
                lastTransferSuccessful = this.clipboard.transferLikeVanilla(container, this.playerContainer, heldItemStack);
        } else {
            for (let i = 0; i < this.grabCopies; i++)
                this.clipboard.transferLikeVanilla(container, this.playerContainer, heldItemStack);
        }
    }

    hasConfigureInteraction() {
        return true;
    }

    onConfigureInteraction(container) {
        const form = new CustomForm(this.player, 'rules.quickFillContainer.menu.title');

        const observableWildcard = new ObservableNumber(0, { clientWritable: true });
        const dropdownOptions = {
            description: 'rules.quickFillContainer.menu.wildcard.description'
        };
        const dropdownItems = this.getDropdownItems(container);
        form.dropdown('rules.quickFillContainer.menu.wildcard', observableWildcard, dropdownItems, dropdownOptions);

        const observableGrabCopies = new ObservableNumber(0, { clientWritable: true });
        const sliderOptions = {
            description: 'rules.quickFillContainer.menu.grabcopies.description',
            step: 1
        };
        form.slider('rules.quickFillContainer.menu.grabcopies', observableGrabCopies, 0, 64, sliderOptions);

        form.spacer();
        form.button('rules.quickFillContainer.menu.apply', () => this.#onAppliedCopy(form, container, observableWildcard, observableGrabCopies, dropdownItems));
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

    #onAppliedCopy(form, container, observableWildcard, observableGrabCopies, dropdownItems) {
        form.close();
        this.clipboard.copy(container);
        const selectedOption = dropdownItems.find(option => option.value === observableWildcard.getData());
        const wildcardTypeId = selectedOption?.value === 0 ? void 0 : selectedOption?.label;
        this.clipboard.setWildcardTypeId(wildcardTypeId);
        this.grabCopies = observableGrabCopies.getData();
    }
}