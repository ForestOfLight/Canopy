import { Command } from "../../lib/canopy/Canopy";
import { titleCase, getRaycastResults, getClosestTarget, parseName, stringifyLocation, forceShow, populateItems } from "../../include/utils";
import { ChestFormData } from "../../lib/chestui/forms.js"

const MAX_DISTANCE = 6*16;
const currentQuery = {};

new Command({
    name: 'peek',
    description: { translate: 'commands.peek' },
    usage: 'peek [query]',
    args: [
        { type: 'string', name: 'itemQuery' }
    ],
    callback: peekCommand
});

function peekCommand(sender, args) {
    const { itemQuery } = args;
    
    updateQueryMap(sender, itemQuery);
    const target = getTarget(sender);
    if (!target) return;
    const inventory = getInventory(sender, target);
    if (!inventory) return;

    showInventoryUI(sender, target, inventory, itemQuery);
}

function updateQueryMap(sender, itemQuery) {
    const oldQuery = currentQuery[sender.name];
    if ([null, undefined].includes(oldQuery) && itemQuery === null)
        return;
    if (itemQuery === null && ![null, undefined].includes(oldQuery)) {
        currentQuery[sender.name] = null;
        sender.sendMessage({ translate: 'commands.peek.query.cleared' });
        return;
    } 
    currentQuery[sender.name] = itemQuery;
    sender.sendMessage({ translate: 'commands.peek.query.set', with: [itemQuery] });   
}

function getTarget(sender) {
    const {blockRayResult, entityRayResult} = getRaycastResults(sender, MAX_DISTANCE);
    if (!blockRayResult && !entityRayResult[0])
        return sender.sendMessage({ translate: 'generic.target.notfound' });
    const targetEntity = getClosestTarget(sender, blockRayResult, entityRayResult);
    const targetData = {
        name: parseName(targetEntity),
        entity: targetEntity,
    };
    return targetData;
}

function getInventory(sender, target) {
    let inventory;
    try {
        inventory = target.entity.getComponent('inventory');
    } catch {
        return sender.sendMessage({ translate: 'commands.peek.fail.unloaded', with: [stringifyLocation(target.entity.location, 0)] });
    }
    if (!inventory)
        return sender.sendMessage({ translate: 'commands.peek.fail.noinventory', with: [target.name, stringifyLocation(target.entity.location, 0)] });
    return inventory;
}

export function showInventoryUI(sender, target, inventory, itemQuery) {
    forceShow(sender, buildInventoryUI(target, inventory, itemQuery));
}

function buildInventoryUI(target, inventory, itemQuery) {
    const numSlots = inventory.container.size;
    const form = new ChestFormData(numSlots);
    form.title(formatContainerName(target.name));
    for (let slotNum = 0; slotNum < numSlots; slotNum++) {
        const itemStack = inventory.container.getItem(slotNum);
        if (!itemStack) continue;
        // if (itemQuery && itemName.includes(itemQuery)) {
            // format it differently
        // } else {
        const itemName = formatItemName(itemStack);
        const itemDesc = formatItemDescription(itemStack);
        const durabilityComponent = itemStack.getComponent('durability');
        let durabilityRatio = undefined;
        if (durabilityComponent && durabilityComponent.damage !== 0)
            durabilityRatio = (durabilityComponent.maxDurability - durabilityComponent.damage) / durabilityComponent.maxDurability * 100;
        const isEnchanted = itemStack.getComponent('enchantable')?.getEnchantments().length > 0;
        form.button(slotNum, itemName, itemDesc, itemStack.typeId, itemStack.amount, undefined, isEnchanted);
        // }
    }
    return form;
}

function formatContainerName(name) {
    return titleCase(name.replace('minecraft:', ''));
}

function formatItemName(itemStack) {
    if (itemStack.nameTag)
        return `§o${itemStack.nameTag}`;
    return titleCase(itemStack.typeId.replace('minecraft:', ''));
}

function formatItemDescription(itemStack) {
    const enchantments = itemStack.getComponent('enchantable')?.getEnchantments();
    if (!enchantments)
        return [];
    const itemDesc = enchantments.map(enchantment => {
        const enchantmentName = titleCase(enchantment.type.id.replace('minecraft:', ''));
        return `§7${enchantmentName} ${enchantment.level}`;
    });
    return itemDesc;
}

export { currentQuery };
