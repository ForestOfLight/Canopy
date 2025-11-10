import { BlockPermutation, EntityComponentTypes, EquipmentSlot, GameMode, system, world } from "@minecraft/server";
import { BooleanRule, GlobalRule } from "../../lib/canopy/Canopy";

export class EchoShardsEnableShriekers extends BooleanRule {
    shriekerBlockType = 'minecraft:sculk_shrieker';
    activationItemType = 'minecraft:echo_shard';

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'echoShardsEnableShriekers',
            onEnableCallback: () => this.subscribeToEvent(),
            onDisableCallback: () => this.unsubscribeFromEvent()
        }));
        this.onPlayerInteractWithBlockBound = this.onPlayerInteractWithBlock.bind(this);
    }

    subscribeToEvent() {
        world.beforeEvents.playerInteractWithBlock.subscribe(this.onPlayerInteractWithBlockBound)
    }

    unsubscribeFromEvent() {
        world.beforeEvents.playerInteractWithBlock.unsubscribe(this.onPlayerInteractWithBlockBound)
    }

    onPlayerInteractWithBlock(event) {
        if (!event.player || event.itemStack?.typeId !== this.activationItemType || event.block.typeId !== this.shriekerBlockType)
            return;
        const player = event.player;
        const block = event.block;
        if (this.canSummon(block))
            return;
        system.run(() => {
            if (player.getGameMode() !== GameMode.Creative)
                this.consumeItem(player, event.itemStack);
            this.activateShrieker(event.block);
        });
    }

    canSummon(block) {
        return block.permutation.getAllStates().can_summon;
    }

    consumeItem(player, itemStack) {
        const equippableComponent = player.getComponent(EntityComponentTypes.Equippable);
        let newItemStack = itemStack;
        if (itemStack.amount === 1)
            newItemStack = void 0;
        else
            newItemStack.amount -= 1;
        equippableComponent.setEquipment(EquipmentSlot.Mainhand, newItemStack);
    }

    activateShrieker(block) {
        const states = block.permutation.getAllStates();
        states['can_summon'] = true;
        const activePermutation = BlockPermutation.resolve(block.typeId, states);
        block.setPermutation(activePermutation);
    }
}

export const echoShardsEnableShriekers = new EchoShardsEnableShriekers();