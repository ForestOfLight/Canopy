import { InfoDisplayElement } from "./InfoDisplayElement";
import { counterChannels } from "../../classes/CounterChannels";
import { getColorCode } from "../../../include/utils";

class HopperCounterCounts extends InfoDisplayElement {
    constructor(displayLine) {
        const ruleData = { identifier: 'hopperCounterCounts', description: { translate: 'rules.infoDisplay.hopperCounterCounts' } };
        super(ruleData, displayLine, true);
    }

    getFormattedDataOwnLine() {
        const activeChannels = counterChannels?.getActiveChannels() || [];
        let output = '';
        if (activeChannels.length > 0 && activeChannels.length <= 4)
            output += 'Counters: ';
        for (let i = 0; i < activeChannels.length; i++) {
            if (i !== 0 && (i % 4) === 0)
                output += '\n';
            const channel = activeChannels[i];
            output += getColorCode(channel.color);
            if (channel.isEmpty())
                output += 'N/A';
            else
                output += channel.getModedTotalCount();
            output += '§r ';
        }
        output += '\n';
        return { text: output.trim() };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export default HopperCounterCounts;