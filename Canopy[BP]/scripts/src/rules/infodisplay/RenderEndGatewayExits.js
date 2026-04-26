import { InfoDisplayShapeElement } from './InfoDisplayShapeElement';
import { EndGatewayExitFinder } from '../../classes/EndGatewayExitFinder';

export class RenderEndGatewayExits extends InfoDisplayShapeElement {
    player;
    playerId;
    endGatewayExitFinder;

    constructor(player) {
        const ruleData = {
            identifier: 'renderEndGatewayExits',
            description: { translate: 'rules.infoDisplay.renderEndGatewayExits' },
            wikiDescription: 'Renders the exit locations of end gateways after passing through them. The green outline represents the area around the exit that is checked for a valid End Stone block to move the exit to if the exit becomes invalid.',
            onEnableCallback: () => this.startRender(),
            onDisableCallback: () => this.stopRender()
        };
        super(ruleData, 0);
        this.player = player;
        this.playerId = player.id;
    }

    startRender() {
        this.stopRender();
        this.endGatewayExitFinder = new EndGatewayExitFinder(this.player);
    }

    stopRender() {
        if (this.endGatewayExitFinder) {
            this.endGatewayExitFinder.destroy();
            this.endGatewayExitFinder = void 0;
        }
    }

    onTick() {
        this.endGatewayExitFinder?.onTickTryFind();
    }
}
