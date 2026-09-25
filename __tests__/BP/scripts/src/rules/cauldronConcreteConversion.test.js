import { it, describe, expect, beforeEach, vi, beforeAll } from "vitest";
import { cauldronConcreteConversion } from "../../../../../Canopy[BP]/scripts/src/rules/cauldronConcreteConversion"
import { Entity, ItemStack, world, Block, FluidType, EntityComponentTypes } from "@minecraft/server";
import { scheduler } from "@forestoflight/minecraft-vitest-mocks";

describe('cauldronConcreteConversion', () => {
    describe('enabled', () => {
        beforeEach(() => {
            vi.clearAllMocks();
            cauldronConcreteConversion.onEnable();
        });

        it('should tag new concrete powder item entities', () => {
            const itemEntityMock = new Entity('minecraft:item');
            itemEntityMock.getComponent.mockReturnValue({ itemStack: new ItemStack('minecraft:concrete_powder') });
            cauldronConcreteConversion.onEntitySpawn({ entity: itemEntityMock });
            expect(itemEntityMock.hasTag(cauldronConcreteConversion.CONCRETE_POWDER_TAG)).toBeTruthy();
        });

        it('should not tag new entities that are not item entities', () => {
            const itemEntityMock = new Entity('minecraft:creeper');
            cauldronConcreteConversion.onEntitySpawn({ entity: itemEntityMock });
            expect(itemEntityMock.hasTag(cauldronConcreteConversion.CONCRETE_POWDER_TAG)).toBeFalsy();
        });

        it('should convert single concrete powder items when in a full water cauldron', () => {
            const itemEntityMock = new Entity('minecraft:item');
            itemEntityMock.getComponent.mockReturnValue({ itemStack: new ItemStack('minecraft:white_concrete_powder') });
            const cauldronMock = new Block('minecraft:cauldron');
            cauldronMock.getComponent.mockReturnValue({ getFluidType: () => FluidType.Water, fillLevel: 6 });
            const overworld = world.getDimension('overworld');
            itemEntityMock.remove = () => overworld.removeEntity(itemEntityMock);
            overworld.addEntity(itemEntityMock);
            cauldronConcreteConversion.onEntitySpawn({ entity: itemEntityMock });
            overworld.getBlock.mockReturnValue(cauldronMock);
            scheduler.advanceTicks(1);
            expect(overworld.getEntities().map((entity) => entity.getComponent(EntityComponentTypes.Item).itemStack.typeId)).toContain('minecraft:white_concrete');
        });

        it('should not convert itemStacks with more than one item', () => {
            const itemEntityMock = new Entity('minecraft:item');
            itemEntityMock.getComponent.mockReturnValue({ itemStack: new ItemStack('minecraft:white_concrete_powder', 64) });
            const cauldronMock = new Block('minecraft:cauldron');
            cauldronMock.getComponent.mockReturnValue({ getFluidType: () => FluidType.Water, fillLevel: 6 });
            const overworld = world.getDimension('overworld');
            itemEntityMock.remove = () => overworld.removeEntity(itemEntityMock);
            overworld.addEntity(itemEntityMock);
            cauldronConcreteConversion.onEntitySpawn({ entity: itemEntityMock });
            overworld.getBlock.mockReturnValue(cauldronMock);
            scheduler.advanceTicks(1);
            expect(overworld.getEntities().map((entity) => entity.getComponent(EntityComponentTypes.Item).itemStack.typeId)).toContain('minecraft:white_concrete_powder');
        });

        it('should not convert items other than concrete powder', () => {
            const itemEntityMock = new Entity('minecraft:item');
            itemEntityMock.getComponent.mockReturnValue({ itemStack: new ItemStack('minecraft:stone') });
            const cauldronMock = new Block('minecraft:cauldron');
            cauldronMock.getComponent.mockReturnValue({ getFluidType: () => FluidType.Water, fillLevel: 6 });
            const overworld = world.getDimension('overworld');
            overworld.addEntity(itemEntityMock);
            overworld.getBlock.mockReturnValue(cauldronMock);
            scheduler.advanceTicks(1);
            expect(overworld.getEntities().map((entity) => entity.getComponent(EntityComponentTypes.Item).itemStack.typeId)).toContain('minecraft:stone');
        });

        it('should not convert if the item entity is not in a water cauldron', () => {
            const itemEntityMock = new Entity('minecraft:item');
            itemEntityMock.getComponent.mockReturnValue({ itemStack: new ItemStack('minecraft:white_concrete_powder') });
            const block = new Block('minecraft:air');
            const overworld = world.getDimension('overworld');
            overworld.addEntity(itemEntityMock);
            cauldronConcreteConversion.onEntitySpawn({ entity: itemEntityMock });
            overworld.getBlock.mockReturnValue(block);
            scheduler.advanceTicks(1);
            expect(overworld.getEntities().map((entity) => entity.getComponent(EntityComponentTypes.Item).itemStack.typeId)).toContain('minecraft:white_concrete_powder');
        });

        it('should not convert if the item entity is not in a full water cauldron', () => {
            const itemEntityMock = new Entity('minecraft:item');
            itemEntityMock.getComponent.mockReturnValue({ itemStack: new ItemStack('minecraft:white_concrete_powder') });
            const cauldronMock = new Block('minecraft:cauldron');
            cauldronMock.getComponent.mockReturnValue({ getFluidType: () => FluidType.Water, fillLevel: 5 });
            const overworld = world.getDimension('overworld');
            itemEntityMock.remove = () => overworld.removeEntity(itemEntityMock);
            overworld.addEntity(itemEntityMock);
            cauldronConcreteConversion.onEntitySpawn({ entity: itemEntityMock });
            overworld.getBlock.mockReturnValue(cauldronMock);
            scheduler.advanceTicks(1);
            expect(overworld.getEntities().map((entity) => entity.getComponent(EntityComponentTypes.Item).itemStack.typeId)).not.toContain('minecraft:white_concrete');
        });

        it('should not convert non-item entites', () => {
            const entityMock = new Entity('minecraft:creeper');
            const cauldronMock = new Block('minecraft:cauldron');
            cauldronMock.getComponent.mockReturnValue({ getFluidType: () => FluidType.Water, fillLevel: 6 });
            const overworld = world.getDimension('overworld');
            scheduler.advanceTicks(1);
            overworld.addEntity(entityMock);
            overworld.getBlock.mockReturnValue(cauldronMock);
            scheduler.advanceTicks(1);
            expect(overworld.getEntities().map((entity) => entity.getComponent(EntityComponentTypes.Item)?.itemStack.typeId).length).toEqual(1);
        });
    });

    describe('disabled', () => {
        beforeAll(() => {
            cauldronConcreteConversion.onDisable();
        });

        it('should not tag new concrete powder item entities', () => {
            cauldronConcreteConversion.onDisable();
            expect(world.afterEvents.entitySpawn.unsubscribe).toHaveBeenCalled();
        })

        it('should not convert single concrete powder items when in water cauldrons', () => {
            const itemEntityMock = new Entity('minecraft:item');
            itemEntityMock.getComponent.mockReturnValue({ itemStack: new ItemStack('minecraft:white_concrete_powder') });
            const cauldronMock = new Block('minecraft:cauldron');
            cauldronMock.getComponent.mockReturnValue({ getFluidType: () => FluidType.Water, fillLevel: 6 });
            const overworld = world.getDimension('overworld');
            itemEntityMock.remove = () => overworld.removeEntity(itemEntityMock);
            overworld.addEntity(itemEntityMock);
            cauldronConcreteConversion.onEntitySpawn({ entity: itemEntityMock });
            overworld.getBlock.mockReturnValue(cauldronMock);
            scheduler.advanceTicks(1);
            expect(overworld.getEntities().map((entity) => entity.getComponent(EntityComponentTypes.Item).itemStack.typeId)).not.toContain('minecraft:white_concrete');
        });
    });
});