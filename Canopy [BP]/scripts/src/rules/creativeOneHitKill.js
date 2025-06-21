import { Rule, Rules } from "../../lib/canopy/Canopy";
import { world, InputButton, ButtonState, GameMode } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'creativeOneHitKill',
    description: { translate: 'rules.creativeOneHitKill' }
});

world.afterEvents.entityHitEntity.subscribe((event) => {
    if (!Rules.getNativeValue('creativeOneHitKill') || event.damagingEntity?.typeId !== 'minecraft:player') return;
    if (!event.hitEntity) return;
    const player = event.damagingEntity;
    if (player.getGameMode() === GameMode.Creative) {
        if (player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed) {
            player.dimension.getEntities({ location: event.hitEntity.location, maxDistance: 3 }).forEach(entity => {
                if (['item', 'player', 'experience_orb'].includes(entity.typeId.replace('minecraft:', ''))) return;
                entity?.kill();
            });
        } else {
            if (event.hitEntity?.typeId === 'minecraft:player') return;
            event.hitEntity?.kill();
        }
    }
});