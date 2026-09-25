import { BlockComponentTypes, ButtonState, EntityComponentTypes, GameMode, InputButton, system, world } from "@minecraft/server";
import { AbilityRule } from "../../lib/canopy/Canopy";
import { QuickFillClipboardController } from "../classes/quickfill/QuickFillClipboardController";
import { QuickFillContainerPolicy } from "../classes/quickfill/QuickFillContainerPolicy";
import { QuickFillDirectExecutor } from "../classes/quickfill/QuickFillDirectExecutor";

class QuickFillContainer extends AbilityRule {
    bannedContainers = ['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern'];
    
    constructor() {
        super({
            identifier: 'quickFillContainer',
            wikiDescription: 'With an arrow in the top left of your inventory (slot 9), interact with a container while holding an item to move matching items into it; sneak to reverse, or sneak + interact with an empty hand to remove all. Break a block container or attack a supported storage entity to copy it. With the clipboard active, interact to paste, sneak + interact to remove, and sneak + break/attack to deactivate it.',
            onEnableCallback: () => {
                world.beforeEvents.playerInteractWithBlock.subscribe(this.onPlayerInteractWithBlockBound);
                world.beforeEvents.playerBreakBlock.subscribe(this.onPlayerBreakBlockBound);
                world.beforeEvents.playerInteractWithEntity.subscribe(this.onPlayerInteractWithEntityBound);
                world.beforeEvents.entityHurt.subscribe(this.onEntityHurtBound);
            },
            onDisableCallback: () => {
                world.beforeEvents.playerInteractWithBlock.unsubscribe(this.onPlayerInteractWithBlockBound);
                world.beforeEvents.playerBreakBlock.unsubscribe(this.onPlayerBreakBlockBound);
                world.beforeEvents.playerInteractWithEntity.unsubscribe(this.onPlayerInteractWithEntityBound);
                world.beforeEvents.entityHurt.unsubscribe(this.onEntityHurtBound);
            }
        }, { slotNumber: 9 });
        this.onPlayerInteractWithBlockBound = this.onPlayerInteractWithBlock.bind(this);
        this.onPlayerBreakBlockBound = this.onPlayerBreakBlock.bind(this);
        this.onPlayerInteractWithEntityBound = this.onPlayerInteractWithEntity.bind(this);
        this.onEntityHurtBound = this.onEntityHurt.bind(this);
    }

    onPlayerInteractWithBlock(event) {
        const player = event.player;
        const block = event.block;
        if (!player || !this.isEnabledForPlayer(player) || this.bannedContainers.includes(block?.typeId))
            return;

        const blockInv = block.typeId === 'minecraft:ender_chest'
            ? player.getComponent(EntityComponentTypes.EnderInventory)?.container
            : block.getComponent(BlockComponentTypes.Inventory)?.container;
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!playerInv || !blockInv)
            return;

        const handItemStack = event.itemStack;
        const clipboard = QuickFillClipboardController.get(player);
        const playerIsSneaking = player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
        const removeAll = !clipboard && !handItemStack && playerIsSneaking;
        if (removeAll && QuickFillContainerPolicy.isClipboardOnly(block))
            return;
        if (!removeAll && ((!clipboard || !handItemStack) && (QuickFillContainerPolicy.isClipboardOnly(block) || !QuickFillContainerPolicy.canInsertItem(block, handItemStack))))
            return;
        event.cancel = true;

        this.handleQuickFillInteraction(player, block, blockInv, handItemStack, clipboard);
    }

    onPlayerBreakBlock(event) {
        const player = event.player;
        const block = event.block;
        if (!player || !this.isEnabledForPlayer(player) || this.bannedContainers.includes(block?.typeId))
            return;
        const blockInv = block.typeId === 'minecraft:ender_chest'
            ? player.getComponent(EntityComponentTypes.EnderInventory)?.container
            : block.getComponent(BlockComponentTypes.Inventory)?.container;
        if (!blockInv)
            return;

        const playerIsSneaking = player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
        if (playerIsSneaking && !QuickFillClipboardController.get(player))
            return;

        event.cancel = true;
        system.run(() => {
            if (playerIsSneaking) {
                QuickFillClipboardController.deactivate(player);
                return;
            }
            QuickFillClipboardController.copy(player, block, blockInv);
        });
    }

    onPlayerInteractWithEntity(event) {
        const player = event.player;
        const entity = event.target;
        if (!player || !this.isEnabledForPlayer(player))
            return;

        const entityInv = QuickFillContainerPolicy.getInteractableEntityContainer(entity);
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!playerInv || !entityInv)
            return;

        const handItemStack = event.itemStack;
        const clipboard = QuickFillClipboardController.get(player);
        const playerIsSneaking = player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
        const removeAll = !clipboard && !handItemStack && playerIsSneaking;
        if (!removeAll && (!handItemStack || (!clipboard && !QuickFillContainerPolicy.canInsertItem(entity, handItemStack))))
            return;
        event.cancel = true;

        this.handleQuickFillInteraction(player, entity, entityInv, handItemStack, clipboard);
    }

    handleQuickFillInteraction(player, target, targetInv, handItemStack, clipboard) {
        const playerIsSneaking = player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
        system.run(() => {
            if (clipboard) {
                QuickFillClipboardController.apply(player, target, clipboard, playerIsSneaking, targetInv);
                return;
            }
            if (playerIsSneaking) {
                if (!handItemStack) {
                    QuickFillDirectExecutor.transferAllToPlayer(player, target, targetInv);
                    return;
                }
                QuickFillDirectExecutor.transferToPlayer(player, target, handItemStack, targetInv);
            } else if (player.getGameMode() === GameMode.Creative) {
                QuickFillDirectExecutor.fillCreative(player, target, handItemStack, targetInv);
            } else {
                QuickFillDirectExecutor.transferToContainer(player, target, handItemStack, targetInv);
            }
        });
    }

    onEntityHurt(event) {
        const player = event.damageSource?.damagingEntity;
        const entity = event.hurtEntity;
        if (player?.typeId !== 'minecraft:player' || event.damageSource?.damagingProjectile || !this.isEnabledForPlayer(player))
            return;

        const entityInv = QuickFillContainerPolicy.getEntityContainer(entity);
        if (!entityInv)
            return;

        const playerIsSneaking = player.inputInfo.getButtonState(InputButton.Sneak) === ButtonState.Pressed;
        if (playerIsSneaking && !QuickFillClipboardController.get(player))
            return;

        event.cancel = true;
        system.run(() => {
            if (playerIsSneaking) {
                QuickFillClipboardController.deactivate(player);
                return;
            }
            QuickFillClipboardController.copy(player, entity, entityInv);
        });
    }
}

export const quickFillContainer = new QuickFillContainer();
