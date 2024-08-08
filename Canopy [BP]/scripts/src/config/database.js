import Dynamic, { module } from 'stickycore/dynamic'

const infoDisplay = newDB([
    'showDisplay',
    'coords',
    'facing',
    'tps',
    'entities',
    'biome',
    'light',
    'worldDay',
    'timeOfDay',
    'sessionTime',
    'moonPhase',
    'slimeChunk',
    'eventTrackers',
    'hopperCounters',
    'lookingAt',
    'peekInventory',
]);

const features = newDB([
    'armorStandRespawning',
    'commandCamera',
    'commandClaimProjectiles',
    'commandJump',
    'commandJumpSurvival',
    'commandRemoveEntity',
    'commandSpawnMocking',
    'commandSummonTnt',
    'commandTntFuse',
    'commandTick',
    'commandWarp',
    'commandWarpSurvival',
    'dupeTnt',
    'entityInstantDeath',
    'explosionChainReactionOnly',
    'explosionNoBlockDamage',
    'flippinArrows',
    'hopperCounters',
    'hotbarSwitching',
    'hotbarSwitchingSurvival',
    'instantTame',
    'instantTameSurvival',
    'noExplosion',
    'noTileDrops',
    'pickupOnMine',
    'pistonBedrockBreaking',
    'renewableElytra',
    'renewableSponge',
    'tntPrimeMaxMomentum',
    'tntPrimeNoMomentum',
    'universalChunkLoading'
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