import { BooleanRule, Rules } from "../../lib/canopy/Canopy";
import { world, InputButton, ButtonState, GameMode, EntityComponentTypes } from "@minecraft/server";

new BooleanRule({
    category: 'Rules',
    identifier: 'creativeOneHitKill',
    description: { translate: 'rules.creativeOneHitKill' },
    wikiDescription: 'Allows players in creative to kill entities in one hit. If the player is sneaking, all entities in a small radius will be killed. Does not affect items, xp orbs, or players.'
});

world.afterEvents.entityHitEntity.subscribe((event) => {
    if (!Rules.getNativeValue('creativeOneHitKill') || event.damagingEntity?.typeId !== 'minecraft:player')
        return;
    if (!event.hitEntity)
        return;
    if (isSulfurCubeWithBlockInside(event.hitEntity))
        return;
    const player = event.damagingEntity;
    if (player.getGameMode() === GameMode.Creative) {
        if (player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed) {
            player.dimension.getEntities({ location: event.hitEntity.location, maxDistance: 3 }).forEach(entity => {
                if (['item', 'player', 'experience_orb'].includes(entity.typeId.replace('minecraft:', '')))
                    return;
                entity?.kill();
            });
        } else {
            if (event.hitEntity?.typeId === 'minecraft:player')
                return;
            event.hitEntity?.kill();
        }
    }
});

function isSulfurCubeWithBlockInside(entity) {
    const frictionComponent = entity.getComponent(EntityComponentTypes.FrictionModifier);
    const ageableComponent = entity.getComponent(EntityComponentTypes.Ageable);
    return frictionComponent?.value !== 1 && !ageableComponent;
}