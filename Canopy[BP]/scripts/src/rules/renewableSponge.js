import { BooleanRule, Rules } from "../../lib/canopy/Canopy";
import { world } from "@minecraft/server";

new BooleanRule({
    category: 'Rules',
    identifier: 'renewableSponge',
    description: { translate: 'rules.renewableSponge' },
    wikiDescription: 'When enabled, guardians struck by lightning will transform into elder guardians.'
});

world.afterEvents.entityHurt.subscribe((event) => {
    if (event.hurtEntity?.typeId !== 'minecraft:guardian' || !Rules.getNativeValue('renewableSponge') || event.damageSource.cause !== 'lightning') 
        return;
    const guardian = event.hurtEntity;
    guardian.dimension.spawnEntity('minecraft:elder_guardian', guardian.location);
    guardian.remove();
});