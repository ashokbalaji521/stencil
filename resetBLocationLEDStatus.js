import sql from "mssql";
import { conConfig } from "./db.js";

const LED_TABLES = [
  'StencilLEDStatus',
  'StencilLEDStatus1', 
  'StencilLEDStatus2',
  'StencilLEDStatus3'
];

const RACK_NAMES = ['Rack-1', 'Rack-2', 'Rack-3', 'Rack-4'];

/**
 * Reset LED status for PhysicalLocation 'B' after 10 seconds delay
 * Monitors all LED status tables and automatically turns off LEDs at location 'B'
 * after they have been on for more than 10 seconds
 */
export async function resetBLocationLEDStatus() {
  try {
    const pool = await sql.connect(conConfig);
    console.log('Checking B location LED status across all tables...');

    for (let i = 0; i < LED_TABLES.length; i++) {
      const tableName = LED_TABLES[i];
      const rackName = RACK_NAMES[i];

      try {
        // Find records where PhysicalLocation='B', LEDRackStatus=1, and TimeColumn is older than 10 seconds
        const query = `
          SELECT LEDRack_id, LEDRackStatus, PhysicalLocation, TimeColumn
          FROM [${tableName}]
          WHERE PhysicalLocation = 'B' 
            AND LEDRackStatus = 1
            AND TimeColumn IS NOT NULL
            AND DATEDIFF(SECOND, TimeColumn, GETDATE()) >= 10
        `;

        const result = await pool.request().query(query);

        if (result.recordset.length > 0) {
          console.log(`Found ${result.recordset.length} B location records to reset in ${tableName} (${rackName})`);

          for (const record of result.recordset) {
            // Update LEDRackStatus to 0 for location 'B'
            const updateQuery = `
              UPDATE [${tableName}]
              SET LEDRackStatus = 0, TimeColumn = GETDATE()
              WHERE LEDRack_id = ${record.LEDRack_id}
            `;

            await pool.request().query(updateQuery);
            
            console.log(`${rackName} - Reset LED status for location B (ID: ${record.LEDRack_id}) - was on for ${Math.floor((Date.now() - new Date(record.TimeColumn).getTime()) / 1000)} seconds`);
          }
        } else {
          console.log(`${rackName} - No B location records need resetting in ${tableName}`);
        }

      } catch (tableError) {
        console.error(`Error processing table ${tableName} (${rackName}):`, tableError);
      }
    }

  } catch (error) {
    console.error('Error in resetBLocationLEDStatus:', error);
  }
}

/**
 * Monitor and immediately update B location when it turns on
 * This function checks for recently activated B location LEDs and schedules them for reset
 */
export async function monitorBLocationActivation() {
  try {
    const pool = await sql.connect(conConfig);
    
    for (let i = 0; i < LED_TABLES.length; i++) {
      const tableName = LED_TABLES[i];
      const rackName = RACK_NAMES[i];

      try {
        // Check for B location that just turned on and doesn't have TimeColumn set or needs update
        const query = `
          SELECT LEDRack_id, LEDRackStatus, PhysicalLocation, TimeColumn
          FROM [${tableName}]
          WHERE PhysicalLocation = 'B' 
            AND LEDRackStatus = 1
            AND (TimeColumn IS NULL OR DATEDIFF(SECOND, TimeColumn, GETDATE()) <= 2)
        `;

        const result = await pool.request().query(query);

        if (result.recordset.length > 0) {
          for (const record of result.recordset) {
            // Update TimeColumn to current time if it's NULL or recently changed
            if (!record.TimeColumn) {
              const updateTimeQuery = `
                UPDATE [${tableName}]
                SET TimeColumn = GETDATE()
                WHERE LEDRack_id = ${record.LEDRack_id} AND TimeColumn IS NULL
              `;

              await pool.request().query(updateTimeQuery);
              console.log(`${rackName} - Set activation time for B location (ID: ${record.LEDRack_id})`);
            }
          }
        }

      } catch (tableError) {
        console.error(`Error monitoring table ${tableName} (${rackName}):`, tableError);
      }
    }

  } catch (error) {
    console.error('Error in monitorBLocationActivation:', error);
  }
}

/**
 * Helper function to update B location LED status with TimeColumn
 * Use this function whenever you need to set LEDRackStatus = 1 for PhysicalLocation = 'B'
 */
