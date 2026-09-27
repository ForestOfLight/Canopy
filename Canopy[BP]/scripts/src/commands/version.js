import { VanillaCommand, PlayerCommandOrigin, EntityCommandOrigin, BlockCommandOrigin, ServerCommandOrigin, Extensions } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";
import { PACK_VERSION } from "../../constants";

new VanillaCommand({
    name: 'canopy:version',
    description: 'commands.canopy.version',
    permissionLevel: CommandPermissionLevel.GameDirectors,
    allowedSources: [
        PlayerCommandOrigin,
        EntityCommandOrigin,
        BlockCommandOrigin,
        ServerCommandOrigin
    ],
    cheatsRequired: true,
    callback: versionCommand,
    wikiDescription: 'Displays the Canopy version and all loaded extensions.'
});

function versionCommand(origin) {
    origin.sendMessage(getVersionMessage());
    return { status: CustomCommandStatus.Success };
}

function getVersionMessage() {
    const message = {
        rawtext: [
            { translate: 'commands.canopy.version.message' },
            { text: ` §av${PACK_VERSION}§r§7.\n` }
        ]
    };

    const extensions = Extensions.getVersionedNames();
    if (extensions.length === 0)
        return message;

    message.rawtext.push({
        translate: 'commands.canopy.version.extensions'
    });

    for (let i = 0; i < extensions.length; i++) {
        const extension = extensions[i];

        if (i > 0)
            message.rawtext.push({ text: '§r§7,' });

        message.rawtext.push({
            text: ` §2§o${extension.name} v${extension.version}`
        });
    }

    return message;
}

export { getVersionMessage, versionCommand };
