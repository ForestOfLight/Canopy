import Command from 'stickycore/command'
import { Entities } from 'src/entities'

new Command()
    .setName('entitydensity')
    .addArgument('string', 'dimensionId')
    .addArgument('number', 'gridSize')
    .setCallback(entityDensityCommand)
    .build()

function entityDensityCommand(sender, args) {
    const { dimensionId, gridSize } = args;
    const numResults = 10;
    const { validDimensionId, hasNoErrors } = parseArgs(sender, dimensionId, gridSize);
    if (hasNoErrors === false) return;
    
    const denseAreas = Entities.findDenseAreas(validDimensionId, gridSize, numResults);
    if (denseAreas.length === 0) return sender.sendMessage(`§7No dense areas found in ${validDimensionId}. No entities in the dimension?`);

    sender.sendMessage(`§7Entity-dense areas in ${validDimensionId} (grid size ${gridSize}x${gridSize}):`);
    denseAreas.forEach(area => sender.sendMessage(formatAreaMessage(area)));
}

function parseArgs(sender, dimensionId, gridSize) {
    let hasNoErrors = true;
    const validDimensions = {
        'o': 'overworld',
        'overworld': 'overworld',
        'n': 'nether',
        'nether': 'nether',
        'e': 'the_end',
        'end': 'the_end',
        'the_end': 'the_end'
    };
    const validDimensionId = validDimensions[dimensionId.toLowerCase()];
    if (!validDimensionId) {
        sender.sendMessage('§cInvalid dimension. Please use one of these: ', Object.keys(validDimensions).join(', '));
        hasNoErrors = false;
    }
    if (gridSize < 1 || gridSize > 512) {
        sender.sendMessage('§cInvalid grid size. Please use a value between 1 and 128. Recommended: 32-128.');
        hasNoErrors = false;
    }
    return { validDimensionId, hasNoErrors };
}

function formatAreaMessage(area) {
    const [ x, z ] = area.coordinates;
    const count = area.count;
    const gridSize = area.gridSize;
    return `§7- ${count} entities at ${x * gridSize}, ${z * gridSize}`;
}