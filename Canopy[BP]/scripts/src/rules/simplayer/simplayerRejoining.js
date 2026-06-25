import { BooleanRule } from "../../../lib/canopy/Canopy";
import { system, world } from "@minecraft/server";
import Understudies from "../../classes/simplayer/Understudies";

class SimplayerRejoining extends BooleanRule {
    simplayersToRejoinDP = 'simplayersToRejoin';

    constructor() {
        super({
            identifier: 'simplayerRejoining',
            description: { translate: 'rules.simplayerRejoining' },
            defaultValue: false,
            onEnableCallback: () => this.subscribeToEvent(),
            onDisableCallback: () => this.unsubscribeFromEvent()
        });
        this.onShutdownBound = this.onShutdown.bind(this);
    }

    subscribeToEvent() {
        system.beforeEvents.shutdown.subscribe(this.onShutdownBound);
    }

    unsubscribeFromEvent() {
        system.beforeEvents.shutdown.unsubscribe(this.onShutdownBound);
    }

    onStartup() {
        if (!this.getNativeValue())
            return;
        const simplayersToRejoinStr = world.getDynamicProperty(this.simplayersToRejoinDP);
        let playersToRejoin;
        try {
            const parsedPlayers = JSON.parse(simplayersToRejoinStr);
            if (Array.isArray(parsedPlayers))
                playersToRejoin = parsedPlayers;
        } catch (error) {
            console.error(`[Canopy] Error parsing ${this.simplayersToRejoinDP} DP:`, error);
        }
        if (playersToRejoin) {
            playersToRejoin.forEach(name => {
                const simPlayer = Understudies.create(name);
                system.runTimeout(() => {
                    Understudies.addNametagPrefix(simPlayer);
                }, 5);
                try {
                    simPlayer.rejoin();
                } catch (error) {
                    console.error(`[Canopy] Error rejoining player ${name}:`, error);
                }
            });
        }
    }

    onShutdown() {
        if (this.getNativeValue())
            world.setDynamicProperty(this.simplayersToRejoinDP, JSON.stringify(Understudies.understudies.map(player => player.name)));
        else
            world.setDynamicProperty(this.simplayersToRejoinDP, JSON.stringify([]));
    }
}

export const simplayerRejoining = new SimplayerRejoining();
