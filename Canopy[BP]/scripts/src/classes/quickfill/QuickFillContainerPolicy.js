import { EntityComponentTypes } from "@minecraft/server";
export class QuickFillContainerPolicy {
    static SpecialShapes = Object.freeze({
        'minecraft:furnace': 'furnace:3',
        'minecraft:lit_furnace': 'furnace:3',
        'minecraft:smoker': 'smoker:3',
        'minecraft:lit_smoker': 'smoker:3',
        'minecraft:blast_furnace': 'blast_furnace:3',
        'minecraft:lit_blast_furnace': 'blast_furnace:3',
        'minecraft:brewing_stand': 'brewing:5'
    });

    static SupportedEntityStorageTypes = new Set([
        'minecraft:donkey',
        'minecraft:mule',
        'minecraft:llama',
        'minecraft:trader_llama'
    ]);
    static NonAliveEntityStorageContainerTypes = new Set([
        'minecart_chest',
        'minecart_hopper',
        'chest_boat'
    ]);

    static #getEntityInventoryComponent(entity) {
        if (!this.SupportedEntityStorageTypes.has(entity?.typeId))
            return;

        const inventory = entity.getComponent(EntityComponentTypes.Inventory);
        if (!inventory?.container || inventory.containerType !== 'horse')
            return;
        if (!entity.hasComponent(EntityComponentTypes.IsChested))
            return;

        return inventory;
    }

    static getEntityContainer(entity) {
        return this.#getEntityInventoryComponent(entity)?.container;
    }

    static getEntityCargoSlotCount(entity) {
        const inventory = this.#getEntityInventoryComponent(entity);
        if (!inventory)
            return 0;

        const maxCargoSlots = Math.max(inventory.container.size - 1, 0);
        if (entity.typeId === 'minecraft:donkey' || entity.typeId === 'minecraft:mule')
            return maxCargoSlots;

        const strength = entity.getComponent(EntityComponentTypes.Strength)?.value;
        if (!Number.isFinite(strength) || !Number.isFinite(inventory.additionalSlotsPerStrength))
            return 0;

        return Math.min(strength * inventory.additionalSlotsPerStrength, maxCargoSlots);
    }
    static getInteractableEntityContainer(entity) {
        const aliveContainer = this.getEntityContainer(entity);
        if (aliveContainer)
            return aliveContainer;

        const inventory = entity?.getComponent(EntityComponentTypes.Inventory);
        if (!inventory?.container || !this.NonAliveEntityStorageContainerTypes.has(inventory.containerType))
            return;

        return inventory.container;
    }

    static getShape(block, container) {
        if (!block || !container)
            return;
        return this.SpecialShapes[block.typeId] ?? `generic:${container.size}`;
    }

    static isCompatible(sourceShape, targetShape) {
        if (!sourceShape || !targetShape)
            return false;
        if (sourceShape.startsWith('generic:') && targetShape.startsWith('generic:'))
            return true;
        return sourceShape === targetShape;
    }

    static FurnaceShapes = new Set(['furnace:3', 'smoker:3', 'blast_furnace:3']);
    static ClipboardOnlyShapes = new Set(['furnace:3', 'smoker:3', 'blast_furnace:3', 'brewing:5']);

    static isClipboardOnly(block) {
        return this.ClipboardOnlyShapes.has(this.SpecialShapes[block?.typeId]);
    }

    static canUseSlot(block, slot) {
        if (!block)
            return false;

        if (this.SupportedEntityStorageTypes.has(block.typeId)) {
            const cargoSlotCount = this.getEntityCargoSlotCount(block);
            return cargoSlotCount > 0 && (slot === undefined || (slot >= 1 && slot <= cargoSlotCount));
        }

        return !this.FurnaceShapes.has(this.SpecialShapes[block.typeId]) || slot !== 2;
    }

    static getClipboardSlotCount(block, container) {
        if (!block || !container)
            return 0;
        if (this.SupportedEntityStorageTypes.has(block.typeId))
            return this.getEntityCargoSlotCount(block);
        return this.FurnaceShapes.has(this.SpecialShapes[block.typeId]) ? Math.min(2, container.size) : container.size;
    }

    static getClipboardContainerSlot(block, slot) {
        return this.SupportedEntityStorageTypes.has(block?.typeId) ? slot + 1 : slot;
    }

    static canInsertItem(block, itemStack, slot) {
        if (!itemStack || !this.canUseSlot(block, slot))
            return false;
        if (block.typeId.includes('shulker_box') && itemStack.typeId.includes('shulker_box'))
            return false;
        return true;
    }
}
