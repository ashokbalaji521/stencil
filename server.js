// import express from "express";
// import bodyParser from "body-parser";
// import cors from "cors";
// import path from "path";
// import http from "http";
// import { conConfig } from "./db.js";
// import cron from "node-cron";
// import sql from "mssql";
// // import cookieParser from "cookie-parser";
// // import path from "path";
// // import { fileURLToPath } from "url";
// // import { dirname } from "path";
// import router from "./routes.js";
// // import session from "express-session";
// // import https from "https";
// // import fs from "fs";
// const app = express();
// const server = http.createServer(app);

// app.use(cors());

// // var whitelist = [
// //   "https://10.131.213.169",
// //   "https://localhost",
// //   "http://10.131.213.169",
// //   "http://localhost",,
// // ];
// // var corsOptions = {
// //   origin: function (origin, callback) {
// //     if (whitelist.indexOf(origin) !== -1) {
// //       callback(null, true);
// //     } else {
// //       callback("Not allowed by CORS");
// //     }
// //   },
// //   credentials: true,
// // };
// // app.use(cors(corsOptions));

// app.use("/uploads", express.static("uploads"));

// //app.use(cookieParser());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use("/Stencil_Management_API/", router);

// //app.use(express.static('public'));
// //const port = process.env.port || 8080;
// const PORT = process.env.PORT || 4000;
// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// async function checkForUpdates() {
//   try {
//     // Connect to the database
//     let stencilOut = false;
//     let stencilIn = false;
//     const pool = await sql.connect(conConfig);

//     // Query to check the last value of the table
//     const result = await pool
//       .request()
//       .query("SELECT LastValue FROM LastKnownValue");
//     let lastKnownValue = result.recordset[0].LastValue;
//     // Assuming you're checking a single row with a known ID

//     const result1 = await pool
//       .request()
//       .query(`SELECT data from [tblRackSensorInput] where rackid='Rack-1'`);
//     let currentValue = result1.recordset[0].data;
//     console.log(currentValue);
//     console.log(lastKnownValue);
//     if (currentValue == lastKnownValue) {
//       console.log("no change");
//     }
//     // If the value has changed, log the update time
//     if (currentValue !== lastKnownValue) {
//       lastKnownValue = String(lastKnownValue);
//       currentValue = String(currentValue);

//       // Initialize an array to store the positions where values have changed
//       const changedPositions = [];

//       // Compare characters in both strings
//       for (let i = 0; i < lastKnownValue.length; i++) {
//         if (lastKnownValue[i] !== currentValue[i]) {
//           if (lastKnownValue[i] == "0" && currentValue[i] == "1") {
//             stencilOut = true;
//             const buzzer = await pool
//               .request()
//               .query(
//                 `Update [StencilLEDStatus] set [LEDRackStatus] = 1 where [PhysicalLocation] = 'B'`
//               );
//           }
//           if (lastKnownValue[i] == "1" && currentValue[i] == "0") {
//             stencilIn = true;
//           }
//           changedPositions.push(i);
//         }
//       }
//       let changedposition = changedPositions[0] + 1;
//       console.log("changed", changedposition);

//       const getphysicalloc = await pool
//         .request()
//         .query(
//           `Select PhysicalLocation from [stencilRackStatus] where Rack_id = '${changedposition}'`
//         );

//       const physicalLoc = getphysicalloc.recordset[0].PhysicalLocation;

//       const lightup = await pool
//         .request()
//         .query(
//           `Update [StencilLEDStatus] set [LEDRackStatus] = 1 where [PhysicalLocation] = '${physicalLoc}'`
//         );
//       console.log("Lighted up");

//       if (stencilOut) {
//         console.log("Stencil Out");
//         console.log("changes", changedposition);

//         // const checkauthorized = await pool.request().query(
//         //   `SELECT CASE
//         //   WHEN EXISTS (SELECT 1 FROM StencilTable WHERE RackID = '${changedposition}')
//         //   THEN 1
//         //   ELSE 0
//         // END AS id_exists;`
//         // );
//         const updateNonAuthorized = await pool.request().query(`
//           IF NOT EXISTS (
//               SELECT 1
//               FROM [NonAuthorizedOut]
//               WHERE CONVERT(VARCHAR(16), [TimeColumn], 120) = CONVERT(VARCHAR(16), GETDATE(), 120)
//           )
//           BEGIN
//               INSERT INTO [NonAuthorizedOut] ([TimeColumn], [Physical Location])
//               SELECT
//                   GETDATE() AS TimeColumn,
//                   [PhysicalLocation]
//               FROM [StencilRackStatus]
//               WHERE Rack_id = '${changedposition}'
//           END
//         `);
 
//         await new Promise((resolve) => setTimeout(resolve, 2000));

//         // Turn the LED off (status = 0)
//         await pool.request().query(`
//           UPDATE [StencilLEDStatus]
//           SET [LEDRackStatus] = 0
//           WHERE [PhysicalLocation] = 'B'
//         `);
//         const checkauthorized = await pool
//           .request()
//           .query(
//             `SELECT AuthorizedOut FROM StencilTable where RackId = '${changedposition}'`
//           );
//         console.log("Authorized", checkauthorized.recordset);

//         if (checkauthorized.recordset && checkauthorized.recordset.length > 0) {
//           const Authorized = checkauthorized.recordset[0].AuthorizedOut;
//           if (Authorized) {
//             const lightOFF = await pool
//               .request()
//               .query(
//                 `Update [StencilLEDStatus] set [LEDRackStatus] = 0 where [PhysicalLocation] = '${physicalLoc}'`
//               );

//             const deleteNonAuthorized = await pool.request()
//               .query(`DELETE FROM [NonAuthorizedOut]
// WHERE ID = (SELECT MAX(ID) FROM [NonAuthorizedOut]);`);
//           }
//         }
//         const removeStencilData = await pool
//           .request()
//           .query(
//             `Update [StencilTable] set Status=0,RackID = NULL,LedID = NULL ,Authorized=NULL,AuthorizedOut=NULL where RackID='${changedposition}'`
//           );

//         const lightOFF = await pool
//           .request()
//           .query(
//             `Update [StencilLEDStatus] set [LEDRackStatus] = 0 where [PhysicalLocation] = '${physicalLoc}'`
//           );
//       }

//       if (stencilIn) {
//         const checkauthorized = await pool.request().query(
//           ` SELECT CASE 
//           WHEN EXISTS (SELECT 1 FROM StencilTable WHERE RackID = '${changedposition}') 
//           THEN 1 
//           ELSE 0 
//         END AS id_exists;`
//         );
//         const AuthorizedIn = checkauthorized.recordset[0].id_exists;
//         if (AuthorizedIn) {
//           const lightOFF = await pool
//             .request()
//             .query(
//               `Update [StencilLEDStatus] set [LEDRackStatus] = 0 where [PhysicalLocation] = '${physicalLoc}'`
//             );
//         }
//       }

//       const updatelast = await pool
//         .request()
//         .query(`update LastKnownValue set LastValue = '${currentValue}'`);
//     }
//   } catch (error) {
//     console.error("Error checking for updates:", error);
//   }
// }


// ///uncomment before deployingg.......................
// // function startPolling() {
// //   // Poll immediately on start
// //   checkForUpdates();

// //   // Poll every 20 seconds
// //   setInterval(checkForUpdates, 5 * 1000); // 20 seconds in milliseconds
// // }
// // // Polling interval (every minute in this example)
// // const job = cron.schedule("* * * * *", startPolling);
// // function stopCronJob() {
// //   job.stop();
// //   console.log("Cron job stopped.");
// // }

// // // Example of stopping the cron job after 5 minutes
// // setTimeout(() => {
// //   stopCronJob();
// // }, 10 * 60 * 1000);


//-----------------------------------------------------------------------------------------------------------------------------------//



// import express from "express";
// import bodyParser from "body-parser";
// import cors from "cors";
// import path from "path";
// import http from "http";
// import { conConfig } from "./db.js";
// import cron from "node-cron";
// import sql from "mssql";
// import router from "./routes.js";

// const app = express();
// const server = http.createServer(app);

// app.use(cors());

// // var whitelist = [
// //   "https://10.131.213.169",
// //   "https://localhost",
// //   "http://10.131.213.169",
// //   "http://localhost",,
// // ];
// // var corsOptions = {
// //   origin: function (origin, callback) {
// //     if (whitelist.indexOf(origin) !== -1) {
// //       callback(null, true);
// //     } else {
// //       callback("Not allowed by CORS");
// //     }
// //   },
// //   credentials: true,
// // };
// // app.use(cors(corsOptions));
// app.use("/uploads", express.static("uploads"));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use("/Stencil_Management_API/", router);

// const PORT = process.env.PORT || 4000;
// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// async function checkForUpdates() {
//   try {
//     // Connect to the database
//     let stencilOut = false;
//     let stencilIn = false;
//     const pool = await sql.connect(conConfig);

//     // Query to check the last value of the table
//     const result = await pool
//       .request()
//       .query("SELECT LastValue FROM LastKnownValue");
//     let lastKnownValue = result.recordset[0].LastValue;

//     const result1 = await pool
//       .request()
//       .query(`SELECT data from [tblRackSensorInput] where rackid='Rack-1'`);
//     let currentValue = result1.recordset[0].data;
//     console.log(currentValue);
//     console.log(lastKnownValue);
    
