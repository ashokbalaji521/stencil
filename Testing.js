import sql from "mssql";

const dbConfig = {
  user: "sa",
  password: "Iotserver@1",
  server: "10.131.213.169",
  database: "StencilApplication",
  options: {
    encrypt: true, // Use encryption for the connection if required
    trustServerCertificate: true, // Set to true if using self-signed certificates
  },
};

// Create a connection pool
const poolPromise = sql.connect(dbConfig);

// Function to get data from the tblRackSensorInput table
export const updateStatus = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(
        "SELECT TOP (1000) [rackid], [data] FROM [StencilApplication].[dbo].[tblRackSensorInput]"
      );

    // Process each record
    const processedData = result.recordset.map((record) => {  
      // Convert the data string into an array of characters
      let dataArray = record.data.split("");

      // Create a new array with the same length, filled with '0'
      let newArray = new Array(dataArray.length).fill("0");

      // Define mappings for each rack
      let shifts;
      
      // Select the mapping based on the rack ID
      if (record.rackid === "Rack-1") {
        shifts = {
          1: 0,
          2: 32,
          3: 60,
          4: 59,
          5: 58,
          6: 57,
          7: 56,
          8: 55,
          9: 25,
          10: 26,
          11: 27,
          12: 28,
          13: 29,
          14: 30,
          15: 0,
          16: 0,
          17: 54,
          18: 53,
          19: 52,
          20: 51,
          21: 50,
          22: 49,
          23: 48,
          24: 47,
          25: 17,
          26: 18,
          27: 19,
          28: 20,
          29: 21,
          30: 22,
          31: 23,
          32: 24,
          33: 46,
          34: 45,
          35: 44,
          36: 43,
          37: 42,
          38: 41,
          39: 40,
          40: 39,
          41: 9,
          42: 10,
          43: 11,
          44: 12,
          45: 13,
          46: 14,
          47: 15,
          48: 16,
          49: 38,
          50: 37,
          51: 36,
          52: 35,
          53: 34,
          54: 33,
          55: 0,
          56: 31,
          57: 1,
          58: 2,
          59: 3,
          60: 4,
          61: 5,
          62: 6,
          63: 7,
          64: 8,
        };
      } else if (record.rackid === "Rack-2") {
        
        shifts = {
          1: 38,
          2: 0,
          3: 60,
          4: 59,
          5: 58,
          6: 57,
          7: 56,
          8: 55,
          9: 54,
         10: 53,
         11: 52,
         12: 51,
         13: 50,
         14: 49,
         15: 48,
         16: 47,
         17: 46,
         18: 45,
         19: 44,
         20: 43,
         21: 42,
         22: 41,
         23: 40,
         24: 39,
         25: 0,
         26: 37,
         27: 36,
         28: 35,
         29: 34,
         30: 33,
         31: 32,
         32: 31,
                  33: 0,
                  34: 0,
                  35: 30,
                  36: 29,
                  37: 28,
                  38: 27,
                  39: 26,
                  40: 25,
                  41: 24,
                  42: 23,
                  43: 22,
                  44: 21,
                  45: 20,
                  46: 19,
                  47: 18,
                  48: 17,
                  49: 16,
                  50: 15,
                  51: 14,
                  52: 13,
                  53: 12,
                  54: 11,
                  55: 10,
                  56: 9,
                  57: 8,
                  58: 7,
                  59: 6,
                  60: 5,
                  61: 4,
                  62: 3,
                  63: 2,
                  64: 1
        };
      } else if (record.rackid === "Rack-3") {
        shifts = {
          1: 0,
  2: 0,
  3: 60,
  4: 59,
  5: 58,
  6: 57,
  7: 56,
  8: 55,
  9: 54,
 10: 53,
 11: 52,
 12: 51,
 13: 50,
 14: 49,
 15: 48,
 16: 47,
 17: 46,
 18: 45,
 19: 44,
 20: 43,
 21: 42,
 22: 41,
 23: 40,
 24: 39,
 25: 38,
 26: 37,
 27: 36,
 28: 35,
 29: 34,
 30: 33,
 31: 32,
 32: 31,
          33: 0,
          34: 0,
          35: 30,
          36: 29,
          37: 28,
          38: 27,
          39: 26,
          40: 25,
          41: 24,
          42: 23,
          43: 22,
          44: 21,
          45: 20,
          46: 19,
          47: 18,
          48: 17,
          49: 16,
          50: 15,
          51: 14,
          52: 13,
          53: 12,
          54: 11,
          55: 10,
          56: 9,
          57: 8,
          58: 7,
          59: 6,
          60: 5,
          61: 4,
          62: 3,
          63: 2,
          64: 1
        };
      } else if (record.rackid === "Rack-4") {
        shifts = {
          1: 0,
          2: 0,
          3: 60,
          4: 59,
          5: 58,
          6: 57,
          7: 56,
          8: 55,
          9: 54,
         10: 53,
         11: 52,
         12: 51,
         13: 50,
         14: 49,
         15: 48,
         16: 47,
         17: 46,
         18: 45,
         19: 44,
         20: 43,
         21: 42,
         22: 41,
         23: 40,
         24: 39,
         25: 38,
         26: 37,
         27: 36,
         28: 35,
         29: 34,
         30: 33,
         31: 32,
         32: 31,
                  33: 0,
                  34: 0,
                  35: 30,
                  36: 29,
                  37: 28,
                  38: 27,
                  39: 26,
                  40: 25,
                  41: 24,
                  42: 23,
                  43: 22,
                  44: 21,
                  45: 20,
                  46: 19,
                  47: 18,
                  48: 17,
                  49: 16,
                  50: 15,
                  51: 14,
                  52: 13,
                  53: 12,
                  54: 11,
                  55: 10,
                  56: 9,
                  57: 8,
                  58: 7,
                  59: 6,
                  60: 5,
                  61: 4,
                  62: 3,
                  63: 2,
                  64: 1
        };
      }

      // Place characters in their new positions
      Object.entries(shifts).forEach(([sourceIndex, targetIndex]) => {
        sourceIndex = parseInt(sourceIndex) - 1; // Convert 1-based index to 0-based
        targetIndex = parseInt(targetIndex) - 1; // Convert 1-based index to 0-based

        if (dataArray.length > sourceIndex && targetIndex >= 0) {
          newArray[targetIndex] = dataArray[sourceIndex];
        }
      });

      // Join the array back into a string
      const newDataString = newArray.join("");

      // Return the record with the modified data
      return {
        ...record,
        data: newDataString,
      };
    });

    // Send the processed data in the response
    res.json(processedData);
  } catch (error) {
    console.error("SQL error", error);
    res.status(500).send("Internal Server Error");
  }
};

