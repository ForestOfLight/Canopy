import { EntityComponentTypes, ItemComponentTypes, system } from "@minecraft/server";
import { forceShow, titleCase } from "../../include/utils";
import { ChestFormData } from "../../lib/chestui/forms";

class InventoryUI {
    target;

    constructor(target) {
        this.target = target;
    }

    show(player) {
        system.run(() => {
            forceShow(player, this.buildInventoryUI());
        });
    }

    buildInventoryUI() {
        const numSlots = this.getInventorySize();
        const form = new ChestFormData(numSlots);
        form.title(this.formatContainerName());
        for (let slotNum = 0; slotNum < numSlots; slotNum++)
            this.buildSlotButton(form, slotNum);
        return form;
    }

    buildSlotButton(form, slotNum) {
        const itemStack = this.getItemStackFromSlot(slotNum);
        if (!itemStack) return;
        form.button(
            slotNum,
            this.formatItemName(itemStack),
            this.formatItemDescription(itemStack),
            itemStack.typeId,
            itemStack.amount,
            this.getDurabilityPercentage(itemStack),
            this.isEnchanted(itemStack)
        );
    }

    getItemStackFromSlot(slot) {
        return this.getInventory().container.getItem(slot);
    }

    getInventorySize() {
        return this.getInventory().container.size;
    }

    getInventory() {
        let inventory;
        try {
            inventory = this.target.getComponent(EntityComponentTypes.Inventory);
        } catch {
            throw new Error('[Canopy] Failed to get inventory component. The entity may be unloaded or removed.');
        }
        if (!inventory)
            throw new Error('[Canopy] No inventory component found for the target entity.');
        return inventory;
    }

    formatContainerName() {
        if (this.target.typeId === 'minecraft:player') 
		    return `§o${this.target.name}§r`;
        return { translate: this.target.localizationKey } || this.target.typeId;
    }

    formatItemName(itemStack) {
        if (itemStack.nameTag)
            return `§o${itemStack.nameTag}`;
        return { rawtext: [{ translate: itemStack.localizationKey }] } || itemStack.typeId;
    }

    formatItemDescription(itemStack) {
        const itemDesc = this.formatEnchantments(itemStack)
        return `§7${itemDesc}`;
    }

    formatEnchantments(itemStack) {
        const enchantments = itemStack.getComponent(ItemComponentTypes.Enchantable)?.getEnchantments();
        if (!enchantments)
            return [];
        return enchantments.map(enchantment => {
            const enchantmentName = titleCase(enchantment.type.id.replace('minecraft:', ''));
            return `${enchantmentName} ${enchantment.level}`;
        });
    }

    getDurabilityPercentage(itemStack) {
        const durabilityComponent = itemStack.getComponent(ItemComponentTypes.Durability);
        if (!durabilityComponent)
            return void 0;
        return (durabilityComponent.maxDurability - durabilityComponent.damage) / durabilityComponent.maxDurability * 100;
    }

    isEnchanted(itemStack) {
        const enchantableComponent = itemStack.getComponent(ItemComponentTypes.Enchantable);
        return enchantableComponent && enchantableComponent.getEnchantments().length > 0;
    }
}

export { InventoryUI };