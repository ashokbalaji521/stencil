import { conConfig } from "./db.js";
import sql from "mssql";
 
// export const getoperatorid = async (req, res) => {
//   try {
//     const operatorid = req.body.operator;
//     const action = req.body.action;
//     const barcodeID = req.body.barcodeID;
 
//     const pool = await sql.connect(conConfig);
//     console.log("Inhere");
//     console.log(operatorid)
 
//     // Retrieve the StencilID based on BarcodeID
//     const getstencilId = await pool
//       .request()
//       .query(`SELECT StencilID FROM StencilTable WHERE BarcodeID = '${barcodeID}'`);
   
//     const stencil = getstencilId.recordset[0].StencilID;
 
//     // Insert operation history
//     const insertHistory = await pool.request()
//       .query(`INSERT INTO [OperationHistoryN]
//               ([OperatorID], [StencilBarcodeID], [UpdatedDateTime], [Operation], StencilID)
//               VALUES ('${operatorid}', '${barcodeID}', GETDATE(), '${action}', '${stencil}')`);
 
//               const updateOperatorId = await pool.request()
//       .query(`UPDATE [StencilApplication].[dbo].[StencilTable]
//               SET [Operator_id] = '${operatorid}'
//               WHERE [BarcodeID] = '${barcodeID}'`);
//               console.log(barcodeID)
//               console.log(operatorid)
 
//     return res.status(200).json("Success");
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ error: "Failed to add operator to history" });
//   }
// };
 

export const getoperatorid = async (req, res) => {
  try {
    const operatorid = req.body.operator;
    const action = req.body.action;
    const barcodeID = req.body.barcodeID;
    console.log(operatorid,barcodeID,action)

    const pool = await sql.connect(conConfig);

    // Retrieve the StencilID based on BarcodeID
    const getstencilId = await pool
      .request()
      .query(`SELECT StencilID FROM StencilTable WHERE BarcodeID = '${barcodeID}'`);

    if (getstencilId.recordset.length === 0) {
      return res.status(404).json({ error: "StencilID not found for the provided BarcodeID" });
    }

    const stencil = getstencilId.recordset[0].StencilID;

    // Insert operation history
    await pool.request().query(`
      INSERT INTO [OperationHistoryN] 
      ([OperatorID], [StencilBarcodeID], [UpdatedDateTime], [Operation], [StencilID])
      VALUES ('${operatorid}', '${barcodeID}', GETDATE(), '${action}', '${stencil}')
    `);

    // Update OperatorID in StencilTable
    await pool.request().query(`
      UPDATE [StencilApplication].[dbo].[StencilTable]
      SET [Operator_id] = '${operatorid}'
      WHERE [BarcodeID] = '${barcodeID}'
    `);

    // Retrieve the newly inserted record from OperationHistoryN
    const insertedHistory = await pool.request().query(`
      SELECT TOP (1) *
      FROM [StencilApplication].[dbo].[OperationHistoryN]
      WHERE [StencilBarcodeID] = '${barcodeID}' AND [OperatorID] = '${operatorid}'
      ORDER BY [UpdatedDateTime] DESC
    `);

    // Retrieve the updated record from StencilTable
    const updatedStencil = await pool.request().query(`
      SELECT *
      FROM [StencilApplication].[dbo].[StencilTable]
      WHERE [BarcodeID] = '${barcodeID}'
    `);

    return res.status(200).json({
      message: "Success",
      insertedHistory: insertedHistory.recordset,
      updatedStencil: updatedStencil.recordset,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to process the request" });
  }
};

 
export const getoperatorhistory = async (req, res) => {
  try {
    const pool = await sql.connect(conConfig);
 
    const getdata = await pool
      .request()
      .query(`Select * from OperationHistoryN`);
    return res.status(200).json(getdata.recordset);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: "Failed to load operator to history" });
  }
};
 
// export const blockunblock = async (req, res) => {
//   try {
//     const barcode = req.body.barcode;
//     const pool = await sql.connect(conConfig);
 
//     const getdata = await pool
//       .request()
//       .query(
//         `Update StencilTable SET Blocked = ISNULL(Blocked, 0) ^ 1 where BarcodeID = '${barcode}'`
//       );
//     return res.status(200).json(getdata.recordset);
//   } catch (err) {
//     console.log(err);
//     return res
//       .status(500)
//       .json({ error: "Failed to load operator to history" });
//   }
// };
 
