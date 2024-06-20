import Command from 'stickycore/command'
import * as mc from '@minecraft/server'
import Utils from 'stickycore/utils'

class TickingPearls {
    constructor() {
        this.list = [];
        if (!mc.world.getDynamicProperty('tickingPearlsList')) return mc.world.setDynamicProperty('tickingPearlsList', '[]');
        let list = JSON.parse(mc.world.getDynamicProperty('tickingPearlsList'));
    }
}

new Command()
    .setName('tickPearl')
    .setCallback(tickPearlCommand)
    .build()

new Command()
    .setName('tickingPearls')
    .setCallback(tickingPearlsCommand)
    .build()

function tickPearlCommand(sender) {
    if (!mc.world.getDynamicProperty('tickingPearls')) return sender.sendMessage('§cTicking pearls feature is disabled. Use ./help for more options.');

    const tickingPearls = new TickingPearls();
    const tickingPearlsList = JSON.parse(mc.world.getDynamicProperty('tickingPearlsList'));
    const maxDistance = 10;
    const entity = shouldClosestPearlTick(sender, maxDistance, tickingPearlsList);

    if (entity === -1) sender.sendMessage(`§cClosest ender pearl is already ticking!`);
    else if (entity) sender.sendMessage(`§7Ender pearl (${entity.id}) at [${entity.location.x.toFixed(2)}, ${entity.location.y.toFixed(2)}, ${entity.location.z.toFixed(2)}] is now ticking.`);
    else sender.sendMessage(`§cNo ender pearls found within ${maxDistance} blocks.`);
}

function tickingPearlsCommand(sender) {
    if (!mc.world.getDynamicProperty('tickingPearlsList') || !mc.world.getDynamicProperty('tickingPearls')) return sender.sendMessage('§7There are no ticking ender pearls.');
    const tickingPearls = JSON.parse(mc.world.getDynamicProperty('tickingPearlsList'));
    const pearlCount = tickingPearls.length;
    if (pearlCount === 0) return sender.sendMessage('§7There are no ticking ender pearls.');

    const pearlEntities = getPearlEntitiesById(tickingPearls);

    const pearlLocations = pearlEntities.map(pearl => `Pearl (${pearl.id}) at [${pearl.location.x.toFixed(2)}, ${pearl.location.y.toFixed(2)}, ${pearl.location.z.toFixed(2)}] in ${pearl.dimension.id}`);
    sender.sendMessage(`§7${pearlCount} ender pearl(s) currently ticking:\n${pearlLocations.join('\n')}`);
}

function shouldClosestPearlTick(player, maxDistance, tickingPearlsList) {
    let closestEntity = null;
    let closestDistance = maxDistance;
    const entities = player.dimension.getEntities({ type: `minecraft:ender_pearl` }).forEach(entity => {
        const distance = Utils.calcDistance(player.location, entity.location);
        if (distance < closestDistance) {
            closestEntity = entity;
            closestDistance = distance;
        }
    });

    for (const pearl of tickingPearlsList) {
        if (closestEntity.id === pearl.id) {
            return -1;
        }
    }

    if (closestEntity) {
        closestEntity.triggerEvent("info:enable_ticking");
        tickingPearlsList.push(closestEntity);
        mc.world.setDynamicProperty('tickingPearlsList', JSON.stringify(tickingPearlsList));
        return closestEntity;
    }
    return undefined;
}

function updatePearls(sender, enable) {
    if (enable === mc.world.getDynamicProperty('tickingPearl')) return;
    let tickingPearls = JSON.parse(mc.world.getDynamicProperty('tickingPearlsList'));
    const pearlEntities = getPearlEntitiesById(tickingPearls);
    for (const entity of pearlEntities) {
        if (enable) {
            entity.triggerEvent("info:enable_ticking");
            sender.sendMessage(`§7Ender Pearl (${entity.id}) is now ticking.`);
        } else {
            entity.triggerEvent("info:disable_ticking");
            sender.sendMessage(`§7Ender Pearl (${entity.id}) is no longer ticking.`);
        }
    };
    mc.world.setDynamicProperty('tickingPearlsList', JSON.stringify(tickingPearls));
}

function getPearlEntitiesById(tickingPearls) {
    const pearlEntities = [];
    for (const dimension of ['overworld', 'nether', 'the_end']) {
        const dimensionPearls = mc.world.getDimension(dimension).getEntities({ type: 'minecraft:ender_pearl' });
        for (const pearl of dimensionPearls) {
            for (const tickingPearl of tickingPearls) {
                if (pearl.id === tickingPearl.id) {
                    pearlEntities.push(pearl);
                    break;
                }
            }
        }
    }
    return pearlEntities;
}

mc.world.beforeEvents.entityRemove.subscribe((ev) => {
    let tickingPearls = JSON.parse(mc.world.getDynamicProperty('tickingPearlsList'));
    if (!tickingPearls.find(pearl => pearl.id === ev.removedEntity.id)) return;
    tickingPearls = tickingPearls.filter(pearl => pearl.id !== ev.removedEntity.id);
    mc.world.setDynamicProperty('tickingPearlsList', JSON.stringify(tickingPearls));
    console.warn(`Ticking pearl (${ev.removedEntity.id}) removed at [${ev.removedEntity.location.x.toFixed(2)}, ${ev.removedEntity.location.y.toFixed(2)}, ${ev.removedEntity.location.z.toFixed(2)}].`);
});

export { updatePearls };