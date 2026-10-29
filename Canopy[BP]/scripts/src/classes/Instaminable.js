import { ItemComponentTypes, system, world } from "@minecraft/server";

export class Instaminable {
    #isBlockTypeCallback;

    constructor(blockTypeCallback) {
        this.#isBlockTypeCallback = blockTypeCallback;
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
        if (this.isEfficiencyFiveNetheritePick(event.heldItemStack) && this.hasHasteTwo(player)) {
            const duration = 1;
            if (duration > 0)
                system.run(() => player.addEffect('haste', duration, { amplifier: 2 }));
        }
    }

    isEfficiencyFiveNetheritePick(itemStack) {
        if (itemStack && itemStack.typeId === 'minecraft:netherite_pickaxe') {
            const enchantableComponent = itemStack.getComponent(ItemComponentTypes.Enchantable);
            const enchants = enchantableComponent.getEnchantments();
            return enchants.some(enchant => enchant.type.id === 'efficiency' && enchant.level === 5);
        }
        return false;
    }

    hasHasteTwo(player) {
        const haste = player.getEffect('haste');
        return haste?.amplifier === 1;
    }
}
