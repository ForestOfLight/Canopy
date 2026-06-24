import { UnderstudyNotConnectedError } from "../errors/UnderstudyNotConnectedError";
import Understudy from "./Understudy";
import { system, world } from "@minecraft/server";

class Understudies {
    static understudies = [];
    static #runner = null;
    static #entityDieHandle = null;
    static #playerGameModeChangeHandle = null;

    static onConnect() {
        if (Understudies.#runner === null)
            Understudies.#startProcessing();
    }

    static #startProcessing() {
        Understudies.#runner = system.runInterval(() => {
            for (const understudy of Understudies.understudies) {
                if (understudy.isConnected())
                    understudy.onConnectedTick();
            }
        });
        Understudies.#entityDieHandle = Understudies.onEntityDie.bind(Understudies);
        world.afterEvents.entityDie.subscribe(Understudies.#entityDieHandle);
        Understudies.#playerGameModeChangeHandle = Understudies.onPlayerGameModeChange.bind(Understudies);
        world.afterEvents.playerGameModeChange.subscribe(Understudies.#playerGameModeChangeHandle);
    }

    static #stopProcessing() {
        system.clearRun(Understudies.#runner);
        Understudies.#runner = null;
        world.afterEvents.entityDie.unsubscribe(Understudies.#entityDieHandle);
        world.afterEvents.playerGameModeChange.unsubscribe(Understudies.#playerGameModeChangeHandle);
        Understudies.#entityDieHandle = null;
        Understudies.#playerGameModeChangeHandle = null;
    }

    static onEntityDie(event) {
        if (event.deadEntity.typeId !== 'minecraft:player')
            return;
        const understudy = Understudies.get(event.deadEntity?.name);
        if (understudy !== void 0) {
            understudy.leave();
            Understudies.remove(understudy);
        }
    }

    static onPlayerGameModeChange(event) {
        const understudy = Understudies.get(event.player?.name);
        if (understudy !== void 0)
            understudy.savePlayerInfo();
    }

    static create(name) {
        if (Understudies.isOnline(name))
            throw new Error(`[Canopy] Simulated player with name ${name} already exists.`);
        const understudy = new Understudy(name);
        Understudies.understudies.push(understudy);
        return understudy;
    }

    static addNametagPrefix(understudy) {
        const prefix = world.getDynamicProperty('nametagPrefix');
        if (prefix)
            understudy.simulatedPlayer.nameTag = `[${prefix}§r] ${understudy.name}`;
    }

    static get(name) {
        return Understudies.understudies.find(p => p.name === name);
    }

    static remove(understudy) {
        try {
            understudy.leave();
        } catch (error) {
            if (!(error instanceof UnderstudyNotConnectedError))
                throw error;
        }
        const runner = system.runInterval(() => {
            if (!understudy.isConnected()) {
                system.clearRun(runner);
                const index = Understudies.understudies.indexOf(understudy);
                Understudies.understudies.splice(index, 1);
                if (Understudies.understudies.length === 0)
                    Understudies.#stopProcessing();
            }
        });
    }

    static removeAll() {
        for (const understudy of [...Understudies.understudies])
            Understudies.remove(understudy);
    }

    static length() {
        return Understudies.understudies.length;
    }

    static setNametagPrefix(prefix) {
        world.setDynamicProperty('nametagPrefix', prefix);
        if (prefix === '') {
            for (const understudy of Understudies.understudies)
                understudy.simulatedPlayer.nameTag = understudy.name;
        } else {
            for (const understudy of Understudies.understudies)
                understudy.simulatedPlayer.nameTag = `[${prefix}§r] ${understudy.name}`;
        }
    }

    static isOnline(name) {
        return Understudies.get(name) !== void 0;
    }

    static isUnderstudy(player) {
        return Understudies.understudies.some(u => u.isConnected() && u.name === player?.name);
    }

    static getNotOnlineMessage(name) {
        return { translate: 'simplayer.notonline', with: [name] };
    }

    static getAlreadyOnlineMessage(name) {
        return { translate: 'simplayer.alreadyonline', with: [name] };
    }
}

export default Understudies;
