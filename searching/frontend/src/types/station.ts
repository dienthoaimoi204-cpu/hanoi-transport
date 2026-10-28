export interface Station {
    StationId: number;
    StationCode: string;
    StationName: string;
    Latitude: number;
    Longitude: number;
    Address?: string;
    TransportType?: string;
}