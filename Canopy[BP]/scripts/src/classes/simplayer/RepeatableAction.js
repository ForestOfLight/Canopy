import { system } from "@minecraft/server";
import { UnknownRepeatingActionError } from "../errors/UnknownRepeatingActionError";
import { swapSlots } from "./utils";

export const REPEATABLE_ACTIONS = Object.freeze({
    ATTACK: 'attack',
    INTERACT: 'interact',
    USE: 'use',
    BUILD: 'build',
    BREAK: 'break',
    DROP: 'drop',
    DROP_STACK: 'dropstack',
    DROP_ALL: 'dropall',
    JUMP: 'jump'
});

export class RepeatableAction {
    understudy;
    type;
    intervalTicks = 0;
    startTick;

    constructor(understudy, type, intervalTicks = 0) {
        this.understudy = understudy;
        this.type = type;
        this.intervalTicks = intervalTicks;
        this.startTick = system.currentTick;
    }

    onTick() {
        if (this.isActionTick())
            this.perform();
    }

    setInterval(newIntervalTicks) {
        this.intervalTicks = newIntervalTicks;
    }

    isActionTick() {
        return (system.currentTick - this.startTick) % this.intervalTicks === 0 || this.intervalTicks === 0;
    }

    perform() {
        const simulatedPlayer = this.understudy.simulatedPlayer;
        switch (this.type) {
            case REPEATABLE_ACTIONS.ATTACK:
                simulatedPlayer.attack();
                break;
            case REPEATABLE_ACTIONS.INTERACT:
                simulatedPlayer.interact();
                break;
            case REPEATABLE_ACTIONS.USE:
                simulatedPlayer.useItemInSlot(simulatedPlayer.selectedSlotIndex);
                break;
            case REPEATABLE_ACTIONS.BUILD:
                this.#build();
                break;
            case REPEATABLE_ACTIONS.BREAK:
                this.#break();
                break;
            case REPEATABLE_ACTIONS.DROP:
                this.#drop();
                break;
            case REPEATABLE_ACTIONS.DROP_STACK:
                simulatedPlayer.dropSelectedItem();
                break;
            case REPEATABLE_ACTIONS.DROP_ALL:
                this.#dropAll();
                break;
            case REPEATABLE_ACTIONS.JUMP:
                simulatedPlayer.jump();
                break;
            default:
                throw new UnknownRepeatingActionError(this.understudy.name, this.type);
        }
    }

    #build() {
        const simulatedPlayer = this.understudy.simulatedPlayer;
        const invContainer = this.understudy.getInventory();
        const selectedSlot = simulatedPlayer.selectedSlotIndex;
        swapSlots(invContainer, 0, selectedSlot);
        simulatedPlayer.startBuild();
        simulatedPlayer.stopBuild();
        swapSlots(invContainer, 0, selectedSlot);
        simulatedPlayer.selectedSlotIndex = selectedSlot;
    }

    #break() {
        const simulatedPlayer = this.understudy.simulatedPlayer;
        const lookingAtLocation = simulatedPlayer.getBlockFromViewDirection({ maxDistance: 6 })?.block?.location;
        if (lookingAtLocation === void 0)
            return;
        simulatedPlayer.breakBlock(lookingAtLocation);
    }

    #drop() {
        const invContainer = this.understudy.getInventory();
        const simulatedPlayer = this.understudy.simulatedPlayer;
        const itemStack = invContainer.getItem(simulatedPlayer.selectedSlotIndex);
        if (itemStack === void 0)
            return;
        const savedAmount = itemStack.amount;
        if (savedAmount > 1) {
            itemStack.amount = 1;
            invContainer.setItem(simulatedPlayer.selectedSlotIndex, itemStack);
            simulatedPlayer.dropSelectedItem();
            itemStack.amount = savedAmount - 1;
            invContainer.setItem(simulatedPlayer.selectedSlotIndex, itemStack);
        } else {
            simulatedPlayer.dropSelectedItem();
        }
    }

    #dropAll() {
        const invContainer = this.understudy.getInventory();
        const simulatedPlayer = this.understudy.simulatedPlayer;
        const selectedSlot = simulatedPlayer.selectedSlotIndex;
        simulatedPlayer.selectedSlotIndex = 0;
        simulatedPlayer.dropSelectedItem();
        for (let i = 0; i < invContainer.size; i++) {
            invContainer.moveItem(i, simulatedPlayer.selectedSlotIndex, invContainer);
            simulatedPlayer.dropSelectedItem();
        }
        simulatedPlayer.selectedSlotIndex = selectedSlot;
    }
}