export const blockunblock = async (req, res) => {
  try {
    const barcode = req.body.barcode;
    const username = req.body.username; // Get username from the request
    const pool = await sql.connect(conConfig);
    
    // First, get the current state of the stencil
    const getCurrentState = await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .query(`
        SELECT StencilID, Blocked, RackID 
        FROM StencilTable 
        WHERE BarcodeID = @barcode
      `);
    
    if (getCurrentState.recordset.length === 0) {
      return res.status(404).json({ error: "Stencil not found" });
    }
    
    const currentState = getCurrentState.recordset[0];
    const stencilID = currentState.StencilID; 
    const rackID = currentState.RackID;
    
    const getLocation = await pool
      .request()
      .input('rackID', sql.VarChar, rackID)
      .query(`
        SELECT PhysicalLocation 
        FROM stencilRackStatus 
        WHERE Rack_id = @rackID
      `);
    
    let physicalLocation = null;
    if (getLocation.recordset.length > 0) {
      physicalLocation = getLocation.recordset[0].PhysicalLocation;
    }
    
    // Toggle the Blocked status and update UserName
    await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .input('username', sql.VarChar, username) // Add username as input parameter
      .query(`
        UPDATE StencilTable 
        SET Blocked = ISNULL(Blocked, 0) ^ 1,
            LastModifiedDate = GETDATE(),
            UserName = @username
        WHERE BarcodeID = @barcode
      `);
    
    const getUpdatedState = await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .query(`
        SELECT Blocked FROM StencilTable WHERE BarcodeID = @barcode
      `);

    const updatedBlocked = getUpdatedState.recordset[0].Blocked; 
    
    const operation = updatedBlocked ? 'Block' : 'UnBlock';
    
    // Get current timestamp and adjust by -5:30 hours
    const now = new Date();
    const adjustedTimestamp = new Date(now.getTime() - (6 * 60 + 30) * 60 * 1000);
    
    console.log({
      timeColumn: adjustedTimestamp,
      physicalLocation: physicalLocation,
      stencilID: stencilID,
      barcodeID: barcode,
      operation: operation,
      blockedStatus: updatedBlocked,
      username: username // Log username
    });

    // Use the adjusted timestamp for database insertion
    await pool
      .request()
      .input('timeColumn', sql.DateTime, adjustedTimestamp)
      .input('physicalLocation', sql.NVarChar(255), physicalLocation)
      .input('stencilID', sql.NVarChar, stencilID)
      .input('barcodeID', sql.NVarChar(255), barcode)
      .input('operation', sql.NVarChar(255), operation)
      .input('username', sql.NVarChar(255), username) // Add username to log table if needed
      .query(`
        INSERT INTO [StencilApplication].[dbo].[BlockUnBlockScrap] 
        ([TimeColumn], [Physical Location], [StencilID], [BarcodeID], [Operation])
        VALUES (@timeColumn, @physicalLocation, @stencilID, @barcodeID, @operation)
      `);

    const result = {
      barcode: barcode,
      stencilID: stencilID,
      rackID: rackID,
      physicalLocation: physicalLocation,
      timestamp: now.toISOString(),
      adjustedTimestamp: adjustedTimestamp.toISOString(),
      operation: operation, 
      blocked: updatedBlocked,
      username: username, // Include username in response
      success: true
    };
    
    return res.status(200).json(result);
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Failed to process block/unblock operation" });
  }
};


