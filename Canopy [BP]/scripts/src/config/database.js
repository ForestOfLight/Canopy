import Dynamic, { module } from 'stickycore/dynamic'

const infoDisplay = newDB([
    'showDisplay',
    'coords',
    'facing',
    'tps',
    'light',
    'entities',
    'slimeChunk',
    'worldDay',
    'timeOfDay',
    'moonPhase',
    'eventTrackers',
    'hopperCounters',
    'lookingAt',
    'peekInventory',
    'all',
]);

const features = newDB([
    'allowSpawnMocking',
    'camera',
    'claimprojectiles',
    'dupeTnt',
    'flippinArrows',
    'hardcodedTntPrimeMomentum',
    'hopperCounters',
    'hotbarSwitching',
    'hotbarSwitchingInSurvival',
    'jump',
    'jumpInSurvival',
    'noExplosionBlockDamage',
    'noTileDrops',
    'noTntPrimeMomentum',
    'pickupOnMine',
    'pistonBedrockBreaking',
    'renewableSponge',
    'summontnt',
    'universalChunkLoading',
    'warp',
    'warpInSurvival',
]);

module({
    infoDisplay, features
});

function newDB(arr, db = true) {
	let struct = {};
	arr.forEach(_ => {
		struct[_.toLowerCase()] = _;
		if (db) {
            new Dynamic('boolean', _);
        }
	});
	
	return struct;
}