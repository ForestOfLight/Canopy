import { QuickFillContainerPolicy } from "./QuickFillContainerPolicy";

export class QuickFillClipboardExecutor {
    static applyCreative(block, container, clipboard) {
        if (!this.canApply(block, container, clipboard))
            return { changedSlots: 0, incompatible: true };

        let changedSlots = 0;
        for (let slot = 0; slot < clipboard.getSlotCount(); slot++) {
            const desired = clipboard.resolveSlot(slot);
            if (!desired || !QuickFillContainerPolicy.canInsertItem(block, desired, slot))
                continue;
            changedSlots += this.applyCreativeSlot(container, slot, desired);
        }
        return { changedSlots };
    }

    static applyCreativeSlot(container, slot, desired) {
        const current = container.getItem(slot);
        if (current && (!this.itemsMatch(current, desired) || current.amount >= desired.amount))
            return 0;

        try {
            container.setItem(slot, desired.clone());
            return 1;
        } catch {
            return 0;
        }
    }

    static applySurvival(playerContainer, block, container, clipboard) {
        if (!playerContainer || !this.canApply(block, container, clipboard))
            return { changedSlots: 0, incompatible: true };

        const requirements = this.getRequirements(block, container, clipboard);
        if (!this.canSupply(playerContainer, requirements))
            return { changedSlots: 0, insufficient: true };

        return { changedSlots: this.applyRequirements(playerContainer, container, requirements) };
    }

    static applyRequirements(playerContainer, container, requirements) {
        let changedSlots = 0;
        for (const requirement of requirements)
            changedSlots += this.applyRequirement(playerContainer, container, requirement);
        return changedSlots;
    }

    static applyRequirement(playerContainer, container, requirement) {
        const supplied = this.takeItems(playerContainer, requirement.itemStack, requirement.amount);
        if (!supplied)
            return 0;

        const current = container.getItem(requirement.slot);
        const replacement = current ? this.mergeStacks(current, supplied) : supplied;
        try {
            container.setItem(requirement.slot, replacement);
            return 1;
        } catch {
            playerContainer.addItem(supplied);
            return 0;
        }
    }

    static mergeStacks(current, supplied) {
        const replacement = current.clone();
        replacement.amount += supplied.amount;
        return replacement;
    }

    static remove(playerContainer, block, container, clipboard) {
        if (!playerContainer || !this.canApply(block, container, clipboard))
            return { changedSlots: 0, incompatible: true };

        let changedSlots = 0;
        for (let slot = 0; slot < clipboard.getSlotCount(); slot++)
            changedSlots += this.removeSlot(playerContainer, block, container, clipboard, slot);
        return { changedSlots };
    }

    static removeSlot(playerContainer, block, container, clipboard, slot) {
        if (!QuickFillContainerPolicy.canUseSlot(block, slot))
            return 0;

        const desired = clipboard.resolveSlot(slot);
        const current = container.getItem(slot);
        if (!desired || !current || !this.itemsMatch(current, desired))
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

    static getRequirements(block, container, clipboard) {
        const requirements = [];
        for (let slot = 0; slot < clipboard.getSlotCount(); slot++) {
            const desired = clipboard.resolveSlot(slot);
            if (!desired || !QuickFillContainerPolicy.canInsertItem(block, desired, slot))
                continue;

            const current = container.getItem(slot);
            if (current && !this.itemsMatch(current, desired))
                continue;

            const amount = desired.amount - (current?.amount ?? 0);
            if (amount > 0)
                requirements.push({ slot, itemStack: desired, amount });
        }
        return requirements;
    }

    static canSupply(container, requirements) {
        const simulated = [];
        for (let slot = 0; slot < container.size; slot++) {
            const itemStack = container.getItem(slot);
            if (itemStack)
                simulated.push({ itemStack, amount: itemStack.amount });
        }

        for (const requirement of requirements) {
            let remaining = requirement.amount;
            for (const source of simulated) {
                if (!this.itemsMatch(source.itemStack, requirement.itemStack))
                    continue;

                const reserved = Math.min(source.amount, remaining);
                source.amount -= reserved;
                remaining -= reserved;
                if (remaining === 0)
                    break;
            }
            if (remaining > 0)
                return false;
        }
        return true;
    }

    static takeItems(container, template, amount) {
        let remaining = amount;
        let result;
        for (let slot = 0; slot < container.size && remaining > 0; slot++) {
            const source = container.getItem(slot);
            if (!source || !this.itemsMatch(source, template))
                continue;

            const taken = Math.min(source.amount, remaining);
            if (!result)
                result = source.clone();
            result.amount = amount - remaining + taken;
            remaining -= taken;

            if (source.amount === taken) {
                container.setItem(slot, null);
            } else {
                const replacement = source.clone();
                replacement.amount -= taken;
                container.setItem(slot, replacement);
            }
        }
        return remaining === 0 ? result : undefined;
    }

    static itemsMatch(first, second) {
        if (!first || !second)
            return false;
        if (typeof first.isStackableWith === 'function')
            return first.isStackableWith(second);
        return first.typeId === second.typeId;
    }
}
