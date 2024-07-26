import { world } from '@minecraft/server';
import Command from 'stickycore/command';

const CLAIM_RADIUS = 10;

new Command()
    .setName('claimprojectiles')
    .addArgument('string', 'playerName')
    .setCallback(claimProjectilesCommand)
    .build()

function claimProjectilesCommand(sender, args) {
    if (!world.getDynamicProperty('claimprojectiles')) 
        return sender.sendMessage('§cThe claimprojectiles feature is disabled.')

    const { playerName } = args;
    const targetPlayer = getTargetPlayer(sender, playerName);
    if (!targetPlayer)
        return sender.sendMessage(`§cPlayer "${playerName}" was not found.`)
    const projectiles = getProjectilesInRange(sender, CLAIM_RADIUS);
    
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