// export const getStatus = async (req, res) => {
//     try {
//         const pool = await poolPromise;
//         const result = await pool.request()
//             .query('SELECT TOP (1000) [rackid], [data] FROM [StencilApplication].[dbo].[tblRackLedOutput]');

//         // Process each record
//         const processedData = result.recordset.map(record => {
//             // Convert the data string into an array of characters
//             let dataArray = record.data.split('');

//             // Create a new array with the same length, filled with '0'
//             let newArray = new Array(dataArray.length).fill('0');

//             // Mapping for repositioning characters
//             const shifts = {
//                 1:1,
//                 2:2,
//                 3:3,
//                 4:4,
//                 64: 5,
//                 63: 6,
//                 62: 7,
//                 61: 8,
//                 60: 9,
//                 59: 10,
//                 58:11,
//                 57:12,z
//                 56:13,
//                 55:14,
//                 54:15,
//                 53:16,
//                 52:17,
//                 51:18,
//                 50:19,
//                 49:20,
//                 48:21,
//                 47:22,
//                 46:23,
//                 45:24,
//                 44:25,
//                 43:26,
//                 42:27,
//                 41:28,
//                 40:29,
//                 39:30,
//                 38:31,
//                 37:32,
//                 36:33,
//                 35:34,
//                 34:35,
//                 33:36,
//                 32:37,
//                 31:38,
//                 30:39,
//                 29:40,
//                 28:41,
//                 27:42,
//                 26:43,
//                 25:44,
//                 24:45,
//                 23:46,
//                 22:47,
//                 21:48,
//                 20:49,
//                 19:50,
//                 18:51,
//                 17:52,
//                 16:53,
//                 15:54,
//                 14:55,
//                 13:56,
//                 12:57,
//                 11:58,
//                 10:59,
//                 9:60,
//                 8:61,
//                 7:62,
//                 6:63,
//                 5:64

//             };

//             // Place characters in their new positions
//             Object.entries(shifts).forEach(([sourceIndex, targetIndex]) => {
//                 sourceIndex = parseInt(sourceIndex) - 1; // Convert 1-based index to 0-based
//                 targetIndex = parseInt(targetIndex) - 1; // Convert 1-based index to 0-based

//                 if (dataArray.length > sourceIndex) {
//                     newArray[targetIndex] = dataArray[sourceIndex];
//                 }
//             });

//             // Join the array back into a string
//             const newDataString = newArray.join('');