//     if (currentValue == lastKnownValue) {
//       console.log("no change");
//     }

//     // If the value has changed, log the update time
//     if (currentValue !== lastKnownValue) {
//       lastKnownValue = String(lastKnownValue);
//       currentValue = String(currentValue);

//       // Initialize an array to store the positions where values have changed
//       const changedPositions = [];

//       // Compare characters in both strings
//       for (let i = 0; i < lastKnownValue.length; i++) {
//         if (lastKnownValue[i] !== currentValue[i]) {
//           if (lastKnownValue[i] == "0" && currentValue[i] == "1") {
//             stencilOut = true;
//             await pool
//               .request()
//               .query(
//                 `Update [StencilLEDStatus] set [LEDRackStatus] = 1 where [PhysicalLocation] = 'B'`
//               );
//           }
//           if (lastKnownValue[i] == "1" && currentValue[i] == "0") {
//             stencilIn = true;
//           }
//           changedPositions.push(i);
//         }
//       }
//       let changedposition = changedPositions[0] + 1;
//       console.log("changed", changedposition);

//       // Get StencilID and BarcodeID before changing RackID
//       const stencilData = await pool
//         .request()
//         .query(
//           `SELECT StencilID, BarcodeID FROM StencilTable WHERE RackID = '${changedposition}'`
//         );

//       let stencilID, barcodeID;
//       if (stencilData.recordset.length > 0) {
//         stencilID = stencilData.recordset[0].StencilID;
//         barcodeID = stencilData.recordset[0].BarcodeID;
//       }

//       const getphysicalloc = await pool
//         .request()
//         .query(
//           `Select PhysicalLocation from [stencilRackStatus] where Rack_id = '${changedposition}'`
//         );

//       const physicalLoc = getphysicalloc.recordset[0].PhysicalLocation;

//       const lightup = await pool
//         .request()
//         .query(
//           `Update [StencilLEDStatus] set [LEDRackStatus] = 1 where [PhysicalLocation] = '${physicalLoc}'`
//         );
//       console.log("Lighted up");

//       if (stencilOut) {
//         console.log("Stencil Out");
//         console.log("changes", changedposition);

//         // Insert into NonAuthorizedOut with StencilID and BarcodeID
//         const updateNonAuthorized = await pool.request().query(`
//           IF NOT EXISTS (
//               SELECT 1
//               FROM [NonAuthorizedOut]
//               WHERE CONVERT(VARCHAR(16), [TimeColumn], 120) = CONVERT(VARCHAR(16), GETDATE(), 120)
//           )
//           BEGIN
//               INSERT INTO [NonAuthorizedOut] ([TimeColumn], [Physical Location], [StencilID], [BarcodeID])
//               VALUES (GETDATE(), '${physicalLoc}', '${stencilID}', '${barcodeID}')
//           END
//         `);
        
//         await new Promise((resolve) => setTimeout(resolve, 2000));

//         // Turn the LED off (status = 0)
//         await pool.request().query(`
//           UPDATE [StencilLEDStatus]
//           SET [LEDRackStatus] = 0
//           WHERE [PhysicalLocation] = 'B'
//         `);
//         const checkauthorized = await pool
//           .request()
//           .query(
//             `SELECT AuthorizedOut FROM StencilTable where RackId = '${changedposition}'`
//           );
//         console.log("Authorized", checkauthorized.recordset);

//         if (checkauthorized.recordset && checkauthorized.recordset.length > 0) {
//           const Authorized = checkauthorized.recordset[0].AuthorizedOut;
//           if (Authorized) {
//             const lightOFF = await pool
//               .request()
//               .query(
//                 `Update [StencilLEDStatus] set [LEDRackStatus] = 0 where [PhysicalLocation] = '${physicalLoc}'`
//               );

//             const deleteNonAuthorized = await pool.request()
//               .query(`DELETE FROM [NonAuthorizedOut]
// WHERE ID = (SELECT MAX(ID) FROM [NonAuthorizedOut]);`);
//           }
//         }
//         const removeStencilData = await pool
//           .request()
//           .query(
//             `Update [StencilTable] set Status=0,RackID = NULL,LedID = NULL ,Authorized=NULL,AuthorizedOut=NULL where RackID='${changedposition}'`
//           );

//         const lightOFF = await pool
//           .request()
//           .query(
//             `Update [StencilLEDStatus] set [LEDRackStatus] = 0 where [PhysicalLocation] = '${physicalLoc}'`
//           );
//       }

//       if (stencilIn) {
//         const checkauthorized = await pool.request().query(
//           ` SELECT CASE 
//           WHEN EXISTS (SELECT 1 FROM StencilTable WHERE RackID = '${changedposition}') 
//           THEN 1 
//           ELSE 0 
//         END AS id_exists;`
//         );
//         const AuthorizedIn = checkauthorized.recordset[0].id_exists;
//         if (AuthorizedIn) {
//           const lightOFF = await pool
//             .request()
//             .query(
//               `Update [StencilLEDStatus] set [LEDRackStatus] = 0 where [PhysicalLocation] = '${physicalLoc}'`
//             );
//         }
//       }

//       const updatelast = await pool
//         .request()
//         .query(`update LastKnownValue set LastValue = '${currentValue}'`);
//     }
//   } catch (error) {
//     console.error("Error checking for updates:", error);
//   }
// }

// Schedule the checkForUpdates function to run at a specified interval
// cron.schedule('* * * * *', checkForUpdates); // Adjust the cron expression as needed


// //uncomment before deployingg.......................
// function startPolling() {
//   // Poll immediately on start
//   checkForUpdates();

//   // Poll every 20 seconds
//   setInterval(checkForUpdates, 5 * 1000); // 20 seconds in milliseconds
// }
// // Polling interval (every minute in this example)
// const job = cron.schedule("* * * * *", startPolling);
// function stopCronJob() {
//   job.stop();
//   console.log("Cron job stopped.");
// }

// // Example of stopping the cron job after 5 minutes
// setTimeout(() => {
//   stopCronJob();
// }, 10 * 60 * 1000);



//-------------------------------------------------------------------------------------------------------------//
// import express from "express";
// import bodyParser from "body-parser";
// import cors from "cors";
// import path from "path";
// import http from "http";
// import { conConfig } from "./db.js";
// import cron from "node-cron";
// import sql from "mssql";
// import router from "./routes.js";
// import { SMTPClient } from "emailjs";

// const app = express();
// const server = http.createServer(app);

// app.use(cors());
// app.use("/uploads", express.static("uploads"));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use("/Stencil_Management_API/", router);

// const PORT = process.env.PORT || 4000;
// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// // Configuration for different racks
// const RACK_CONFIG = {
//   'Rack-1': {
//     lastValueColumn: 'LastValue',
//     ledStatusTable: 'StencilLEDStatus',
//     rackStatusTable: 'stencilRackStatus',
//     stencilTableRackColumn: 'RackID',
//     stencilTableLedColumn: 'LedID'
//   },
//   'Rack-2': {
//     lastValueColumn: 'LastValue2',
//     ledStatusTable: 'StencilLEDStatus1',
//     rackStatusTable: 'stencilRackStatus1_copy',
//     stencilTableRackColumn: 'RackID2',
//     stencilTableLedColumn: 'LedID2'
//   },
//   'Rack-3': {
//     lastValueColumn: 'LastValue3',
//     ledStatusTable: 'StencilLEDStatus2',
//     rackStatusTable: 'stencilRackStatus2_copy',
//     stencilTableRackColumn: 'RackID3',
//     stencilTableLedColumn: 'LedID3'
//   },
//   'Rack-4': {
//     lastValueColumn: 'LastValue4',
//     ledStatusTable: 'StencilLEDStatus3',
//     rackStatusTable: 'stencilRackStatus3_copy',
//     stencilTableRackColumn: 'RackID4',
//     stencilTableLedColumn: 'LedID4'
//   }
// };

// // Email client configuration
// const client = new SMTPClient({
//   host: "mailrelay.int.nokia.com",
// });

// async function checkForUpdatesForRack(rackId) {
//   try {
//     const config = RACK_CONFIG[rackId];
//     if (!config) {
//       console.log(`No configuration found for ${rackId}`);
//       return;
//     }

//     let stencilOut = false;
//     let stencilIn = false;
//     const pool = await sql.connect(conConfig);

//     console.log(`Checking updates for ${rackId}`);

//     // Query to check the last value for specific rack
//     const result = await pool
//       .request()
//       .query(`SELECT ${config.lastValueColumn} FROM LastKnownValue`);
//     let lastKnownValue = result.recordset[0][config.lastValueColumn];

//     const result1 = await pool
//       .request()
//       .query(`SELECT data from [tblRackSensorInput] where rackid='${rackId}'`);
    
//     if (result1.recordset.length === 0) {
//       console.log(`No data found for ${rackId}`);
//       return;
//     }

//     let currentValue = result1.recordset[0].data;
//     console.log(`${rackId} - Current: ${currentValue}`);
//     console.log(`${rackId} - Last Known: ${lastKnownValue}`);
    
//     if (currentValue == lastKnownValue) {
//       console.log(`${rackId} - No change`);
//       return;
//     }

//     // If the value has changed, process the update
//     if (currentValue !== lastKnownValue) {
//       lastKnownValue = String(lastKnownValue);
//       currentValue = String(currentValue);

