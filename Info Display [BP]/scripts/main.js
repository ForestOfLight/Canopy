import * as mc from '@minecraft/server'

import 'src/config/database'
import 'src/commands/info'
import 'src/commands/help'
import 'src/commands/peek'
import 'src/commands/jump'
import 'src/commands/plot'
import 'src/commands/gamemode'
import 'src/commands/camera'

import Data from 'stickycore/data'
import { DataTPS } from 'src/tps'
import { Entities } from 'src/entities'

mc.system.runInterval(() => {
	const Players = mc.world.getAllPlayers();
	for (const player of Players) {
		if (player.getDynamicProperty('showDisplay')) InfoDisplay(player);
	}
});

let Time = 0;
mc.system.runInterval(() => {
	Time = TicksToTime(Data.getTimeOfDay());
}, 20);

function TicksToTime(ticks) {
	const ticksPerDay = 24000;
	const ticksPerHour = ticksPerDay / 24;
	ticks = (ticks + 6 * ticksPerHour) % ticksPerDay; // 0 ticks is 6:00 AM in game
	
	let hours = Math.floor(ticks / ticksPerHour);
	const minutes = Math.floor((ticks % ticksPerHour) * 60 / ticksPerHour);
	
	let period = 'AM';
	if (hours >= 12) period = 'PM';
	if (hours >= 13) hours -= 12;
	else if (hours === 0) hours = 12;

	const formattedHours = hours.toString().padStart(2, '0');
	const formattedMinutes = minutes.toString().padStart(2, '0');

	return `${formattedHours}:${formattedMinutes} ${period}`;
}

function InfoDisplay(player) { // Main
	const showCoords = player.getDynamicProperty('coords');
	const showFacing = player.getDynamicProperty('facing');
	const showTPS = player.getDynamicProperty('tps');
	const showEntities = player.getDynamicProperty('entities');
	//const showLight = player.getDynamicProperty('light');
	const showSlimeChunk = player.getDynamicProperty('slimeChunk');
	const showDay = player.getDynamicProperty('worldDay');
	const showTimeOfDay = player.getDynamicProperty('timeOfDay');
	const showMoonPhase = player.getDynamicProperty('moonPhase');
	const showLookingAt = player.getDynamicProperty('lookingAt');
	const showPeekInventory = player.getDynamicProperty('peekInventory');

	let Coords = player.location;
	let Facing;
	let SimDistanceEntities;
	let DimensionEntities;
	let WorldEntities;
	let TPS;
	//let Light;
	let SlimeChunk;
	let Day;
	let MoonPhase;
	let LookingAtBlock;
	let LookingAtEntities;
	let LookingAtName;
	let PeekInventory;

	if (showCoords) [ Coords.x, Coords.y, Coords.z ] = [ Coords.x.toFixed(2), Coords.y.toFixed(2), Coords.z.toFixed(2) ];
	if (showFacing) Facing = Data.getPlayerDirection(player);
	if (showTPS) {
		const _tps = DataTPS.tps.toFixed(1);
		TPS = _tps >= 20 ? `§a20.0` : `§c${_tps}`;
	}
	if (showEntities) {
		SimDistanceEntities = Entities.getPlayerRadiusEntities(player, player.dimension.id, 96);
		DimensionEntities = Entities.getDimensionEntities(player.dimension.id);
		WorldEntities = Entities.getWorldEntities();
	}
	//if (showLight) Light = 0;
	if (showSlimeChunk) SlimeChunk = player.dimension.id == "minecraft:overworld" && Data.isSlime(Coords.x, Coords.z) ? '§7(§aSlime Chunk§7)§r' : '';
	if (showDay) Day = Data.getDay();
	if (showMoonPhase) MoonPhase = Data.getMoonPhase();
	if (showLookingAt) {
		LookingAtBlock = Data.getLookingAtBlock(player);
		LookingAtEntities = Data.getLookingAtEntities(player);
		LookingAtName = Data.parseLookingAtEntity(LookingAtEntities).LookingAtName || Data.parseLookingAtBlock(LookingAtBlock).LookingAtName;
	}
	if (showPeekInventory) {
		if (!LookingAtBlock) LookingAtBlock = Data.getLookingAtBlock(player);
		if (!LookingAtEntities) LookingAtEntities = Data.getLookingAtEntities(player);
		PeekInventory = Data.peekInventory(LookingAtBlock, LookingAtEntities);
	}

	let InfoText = '';
	if (showCoords && showFacing) InfoText += `§r${Coords.x} ${Coords.y} ${Coords.z}§r §7${Facing}§r\n`;
	else if (showCoords) InfoText += `§r${Coords.x} ${Coords.y} ${Coords.z}§r\n`;
	else if (showFacing) InfoText += `§rFacing: §7${Facing}§r\n`;
	if (showTPS && showEntities) InfoText += `§rTPS: ${TPS}§r Entities: §7${SimDistanceEntities}§r/§d${DimensionEntities}§r/§a${WorldEntities}§r\n`;
	else if (showTPS) InfoText += `§rTPS: ${TPS}§r\n`;
	else if (showEntities) InfoText += `§rEntities: §7${SimDistanceEntities}§r/§d${DimensionEntities}§r/§a${WorldEntities}§r\n`;
	// if (showLight && showSlimeChunk) InfoText += `§rLight: §e${Light} §r${SlimeChunk}\n`;
	// else if (showLight) InfoText += `§rLight: §e${Light}§r\n`;
	// else if (showSlimeChunk) InfoText += `§rChunk: ${SlimeChunk}\n`;
	if (showSlimeChunk) InfoText += `§rChunk: ${SlimeChunk}\n`;
	if (showDay && showTimeOfDay) InfoText += `Day: §7${Day}§r §7${Time}§r\n`;
	else if (showDay) InfoText += `§rDay: §7${Day}§r\n`;
	else if (showTimeOfDay) InfoText += `§rTime: §7${Time}§r\n`;
	if (showMoonPhase) InfoText += `§rMoon: §7${MoonPhase}§r\n`;
	if (showLookingAt) InfoText += `${LookingAtName}`;
	if (showPeekInventory) InfoText += `${PeekInventory}`;

	player.onScreenDisplay.setActionBar(InfoText.trim());
}
