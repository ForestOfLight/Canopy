import { ComponentDebugDisplayElement } from './ComponentDebugDisplayElement.js';
import { EntityComponentTypes } from '@minecraft/server';

export class Projectile extends ComponentDebugDisplayElement {
    constructor(entity) {
        super(entity, EntityComponentTypes.Projectile);
    }

    getFormattedData() {
        return super.getFormattedComponent({ hide: ['hitGroundSound', 'hitEntitySound', 'critParticlesOnProjectileHurt', 'hitParticle'] });
    }
}