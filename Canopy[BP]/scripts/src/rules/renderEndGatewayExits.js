import { EndGatewayExitFinder } from '../classes/EndGatewayExitFinder';
import { BooleanRule, GlobalRule } from '../../lib/canopy/Canopy';

export class RenderEndGatewayExits extends BooleanRule {
    endGatewayExitFinder;

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'renderEndGatewayExits',
            wikiDescription: 'Renders the exit locations of end gateways after passing through them. The green outline represents the area around the exit that is checked for a valid End Stone block to move to if the exit becomes invalid. If there is no valid End Stone in the area, the exit will generate a small platform of End Stone below it to ensure it remains valid. tl;dr - if you remove all the End Stone in the box and place just one inside the box, the exit will move to that location.',
            onEnableCallback: () => this.start(),
            onDisableCallback: () => this.stop()
        }));
    }

    start() {
        this.stop();
        this.endGatewayExitFinder = new EndGatewayExitFinder();
        this.endGatewayExitFinder.start();
    }

    stop() {
        if (this.endGatewayExitFinder) {
            this.endGatewayExitFinder.destroy();
            this.endGatewayExitFinder = void 0;
        }
    }
}

export const renderEndGatewayExits = new RenderEndGatewayExits();