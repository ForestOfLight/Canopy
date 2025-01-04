import { Command } from 'lib/canopy/Canopy';
import { Entities } from 'src/entities';
import Utils from 'include/utils';

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
    let { firstArg, gridSize } = args;
    if (firstArg === null)
        return cmd.sendUsage(sender);
    const { validDimensionId, parsedGridSize, hasNoErrors } = parseArgs(sender, firstArg, gridSize);
    if (hasNoErrors === false)
        return;
    if (parsedGridSize)
        gridSize = parsedGridSize;
    
    Entities.printDimensionEntities(sender);
    const denseAreas = Entities.findDenseAreas(validDimensionId, gridSize, NUM_RESULTS);
    if (denseAreas.length === 0)
        return sender.sendMessage({ translate: 'commands.entitydensity.fail.noentities', with: [validDimensionId] });

    const message = { rawtext: [{ translate: 'commands.entitydensity.success.header', with: [validDimensionId, String(gridSize), String(gridSize)] }] };
    denseAreas.forEach(area => {
        message.rawtext.push({ text: '\n' });
        message.rawtext.push(formatAreaMessage(area))
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
        'the_end': 'the_end',
    };

    if (Utils.isString(firstArg)) {
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

function formatAreaMessage(area) {
    const [ x, z ] = area.coordinates;
    const count = area.count;
    const gridSize = area.gridSize;
    return { translate: 'commands.entitydensity.success.area', with: [count.toString(), `${x * gridSize}`, `${z * gridSize}`] };
}