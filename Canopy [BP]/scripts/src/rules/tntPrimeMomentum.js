import { FloatRule, GlobalRule, Rules } from "../../lib/canopy/Canopy";
import { world, system } from '@minecraft/server';

class TNTPrimeMomentum extends FloatRule {
    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'tntPrimeMomentum',
            defaultValue: -1,
            valueRange: { range: { min: 0, max: 0.0196 }, other: [-1] } // Max from vanilla TNT: 49/2500
        }));
        this.subscribeToEvents();
    }

    subscribeToEvents() {
        world.afterEvents.entitySpawn.subscribe(this.onEntitySpawn.bind(this));
    }

    onEntitySpawn(event) {
        if (event.entity.typeId !== 'minecraft:tnt' || this.getNativeValue() === -1)
            return;
        const entity = event.entity;
        if (Rules.getNativeValue('dupeTnt')) {
            system.runTimeout(() => {
                if (!entity.isValid) return;
                this.haltHorizontalVelocity(entity);
                this.applyHardcodedImpulse(entity);
            }, 1);
        } else {
            this.negateXZVelocity(entity);
            this.applyHardcodedImpulse(entity);
        }
    }

    haltHorizontalVelocity(entity) {
        const velocity = entity.getVelocity();
        this.centerEntityPosition(entity);
        entity.applyImpulse({ x: 0, y: velocity.y, z: 0 });
    }

    centerEntityPosition(entity) {
        const blockCenter = this.getHorizontalCenter(entity.location);
        entity.teleport(blockCenter);
    }

    getHorizontalCenter(location) {
        const halfABlock = 0.5;
        return { x: Math.floor(location.x) + halfABlock, y: location.y, z: Math.floor(location.z) + halfABlock };
    }

    negateXZVelocity(entity) {
        const velocity = entity.getVelocity();
        entity.applyImpulse({ x: -velocity.x, y: 0, z: -velocity.z });
    }

    applyHardcodedImpulse(entity) {
        const randX = this.getRandomMaxMomentumValue();
        const randZ = this.getRandomMaxMomentumValue();
        entity.applyImpulse({ x: randX, y: 0,  z: randZ });
    }

    getRandomMaxMomentumValue() {
        const currValue = this.getNativeValue();
        const randValues = [-currValue, 0, currValue];
        const randIndex = Math.floor(Math.random() * randValues.length);
        const randValue = randValues[randIndex];
        return randValue;
    }
}

export const tntPrimeMomentum = new TNTPrimeMomentum();