//             // Return the record with the modified data
//             return {
//                 ...record,
//                 data: newDataString
//             };
//         });

//         // Send the processed data in the response
//         res.json(processedData);
//     } catch (error) {
//         console.error('SQL error', error);
//         res.status(500).send('Internal Server Error');
//     }
// };

// export const getStatus = async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const result = await pool
//       .request()
//       .query(
//         "SELECT TOP (1000) [LEDRack_id], [LEDRackStatus], [PhysicalLocation] FROM [StencilApplication].[dbo].[StencilLEDStatus]"
//       );

//     // Process each record
//     const processedData = result.recordset.map((record) => {
//       // Convert the LEDRackStatus string into an array of characters
//       let dataArray = record.LEDRackStatus.split("");

//       // Create a new array with the same length, filled with '0'
//       let newArray = new Array(dataArray.length).fill("0");
//       // Mapping for repositioning characters
//       const shifts = {
//         1: 1,
//         2: 2,
//         3: 3,
//         4: 4,
//         64: 5,
//         63: 6,
//         62: 7,
//         61: 8,
//         60: 9,
//         59: 10,
//         58: 11,
//         57: 12,
//         56: 13,
//         55: 14,
//         54: 15,
//         53: 16,
//         52: 17,
//         51: 18,
//         50: 19,
//         49: 20,
//         48: 21,
//         47: 22,
//         46: 23,
//         45: 24,
//         44: 25,
//         43: 26,
//         42: 27,
//         41: 28,
//         40: 29,
//         39: 30,
//         38: 31,
//         37: 32,
//         36: 33,
//         35: 34,
//         34: 35,
//         33: 36,
//         32: 37,
//         31: 38,
//         30: 39,
//         29: 40,
//         28: 41,
//         27: 42,
//         26: 43,
//         25: 44,
//         24: 45,
//         23: 46,
//         22: 47,
//         21: 48,
//         20: 49,
//         19: 50,
//         18: 51,
//         17: 52,
//         16: 53,
//         15: 54,
//         14: 55,
//         13: 56,
//         12: 57,
//         11: 58,
//         10: 59,
//         9: 60,
//         8: 61,
//         7: 62,
//         6: 63,
//         5: 64,
//       };

//       // Place characters in their new positions
//       Object.entries(shifts).forEach(([sourceIndex, targetIndex]) => {
//         sourceIndex = parseInt(sourceIndex) - 1; // Convert 1-based index to 0-based
//         targetIndex = parseInt(targetIndex) - 1; // Convert 1-based index to 0-based

//         if (dataArray.length > sourceIndex) {
//           newArray[targetIndex] = dataArray[sourceIndex];
//         }
//       });

//       // Join the array back into a string
//       const newDataString = newArray.join("");

//       // Return the record with the modified LEDRackStatus
//       return {
//         ...record,
//         LEDRackStatus: newDataString,
//       };
//     });

//     // Send the processed data in the response
//     res.json(processedData);
//   } catch (error) {
//     console.error("SQL error", error);
//     res.status(500).send("Internal Server Error");
//   }
// };

// export const updateRackData = async (req, res) => {
//   const { updatedRackData } = req.body;

//   // Define the shifts mapping inside the function
//   const shift = {
//     1: 1,
//     2: 2,
//     3: 3,
//     4: 4,
//     64: 64,
//     63: 6,
//     62: 7,
//     61: 8,
//     60: 9,
//     59: 10,
//     58: 11,
//     57: 12,
//     56: 13,
//     55: 14,
//     54: 15,
//     53: 16,
//     52: 17,
//     51: 18,
//     50: 19,
//     49: 20,
//     48: 21,
//     47: 22,
//     46: 23,
//     45: 24,
//     44: 25,
//     43: 26,
//     42: 27,
//     41: 28,
//     40: 29,
//     39: 30,
//     38: 31,
//     37: 32,
//     36: 33,
//     35: 34,
//     34: 35,
//     33: 36,
//     32: 37,
//     31: 38,
//     30: 39,
//     29: 40,
//     28: 41,
//     27: 42,
//     26: 43,
//     25: 44,
//     24: 45,
//     23: 46,
//     22: 47,
//     21: 48,
//     20: 49,
//     19: 50,
//     18: 51,
//     17: 52,
//     16: 53,
//     15: 54,
//     14: 55,
//     13: 56,
//     12: 57,
//     11: 58,
//     10: 59,
//     9: 60,
//     8: 61,
//     7: 62,
//     6: 63,
//     5: 5,
//     // Add or adjust mappings as needed
//   };

//   try {
//     const pool = await poolPromise;

