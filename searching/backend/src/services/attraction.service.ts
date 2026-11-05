import sql from "mssql";
import { getConnection } from "../config/database";

export async function getAllAttractions() {
    const pool = await getConnection();

    const result = await pool.request().query(`
        SELECT
            a.AttractionId,
            a.Name,
            a.Description,
            a.Address,
            a.Latitude,
            a.Longitude,
            a.Category
        FROM TouristAttractions a
        WHERE a.Status = 'ACTIVE'
        ORDER BY a.Name;
    `);

    return result.recordset;
}