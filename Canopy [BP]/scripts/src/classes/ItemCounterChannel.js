import { system, world, ItemStack } from "@minecraft/server";
import { formatColorStr, getColorCode } from "../../include/utils";
import ItemCounterChannels from "./ItemCounterChannels";

class ItemCounterChannel {
    constructor(color, dpIdentifier) {
        if (this.constructor === ItemCounterChannel)
            throw new Error("Cannot instantiate abstract class 'ItemCounterChannel'");
        this.color = color;
        this.dpIdentifier = dpIdentifier;
        this.hopperList = new Array();
        this.totalCount = 0;
        this.itemMap = new Map();
        this.startTickTime = system.currentTick;
        this.startRealTime = Date.now();
        this.mode = 'count';
    }

    getData() {
        const channelJSON = world.getDynamicProperty(this.dpIdentifier);
        if (!channelJSON) 
            throw new Error(`No saved channel found for color ${this.color}`);
        return JSON.parse(channelJSON);
    }

    setData(channelData) {
        this.hopperList = channelData?.hopperList || this.hopperList;
        this.mode = ItemCounterChannels.modes.includes(channelData?.mode) ? channelData.mode : this.mode;
        this.totalCount = channelData?.totalCount || this.totalCount;
        this.itemMap = channelData?.itemMap || this.itemMap;
        this.startTickTime = channelData?.startTickTime || this.startTickTime;
        this.startRealTime = channelData?.startRealTime || this.startRealTime;
        this.color = channelData?.color || this.color;
        this.dpIdentifier = channelData?.dpIdentifier || this.dpIdentifier;
        this.#updateData();
    }

    #updateData() {
        world.setDynamicProperty(this.dpIdentifier, JSON.stringify(this));
    }

    loadSavedData() {
        try {
            const channelData = this.getData();
            this.setData({
                hopperList: channelData.hopperList || new Array(),
                mode: channelData.mode || this.mode
            });
        } catch (error) {
            if (error.message !== `No saved channel found for color ${this.color}`)
                throw error;
        }
    }

    disable() {
        this.hopperList = new Array();
        this.reset();
    }

    reset() {
        this.totalCount = 0;
        this.itemMap = new Map();
        this.startTickTime = system.currentTick;
        this.startRealTime = Date.now();
        this.#updateData();
    }

    addHopper(hopper) {
        if (this.hopperList.length === 0)
            this.reset();
        if (this.includes(hopper))
            throw new Error(`Hopper already exists in channel ${this.color}`);
        this.hopperList.push({ 
            location: hopper.location, 
            dimensionId: hopper.dimension.id,
            outputItemType: null
        });
        this.#updateData();
        return true;
    }

    includes(hopper) {
        const channel = this.getData();
        return channel.hopperList.find(knownHopper => 
            knownHopper.location.x === hopper.location.x
            && knownHopper.location.y === hopper.location.y
            && knownHopper.location.z === hopper.location.z
            && knownHopper.dimensionId === hopper.dimension.id
        );
    }

    removeHopper(hopper) {
        this.hopperList = this.hopperList.filter(knownHopper => 
            knownHopper.location.x !== hopper.location.x ||
            knownHopper.location.y !== hopper.location.y ||
            knownHopper.location.z !== hopper.location.z ||
            knownHopper.dimensionId !== hopper.dimension.id
        );
        system.runTimeout(() => {
            if (this.hopperList.length === 0)
                this.reset();
            else
                this.#updateData();
        }, 0);
    }

    removeAllHoppers() {
        this.hopperList = [];
    }

    isEmpty() {
        return this.hopperList.length === 0;
    }

    getQueryOutput(translatableQueryHeaderStr, useRealTime = false) {
        const realtimeText = useRealTime ? 'realtime: ' : '';
        const message = { rawtext: [
            { translate: translatableQueryHeaderStr, with: [
                formatColorStr(this.color),
                realtimeText, 
                String(this.#getMinutesSinceStart(this)), 
                String(this.totalCount), 
                this.#calculatePerTime(this.totalCount, this.#getDeltaTime())
            ]}
        ]};
        for (const item of Object.keys(this.itemMap))
            message.rawtext.push({ rawtext: [
                { text: `\n §7- ` },
                { translate: new ItemStack(item).localizationKey },
                { text: `: ${this.#getAllModeOutput(item)}` }
            ]});
        return message;
    }

    onTick(getItemCountsCallback) {
        if (this.isEmpty())
            return;
        this.#removeDestroyed();
        this.#updateCount(getItemCountsCallback());
    }

    getAttachedBlockFromHopper() {
        throw new Error("Method 'getValidBlockFromHopper' must be implemented");
    }

    getModedTotalCount() {
        if (this.mode === 'count')
            return this.totalCount;
        return this.#calculatePerTime(this.totalCount, this.#getDeltaTime(), this.mode);
    }

    #calculatePerTime(totalCount, deltaTicks, mode) {
		const ticksPerHour = 72000;
		let itemsPerUnit = totalCount / (deltaTicks / ticksPerHour);
		let unit = 'h';
		if (mode === 'min') {
			itemsPerUnit /= 60;
			unit = 'm';
		}
		if (mode === 'sec') {
			itemsPerUnit /= 3600;
			unit = 's';
		}
		if (isNaN(itemsPerUnit) || itemsPerUnit === Infinity)
            return '?/' + unit;
		return `${itemsPerUnit.toFixed(1)}/${unit}`;
	}

    #getDeltaTime(useRealTime) {
        const millisecondsPerTick = 50.0;
        let deltaTicks;
        if (useRealTime)
            deltaTicks = (Date.now() - this.startRealTime) / millisecondsPerTick;
        else
            deltaTicks = system.currentTick - this.startTickTime;
        deltaTicks = Math.floor(deltaTicks / 8) * 8; // normalize to hopper speed
        return deltaTicks;
    }
    
    #updateCount(itemStacks) {
        for (const itemStack of itemStacks) {
            const itemName = itemStack.typeId.replace('minecraft:', '');
            this.itemMap[itemName] = (this.itemMap[itemName] || 0) + itemStack.amount;
            this.totalCount += itemStack.amount;
        }
        this.#updateData();
    }

    #removeDestroyed() {
        for (const knownHopper of this.hopperList) {
            const hopperBlock = world.getDimension(knownHopper.dimensionId).getBlock(knownHopper.location);
            if (!hopperBlock) continue;
            if (hopperBlock.typeId !== 'minecraft:hopper' || this.getAttachedBlockFromHopper(hopperBlock)?.typeId !== `minecraft:${this.color}_wool`)
                this.removeHopper(hopperBlock);
        }
    }

    #getAllModeOutput(item) {
        let output = `${getColorCode(this.color)}${this.itemMap[item]}`;
        const rateModes = ItemCounterChannels.modes.slice(1);
        for (let i = 0; i < rateModes.length; i++) {
            if (i === 0)
                output += ' §7(';
            else
                output += '§7, ';
            output += this.#calculatePerTime(this.itemMap[item], this.#getDeltaTime(), rateModes[i]);
        }
        output += '§7)';
        return output;
    }

    #getMinutesSinceStart() {
        const minutes = this.#getDeltaTime() / 1200;
        return minutes.toFixed(2);
    }
}

export default ItemCounterChannel;