export const scrap = async (req, res) => {
  try {
    const barcode = req.body.barcode;
    const username = req.body.username; // Get username from the request
    const pool = await sql.connect(conConfig);
    
    // First, get the current stencil information
    const getStencilInfo = await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .query(`
        SELECT StencilID, RackID, Scrap
        FROM StencilTable 
        WHERE BarcodeID = @barcode
      `);
    
    if (getStencilInfo.recordset.length === 0) {
      return res.status(404).json({ error: "Stencil not found" });
    }
    
    const stencilInfo = getStencilInfo.recordset[0];
    const stencilID = stencilInfo.StencilID;
    const rackID = stencilInfo.RackID;
    
    // If already scrapped, return early
    if (stencilInfo.Scrap === 1) {
      return res.status(400).json({ error: "Stencil already scrapped" });
    }
    
    // Get physical location from stencilRackStatus
    const getLocation = await pool
      .request()
      .input('rackID', sql.VarChar, rackID)
      .query(`
        SELECT PhysicalLocation 
        FROM stencilRackStatus 
        WHERE Rack_id = @rackID
      `);
    
    let physicalLocation = null;
    if (getLocation.recordset.length > 0) {
      physicalLocation = getLocation.recordset[0].PhysicalLocation;
    }
    
    // Update the Scrap status and UserName
    const updateResult = await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .input('username', sql.VarChar, username) // Add username as input parameter
      .query(`
        UPDATE StencilTable 
        SET Scrap = 1,
            LastModifiedDate = GETDATE(),
            UserName = @username
        WHERE BarcodeID = @barcode
      `);
    
    // Get current timestamp and adjust by -5:30 hours
    const now = new Date();
    const adjustedTimestamp = new Date(now.getTime() - (6 * 60 + 30) * 60 * 1000);
    
    // Insert record into BlockUnBlockScrap table with adjusted timestamp
    await pool
      .request()
      .input('timeColumn', sql.DateTime, adjustedTimestamp)
      .input('physicalLocation', sql.VarChar, physicalLocation)
      .input('stencilID', sql.NVarChar, stencilID)
      .input('barcodeID', sql.VarChar, barcode)
      .input('operation', sql.VarChar, 'Scrap')
      .input('username', sql.VarChar, username) // Add username to log table if needed
      .query(`
        INSERT INTO BlockUnBlockScrap (
          TimeColumn,
          [Physical Location],
          StencilID,
          BarcodeID,
          Operation
        ) VALUES (
          @timeColumn,
          @physicalLocation,
          @stencilID,
          @barcodeID,
          'Scrap'
        )
      `);
    
    // Return the detailed information
    const result = {
      barcode: barcode,
      stencilID: stencilID,
      rackID: rackID,
      physicalLocation: physicalLocation,
      timestamp: now.toISOString(),
      adjustedTimestamp: adjustedTimestamp.toISOString(),
      operation: 'Scrap',
      username: username, // Include username in response
      success: true
    };
    
    return res.status(200).json(result);
    
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to process scrap operation" });
  }
};

export const getAllBlockUnblockRecords = async (req, res) => {
  try {
    const pool = await sql.connect(conConfig);
    
    // Query to get all records from BlockUnBlockScrap
    const result = await pool
      .request()
      .query(`
        SELECT TOP (1000) [ID], [TimeColumn], [Physical Location], [StencilID], [BarcodeID], [Operation]
        FROM [StencilApplication].[dbo].[BlockUnBlockScrap]
      `);
    
    // Return the records
    return res.status(200).json(result.recordset);
    
  } catch (err) {
    console.error(err); // Log the error for debugging
    return res.status(500).json({ error: "Failed to retrieve records" });
  }
};
// export const scrap = async (req, res) => {
//   try {
//     const barcode = req.body.barcode;
//     const pool = await sql.connect(conConfig);
 
//     // Set Scrap to 1 if it's not already 1
//     const getdata = await pool
//       .request()
//       .input('barcode', sql.VarChar, barcode)
//       .query(
//         `UPDATE StencilTable
//          SET Scrap = 1
//          OUTPUT inserted.*
//          WHERE BarcodeID = @barcode AND Scrap <> 1`
//       );
 
//     // If no rows were affected, it means the barcode was not found or already scrapped
//     if (getdata.rowsAffected[0] === 0) {
//       return res.status(404).json({ error: "Barcode not found or already scrapped" });
//     }
 
//     return res.status(200).json(getdata.recordset);
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ error: "Failed to update Scrap status" });
//   }
// };
 
 
// export const getOperatorHistoryDatetimeFilter = async (req, res) => {
//   try {
//     const pool = await sql.connect(conConfig);
   
//     // Extract parameters from request body
//     const { date, fromtime, totime } = req.body;
 
//     // SQL query setup for combining results from both tables
//     let query = `
//       SELECT
//         [ID],
//         [OperatorID],
//         [StencilBarcodeID],
//         [UpdatedDateTime],
//         [Operation],
//         [StencilID],
//         NULL AS [TimeColumn],
//         NULL AS [Physical Location]
//       FROM [StencilApplication].[dbo].[OperationHistoryN]
//       WHERE 1=1
//     `;
 
//     // Add date filter
//     if (date) {
//       query += ` AND CAST([UpdatedDateTime] AS DATE) = @date`;
//     }
 
//     // Add fromtime and totime filters
//     if (fromtime) {
//       query += ` AND [UpdatedDateTime] >= @fromtime`;
//     }
//     if (totime) {
//       query += ` AND [UpdatedDateTime] <= @totime`;
//     }
 
