import { world } from "@minecraft/server";
import { Rule } from "lib/canopy/Canopy";

new Rule({
    category: 'Rules',
    identifier: 'creativeOneHitKill',
    description: 'Akkiws creative players to one hit kill any entity. If sneaking, it will also kill nearby entities.',
});

world.afterEvents.entityHitEntity.subscribe((event) => {
    if (!Rule.getNativeValue('creativeOneHitKill') || event.damagingEntity?.typeId !== 'minecraft:player') return;
    const player = event.damagingEntity;
    if (player.getGameMode() === 'creative') {
        if (player.isSneaking) {
            player.dimension.getEntities({ location: event.hitEntity.location, maxDistance: 3 }).forEach(entity => {
                entity.kill();
            });
        } else {
            event.hitEntity.kill();
        }
    }
});