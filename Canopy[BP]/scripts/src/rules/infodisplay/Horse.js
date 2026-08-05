import { EntityComponentTypes } from '@minecraft/server';
import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';
import { MOVEMENT_UNITS_TO_MPS } from '../../classes/debugdisplay/Horse.js';

export class Horse extends InfoDisplayTextElement {
    static getRuleIdentifier() {
        return 'horse';
    }

    player;
    #horseTypes = ['horse', 'donkey', 'mule', 'skeleton_horse', 'zombie_horse'];

    constructor(player, displayLine) {
        const ruleData = { description: { translate: 'rules.infoDisplay.horse' }, wikiDescription: "Shows the speed and max health of the horse you are riding." };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const horseStats = this.getHorseStats();
        if (!horseStats)
            return { text: '' };
        return { translate: 'rules.infoDisplay.horse.display', with: [String(horseStats.speed.toFixed(3)), String(horseStats.maxHealth)] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getHorseStats() {
        const ridingComponent = this.player.getComponent(EntityComponentTypes.Riding);
        if (ridingComponent && this.#horseTypes.includes(ridingComponent.entityRidingOn.typeId.replace("minecraft:", ""))) {
            const horse = ridingComponent.entityRidingOn;
            this.movementComponent = horse.getComponent(EntityComponentTypes.Movement);
            this.healthComponent = horse.getComponent(EntityComponentTypes.Health);
            return { speed: this.movementComponent.currentValue * MOVEMENT_UNITS_TO_MPS, maxHealth: this.healthComponent.effectiveMax };
        }
        return void 0;
    }
}