//     for (const rack of updatedRackData) {
//       let dataArray = rack.LEDRackStatus.split("");

//       // Create a new array with the same length, filled with '0'
//       let newArray = new Array(dataArray.length).fill("0");

//       // Apply shifts to reorder data
//       Object.entries(shift).forEach(([sourceIndex, targetIndex]) => {
//         sourceIndex = parseInt(sourceIndex) - 1; // Convert 1-based index to 0-based
//         targetIndex = parseInt(targetIndex) - 1; // Convert 1-based index to 0-based

//         if (dataArray.length > sourceIndex) {
//           newArray[targetIndex] = dataArray[sourceIndex];
//         }
//       });

//       const newDataString = newArray.join("");

//       await pool
//         .request()
//         .input("LEDRack_id", rack.LEDRack_id)
//         .input("LEDRackStatus", newDataString)
//         .query(
//           "UPDATE [StencilApplication].[dbo].[StencilLEDStatus] SET [LEDRackStatus] = @LEDRackStatus WHERE [LEDRack_id] = @LEDRack_id"
//         );
//     }

//     res.status(200).send("Data updated successfully");
//   } catch (error) {
//     console.error("SQL error", error);
//     res.status(500).send("Internal Server Error");
//   }
// };


export const getStatus1 = async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool
      .request()
      .query(
        `SELECT TOP (1000)
          [LEDRack_id],
          [LEDRackStatus],
          [PhysicalLocation]
        FROM [StencilApplication].[dbo].[StencilLEDStatus]`
      );
 
    const processedData = result.recordset.map((record) => {
      const dataArray = record.LEDRackStatus.split("");
      const newArray = new Array(dataArray.length).fill("0");
 
      const shifts = {
        1: 1, 2: 2, 3: 3, 4: 4, 64: 5, 63: 6, 62: 7, 61: 8, 60: 9,
        59: 10, 58: 11, 57: 12, 56: 13, 55: 14, 54: 15, 53: 16, 52: 17,
        51: 18, 50: 19, 49: 20, 48: 21, 47: 22, 46: 23, 45: 24, 44: 25,
        43: 26, 42: 27, 41: 28, 40: 29, 39: 30, 38: 31, 37: 32, 36: 33,
        35: 34, 34: 35, 33: 36, 32: 37, 31: 38, 30: 39, 29: 40, 28: 41,
        27: 42, 26: 43, 25: 44, 24: 45, 23: 46, 22: 47, 21: 48, 20: 49,
        19: 50, 18: 51, 17: 52, 16: 53, 15: 54, 14: 55, 13: 56, 12: 57,
        11: 58, 10: 59, 9: 60, 8: 61, 7: 62, 6: 63, 5: 64,
      };
 
      Object.entries(shifts).forEach(([sourceIndex, targetIndex]) => {
        const sIdx = parseInt(sourceIndex) - 1;
        const tIdx = parseInt(targetIndex) - 1;
 
        if (dataArray.length > sIdx) {
          newArray[tIdx] = dataArray[sIdx];
        }
      });
 
      return {
        ...record,
        LEDRackStatus: newArray.join(""),
      };
    });
 
    res.json(processedData);
  } catch (error) {
    console.error("SQL error", error);
    res.status(500).send("Internal Server Error");
  }
};
 
export const getStatus2 = async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool
      .request()
      .query(
        `SELECT TOP (1000)
          [LEDRack_id],
          [LEDRackStatus],
          [PhysicalLocation]
        FROM [StencilApplication].[dbo].[StencilLEDStatus1]`
      );
 
    const processedData = result.recordset.map((record) => {
      const dataArray = record.LEDRackStatus.split("");
      const newArray = new Array(dataArray.length).fill("0");
 
      const shifts = {
        1: 1, 2: 2, 3: 3, 4: 4, 64: 5, 63: 6, 62: 7, 61: 8, 60: 9,
        59: 10, 58: 11, 57: 12, 56: 13, 55: 14, 54: 15, 53: 16, 52: 17,
        51: 18, 50: 19, 49: 20, 48: 21, 47: 22, 46: 23, 45: 24, 44: 25,
        43: 26, 42: 27, 41: 28, 40: 29, 39: 30, 38: 31, 37: 32, 36: 33,
        35: 34, 34: 35, 33: 36, 32: 37, 31: 38, 30: 39, 29: 40, 28: 41,
        27: 42, 26: 43, 25: 44, 24: 45, 23: 46, 22: 47, 21: 48, 20: 49,
        19: 50, 18: 51, 17: 52, 16: 53, 15: 54, 14: 55, 13: 56, 12: 57,
        11: 58, 10: 59, 9: 60, 8: 61, 7: 62, 6: 63, 5: 64,
      };
 
      Object.entries(shifts).forEach(([sourceIndex, targetIndex]) => {
        const sIdx = parseInt(sourceIndex) - 1;
        const tIdx = parseInt(targetIndex) - 1;
 
        if (dataArray.length > sIdx) {
          newArray[tIdx] = dataArray[sIdx];
        }
      });
 
      return {
        ...record,
        LEDRackStatus: newArray.join(""),
      };
    });
 
    res.json(processedData);
  } catch (error) {
    console.error("SQL error", error);
    res.status(500).send("Internal Server Error");
  }
};
 
