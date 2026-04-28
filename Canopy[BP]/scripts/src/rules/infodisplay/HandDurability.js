import { EntityComponentTypes, EquipmentSlot, ItemComponentTypes } from '@minecraft/server';
import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

export class HandDurability extends InfoDisplayTextElement {
    player;

    constructor(player, displayLine) {
        const ruleData = {
            identifier: 'handDurability',
            description: { translate: 'rules.infoDisplay.handDurability' }
        };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const durabilityComponent = this.tryGetDurabilityComponent();
        if (!durabilityComponent)
            return { text: '' };
        return { translate: 'rules.infoDisplay.handDurability.display', with: [this.getFormattedRatio(durabilityComponent)] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    tryGetDurabilityComponent() {
        const equippable = this.player.getComponent(EntityComponentTypes.Equippable);
        const itemStack = equippable?.getEquipment(EquipmentSlot.Mainhand);
        if (!itemStack)
            return void 0;
        return itemStack.getComponent(ItemComponentTypes.Durability) || void 0;
    }

    getFormattedRatio(durabilityComponent) {
        const max = durabilityComponent.maxDurability;
        const remaining = max - durabilityComponent.damage;
        const color = this.getDurabilityColor(remaining / max);
        return `${color}${remaining}§7/§a${max}§r`;
    }

    getDurabilityColor(ratio) {
        if (ratio >= 0.5) return '§a';
        if (ratio >= 0.1) return '§e';
        return '§c';
    }
}
