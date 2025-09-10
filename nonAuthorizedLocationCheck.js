import cron from 'node-cron';
import sql from 'mssql';
import { conConfig } from './db.js';

// Function to update AvailableStencilRecord table
async function updateAvailableStencilRecord() {
  try {
    const pool = await sql.connect(conConfig);
    
    // Begin transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Clear existing records
      await transaction.request().query('TRUNCATE TABLE [AvailableStencilRecord]');

      // Get new data with validation for StencilThickness and StencilTension
      const result = await transaction.request().query(`
        SELECT 
          st.[Product],
          st.[Side],
          st.[PartNumber],
          TRY_CAST(st.[StencilThickness] AS DECIMAL(10,3)) AS StencilThickness,
          TRY_CAST(st.[StencilTension] AS DECIMAL(10,3)) AS StencilTension,
          st.[Remarks],
          DATEADD(minute, -330, st.[Maintenance_updated_datetime]) AS Maintenance_updated_datetime,
          DATEADD(minute, -330, st.[LastINDate]) AS LastINDate,
          st.BarcodeID,
          st.Rackno,
          COALESCE(rs1.[PhysicalLocation], rs2.[PhysicalLocation], rs3.[PhysicalLocation], rs4.[PhysicalLocation]) AS PhysicalLocation,
          led.[PairedPhysicalLocation],
          CASE 
            WHEN st.Scrap = 1 THEN 'Scrap'
            WHEN st.Blocked = 1 THEN 'Blocked'
            ELSE 'Available'
          END AS AvailableStatus,
          GETDATE() AS RefreshDateTime
        FROM StencilTable st
        LEFT JOIN [stencilRackStatus] rs1 ON rs1.[Rack_id] = st.[RackID]
        LEFT JOIN [stencilRackStatus1_copy] rs2 ON rs2.[Rack_id] = st.[RackID2]
        LEFT JOIN [stencilRackStatus2_copy] rs3 ON rs3.[Rack_id] = st.[RackID3]
        LEFT JOIN [stencilRackStatus3_copy] rs4 ON rs4.[Rack_id] = st.[RackID4]
        LEFT JOIN [StencilLEDStatus3] led 
          ON led.[PhysicalLocation] = rs4.[PhysicalLocation]
        WHERE st.Status = 1
      `);

      // Log records with invalid StencilThickness or StencilTension
      const invalidRecords = result.recordset.filter(
        record => record.StencilThickness === null || record.StencilTension === null
      );
      if (invalidRecords.length > 0) {
        console.warn('Records with invalid StencilThickness or StencilTension:', invalidRecords.map(r => ({
          BarcodeID: r.BarcodeID,
          StencilThickness: r.StencilThickness,
          StencilTension: r.StencilTension
        })));
      }

      // Insert new records
      for (const record of result.recordset) {
        await transaction.request()
          .input('Product', sql.NVarChar, record.Product)
          .input('Side', sql.NVarChar, record.Side)
          .input('PartNumber', sql.NVarChar, record.PartNumber)
          .input('StencilThickness', sql.Decimal(10, 3), record.StencilThickness)
          .input('StencilTension', sql.Decimal(10, 3), record.StencilTension)
          .input('Remarks', sql.NVarChar(sql.MAX), record.Remarks)
          .input('Maintenance_updated_datetime', sql.DateTime, record.Maintenance_updated_datetime)
          .input('LastINDate', sql.DateTime, record.LastINDate)
          .input('BarcodeID', sql.NVarChar, record.BarcodeID)
          .input('Rackno', sql.NVarChar, record.Rackno)
          .input('PhysicalLocation', sql.NVarChar, record.PhysicalLocation)
          .input('PairedPhysicalLocation', sql.NVarChar, record.PairedPhysicalLocation)
          .input('AvailableStatus', sql.NVarChar, record.AvailableStatus)
          .input('RefreshDateTime', sql.DateTime, record.RefreshDateTime)
          .query(`
            INSERT INTO [AvailableStencilRecord] (
              Product, Side, PartNumber, StencilThickness, StencilTension, 
              Remarks, Maintenance_updated_datetime, LastINDate, 
              BarcodeID, Rackno, PhysicalLocation, PairedPhysicalLocation, 
              AvailableStatus, RefreshDateTime
            )
            VALUES (
              @Product, @Side, @PartNumber, @StencilThickness, @StencilTension,
              @Remarks, @Maintenance_updated_datetime, @LastINDate, 
              @BarcodeID, @Rackno, @PhysicalLocation, @PairedPhysicalLocation,
              @AvailableStatus, @RefreshDateTime
            )
          `);
      }

      // Commit transaction
      await transaction.commit();
      console.log(`AvailableStencilRecord updated successfully with ${result.recordset.length} records`);
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error updating AvailableStencilRecord:', error);
  }
}

