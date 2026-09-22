import { InventoryUtils } from "../InventoryUtils";
import { QuickFillContainerPolicy } from "./QuickFillContainerPolicy";

export class QuickFillClipboardExecutor {
    static applyCreative(block, container, clipboard) {
        if (!this.canApply(block, container, clipboard))
            return { changedSlots: 0, incompatible: true };

        let changedSlots = 0;
        let skippedSlots = this.getNarrowedSlotCount(container, clipboard);
        const slotCount = Math.min(clipboard.getSlotCount(), container.size);
        for (let slot = 0; slot < slotCount; slot++) {
            const result = this.applyCreativeSlot(block, container, clipboard, slot);
            changedSlots += result.changedSlots;
            skippedSlots += result.skippedSlots;
        }
        return { changedSlots, skippedSlots };
    }

    static applyCreativeSlot(block, container, clipboard, slot) {
        const desired = clipboard.resolveSlot(slot);
        const current = container.getItem(slot);

        if (!desired) {
            if (!current)
                return { changedSlots: 0, skippedSlots: 0 };

            try {
                container.setItem(slot, null);
                return { changedSlots: 1, skippedSlots: 0 };
            } catch {
                return { changedSlots: 0, skippedSlots: 1 };
            }
        }

        if (!QuickFillContainerPolicy.canInsertItem(block, desired, slot))
            return { changedSlots: 0, skippedSlots: 1 };
        if (current && InventoryUtils.itemsMatch(current, desired) && current.amount === desired.amount)
            return { changedSlots: 0, skippedSlots: 0 };

        try {
            container.setItem(slot, desired.clone());
            return { changedSlots: 1, skippedSlots: 0 };
        } catch {
            return { changedSlots: 0, skippedSlots: 1 };
        }
    }

    static applySurvival(playerContainer, block, container, clipboard) {
        if (!playerContainer || !this.canApply(block, container, clipboard))
            return { changedSlots: 0, incompatible: true };

        let changedSlots = 0;
        let skippedSlots = this.getNarrowedSlotCount(container, clipboard);
        const slotCount = Math.min(clipboard.getSlotCount(), container.size);
        for (let slot = 0; slot < slotCount; slot++) {
            const result = this.applySurvivalSlot(playerContainer, block, container, clipboard, slot);
            changedSlots += result.changedSlots;
            skippedSlots += result.skippedSlots;
        }
        return { changedSlots, skippedSlots };
    }

    static applySurvivalSlot(playerContainer, block, container, clipboard, slot) {
        const desired = clipboard.resolveSlot(slot);
        if (!desired)
            return { changedSlots: 0, skippedSlots: 0 };
        if (!QuickFillContainerPolicy.canInsertItem(block, desired, slot))
            return { changedSlots: 0, skippedSlots: 1 };

        const current = container.getItem(slot);
        if (current && !InventoryUtils.itemsMatch(current, desired))
            return { changedSlots: 0, skippedSlots: 1 };

        const amount = desired.amount - (current?.amount ?? 0);
        if (amount <= 0)
            return { changedSlots: 0, skippedSlots: 0 };

        const availableAmount = InventoryUtils.getAvailableAmount(playerContainer, desired);
        if (!availableAmount)
            return { changedSlots: 0, skippedSlots: 1 };

        const suppliedAmount = Math.min(amount, availableAmount);
        const requirement = { slot, itemStack: desired, amount: suppliedAmount };
        const changedSlots = this.applyRequirement(playerContainer, container, requirement);
        return {
            changedSlots,
            skippedSlots: changedSlots && suppliedAmount === amount ? 0 : 1
        };
    }

    static applyRequirement(playerContainer, container, requirement) {
        const supplied = InventoryUtils.takeItems(playerContainer, requirement.itemStack, requirement.amount);
        if (!supplied)
            return 0;

        const current = container.getItem(requirement.slot);
        const replacement = current ? InventoryUtils.mergeStacks(current, supplied) : supplied;
        try {
            container.setItem(requirement.slot, replacement);
            return 1;
        } catch {
            playerContainer.addItem(supplied);
            return 0;
        }
    }

    static remove(playerContainer, block, container, clipboard) {
        if (!playerContainer || !this.canApply(block, container, clipboard))
            return { changedSlots: 0, incompatible: true };

        let changedSlots = 0;
        for (let slot = 0; slot < Math.min(clipboard.getSlotCount(), container.size); slot++)
            changedSlots += this.removeSlot(playerContainer, block, container, clipboard, slot);
        return { changedSlots };
    }

    static removeSlot(playerContainer, block, container, clipboard, slot) {
        if (!QuickFillContainerPolicy.canUseSlot(block, slot))
            return 0;

        const desired = clipboard.resolveSlot(slot);
        const current = container.getItem(slot);
        if (!desired || !current || !InventoryUtils.itemsMatch(current, desired))
            return 0;

        const requestedAmount = Math.min(current.amount, desired.amount);
        const removed = current.clone();
        removed.amount = requestedAmount;

        const untransferred = playerContainer.addItem(removed);
        const transferredAmount = requestedAmount - (untransferred?.amount ?? 0);
        if (transferredAmount <= 0)
            return 0;

        if (current.amount === transferredAmount) {
            container.setItem(slot, null);
        } else {
            const remaining = current.clone();
            remaining.amount -= transferredAmount;
            container.setItem(slot, remaining);
        }
        return 1;
    }

    static canApply(block, container, clipboard) {
        return !!block && !!container && !!clipboard && clipboard.isCompatibleWith(block, container);
    }

    static getNarrowedSlotCount(container, clipboard) {
        return Math.max(clipboard.getSlotCount() - container.size, 0);
    }
}