//     // Adding query for the NonAuthorizedOut table with filtering and joins
//     query += `
//       UNION ALL
//       SELECT
//         [na].[ID],
//         NULL AS [OperatorID],
//         st.[BarcodeID] AS [StencilBarcodeID],
//         [na].[TimeColumn] AS [UpdatedDateTime],
//         'NA OUT' AS [Operation],
//         st.[StencilID] AS [StencilID],
//         [na].[TimeColumn] AS [TimeColumn],
//         [na].[Physical Location]
//       FROM [StencilApplication].[dbo].[NonAuthorizedOut] AS [na]
//       LEFT JOIN [StencilApplication].[dbo].[stencilRackStatus] AS [rack]
//         ON [na].[Physical Location] = [rack].[PhysicalLocation]
//       LEFT JOIN [StencilApplication].[dbo].[StencilTable] AS [st]
//         ON [rack].[Rack_id] = [st].[RackID]
//       WHERE 1=1
//     `;
 
//     // Add date range filter for the NonAuthorizedOut table
//     if (fromtime) {
//       query += ` AND [na].[TimeColumn] >= @fromtime`;
//     }
//     if (totime) {
//       query += ` AND [na].[TimeColumn] <= @totime`;
//     }
 
//     // Add ORDER BY clause to sort by UpdatedDateTime in descending order
//     // query += `
//     //   ORDER BY [UpdatedDateTime] DESC
//     // `;
 
//     const request = pool.request();
 
//     // Add parameters to the request with the correct types
//     if (date) {
//       request.input('date', sql.Date, date); // Accepts date format like '2024-10-25'
//     }
//     if (fromtime) {
//       request.input('fromtime', sql.DateTime, fromtime); // Full datetime like '2024-10-25T15:05:43.323Z'
//     }
//     if (totime) {
//       request.input('totime', sql.DateTime, totime);
//     }
 
//     // Execute query
//     const getdata = await request.query(query);
//     return res.status(200).json(getdata.recordset);
//   } catch (err) {
//     console.error("Error details:", err);
//     return res.status(500).json({ error: "Failed to load operator history", details: err.message });
//   }
// };
 
 
 
 
// export const getOperatorHistoryDatetimeFilter = async (req, res) => {
//   try {
//     const pool = await sql.connect(conConfig);
   
//     // Extract parameters from request body
//     const { date, fromtime, totime } = req.body;
 
//     // SQL query setup for combining results from all three tables
//     let query = `
//     SELECT
//       [ID],
//       [OperatorID],
//       [StencilBarcodeID],
//       [UpdatedDateTime],
//       [Operation],
//       [StencilID],
//       NULL AS [TimeColumn],
//       [PhysicalLocation]
//     FROM [StencilApplication].[dbo].[OperationHistoryN]
//     WHERE [PhysicalLocation] IS NOT NULL
//   `;
 
//     // Add date filter
//     if (date) {
//       query += ` AND CAST([UpdatedDateTime] AS DATE) = @date`;
//     }
 
//     // Add fromtime and totime filters
//     if (fromtime) {
//       query += ` AND [UpdatedDateTime] >= @fromtime`;
//     }
//     if (totime) {
//       query += ` AND [UpdatedDateTime] <= @totime`;
//     }
 
//     // Adding query for the NonAuthorizedOut table with filtering and joins
//     query += `
//       UNION ALL
//       SELECT
//         [na].[ID],
//         NULL AS [OperatorID],
//         [na].[BarcodeID] AS [StencilBarcodeID],
//         [na].[TimeColumn] AS [UpdatedDateTime],
//         'NA OUT' AS [Operation],
//         [na].[StencilID] AS [StencilID],
//         [na].[TimeColumn] AS [TimeColumn],
//         [na].[Physical Location]
//       FROM [StencilApplication].[dbo].[NonAuthorizedOut] AS [na]
//       LEFT JOIN [StencilApplication].[dbo].[stencilRackStatus] AS [rack]
//         ON [na].[Physical Location] = [rack].[PhysicalLocation]
//       LEFT JOIN [StencilApplication].[dbo].[StencilTable] AS [st]
//         ON [rack].[Rack_id] = [st].[RackID]
//       WHERE 1=1
//     `;
 
//     // Add date range filter for the NonAuthorizedOut table
//     if (fromtime) {
//       query += ` AND [na].[TimeColumn] >= @fromtime`;
//     }
//     if (totime) {
//       query += ` AND [na].[TimeColumn] <= @totime`;
//     }

