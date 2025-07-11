import { Rule, Rules, VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandStatus, Entity, GameMode, system } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'commandJumpSurvival',
    description: { translate: 'rules.commandJumpSurvival' }
});

new VanillaCommand({
    name: 'canopy:jump',
    description: 'commands.jump',
    permissionLevel: CommandPermissionLevel.GameDirectors,
    cheatsRequired: true,
    callback: jumpCommand,
    aliases: ['canopy:j']
});

function jumpCommand(source) {
    if (!(source instanceof Entity))
        return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
    if (!Rules.getNativeValue('commandJumpSurvival') && source.getGameMode() === GameMode.Survival)
        return source.sendMessage({ translate: 'rules.generic.blocked', with: ['commandJumpSurvival'] });
    jumpToViewDirectionBlock(source);
}

function getBlockLocationFromFace(block, face) {
    switch(face) {
        case 'Up':
            return { x: block.x, y: block.y + 1, z: block.z};
        case 'Down':
            return { x: block.x, y: block.y - 2, z: block.z};
        case 'North':
            return { x: block.x, y: block.y, z: block.z - 1};
        case 'South':
            return { x: block.x, y: block.y, z: block.z + 1};
        case 'East':
            return { x: block.x + 1, y: block.y, z: block.z};
        case 'West':
            return { x: block.x - 1, y: block.y, z: block.z};
        default:
            throw new Error('Invalid block face');
    }
}

function jumpToViewDirectionBlock(entity) {
    const blockRayResult = entity.getBlockFromViewDirection({ includeLiquidBlocks: false, includePassableBlocks: true, maxDistance: 64*16 });
    if (!blockRayResult?.block)
        return entity.sendMessage({ translate: 'commands.jump.fail.noblock' });
    const jumpLocation = getBlockLocationFromFace(blockRayResult.block, blockRayResult.face);
    system.run(() => {
        entity.teleport(jumpLocation);
    });
}