// Function to check for missing RackNo and PhysicalLocation combinations
async function checkMissingRackLocations() {
  try {
    const pool = await sql.connect(conConfig);
    
    // Begin transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Clear existing records in check_NonAuthorizedIn_Alter
      await transaction.request().query('TRUNCATE TABLE [check_NonAuthorizedIn_Alter]');

      // Define racks and expected physical locations (1-60)
      const racks = ['Rack-1', 'Rack-2', 'Rack-3'];
      const expectedLocations = Array.from({ length: 60 }, (_, i) => (i + 1).toString());

      // Get current Rackno and PhysicalLocation from AvailableStencilRecord
      const result = await transaction.request().query(`
        SELECT Rackno, PhysicalLocation
        FROM [AvailableStencilRecord]
        WHERE Rackno IN ('Rack-1', 'Rack-2', 'Rack-3')
        AND PhysicalLocation IS NOT NULL
      `);

      // Create a map of existing rack-location combinations
      const existingLocations = {};
      result.recordset.forEach(record => {
        if (!existingLocations[record.Rackno]) {
          existingLocations[record.Rackno] = new Set();
        }
        existingLocations[record.Rackno].add(record.PhysicalLocation);
      });

      // Insert missing combinations
      for (const rack of racks) {
        const existing = existingLocations[rack] || new Set();
        for (const location of expectedLocations) {
          if (!existing.has(location)) {
            await transaction.request()
              .input('TimeColumn', sql.DateTime, new Date())
              .input('PhysicalLocation', sql.NVarChar, location)
              .input('RackNo', sql.NVarChar, rack)
              .query(`
                INSERT INTO [check_NonAuthorizedIn_Alter] (
                  TimeColumn, [Physical Location], RackNo
                )
                VALUES (
                  @TimeColumn, @PhysicalLocation, @RackNo
                )
              `);
          }
        }
      }

      // Commit transaction
      await transaction.commit();
      console.log('check_NonAuthorizedIn_Alter updated with missing rack-location combinations');
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error checking missing rack locations:', error);
  }
}

// Function to update LEDRackStatus in StencilLEDStatus tables based on check_NonAuthorizedIn_Alter
async function updateLEDRackStatusNAIN() {
  try {
    const pool = await sql.connect(conConfig);
    
    // Begin transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Get records from check_NonAuthorizedIn_Alter
      const result = await transaction.request().query(`
        SELECT [Physical Location] AS PhysicalLocation, RackNo
        FROM [check_NonAuthorizedIn_Alter]
        WHERE RackNo IN ('Rack-1', 'Rack-2', 'Rack-3')
      `);

      // Update LEDRackStatus for each record
      for (const record of result.recordset) {
        const tableMap = {
          'Rack-1': 'StencilLEDStatus',
          'Rack-2': 'StencilLEDStatus1',
          'Rack-3': 'StencilLEDStatus2'
        };

        const tableName = tableMap[record.RackNo];
        if (tableName) {
          await transaction.request()
            .input('PhysicalLocation', sql.NVarChar, record.PhysicalLocation)
            .query(`
              UPDATE [${tableName}]
              SET LEDRackStatus = 1
              WHERE PhysicalLocation = @PhysicalLocation
            `);
        }
      }

      // Commit transaction
      await transaction.commit();
      console.log(`Updated LEDRackStatus for ${result.recordset.length} records in StencilLEDStatus tables`);
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error updating LEDRackStatus:', error);
  }
}

// Schedule all functions to run every minute
// cron.schedule('* * * * *', updateAvailableStencilRecord);
// cron.schedule('* * * * *', checkMissingRackLocations);
// cron.schedule('* * * * *', updateLEDRackStatusNAIN);

// Export the functions for manual triggering if needed
export { updateAvailableStencilRecord, checkMissingRackLocations, updateLEDRackStatusNAIN };


