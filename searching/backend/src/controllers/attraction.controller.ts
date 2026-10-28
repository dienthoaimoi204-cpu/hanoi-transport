import { Request, Response } from "express";
import { getAllAttractions } from "../services/attraction.service";

export async function getAttractions(
    req: Request,
    res: Response
) {
    try {
        const attractions = await getAllAttractions();

        res.status(200).json({
            success: true,
            data: attractions,
            message: "Get attractions successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Cannot get attractions",
            errorCode: "DATABASE_ERROR"
        });
    }
}