import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { TimelineForm } from "../../classes/simplayer/timeline/TimelineForm";
import { applyPreset } from "../../classes/simplayer/timeline/preset/TimelinePreset";
import { InvalidPresetError } from "../../classes/errors/InvalidPresetError";

export class PlayerTimelineCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playertimeline',
            description: 'commands.playertimeline',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            optionalParameters: [{ name: 'preset', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin],
            callback: (origin, ...args) => this.playertimelineCommand(origin, ...args),
            wikiDescription: "Opens a timeline editor for the simulated player with the given name.\n\n" +
                "The timeline starts with no tracks. When it is empty, a welcome page asks for the first track and the loop length. " +
                "Each row is a track and each cell is one tick of a loop. Toggle cells to choose which ticks the track happens on. " +
                "The shared loop length can be set from 1 to 800 ticks, " +
                "and loops longer than 20 ticks are split into pages.\n\n" +
                "The timeline is the same data the other simplayer commands use, so `/playeraction`, `/playermove`, `/playerlook`, " +
                "`/playerselect`, `/playersneak`, `/playersprint` and `/playerglide` all show up here as tracks. " +
                "Tracks made by `interval` or `continuous` keep their own length, shown next to their name, and one-time actions show as `(once)` until they run.\n\n" +
                "Tick `Open Settings` and save to open the settings page. There you can add any kind of track, including selecting a slot, moving in a direction, or looking at or moving to a target, " +
                "remove a track, and give any looping track its own loop length or put it back on the shared loop length.\n\n" +
                "Loops made in the editor are aligned to the world tick, so saving at different times keeps the same timing. " +
                "`Use (tick)` uses the held item on each selected tick, while `Use (hold)` starts using the item at the start of a span " +
                "and releases it at the end. `/playerstop` clears the timeline.\n\n" +
                "Give a preset as the second argument to load it onto the simplayer instead of opening the editor. " +
                "A preset is a short text version of a whole timeline, such as `v1;20;attack:0,10;sneak:0-9;select/3:5`. " +
                "Presets contain semicolons, so the preset must be wrapped in double quotes in the command, " +
                "for example `/playertimeline Steve \"v1;20;attack:0,10;sneak:0-9;select/3:5\"`. " +
                "The current timeline's preset can be copied from the settings page at any time, and a preset pasted there can be applied with `Apply Preset`. " +
                "Loading a preset replaces the whole timeline. Tracks whose entity or block can't be found are left out with a message, " +
                "and one-time actions aren't saved in presets."
        });
    }

    playertimelineCommand(origin, playername, preset) {
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return;
        }
        if (preset !== void 0)
            return this.#applyPreset(origin, understudy, preset);
        const player = origin.getSource();
        system.run(() => new TimelineForm(player, understudy).show());
        return { status: CustomCommandStatus.Success };
    }

    #applyPreset(origin, understudy, preset) {
        try {
            const { dropped } = applyPreset(understudy.actions.timeline, preset);
            for (const source of dropped)
                origin.sendMessage({ translate: 'simplayer.timeline.preset.dropped', with: [source] });
        } catch (error) {
            if (!(error instanceof InvalidPresetError))
                throw error;
            origin.sendMessage(error.reason);
            return { status: CustomCommandStatus.Failure };
        }
        origin.sendMessage({ translate: 'simplayer.timeline.preset.applied', with: [understudy.name] });
        return { status: CustomCommandStatus.Success };
    }
}

export const playertimelineCommand = new PlayerTimelineCommand();
