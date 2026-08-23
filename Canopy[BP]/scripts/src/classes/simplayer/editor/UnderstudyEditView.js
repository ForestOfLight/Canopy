import { EquipmentSlot } from "@minecraft/server";

export const UnderstudyEditViewMode = Object.freeze({
    HotbarAndArmor: "hotbarAndArmor",
    Inventory: "inventory"
});

export class UnderstudyEditView {
    static HOTBAR_SLOT_COUNT = 9;

    static #EQUIPMENT_SLOTS = [
        EquipmentSlot.Head,
        EquipmentSlot.Chest,
        EquipmentSlot.Legs,
        EquipmentSlot.Feet,
        EquipmentSlot.Offhand
    ];

    static #TITLE_KEYS = {
        [UnderstudyEditViewMode.HotbarAndArmor]: "simplayer.editor.view.hotbarAndArmor",
        [UnderstudyEditViewMode.Inventory]: "simplayer.editor.view.inventory"
    };

    #inventory;
    #equippable;
    #viewMode;
    #slots;

    constructor(inventoryContainer, equippable, viewMode) {
        this.#inventory = inventoryContainer;
        this.#equippable = equippable;
        this.#viewMode = UnderstudyEditView.normalizeViewMode(viewMode);
        this.#slots = this.#buildSlots();
    }

    static viewModeFor(isSneaking) {
        if (isSneaking === true)
            return UnderstudyEditViewMode.Inventory;
        return UnderstudyEditViewMode.HotbarAndArmor;
    }

    static normalizeViewMode(viewMode) {
        if (viewMode === UnderstudyEditViewMode.Inventory)
            return UnderstudyEditViewMode.Inventory;
        return UnderstudyEditViewMode.HotbarAndArmor;
    }

    static titleKeyFor(viewMode) {
        return UnderstudyEditView.#TITLE_KEYS[UnderstudyEditView.normalizeViewMode(viewMode)];
    }

    get viewMode() {
        return this.#viewMode;
    }

    get size() {
        return this.#slots.length;
    }

    hasSlot(slotIndex) {
        return this.#slots[slotIndex] !== void 0;
    }

    getItem(slotIndex) {
        const slot = this.#slots[slotIndex];
        if (slot === void 0)
            return void 0;
        if (slot.equipmentSlot === void 0)
            return this.#inventory.getItem(slot.inventorySlot);
        return this.#equippable.getEquipment(slot.equipmentSlot);
    }

    setItem(slotIndex, itemStack) {
        const slot = this.#slots[slotIndex];
        if (slot === void 0)
            return;
        if (slot.equipmentSlot === void 0)
            this.#inventory.setItem(slot.inventorySlot, itemStack);
        else
            this.#equippable.setEquipment(slot.equipmentSlot, itemStack);
    }

    #buildSlots() {
        if (this.#viewMode === UnderstudyEditViewMode.Inventory)
            return this.#buildInventorySlots();
        return this.#buildHotbarAndArmorSlots();
    }

    #buildHotbarAndArmorSlots() {
        const slots = [];
        const hotbarSize = Math.min(UnderstudyEditView.HOTBAR_SLOT_COUNT, this.#inventory.size);
        for (let slotIndex = 0; slotIndex < hotbarSize; slotIndex++)
            slots.push({ inventorySlot: slotIndex });
        if (this.#equippable !== void 0)
            UnderstudyEditView.#EQUIPMENT_SLOTS.forEach(equipmentSlot => slots.push({ equipmentSlot }));
        return slots;
    }

    #buildInventorySlots() {
        const slots = [];
        for (let slotIndex = UnderstudyEditView.HOTBAR_SLOT_COUNT; slotIndex < this.#inventory.size; slotIndex++)
            slots.push({ inventorySlot: slotIndex });
        return slots;
    }
}
