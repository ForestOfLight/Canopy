import { InfoDisplayElement } from "./InfoDisplayElement.js";
import { Vector } from "../../../lib/Vector.js";

class Entities extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { identifier: 'entities', description: { translate: 'rules.infoDisplay.entities' } };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.entities.display', with: [this.getEntitiesOnScreenCount()] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getEntitiesOnScreenCount() { // author: jeanmajid
        const viewDirection = Vector.normalize(this.player.getViewDirection());
        const entities = this.player.dimension.getEntities({ location: this.player.location, maxDistance: 96 });

        let count = 0;
        for (const entity of entities) {
            if (!entity) continue;
            try{
                const toEntity = Vector.normalize(Vector.subtract(entity.location, this.player.location));
                const dotProduct = Vector.dot(viewDirection, toEntity);
                if (dotProduct > 0.4) count++;
            } catch (error) {
                if (error.message.includes('property')) continue; // Entity has despawned
                throw error;
            }
        }
        return String(count);
    }
}

export default Entities;