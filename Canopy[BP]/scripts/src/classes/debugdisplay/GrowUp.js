import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes, system, TicksPerSecond, world } from '@minecraft/server';

export class GrowUp extends ComponentDebugDisplayElement {
    fedBias = 0;

    constructor(entity) {
        super(entity, EntityComponentTypes.Ageable);
        this.onPlayerInteractWithEntityBound = this.onPlayerInteractWithEntity.bind(this);
        this.subscribeToEvents();
    }

    destroy() {
        this.unsubscribeFromEvents();
    }

    getFormattedData() {
        if (!this.component?.isValid) {
            this.component = this.entity.getComponent(this.componentType);
            return;
        }
        const age = system.currentTick - this.entity.getDynamicProperty('spawnTick');
        const totalTicks = this.component.duration * TicksPerSecond;
        const ageWithBias = (age + this.fedBias).toFixed(0);
        const remainingTicks = totalTicks - ageWithBias;
        return `§7${ageWithBias}/${totalTicks} ticks (${remainingTicks} remaining)`;
    }

    subscribeToEvents() {
        system.run(() => {
            world.beforeEvents.playerInteractWithEntity.subscribe(this.onPlayerInteractWithEntityBound);
        });
    }

    unsubscribeFromEvents() {
        system.run(() => {
            world.beforeEvents.playerInteractWithEntity.unsubscribe(this.onPlayerInteractWithEntityBound);
        });
    }

    onPlayerInteractWithEntity(event) {
        const entity = event.target;
        const itemStack = event.itemStack;
        if (entity?.id !== this.entity.id || !this.component?.isValid)
            return;
        const growth = this.findGrowthScalar(this.component.getFeedItems(), itemStack);
        this.applyGrowth(growth);
    }

    findGrowthScalar(feedItems, itemStack) {
        const fedItem = feedItems.find(item => item.item === itemStack.typeId);
        if (!fedItem)
            return 0;
        return fedItem.growth;
    }

    applyGrowth(growth) {
        this.fedBias += this.component.duration * TicksPerSecond * growth;
    }
}