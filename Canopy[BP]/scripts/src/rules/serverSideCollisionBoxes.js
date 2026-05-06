import { BooleanRule, GlobalRule } from "../../lib/canopy/Canopy";
import { DebugDisplay } from "../classes/debugdisplay/DebugDisplay";
import { collisionBoxes } from "./collisionBoxes";

export class ServerSideCollisionBoxes extends BooleanRule {
    runners = {};

    constructor() {
        super(GlobalRule.morphOptions({
            identifier: 'serverSideCollisionBoxes',
            wikiDescription: 'Renders entity collision boxes based on their server-side position rather than their client-side position. Useful for debugging desyncs.',
            onEnableCallback: () => {
                collisionBoxes.refresh();
                DebugDisplay.refreshAllElements();
            },
            onDisableCallback: () => {
                collisionBoxes.refresh();
                DebugDisplay.refreshAllElements();
            }
        }));
    }
}

export const serverSideCollisionBoxes = new ServerSideCollisionBoxes();