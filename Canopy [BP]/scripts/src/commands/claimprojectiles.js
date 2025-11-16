import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, Player, system } from "@minecraft/server";
import { BooleanRule, VanillaCommand } from "../../lib/canopy/Canopy";

const CLAIM_RADIUS = 25;

new BooleanRule({
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

function claimProjectilesCommand(origin, radius = CLAIM_RADIUS, player) {
    if (player)
        player = player[0];
    else
        player = origin.getSource();
    if (!(player instanceof Player))
        return { status: CustomCommandStatus.Failure, message: 'commands.claimprojectiles.fail.sourcenotplayer' };
    const projectiles = getProjectilesInRange(player, radius);
    if (projectiles.length === 0)
        return origin.sendMessage({ translate: 'commands.claimprojectiles.fail.nonefound', with: [String(radius)] });
    const numChanged = changeOwner(projectiles, player);
    player.sendMessage({ translate: 'commands.claimprojectiles.success.self', with: [String(numChanged), String(radius)] });
    if (origin !== player)
        origin.sendMessage({ translate: 'commands.claimprojectiles.success.other', with: [String(numChanged), String(radius), player.name] });
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