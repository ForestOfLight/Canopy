import { BooleanRule } from "../../lib/canopy/Canopy";

class NoSimplayerSaving extends BooleanRule {
    constructor() {
        super({
            identifier: 'noSimplayerSaving',
            description: 'Disables saving playerdata for simplayers. Improves performance but causes simplayers to lose their inventory and location when they leave and rejoin.',
            defaultValue: false
        });
    }
}

export const noSimplayerSaving = new NoSimplayerSaving();
