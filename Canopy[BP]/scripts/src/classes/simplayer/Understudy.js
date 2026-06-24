import { Block, Entity, Player, world, system, GameMode, EntityComponentTypes } from "@minecraft/server";
import { spawnSimulatedPlayer } from "@minecraft/server-gametest";
import { getLookAtLocation, getLookAtRotation, portOldGameModeToNewUpdate } from "./utils";
import { Vector } from "../../../lib/Vector";
import { PlayerInfoSaver } from "./PlayerInfoSaver";
import { Actions } from "./Actions";
import { UnderstudyNotConnectedError } from "../errors/UnderstudyNotConnectedError";
import { UnderstudyConnectedError } from "../errors/UnderstudyConnectedError";
import { UnderstudySaveInfoError } from "../errors/UnderstudySaveInfoError";
import Understudies from "./Understudies";

class Understudy {
    name;
    #simulatedPlayer = null;
    #createdTick;
    #isConnected = false;
    #lookTarget;
    #actions;
    #playerInfoSaver;

    constructor(name) {
        this.name = name;
        this.#createdTick = system.currentTick;
        this.#playerInfoSaver = new PlayerInfoSaver(this);
        this.#actions = new Actions(this);
    }

    isConnected() {
        return this.#isConnected;
    }

    onConnectedTick() {
        this.#playerInfoSaver.onConnectedTick();
        if (!this.#lookTarget?.isValid)
            this.clearLookTarget();
        if (this.#simulatedPlayer !== null)
            this.refreshHeldItem();
        this.#actions.onTick();
    }

    get createdTick() {
        return this.#createdTick;
    }

    get simulatedPlayer() {
        this.#assertConnected();
        return this.#simulatedPlayer;
    }

    get actions() {
        this.#assertConnected();
        return this.#actions;
    }

    get lookTarget() {
        this.#assertConnected();
        return this.#lookTarget;
    }

    clearLookTarget() {
        this.#assertConnected();
        this.#lookTarget = void 0;
    }

    get headRotation() {
        this.#assertConnected();
        if (!this.#lookTarget?.isValid)
            this.clearLookTarget();
        if (this.#lookTarget === void 0)
            return this.#simulatedPlayer.headRotation;
        let targetLocation;
        if (this.#lookTarget instanceof Entity) {
            try {
                targetLocation = this.#lookTarget.getHeadLocation();
            } catch {
                return this.#simulatedPlayer.headRotation;
            }
        } else {
            targetLocation = this.#lookTarget.location;
        }
        return getLookAtRotation(this.#simulatedPlayer.location, targetLocation);
    }

    savePlayerInfo() {
        this.#assertConnected();
        this.#playerInfoSaver.save();
    }

    join({ location, dimension, rotation = { x: 0, y: 0 }, gameMode = GameMode.Survival }) {
        this.#assertNotConnected();
        Understudies.onConnect();
        const updatedGameMode = portOldGameModeToNewUpdate(gameMode);
        this.#simulatedPlayer = spawnSimulatedPlayer({ ...location, dimension }, this.name, updatedGameMode);
        this.#isConnected = true;
        const teleportOptions = {
            dimension,
            facingLocation: getLookAtLocation(location, rotation),
            rotation
        };
        this.#simulatedPlayer.teleport(location, teleportOptions);
        try {
            this.#playerInfoSaver.loadInventoryAndProjectileOwnership();
        } catch (error) {
            if (error instanceof UnderstudySaveInfoError)
                console.warn(`[Canopy] Failed to load player info for ${this.name}:`, error);
            else
                throw error;
        }
    }

    leave() {
        this.#assertConnected();
        this.savePlayerInfo();
        this.#simulatedPlayer.remove();
        this.#simulatedPlayer = void 0;
        this.clearLookTarget();
        this.#isConnected = false;
        world.sendMessage({ translate: 'simplayer.leave.broadcast', with: [this.name] });
    }

    rejoin() {
        this.#assertNotConnected();
        const playerInfo = this.#playerInfoSaver.get();
        this.join({
            location: playerInfo.location,
            rotation: playerInfo.rotation,
            dimension: world.getDimension(playerInfo.dimensionId),
            gameMode: playerInfo.gameMode
        });
    }

    teleport({ location, dimension, rotation = { x: 0, y: 0 } }) {
        const teleportOptions = {
            dimension,
            facingLocation: getLookAtLocation(location, rotation),
            rotation
        };
        this.simulatedPlayer.teleport(location, teleportOptions);
        this.savePlayerInfo();
    }

    look(target) {
        if (target instanceof Block) {
            this.simulatedPlayer.lookAtBlock(target);
            this.#lookTarget = target;
        } else if (target instanceof Entity) {
            this.simulatedPlayer.lookAtEntity(target);
            this.#lookTarget = target;
        } else if (target instanceof Vector) {
            this.simulatedPlayer.lookAtLocation(target);
        } else {
            const rotation = target;
            this.simulatedPlayer.lookAtLocation(getLookAtLocation(this.simulatedPlayer.location, rotation));
            this.simulatedPlayer.setRotation(rotation);
        }
    }

    stopLooking() {
        const target = this.lookTarget;
        if (target === void 0)
            return;
        this.clearLookTarget();
        if (target instanceof Player)
            this.look(Vector.from(target.getHeadLocation()));
        else if (target instanceof Block)
            this.look(Vector.from(target.location));
        else
            this.look(Vector.from(target));
    }

    moveLocation(target) {
        if (target instanceof Block)
            this.simulatedPlayer.navigateToBlock(target);
        else if (target instanceof Entity)
            this.simulatedPlayer.navigateToEntity(target);
        else
            this.simulatedPlayer.navigateToLocation(target);
    }

    moveRelative(direction) {
        const relativeDirectionMap = {
            forward: [0, 1],
            backward: [0, -1],
            left: [1, 0],
            right: [-1, 0]
        };
        const relativeDirection = relativeDirectionMap[direction];
        if (!relativeDirection)
            throw new Error(`[Canopy] Invalid relative movement direction: ${direction}`);
        this.simulatedPlayer.moveRelative(...relativeDirection);
    }

    stopMoving() {
        this.simulatedPlayer.stopMoving();
    }

    selectSlot(slotNumber) {
        this.simulatedPlayer.selectedSlotIndex = slotNumber;
        this.savePlayerInfo();
    }

    sprint(shouldSprint) {
        this.simulatedPlayer.isSprinting = shouldSprint;
    }

    sneak(shouldSneak) {
        this.simulatedPlayer.isSneaking = shouldSneak;
    }

    claimProjectiles(radius) {
        const simulatedPlayer = this.simulatedPlayer;
        const projectileComponents = this.#getProjectileComponentsInRange(simulatedPlayer, radius);
        const numChanged = this.#changeProjectileOwner(projectileComponents, simulatedPlayer);
        if (numChanged === 0)
            return world.sendMessage({ translate: 'simplayer.claimprojectiles.none', with: [simulatedPlayer.name, String(radius)] });
        world.sendMessage({ translate: 'simplayer.claimprojectiles.success', with: [simulatedPlayer.name, String(numChanged)] });
        this.savePlayerInfo();
    }

    #getProjectileComponentsInRange(player, radius) {
        const projectileComponents = [];
        const radiusEntities = player.dimension.getEntities({ location: player.location, maxDistance: radius });
        for (const entity of radiusEntities) {
            const projectileComponent = entity?.getComponent(EntityComponentTypes.Projectile);
            if (projectileComponent)
                projectileComponents.push(projectileComponent);
        }
        return projectileComponents;
    }

    #changeProjectileOwner(projectileComponents, newOwner) {
        const successfullyChanged = [];
        for (const projectileComponent of projectileComponents) {
            if (!projectileComponent?.isValid)
                continue;
            projectileComponent.owner = newOwner;
            successfullyChanged.push(projectileComponent);
        }
        return successfullyChanged.length;
    }

    stopAll() {
        this.actions.clear();
        this.stopMoving();
        this.#simulatedPlayer.stopBuild();
        this.#simulatedPlayer.stopInteracting();
        this.#simulatedPlayer.stopBreakingBlock();
        this.#simulatedPlayer.stopUsingItem();
        this.#simulatedPlayer.stopSwimming();
        this.#simulatedPlayer.stopGliding();
        this.#simulatedPlayer.stopUsingItem();
        this.sprint(false);
        this.sneak(false);
        this.clearLookTarget();
        this.savePlayerInfo();
    }

    getInventory() {
        const simulatedPlayer = this.simulatedPlayer;
        const inventoryComponent = simulatedPlayer.getComponent(EntityComponentTypes.Inventory);
        return inventoryComponent?.container;
    }

    swapHeldItemWithPlayer(targetPlayer) {
        const playerInvContainer = this.getInventory();
        const targetInvContainer = targetPlayer.getComponent(EntityComponentTypes.Inventory)?.container;
        try {
            playerInvContainer.swapItems(this.#simulatedPlayer.selectedSlotIndex, targetPlayer.selectedSlotIndex, targetInvContainer);
        } catch (error) {
            targetPlayer.sendMessage({ translate: 'simplayer.swapheld.error', with: [error.name] });
            console.warn(error);
        }
        this.refreshHeldItem();
        this.savePlayerInfo();
    }

    refreshHeldItem() {
        this.#simulatedPlayer.selectedSlotIndex = this.simulatedPlayer.selectedSlotIndex;
    }

    #assertConnected() {
        if (!this.isConnected())
            throw new UnderstudyNotConnectedError(this.name);
    }

    #assertNotConnected() {
        if (this.isConnected())
            throw new UnderstudyConnectedError(this.name);
    }
}

export default Understudy;
