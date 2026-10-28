import type { Station } from "../types/station";
import type { Attraction } from "../types/attraction";
import type { PlanRouteRequest, PlanRouteResponse } from "../types/route";

const API_URL = "http://localhost:3000/api/v1";

export async function getStations(): Promise<Station[]> {
    const response = await fetch(`${API_URL}/stations`);

    if (!response.ok) {
        throw new Error("Không thể lấy danh sách trạm");
    }

    const result = await response.json();

    return result.data;
}

export async function getAttractions(): Promise<Attraction[]> {
    const response = await fetch(`${API_URL}/attractions`);

    if (!response.ok) {
        throw new Error("Không thể lấy danh sách địa điểm tham quan");
    }

    const result = await response.json();
    return result.data;
}


export async function planRoute(
    request: PlanRouteRequest
): Promise<PlanRouteResponse> {
    const response = await fetch(`${API_URL}/routes/plan`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Không thể tìm tuyến đường"
        );
    }

    // Hỗ trợ cả response trả trực tiếp và response có bọc data.
    return result.data ?? result;
}