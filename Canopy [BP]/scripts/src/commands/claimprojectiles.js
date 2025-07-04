import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, Player, system } from "@minecraft/server";
import { Rule, VanillaCommand } from "../../lib/canopy/Canopy";

const CLAIM_RADIUS = 25;

new Rule({
    category: 'Rules',
    identifier: 'commandClaimProjectiles',
    description: { translate: 'rules.commandClaimProjectiles' }
});

new VanillaCommand( {
    name: 'canopy:claimprojectiles',
    description: 'commands.claimprojectiles',
    optionalParameters: [
        { name: 'radius', type: CustomCommandParamType.Integer },
        { name: 'player', type: CustomCommandParamType.PlayerSelector }
    ],
    permissionLevel: CommandPermissionLevel.Any,
    contingentRules: ['commandClaimProjectiles'],
    callback: claimProjectilesCommand
});

function claimProjectilesCommand(source, radius = CLAIM_RADIUS, player) {
    if (player)
        player = player[0];
    else
        player = source;
    if (!(player instanceof Player))
        return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
    const projectiles = getProjectilesInRange(player, radius);
    if (projectiles.length === 0)
        return source.sendMessage({ translate: 'commands.claimprojectiles.fail.nonefound', with: [String(radius)] });
    const numChanged = changeOwner(projectiles, player);
    player.sendMessage({ translate: 'commands.claimprojectiles.success.self', with: [String(numChanged), String(radius)] });
    if (source !== player)
        source.sendMessage({ translate: 'commands.claimprojectiles.success.other', with: [String(numChanged), String(radius), player.name] });
}

function getProjectilesInRange(source, radius) {
    const radiusProjectiles = [];
    const radiusEntities = source.dimension.getEntities({ location: source.location, maxDistance: radius });
    for (const entity of radiusEntities) {
        if (entity?.hasComponent('minecraft:projectile'))
            radiusProjectiles.push(entity);
    }
    return radiusProjectiles;
}

function changeOwner(projectiles, targetPlayer) {
    for (const projectile of projectiles) {
        system.run(() => {
            if (!projectile)
                return;
            projectile.getComponent('minecraft:projectile').owner = targetPlayer;
        });
    }
    return projectiles.length;
}