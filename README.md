# InfoDisplay (& more) for the Amelix Foundation
This pack aims to bring technical informatics and QoL changes to a Technical Minecraft Bedrock Edition SMP (Survival Multi-Player) setting.
It is recommended to also use the [Bedrock Technical Resource Pack](https://github.com/RavinMaddHatter/Bedrock-Technical-Resource-Pack/wiki) for even more information.
The original Info Display made by Alecs Developer can be found [here](https://www.curseforge.com/minecraft-bedrock/scripts/info-display). To learn more about the Amelix Foundation Technical Minecraft Bedrock Edition server, join our [Discord Server](https://discord.gg/FabqwVzgyD)!

# Usage

All commands are preceded by a simple `./`. For example, our first command:

`./help`\
Displays the list of commands and InfoDisplay features. Each InfoDisplay feature will display whether it is currently enabled or not.

## InfoDisplay Toggles

These are the main features of the InfoDisplay. The whatever features listed below are selected by each player will show up in the top-right of their screen. Only features they turn on will be calculated and shown in the InfoDisplay. (Some of these can become laggy with several players online, so it is best to use only what you need at those times.)

`./info <feature> <true/false> (or ./i <feature> <true/false>)`\
Toggles a feature on and off.
```
shouldDisplay - whether the whole InfoDisplay shows up on the screen.
coords - coordinates (truncated at 2 decimal places).
facing - N,S,E,W & shows the coord direction (ex. N (-z)).
tps - Ticks Per Second of the server.
entities - shows the number of entities being processed by the server. (simulation-distance/dimension/world).
light - light level at your foot. (DEPRECATED)
slimeChunk - whether the current chunk is a slime chunk (only displays when true).
worldDay - count of Minecraft days since the world began.
timeOfDay - minecraft day-cycle time.
moonPhase - the current phase of the moon.
lookingAt - the block or entity you're currently looking at (redstone shows signal strength).
peekInventory - the inventory of the block or entity you're looking at (works in spectator).
all - toggle all of the above true or false.
```

## Plots Commands

The plots commands are simply warp locations that can be set by any player. They are not player-specific, so any player can teleport to a plot once it has been added. These commands are particularly useful in a CMP (Creative Multi-Player) setting.

`./plot (or ./pl) <add/remove> <name>`\
Adds or removes a plot. Any name that is not a single-word string should be encased in quotes.

`./plot (or ./pl) tp <name>`\
Teleports you to a plot. Not usable while in survival mode. That your plot name should still be encased in quotes if it is not a single-word string.

`./plotlist`\
Lists all available plots in chat.

## Camera Commands

These commands are great for taking photos and making montages or timelapses. Your player can still move around while your camera is active, so be careful or use that to your advantage!

`./placeCamera (or ./pc)`\
Sets a static camera for you to return to with the following command.

`./viewCamera (or ./vc)`\
Toggles viewing your placed camera. Logging out or switching dimensions will reset your perspective.

## QoL Commands

Some extra commands are also included to make your life easier. Enjoy!

`./peek (or ./p)`\
Show the inventory in chat of the block or entity you're looking at.

`./jump (or ./j)`\
Teleports you to the block you are currently looking at with a maximum range of 64 chunks.

`./c, ./s, and ./sp`\
Can be used to quickly switch between survival (s), creative (c), and spectator (sp) mode.
