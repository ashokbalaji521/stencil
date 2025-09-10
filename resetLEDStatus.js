import sql from "mssql";
import { conConfig } from "./db.js";

async function resetExpiredLEDStatus() {
  try {
    console.log("Starting LED status cleanup for LEDRackStatus = 3 ...");
    
    const pool = await sql.connect(conConfig);
    
    // Configuration for all LED status tables
    const ledTables = [
      { tableName: 'StencilLEDStatus', rackName: 'Rack-1' },
      { tableName: 'StencilLEDStatus1', rackName: 'Rack-2' },
      { tableName: 'StencilLEDStatus2', rackName: 'Rack-3' },
      { tableName: 'StencilLEDStatus3', rackName: 'Rack-4' }
    ];

    let totalUpdated = 0;

    for (const ledTable of ledTables) {
      try {
        // Find records with LEDRackStatus = 3 
        const expiredRecords = await pool.request().query(`
          SELECT 
            LEDRack_id, 
            PhysicalLocation, 
            LEDRackStatus, 
            TimeColumn,
            DATEDIFF(SECOND, TimeColumn, GETDATE()) as SecondsSinceUpdate
          FROM [${ledTable.tableName}]
          WHERE LEDRackStatus = 3 
            AND PhysicalLocation NOT IN ('G', 'Y', 'R', 'B')
        `);

        if (expiredRecords.recordset.length > 0) {
          console.log(`Found ${expiredRecords.recordset.length} expired LED records in ${ledTable.tableName}:`);
          
          // Log details of expired records
          expiredRecords.recordset.forEach(record => {
            console.log(`  - LEDRack_id: ${record.LEDRack_id}, PhysicalLocation: ${record.PhysicalLocation}, Seconds since update: ${record.SecondsSinceUpdate}`);
          });

          // Update LEDRackStatus from 3 to 0 for expired records
          const updateResult = await pool.request().query(`
            UPDATE [${ledTable.tableName}]
            SET LEDRackStatus = 0, 
                TimeColumn = GETDATE()
            WHERE LEDRackStatus = 3 
              AND PhysicalLocation NOT IN ('G', 'Y', 'R', 'B')
          `);

          const updatedCount = updateResult.rowsAffected[0];
          totalUpdated += updatedCount;
          console.log(`Updated ${updatedCount} LED records in ${ledTable.tableName} from status 3 to 0`);

          // Additional check: Get stencil information for updated locations
          for (const record of expiredRecords.recordset) {
            try {
              const stencilInfo = await pool.request().query(`
                SELECT 
                  st.[StencilID],
                  st.[BarcodeID],
                  st.[Product],
                  st.[PartNumber],
                  COALESCE(rs1.[PhysicalLocation], rs2.[PhysicalLocation], rs3.[PhysicalLocation], rs4.[PhysicalLocation]) AS CurrentPhysicalLocation
                FROM StencilTable st
                LEFT JOIN [stencilRackStatus] rs1 ON rs1.[Rack_id] = st.[RackID]
                LEFT JOIN [stencilRackStatus1_copy] rs2 ON rs2.[Rack_id] = st.[RackID2]
                LEFT JOIN [stencilRackStatus2_copy] rs3 ON rs3.[Rack_id] = st.[RackID3]
                LEFT JOIN [stencilRackStatus3_copy] rs4 ON rs4.[Rack_id] = st.[RackID4]
                WHERE st.Status = 1
                  AND COALESCE(rs1.[PhysicalLocation], rs2.[PhysicalLocation], rs3.[PhysicalLocation], rs4.[PhysicalLocation]) = '${record.PhysicalLocation}'
              `);

              if (stencilInfo.recordset.length > 0) {
                const stencil = stencilInfo.recordset[0];
                console.log(`    Associated Stencil - ID: ${stencil.StencilID}, Barcode: ${stencil.BarcodeID}, Product: ${stencil.Product}, PartNumber: ${stencil.PartNumber}`);
              }
            } catch (stencilError) {
              console.error(`Error getting stencil info for location ${record.PhysicalLocation}:`, stencilError);
            }
          }
        } else {
          console.log(`No expired LED records found in ${ledTable.tableName}`);
        }

      } catch (tableError) {
        console.error(`Error processing LED table ${ledTable.tableName}:`, tableError);
      }
    }

    // Call the method for NonAuthorized record cleanup
    const deletedNonAuthCount = await cleanNonAuthorizedRecords(pool);
    console.log(`NonAuthorized records cleanup completed. Total records deleted: ${deletedNonAuthCount}`);

    console.log(`LED Status cleanup completed. Total records updated: ${totalUpdated}`);
    return totalUpdated;
    
  } catch (error) {
    console.error("Error in resetExpiredLEDStatus:", error);
    throw error;
  }
}

