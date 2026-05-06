import { world } from "@minecraft/server";

export class EndGatewayExits {
    static getLocations() {
        const locationsData = world.getDynamicProperty("end_gateway_exit_locations");
        if (!locationsData)
            return [];
        return JSON.parse(locationsData) ?? [];
    }

    static setLocations(dimensionLocations) {
        if (!dimensionLocations)
            dimensionLocations = [];
        const formattedLocations = dimensionLocations.map(loc => ({ dimension: { id: loc.dimension.id }, x: loc.x, y: loc.y, z: loc.z }));
        world.setDynamicProperty("end_gateway_exit_locations", JSON.stringify(formattedLocations));
    }

    static addLocation(dimension, location) {
        const locations = this.getLocations();
        locations.push({ dimension: { id: dimension.id }, x: location.x, y: location.y, z: location.z });
        this.setLocations(locations);
    }

    static removeLocation(dimension, location) {
        const locations = this.getLocations();
        const updatedLocations = locations.filter(loc => !(loc.dimension.id === dimension.id && loc.x === location.x && loc.y === location.y && loc.z === location.z));
        this.setLocations(updatedLocations);
    }
}