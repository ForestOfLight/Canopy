export class QuickFillWildcardResolver {
    static resolveSlot(clipboard, slot, groupItems = []) {
        const literalItem = clipboard?.resolveSlot(slot);
        const group = clipboard?.getWildcardGroup(slot);

        if (group === null)
            return { itemStack: literalItem, unresolved: false };

        const wildcardItem = groupItems[group];
        if (!literalItem || !wildcardItem)
            return { itemStack: undefined, unresolved: true };

        const resolvedItem = wildcardItem.clone();
        resolvedItem.amount = Math.min(literalItem.amount, resolvedItem.maxAmount);

        return { itemStack: resolvedItem, unresolved: false };
    }
}
