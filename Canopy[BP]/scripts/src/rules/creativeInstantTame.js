import { BooleanRule, Rules } from "../../lib/canopy/Canopy";
import { world, GameMode, EntityComponentTypes } from "@minecraft/server";

new BooleanRule({
    category: 'Rules',
    identifier: 'creativeInstantTame',
    description: { translate: 'rules.creativeInstantTame' }
});


world.afterEvents.playerInteractWithEntity.subscribe((event) => {
    if (!Rules.getNativeValue('creativeInstantTame') || event.player?.getGameMode() !== GameMode.Creative)
        return;
    const tameable = event.target?.getComponent(EntityComponentTypes.Tameable);
    if (tameable !== void 0 && isUsingTameItem(tameable.getTameItems, event.beforeItemStack)) {
        tameable.tame(event.player);
        return;
    }
    const tameMount = event.target?.getComponent(EntityComponentTypes.TameMount);
    if (tameMount !== void 0)
        tameMount.tameToPlayer(true, event.player);
});

function isUsingTameItem(tameItemStacks, playeritemStack) {
    return tameItemStacks.some(stack => stack.typeId === playeritemStack?.typeId);
}
