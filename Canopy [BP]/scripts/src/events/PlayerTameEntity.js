import { EntityComponentTypes, system, world } from "@minecraft/server";
import { Event } from './Event';

class PlayerTameEntity extends Event {
    successfulTameAttempts = [];
    untamedMountsLastTick = [];
    untamedMountsThisTick = [];

    constructor() {
        super();
        this.successfulTameAttempts = [];
    }

    startTrackingEvent() {
        super.startTrackingEvent();
        world.beforeEvents.playerInteractWithEntity.subscribe(this.onPlayerInteractWithEntity.bind(this));
    }

    provideEvents() {
        this.updateMountLists();
        const events = this.successfulTameAttempts.map(tameAttempt => ({
            player: tameAttempt.player,
            itemStack: tameAttempt.itemStack,
            entity: tameAttempt.entity
        }));
        this.successfulTameAttempts = [];
        return events;
    }

    updateMountLists() {
        this.untamedMountsLastTick = [...this.untamedMountsThisTick];
        this.untamedMountsThisTick = [];
        world.getAllPlayers().forEach(player => {
            if (!player)
                return;
            const mountEntity = player.getComponent(EntityComponentTypes.Riding)?.entityRidingOn;
            this.tryAddMount(player, mountEntity);
            if (this.wasUntamedMountLastTick(player, mountEntity) && this.isTamed(mountEntity))
                this.successfulTameAttempts.push({ player, entity: mountEntity });
        });
    }

    tryAddMount(player, mountEntity) {
        if (!player || !mountEntity?.hasComponent(EntityComponentTypes.TameMount) || !this.isPlayerInFirstSeat(mountEntity, player))
            return;
        this.untamedMountsThisTick.push({ player, entity: mountEntity });
    }

    isPlayerInFirstSeat(mountEntity, player) {
        return mountEntity.getComponent(EntityComponentTypes.Rideable).getRiders()[0]?.id === player.id;
    }

    wasUntamedMountLastTick(player, mountEntity) {
        return this.untamedMountsLastTick.some(mount => mount.player.id === player.id && mount.entity.id === mountEntity?.id);
    }

    onPlayerInteractWithEntity(event) {
        if (!event.player || !event.target)
            return;
        let tameAttempt;
        if (event.target?.hasComponent(EntityComponentTypes.Tameable))
            tameAttempt = this.getTameAttemptForTameable(event);
        if (event.target?.hasComponent(EntityComponentTypes.TameMount))
            tameAttempt = this.getTameAttemptForTameMount(event);
        if (!tameAttempt)
            return;
        system.runTimeout(() => {
            if (this.isTamed(tameAttempt.entity))
                this.successfulTameAttempts.push(tameAttempt);
        }, 2);
    }

    getTameAttemptForTameable(event) {
        if (!this.isValidTameItem(event.target, event.itemStack.typeId))
            return;
        return { player: event.player, itemStack: event.itemStack.typeId, entity: event.target };
    }

    getTameAttemptForTameMount(event) {
        return { player: event.player, entity: event.target };
    }

    isValidTameItem(entity, itemType) {
        return entity.getComponent(EntityComponentTypes.Tameable)?.getTameItems.some(item => item.typeId === itemType);
    }

    isTamed(entity) {
        return entity?.hasComponent(EntityComponentTypes.IsTamed);
    }

    stopTrackingEvent() {
        super.stopTrackingEvent();
        world.beforeEvents.playerInteractWithEntity.unsubscribe(this.onPlayerInteractWithEntity.bind(this));
    }
}

const playerTameEntity = new PlayerTameEntity();

export { PlayerTameEntity, playerTameEntity };