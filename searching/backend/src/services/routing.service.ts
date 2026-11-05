import sql from "mssql";
import { getConnection } from "../config/database";

export interface RouteStationRow {
  RouteId: number;
  RouteCode: string;
  RouteName: string;
  TransportTypeId: number;
  StopOrder: number;
  StationId: number;
  StationName: string;
  Latitude: number;
  Longitude: number;
}

export async function getAllRoutes(){
    const pool = await getConnection();

    const result = await pool.request().query(`
        SELECT
            r.RouteId,
            r.RouteCode,
            r.RouteName,
            r.TransportTypeId,
            rs.StopOrder,
            s.StationId,
            s.StationName,
            s.Latitude,
            s.Longitude
        FROM Routes r
        INNER JOIN RouteStations rs
        ON rs.RouteId = r.RouteId
        INNER JOIN Stations s
        ON s.StationId = rs.StationId
        WHERE r.Status = 'ACTIVE'
        ORDER BY r.RouteId, rs.StopOrder;
    `);

    return result.recordset as RouteStationRow[];
}


export interface RouteStep {
  stationId: number;
  stationName: string;
  latitude: number;
  longitude: number;
}

export interface RouteSegment {
  routeId: number;
  routeCode: string;
  routeName: string;
  transportTypeId: number;
  from: RouteStep;
  to: RouteStep;
  distanceKm: number;
  estimatedMinutes: number;
}

interface Edge {
  to: number;
  routeId: number;
  routeCode: string;
  routeName: string;
  transportTypeId: number;
  distanceKm: number;
  estimatedMinutes: number;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => value * Math.PI / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function findRoute(
  startStationId: number,
  endStationId: number,
  allowedTransportTypes?: number[]
) {
  const rows = await getAllRoutes();

  const stationMap = new Map<number, RouteStep>();
  const graph = new Map<number, Edge[]>();

  for (const row of rows) {
    stationMap.set(row.StationId, {
      stationId: row.StationId,
      stationName: row.StationName,
      latitude: Number(row.Latitude),
      longitude: Number(row.Longitude)
    });

    if (!graph.has(row.StationId)) {
      graph.set(row.StationId, []);
    }
  }

  if (!stationMap.has(startStationId)) {
    throw new Error("START_STATION_NOT_FOUND");
  }

  if (!stationMap.has(endStationId)) {
    throw new Error("END_STATION_NOT_FOUND");
  }

  if (startStationId === endStationId) {
    return {
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
      segments: [],
      stations: [stationMap.get(startStationId)!]
    };
  }

  const groupedRoutes = new Map<number, RouteStationRow[]>();

  for (const row of rows) {
    const group = groupedRoutes.get(row.RouteId) ?? [];
    group.push(row);
    groupedRoutes.set(row.RouteId, group);
  }

  for (const routeRows of groupedRoutes.values()) {
    routeRows.sort((a, b) => a.StopOrder - b.StopOrder);

    for (let i = 0; i < routeRows.length - 1; i++) {
      const from = routeRows[i];
      const to = routeRows[i + 1];

      if (
        allowedTransportTypes &&
        !allowedTransportTypes.includes(from.TransportTypeId)
      ) {
        continue;
      }

      const distanceKm = haversineKm(
        Number(from.Latitude),
        Number(from.Longitude),
        Number(to.Latitude),
        Number(to.Longitude)
      );

      // Giả định minh họa: vận tốc trung bình 20 km/h.
      // Đây không phải dữ liệu vận hành thực tế của Hà Nội.
      const estimatedMinutes = Math.max(
        1,
        Math.ceil(distanceKm / 20 * 60)
      );

      const edge: Edge = {
        to: to.StationId,
        routeId: from.RouteId,
        routeCode: from.RouteCode,
        routeName: from.RouteName,
        transportTypeId: from.TransportTypeId,
        distanceKm,
        estimatedMinutes
      };

      const reverseEdge: Edge = {
        ...edge,
        to: from.StationId
      };

      graph.get(from.StationId)!.push(edge);
      graph.get(to.StationId)!.push(reverseEdge);
    }
  }

  const distances = new Map<number, number>();
  const previous = new Map<
    number,
    { stationId: number; edge: Edge }
  >();

  for (const id of graph.keys()) {
    distances.set(id, Infinity);
  }

  distances.set(startStationId, 0);

  const visited = new Set<number>();

  while (true) {
    let current: number | null = null;
    let best = Infinity;

    for (const [id, distance] of distances) {
      if (!visited.has(id) && distance < best) {
        current = id;
        best = distance;
      }
    }

    if (current === null || current === endStationId) {
      break;
    }

    visited.add(current);

    for (const edge of graph.get(current) ?? []) {
      const candidate = best + edge.estimatedMinutes;

      if (candidate < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, candidate);
        previous.set(edge.to, {
          stationId: current,
          edge
        });
      }
    }
  }

  if (!Number.isFinite(distances.get(endStationId)!)) {
    throw new Error("NO_ROUTE_FOUND");
  }

  const segments: RouteSegment[] = [];
  let current = endStationId;

  while (current !== startStationId) {
    const step = previous.get(current);

    if (!step) {
      throw new Error("ROUTE_RECONSTRUCTION_FAILED");
    }

    const from = stationMap.get(step.stationId)!;
    const to = stationMap.get(current)!;

    segments.push({
      routeId: step.edge.routeId,
      routeCode: step.edge.routeCode,
      routeName: step.edge.routeName,
      transportTypeId: step.edge.transportTypeId,
      from,
      to,
      distanceKm: step.edge.distanceKm,
      estimatedMinutes: step.edge.estimatedMinutes
    });

    current = step.stationId;
  }

  segments.reverse();

  return {
    totalDistanceKm: Number(
      segments.reduce((sum, s) => sum + s.distanceKm, 0).toFixed(2)
    ),
    totalDurationMinutes: segments.reduce(
      (sum, s) => sum + s.estimatedMinutes, 0
    ),
    segments,
    stations: [
      stationMap.get(startStationId)!,
      ...segments.map(segment => segment.to)
    ]
  };
}