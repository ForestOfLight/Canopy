import { Rule, Rules} from "../../lib/canopy/Canopy";
import { world, GameMode } from '@minecraft/server';

const ACTIVE_DURABILITY = 2;
const ADDITIONAL_DURABILITIES = [20];

const rule = new Rule({
    category: 'Rules',
    identifier: 'durabilityNotifier',
    description: { translate: 'rules.durabilityNotifier', with: [ACTIVE_DURABILITY.toString()] }
});

world.afterEvents.playerBreakBlock.subscribe((event) => durabilityClink(event.player, event.itemStackBeforeBreak, event.itemStackAfterBreak));
world.afterEvents.playerInteractWithBlock.subscribe((event) => durabilityClink(event.player, event.beforeItemStack, event.itemStack));
world.afterEvents.playerInteractWithEntity.subscribe((event) => durabilityClink(event.player, event.beforeItemStack, event.itemStack));

function durabilityClink(player, beforeItemStack, itemStack) {
    if (!Rules.getNativeValue(rule.getID()) || !player || !itemStack || !beforeItemStack
        || player.getGameMode() === GameMode.creative
        || !usedDurability(beforeItemStack, itemStack)
    ) return;
    const durability = getRemainingDurability(itemStack);
    if (ADDITIONAL_DURABILITIES.includes(durability)) 
        showNotification(player, durability);
    
    if (durability <= ACTIVE_DURABILITY) {
        const pitch = 1 - (durability/5);
        showNotification(player, durability, pitch);
    }
}

function usedDurability(beforeItemStack, afterItemStack) {
    return afterItemStack.hasComponent('durability') && beforeItemStack.hasComponent('durability')
        && (beforeItemStack.getComponent('durability').damage < afterItemStack.getComponent('durability').damage);
}

function getRemainingDurability(itemStack) {
    const durabilityComponent = itemStack.getComponent('durability');
    if (!durabilityComponent) return undefined;
    return durabilityComponent.maxDurability - durabilityComponent.damage;
}

function showNotification(player, durability, pitch = undefined) {
    if (pitch !== undefined)
        player.playSound('note.xylophone', { pitch });
    player.onScreenDisplay.setActionBar({ translate: 'rules.durabilityNotifier.alert', with: [String(durability)] });
}

export { usedDurability, getRemainingDurability };
