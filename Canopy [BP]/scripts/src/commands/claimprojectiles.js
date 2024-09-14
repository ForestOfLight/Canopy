import { world } from '@minecraft/server';
import { Rule, Command } from 'lib/canopy/Canopy';
import Utils from 'stickycore/utils';

const CLAIM_RADIUS = 25;

new Rule({
    category: 'Rules',
    identifier: 'commandClaimProjectiles',
    description: 'Enables claimprojectiles command.',
});

new Command({
    name: 'claimprojectiles',
    description: `Changes the owner of all projectiles within a radius.`,
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
        return sender.sendMessage(`§cPlayer "${playerName}" was not found.`)
    if (Utils.isNumeric(playerName)) {
        radius = playerName;
        targetPlayer = sender;
    }
    if (radius === null)
        radius = CLAIM_RADIUS;
    
    const projectiles = getProjectilesInRange(targetPlayer, radius);
    if (projectiles.length === 0)
        return sender.sendMessage(`§7No projectiles found in range (${radius} blocks).`);
    
    const numChanged = changeOwner(projectiles, targetPlayer);
    targetPlayer.sendMessage(`§7Successfully became the owner of ${numChanged} projectiles within ${radius} blocks of you.`);
    if (sender !== targetPlayer)
        sender.sendMessage(`§7Successfully changed the owner of ${numChanged} projectiles within ${radius} blocks of ${targetPlayer.name}.`)
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