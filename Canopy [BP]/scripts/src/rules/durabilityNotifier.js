import { Rule } from 'lib/canopy/Canopy';
import { world, GameMode, system, EquipmentSlot } from '@minecraft/server';

const ACTIVE_DURABILITY = 2;

const rule = new Rule({
    category: 'Rules',
    identifier: 'durabilityNotifier',
    description: { translate: 'rules.durabilityNotifier', with: [ACTIVE_DURABILITY.toString()] },
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
    durabilityClink(event.player, event.itemStackBeforeBreak, event.itemStackAfterBreak);
});

world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    durabilityClink(event.player, event.beforeItemStack, event.itemStack);
});

world.afterEvents.playerInteractWithEntity.subscribe((event) => {
    durabilityClink(event.player, event.beforeItemStack, event.itemStack);
});

function durabilityClink(player, beforeItemStack, itemStack) {
    if (!Rule.getNativeValue(rule.getID()) || !player || !itemStack || !beforeItemStack
        || player.getGameMode() === GameMode.creative
        || !usedDurability(beforeItemStack, itemStack)
    ) return;
    const durability = getRemainingDurability(itemStack);
    if (durability <= ACTIVE_DURABILITY) {
        const pitch = 1 - (durability/5);
        player.playSound('note.xylophone', { pitch });
        player.onScreenDisplay.setActionBar({ translate: 'rules.durabilityNotifier.alert', with: [String(durability)] });
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
