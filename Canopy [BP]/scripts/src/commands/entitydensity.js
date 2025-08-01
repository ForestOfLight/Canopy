import { VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, Player, world } from '@minecraft/server';
import { getColoredDimensionName } from "../../include/utils";

const NUM_RESULTS = 10;

const validDimensions = {
    'o': 'overworld',
    'overworld': 'overworld',
    'n': 'nether',
    'nether': 'nether',
    'e': 'the_end',
    'end': 'the_end',
    'the_end': 'the_end'
};

new VanillaCommand({
    name: 'canopy:entitydensity',
    description: 'commands.entitydensity',
    mandatoryParameters: [{name: 'gridSize', type: CustomCommandParamType.Integer}],
    optionalParameters: [{name: 'canopy:dimension', type: CustomCommandParamType.Enum}],
    permissionLevel: CommandPermissionLevel.Any,
    callback: entityDensityCommand
});

function entityDensityCommand(source, gridSize, dimension) {
    if (!(source instanceof Player))
        return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
    const { validDimensionId, parsedGridSize, hasNoErrors } = parseArgs(source, gridSize, dimension);
    if (!hasNoErrors)
        return void 0;
    printDimensionEntities(source);
    const denseAreas = findDenseAreas(validDimensionId, parsedGridSize, NUM_RESULTS);
    if (denseAreas.length === 0) {
        source.sendMessage({ translate: 'commands.entitydensity.fail.noentities', with: [getColoredDimensionName(validDimensionId)] });
        return void 0;
    }
    const message = { rawtext: [{ translate: 'commands.entitydensity.success.header', with: [getColoredDimensionName(validDimensionId), String(parsedGridSize), String(parsedGridSize)] }] };
    denseAreas.forEach(area => {
        message.rawtext.push({ text: '\n' });
        message.rawtext.push(formatAreaMessage(area));
    });
    source.sendMessage(message);
    return void 0;
}

function parseArgs(source, gridSize, dimension) {
    let hasNoErrors = true;
    let validDimensionId;
    const parsedGridSize = gridSize;
    if (dimension)
        validDimensionId = validDimensions[dimension.toLowerCase()];
    else
        validDimensionId = source.dimension.id.replace('minecraft:', '');

    if (!validDimensionId) {
        source.sendMessage({ translate: 'commands.entitydensity.fail.dimension', with: [Object.keys(validDimensions).join(', ')] });
        hasNoErrors = false;
    }
    if (parsedGridSize < 1 || parsedGridSize > 2048) {
        source.sendMessage({ translate: 'commands.entitydensity.fail.gridsize' });
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