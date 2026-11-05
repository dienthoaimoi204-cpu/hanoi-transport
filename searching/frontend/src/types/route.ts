export interface RouteStation {
    stationId: number;
    stationName: string;
    latitude: number;
    longitude: number;
    [key: string]: unknown;
}

export interface RouteSegment {
    [key: string]: unknown;
}

export interface PlanRouteResponse {
    totalDistanceKm: number;
    totalDurationMinutes: number;
    segments: RouteSegment[];
    stations: RouteStation[];
}

export interface PlanRouteRequest {
    startStationId: number;
    endStationId: number;
    transportTypeIds?: number[];
}