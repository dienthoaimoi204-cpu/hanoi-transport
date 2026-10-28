import { Request, Response } from "express";
import { findRoute } from "../services/routing.service";

export async function planRoute(req: Request, res: Response) {
  try {
    console.log("--> Dữ liệu req.body nhận được:", req.body);
    console.log("--> Headers của request:", req.headers["content-type"]);

    const {
      startStationId,
      endStationId,
      transportTypeIds
    } = req.body || {};

    if (
      !Number.isInteger(startStationId) ||
      !Number.isInteger(endStationId)
    ) {
      return res.status(400).json({
        message: "startStationId và endStationId phải là số nguyên."
      });
    }

    if (
      transportTypeIds !== undefined &&
      (
        !Array.isArray(transportTypeIds) ||
        !transportTypeIds.every(
          (id: unknown) => Number.isInteger(id)
        )
      )
    ) {
      return res.status(400).json({
        message: "transportTypeIds phải là mảng các số nguyên."
      });
    }

    const result = await findRoute(
      startStationId,
      endStationId,
      transportTypeIds
    );

    return res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "START_STATION_NOT_FOUND") {
        return res.status(404).json({
          message: "Không tìm thấy trạm xuất phát."
        });
      }

      if (error.message === "END_STATION_NOT_FOUND") {
        return res.status(404).json({
          message: "Không tìm thấy trạm đích."
        });
      }

      if (error.message === "NO_ROUTE_FOUND") {
        return res.status(404).json({
          message: "Không tìm thấy lộ trình phù hợp."
        });
      }
    }

    console.error("planRoute error:", error);

    return res.status(500).json({
      message: "Có lỗi khi tính toán lộ trình."
    });
  }
}