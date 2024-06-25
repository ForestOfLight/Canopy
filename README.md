# InfoDisplay (& more) for the Amelix Foundation
This pack aims to bring technical informatics and QoL changes to a Technical Minecraft Bedrock Edition SMP (Survival Multi-Player) setting.
The original Info Display that this pack is based on, created by Alecs Developer, can be found [here](https://www.curseforge.com/minecraft-bedrock/scripts/info-display).

Related pack: [Bedrock Technical Resource Pack](https://github.com/RavinMaddHatter/Bedrock-Technical-Resource-Pack/wiki) for even more information!

To learn more about the Amelix Foundation Technical Minecraft Bedrock Edition server, join our [Discord](https://discord.gg/FabqwVzgyD)!

# Usage

> This pack uses experimental features! Don't forget to turn on the Beta APIs toggle in the Experimental Features tab.

Once your world is all set up, all commands can be accessed with a preceding `./`. For example, our first command:

`./help`\
Displays the list of commands and InfoDisplay features. Each InfoDisplay feature will display whether it is currently enabled or not.

## InfoDisplay Toggles

These are the main features of the InfoDisplay. The features listed below are selected by each player independently and will show up in the top-right of their screen. Only features they turn on will be calculated and shown in the InfoDisplay. (Some of these can become laggy with several players online, so it is best to use only what you need at those times.) All features are disabled by default.

`./info (or ./i) <feature> <true/false>`\
Toggles some info in your InfoDisplay.
```
shouldDisplay - whether the whole InfoDisplay shows up on the screen.
coords - coordinates (truncated at 2 decimal places).
facing - N,S,E,W & shows the coord direction (ex. N (-z)).
tps - Ticks Per Second of the server.
entities - shows the number of entities being processed by the server. (on-screen/simulation-distance/dimension/world).
light - light level at your foot. (DEPRECATED)
slimeChunk - whether the current chunk is a slime chunk (only displays when true).
worldDay - count of Minecraft days since the world began.
timeOfDay - minecraft day-cycle time.
moonPhase - the current phase of the moon.
lookingAt - the block or entity you're currently looking at (redstone shows signal strength).
peekInventory - the inventory of the block or entity you're looking at (works in spectator).
all - toggle all of the above true or false.
```

## Features Toggles

These are global features that can be toggled by any player. They are not a part of the InfoDisplay, but instead they control the other features available in this pack. All features are disabled by default.

`./feature <feature> <true/false>`\
Toggles a global feature.
```
placecamera - Enables/disables the placecamera and viewcamera commands.
jump - Enables/disables the jump command. Cannot be used while in Survival mode.
jumpInSurvival - Enables/disables the use of the jump command while in Survival mode. Depends on the jump feature.
warp - Enables/disables the warp and warps commands. Cannot be used while in Survival mode.
warpInSurvival - Enables/disables the use of the warp command while in Survival mode. Depends on the warp feature.
noExplosionBlockDamage - Enables/disables explosion block damage. Tnt will still prime but will not break blocks when this is enabled.
summontnt - Enables/disables the summontnt command.
pickupOnMine - Enables/disables the automatic pickup of items when you break a block.
universalChunkLoading - Enables/disables minecarts ticking for ten seconds after they are spawned.
```

## Features Commands

These commands allow you to control features in more specific ways.

`./tntlog <on/off>`\
Logs the location of all primed TNT entities in chat. This command is per-player and will not affect other players.

`./tntlog <precision>`\
Sets the number of decimal places to truncate the tnt location at. The default is 2. Please include quotes around the number field (ex. `./tntlog "6"). There is a maximum of 15 and a minimum of 0. This command is per-player and will not affect other players.

`./summontnt <amount>`\
Summons the specified amount of primed TNT at your location. Only usable while in Creative mode.

## Warps Commands

Warps are simple teleport locations that can be set by any player. They are global, so any player can teleport to a warp once it has been added. These commands are particularly useful in a CMP (Creative Multi-Player) setting. Warps cannot be set or used while in Survival mode unless the `warpInSurvival` feature is enabled.

`./warp (or ./w) <add/remove> <name>`\
Adds or removes a warp. Any name that is not a single-word string should be encased in quotes.

`./warp (or ./w) tp <name>`\
Teleports you to a warp. Not usable while in survival mode. That your warp name should still be encased in quotes if it is not a single-word string.

`./warps`\
Lists all available warps in chat.

## Camera Commands

These commands are great for taking photos and making montages or timelapses. Your player can still move around while your camera is active, so be careful or use that to your advantage!

`./placecamera (or ./pc)`\
Sets a static camera for you to return to with the following command.

`./viewcamera (or ./vc)`\
Toggles viewing your placed camera. Logging out or switching dimensions will reset your perspective.

## QoL Commands

Some extra commands are also included to make your life easier. Enjoy!

`./peek (or ./p)`\
Show the inventory in chat of the block or entity you're looking at up to 64 chunks away.

`./jump (or ./j)`\
Teleports you to the block you are currently looking at with a maximum range of 64 chunks. Jumping is disabled in Survival mode unless the `jumpInSurvival` feature is enabled.

`./c, ./s, and ./sp`\
Can be used to quickly switch between survival (s), creative (c), and spectator (sp) mode.

`./distance (or ./d)`\
Calculates the distance in blocks between you and the block or entity you are looking at down to three decimal places. Note that player and entity positions are at their foot, and block position is non-exact (no decimal places).

`./entityDensity <dimension> <grid size>`\
Identifies dense areas of entities in the specified dimension. The grid size determines the size of each grid cell used to group entities into areas within the dimension, effectively segmenting the dimension into squares of *n* by *n* units to calculate entity density. Recommended: 16-64.

`./tps`\
Displays the server's current ticks per second (TPS) in chat.