//       // Initialize an array to store the positions where values have changed
//       const changedPositions = [];

//       // Compare characters in both strings
//       for (let i = 0; i < Math.max(lastKnownValue.length, currentValue.length); i++) {
//         const lastChar = lastKnownValue[i] || '0';
//         const currentChar = currentValue[i] || '0';
        
//         if (lastChar !== currentChar) {
//           if (lastChar == "0" && currentChar == "1") {
//             stencilOut = true;
//             await pool
//               .request()
//               .query(
//                 `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 1 WHERE [PhysicalLocation] = 'B'`
//               );
//           }
//           if (lastChar == "1" && currentChar == "0") {
//             stencilIn = true;
//           }
//           changedPositions.push(i);
//         }
//       }

//       if (changedPositions.length === 0) {
//         console.log(`${rackId} - No position changes detected`);
//         return;
//       }

//       let changedposition = changedPositions[0] + 1;
//       console.log(`${rackId} - Changed position: ${changedposition}`);

//       // Get StencilID, BarcodeID, and Rackno before changing RackID
//       const stencilData = await pool
//         .request()
//         .query(
//           `SELECT StencilID, BarcodeID, Rackno FROM StencilTable WHERE ${config.stencilTableRackColumn} = '${changedposition}'`
//         );

//       let stencilID, barcodeID, rackno;
//       if (stencilData.recordset.length > 0) {
//         stencilID = stencilData.recordset[0].StencilID;
//         barcodeID = stencilData.recordset[0].BarcodeID;
//         rackno = stencilData.recordset[0].Rackno;
//       }

//       const getphysicalloc = await pool
//         .request()
//         .query(
//           `SELECT PhysicalLocation FROM [${config.rackStatusTable}] WHERE Rack_id = '${changedposition}'`
//         );

//       if (getphysicalloc.recordset.length === 0) {
//         console.log(`${rackId} - No physical location found for position ${changedposition}`);
//         return;
//       }

//       const physicalLoc = getphysicalloc.recordset[0].PhysicalLocation;

//       const lightup = await pool
//         .request()
//         .query(
//           `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 1 WHERE [PhysicalLocation] = '${physicalLoc}'`
//         );
//       console.log(`${rackId} - Lighted up at ${physicalLoc}`);

//       if (stencilOut) {
//         console.log(`${rackId} - Stencil Out at position ${changedposition}`);

//         // Insert into NonAuthorizedOut with StencilID, BarcodeID, and Rackno
//         const updateNonAuthorized = await pool.request().query(`
//           IF NOT EXISTS (
//               SELECT 1
//               FROM [NonAuthorizedOut]
//               WHERE CONVERT(VARCHAR(16), [TimeColumn], 120) = CONVERT(VARCHAR(16), GETDATE(), 120)
//                 AND [Physical Location] = '${physicalLoc}'
//           )
//           BEGIN
//               INSERT INTO [NonAuthorizedOut] ([TimeColumn], [Physical Location], [StencilID], [BarcodeID], [RackNo], [EmailSend])
//               VALUES (GETDATE(), '${physicalLoc}', '${stencilID}', '${barcodeID}', '${rackno}', 0)
//           END
//         `);
        
//         await new Promise((resolve) => setTimeout(resolve, 2000));

//         // Turn the LED off (status = 0)
//         await pool.request().query(`
//           UPDATE [${config.ledStatusTable}]
//           SET [LEDRackStatus] = 0
//           WHERE [PhysicalLocation] = 'B'
//         `);

//         const checkauthorized = await pool
//           .request()
//           .query(
//             `SELECT AuthorizedOut FROM StencilTable WHERE ${config.stencilTableRackColumn} = '${changedposition}'`
//           );
//         console.log(`${rackId} - Authorized:`, checkauthorized.recordset);

//         if (checkauthorized.recordset && checkauthorized.recordset.length > 0) {
//           const Authorized = checkauthorized.recordset[0].AuthorizedOut;
//           if (Authorized) {
//             const lightOFF = await pool
//               .request()
//               .query(
//                 `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 0 WHERE [PhysicalLocation] = '${physicalLoc}'`
//               );

//             const deleteNonAuthorized = await pool.request()
//               .query(`DELETE FROM [NonAuthorizedOut]
//                 WHERE ID = (SELECT MAX(ID) FROM [NonAuthorizedOut] WHERE [Physical Location] = '${physicalLoc}');`);
//           }
//         }

//         const removeStencilData = await pool
//           .request()
//           .query(
//             `UPDATE [StencilTable] SET Status=0, ${config.stencilTableRackColumn} = NULL, ${config.stencilTableLedColumn} = NULL, Authorized=NULL, AuthorizedOut=NULL WHERE ${config.stencilTableRackColumn}='${changedposition}'`
//           );

//         const lightOFF = await pool
//           .request()
//           .query(
//             `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 0 WHERE [PhysicalLocation] = '${physicalLoc}'`
//           );
//       }

//       if (stencilIn) {
//         const checkauthorized = await pool.request().query(
//           `SELECT CASE 
//             WHEN EXISTS (SELECT 1 FROM StencilTable WHERE ${config.stencilTableRackColumn} = '${changedposition}') 
//             THEN 1 
//             ELSE 0 
//           END AS id_exists;`
//         );
//         const AuthorizedIn = checkauthorized.recordset[0].id_exists;
//         if (AuthorizedIn) {
//           const lightOFF = await pool
//             .request()
//             .query(
//               `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 0 WHERE [PhysicalLocation] = '${physicalLoc}'`
//             );
//         }
//       }

//       // Update the last known value for this specific rack
//       const updatelast = await pool
//         .request()
//         .query(`UPDATE LastKnownValue SET ${config.lastValueColumn} = '${currentValue}'`);
      
//       console.log(`${rackId} - Updated last known value`);
//     }
//   } catch (error) {
//     console.error(`Error checking for updates for ${rackId}:`, error);
//   }
// }

// async function checkForUpdates() {
//   try {
//     // Check updates for all racks
//     const racks = ['Rack-1', 'Rack-2', 'Rack-3', 'Rack-4'];
    
//     // Process each rack sequentially to avoid database connection issues
//     for (const rackId of racks) {
//       await checkForUpdatesForRack(rackId);
//       // Small delay between rack checks to prevent overwhelming the database
//       await new Promise(resolve => setTimeout(resolve, 100));
//     }
//   } catch (error) {
//     console.error("Error in main checkForUpdates:", error);
//   }
// }

// // New function to handle email sending for NonAuthorizedOut records
// async function sendNonAuthorizedEmails() {
//   try {
//     const pool = await sql.connect(conConfig);
    
//     // Query records where EmailSend is 0 or NULL
//     const result = await pool.request().query(`
//       SELECT ID, TimeColumn, [Physical Location], StencilID, BarcodeID, RackNo
//       FROM [NonAuthorizedOut]
//       WHERE EmailSend IS NULL OR EmailSend = 0
//     `);

//     if (result.recordset.length === 0) {
//       console.log("No pending emails to send");
//       return;
//     }

//     // Process each record
//     for (const record of result.recordset) {
//       try {
//         const message = {
//           text: `NON-AUTHORIZED OUT\n\nStencil ID: ${record.StencilID}\nBarcode ID: ${record.BarcodeID}\nDate: ${new Date(record.TimeColumn).toLocaleDateString()}\nTime: ${new Date(record.TimeColumn).toLocaleTimeString()}\nPhysical Location: ${record['Physical Location']}\nRack No: ${record.RackNo}`,
//           from: "support.int@nokia.com",
//           to: "ashok.krishna_kumar.ext@nokia.com",
//           subject: "NON_AUTHORIZED OUT",
//         };

//         // Send the email
//         await client.sendAsync(message);
//         console.log(`Email sent successfully for record ID: ${record.ID}, Physical Location: ${record['Physical Location']}`);

//         // Update EmailSend to 1
//         await pool.request().query(`
//           UPDATE [NonAuthorizedOut]
//           SET EmailSend = 1
//           WHERE ID = ${record.ID}
//         `);
//         console.log(`Updated EmailSend status for record ID: ${record.ID}`);
//       } catch (emailError) {
//         console.error(`Failed to send email for record ID: ${record.ID}:`, emailError);
//       }
//     }
//   } catch (error) {
//     console.error("Error in sendNonAuthorizedEmails:", error);
//   }
// }

// // Schedule the checkForUpdates function to run every minute
// cron.schedule('* * * * *', checkForUpdates);

// // Schedule the email sending function to run every 2 minutes
// cron.schedule('*/2 * * * *', sendNonAuthorizedEmails);

// // uncomment before deploying...
// function startPolling() {
//   // Poll immediately on start
//   checkForUpdates();

//   // Poll every 20 seconds
//   setInterval(checkForUpdates, 5 * 1000); // 20 seconds in milliseconds
// }
// // Polling interval (every minute in this example)
// const job = cron.schedule("* * * * *", startPolling);
// function stopCronJob() {
//   job.stop();
//   console.log("Cron job stopped.");
// }

// // Example of stopping the cron job after 5 minutes
// setTimeout(() => {
//   stopCronJob();
// }, 10 * 60 * 1000);

