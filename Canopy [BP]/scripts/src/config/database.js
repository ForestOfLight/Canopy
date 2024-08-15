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

const rules = newDB([
    'armorStandRespawning',
    'autoItemPickup',
    'commandCamera',
    'commandClaimProjectiles',
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
    'explosionOff',
    'flippinArrows',
    'hopperCounters',
    'hotbarSwitching',
    'hotbarSwitchingSurvival',
    'instantTame',
    'instantTameSurvival',
    'noTileDrops',
    'pistonBedrockBreaking',
    'renewableElytra',
    'renewableSponge',
    'tntPrimeMaxMomentum',
    'tntPrimeNoMomentum',
    'universalChunkLoading'
]);

module({
    infoDisplay, rules
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