//     // Adding query for the StencilTable with filtering and joins
//     // query += `
//     //   UNION ALL
//     //   SELECT 
//     //     st.[SNO] AS [ID],
//     //     st.[Operator_id] AS [OperatorID],
//     //     st.[BarcodeID] AS [StencilBarcodeID],
//     //     st.LastINDate AS [UpdatedDateTime],
//     //     'IN' AS [Operation],
//     //     st.[StencilID] AS [StencilID],
//     //     st.LastINDate AS [TimeColumn],
//     //     sr.[PhysicalLocation]
//     //   FROM 
//     //     [StencilApplication].[dbo].[StencilTable] st
//     //   LEFT JOIN 
//     //     [StencilApplication].[dbo].[stencilRackStatus] sr
//     //     ON st.RackID = sr.Rack_id
//     //   WHERE 
//     //     st.[Status] = '1'
//     // `;

//     // // Add date range filter for the StencilTable
//     // if (fromtime) {
//     //   query += ` AND st.LastINDate >= @fromtime`;
//     // }
//     // if (totime) {
//     //   query += ` AND st.LastINDate <= @totime`;
//     // }
 
//     // Add ORDER BY clause to sort by UpdatedDateTime in descending order
//     query += `
//       ORDER BY [UpdatedDateTime] DESC
//     `;
 
//     const request = pool.request();
 
//     // Add parameters to the request with the correct types
//     if (date) {
//       request.input('date', sql.Date, date); // Accepts date format like '2024-10-25'
//     }
//     if (fromtime) {
//       request.input('fromtime', sql.DateTime, fromtime); // Full datetime like '2024-10-25T15:05:43.323Z'
//     }
//     if (totime) {
//       request.input('totime', sql.DateTime, totime);
//     }
 
//     // Execute query
//     const getdata = await request.query(query);
//     return res.status(200).json(getdata.recordset);
//   } catch (err) {
//     console.error("Error details:", err);
//     return res.status(500).json({ error: "Failed to load operator history", details: err.message });
//   }
// };



// export const getAllHistoryDatetimeFilter = async (req, res) => {
//   try {
//     const pool = await sql.connect(conConfig);
   
//     // Extract parameters from request body
//     const { date, fromtime, totime } = req.body;
 
//     // SQL query setup for combining results from all three tables
//     let query = `
//     SELECT
//       op.[ID],
//       op.[OperatorID],
//       op.[StencilBarcodeID],
//       op.[UpdatedDateTime],
//       op.[Operation],
//       op.[StencilID],
//       NULL AS [TimeColumn],
//       op.[PhysicalLocation],
//       st.[UserName]  -- Added UserName from StencilTable
//     FROM [StencilApplication].[dbo].[OperationHistoryN] op
//     LEFT JOIN [StencilApplication].[dbo].[StencilTable] st
//       ON op.[StencilID] = st.[StencilID]
//     WHERE op.[PhysicalLocation] IS NOT NULL
//   `;
 
//     // Add date filter
//     if (date) {
//       query += ` AND CAST(op.[UpdatedDateTime] AS DATE) = @date`;
//     }
 
//     // Add fromtime and totime filters
//     if (fromtime) {
//       query += ` AND op.[UpdatedDateTime] >= @fromtime`;
//     }
//     if (totime) {
//       query += ` AND op.[UpdatedDateTime] <= @totime`;
//     }
 
//     // Adding query for the NonAuthorizedOut table with filtering and joins
//     query += `
//       UNION ALL
//       SELECT
//         na.[ID],
//         NULL AS [OperatorID],
//         na.[BarcodeID] AS [StencilBarcodeID],
//         na.[TimeColumn] AS [UpdatedDateTime],
//         'NA OUT' AS [Operation],
//         na.[StencilID],
//         na.[TimeColumn] AS [TimeColumn],
//         na.[Physical Location],
//         st.[UserName]  -- Added UserName
//       FROM [StencilApplication].[dbo].[NonAuthorizedOut] na
//       LEFT JOIN [StencilApplication].[dbo].[stencilRackStatus] rack
//         ON na.[Physical Location] = rack.[PhysicalLocation]
//       LEFT JOIN [StencilApplication].[dbo].[StencilTable] st
//         ON rack.[Rack_id] = st.[RackID]
//       WHERE 1=1
//     `;
 
//     // Add date range filter for the NonAuthorizedOut table
//     if (fromtime) {
//       query += ` AND na.[TimeColumn] >= @fromtime`;
//     }
//     if (totime) {
//       query += ` AND na.[TimeColumn] <= @totime`;
//     }