export const getStatus3 = async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool
      .request()
      .query(
        `SELECT TOP (1000)
          [LEDRack_id],
          [LEDRackStatus],
          [PhysicalLocation]
        FROM [StencilApplication].[dbo].[StencilLEDStatus2]`
      );
 
    const processedData = result.recordset.map((record) => {
      const dataArray = record.LEDRackStatus.split("");
      const newArray = new Array(dataArray.length).fill("0");
 
      const shifts = {
        1: 1, 2: 2, 3: 3, 4: 4, 64: 5, 63: 6, 62: 7, 61: 8, 60: 9,
        59: 10, 58: 11, 57: 12, 56: 13, 55: 14, 54: 15, 53: 16, 52: 17,
        51: 18, 50: 19, 49: 20, 48: 21, 47: 22, 46: 23, 45: 24, 44: 25,
        43: 26, 42: 27, 41: 28, 40: 29, 39: 30, 38: 31, 37: 32, 36: 33,
        35: 34, 34: 35, 33: 36, 32: 37, 31: 38, 30: 39, 29: 40, 28: 41,
        27: 42, 26: 43, 25: 44, 24: 45, 23: 46, 22: 47, 21: 48, 20: 49,
        19: 50, 18: 51, 17: 52, 16: 53, 15: 54, 14: 55, 13: 56, 12: 57,
        11: 58, 10: 59, 9: 60, 8: 61, 7: 62, 6: 63, 5: 64,
      };
 
      Object.entries(shifts).forEach(([sourceIndex, targetIndex]) => {
        const sIdx = parseInt(sourceIndex) - 1;
        const tIdx = parseInt(targetIndex) - 1;
 
        if (dataArray.length > sIdx) {
          newArray[tIdx] = dataArray[sIdx];
        }
      });
 
      return {
        ...record,
        LEDRackStatus: newArray.join(""),
      };
    });
 
    res.json(processedData);
  } catch (error) {
    console.error("SQL error", error);
    res.status(500).send("Internal Server Error");
  }
};
 
export const getStatus4 = async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool
      .request()
      .query(
        `SELECT TOP (1000)
          [LEDRack_id],
          [LEDRackStatus],
          [PhysicalLocation]
        FROM [StencilApplication].[dbo].[StencilLEDStatus3]`
      );
 
    const processedData = result.recordset.map((record) => {
      const dataArray = record.LEDRackStatus.split("");
      const newArray = new Array(dataArray.length).fill("0");
 
      const shifts = {
        1: 1, 2: 2, 3: 3, 4: 4, 64: 5, 63: 6, 62: 7, 61: 8, 60: 9,
        59: 10, 58: 11, 57: 12, 56: 13, 55: 14, 54: 15, 53: 16, 52: 17,
        51: 18, 50: 19, 49: 20, 48: 21, 47: 22, 46: 23, 45: 24, 44: 25,
        43: 26, 42: 27, 41: 28, 40: 29, 39: 30, 38: 31, 37: 32, 36: 33,
        35: 34, 34: 35, 33: 36, 32: 37, 31: 38, 30: 39, 29: 40, 28: 41,
        27: 42, 26: 43, 25: 44, 24: 45, 23: 46, 22: 47, 21: 48, 20: 49,
        19: 50, 18: 51, 17: 52, 16: 53, 15: 54, 14: 55, 13: 56, 12: 57,
        11: 58, 10: 59, 9: 60, 8: 61, 7: 62, 6: 63, 5: 64,
      };
 
      Object.entries(shifts).forEach(([sourceIndex, targetIndex]) => {
        const sIdx = parseInt(sourceIndex) - 1;
        const tIdx = parseInt(targetIndex) - 1;
 
        if (dataArray.length > sIdx) {
          newArray[tIdx] = dataArray[sIdx];
        }
      });
 
      return {
        ...record,
        LEDRackStatus: newArray.join(""),
      };
    });
 
    res.json(processedData);
  } catch (error) {
    console.error("SQL error", error);
    res.status(500).send("Internal Server Error");
  }
};
 
