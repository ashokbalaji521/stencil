import sql from "mssql";
import { conConfig } from "./db.js";

const RACK_CONFIG = {
  'Rack-1': {
    ledStatusTable: 'StencilLEDStatus',
    rackStatusTable: 'stencilRackStatus',
  },
  'Rack-2': {
    ledStatusTable: 'StencilLEDStatus1',
    rackStatusTable: 'stencilRackStatus1_copy',
  },
  'Rack-3': {
    ledStatusTable: 'StencilLEDStatus2',
    rackStatusTable: 'stencilRackStatus2_copy',
  },
  'Rack-4': {
    ledStatusTable: 'StencilLEDStatus3',
    rackStatusTable: 'stencilRackStatus3_copy',
  }
};

async function checkLedAndRackStatus() {
  try {
    const pool = await sql.connect(conConfig);
    const racks = Object.keys(RACK_CONFIG);

    for (const rackId of racks) {
      const config = RACK_CONFIG[rackId];
      
      // Query to find locations where LEDRackStatus=1 and RackStatus=1
      const result = await pool.request().query(`
        SELECT l.PhysicalLocation
        FROM [${config.ledStatusTable}] l
        INNER JOIN [${config.rackStatusTable}] r
        ON l.PhysicalLocation = r.PhysicalLocation
        WHERE l.LEDRackStatus = 1
        AND r.RackStatus = 1
        AND l.PhysicalLocation NOT IN ('G', 'Y', 'R', 'B')
      `);

      if (result.recordset.length > 0) {
        console.log(`Found ${result.recordset.length} locations with LEDRackStatus=1 and RackStatus=1 in ${rackId}`);

        for (const record of result.recordset) {
          try {
            // Update LEDRackStatus to 0 for the matching physical location
            await pool.request().query(`
              UPDATE [${config.ledStatusTable}]
              SET LEDRackStatus = 0
              WHERE PhysicalLocation = '${record.PhysicalLocation}'
            `);
            console.log(`${rackId} - Turned off LED at location ${record.PhysicalLocation}`);
          } catch (recordError) {
            console.error(`Error updating LED status for ${rackId} at location ${record.PhysicalLocation}:`, recordError);
          }
        }
      } else {
        console.log(`${rackId} - No locations found with LEDRackStatus=1 and RackStatus=1`);
      }
    }
  } catch (error) {
    console.error("Error in checkLedAndRackStatus:", error);
  }
}

export { checkLedAndRackStatus };