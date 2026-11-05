import sql from "mssql";
import { getConnection } from "../config/database";

export async function getAllStations() {
    const pool = await getConnection();

    const result = await pool.request().query(`
        SELECT
            s.StationId,
            s.StationCode,
            s.StationName,
            s.Latitude,
            s.Longitude,
            s.Address,
            t.Name AS TransportType
        FROM Stations s
        INNER JOIN TransportTypes t
            ON s.TransportTypeId = t.TransportTypeId
        WHERE s.Status = 'ACTIVE'
        ORDER BY s.StationName;
    `);

    return result.recordset;
}