//     // Adding query for the BlockUnBlockScrap table
//     query += `
//       UNION ALL
//       SELECT 
//         bu.[ID],
//         NULL AS [OperatorID],  -- Assuming no OperatorID in BlockUnBlockScrap
//         bu.[BarcodeID] AS [StencilBarcodeID],
//         bu.[TimeColumn] AS [UpdatedDateTime],
//         bu.[Operation],
//         bu.[StencilID],
//         bu.[TimeColumn] AS [TimeColumn],
//         bu.[Physical Location],
//         st.[UserName]  -- Added UserName
//       FROM [StencilApplication].[dbo].[BlockUnBlockScrap] bu
//       LEFT JOIN [StencilApplication].[dbo].[StencilTable] st
//         ON bu.[StencilID] = st.[StencilID]
//     `;

//     // Add date range filter for the BlockUnBlockScrap table
//     if (fromtime) {
//       query += ` AND bu.[TimeColumn] >= @fromtime`;
//     }
//     if (totime) {
//       query += ` AND bu.[TimeColumn] <= @totime`;
//     }
 
//     // Add ORDER BY clause to sort by UpdatedDateTime in descending order
//     query += `
//       ORDER BY [UpdatedDateTime] DESC
//     `;
 
//     const request = pool.request();
 
//     // Add parameters to the request with the correct types
//     if (date) {
//       request.input('date', sql.Date, date);
//     }
//     if (fromtime) {
//       request.input('fromtime', sql.DateTime, fromtime);
//     }
//     if (totime) {
//       request.input('totime', sql.DateTime, totime);
//     }
 
//     // Execute query
//     const getdata = await request.query(query);
//     return res.status(200).json(getdata.recordset);
//   } catch (err) {
//     console.error("Error details:", err);
//     return res.status(500).json({ error: "Failed to load operator history", details: err.message });
//   }
// };