//---------------------------------------------------------------------------------------------//
// import express from "express";
// import bodyParser from "body-parser";
// import cors from "cors";
// import path from "path";
// import http from "http";
// import { conConfig } from "./db.js";
// import cron from "node-cron";
// import sql from "mssql";
// import router from "./routes.js";
// import { SMTPClient } from "emailjs";

// import { swaggerDocs } from "./swaggerDocs.js";

// const app = express();
// const server = http.createServer(app);

// app.use(cors());
// app.use("/uploads", express.static("uploads"));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use("/Stencil_Management_API/", router);

// swaggerDocs(app);
// const PORT = process.env.PORT || 4000;
// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
  
//   console.log(`Swagger documentation available at: http://localhost:${PORT}/Stencil_Management/docs`);
// });

// // Configuration for different racks
// const RACK_CONFIG = {
//   'Rack-1': {
//     lastValueColumn: 'LastValue',
//     ledStatusTable: 'StencilLEDStatus',
//     rackStatusTable: 'stencilRackStatus',
//     stencilTableRackColumn: 'RackID',
//     stencilTableLedColumn: 'LedID'
//   },
//   'Rack-2': {
//     lastValueColumn: 'LastValue2',
//     ledStatusTable: 'StencilLEDStatus1',
//     rackStatusTable: 'stencilRackStatus1_copy',
//     stencilTableRackColumn: 'RackID2',
//     stencilTableLedColumn: 'LedID2'
//   },
//   'Rack-3': {
//     lastValueColumn: 'LastValue3',
//     ledStatusTable: 'StencilLEDStatus2',
//     rackStatusTable: 'stencilRackStatus2_copy',
//     stencilTableRackColumn: 'RackID3',
//     stencilTableLedColumn: 'LedID3'
//   },
//   'Rack-4': {
//     lastValueColumn: 'LastValue4',
//     ledStatusTable: 'StencilLEDStatus3',
//     rackStatusTable: 'stencilRackStatus3_copy',
//     stencilTableRackColumn: 'RackID4',
//     stencilTableLedColumn: 'LedID4'
//   }
// };

// // Email client configuration
// const client = new SMTPClient({
//   host: "mailrelay.int.nokia.com",
// });

// // NEW METHOD: Add record to NonAuthorizedOut_Alter table
// async function addToNonAuthorizedOutAlter(rackId) {
//   try {
//     const config = RACK_CONFIG[rackId];
//     if (!config) {
//       console.log(`No configuration found for ${rackId}`);
//       return;
//     }

//     const pool = await sql.connect(conConfig);
//     console.log(`Checking for NonAuthorizedOut_Alter updates for ${rackId}`);

//     // Query to check the last value for specific rack
//     const result = await pool
//       .request()
//       .query(`SELECT ${config.lastValueColumn} FROM LastKnownValue`);
//     let lastKnownValue = result.recordset[0][config.lastValueColumn];

//     const result1 = await pool
//       .request()
//       .query(`SELECT data from [tblRackSensorInput] where rackid='${rackId}'`);
    
//     if (result1.recordset.length === 0) {
//       console.log(`No data found for ${rackId}`);
//       return;
//     }

//     let currentValue = result1.recordset[0].data;
//     console.log(`${rackId} - Current: ${currentValue}`);
//     console.log(`${rackId} - Last Known: ${lastKnownValue}`);
    
//     if (currentValue == lastKnownValue) {
//       console.log(`${rackId} - No change for NonAuthorizedOut_Alter`);
//       return;
//     }

//     // If the value has changed, process the update
//     if (currentValue !== lastKnownValue) {
//       lastKnownValue = String(lastKnownValue);
//       currentValue = String(currentValue);

//       // Initialize an array to store the positions where values have changed
//       const changedPositions = [];

//       // Compare characters in both strings
//       for (let i = 0; i < Math.max(lastKnownValue.length, currentValue.length); i++) {
//         const lastChar = lastKnownValue[i] || '0';
//         const currentChar = currentValue[i] || '0';
        
//         if (lastChar !== currentChar) {
//           if (lastChar == "0" && currentChar == "1") {
//             // Stencil Out detected
//             changedPositions.push(i);
//           }
//         }
//       }

//       if (changedPositions.length === 0) {
//         console.log(`${rackId} - No stencil out changes detected for NonAuthorizedOut_Alter`);
//         return;
//       }

//       // Process each changed position
//       for (const position of changedPositions) {
//         let changedposition = position + 1;
//         console.log(`${rackId} - Processing position ${changedposition} for NonAuthorizedOut_Alter`);

//         // Get physical location from rack status table
//         const getphysicalloc = await pool
//           .request()
//           .query(
//             `SELECT PhysicalLocation FROM [${config.rackStatusTable}] WHERE Rack_id = '${changedposition}'`
//           );

//         if (getphysicalloc.recordset.length === 0) {
//           console.log(`${rackId} - No physical location found for position ${changedposition}`);
//           continue;
//         }

//         const physicalLoc = getphysicalloc.recordset[0].PhysicalLocation;

//         // Insert into NonAuthorizedOut_Alter with null StencilID and BarcodeID
//         const insertAlterRecord = await pool.request().query(`
//           IF NOT EXISTS (
//               SELECT 1
//               FROM [NonAuthorizedOut_Alter]
//               WHERE CONVERT(VARCHAR(16), [TimeColumn], 120) = CONVERT(VARCHAR(16), GETDATE(), 120)
//                 AND [Physical Location] = '${physicalLoc}'
//           )
//           BEGIN
//               INSERT INTO [NonAuthorizedOut_Alter] ([TimeColumn], [Physical Location], [StencilID], [BarcodeID], [RackNo], [EmailSend])
//               VALUES (GETDATE(), '${physicalLoc}', NULL, NULL, '${rackId}', 0)
//           END
//         `);

//         console.log(`${rackId} - Added record to NonAuthorizedOut_Alter for position ${changedposition}, Physical Location: ${physicalLoc}`);
//       }
//     }
//   } catch (error) {
//     console.error(`Error in addToNonAuthorizedOutAlter for ${rackId}:`, error);
//   }
// }

// async function checkForUpdatesForRack(rackId) {
//   try {
//     const config = RACK_CONFIG[rackId];
//     if (!config) {
//       console.log(`No configuration found for ${rackId}`);
//       return;
//     }

//     let stencilOut = false;
//     let stencilIn = false;
//     const pool = await sql.connect(conConfig);

//     console.log(`Checking updates for ${rackId}`);

//     // Query to check the last value for specific rack
//     const result = await pool
//       .request()
//       .query(`SELECT ${config.lastValueColumn} FROM LastKnownValue`);
//     let lastKnownValue = result.recordset[0][config.lastValueColumn];

//     const result1 = await pool
//       .request()
//       .query(`SELECT data from [tblRackSensorInput] where rackid='${rackId}'`);
    
//     if (result1.recordset.length === 0) {
//       console.log(`No data found for ${rackId}`);
//       return;
//     }

//     let currentValue = result1.recordset[0].data;
//     console.log(`${rackId} - Current: ${currentValue}`);
//     console.log(`${rackId} - Last Known: ${lastKnownValue}`);
    
//     if (currentValue == lastKnownValue) {
//       console.log(`${rackId} - No change`);
//       return;
//     }

//     // If the value has changed, process the update
//     if (currentValue !== lastKnownValue) {
//       lastKnownValue = String(lastKnownValue);
//       currentValue = String(currentValue);

//       // Initialize an array to store the positions where values have changed
//       const changedPositions = [];

//       // Compare characters in both strings
//       for (let i = 0; i < Math.max(lastKnownValue.length, currentValue.length); i++) {
//         const lastChar = lastKnownValue[i] || '0';
//         const currentChar = currentValue[i] || '0';
        
//         if (lastChar !== currentChar) {
//           if (lastChar == "0" && currentChar == "1") {
//             stencilOut = true;
//             await pool
//               .request()
//               .query(
//                 `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 1 WHERE [PhysicalLocation] = 'B'`
//               );
//           }
//           if (lastChar == "1" && currentChar == "0") {
//             stencilIn = true;
//           }
//           changedPositions.push(i);
//         }
//       }

//       if (changedPositions.length === 0) {
//         console.log(`${rackId} - No position changes detected`);
//         return;
//       }

//       let changedposition = changedPositions[0] + 1;
//       console.log(`${rackId} - Changed position: ${changedposition}`);

//       // Get StencilID, BarcodeID, and Rackno before changing RackID
//       const stencilData = await pool
//         .request()
//         .query(
//           `SELECT StencilID, BarcodeID, Rackno FROM StencilTable WHERE ${config.stencilTableRackColumn} = '${changedposition}'`
//         );

//       let stencilID, barcodeID, rackno;
//       if (stencilData.recordset.length > 0) {
//         stencilID = stencilData.recordset[0].StencilID;
//         barcodeID = stencilData.recordset[0].BarcodeID;
//         rackno = stencilData.recordset[0].Rackno;
//       }

//       const getphysicalloc = await pool
//         .request()
//         .query(
//           `SELECT PhysicalLocation FROM [${config.rackStatusTable}] WHERE Rack_id = '${changedposition}'`
//         );

//       if (getphysicalloc.recordset.length === 0) {
//         console.log(`${rackId} - No physical location found for position ${changedposition}`);
//         return;
//       }

//       const physicalLoc = getphysicalloc.recordset[0].PhysicalLocation;

