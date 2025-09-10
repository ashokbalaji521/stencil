import sql from "mssql";
import { conConfig } from "./db.js";

async function cleanupDuplicates() {
  try {
    const pool = await sql.connect(conConfig);

    // Helper function to check if two dates are within 50 seconds
    const within50Seconds = (date1, date2) => {
      const time1 = new Date(date1).getTime();
      const time2 = new Date(date2).getTime();
      return Math.abs(time1 - time2) <= 50 * 1000; // 50 seconds in milliseconds
    };

    // Cleanup for NonAuthorizedOut table
    async function cleanupNonAuthorizedOut() {
      // Step 1: Delete duplicates
      const result = await pool.request().query(`
        SELECT ID, TimeColumn, [Physical Location], PairedPhysicalLocation, RackNo
        FROM [StencilApplication].[dbo].[NonAuthorizedOut]
      `);

      const records = result.recordset;
      const groupedByTime = [];

      // Group records by 50-second intervals
      records.sort((a, b) => new Date(a.TimeColumn) - new Date(b.TimeColumn)); // Sort by time
      let currentGroup = [];
      let groupStartTime = null;

      records.forEach(record => {
        const currentTime = new Date(record.TimeColumn);
        if (!groupStartTime || within50Seconds(groupStartTime, currentTime)) {
          currentGroup.push(record);
        } else {
          groupedByTime.push(currentGroup);
          currentGroup = [record];
          groupStartTime = currentTime;
        }
        groupStartTime = groupStartTime || currentTime;
      });
      if (currentGroup.length > 0) {
        groupedByTime.push(currentGroup); // Push the last group
      }

      for (const recordsInGroup of groupedByTime) {
        const locationGroups = {};

        // Group records by location pair within the time group
        recordsInGroup.forEach(record => {
          const loc = parseInt(record["Physical Location"]);
          const pairedLoc = record.PairedPhysicalLocation
            ? parseInt(record.PairedPhysicalLocation)
            : null;
          let locKey;

          if (pairedLoc) {
            // Normalize pair to use lower location first
            const minLoc = Math.min(loc, pairedLoc);
            const maxLoc = Math.max(loc, pairedLoc);
            locKey = `${minLoc}_${maxLoc}`;
          } else {
            locKey = `${loc}_${record.PairedPhysicalLocation || ""}`;
          }

          if (!locationGroups[locKey]) {
            locationGroups[locKey] = [];
          }
          locationGroups[locKey].push(record);
        });

        // For each location group, keep only the record with highest ID
        for (const locKey in locationGroups) {
          const duplicateRecords = locationGroups[locKey];

          if (duplicateRecords.length > 1) {
            // Sort by ID descending and keep the first (highest ID)
            duplicateRecords.sort((a, b) => b.ID - a.ID);
            const recordsToDelete = duplicateRecords.slice(1); // All except the first (highest ID)

            if (recordsToDelete.length > 0) {
              const idsToDelete = recordsToDelete.map(r => r.ID);
              await pool.request().query(`
                DELETE FROM [StencilApplication].[dbo].[NonAuthorizedOut]
                WHERE ID IN (${idsToDelete.join(",")})
              `);
              console.log(
                `Deleted ${recordsToDelete.length} duplicate records from NonAuthorizedOut for time group starting ${new Date(
                  duplicateRecords[0].TimeColumn
                ).toISOString()}, location pair ${locKey}`
              );
              console.log(
                `Kept record ID ${duplicateRecords[0].ID}, deleted IDs: ${idsToDelete.join(", ")}`
              );
            }
          }
        }
      }

      // Step 2: Update PairedPhysicalLocation for Rack-4
      const updateResult = await pool.request().query(`
        UPDATE [StencilApplication].[dbo].[NonAuthorizedOut]
        SET PairedPhysicalLocation = CASE 
          WHEN CAST([Physical Location] AS INT) % 2 = 0 THEN CAST(CAST([Physical Location] AS INT) - 1 AS NVARCHAR)
          ELSE CAST(CAST([Physical Location] AS INT) + 1 AS NVARCHAR)
        END
        WHERE RackNo = 'Rack-4' 
        AND ([Physical Location] IS NOT NULL AND CAST([Physical Location] AS INT) BETWEEN 1 AND 60)
        AND (PairedPhysicalLocation IS NULL OR PairedPhysicalLocation = '')
      `);

      console.log(
        `Updated ${updateResult.rowsAffected[0]} records in NonAuthorizedOut for Rack-4 PairedPhysicalLocation`
      );
    }

    // Cleanup for NonAuthorizedStencilIn table
    async function cleanupNonAuthorizedStencilIn() {
      // Step 1: Delete duplicates
      const result = await pool.request().query(`
        SELECT ID, TimeColumn, PhysicalLocation, PairedPhysicalLocation, RackNo
        FROM [StencilApplication].[dbo].[NonAuthorizedStencilIn]
      `);

      const records = result.recordset;
      const groupedByTime = [];

      // Group records by 50-second intervals
      records.sort((a, b) => new Date(a.TimeColumn) - new Date(b.TimeColumn)); // Sort by time
      let currentGroup = [];
      let groupStartTime = null;

      records.forEach(record => {
        const currentTime = new Date(record.TimeColumn);
        if (!groupStartTime || within50Seconds(groupStartTime, currentTime)) {
          currentGroup.push(record);
        } else {
          groupedByTime.push(currentGroup);
          currentGroup = [record];
          groupStartTime = currentTime;
        }
        groupStartTime = groupStartTime || currentTime;
      });
      if (currentGroup.length > 0) {
        groupedByTime.push(currentGroup); // Push the last group
      }

      for (const recordsInGroup of groupedByTime) {
        const locationGroups = {};

        // Group records by location pair within the time group
        recordsInGroup.forEach(record => {
          const loc = parseInt(record.PhysicalLocation);
          const pairedLoc = record.PairedPhysicalLocation
            ? parseInt(record.PairedPhysicalLocation)
            : null;
          let locKey;

          if (pairedLoc) {
            // Normalize pair to use lower location first
            const minLoc = Math.min(loc, pairedLoc);
            const maxLoc = Math.max(loc, pairedLoc);
            locKey = `${minLoc}_${maxLoc}`;
          } else {
            locKey = `${loc}_${record.PairedPhysicalLocation || ""}`;
          }

          if (!locationGroups[locKey]) {
            locationGroups[locKey] = [];
          }
          locationGroups[locKey].push(record);
        });

        // For each location group, keep only the record with highest ID
        for (const locKey in locationGroups) {
          const duplicateRecords = locationGroups[locKey];

          if (duplicateRecords.length > 1) {
            // Sort by ID descending and keep the first (highest ID)
            duplicateRecords.sort((a, b) => b.ID - a.ID);
            const recordsToDelete = duplicateRecords.slice(1); // All except the first (highest ID)

            if (recordsToDelete.length > 0) {
              const idsToDelete = recordsToDelete.map(r => r.ID);
              await pool.request().query(`
                DELETE FROM [StencilApplication].[dbo].[NonAuthorizedStencilIn]
                WHERE ID IN (${idsToDelete.join(",")})
              `);
              console.log(
                `Deleted ${recordsToDelete.length} duplicate records from NonAuthorizedStencilIn for time group starting ${new Date(
                  duplicateRecords[0].TimeColumn
                ).toISOString()}, location pair ${locKey}`
              );
              console.log(
                `Kept record ID ${duplicateRecords[0].ID}, deleted IDs: ${idsToDelete.join(", ")}`
              );
            }
          }
        }
      }

      // Step 2: Update PairedPhysicalLocation for Rack-4
      const updateResult = await pool.request().query(`
        UPDATE [StencilApplication].[dbo].[NonAuthorizedStencilIn]
        SET PairedPhysicalLocation = CASE 
          WHEN CAST(PhysicalLocation AS INT) % 2 = 0 THEN CAST(CAST(PhysicalLocation AS INT) - 1 AS NVARCHAR)
          ELSE CAST(CAST(PhysicalLocation AS INT) + 1 AS NVARCHAR)
        END
        WHERE RackNo = 'Rack-4' 
        AND (PhysicalLocation IS NOT NULL AND CAST(PhysicalLocation AS INT) BETWEEN 1 AND 60)
        AND (PairedPhysicalLocation IS NULL OR PairedPhysicalLocation = '')
      `);

      console.log(
        `Updated ${updateResult.rowsAffected[0]} records in NonAuthorizedStencilIn for Rack-4 PairedPhysicalLocation`
      );
    }

    // Run all cleanup functions
    await cleanupNonAuthorizedOut();
    await cleanupNonAuthorizedStencilIn();

    console.log("All cleanup operations completed successfully.");
  } catch (error) {
    console.error("Error in cleanupDuplicates:", error);
  }
}

export { cleanupDuplicates };