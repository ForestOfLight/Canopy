import { world } from '@minecraft/server';
import { Rule, Command } from 'lib/canopy/Canopy';
import Utils from 'include/utils';

const CLAIM_RADIUS = 25;

new Rule({
    category: 'Rules',
    identifier: 'commandClaimProjectiles',
    description: { translate: 'rules.commandClaimProjectiles' },
});

new Command({
    name: 'claimprojectiles',
    description: { translate: 'commands.claimprojectiles' },
    usage: 'claimprojectiles [playerName/radius] [radius]',
    args: [
        { type: 'string|number', name: 'playerName' },
        { type: 'number', name: 'radius' }
    ],
    callback: claimProjectilesCommand,
    contingentRules: ['commandClaimProjectiles']
});

function claimProjectilesCommand(sender, args) {
    let { playerName, radius } = args;
    let targetPlayer;
    if (playerName === null)
        targetPlayer = sender;
    else
        targetPlayer = getTargetPlayer(sender, String(playerName));
    if (!targetPlayer)
        return sender.sendMessage({ translate: 'generic.player.notfound', with: [String(playerName)] });
    if (Utils.isNumeric(playerName)) {
        radius = playerName;
        targetPlayer = sender;
    }
    if (radius === null)
        radius = CLAIM_RADIUS;
    
    const projectiles = getProjectilesInRange(targetPlayer, radius);
    if (projectiles.length === 0)
        return sender.sendMessage({ translate: 'commands.claimprojectiles.fail.nonefound', with: [String(radius)] });
    
    const numChanged = changeOwner(projectiles, targetPlayer);
    targetPlayer.sendMessage({ translate: 'commands.claimprojectiles.success.self', with: [String(numChanged), String(radius)] });
    if (sender !== targetPlayer)
        sender.sendMessage({ translate: 'commands.claimprojectiles.success.other', with: [String(numChanged), String(radius), targetPlayer.name] });
}

function getTargetPlayer(sender, playerName) {
    if (playerName === null)
        return sender;
    const players = world.getPlayers({ name: playerName });
    if (players.length === 1)
        return players[0];
    else if (Utils.isNumeric(playerName))
        return playerName;
    else
        return undefined;
}

function getProjectilesInRange(sender, radius) {
    const radiusProjectiles = new Array();
    const radiusEntities = sender.dimension.getEntities({ location: sender.location, maxDistance: radius });
    for (const entity of radiusEntities) {
        if (entity?.hasComponent('minecraft:projectile'))
            radiusProjectiles.push(entity);
    }
    return radiusProjectiles;
}

function changeOwner(projectiles, targetPlayer) {
    for (const projectile of projectiles) {
        if (!projectile)
            continue;
        projectile.getComponent('minecraft:projectile').owner = targetPlayer;
    }
    return projectiles.length;
}