//       const lightup = await pool
//         .request()
//         .query(
//           `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 1 WHERE [PhysicalLocation] = '${physicalLoc}'`
//         );
//       console.log(`${rackId} - Lighted up at ${physicalLoc}`);

//       if (stencilOut) {
//         console.log(`${rackId} - Stencil Out at position ${changedposition}`);

//         // Insert into NonAuthorizedOut with StencilID, BarcodeID, and Rackno
//         const updateNonAuthorized = await pool.request().query(`
//           IF NOT EXISTS (
//               SELECT 1
//               FROM [NonAuthorizedOut]
//               WHERE CONVERT(VARCHAR(16), [TimeColumn], 120) = CONVERT(VARCHAR(16), GETDATE(), 120)
//                 AND [Physical Location] = '${physicalLoc}'
//           )
//           BEGIN
//               INSERT INTO [NonAuthorizedOut] ([TimeColumn], [Physical Location], [StencilID], [BarcodeID], [RackNo], [EmailSend])
//               VALUES (GETDATE(), '${physicalLoc}', '${stencilID}', '${barcodeID}', '${rackno}', 0)
//           END
//         `);
        
//         await new Promise((resolve) => setTimeout(resolve, 2000));

//         // Turn the LED off (status = 0)
//         await pool.request().query(`
//           UPDATE [${config.ledStatusTable}]
//           SET [LEDRackStatus] = 0
//           WHERE [PhysicalLocation] = 'B'
//         `);

//         const checkauthorized = await pool
//           .request()
//           .query(
//             `SELECT AuthorizedOut FROM StencilTable WHERE ${config.stencilTableRackColumn} = '${changedposition}'`
//           );
//         console.log(`${rackId} - Authorized:`, checkauthorized.recordset);

//         if (checkauthorized.recordset && checkauthorized.recordset.length > 0) {
//           const Authorized = checkauthorized.recordset[0].AuthorizedOut;
//           if (Authorized) {
//             const lightOFF = await pool
//               .request()
//               .query(
//                 `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 0 WHERE [PhysicalLocation] = '${physicalLoc}'`
//               );

//             const deleteNonAuthorized = await pool.request()
//               .query(`DELETE FROM [NonAuthorizedOut]
//                 WHERE ID = (SELECT MAX(ID) FROM [NonAuthorizedOut] WHERE [Physical Location] = '${physicalLoc}');`);
//           }
//         }

//         const removeStencilData = await pool
//           .request()
//           .query(
//             `UPDATE [StencilTable] SET Status=0, ${config.stencilTableRackColumn} = NULL, ${config.stencilTableLedColumn} = NULL, Authorized=NULL, AuthorizedOut=NULL WHERE ${config.stencilTableRackColumn}='${changedposition}'`
//           );

//         const lightOFF = await pool
//           .request()
//           .query(
//             `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 0 WHERE [PhysicalLocation] = '${physicalLoc}'`
//           );
//       }

//       if (stencilIn) {
//         const checkauthorized = await pool.request().query(
//           `SELECT CASE 
//             WHEN EXISTS (SELECT 1 FROM StencilTable WHERE ${config.stencilTableRackColumn} = '${changedposition}') 
//             THEN 1 
//             ELSE 0 
//           END AS id_exists;`
//         );
//         const AuthorizedIn = checkauthorized.recordset[0].id_exists;
//         if (AuthorizedIn) {
//           const lightOFF = await pool
//             .request()
//             .query(
//               `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 0 WHERE [PhysicalLocation] = '${physicalLoc}'`
//             );
//         }
//       }

//       // Update the last known value for this specific rack
//       const updatelast = await pool
//         .request()
//         .query(`UPDATE LastKnownValue SET ${config.lastValueColumn} = '${currentValue}'`);
      
//       console.log(`${rackId} - Updated last known value`);
//     }
//   } catch (error) {
//     console.error(`Error checking for updates for ${rackId}:`, error);
//   }
// }

// async function checkForUpdates() {
//   try {
//     // Check updates for all racks
//     const racks = ['Rack-1', 'Rack-2', 'Rack-3', 'Rack-4'];
    
//     // Process each rack sequentially to avoid database connection issues
//     for (const rackId of racks) {
//       await checkForUpdatesForRack(rackId);
//       // Small delay between rack checks to prevent overwhelming the database
//       await new Promise(resolve => setTimeout(resolve, 100));
//     }
//   } catch (error) {
//     console.error("Error in main checkForUpdates:", error);
//   }
// }

// // NEW FUNCTION: Check for updates and add to NonAuthorizedOut_Alter
// async function checkForUpdatesAlter() {
//   try {
//     // Check updates for all racks for NonAuthorizedOut_Alter
//     const racks = ['Rack-1', 'Rack-2', 'Rack-3', 'Rack-4'];
    
//     // Process each rack sequentially to avoid database connection issues
//     for (const rackId of racks) {
//       await addToNonAuthorizedOutAlter(rackId);
//       // Small delay between rack checks to prevent overwhelming the database
//       await new Promise(resolve => setTimeout(resolve, 100));
//     }
//   } catch (error) {
//     console.error("Error in checkForUpdatesAlter:", error);
//   }
// }
  
// // NEW FUNCTION: Check for NonAuthorized Stencil IN
// async function checkNonAuthorizedStencilIn() {
//   try {
//     const pool = await sql.connect(conConfig);
    
//     // Check all rack LED status tables
//     const ledTables = ['StencilLEDStatus', 'StencilLEDStatus1', 'StencilLEDStatus2', 'StencilLEDStatus3'];
//     const rackNames = ['Rack-1', 'Rack-2', 'Rack-3', 'Rack-4'];
    
//     for (let i = 0; i < ledTables.length; i++) {
//       const tableName = ledTables[i];
//       const rackName = rackNames[i];
      
//       // Query records where NAstencilIn is 0 or NULL and LEDRackStatus = '1' for more than 1 minute
//       const result = await pool.request().query(`
//         SELECT LEDRack_id, PhysicalLocation, LEDRackStatus, TimeColumn, NAstencilIn
//         FROM [${tableName}]
//         WHERE (NAstencilIn = 0 OR NAstencilIn IS NULL)
//           AND LEDRackStatus = '1'
          
//       `);
      
//       if (result.recordset.length > 0) {
//         console.log(`Found ${result.recordset.length} NonAuthorized Stencil IN records in ${tableName}`);
        
//         // Process each record
//         for (const record of result.recordset) {
//           try {
//             // Insert into NonAuthorizedStencilIn table
//             await pool.request().query(`
//               INSERT INTO [NonAuthorizedStencilIn] (
//                 [TimeColumn], 
//                 [PhysicalLocation], 
//                 [StencilID], 
//                 [BarcodeID], 
//                 [EmailSend], 
//                 [LEDRackStatus], 
//                 [RackNo]
//               )
//               VALUES (
//                 GETDATE(), 
//                 '${record.PhysicalLocation}', 
//                 NULL, 
//                 NULL, 
//                 0, 
//                 '${record.LEDRackStatus}', 
//                 '${rackName}'
//               )
//             `);
            
//             // Update NAstencilIn to 1 in the LED status table
//             await pool.request().query(`
//              UPDATE [${tableName}]
// SET NAstencilIn = 1
// WHERE LEDRack_id = ${record.LEDRack_id} AND NAstencilIn != 'NC'

//             `);
            
//             console.log(`Processed NonAuthorized Stencil IN for ${rackName} at location ${record.PhysicalLocation}`);
            
//           } catch (recordError) {
//             console.error(`Error processing record for ${rackName}:`, recordError);
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Error in checkNonAuthorizedStencilIn:", error);
//   }
// }

// // Helper function to subtract 5:30 from a given date
// function adjustTimeBy5Hours30Minutes(date) {
//   const adjustedDate = new Date(date);
//   adjustedDate.setHours(adjustedDate.getHours() - 5);
//   adjustedDate.setMinutes(adjustedDate.getMinutes() - 30);
//   return adjustedDate;
// }

// // Modified function to handle email sending for NonAuthorizedOut records
// async function sendNonAuthorizedEmails() {
//   try {
//     const pool = await sql.connect(conConfig);
    
//     // Get email configuration from MailIds table
//     const emailConfigResult = await pool.request().query(`
//       SELECT [To], [Bcc], [CC] FROM [StencilApplication].[dbo].[MailIds]
//     `);

//     if (emailConfigResult.recordset.length === 0) {
//       console.log("No email configuration found in MailIds table");
//       return;
//     }

//     const emailConfig = emailConfigResult.recordset[0];
    
//     // Query records where EmailSend is 0 or NULL
//     const result = await pool.request().query(`
//       SELECT ID, TimeColumn, [Physical Location], StencilID, BarcodeID, RackNo
//       FROM [NonAuthorizedOut]
//       WHERE EmailSend IS NULL OR EmailSend = 0
//     `);

//     if (result.recordset.length === 0) {
//       console.log("No pending emails to send");
//       return;
//     }

//     // Process each record
//     for (const record of result.recordset) {
//       try {
//         // Adjust the time by subtracting 5:30
//         const adjustedTime = adjustTimeBy5Hours30Minutes(record.TimeColumn);
        
