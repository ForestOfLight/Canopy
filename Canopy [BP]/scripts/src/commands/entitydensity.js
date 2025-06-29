import { Command } from "../../lib/canopy/Canopy";
import { world } from '@minecraft/server';
import { isString } from "../../include/utils";

const NUM_RESULTS = 10;

const cmd = new Command({
    name: 'entitydensity',
    description: { translate: 'commands.entitydensity' },
    usage: 'entitydensity [dimension] <gridSize>',
    args: [
        { type: 'string|number', name: 'firstArg' },
        { type: 'number', name: 'gridSize' }
    ],
    callback: entityDensityCommand
});

function entityDensityCommand(sender, args) {
    const firstArg = args.firstArg;
    let gridSize = args.gridSize;
    if (firstArg === null) {
        cmd.sendUsage(sender);
        return;
    }
    const { validDimensionId, parsedGridSize, hasNoErrors } = parseArgs(sender, firstArg, gridSize);
    if (hasNoErrors === false)
        return;
    if (parsedGridSize)
        gridSize = parsedGridSize;
    
    printDimensionEntities(sender);
    const denseAreas = findDenseAreas(validDimensionId, gridSize, NUM_RESULTS);
    if (denseAreas.length === 0) {
        sender.sendMessage({ translate: 'commands.entitydensity.fail.noentities', with: [validDimensionId] });
        return;
    }

    const message = { rawtext: [{ translate: 'commands.entitydensity.success.header', with: [validDimensionId, String(gridSize), String(gridSize)] }] };
    denseAreas.forEach(area => {
        message.rawtext.push({ text: '\n' });
        message.rawtext.push(formatAreaMessage(area));
    });
    sender.sendMessage(message);
}

function parseArgs(sender, firstArg, gridSize) {
    let hasNoErrors = true;
    let validDimensionId;
    let parsedGridSize = gridSize;

    const validDimensions = {
        'o': 'overworld',
        'overworld': 'overworld',
        'n': 'nether',
        'nether': 'nether',
        'e': 'the_end',
        'end': 'the_end',
        'the_end': 'the_end'
    };

    if (isString(firstArg)) {
        validDimensionId = validDimensions[firstArg.toLowerCase()];
    } else if (Number.isInteger(firstArg)) {
        parsedGridSize = firstArg;
        validDimensionId = sender.dimension.id.replace('minecraft:', '');
    }

    if (!validDimensionId) {
        sender.sendMessage({ translate: 'commands.entitydensity.fail.dimension', with: [Object.keys(validDimensions).join(', ')] });
        hasNoErrors = false;
    }
    if (parsedGridSize < 1 || parsedGridSize > 2048) {
        sender.sendMessage({ translate: 'commands.entitydensity.fail.gridsize' });
        hasNoErrors = false;
    }
    return { validDimensionId, parsedGridSize, hasNoErrors };
}

function printDimensionEntities(sender) {
    const dimensionColors = ['§a', '§c', '§d'];
    let totalEntities = 0;
    const dimensionIds = ['minecraft:overworld', 'minecraft:nether', 'minecraft:the_end'];
    let output = '§7Dimension entities: '
    for (let i = 0; i < dimensionIds.length; i++) {
        const dimensionId = dimensionIds[i];
        const color = dimensionColors[i];
        const dimensionEntities = world.getDimension(dimensionId).getEntities();
        totalEntities += dimensionEntities.length;
        output += `${color}${dimensionEntities.length}§r`;
        if (i < dimensionIds.length - 1)
            output += '/';
        else output += ` §7Total: §f${totalEntities}`;
    }
    sender.sendMessage(output);
}

function formatAreaMessage(area) {
    const [ x, z ] = area.coordinates;
    const count = area.count;
    const gridSize = area.gridSize;
    return { translate: 'commands.entitydensity.success.area', with: [count.toString(), `${x * gridSize}`, `${z * gridSize}`] };
}

function findDenseAreas(dimensionId, gridSize, numResults = 10) {
    const grid = new Map();
    const entities = world.getDimension(dimensionId).getEntities();

    for (const entity of entities) {
        try{
            const cellX = Math.floor(entity.location.x / gridSize);
            const cellZ = Math.floor(entity.location.z / gridSize);
            const key = `${cellX},${cellZ}`;
    
            grid.set(key, (grid.get(key) || 0) + 1);
        } catch {
            continue;
        }
    }
    const sortedCells = Array.from(grid)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);

    return sortedCells.slice(0, numResults).map(cell => ({
        ...cell,
        coordinates: cell.key.split(',').map(Number),
        gridSize
    }));
}

export { printDimensionEntities };