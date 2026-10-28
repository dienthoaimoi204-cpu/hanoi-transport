import { Request, Response } from "express";
import { getAllStations } from "../services/station.service";

export async function getStations(
    req: Request,
    res: Response
) {
    try {
        const stations = await getAllStations();

        res.status(200).json({
            success: true,
            data: stations,
            message: "Get stations successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Cannot get stations",
            errorCode: "DATABASE_ERROR"
        });
    }
}