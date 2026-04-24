import { world } from "@minecraft/server";
import { BooleanRule, GlobalRule } from "../../lib/canopy/Canopy";
import { Vector } from "../../lib/Vector";

export class EntitySeparation extends BooleanRule {
    activationBlockType = 'minecraft:dropper';

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'entitySeparation',
            onEnableCallback: () => this.subscribeToEvent(),
            onDisableCallback: () => this.unsubscribeFromEvent()
        }));
        this.onPressurePlatePushBound = this.onPressurePlatePush.bind(this);
    }

    subscribeToEvent() {
        world.afterEvents.pressurePlatePush.subscribe(this.onPressurePlatePushBound);
    }

    unsubscribeFromEvent() {
        world.afterEvents.pressurePlatePush.unsubscribe(this.onPressurePlatePushBound);
    }

    onPressurePlatePush(event) {
        const entity = event.source;
        const activationBlock = this.findActivationBlock(event.block);
        if (entity?.isValid && activationBlock) {
            const facingDirection = activationBlock.permutation.getState('facing_direction');
            const offset = this.getOffsetFromFacingDirection(facingDirection);
            this.separateEntity(entity, offset);
        }
    }
    
    separateEntity(entity, offset) {
        const newLocation = Vector.from(entity.location).add(offset);
        const teleportOptions = {};
        if (entity.typeId !== 'minecraft:player')
            teleportOptions.keepVelocity = true;
        entity.teleport(newLocation, teleportOptions);
    }

    findActivationBlock(block) {
        const directionsToCheck = [
            Vector.up,
            Vector.down,
            Vector.left,
            Vector.right,
            Vector.forward,
            Vector.backward
        ];
        for (const offset of directionsToCheck) {
            const neighborBlock = block.offset(offset);
            if (neighborBlock.typeId === this.activationBlockType)
                return neighborBlock;
        }
        return void 0;
    }

    getOffsetFromFacingDirection(facingDirection) {
        const facingDirectionToOffset = {
            0: Vector.down,
            1: Vector.up,
            2: Vector.backward,
            3: Vector.forward,
            4: Vector.left,
            5: Vector.right
        };
        return facingDirectionToOffset[facingDirection];
    }
}

export const entitySeparation = new EntitySeparation();