//         // Build email message object
//         const message = {
//           text: `NON-AUTHORIZED OUT\n\nStencil ID: ${record.StencilID}\nBarcode ID: ${record.BarcodeID}\nDate: ${adjustedTime.toLocaleDateString()}\nTime: ${adjustedTime.toLocaleTimeString()}\nPhysical Location: ${record['Physical Location']}\nRack No: ${record.RackNo}`,
//           from: "support.int@nokia.com",
//           subject: "NON_AUTHORIZED OUT",
//         };

//         // Add TO field (required)
//         if (emailConfig.To) {
//           message.to = emailConfig.To;
//         } else {
//           console.error("No TO email addresses configured");
//           continue;
//         }

//         // Add CC field if exists and not null
//         if (emailConfig.CC && emailConfig.CC.trim() !== '') {
//           message.cc = emailConfig.CC;
//         }

//         // Add BCC field if exists and not null
//         if (emailConfig.Bcc && emailConfig.Bcc.trim() !== '') {
//           message.bcc = emailConfig.Bcc;
//         }

//         // Send the email
//         await client.sendAsync(message);
//         console.log(`Email sent successfully for record ID: ${record.ID}, Physical Location: ${record['Physical Location']}`);
//         console.log(`TO: ${message.to}${message.cc ? ', CC: ' + message.cc : ''}${message.bcc ? ', BCC: ' + message.bcc : ''}`);

//         // Update EmailSend to 1
//         await pool.request().query(`
//           UPDATE [NonAuthorizedOut]
//           SET EmailSend = 1
//           WHERE ID = ${record.ID}
//         `);
//         console.log(`Updated EmailSend status for record ID: ${record.ID}`);
//       } catch (emailError) {
//         console.error(`Failed to send email for record ID: ${record.ID}:`, emailError);
//       }
//     }
//   } catch (error) {
//     console.error("Error in sendNonAuthorizedEmails:", error);
//   }
// }

// // Modified function to send emails for NonAuthorized Stencil IN
// async function sendNonAuthorizedStencilInEmails() {
//   try {
//     const pool = await sql.connect(conConfig);
    
//     // Get email configuration from MailIds table
//     const emailConfigResult = await pool.request().query(`
//       SELECT [To], [Bcc], [CC] FROM [StencilApplication].[dbo].[MailIds]
//     `);

//     if (emailConfigResult.recordset.length === 0) {
//       console.log("No email configuration found in MailIds table");
//       return;
//     }

//     const emailConfig = emailConfigResult.recordset[0];
    
//     // Query records where EmailSend is 0 or NULL
//     const result = await pool.request().query(`
//       SELECT TimeColumn, PhysicalLocation, StencilID, BarcodeID, LEDRackStatus, RackNo
//       FROM [NonAuthorizedStencilIn]
//       WHERE EmailSend IS NULL OR EmailSend = 0
//     `);

//     if (result.recordset.length === 0) {
//       console.log("No pending NonAuthorized Stencil IN emails to send");
//       return;
//     }

//     // Process each record
//     for (const record of result.recordset) {
//       try {
//         // Adjust the time by subtracting 5:30
//         const adjustedTime = adjustTimeBy5Hours30Minutes(record.TimeColumn);
        
//         // Build email message object
//         const message = {
//           text: `NON-AUTHORIZED STENCIL IN\n\nStencil ID: ${record.StencilID || 'N/A'}\nBarcode ID: ${record.BarcodeID || 'N/A'}\nDate: ${adjustedTime.toLocaleDateString()}\nTime: ${adjustedTime.toLocaleTimeString()}\nPhysical Location: ${record.PhysicalLocation}\nRack No: ${record.RackNo}`,
//           from: "support.int@nokia.com",
//           subject: "NON_AUTHORIZED STENCIL IN",
//         };

//         // Add TO field (required)
//         if (emailConfig.To) {
//           message.to = emailConfig.To;
//         } else {
//           console.error("No TO email addresses configured");
//           continue;
//         }

//         // Add CC field if exists and not null
//         if (emailConfig.CC && emailConfig.CC.trim() !== '') {
//           message.cc = emailConfig.CC;
//         }

//         // Add BCC field if exists and not null
//         if (emailConfig.Bcc && emailConfig.Bcc.trim() !== '') {
//           message.bcc = emailConfig.Bcc;
//         }

//         // Send the email
//         await client.sendAsync(message);
//         console.log(`NonAuthorized Stencil IN email sent successfully for Physical Location: ${record.PhysicalLocation}, Rack: ${record.RackNo}`);
//         console.log(`TO: ${message.to}${message.cc ? ', CC: ' + message.cc : ''}${message.bcc ? ', BCC: ' + message.bcc : ''}`);

//         // Update EmailSend to 1
//         await pool.request().query(`
//           UPDATE [NonAuthorizedStencilIn]
//           SET EmailSend = 1
//           WHERE TimeColumn = '${record.TimeColumn.toISOString()}'
//             AND PhysicalLocation = '${record.PhysicalLocation}'
//             AND RackNo = '${record.RackNo}'
//         `);
//         console.log(`Updated EmailSend status for NonAuthorized Stencil IN record`);
//       } catch (emailError) {
//         console.error(`Failed to send NonAuthorized Stencil IN email for Physical Location: ${record.PhysicalLocation}:`, emailError);
//       }
//     }
//   } catch (error) {
//     console.error("Error in sendNonAuthorizedStencilInEmails:", error);
//   }
// }

// // Schedule the checkForUpdates function to run every minute
// cron.schedule('* * * * *', checkForUpdates);

// // Schedule the email sending function to run every 2 minutes
// cron.schedule('*/2 * * * *', sendNonAuthorizedEmails);

// // NEW CRON JOB: Schedule NonAuthorized Stencil IN check to run every minute
// cron.schedule('* * * * *', checkNonAuthorizedStencilIn);

// // NEW CRON JOB: Schedule NonAuthorized Stencil IN email sending to run every 2 minutes
// cron.schedule('*/2 * * * *', sendNonAuthorizedStencilInEmails);

// // NEW CRON JOB: Schedule NonAuthorizedOut_Alter check to run every minute
// cron.schedule('* * * * *', checkForUpdatesAlter);

// // uncomment before deploying...
// function startPolling() {
//   // Poll immediately on start
//   checkForUpdates();

//   // Poll every 20 seconds
//   setInterval(checkForUpdates, 5 * 1000); // 20 seconds in milliseconds
// }
// // Polling interval (every minute in this example)
// const job = cron.schedule("* * * * *", startPolling);
// function stopCronJob() {
//   job.stop();
//   console.log("Cron job stopped.");
// }

// // Example of stopping the cron job after 5 minutes
// setTimeout(() => {
//   stopCronJob();
// }, 10 * 60 * 1000);

//--------------------------------------------------------------------------------------------//
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import http from "http";
import { conConfig } from "./db.js";
import cron from "node-cron";
import sql from "mssql";
import router from "./routes.js";
import { SMTPClient } from "emailjs";
import { swaggerDocs } from "./swaggerDocs.js";
import { cleanupDuplicates } from "./cleanup.js";
//import { updateAvailableStencilRecord ,checkMissingRackLocations,updateLEDRackStatusNAIN} from "./nonAuthorizedLocationCheck.js";
import { resetExpiredLEDStatus,cleanNonAuthorizedRecords } from './resetLEDStatus.js'; 
import { sendNonAuthorizedEmails, sendNonAuthorizedStencilInEmails, updateEnabledToSendMail } from "./emailService.js";

//import { checkLedAndRackStatus } from "./checkLedAndRackStatus.js";
// Add this import at the top of your server.js file with other imports
import {  processAllLEDs ,processBLocationLEDs} from './resetBLocationLEDStatus.js';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use("/uploads", express.static("uploads"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/Stencil_Management_API/", router);

swaggerDocs(app);
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at: http://localhost:${PORT}/Stencil_Management/docs`);
});

// Configuration for different racks
const RACK_CONFIG = {
  'Rack-1': {
    lastValueColumn: 'LastValue',
    ledStatusTable: 'StencilLEDStatus',
    rackStatusTable: 'stencilRackStatus',
    stencilTableRackColumn: 'RackID',
    stencilTableLedColumn: 'LedID'
  },
  'Rack-2': {
    lastValueColumn: 'LastValue2',
    ledStatusTable: 'StencilLEDStatus1',
    rackStatusTable: 'stencilRackStatus1_copy',
    stencilTableRackColumn: 'RackID2',
    stencilTableLedColumn: 'LedID2'
  },
  'Rack-3': {
    lastValueColumn: 'LastValue3',
    ledStatusTable: 'StencilLEDStatus2',
    rackStatusTable: 'stencilRackStatus2_copy',
    stencilTableRackColumn: 'RackID3',
    stencilTableLedColumn: 'LedID3'
  },
  'Rack-4': {
    lastValueColumn: 'LastValue4',
    ledStatusTable: 'StencilLEDStatus3',
    rackStatusTable: 'stencilRackStatus3_copy',
    stencilTableRackColumn: 'RackID4',
    stencilTableLedColumn: 'LedID4'
  }
};

// Email client configuration
const client = new SMTPClient({
  host: "mailrelay.int.nokia.com",
});

// Helper function to get paired physical location for Rack-4
function getPairedPhysicalLocation(physicalLoc) {
  const locNum = parseInt(physicalLoc);
  if (isNaN(locNum) || locNum < 1 || locNum > 60) return null;
  return locNum % 2 === 1 ? (locNum + 1).toString() : (locNum - 1).toString();
}

