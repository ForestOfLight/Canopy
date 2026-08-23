import { EquipmentSlot } from "@minecraft/server";

export class UnderstudyStorageView {
    static #EQUIPMENT_SLOTS = [...Object.values(EquipmentSlot).filter(slotName => slotName !== EquipmentSlot.Mainhand)];

    #inventory;
    #equippable;

    constructor(inventoryContainer, equippable) {
        this.#inventory = inventoryContainer;
        this.#equippable = equippable;
    }

    get size() {
        if (this.#equippable === void 0)
            return this.#inventory.size;
        return this.#inventory.size + UnderstudyStorageView.#EQUIPMENT_SLOTS.length;
    }

    getItem(slotIndex) {
        const equipmentSlot = this.#resolveEquipmentSlot(slotIndex);
        if (equipmentSlot === void 0)
            return this.#inventory.getItem(slotIndex);
        return this.#equippable.getEquipment(equipmentSlot);
    }

    setItem(slotIndex, itemStack) {
        const equipmentSlot = this.#resolveEquipmentSlot(slotIndex);
        if (equipmentSlot !== void 0)
            return void this.#equippable.setEquipment(equipmentSlot, itemStack);
        if (slotIndex < this.#inventory.size)
            this.#inventory.setItem(slotIndex, itemStack);
    }

    #resolveEquipmentSlot(slotIndex) {
        if (this.#equippable === void 0 || slotIndex < this.#inventory.size)
            return void 0;
        return UnderstudyStorageView.#EQUIPMENT_SLOTS[slotIndex - this.#inventory.size];
    }
}
