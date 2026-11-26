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
                "Each row is a track and each cell is one tick of a loop. Toggle cells to choose which ticks the track happens on. " +
                "The shared loop length can be set from 1 to 200 ticks, " +
                "and loops longer than 20 ticks are split into pages.\n\n" +
                "The timeline is the same data the other simplayer commands use, so `/playeraction`, `/playermove`, `/playerlook`, " +
                "`/playerselect`, `/playersneak`, `/playersprint` and `/playerglide` all show up here as tracks. " +
                "Tracks made by `interval` or `continuous` keep their own length, shown next to their name, and one-time actions show as `(once)` until they run.\n\n" +
                "Tick `Open Settings` and save to open the settings page. There you can add a track with a parameter, such as selecting a slot, moving in a direction, or looking at or moving to a target, " +
                "remove a track you added, and give any looping track its own loop length or put it back on the shared loop length.\n\n" +
                "Loops made in the editor are aligned to the world tick, so saving at different times keeps the same timing. " +
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
