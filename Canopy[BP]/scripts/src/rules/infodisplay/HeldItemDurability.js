import { EntityComponentTypes, EquipmentSlot, ItemComponentTypes } from '@minecraft/server';
import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

export class HeldItemDurability extends InfoDisplayTextElement {
    player;

    constructor(player, displayLine) {
        const ruleData = {
            identifier: 'heldItemDurability',
            description: { translate: 'rules.infoDisplay.heldItemDurability' }
        };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const durability = this.#tryGetDurabilityValues();
        if (!durability)
            return { text: '' };
        return { translate: 'rules.infoDisplay.heldItemDurability.display', with: [this.#getFormattedRatio(durability)] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    #tryGetDurabilityValues() {
        const equippable = this.player.getComponent(EntityComponentTypes.Equippable);
        const itemStack = equippable?.getEquipment(EquipmentSlot.Mainhand);
        if (!itemStack)
            return void 0;
        const durabilityComponent = itemStack.getComponent(ItemComponentTypes.Durability);
        if (!durabilityComponent)
            return void 0;
        return { max: durabilityComponent.maxDurability, damage: durabilityComponent.damage };
    }

    #getFormattedRatio({ max, damage }) {
        const remaining = max - damage;
        const color = this.#getDurabilityColor(remaining / max);
        return `${color}${remaining}§7/§a${max}§r`;
    }

    #getDurabilityColor(ratio) {
        if (ratio >= 0.5) return '§a';
        if (ratio >= 0.1) return '§e';
        return '§c';
    }
}
