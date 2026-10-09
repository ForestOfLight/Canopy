import { EntityComponentTypes } from "@minecraft/server";

export class QuickFillMode {
    player;
    playerContainer;

    constructor(player) {
        this.player = player;
        this.playerContainer = player.getComponent(EntityComponentTypes.Inventory)?.container;
    }

    get name() {
        throw new Error('name must be implemented');
    }

    destroy() {}

    hasConfigureInteraction() {
        return false;
    }

    onFillInteraction() {
        throw new Error('onFillInteraction() must be implemented');
    }

    onTakeInteraction() {
        throw new Error('onTakeInteraction() must be implemented');
    }

    sendFeedback(feedback) {
        this.player.onScreenDisplay.setActionBar(feedback);
    }

    getFillInteractionFeedback(container, transferredAmount, blockLocalizationKey, itemStackLocalizationKey) {
        if (transferredAmount === 0 && container.emptySlotsCount === 0)
            return this.getContainerFullFeedback(blockLocalizationKey);
        if (transferredAmount === 0)
            return this.getNothingFilledFeedback(blockLocalizationKey, itemStackLocalizationKey);
        return this.getFilledFeedback(container, transferredAmount, blockLocalizationKey, itemStackLocalizationKey);
    }

    getTakeInteractionFeedback(container, transferredAmount, blockLocalizationKey, itemStackLocalizationKey) {
        if (transferredAmount === 0 && itemStackLocalizationKey !== undefined && this.#containerHasItem(container, itemStackLocalizationKey))
            return this.getNoSpaceFeedback(blockLocalizationKey, itemStackLocalizationKey);
        if (transferredAmount === 0)
            return this.getNothingTakenFeedback(blockLocalizationKey, itemStackLocalizationKey);
        return this.getTakenFeedback(container, transferredAmount, blockLocalizationKey, itemStackLocalizationKey);
    }

    #containerHasItem(container, itemStackLocalizationKey) {
        for (let i = 0; i < container.size; i++) {
            if (container.getItem(i)?.localizationKey === itemStackLocalizationKey)
                return true;
        }
        return false;
    }

    getFilledFeedback() {
        throw new Error('getFilledFeedback() must be implemented');
    }

    getTakenFeedback() {
        throw new Error('getTakenFeedback() must be implemented');
    }

    getNothingFilledFeedback() {
        throw new Error('getNothingFilledFeedback() must be implemented');
    }

    getContainerFullFeedback(blockLocalizationKey) {
        return { rawtext: [
            { translate: 'rules.quickFillContainer.filled.full', with: { rawtext: [{ translate: blockLocalizationKey }] } }
        ]};
    }

    getNothingTakenFeedback(blockLocalizationKey, itemStackLocalizationKey) {
        if (itemStackLocalizationKey === void 0) {
            return { rawtext: [
                { translate: 'rules.quickFillContainer.taken.empty', with: { rawtext: [{ translate: blockLocalizationKey }] } }
            ]};
        }
        return { rawtext: [
            { translate: 'rules.quickFillContainer.taken.noitem', with: { rawtext: [{ translate: blockLocalizationKey }, { translate: itemStackLocalizationKey }] } }
        ]};
    }

    getNoSpaceFeedback(blockLocalizationKey, itemStackLocalizationKey) {
        return { rawtext: [
            { translate: 'rules.quickFillContainer.taken.nospace', with: { rawtext: [{ translate: blockLocalizationKey }, { translate: itemStackLocalizationKey }] } }
        ]};
    }
}