export async function updateBLocationLEDStatus(tableName, setStatus = 1) {
  try {
    const pool = await sql.connect(conConfig);
    
    const query = setStatus === 1 
      ? `UPDATE [${tableName}] SET LEDRackStatus = 1, TimeColumn = GETDATE() WHERE PhysicalLocation = 'B'`
      : `UPDATE [${tableName}] SET LEDRackStatus = 0, TimeColumn = GETDATE() WHERE PhysicalLocation = 'B'`;
    
    const result = await pool.request().query(query);
    
    console.log(`Updated B location in ${tableName}: LEDRackStatus = ${setStatus}, TimeColumn = NOW, Rows affected: ${result.rowsAffected[0]}`);
    
    return result;
  } catch (error) {
    console.error(`Error updating B location LED status in ${tableName}:`, error);
    throw error;
  }
}

/**
 * Monitor and process Y and R locations, update G location LED status
 * Sets TimeColumn when Y or R turns on, resets after 10 seconds, and sets G to LEDRackStatus=1
 */
export async function processYRLocationsAndSetG() {
  try {
    const pool = await sql.connect(conConfig);
    console.log('Processing Y, R locations and setting G across all tables...');

    for (let i = 0; i < LED_TABLES.length; i++) {
      const tableName = LED_TABLES[i];
      const rackName = RACK_NAMES[i];

      try {
        // 1. Check for Y or R locations with LEDRackStatus=1 to set TimeColumn
        const activationQuery = `
          SELECT LEDRack_id, LEDRackStatus, PhysicalLocation, TimeColumn
          FROM [${tableName}]
          WHERE PhysicalLocation IN ('Y', 'R')
            AND LEDRackStatus = 1
            AND (TimeColumn IS NULL OR DATEDIFF(SECOND, TimeColumn, GETDATE()) <= 2)
        `;

        const activationResult = await pool.request().query(activationQuery);

        if (activationResult.recordset.length > 0) {
          for (const record of activationResult.recordset) {
            const updateTimeQuery = `
              UPDATE [${tableName}]
              SET TimeColumn = GETDATE()
              WHERE LEDRack_id = ${record.LEDRack_id} AND TimeColumn IS NULL
            `;

            await pool.request().query(updateTimeQuery);
            console.log(`${rackName} - Set activation time for ${record.PhysicalLocation} location (ID: ${record.LEDRack_id})`);
          }
        }

        // 2. Reset Y or R locations where LEDRackStatus=1 and TimeColumn > 10 seconds
        const resetQuery = `
          SELECT LEDRack_id, LEDRackStatus, PhysicalLocation, TimeColumn
          FROM [${tableName}]
          WHERE PhysicalLocation IN ('Y', 'R')
            AND LEDRackStatus = 1
            AND TimeColumn IS NOT NULL
            AND DATEDIFF(SECOND, TimeColumn, GETDATE()) >= 10
        `;

        const resetResult = await pool.request().query(resetQuery);

        if (resetResult.recordset.length > 0) {
          console.log(`Found ${resetResult.recordset.length} Y/R location records to reset in ${tableName} (${rackName})`);

          for (const record of resetResult.recordset) {
            const updateQuery = `
              UPDATE [${tableName}]
              SET LEDRackStatus = 0, TimeColumn = GETDATE()
              WHERE LEDRack_id = ${record.LEDRack_id}
            `;

            await pool.request().query(updateQuery);
            console.log(`${rackName} - Reset LED status for ${record.PhysicalLocation} location (ID: ${record.LEDRack_id}) - was on for ${Math.floor((Date.now() - new Date(record.TimeColumn).getTime()) / 1000)} seconds`);
          }
        } else {
          console.log(`${rackName} - No Y/R location records need resetting in ${tableName}`);
        }

        // 3. Set LEDRackStatus=1 for PhysicalLocation='G'
        const updateGQuery = `
          UPDATE [${tableName}]
          SET LEDRackStatus = 1, TimeColumn = GETDATE()
          WHERE PhysicalLocation = 'G'
        `;

        const gResult = await pool.request().query(updateGQuery);
        console.log(`${rackName} - Set LEDRackStatus=1 for G location in ${tableName}, Rows affected: ${gResult.rowsAffected[0]}`);

      } catch (tableError) {
        console.error(`Error processing table ${tableName} (${rackName}):`, tableError);
      }
    }

  } catch (error) {
    console.error('Error in processYRLocationsAndSetG:', error);
  }
}

/**
 * Combined function to monitor activation and reset expired B location LEDs
 */
export async function processBLocationLEDs() {
  console.log('Processing B location LEDs...');
  await monitorBLocationActivation();
  await resetBLocationLEDStatus();
}

/**
 * Combined function to process all LED locations (B, Y, R, and G)
 */
export async function processAllLEDs() {
  console.log('Processing all LED locations...');
//  await processBLocationLEDs();
  await processYRLocationsAndSetG();
}