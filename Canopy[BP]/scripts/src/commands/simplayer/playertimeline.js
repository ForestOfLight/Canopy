import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { TimelineForm } from "../../classes/simplayer/timeline/TimelineForm";

export class PlayerTimelineCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playertimeline',
            description: 'commands.playertimeline',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin],
            callback: (origin, ...args) => this.playertimelineCommand(origin, ...args),
            wikiDescription: "Opens a timeline editor for the simulated player with the given name.\n\n" +
                "Each row is an action and each cell is one tick of a loop. Toggle cells to choose which ticks the action happens on, " +
                "or use the select all and deselect all buttons at the start of a row to fill or clear the whole row. The loop length can be set from 1 to 1200 ticks, " +
                "and loops longer than 20 ticks are split into pages.\n\n" +
                "The loop is aligned to the world tick, so saving at different times keeps the same timing. " +
                "`Use (tick)` uses the held item on each selected tick, while `Use (hold)` starts using the item at the start of a span " +
                "and releases it at the end. `/playerstop` clears the timeline."
        });
    }

    playertimelineCommand(origin, playername) {
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return;
        }
        const player = origin.getSource();
        system.run(() => new TimelineForm(player, understudy).show());
        return { status: CustomCommandStatus.Success };
    }
}

export const playertimelineCommand = new PlayerTimelineCommand();
