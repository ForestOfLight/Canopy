import { BooleanRule, GlobalRule } from "../../lib/canopy/Canopy";
import { world } from "@minecraft/server";

export class EntityInstantDeath extends BooleanRule {
    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'entityInstantDeath',
            onEnableCallback: () => this.subscribeToEvent(),
            onDisableCallback: () => this.unsubscribeFromEvent()
        }));
        this.onEntityDieBound = this.onEntityDie.bind(this);
    }

    subscribeToEvent() {
        world.afterEvents.entityDie.subscribe(this.onEntityDie)
    }

    unsubscribeFromEvent() {
        world.afterEvents.entityDie.unsubscribe(this.onEntityDie)
    }

    onEntityDie(event) {
        try {
            event.deadEntity.remove();
        } catch {
            // already dead
        }
    }
}