async function checkForUpdatesForRack(rackId) {
  try {
    const config = RACK_CONFIG[rackId];
    if (!config) {
      console.log(`No configuration found for ${rackId}`);
      return;
    }

    let stencilOut = false;
    let stencilIn = false;
    const pool = await sql.connect(conConfig);

    console.log(`Checking updates for ${rackId}`);

    const result = await pool
      .request()
      .query(`SELECT ${config.lastValueColumn} FROM LastKnownValue`);
    let lastKnownValue = result.recordset[0][config.lastValueColumn];

    const result1 = await pool
      .request()
      .query(`SELECT data from [tblRackSensorInput] where rackid='${rackId}'`);
    
    if (result1.recordset.length === 0) {
      console.log(`No data found for ${rackId}`);
      return;
    }

    let currentValue = result1.recordset[0].data;
    console.log(`${rackId} - Current: ${currentValue}`);
    console.log(`${rackId} - Last Known: ${lastKnownValue}`);
    
    if (currentValue == lastKnownValue) {
      console.log(`${rackId} - No change`);
      return;
    }

    if (currentValue !== lastKnownValue) {
      lastKnownValue = String(lastKnownValue);
      currentValue = String(currentValue);

      const changedPositions = [];
      for (let i = 0; i < Math.max(lastKnownValue.length, currentValue.length); i++) {
        const lastChar = lastKnownValue[i] || '0';
        const currentChar = currentValue[i] || '0';
        
        if (lastChar !== currentChar) {
          if (lastChar == "0" && currentChar == "1") {
            stencilOut = true;
            await pool
              .request()
              .query(
                `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 1 WHERE [PhysicalLocation] = 'B'`
              );
          }
          if (lastChar == "1" && currentChar == "0") {
            stencilIn = true;
          }
          changedPositions.push(i);
        }
      }

      if (changedPositions.length === 0) {
        console.log(`${rackId} - No position changes detected`);
        return;
      }

      let changedposition = changedPositions[0] + 1;
      console.log(`${rackId} - Changed position: ${changedposition}`);

      const stencilData = await pool
        .request()
        .query(
          `SELECT StencilID, BarcodeID, Rackno FROM StencilTable WHERE ${config.stencilTableRackColumn} = '${changedposition}'`
        );

      let stencilID, barcodeID, rackno;
      if (stencilData.recordset.length > 0) {
        stencilID = stencilData.recordset[0].StencilID;
        barcodeID = stencilData.recordset[0].BarcodeID;
        rackno = stencilData.recordset[0].Rackno;
      }

      const getphysicalloc = await pool
        .request()
        .query(
          `SELECT PhysicalLocation FROM [${config.rackStatusTable}] WHERE Rack_id = '${changedposition}'`
        );

      if (getphysicalloc.recordset.length === 0) {
        console.log(`${rackId} - No physical location found for position ${changedposition}`);
        return;
      }

      const physicalLoc = getphysicalloc.recordset[0].PhysicalLocation;

      const lightup = await pool
        .request()
        .query(
          `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 1 WHERE [PhysicalLocation] = '${physicalLoc}'`
        );
      console.log(`${rackId} - Lighted up at ${physicalLoc}`);

      let pairedPhysicalLoc = null;
      if (rackId === 'Rack-4') {
        pairedPhysicalLoc = getPairedPhysicalLocation(physicalLoc);
      }

      if (stencilOut) {
        console.log(`${rackId} - Stencil Out at position ${changedposition}`);

        // Insert into NonAuthorizedOut with StencilID, BarcodeID, Rackno, and PairedPhysicalLocation
        const updateNonAuthorized = await pool.request().query(`
          IF NOT EXISTS (
              SELECT 1
              FROM [NonAuthorizedOut]
              WHERE CONVERT(VARCHAR(16), [TimeColumn], 120) = CONVERT(VARCHAR(16), GETDATE(), 120)
                AND [Physical Location] = '${physicalLoc}'
          )
          BEGIN
              INSERT INTO [NonAuthorizedOut] ([TimeColumn], [Physical Location], [StencilID], [BarcodeID], [RackNo], [EmailSend], [PairedPhysicalLocation])
              VALUES (GETDATE(), '${physicalLoc}', '${stencilID}', '${barcodeID}', '${rackId}', 0, ${pairedPhysicalLoc ? `'${pairedPhysicalLoc}'` : 'NULL'})
          END
        `);

        // For Rack-4: Insert paired location into NonAuthorizedOut
        if (rackId === 'Rack-4' && pairedPhysicalLoc) {
          const pairedStencilData = await pool
            .request()
            .query(
              `SELECT StencilID, BarcodeID, Rackno FROM StencilTable WHERE ${config.stencilTableRackColumn} = '${pairedPhysicalLoc}'`
            );
          let pairedStencilID = pairedStencilData.recordset.length > 0 ? pairedStencilData.recordset[0].StencilID : null;
          let pairedBarcodeID = pairedStencilData.recordset.length > 0 ? pairedStencilData.recordset[0].BarcodeID : null;

          await pool.request().query(`
            IF NOT EXISTS (
                SELECT 1
                FROM [NonAuthorizedOut]
                WHERE CONVERT(VARCHAR(16), [TimeColumn], 120) = CONVERT(VARCHAR(16), GETDATE(), 120)
                  AND [Physical Location] = '${pairedPhysicalLoc}'
            )
            BEGIN
                INSERT INTO [NonAuthorizedOut] ([TimeColumn], [Physical Location], [StencilID], [BarcodeID], [RackNo], [EmailSend], [PairedPhysicalLocation])
                VALUES (GETDATE(), '${pairedPhysicalLoc}', ${pairedStencilID ? `'${pairedStencilID}'` : 'NULL'}, ${pairedBarcodeID ? `'${pairedBarcodeID}'` : 'NULL'}, '${rackId}', 0, '${physicalLoc}')
            END
          `);
          console.log(`${rackId} - Inserted NonAuthorizedOut for paired location ${pairedPhysicalLoc}`);
        }

        if (!barcodeID || barcodeID === null || barcodeID === undefined) {
          console.log(`${rackId} - BarcodeID is null/undefined, updating NAstencilIn to 0 for physical location: ${physicalLoc}`);
          
          const updateNAstencilIn = await pool.request().query(`
            UPDATE [${config.ledStatusTable}] 
            SET [NAstencilIn] = 0 
            WHERE [PhysicalLocation] = '${physicalLoc}' 
              AND [NAstencilIn] = 1
          `);
          
          if (updateNAstencilIn.rowsAffected > 0) {
            console.log(`${rackId} - Successfully updated NAstencilIn to 0 for physical location: ${physicalLoc}`);
          } else {
            console.log(`${rackId} - No update needed for NAstencilIn at physical location: ${physicalLoc} (was not 1)`);
          }

          // For Rack-4: Update NAstencilIn for paired location
          if (rackId === 'Rack-4' && pairedPhysicalLoc) {
            const updatePairedNAstencilIn = await pool.request().query(`
              UPDATE [${config.ledStatusTable}] 
              SET [NAstencilIn] = 0 
              WHERE [PhysicalLocation] = '${pairedPhysicalLoc}' 
                AND [NAstencilIn] = 1
            `);
            if (updatePairedNAstencilIn.rowsAffected > 0) {
              console.log(`${rackId} - Successfully updated NAstencilIn to 0 for paired location: ${pairedPhysicalLoc}`);
            } else {
              console.log(`${rackId} - No update needed for NAstencilIn at paired location: ${pairedPhysicalLoc} (was not 1)`);
            }
          }
        }
        
        await new Promise((resolve) => setTimeout(resolve, 2000));

        await pool.request().query(`
          UPDATE [${config.ledStatusTable}]
          SET [LEDRackStatus] = 0
          WHERE [PhysicalLocation] = 'B'
        `);

        const checkauthorized = await pool
          .request()
          .query(
            `SELECT AuthorizedOut FROM StencilTable WHERE ${config.stencilTableRackColumn} = '${changedposition}'`
          );
        console.log(`${rackId} - Authorized:`, checkauthorized.recordset);

        if (checkauthorized.recordset && checkauthorized.recordset.length > 0) {
          const Authorized = checkauthorized.recordset[0].AuthorizedOut;
          if (Authorized) {
            const lightOFF = await pool
              .request()
              .query(
                `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 0 WHERE [PhysicalLocation] = '${physicalLoc}'`
              );

            const deleteNonAuthorized = await pool.request()
              .query(`DELETE FROM [NonAuthorizedOut]
                WHERE ID = (SELECT MAX(ID) FROM [NonAuthorizedOut] WHERE [Physical Location] = '${physicalLoc}');`);

            // For Rack-4: Delete paired NonAuthorizedOut
            if (rackId === 'Rack-4' && pairedPhysicalLoc) {
              await pool.request()
                .query(`DELETE FROM [NonAuthorizedOut]
                  WHERE ID = (SELECT MAX(ID) FROM [NonAuthorizedOut] WHERE [Physical Location] = '${pairedPhysicalLoc}');`);
              console.log(`${rackId} - Deleted NonAuthorizedOut for paired location ${pairedPhysicalLoc}`);
            }
          }
        }

        const removeStencilData = await pool
          .request()
          .query(
            `UPDATE [StencilTable] SET Status=0, ${config.stencilTableRackColumn} = NULL, ${config.stencilTableLedColumn} = NULL, Authorized=NULL, AuthorizedOut=NULL WHERE ${config.stencilTableRackColumn}='${changedposition}'`
          );

        const lightOFF = await pool
          .request()
          .query(
            `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 0 WHERE [PhysicalLocation] = '${physicalLoc}'`
          );

        // For Rack-4: Turn off LED for paired location
        if (rackId === 'Rack-4' && pairedPhysicalLoc) {
          await pool
            .request()
            .query(
              `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 0 WHERE [PhysicalLocation] = '${pairedPhysicalLoc}'`
            );
          console.log(`${rackId} - Turned off LED for paired location ${pairedPhysicalLoc}`);
        }
      }

      if (stencilIn) {
        const checkauthorized = await pool.request().query(
          `SELECT CASE 
            WHEN EXISTS (SELECT 1 FROM StencilTable WHERE ${config.stencilTableRackColumn} = '${changedposition}') 
            THEN 1 
            ELSE 0 
          END AS id_exists;`
        );
        const AuthorizedIn = checkauthorized.recordset[0].id_exists;
        if (AuthorizedIn) {
          const lightOFF = await pool
            .request()
            .query(
              `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 0 WHERE [PhysicalLocation] = '${physicalLoc}'`
            );
          // For Rack-4: Turn off LED for paired location
          if (rackId === 'Rack-4' && pairedPhysicalLoc) {
            await pool
              .request()
              .query(
                `UPDATE [${config.ledStatusTable}] SET [LEDRackStatus] = 0 WHERE [PhysicalLocation] = '${pairedPhysicalLoc}'`
              );
            console.log(`${rackId} - Turned off LED for paired location ${pairedPhysicalLoc} due to stencilIn`);
          }
        }
      }

      const updatelast = await pool
        .request()
        .query(`UPDATE LastKnownValue SET ${config.lastValueColumn} = '${currentValue}'`);
      
      console.log(`${rackId} - Updated last known value`);
    }
  } catch (error) {
    console.error(`Error checking for updates for ${rackId}:`, error);
  }
}

