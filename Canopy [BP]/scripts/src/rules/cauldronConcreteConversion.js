import { Rule } from "lib/canopy/Canopy";
import { system, world, DimensionTypes, ItemStack, FluidType } from "@minecraft/server";

const CONVERSION_TIME = 20*7;
const CURRENT_CONVERSIONS = {};

new Rule({
    category: 'Rules',
    identifier: 'cauldronConcreteConversion',
    description: { translate: 'rules.cauldronConcreteConversion' },
});

world.afterEvents.entitySpawn.subscribe((event) => {
    if (!Rule.getNativeValue('cauldronConcreteConversion') || event.entity?.typeId !== "minecraft:item" || !event.entity.hasComponent('item')) return;
    const itemStack = event.entity.getComponent('item').itemStack;
    if (itemStack && itemStack.typeId.includes('concrete_powder')) {
        event.entity.addTag('concrete_powder');
    }
});

world.afterEvents.entityRemove.subscribe((event) => {
    if (CURRENT_CONVERSIONS[event.removedEntityId] !== undefined) {
        delete CURRENT_CONVERSIONS[event.removedEntityId];
    }
});

system.runInterval(() => {
    if (!Rule.getNativeValue('cauldronConcreteConversion')) return;
    DimensionTypes.getAll().forEach((dimensionType) => {
        const dimension = world.getDimension(dimensionType.typeId);
        const concretePowderItems = dimension.getEntities({ type: 'minecraft:item', tags: ['concrete_powder'] });
        for (const itemEntity of concretePowderItems) {
            if (isInWaterCauldron(dimension, itemEntity) && isDoneConverting(itemEntity)) {
                convertToConcrete(dimension, itemEntity);
            }
        }
    });
});

function isInWaterCauldron(dimension, itemEntity) {
    const block = dimension.getBlock(itemEntity.location);
    if (block?.typeId !== 'minecraft:cauldron') 
        return false;
    const fluidContainerComponent = block.getComponent('fluidContainer');
    if (fluidContainerComponent.getFluidType() === FluidType.Water && fluidContainerComponent?.fillLevel === 6)
        return true;
}

function isDoneConverting(itemEntity) {
    const entityId = itemEntity.id;
    if (CURRENT_CONVERSIONS[entityId] === undefined)
        CURRENT_CONVERSIONS[entityId] = 0;
    else if (CURRENT_CONVERSIONS[entityId] < CONVERSION_TIME)
        CURRENT_CONVERSIONS[entityId]++;
    else if (CURRENT_CONVERSIONS[entityId] >= CONVERSION_TIME) {
        return true;
    } else {
        return false;
    }
}

function convertToConcrete(dimension, itemEntity) {
    const itemStack = itemEntity.getComponent('item').itemStack;
    const concreteType = itemStack.typeId.replace('_powder', '');
    const amount = itemStack.amount;
    const location = itemEntity.location;
    const velocity = itemEntity.getVelocity();

    itemEntity.remove();
    const newItemEntity = dimension.spawnItem(new ItemStack(concreteType, amount), location);
    newItemEntity.clearVelocity();
    newItemEntity.applyImpulse(velocity);
    dimension.spawnParticle('minecraft:cauldron_explosion_emitter', location);
    dimension.playSound('brush.generic', location);
}