export const updateRackData = async (req, res) => {
  const { updatedRackData } = req.body;
 
  const shift = {
    1: 1, 2: 2, 3: 3, 4: 4, 64: 64,
    63: 6, 62: 7, 61: 8, 60: 9, 59: 10, 58: 11, 57: 12, 56: 13, 55: 14, 54: 15,
    53: 16, 52: 17, 51: 18, 50: 19, 49: 20, 48: 21, 47: 22, 46: 23, 45: 24,
    44: 25, 43: 26, 42: 27, 41: 28, 40: 29, 39: 30, 38: 31, 37: 32, 36: 33,
    35: 34, 34: 35, 33: 36, 32: 37, 31: 38, 30: 39, 29: 40, 28: 41, 27: 42,
    26: 43, 25: 44, 24: 45, 23: 46, 22: 47, 21: 48, 20: 49, 19: 50, 18: 51,
    17: 52, 16: 53, 15: 54, 14: 55, 13: 56, 12: 57, 11: 58, 10: 59, 9: 60,
    8: 61, 7: 62, 6: 63, 5: 5,
  };
 
  try {
    const pool = await poolPromise;
 
    for (const rack of updatedRackData) {
      let dataArray = rack.LEDRackStatus.split("");
      let newArray = new Array(dataArray.length).fill("0");
 
      Object.entries(shift).forEach(([sourceIndex, targetIndex]) => {
        sourceIndex = parseInt(sourceIndex) - 1;
        targetIndex = parseInt(targetIndex) - 1;
 
        if (dataArray.length > sourceIndex) {
          newArray[targetIndex] = dataArray[sourceIndex];
        }
      });
 
      const newDataString = newArray.join("");
 
      await pool
        .request()
        .input("LEDRack_id", rack.LEDRack_id)
        .input("LEDRackStatus", newDataString)
        .query(`
          UPDATE [StencilApplication].[dbo].[StencilLEDStatus]
          SET [LEDRackStatus] = @LEDRackStatus
          WHERE [LEDRack_id] = @LEDRack_id
        `);
    }
 
    res.status(200).send("Data updated successfully");
  } catch (error) {
    console.error("SQL error", error);
    res.status(500).send("Internal Server Error");
  }
};
 
export const updateRackData1 = async (req, res) => {
  const { updatedRackData } = req.body;
 
  const shift = {
    1: 1, 2: 2, 3: 3, 4: 4, 64: 64,
    63: 6, 62: 7, 61: 8, 60: 9, 59: 10, 58: 11, 57: 12, 56: 13, 55: 14, 54: 15,
    53: 16, 52: 17, 51: 18, 50: 19, 49: 20, 48: 21, 47: 22, 46: 23, 45: 24,
    44: 25, 43: 26, 42: 27, 41: 28, 40: 29, 39: 30, 38: 31, 37: 32, 36: 33,
    35: 34, 34: 35, 33: 36, 32: 37, 31: 38, 30: 39, 29: 40, 28: 41, 27: 42,
    26: 43, 25: 44, 24: 45, 23: 46, 22: 47, 21: 48, 20: 49, 19: 50, 18: 51,
    17: 52, 16: 53, 15: 54, 14: 55, 13: 56, 12: 57, 11: 58, 10: 59, 9: 60,
    8: 61, 7: 62, 6: 63, 5: 5,
  };
 
  try {
    const pool = await poolPromise;
 
    for (const rack of updatedRackData) {
      let dataArray = rack.LEDRackStatus.split("");
      let newArray = new Array(dataArray.length).fill("0");
 
      Object.entries(shift).forEach(([sourceIndex, targetIndex]) => {
        sourceIndex = parseInt(sourceIndex) - 1;
        targetIndex = parseInt(targetIndex) - 1;
 
        if (dataArray.length > sourceIndex) {
          newArray[targetIndex] = dataArray[sourceIndex];
        }
      });
 
      const newDataString = newArray.join("");
 
      await pool
        .request()
        .input("LEDRack_id", rack.LEDRack_id)
        .input("LEDRackStatus", newDataString)
        .query(`
          UPDATE [StencilApplication].[dbo].[StencilLEDStatus1]
          SET [LEDRackStatus] = @LEDRackStatus
          WHERE [LEDRack_id] = @LEDRack_id
        `);
    }
 
    res.status(200).send("Data updated successfully");
  } catch (error) {
    console.error("SQL error", error);
    res.status(500).send("Internal Server Error");
  }
};
 
