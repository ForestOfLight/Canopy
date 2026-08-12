import { InvalidEntityError, world } from "@minecraft/server";
import { InfoDisplayShapeElement } from "./InfoDisplayShapeElement";

export class NoFog extends InfoDisplayShapeElement {
    static getRuleIdentifier() {
        return 'noFog';
    }

    static FOG_REMOVAL_IDS = {
        "minecraft:nether": "canopy:nether_no_fog",
        "minecraft:the_end": "canopy:end_no_fog"
    };
    static FOG_TAG = "canopy_no_fog";

    player;
    playerId;
    onDimensionChangeBound;

    constructor(player) {
        const ruleData = {
            description: { translate: 'rules.infoDisplay.noFog' },
            wikiDescription: `Disables the fog effect for the player. Water and lava are unaffected.`,
            onEnableCallback: () => this.removeFog(),
            onDisableCallback: () => this.resetFog()
        };
        super(ruleData, 0);
        this.player = player;
        this.playerId = player.id;
        this.onDimensionChangeBound = this.onDimensionChange.bind(this);
    }

    removeFog() {
        this.applyFogRemoval();
        world.afterEvents.playerDimensionChange.subscribe(this.onDimensionChangeBound);
    }

    resetFog() {
        world.afterEvents.playerDimensionChange.unsubscribe(this.onDimensionChangeBound);
        this.clearFogSettings();
    }

    destroy() {
        world.afterEvents.playerDimensionChange.unsubscribe(this.onDimensionChangeBound);
    }

    applyFogRemoval() {
        this.withPlayer('apply fog removal', (fogSettings, dimensionId) => {
            fogSettings.remove(NoFog.FOG_TAG);
            const fogRemovalId = NoFog.FOG_REMOVAL_IDS[dimensionId];
            if (fogRemovalId)
                fogSettings.push(fogRemovalId, NoFog.FOG_TAG);
        });
    }

    clearFogSettings() {
        this.withPlayer('clear fog removal', (fogSettings) => fogSettings.remove(NoFog.FOG_TAG));
    }

    withPlayer(action, callback) {
        try {
            const fogSettings = this.player.fogSettings;
            if (!fogSettings) {
                console.warn(`[Canopy] NoFog: could not ${action} for player ${this.playerId}: fog settings are unavailable.`);
                return;
            }
            callback(fogSettings, this.player.dimension.id);
        } catch (error) {
            if (error instanceof InvalidEntityError) {
                console.warn(`[Canopy] NoFog: could not ${action} for player ${this.playerId}: the player is no longer valid.`);
                return;
            }
            throw error;
        }
    }

    onTick() {
        /* pass */
    }

    onDimensionChange(event) {
        if (event.player.id !== this.playerId)
            return;
        this.applyFogRemoval();
    }
}
