import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";

import { getStations, getAttractions,planRoute } from "../services/api";
import type { Station } from "../types/station";
import type { Attraction } from "../types/attraction";
import type { PlanRouteResponse } from "../types/route";

// Icon dành cho Trạm (Màu đỏ)
const stationIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Icon dành cho Địa điểm du lịch (Màu xanh lá)
const attractionIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function MapView() {

    const [stations, setStations] = useState<Station[]>([]);
    const [attractions, setAttractions] = useState<Attraction[]>([]);
    const [loading, setLoading] = useState(true);

    const [startStationId, setStartStationId] = useState("");
    const [endStationId, setEndStationId] = useState("");
    const [transportTypeId, setTransportTypeId] = useState("all");

    const [routeResult, setRouteResult] =
        useState<PlanRouteResponse | null>(null);

    const [routeLoading, setRouteLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadMapData() {
            try {
                // Tải song song cả 2 API để tối ưu tốc độ
                const [stationsData, attractionsData] = await Promise.all([
                    getStations(),
                    getAttractions()
                ]);

                setStations(stationsData);
                setAttractions(attractionsData);
            } catch (error) {
                console.error("Lỗi tải dữ liệu bản đồ:", error);
            } finally {
                setLoading(false);
            }
        }

        loadMapData();
    }, []);

    const routePositions = useMemo(() => {
        if (!routeResult?.stations?.length) return [];

        return routeResult.stations
            .filter(
                (station) =>
                    Number.isFinite(Number(station.latitude)) &&
                    Number.isFinite(Number(station.longitude))
            )
            .map(
                (station) =>
                    [Number(station.latitude), Number(station.longitude)] as [
                        number,
                        number
                    ]
            );
    }, [routeResult]);

    async function handleFindRoute(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setError("");
        setRouteResult(null);

        if (!startStationId || !endStationId) {
            setError("Vui lòng chọn điểm đi và điểm đến.");
            return;
        }

        if (startStationId === endStationId) {
            setError("Điểm đi và điểm đến phải khác nhau.");
            return;
        }

        setRouteLoading(true);

        try {
            const transportTypeIds =
                transportTypeId === "all"
                    ? [1, 2, 3, 4]
                    : [Number(transportTypeId)];

            const result = await planRoute({
                startStationId: Number(startStationId),
                endStationId: Number(endStationId),
                transportTypeIds
            });

            console.log("Toàn bộ kết quả tìm đường:", result);
            console.log(
                "Các trường dữ liệu của trạm đầu tiên:",
                Object.keys(result.stations?.[0] ?? {})
            );
            console.log("Danh sách trạm:", result.stations);

            result.stations?.forEach((station, index) => {
                console.log(`Trạm ${index + 1}:`, station);
                console.log("Tên trạm:", station.stationName);
                console.log("ID trạm:", station.stationId);
                console.log("Latitude:", station.latitude);
                console.log("Longitude:", station.longitude);
            });

            if (!result.stations?.length) {
                setError("Không tìm thấy tuyến đường phù hợp.");
                return;
            }

            setRouteResult(result);
        } catch (err) {
            console.error("Lỗi tìm đường:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Đã xảy ra lỗi khi tìm đường."
            );
        } finally {
            setRouteLoading(false);
        }
    }

    return (
        <div>
            {loading && <p>Đang tải dữ liệu bản đồ...</p>}

            <section
                style={{
                    padding: 16,
                    marginBottom: 16,
                    border: "1px solid #ddd",
                    borderRadius: 8
                }}
            >
                <h2>Tìm đường giao thông công cộng</h2>

                <form
                    onSubmit={handleFindRoute}
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        alignItems: "end"
                    }}
                >
                    <label>
                        Điểm đi
                        <br />
                        <select
                            value={startStationId}
                            onChange={(e) =>
                                setStartStationId(e.target.value)
                            }
                            required
                            style={{ padding: 8, minWidth: 200 }}
                        >
                            <option value="">-- Chọn trạm đi --</option>
                            {stations.map((station) => (
                                <option
                                    key={station.StationId}
                                    value={station.StationId}
                                >
                                    {station.StationName}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Điểm đến
                        <br />
                        <select
                            value={endStationId}
                            onChange={(e) =>
                                setEndStationId(e.target.value)
                            }
                            required
                            style={{ padding: 8, minWidth: 200 }}
                        >
                            <option value="">-- Chọn trạm đến --</option>
                            {stations.map((station) => (
                                <option
                                    key={station.StationId}
                                    value={station.StationId}
                                >
                                    {station.StationName}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Phương tiện
                        <br />
                        <select
                            value={transportTypeId}
                            onChange={(e) =>
                                setTransportTypeId(e.target.value)
                            }
                            style={{ padding: 8 }}
                        >
                            <option value="all">Tất cả phương tiện</option>
                            <option value="1">Xe buýt</option>
                            <option value="2">Tàu điện</option>
                            <option value="3">Xe đạp công cộng</option>
                            <option value="4">Xe điện</option>
                        </select>
                    </label>

                    <button
                        type="submit"
                        disabled={routeLoading || loading}
                        style={{
                            padding: "9px 18px",
                            cursor: "pointer"
                        }}
                    >
                        {routeLoading ? "Đang tìm..." : "Tìm đường"}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setRouteResult(null);
                            setError("");
                        }}
                        style={{ padding: "9px 14px" }}
                    >
                        Xóa tuyến
                    </button>
                </form>

                {error && (
                    <p role="alert" style={{ color: "red" }}>
                        {error}
                    </p>
                )}

                {routeResult && (
                    <div style={{ marginTop: 12 }}>
                        <h3>Kết quả tìm đường</h3>

                        <p>
                            Tổng quãng đường: {routeResult.totalDistanceKm} km
                        </p>

                        <p>
                            Thời gian dự kiến:{" "}
                            {routeResult.totalDurationMinutes} phút
                        </p>
                        
                        <p>Thứ tự các trạm:</p>
                        
                        <ol>
                            {routeResult.stations.map((station) => (
                                <li key={station.stationId}>
                                    {station.stationName}
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
            </section>

            <MapContainer
                center={[21.0285, 105.8542]}
                zoom={13}
                style={{
                    height: "600px",
                    width: "100%"
                }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* 1. Hiển thị các Trạm giao thông (Icon Đỏ) */}
                {stations.map((station) => (
                    <Marker
                        key={`station-${station.StationId}`}
                        position={[station.Latitude, station.Longitude]}
                        icon={stationIcon} // Truyền custom icon vào đây
                    >
                        <Popup>
                            <strong style={{ color: "red" }}>[Trạm] {station.StationName}</strong>
                            <br />
                            Loại: {station.TransportType}
                            <br />
                            {station.Address}
                        </Popup>
                    </Marker>
                ))}

                {/* 2. Hiển thị các Địa điểm du lịch (Icon Xanh lá) */}
                {attractions.map((attraction) => (
                    <Marker
                        key={`attraction-${attraction.AttractionId}`}
                        position={[attraction.Latitude, attraction.Longitude]}
                        icon={attractionIcon} // Truyền custom icon vào đây
                    >
                        <Popup>
                            <strong style={{ color: "green" }}>[Địa điểm] {attraction.Name}</strong>
                            <br />
                            Mô tả: {attraction.Description || "Không có mô tả"}
                            <br />
                            {attraction.Address}
                        </Popup>
                    </Marker>
                ))}

                {routePositions.length >= 2 && (
                    <Polyline
                        positions={routePositions}
                        pathOptions={{
                            color: "#1565c0",
                            weight: 6,
                            opacity: 0.85
                        }}
                    />
                )}
            </MapContainer>
        </div>
    );
}