export const updateRackData2 = async (req, res) => {
  const { updatedRackData } = req.body;
 
  const shift = {
    1: 1, 2: 2, 3: 3, 4: 4, 64: 64,
    63: 6, 62: 7, 61: 8, 60: 9, 59: 10, 58: 11, 57: 12, 56: 13, 55: 14, 54: 15,
    53: 16, 52: 17, 51: 18, 50: 19, 49: 20, 48: 21, 47: 22, 46: 23, 45: 24,
    44: 25, 43: 26, 42: 27, 41: 28, 40: 29, 39: 30, 38: 31, 37: 32, 36: 33,
    35: 34, 34: 35, 33: 36, 32: 37, 31: 38, 30: 39, 29: 40, 28: 41, 27: 42,
    26: 43, 25: 44, 24: 45, 23: 46, 22: 47, 21: 48, 20: 49, 19: 50, 18: 51,
    17: 52, 16: 53, 15: 54, 14: 55, 13: 56, 12: 57, 11: 58, 10: 59, 9: 60,
    8: 61, 7: 62, 6: 63, 5: 5,
  };
 
  try {
    const pool = await poolPromise;
 
    for (const rack of updatedRackData) {
      let dataArray = rack.LEDRackStatus.split("");
      let newArray = new Array(dataArray.length).fill("0");
 
      Object.entries(shift).forEach(([sourceIndex, targetIndex]) => {
        sourceIndex = parseInt(sourceIndex) - 1;
        targetIndex = parseInt(targetIndex) - 1;
 
        if (dataArray.length > sourceIndex) {
          newArray[targetIndex] = dataArray[sourceIndex];
        }
      });
 
      const newDataString = newArray.join("");
 
      await pool
        .request()
        .input("LEDRack_id", rack.LEDRack_id)
        .input("LEDRackStatus", newDataString)
        .query(`
          UPDATE [StencilApplication].[dbo].[StencilLEDStatus2]
          SET [LEDRackStatus] = @LEDRackStatus
          WHERE [LEDRack_id] = @LEDRack_id
        `);
    }
 
    res.status(200).send("Data updated successfully");
  } catch (error) {
    console.error("SQL error", error);
    res.status(500).send("Internal Server Error");
  }
};
 
export const updateRackData3 = async (req, res) => {
  const { updatedRackData } = req.body;
 
  const shift = {
    1: 1, 2: 2, 3: 3, 4: 4, 64: 64,
    63: 6, 62: 7, 61: 8, 60: 9, 59: 10, 58: 11, 57: 12, 56: 13, 55: 14, 54: 15,
    53: 16, 52: 17, 51: 18, 50: 19, 49: 20, 48: 21, 47: 22, 46: 23, 45: 24,
    44: 25, 43: 26, 42: 27, 41: 28, 40: 29, 39: 30, 38: 31, 37: 32, 36: 33,
    35: 34, 34: 35, 33: 36, 32: 37, 31: 38, 30: 39, 29: 40, 28: 41, 27: 42,
    26: 43, 25: 44, 24: 45, 23: 46, 22: 47, 21: 48, 20: 49, 19: 50, 18: 51,
    17: 52, 16: 53, 15: 54, 14: 55, 13: 56, 12: 57, 11: 58, 10: 59, 9: 60,
    8: 61, 7: 62, 6: 63, 5: 5,
  };
 
  try {
    const pool = await poolPromise;
 
    for (const rack of updatedRackData) {
      let dataArray = rack.LEDRackStatus.split("");
      let newArray = new Array(dataArray.length).fill("0");
 
      Object.entries(shift).forEach(([sourceIndex, targetIndex]) => {
        sourceIndex = parseInt(sourceIndex) - 1;
        targetIndex = parseInt(targetIndex) - 1;
 
        if (dataArray.length > sourceIndex) {
          newArray[targetIndex] = dataArray[sourceIndex];
        }
      });
 
      const newDataString = newArray.join("");
 
      await pool
        .request()
        .input("LEDRack_id", rack.LEDRack_id)
        .input("LEDRackStatus", newDataString)
        .query(`
          UPDATE [StencilApplication].[dbo].[StencilLEDStatus3]
          SET [LEDRackStatus] = @LEDRackStatus
          WHERE [LEDRack_id] = @LEDRack_id
        `);
    }
 
    res.status(200).send("Data updated successfully");
  } catch (error) {
    console.error("SQL error", error);
    res.status(500).send("Internal Server Error");
  }
};


