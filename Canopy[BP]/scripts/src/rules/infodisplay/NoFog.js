import { EntityComponentTypes, world } from "@minecraft/server";
import { InfoDisplayShapeElement } from "./InfoDisplayShapeElement";

export const NO_FOG_IDENTIFIER = 'noFog';

export class NoFog extends InfoDisplayShapeElement {
    static FOG_REMOVAL_IDS = {
        "minecraft:overworld": "canopy:overworld_no_fog",
        "minecraft:nether": "canopy:nether_no_fog",
        "minecraft:the_end": "canopy:end_no_fog"
    };
    static FOG_TAG = "canopy_no_fog";

    playerFogComponent;

    constructor(player) {
        const ruleData = {
            identifier: NO_FOG_IDENTIFIER,
            description: { translate: 'rules.infoDisplay.noFog' },
            wikiDescription: `Disables the fog effect for the player. Water and lava are unaffected.`,
            onEnableCallback: () => this.removeFog(),
            onDisableCallback: () => this.resetFog()
        };
        super(ruleData, 0);
        this.player = player;
        this.playerFogComponent = player.getComponent(EntityComponentTypes.Fog);
        this.onDimensionChangeBound = this.onDimensionChange.bind(this);
    }

    removeFog() {
        this.clearFogSettings();
        this.playerFogComponent.push(this.getCurrentFogId(), NoFog.FOG_TAG);
        world.afterEvents.playerDimensionChange.subscribe(this.onDimensionChangeBound);
    }

    resetFog() {
        world.afterEvents.playerDimensionChange.unsubscribe(this.onDimensionChangeBound);
        this.clearFogSettings();
    }

    clearFogSettings() {
        this.playerFogComponent.remove(NoFog.FOG_TAG);
    }

    getCurrentFogId() {
        const currentDimension = this.player.dimension.id;
        return NoFog.FOG_REMOVAL_IDS[currentDimension] ?? NoFog.FOG_REMOVAL_IDS["minecraft:overworld"];
    }

    onTick() {
        /* pass */
    }

    onDimensionChange() {
        this.clearFogSettings();
        const fogRemovalId = this.getCurrentFogId();
        this.playerFogComponent.push(fogRemovalId, NoFog.FOG_TAG);
    }
}