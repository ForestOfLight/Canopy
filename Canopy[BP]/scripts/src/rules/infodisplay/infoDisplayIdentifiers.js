import { BIOME_IDENTIFIER } from './Biome';
import { BLOCK_STATES_IDENTIFIER } from './BlockStates';
import { CARDINAL_FACING_IDENTIFIER } from './CardinalFacing';
import { CHUNK_COORDS_IDENTIFIER } from './ChunkCoords';
import { COORDS_IDENTIFIER } from './Coords';
import { DIMENSION_IDENTIFIER } from './Dimension';
import { ENTITIES_IDENTIFIER } from './Entities';
import { EVENT_TRACKERS_IDENTIFIER } from './EventTrackers';
import { FACING_IDENTIFIER } from './Facing';
import { HELD_ITEM_DURABILITY_IDENTIFIER } from './HeldItemDurability';
import { HOPPER_COUNTER_COUNTS_IDENTIFIER } from './HopperCounterCounts';
import { LIGHT_IDENTIFIER } from './Light';
import { LIQUID_STATES_IDENTIFIER } from './LiquidStates';
import { LIQUID_TARGET_IDENTIFIER } from './LiquidTarget';
import { MOON_PHASE_IDENTIFIER } from './MoonPhase';
import { NO_FOG_IDENTIFIER } from './NoFog';
import { PEEK_INVENTORY_IDENTIFIER } from './PeekInventory';
import { PING_IDENTIFIER } from './Ping';
import { RENDER_LIGHT_LEVEL_IDENTIFIER } from './RenderLightLevel';
import { RENDER_SIGNAL_STRENGTH_IDENTIFIER } from './RenderSignalStrength';
import { SESSION_TIME_IDENTIFIER } from './SessionTime';
import { SIGNAL_STRENGTH_IDENTIFIER } from './SignalStrength';
import { SIMULATION_MAP_IDENTIFIER } from './SimulationMap';
import { SLIME_CHUNK_IDENTIFIER } from './SlimeChunk';
import { SPEED_IDENTIFIER } from './Speed';
import { STRUCTURES_IDENTIFIER } from './Structures';
import { TARGET_IDENTIFIER } from './Target';
import { TIME_OF_DAY_IDENTIFIER } from './TimeOfDay';
import { TPS_IDENTIFIER } from './TPS';
import { VELOCITY_IDENTIFIER } from './Velocity';
import { WEATHER_IDENTIFIER } from './Weather';
import { WORLD_DAY_IDENTIFIER } from './WorldDay';

// Single source of truth for the set of InfoDisplay rule IDs available at startup.
// Each identifier is owned by its element class (exported as *_IDENTIFIER); this module
// collects them so the /info command enum can be populated at command-registration time,
// before any per-player InfoDisplay (and therefore any InfoDisplay rule) has been built.
// Add a new InfoDisplay rule here when you add its element class; the drift-guard test in
// infoDisplayIdentifiers.test.js fails if this list and the registered rules diverge.
export const INFODISPLAY_RULE_IDENTIFIERS = [
    BIOME_IDENTIFIER,
    BLOCK_STATES_IDENTIFIER,
    CARDINAL_FACING_IDENTIFIER,
    CHUNK_COORDS_IDENTIFIER,
    COORDS_IDENTIFIER,
    DIMENSION_IDENTIFIER,
    ENTITIES_IDENTIFIER,
    EVENT_TRACKERS_IDENTIFIER,
    FACING_IDENTIFIER,
    HELD_ITEM_DURABILITY_IDENTIFIER,
    HOPPER_COUNTER_COUNTS_IDENTIFIER,
    LIGHT_IDENTIFIER,
    LIQUID_STATES_IDENTIFIER,
    LIQUID_TARGET_IDENTIFIER,
    MOON_PHASE_IDENTIFIER,
    NO_FOG_IDENTIFIER,
    PEEK_INVENTORY_IDENTIFIER,
    PING_IDENTIFIER,
    RENDER_LIGHT_LEVEL_IDENTIFIER,
    RENDER_SIGNAL_STRENGTH_IDENTIFIER,
    SESSION_TIME_IDENTIFIER,
    SIGNAL_STRENGTH_IDENTIFIER,
    SIMULATION_MAP_IDENTIFIER,
    SLIME_CHUNK_IDENTIFIER,
    SPEED_IDENTIFIER,
    STRUCTURES_IDENTIFIER,
    TARGET_IDENTIFIER,
    TIME_OF_DAY_IDENTIFIER,
    TPS_IDENTIFIER,
    VELOCITY_IDENTIFIER,
    WEATHER_IDENTIFIER,
    WORLD_DAY_IDENTIFIER
];
