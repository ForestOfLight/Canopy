import * as mc from '@minecraft/server'

import 'src/config/database'
import 'src/commands/info'
import 'src/commands/help'
import 'src/commands/peek'
import 'src/commands/jump'
import 'src/commands/warp'
import 'src/commands/gamemode'
import 'src/commands/camera'
import 'src/commands/feature'
import 'src/commands/distance'
import 'src/commands/tntlog'
import 'src/commands/summontnt'
import 'src/commands/entitydensity'
import 'src/commands/tps'

import 'src/features/noExplosionBlockDamage'
import 'src/features/pickupOnMine'
import 'src/features/universalChunkLoading'

import Data from 'stickycore/data'
import Utils from 'stickycore/utils'
import { DataTPS } from 'src/tps'
import { Entities } from 'src/entities'

mc.system.runInterval(() => {
	const Players = mc.world.getAllPlayers();
	for (const player of Players) {
		if (player.getDynamicProperty('showDisplay')) InfoDisplay(player);
	}
});

let dayTime = 0;
mc.system.runInterval(() => {
	dayTime = Utils.ticksToTime(Data.getTimeOfDay());
}, 20);

function InfoDisplay(player) {
	let InfoText = '';

	InfoText += parseCoordsAndFacing(player);
	InfoText += parseTPSAndEntities(player);
	InfoText += parseLightAndSlimeChunk(player);
	InfoText += parseDayAndTime(player);
	InfoText += parseMoonPhase(player);
	InfoText += parseLookingAtAndPeek(player);
	
	player.onScreenDisplay.setActionBar(InfoText.trim());
}

function parseCoordsAndFacing(player) {
	const showCoords = player.getDynamicProperty('coords');
	const showFacing = player.getDynamicProperty('facing');
	let coords = player.location;
	let facing;
	let output = '';

	if (showCoords) [ coords.x, coords.y, coords.z ] = [ coords.x.toFixed(2), coords.y.toFixed(2), coords.z.toFixed(2) ];
	if (showFacing) facing = Data.getPlayerDirection(player);
	if (showCoords && showFacing) output += `§r${coords.x} ${coords.y} ${coords.z}§r §7${facing}§r\n`;
	else if (showCoords) output += `§r${coords.x} ${coords.y} ${coords.z}§r\n`;
	else if (showFacing) output += `§rFacing: §7${facing}§r\n`;

	return output;
}

function parseTPSAndEntities(player) {
	const showTPS = player.getDynamicProperty('tps');
	const showEntities = player.getDynamicProperty('entities');
	let tps;
	let fovEntities;
	let simDistanceEntities;
	let dimensionEntities;
	let worldEntities;
	let output = '';

	if (showTPS) {
		const _tps = DataTPS.tps.toFixed(1);
		tps = _tps >= 20 ? `§a20.0` : `§c${_tps}`;
	}
	if (showEntities) {
		fovEntities = Entities.getEntitiesOnScreenCount(player);
		simDistanceEntities = Entities.getPlayerRadiusEntityCount(player, 96);
		dimensionEntities = Entities.getDimensionEntityCount(player.dimension.id);
		worldEntities = Entities.getWorldEntityCount();
	}
	if (showTPS && showEntities) output += `§rTPS: ${tps}§r §7${fovEntities}§r/${simDistanceEntities}/§d${dimensionEntities}§r/§a${worldEntities}§r\n`;
	else if (showTPS) output += `§rTPS: ${tps}§r\n`;
	else if (showEntities) output += `§rEntities: §8${fovEntities}§r/§7${simDistanceEntities}§r/§d${dimensionEntities}§r/§a${worldEntities}§r\n`;

	return output;
}

function parseLightAndSlimeChunk(player) {
	//const showLight = player.getDynamicProperty('light');
	const showSlimeChunk = player.getDynamicProperty('slimeChunk');
	//let Light;
	let slimeChunk;
	let output = '';

	//if (showLight) Light = 0;
	if (showSlimeChunk) slimeChunk = player.dimension.id == "minecraft:overworld" && Data.isSlime(player.location.x, player.location.z) ? '§7(§aSlime Chunk§7)§r' : '';
	// if (showLight && showSlimeChunk) output += `§rLight: §e${Light} §r${SlimeChunk}\n`;
	// else if (showLight) output += `§rLight: §e${Light}§r\n`;
	// else if (showSlimeChunk) output += `§rChunk: ${SlimeChunk}\n`;
	if (showSlimeChunk) output += `§rChunk: ${slimeChunk}\n`; // TEMP: while Light is broken

	return output;
}

function parseDayAndTime(player) {
	const showDay = player.getDynamicProperty('worldDay');
	const showTimeOfDay = player.getDynamicProperty('timeOfDay');
	let day;
	let output = '';

	if (showDay) day = Data.getDay();
	if (showDay && showTimeOfDay) output += `Day: §7${day}§r §7${dayTime}§r\n`;
	else if (showDay) output += `§rDay: §7${day}§r\n`;
	else if (showTimeOfDay) output += `§rTime: §7${dayTime}§r\n`;

	return output;
}

function parseMoonPhase(player) {
	const showMoonPhase = player.getDynamicProperty('moonPhase');
	let moonPhase;
	let output = '';

	if (showMoonPhase) {
		moonPhase = Data.getMoonPhase();
		output = `§rMoon: §7${moonPhase}§r\n`;
	}

	return output;
}

function parseLookingAtAndPeek(player) {
	const showLookingAt = player.getDynamicProperty('lookingAt');
	const showPeekInventory = player.getDynamicProperty('peekInventory');
	let blockRayResult;
	let entityRayResult;
	let lookingAtName;
	let peekInventory;
	let output = '';

	if (!showLookingAt && !showPeekInventory) return '';
	({ blockRayResult, entityRayResult } = Data.getRaycastResults(player, 7));
	if (showLookingAt) {
		lookingAtName = Utils.parseLookingAtEntity(entityRayResult).LookingAtName || Utils.parseLookingAtBlock(blockRayResult).LookingAtName;
		output += `${lookingAtName}`;
	}
	if (showPeekInventory) {
		peekInventory = Data.peekInventory(player, blockRayResult, entityRayResult);
		output += `${peekInventory}`;
	}

	return output;
}