export const getAllStatuses = async (req, res) => {
  try {
    const pool = await poolPromise;

    const query = async (tableName) => {
      const result = await pool
        .request()
        .query(
          `SELECT TOP (1000)
            [LEDRack_id],
            [LEDRackStatus],
            [PhysicalLocation]
          FROM [StencilApplication].[dbo].[${tableName}]`
        );

      return result.recordset.map((record) => {
        const dataArray = record.LEDRackStatus.split("");
        const newArray = new Array(dataArray.length).fill("0");

        const shifts = {
          1: 1, 2: 2, 3: 3, 4: 4, 64: 5, 63: 6, 62: 7, 61: 8, 60: 9,
          59: 10, 58: 11, 57: 12, 56: 13, 55: 14, 54: 15, 53: 16, 52: 17,
          51: 18, 50: 19, 49: 20, 48: 21, 47: 22, 46: 23, 45: 24, 44: 25,
          43: 26, 42: 27, 41: 28, 40: 29, 39: 30, 38: 31, 37: 32, 36: 33,
          35: 34, 34: 35, 33: 36, 32: 37, 31: 38, 30: 39, 29: 40, 28: 41,
          27: 42, 26: 43, 25: 44, 24: 45, 23: 46, 22: 47, 21: 48, 20: 49,
          19: 50, 18: 51, 17: 52, 16: 53, 15: 54, 14: 55, 13: 56, 12: 57,
          11: 58, 10: 59, 9: 60, 8: 61, 7: 62, 6: 63, 5: 64,
        };

        Object.entries(shifts).forEach(([sourceIndex, targetIndex]) => {
          const sIdx = parseInt(sourceIndex) - 1;
          const tIdx = parseInt(targetIndex) - 1;

          if (dataArray.length > sIdx) {
            newArray[tIdx] = dataArray[sIdx];
          }
        });

        return {
          ...record,
          LEDRackStatus: newArray.join(""),
        };
      });
    };

    const [status1, status2, status3, status4] = await Promise.all([
      query("StencilLEDStatus"),
      query("StencilLEDStatus1"),
      query("StencilLEDStatus2"),
      query("StencilLEDStatus3"),
    ]);

    const combinedData = {
      status1,
      status2,
      status3,
      status4,
    };

    res.json(combinedData);
  } catch (error) {
    console.error("SQL error", error);
    res.status(500).send("Internal Server Error");
  }
};

export const updateAllRackData = async (req, res) => {
  const { updatedRackData, tableSuffix } = req.body;

  const shift = {
    1: 1, 2: 2, 3: 3, 4: 4, 64: 64,
    63: 6, 62: 7, 61: 8, 60: 9, 59: 10, 58: 11, 57: 12, 56: 13, 55: 14, 54: 15,
    53: 16, 52: 17, 51: 18, 50: 19, 49: 20, 48: 21, 47: 22, 46: 23, 45: 24,
    44: 25, 43: 26, 42: 27, 41: 28, 40: 29, 39: 30, 38: 31, 37: 32, 36: 33,
    35: 34, 34: 35, 33: 36, 32: 37, 31: 38, 30: 39, 29: 40, 28: 41, 27: 42,
    26: 43, 25: 44, 24: 45, 23: 46, 22: 47, 21: 48, 20: 49, 19: 50, 18: 51,
    17: 52, 16: 53, 15: 54, 14: 55, 13: 56, 12: 57, 11: 58, 10: 59, 9: 60,
    8: 61, 7: 62, 6: 63, 5: 5,
  };

  try {
    const pool = await poolPromise;

    // Determine the table name based on tableSuffix
    const tableName = tableSuffix
      ? `[StencilApplication].[dbo].[StencilLEDStatus${tableSuffix}]`
      : `[StencilApplication].[dbo].[StencilLEDStatus]`;

    for (const rack of updatedRackData) {
      let dataArray = rack.LEDRackStatus.split("");
      let newArray = new Array(dataArray.length).fill("0");

      Object.entries(shift).forEach(([sourceIndex, targetIndex]) => {
        sourceIndex = parseInt(sourceIndex) - 1;
        targetIndex = parseInt(targetIndex) - 1;

        if (dataArray.length > sourceIndex) {
          newArray[targetIndex] = dataArray[sourceIndex];
        }
      });

      const newDataString = newArray.join("");

      await pool
        .request()
        .input("LEDRack_id", rack.LEDRack_id)
        .input("LEDRackStatus", newDataString)
        .query(`
          UPDATE ${tableName}
          SET [LEDRackStatus] = @LEDRackStatus
          WHERE [LEDRack_id] = @LEDRack_id
        `);
    }

    res.status(200).send("Data updated successfully");
  } catch (error) {
    console.error("SQL error", error);
    res.status(500).send("Internal Server Error");
  }
};