async function checkForUpdates() {
  try {
    const racks = ['Rack-1', 'Rack-2', 'Rack-3', 'Rack-4'];
    for (const rackId of racks) {
      await checkForUpdatesForRack(rackId);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error("Error in main checkForUpdates:", error);
  }
}

// async function checkNonAuthorizedStencilIn() {
//   try {
//     const pool = await sql.connect(conConfig);
//     const ledTables = ['StencilLEDStatus', 'StencilLEDStatus1', 'StencilLEDStatus2', 'StencilLEDStatus3'];
//     const rackNames = ['Rack-1', 'Rack-2', 'Rack-3', 'Rack-4'];

//     for (let i = 0; i < ledTables.length; i++) {
//       const tableName = ledTables[i];
//       const rackName = rackNames[i];

//       const result = await pool.request().query(`
//         SELECT LEDRack_id, PhysicalLocation, LEDRackStatus, TimeColumn, NAstencilIn
//         FROM [${tableName}]
//         WHERE (NAstencilIn = 0 OR NAstencilIn IS NULL)
//           AND LEDRackStatus = '1'
//           AND PhysicalLocation NOT IN ('G', 'Y', 'R', 'B')
//       `);

//       if (result.recordset.length > 0) {
//         console.log(`Found ${result.recordset.length} NonAuthorized Stencil IN records in ${tableName}`);

//         for (const record of result.recordset) {
//           try {
//             let pairedPhysicalLoc = null;
//             if (rackName === 'Rack-4') {
//               pairedPhysicalLoc = getPairedPhysicalLocation(record.PhysicalLocation);
//             }

//             // Insert into NonAuthorizedStencilIn
//             await pool.request().query(`
//               INSERT INTO [NonAuthorizedStencilIn] (
//                 [TimeColumn],
//                 [PhysicalLocation],
//                 [StencilID],
//                 [BarcodeID],
//                 [EmailSend],
//                 [LEDRackStatus],
//                 [RackNo],
//                 [PairedPhysicalLocation]
//               )
//               VALUES (
//                 GETDATE(),
//                 '${record.PhysicalLocation}',
//                 NULL,
//                 NULL,
//                 0,
//                 '${record.LEDRackStatus}',
//                 '${rackName}',
//                 ${pairedPhysicalLoc ? `'${pairedPhysicalLoc}'` : 'NULL'}
//               )
//             `);

//             // For Rack-4: Insert paired location into NonAuthorizedStencilIn
//             if (rackName === 'Rack-4' && pairedPhysicalLoc) {
//               const pairedRecord = await pool.request().query(`
//                 SELECT LEDRack_id, LEDRackStatus, NAstencilIn
//                 FROM [${tableName}]
//                 WHERE PhysicalLocation = '${pairedPhysicalLoc}'
//               `);

//               if (pairedRecord.recordset.length > 0 && (pairedRecord.recordset[0].NAstencilIn === 0 || pairedRecord.recordset[0].NAstencilIn === null)) {
//                 await pool.request().query(`
//                   INSERT INTO [NonAuthorizedStencilIn] (
//                     [TimeColumn],
//                     [PhysicalLocation],
//                     [StencilID],
//                     [BarcodeID],
//                     [EmailSend],
//                     [LEDRackStatus],
//                     [RackNo],
//                     [PairedPhysicalLocation]
//                   )
//                   VALUES (
//                     GETDATE(),
//                     '${pairedPhysicalLoc}',
//                     NULL,
//                     NULL,
//                     0,
//                     '${pairedRecord.recordset[0].LEDRackStatus}',
//                     '${rackName}',
//                     '${record.PhysicalLocation}'
//                   )
//                 `);
//                 await pool.request().query(`
//                   UPDATE [${tableName}]
//                   SET NAstencilIn = 1
//                   WHERE LEDRack_id = ${pairedRecord.recordset[0].LEDRack_id}
//                 `);
//                 console.log(`Processed NonAuthorized Stencil IN for ${rackName} at paired location ${pairedPhysicalLoc}`);
//               }
//             }

//             await pool.request().query(`
//               UPDATE [${tableName}]
//               SET NAstencilIn = 1
//               WHERE LEDRack_id = ${record.LEDRack_id}
//             `);

//             console.log(`Processed NonAuthorized Stencil IN for ${rackName} at location ${record.PhysicalLocation}`);
//           } catch (recordError) {
//             console.error(`Error processing record for ${rackName}:`, recordError);
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error("Error in checkNonAuthorizedStencilIn:", error);
//   }
// }



// Schedule the checkForUpdates function to  runs every 10 seconds

cron.schedule('*/10 * * * * *', checkForUpdates);




// Schedule NonAuthorized Stencil IN check to run every minute
//cron.schedule('* * * * *', checkNonAuthorizedStencilIn);


// Schedule cleanup of duplicates to run every  minutes
cron.schedule('* * * * *', cleanupDuplicates);

// NEW: Schedule LED status reset to run every 5 minute
cron.schedule('*/5 * * * *', resetExpiredLEDStatus);

// // NEW: Schedule LED status reset to run every 5 minute
cron.schedule('*/5 * * * *', cleanNonAuthorizedRecords);



// Schedule NonAuthorized Stencil IN email sending to run every 2 minutes
cron.schedule('*/2 * * * *', sendNonAuthorizedStencilInEmails);

// Schedule the email sending function to run every 2 minutes
cron.schedule('*/2 * * * *', sendNonAuthorizedEmails);

cron.schedule('*/2 * * * *', updateEnabledToSendMail);
// Schedule checkLedAndRackStatus to run every minute
//cron.schedule('* * * * *', checkLedAndRackStatus);

// Schedule processBLocationLEDs to run every minute
cron.schedule('* * * * *', processBLocationLEDs);


// Schedule B Location LED monitoring and reset to run every 2 minutes
cron.schedule('*/2 * * * *', processAllLEDs);

// //Schedule updateAvailableStencilRecord check to run every 3 minutes
// cron.schedule('*/2 * * * *', updateAvailableStencilRecord);

// //Schedule updateAvailableStencilRecord check to run every 4 minutes
// cron.schedule('*/4 * * * *', checkMissingRackLocations);
// //Schedule updateAvailableStencilRecord check to run every 6 minutes
// cron.schedule('*/6 * * * *', updateLEDRackStatusNAIN);

async function runCleanup() {
  await cleanupDuplicates();
}

// async function runLEDStatusReset() {
//   await resetExpiredLEDStatus();
// }


// Start polling and cleanup
function startPolling() {
  // Poll immediately on start
  checkForUpdates();
  // Run cleanup immediately on start
  runCleanup();
 // Run AvailableStencilRecord update immediately on start
//   updateAvailableStencilRecord  ();


// checkMissingRackLocations(); 
// updateLEDRackStatusNAIN();

  //for light off where absent
   // checkLedAndRackStatus();
  
      //runLEDStatusReset();
  

  setInterval(checkForUpdates, 20 * 1000);
  // Cleanup will be handled by cron schedule
}

// Polling interval (every minute in this example)
const job = cron.schedule("* * * * *", startPolling);

function stopCronJob() {
  job.stop();
  console.log("Cron job stopped.");
}

// Example of stopping the cron job after 10 minutes
setTimeout(() => {
  stopCronJob();
}, 10 * 60 * 1000);



