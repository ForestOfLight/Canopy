import { GlobalRule, FloatRule } from "../../lib/canopy/Canopy";
import { ItemStack, world } from "@minecraft/server";

class RenewableElytraDropChance extends FloatRule {
    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'renewableElytraDropChance',
            defaultValue: 0,
            valueRange: { range: { min: 0, max: 1 } }
        }));
        this.subscribeToEvents();
    }

    subscribeToEvents() {
        world.afterEvents.entityDie.subscribe(this.onEntityDie.bind(this));
    }

    onEntityDie(event) {
        const entity = event.deadEntity;
        if (entity?.typeId === 'minecraft:phantom' && event.damageSource.damagingProjectile?.typeId === 'minecraft:shulker_bullet') {
            if (Math.random() > this.getNativeValue())
                return;
            entity.dimension.spawnItem(new ItemStack('minecraft:elytra', 1), entity.location);
        }
    }
}

export const renewableElytraDropChance = new RenewableElytraDropChance();