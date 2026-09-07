import { EntityComponentTypes, world } from "@minecraft/server";
import { autoItemPickup } from "../rules/autoItemPickup";
import { carefulBreak } from "../rules/carefulBreak";
import { InventoryUtils } from "./InventoryUtils";

export class FastMine {
    #isBlockTypeCallback;
    #playBreakSoundCallback;

    constructor(blockTypeCallback, playBreakSoundCallback) {
        this.#isBlockTypeCallback = blockTypeCallback;
        this.#playBreakSoundCallback = playBreakSoundCallback;
        this.onPlayerStartBreakingBlockBound = this.onPlayerStartBreakingBlock.bind(this);
    }

    subscribeToEvents() {
        world.afterEvents.playerStartBreakingBlock.subscribe(this.onPlayerStartBreakingBlockBound);
    }

    unsubscribeFromEvents() {
        world.afterEvents.playerStartBreakingBlock.unsubscribe(this.onPlayerStartBreakingBlockBound);
    }

    onPlayerStartBreakingBlock(event) {
        if (!this.#isBlockTypeCallback(event.block.typeId))
            return;
        const player = event.player;
        if (this.isEfficiencyFiveNetheritePick(event.heldItemStack))
            this.breakBlock(player, event.block, event.heldItemStack);
    }

    isEfficiencyFiveNetheritePick(itemStack) {
        if (itemStack && itemStack.typeId === 'minecraft:netherite_pickaxe') {
            const enchants = itemStack.getComponent('minecraft:enchantable').getEnchantments();
            return enchants.some(enchant => enchant.type.id === 'efficiency' && enchant.level === 5);
        }
        return false;
    }

    breakBlock(player, block, heldItemStack) {
        const dimension = block.dimension;
        const blockCenter = { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 };
        this.#playBreakSoundCallback(dimension, blockCenter);
        this.createLoot(dimension, blockCenter, block, player, heldItemStack);
        block.setType("minecraft:air");
    }

    createLoot(dimension, blockCenter, block, player, heldItemStack) {
        const lootTableManager = world.getLootTableManager();
        try {
            const loot = lootTableManager.generateLootFromBlock(block, heldItemStack);
            if (this.shouldAutoPickup(player))
                this.addLootToPlayerInventory(player, loot);
            else
                this.spawnLoot(dimension, blockCenter, loot);
        } catch (error) {
            console.warn("[Canopy] Failed to generate and spawn loot for fast mine. Error", error, error.stack);
        }
    }

    shouldAutoPickup(player) {
        return (autoItemPickup.getNativeValue() && autoItemPickup.itemPickup.shouldPickup(player))
            || (carefulBreak.getNativeValue() && carefulBreak.itemPickup.shouldPickup(player));
    }

    spawnLoot(dimension, location, loot) {
        for (const itemStack of loot)
            dimension.spawnItem(itemStack, location);
    }

    addLootToPlayerInventory(player, loot) {
        const playerInventory = player.getComponent(EntityComponentTypes.Inventory);
        for (const itemStack of loot)
            InventoryUtils.tryAddItemLikeVanilla(playerInventory?.container, itemStack);
    }
}
