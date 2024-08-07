import Command from 'stickycore/command'
import { Entities } from 'src/entities'
import Utils from 'stickycore/utils'

const NUM_RESULTS = 10;

new Command()
    .setName('entitydensity')
    .addArgument('string|number', 'firstArg')
    .addArgument('number', 'gridSize')
    .setCallback(entityDensityCommand)
    .build()

function entityDensityCommand(sender, args) {
    let { firstArg, gridSize } = args;
    if (firstArg === null) return sender.sendMessage('§cUsage: ./entitydensity <dimension> <gridSize>');
    const { validDimensionId, parsedGridSize, hasNoErrors } = parseArgs(sender, firstArg, gridSize);
    if (hasNoErrors === false) return;
    if (parsedGridSize) gridSize = parsedGridSize;
    
    Entities.printDimensionEntities(sender);
    const denseAreas = Entities.findDenseAreas(validDimensionId, gridSize, NUM_RESULTS);
    if (denseAreas.length === 0) return sender.sendMessage(`§7No dense areas found in ${validDimensionId}. No entities in the dimension?`);

    sender.sendMessage(`§7Entity-dense areas in ${validDimensionId} (grid size ${gridSize}x${gridSize}):`);
    denseAreas.forEach(area => sender.sendMessage(formatAreaMessage(area)));
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
        'the_end': 'the_end',
    };

    if (Utils.isString(firstArg)) {
        validDimensionId = validDimensions[firstArg.toLowerCase()];
    } else if (Number.isInteger(firstArg)) {
        parsedGridSize = firstArg;
        validDimensionId = sender.dimension.id;
    }

    if (!validDimensionId) {
        sender.sendMessage(`§cInvalid dimension. Please use one of these: ${Object.keys(validDimensions).join(', ')}`);
        hasNoErrors = false;
    }
    if (parsedGridSize < 1 || parsedGridSize > 2048) {
        sender.sendMessage('§cInvalid grid size. Please use a value between 1 and 2048. Recommended: 100-512.');
        hasNoErrors = false;
    }
    return { validDimensionId, parsedGridSize, hasNoErrors };
}

function formatAreaMessage(area) {
    const [ x, z ] = area.coordinates;
    const count = area.count;
    const gridSize = area.gridSize;
    return `§7- ${count} entities at ${x * gridSize}, ${z * gridSize}`;
}