// Modified method to clean NonAuthorizedStencilIn and NonAuthorizedOut records
async function cleanNonAuthorizedRecords(pool) {
  try {
    console.log("Starting NonAuthorized records cleanup...");

    let totalDeleted = 0;

    // Clean NonAuthorizedStencilIn for Operation='IN'
    const inRecords = await pool.request().query(`
      SELECT 
        nai.ID,
        nai.TimeColumn,
        oh.UpdatedDateTime,
        DATEDIFF(SECOND, nai.TimeColumn, oh.UpdatedDateTime) as TimeDiff,
        nai.PairedPhysicalLocation,
        oh.PhysicalLocation
      FROM [StencilApplication].[dbo].[NonAuthorizedStencilIn] nai
      INNER JOIN [StencilApplication].[dbo].[OperationHistoryN] oh
        ON nai.StencilID = oh.StencilID
        AND nai.PhysicalLocation = oh.PhysicalLocation
        AND nai.RackNo = oh.RackNo
        AND nai.PairedPhysicalLocation = oh.PhysicalLocation
      WHERE oh.Operation = 'IN'
        AND ABS(DATEDIFF(SECOND, nai.TimeColumn, oh.UpdatedDateTime)) <= 420
    `);

    if (inRecords.recordset.length > 0) {
      console.log(`Found ${inRecords.recordset.length} matching NonAuthorizedStencilIn records to delete:`);
      inRecords.recordset.forEach(record => {
        console.log(`  - ID: ${record.ID}, TimeColumn: ${record.TimeColumn}, OperationHistory UpdatedDateTime: ${record.UpdatedDateTime}, TimeDiff: ${record.TimeDiff} seconds, PairedPhysicalLocation: ${record.PairedPhysicalLocation}, OperationHistory PhysicalLocation: ${record.PhysicalLocation}`);
      });

      // Delete matching records
      const deleteInResult = await pool.request().query(`
        DELETE nai
        FROM [StencilApplication].[dbo].[NonAuthorizedStencilIn] nai
        INNER JOIN [StencilApplication].[dbo].[OperationHistoryN] oh
          ON nai.StencilID = oh.StencilID
          AND nai.PhysicalLocation = oh.PhysicalLocation
          AND nai.RackNo = oh.RackNo
          AND nai.PairedPhysicalLocation = oh.PhysicalLocation
        WHERE oh.Operation = 'IN'
          AND ABS(DATEDIFF(SECOND, nai.TimeColumn, oh.UpdatedDateTime)) <= 420
      `);

      const deletedInCount = deleteInResult.rowsAffected[0];
      totalDeleted += deletedInCount;
      console.log(`Deleted ${deletedInCount} records from NonAuthorizedStencilIn`);
    } else {
      console.log("No matching NonAuthorizedStencilIn records found to delete");
    }

    // Clean NonAuthorizedOut for Operation='OUT'
    const outRecords = await pool.request().query(`
      SELECT 
        nao.ID,
        nao.TimeColumn,
        oh.UpdatedDateTime,
        DATEDIFF(SECOND, nao.TimeColumn, oh.UpdatedDateTime) as TimeDiff,
        nao.PairedPhysicalLocation,
        oh.PhysicalLocation
      FROM [StencilApplication].[dbo].[NonAuthorizedOut] nao
      INNER JOIN [StencilApplication].[dbo].[OperationHistoryN] oh
        ON nao.StencilID = oh.StencilID
        AND nao.[Physical Location] = oh.PhysicalLocation
        AND nao.RackNo = oh.RackNo
        AND nao.PairedPhysicalLocation = oh.PhysicalLocation
      WHERE oh.Operation = 'OUT'
        AND ABS(DATEDIFF(SECOND, nao.TimeColumn, oh.UpdatedDateTime)) <= 420
    `);

    if (outRecords.recordset.length > 0) {
      console.log(`Found ${outRecords.recordset.length} matching NonAuthorizedOut records to delete:`);
      outRecords.recordset.forEach(record => {
        console.log(`  - ID: ${record.ID}, TimeColumn: ${record.TimeColumn}, OperationHistory UpdatedDateTime: ${record.UpdatedDateTime}, TimeDiff: ${record.TimeDiff} seconds, PairedPhysicalLocation: ${record.PairedPhysicalLocation}, OperationHistory PhysicalLocation: ${record.PhysicalLocation}`);
      });

      // Delete matching records
      const deleteOutResult = await pool.request().query(`
        DELETE nao
        FROM [StencilApplication].[dbo].[NonAuthorizedOut] nao
        INNER JOIN [StencilApplication].[dbo].[OperationHistoryN] oh
          ON nao.StencilID = oh.StencilID
          AND nao.[Physical Location] = oh.PhysicalLocation
          AND nao.RackNo = oh.RackNo
          AND nao.PairedPhysicalLocation = oh.PhysicalLocation
        WHERE oh.Operation = 'OUT'
          AND ABS(DATEDIFF(SECOND, nao.TimeColumn, oh.UpdatedDateTime)) <= 420
      `);

      const deletedOutCount = deleteOutResult.rowsAffected[0];
      totalDeleted += deletedOutCount;
      console.log(`Deleted ${deletedOutCount} records from NonAuthorizedOut`);
    } else {
      console.log("No matching NonAuthorizedOut records found to delete");
    }

    return totalDeleted;

  } catch (error) {
    console.error("Error in cleanNonAuthorizedRecords:", error);
    return 0;
  }
}

export { resetExpiredLEDStatus, cleanNonAuthorizedRecords };