//modified at 8th may 2025
export const getOperatorHistoryDatetimeFilter = async (req, res) => {
  try {
    const pool = await sql.connect(conConfig);

    // Extract parameters from request body
    const { date, fromtime, totime } = req.body;

    // Base query for OperationHistoryN
    let query = `
      SELECT
        [ID],
        [OperatorID],
        [OperationHistoryN].[StencilBarcodeID],
        [UpdatedDateTime],
        [Operation],
        [OperationHistoryN].[StencilID],
        NULL AS [TimeColumn],
        [PhysicalLocation],
        [PairedPhysicalLocation],  -- Added PairedPhysicalLocation
        st.[Rackno]
      FROM [StencilApplication].[dbo].[OperationHistoryN]
      LEFT JOIN [StencilApplication].[dbo].[StencilTable] st
        ON [OperationHistoryN].[StencilBarcodeID] = st.[BarcodeID]
      WHERE [PhysicalLocation] IS NOT NULL
    `;

    // Add date filter
    if (date) {
      query += ` AND CAST([UpdatedDateTime] AS DATE) = @date`;
    }

    // Add fromtime and totime filters
    if (fromtime) {
      query += ` AND [UpdatedDateTime] >= @fromtime`;
    }
    if (totime) {
      query += ` AND [UpdatedDateTime] <= @totime`;
    }

    // Include NonAuthorizedOut records
    query += `
      UNION ALL
      SELECT 
        temp.[ID],
        NULL AS [OperatorID],
        temp.[StencilBarcodeID],
        temp.[UpdatedDateTime],
        temp.[Operation],
        temp.[StencilID],
        temp.[TimeColumn],
        temp.[Physical_Location],
        temp.[PairedPhysicalLocation],  -- Added PairedPhysicalLocation
        temp.[Rackno]
      FROM (
        SELECT
          [na].[ID],
          [na].[BarcodeID] AS [StencilBarcodeID],
          [na].[TimeColumn] AS [UpdatedDateTime],
          'NA OUT' AS [Operation],
          [na].[StencilID] AS [StencilID],
          [na].[TimeColumn],
          CAST([na].[Physical Location] AS NVARCHAR(50)) AS [Physical_Location],
          [na].[PairedPhysicalLocation],  -- Added PairedPhysicalLocation
          ISNULL(st.[RackNo], na.[RackNo]) AS [Rackno],
          LAG([na].[TimeColumn]) OVER (
            PARTITION BY [na].[Physical Location]
            ORDER BY [na].[TimeColumn]
          ) AS PrevTimeColumn
        FROM [StencilApplication].[dbo].[NonAuthorizedOut] AS [na]
        LEFT JOIN [StencilApplication].[dbo].[StencilTable] AS [st]
          ON [na].[StencilID] = [st].[StencilID]
        WHERE 1=1
    `;

    if (fromtime) {
      query += ` AND [na].[TimeColumn] >= @fromtime`;
    }
    if (totime) {
      query += ` AND [na].[TimeColumn] <= @totime`;
    }

    query += `
      ) AS temp
      WHERE temp.PrevTimeColumn IS NULL OR DATEDIFF(SECOND, temp.PrevTimeColumn, temp.TimeColumn) > 5
    `;

    // Include NonAuthorizedStencilIn records
    query += `
      UNION ALL
      SELECT
        [ID],
        NULL AS [OperatorID],
        [BarcodeID] AS [StencilBarcodeID],
        [TimeColumn] AS [UpdatedDateTime],
        'NA IN' AS [Operation],
        [StencilID],
        [TimeColumn],
        [PhysicalLocation],
        [PairedPhysicalLocation],  -- Added PairedPhysicalLocation
        [RackNo]
      FROM [StencilApplication].[dbo].[NonAuthorizedStencilIn]
      WHERE 1=1
    `;

    if (fromtime) {
      query += ` AND [TimeColumn] >= @fromtime`;
    }
    if (totime) {
      query += ` AND [TimeColumn] <= @totime`;
    }
    if (date) {
      query += ` AND CAST([TimeColumn] AS DATE) = @date`;
    }

    // Final ORDER BY
    query += `
      ORDER BY [UpdatedDateTime] DESC
    `;

    // Prepare request
    const request = pool.request();

    if (date) {
      request.input('date', sql.Date, date);
    }
    if (fromtime) {
      request.input('fromtime', sql.DateTime, fromtime);
    }
    if (totime) {
      request.input('totime', sql.DateTime, totime);
    }

    // Execute query
    const getdata = await request.query(query);

    return res.status(200).json(getdata.recordset);
  } catch (err) {
    console.error("Error details:", err);
    return res.status(500).json({ error: "Failed to load operator history", details: err.message });
  }
};
export const getAllHistoryDatetimeFilter = async (req, res) => {
  try {
    const pool = await sql.connect(conConfig);
    const { date, fromtime, totime } = req.body;

    let query = `
    SELECT
      op.[ID],
      op.[OperatorID],
      op.[StencilBarcodeID],
      op.[UpdatedDateTime],
      op.[Operation],
      op.[StencilID],
      NULL AS [TimeColumn],
      op.[PhysicalLocation],
      op.[PairedPhysicalLocation],  -- Added PairedPhysicalLocation
      st.[UserName],
      st.[BarcodeID],
      st.[Rackno]
    FROM [StencilApplication].[dbo].[OperationHistoryN] op
    LEFT JOIN [StencilApplication].[dbo].[StencilTable] st
      ON op.[StencilBarcodeID] = st.[BarcodeID]
    WHERE op.[PhysicalLocation] IS NOT NULL
  `;

    if (date) {
      query += ` AND CAST(op.[UpdatedDateTime] AS DATE) = @date`;
    }
    if (fromtime) {
      query += ` AND op.[UpdatedDateTime] >= @fromtime`;
    }
    if (totime) {
      query += ` AND op.[UpdatedDateTime] <= @totime`;
    }

    // NonAuthorizedOut section
    query += `
      UNION ALL
      SELECT
        temp.[ID],
        NULL AS [OperatorID],
        temp.[StencilBarcodeID],
        temp.[UpdatedDateTime],
        temp.[Operation],
        temp.[StencilID],
        temp.[TimeColumn],
        temp.[Physical_Location],
        temp.[PairedPhysicalLocation],  -- Added PairedPhysicalLocation
        temp.[UserName],
        NULL AS [BarcodeID],
        temp.[Rackno]
      FROM (
        SELECT
          na.[ID],
          na.[BarcodeID] AS [StencilBarcodeID],
          na.[TimeColumn] AS [UpdatedDateTime],
          'NA OUT' AS [Operation],
          na.[StencilID],
          na.[TimeColumn],
          CAST(na.[Physical Location] AS NVARCHAR(50)) AS [Physical_Location],
          na.[PairedPhysicalLocation],  -- Added PairedPhysicalLocation
          st.[UserName],
          ISNULL(st.[RackNo], na.[RackNo]) AS [Rackno],
          LAG(na.[TimeColumn]) OVER (
            PARTITION BY na.[Physical Location]
            ORDER BY na.[TimeColumn]
          ) AS PrevTimeColumn
        FROM [StencilApplication].[dbo].[NonAuthorizedOut] na
        LEFT JOIN [StencilApplication].[dbo].[StencilTable] st
          ON na.[StencilID] = st.[StencilID]
      ) AS temp
      WHERE (temp.PrevTimeColumn IS NULL OR DATEDIFF(SECOND, temp.PrevTimeColumn, temp.TimeColumn) > 5)
    `;

    if (fromtime) {
      query += ` AND temp.[TimeColumn] >= @fromtime`;
    }
    if (totime) {
      query += ` AND temp.[TimeColumn] <= @totime`;
    }

    // BlockUnBlockScrap section
    query += `
      UNION ALL
      SELECT 
        bu.[ID],
        NULL AS [OperatorID],
        bu.[BarcodeID] AS [StencilBarcodeID],
        bu.[TimeColumn] AS [UpdatedDateTime],
        bu.[Operation],
        bu.[StencilID],
        bu.[TimeColumn],
        bu.[Physical Location],
        NULL AS [PairedPhysicalLocation],  -- Assumed NULL as not in schema
        st.[UserName],
        NULL AS [BarcodeID],
        st.[Rackno]
      FROM [StencilApplication].[dbo].[BlockUnBlockScrap] bu
      LEFT JOIN [StencilApplication].[dbo].[StencilTable] st
        ON bu.[StencilID] = st.[StencilID]
      WHERE 1=1
    `;

    if (fromtime) {
      query += ` AND bu.[TimeColumn] >= @fromtime`;
    }
    if (totime) {
      query += ` AND bu.[TimeColumn] <= @totime`;
    }

    // NonAuthorizedStencilIn section
    query += `
      UNION ALL
      SELECT 
        nas.[ID],
        NULL AS [OperatorID],
        nas.[BarcodeID] AS [StencilBarcodeID],
        nas.[TimeColumn] AS [UpdatedDateTime],
        'NA IN' AS [Operation],
        nas.[StencilID],
        nas.[TimeColumn],
        nas.[PhysicalLocation],
        nas.[PairedPhysicalLocation],  -- Added PairedPhysicalLocation
        st.[UserName],
        NULL AS [BarcodeID],
        nas.[Rackno]
      FROM [StencilApplication].[dbo].[NonAuthorizedStencilIn] nas
      LEFT JOIN [StencilApplication].[dbo].[StencilTable] st
        ON nas.[StencilID] = st.[StencilID]
      WHERE 1=1
    `;

    if (fromtime) {
      query += ` AND nas.[TimeColumn] >= @fromtime`;
    }
    if (totime) {
      query += ` AND nas.[TimeColumn] <= @totime`;
    }

    // RegistrationStatus = 1
    query += `
      UNION ALL
      SELECT 
        st.[SNO] AS [ID],
        NULL AS [OperatorID],
        st.[BarcodeID] AS [StencilBarcodeID],
        st.[RegisterationDatetime] AS [UpdatedDateTime],
        'REGISTER' AS [Operation],
        st.[StencilID],
        NULL AS [TimeColumn],
        NULL AS [PhysicalLocation],
        NULL AS [PairedPhysicalLocation],  -- Assumed NULL as not in StencilTable schema
        st.[UserName],
        st.[BarcodeID],
        st.[Rackno]
      FROM [StencilApplication].[dbo].[StencilTable] st
      WHERE st.[RegisterationStatus] = 1
    `;

    // UpdatedStatus = 1
    query += `
      UNION ALL
      SELECT 
        st.[SNO] AS [ID],
        NULL AS [OperatorID],
        st.[BarcodeID] AS [StencilBarcodeID],
        st.[LastModifiedDate] AS [UpdatedDateTime],
        'UPDATED' AS [Operation],
        st.[StencilID],
        NULL AS [TimeColumn],
        NULL AS [PhysicalLocation],
        NULL AS [PairedPhysicalLocation],  -- Assumed NULL as not in StencilTable schema
        st.[UserName],
        st.[BarcodeID],
        st.[Rackno]
      FROM [StencilApplication].[dbo].[StencilTable] st
      WHERE st.[UpdatedStatus] = 1
    `;

    query += `
      ORDER BY [UpdatedDateTime] DESC
    `;

    const request = pool.request();

    if (date) request.input('date', sql.Date, date);
    if (fromtime) request.input('fromtime', sql.DateTime, fromtime);
    if (totime) request.input('totime', sql.DateTime, totime);

    const getdata = await request.query(query);
    return res.status(200).json(getdata.recordset);
  } catch (err) {
    console.error("Error details:", err);
    return res.status(500).json({ error: "Failed to load operator history", details: err.message });
  }
};