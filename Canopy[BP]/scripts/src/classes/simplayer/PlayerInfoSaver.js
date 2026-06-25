import { world, system, DimensionTypes, TicksPerSecond, EntityComponentTypes } from "@minecraft/server";
import { UnderstudyInventorySaver } from "./UnderstudyInventorySaver";
import { simplayerSaving } from "../../rules/simplayer/simplayerSaving";
import { UnderstudySaveInfoError } from "../errors/UnderstudySaveInfoError";
import { UnderstudyNotConnectedError } from "../errors/UnderstudyNotConnectedError";

export class PlayerInfoSaver {
    saveInterval = 600;
    #understudy;
    #inventory;

    constructor(understudy) {
        this.#understudy = understudy;
        this.#inventory = new UnderstudyInventorySaver(understudy);
    }

    onConnectedTick() {
        this.#saveOnInterval();
    }

    #saveOnInterval() {
        if (!simplayerSaving.getNativeValue())
            return;
        if ((system.currentTick - this.#understudy.createdTick) % this.saveInterval === 0) {
            this.save();
            return;
        }
        if (!this.#understudy.actions.isEmpty()) {
            if ((system.currentTick - this.#understudy.createdTick) % (TicksPerSecond * 5) === 0)
                this.save();
            else
                this.#inventory.saveWithoutNBT();
        }
    }

    get() {
        if (!simplayerSaving.getNativeValue())
            throw new UnderstudySaveInfoError(`Player ${this.#understudy.name} has no player info saved due to '${simplayerSaving.getID()}' rule being disabled.`);
        let playerInfo;
        try {
            playerInfo = JSON.parse(world.getDynamicProperty(`${this.#understudy.name}:playerinfo`));
        } catch (error) {
            if (error.name === 'SyntaxError')
                throw new UnderstudySaveInfoError(`Player ${this.#understudy.name} has corrupted player info saved, unable to parse player info.`);
            throw error;
        }
        return playerInfo;
    }

    save() {
        if (!simplayerSaving.getNativeValue())
            return;
        if (!this.#understudy.isConnected())
            throw new UnderstudyNotConnectedError();
        const simulatedPlayer = this.#understudy.simulatedPlayer;
        const playerInfo = {
            location: simulatedPlayer.location,
            rotation: this.#understudy.headRotation,
            dimensionId: simulatedPlayer.dimension.id,
            gameMode: simulatedPlayer.getGameMode(),
            projectileIds: this.#findOwnedProjectileIds()
        };
        world.setDynamicProperty(`${this.#understudy.name}:playerinfo`, JSON.stringify(playerInfo));
        this.#inventory.save();
    }

    #findOwnedProjectileIds() {
        let projectileIds = [];
        for (const dimensionType of DimensionTypes.getAll()) {
            const dimension = world.getDimension(dimensionType.typeId);
            const projectiles = dimension.getEntities().filter(entity => {
                const projectileComponent = entity.getComponent(EntityComponentTypes.Projectile);
                return projectileComponent?.owner === this.#understudy.simulatedPlayer;
            });
            projectileIds = projectileIds.concat(projectiles.map(projectile => projectile.id));
        }
        return projectileIds;
    }

    loadInventoryAndProjectileOwnership() {
        const playerInfo = this.get();
        this.#claimProjectileIds(playerInfo.projectileIds);
        this.#inventory.load();
    }

    #claimProjectileIds(projectileIds) {
        projectileIds?.forEach(projectileId => {
            const projectile = world.getEntity(projectileId);
            const projectileComponent = projectile?.getComponent(EntityComponentTypes.Projectile);
            if (projectileComponent)
                projectileComponent.owner = this.#understudy.simulatedPlayer;
        });
    }
}
