import { BooleanRule, GlobalRule } from "../../lib/canopy/Canopy";
import { system, world, DimensionTypes, ItemStack, FluidType, BlockComponentTypes, EntityComponentTypes } from "@minecraft/server";

export class CauldronConcreteConversion extends BooleanRule {
    CONCRETE_POWDER_TAG = 'canopy:concrete_powder';

    #runner = void 0;

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'cauldronConcreteConversion',
            wikiDescription: 'Singular concrete powder items inside water cauldrons will instantly convert to concrete items.',
            onEnableCallback: () => this.subscribeToEvents(),
            onDisableCallback: () => this.unsubscribeFromEvents()
        }));
        this.onTickBound = this.onTick.bind(this);
        this.onEntitySpawnBound = this.onEntitySpawn.bind(this);
    }

    subscribeToEvents() {
        this.#runner = system.runInterval(this.onTickBound);
        world.afterEvents.entitySpawn.subscribe(this.onEntitySpawnBound);
    }

    unsubscribeFromEvents() {
        if (this.#runner !== void 0) {
            system.clearRun(this.#runner);
            this.#runner = void 0;
        }
        world.afterEvents.entitySpawn.unsubscribe(this.onEntitySpawnBound);
    }

    onTick() {
        DimensionTypes.getAll().forEach((dimensionType) => {
            const dimension = world.getDimension(dimensionType.typeId);
            const concretePowderItemEntities = dimension.getEntities({ type: 'minecraft:item', tags: [this.CONCRETE_POWDER_TAG] });
            for (const itemEntity of concretePowderItemEntities) {
                if (this.isInWaterCauldron(dimension, itemEntity) && this.shouldConvert(itemEntity)) 
                    this.convertToConcrete(dimension, itemEntity);
            }
        });
    }

    onEntitySpawn(event) {
        if (!event.entity.isValid || event.entity?.typeId !== "minecraft:item")
            return;
        const itemStack = event.entity.getComponent(EntityComponentTypes.Item).itemStack;
        if (itemStack && itemStack.typeId.includes('concrete_powder')) 
            event.entity.addTag(this.CONCRETE_POWDER_TAG);
    }

    isInWaterCauldron(dimension, itemEntity) {
        const block = dimension.getBlock(itemEntity.location);
        if (block?.typeId !== 'minecraft:cauldron') 
            return false;
        const fluidContainerComponent = block.getComponent(BlockComponentTypes.FluidContainer);
        if (fluidContainerComponent?.getFluidType() === FluidType.Water && fluidContainerComponent?.fillLevel === 6)
            return true;
        return false;
    }

    shouldConvert(itemEntity) {
        const itemStack = itemEntity.getComponent(EntityComponentTypes.Item)?.itemStack;
        return itemStack?.amount === 1;
    }

    convertToConcrete(dimension, itemEntity) {
        const itemStack = itemEntity.getComponent(EntityComponentTypes.Item).itemStack;
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
}

export const cauldronConcreteConversion = new CauldronConcreteConversion();