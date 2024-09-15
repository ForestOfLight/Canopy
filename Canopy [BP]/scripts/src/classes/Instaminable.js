import { EquipmentSlot, system, world } from "@minecraft/server";
import { Rule } from "lib/canopy/Canopy";

const beaconRefreshOffset = new Map();
const BEACON_REFRESH_RATE = 80;

world.afterEvents.effectAdd.subscribe(event => {
    if (event.effect.typeId !== 'haste' || event.entity.typeId !== 'minecraft:player') return;
    beaconRefreshOffset[event.entity.id] = system.currentTick % BEACON_REFRESH_RATE;
});

class Instaminable {
    constructor(litmusCallback, ruleId = null) {
        this.litmusCallback = litmusCallback;
        this.ruleId = ruleId;
        this.init();
    }

    init() {
        world.afterEvents.entityHitBlock.subscribe(async event => {
            if (this.ruleId !== null && await Rule.getValue(this.ruleId) === false) return;
            if (event.damagingEntity.typeId !== 'minecraft:player') return;
            if (this.litmusCallback(event.hitBlock.typeId)) return;
            const player = event.damagingEntity;
            const itemStack = player.getComponent('minecraft:equippable').getEquipment(EquipmentSlot.Mainhand);
            if (this.isEfficiencyFiveNetheritePick(itemStack) && this.hasHasteTwo(player)) {
                const refreshOffset = beaconRefreshOffset[player.id];
                const currentOffset = system.currentTick % BEACON_REFRESH_RATE;
                let duration = refreshOffset > currentOffset ? refreshOffset - currentOffset : BEACON_REFRESH_RATE - currentOffset + refreshOffset;
                if (isNaN(duration))
                    duration = player.getEffect('haste')?.duration;
                console.warn(`Instaminable: ${duration}`);
                if (duration > 0)
                    player.addEffect('haste', duration, { amplifier: 2 });
            }
        });
    }

    isEfficiencyFiveNetheritePick(itemStack) {
        if (itemStack && itemStack.typeId === 'minecraft:netherite_pickaxe') {
            const enchants = itemStack.getComponent('minecraft:enchantable').getEnchantments();
            return enchants.some(enchant => enchant.type.id === 'efficiency' && enchant.level === 5);
        }
        return false;
    }

    hasHasteTwo(player) {
        const haste = player.getEffect('haste');
        return haste?.amplifier == 1;
    }
}

export default Instaminable;