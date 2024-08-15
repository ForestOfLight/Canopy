import { world } from '@minecraft/server';
import { Rule, Command } from 'lib/canopy/Canopy';

const CLAIM_RADIUS = 10;

new Rule({
    identifier: 'commandClaimProjectiles',
    description: 'Allow the use of the claimprojectiles command.',
});

new Command({
    name: 'claimprojectiles',
    description: 'Change the owner of projectiles within a radius.',
    usage: 'claimprojectiles [playerName]',
    args: [
        { type: 'string', name: 'playerName' }
    ],
    callback: claimProjectilesCommand,
    contingentRules: ['commandClaimProjectiles']
});

function claimProjectilesCommand(sender, args) {
    const { playerName } = args;
    const targetPlayer = getTargetPlayer(sender, playerName);
    if (!targetPlayer)
        return sender.sendMessage(`§cPlayer "${playerName}" was not found.`)
    const projectiles = getProjectilesInRange(sender, CLAIM_RADIUS);

    if (projectiles.length === 0)
        return sender.sendMessage('§7No projectiles found in range.');
    
    const numChanged = changeOwner(projectiles, targetPlayer);
    sender.sendMessage(`§7Successfully changed the owner of ${numChanged} projectiles to ${targetPlayer.name}.`)
}

function getTargetPlayer(sender, playerName) {
    if (playerName === null)
        return sender;
    const players = world.getPlayers({ name: playerName });
    if (players.length === 1)
        return players[0];
    else
        return undefined;
}

function getProjectilesInRange(sender, radius) {
    const radiusProjectiles = new Array();
    const radiusEntities = sender.dimension.getEntities({ location: sender.location, maxDistance: radius });
    for (const entity of radiusEntities) {
        if (entity.hasComponent('minecraft:projectile'))
            radiusProjectiles.push(entity);
    }
    return radiusProjectiles;
}

function changeOwner(projectiles, targetPlayer) {
    for (const projectile of projectiles) {
        projectile.getComponent('minecraft:projectile').owner = targetPlayer;
    }
    return projectiles.length;
}