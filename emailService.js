import { SMTPClient } from "emailjs";
import sql from "mssql";
import { conConfig } from "./db.js";

const client = new SMTPClient({
  host: "mailrelay.int.nokia.com",
});

function adjustTimeBy5Hours30Minutes(date) {
  const adjustedDate = new Date(date);
  adjustedDate.setHours(adjustedDate.getHours() - 5);
  adjustedDate.setMinutes(adjustedDate.getMinutes() - 30);
  return adjustedDate;
}

async function sendNonAuthorizedEmails() {
  try {
    const pool = await sql.connect(conConfig);
    
    const emailConfigResult = await pool.request().query(`
      SELECT [To], [Bcc], [CC] FROM [StencilApplication].[dbo].[MailIds]
    `);

    if (emailConfigResult.recordset.length === 0) {
      console.log("No email configuration found in MailIds table");
      return;
    }

    const emailConfig = emailConfigResult.recordset[0];
    
    const result = await pool.request().query(`
      SELECT ID, TimeColumn, [Physical Location], StencilID, BarcodeID, RackNo, PairedPhysicalLocation
      FROM [NonAuthorizedOut]
      WHERE (EmailSend IS NULL OR EmailSend = 0) AND Enabledtosendmail = 1
    `);

    if (result.recordset.length === 0) {
      console.log("No pending emails to send");
      return;
    }

    for (const record of result.recordset) {
      try {
        const adjustedTime = adjustTimeBy5Hours30Minutes(record.TimeColumn);
        
        const message = {
          text: `NON-AUTHORIZED OUT\n\nStencil ID: ${record.StencilID}\nBarcode ID: ${record.BarcodeID}\nDate: ${adjustedTime.toLocaleDateString()}\nTime: ${adjustedTime.toLocaleTimeString()}\nPhysical Location: ${record['Physical Location']}\nRack No: ${record.RackNo}${record.PairedPhysicalLocation ? `\nPaired Physical Location: ${record.PairedPhysicalLocation}` : ''}`,
          from: "support.int@nokia.com",
          subject: "NON_AUTHORIZED OUT",
        };

        if (emailConfig.To) {
          message.to = emailConfig.To;
        } else {
          console.error("No TO email addresses configured");
          continue;
        }

        if (emailConfig.CC && emailConfig.CC.trim() !== '') {
          message.cc = emailConfig.CC;
        }

        if (emailConfig.Bcc && emailConfig.Bcc.trim() !== '') {
          message.bcc = emailConfig.Bcc;
        }

        await client.sendAsync(message);
        console.log(`Email sent successfully for record ID: ${record.ID}, Physical Location: ${record['Physical Location']}`);
        console.log(`TO: ${message.to}${message.cc ? ', CC: ' + message.cc : ''}${message.bcc ? ', BCC: ' + message.bcc : ''}`);

        await pool.request().query(`
          UPDATE [NonAuthorizedOut]
          SET EmailSend = 1
          WHERE ID = ${record.ID}
        `);
        console.log(`Updated EmailSend status for record ID: ${record.ID}`);
      } catch (emailError) {
        console.error(`Failed to send email for record ID: ${record.ID}:`, emailError);
      }
    }
  } catch (error) {
    console.error("Error in sendNonAuthorizedEmails:", error);
  }
}

async function sendNonAuthorizedStencilInEmails() {
  try {
    const pool = await sql.connect(conConfig);
    
    const emailConfigResult = await pool.request().query(`
      SELECT [To], [Bcc], [CC] FROM [StencilApplication].[dbo].[MailIds]
    `);

    if (emailConfigResult.recordset.length === 0) {
      console.log("No email configuration found in MailIds table");
      return;
    }

    const emailConfig = emailConfigResult.recordset[0];
    
    const result = await pool.request().query(`
      SELECT TimeColumn, PhysicalLocation, StencilID, BarcodeID, LEDRackStatus, RackNo, PairedPhysicalLocation
      FROM [NonAuthorizedStencilIn]
       WHERE (EmailSend IS NULL OR EmailSend = 0) AND Enabledtosendmail = 1
    `);

    if (result.recordset.length === 0) {
      console.log("No pending NonAuthorized Stencil IN emails to send");
      return;
    }

    for (const record of result.recordset) {
      try {
        const adjustedTime = adjustTimeBy5Hours30Minutes(record.TimeColumn);
        
        const message = {
          text: `NON-AUTHORIZED STENCIL IN\n\nStencil ID: ${record.StencilID || 'N/A'}\nBarcode ID: ${record.BarcodeID || 'N/A'}\nDate: ${adjustedTime.toLocaleDateString()}\nTime: ${adjustedTime.toLocaleTimeString()}\nPhysical Location: ${record.PhysicalLocation}\nRack No: ${record.RackNo}${record.PairedPhysicalLocation ? `\nPaired Physical Location: ${record.PairedPhysicalLocation}` : ''}`,
          from: "support.int@nokia.com",
          subject: "NON_AUTHORIZED STENCIL IN",
        };

        if (emailConfig.To) {
          message.to = emailConfig.To;
        } else {
          console.error("No TO email addresses configured");
          continue;
        }

        if (emailConfig.CC && emailConfig.CC.trim() !== '') {
          message.cc = emailConfig.CC;
        }

        if (emailConfig.Bcc && emailConfig.Bcc.trim() !== '') {
          message.bcc = emailConfig.Bcc;
        }

        await client.sendAsync(message);
        console.log(`NonAuthorized Stencil IN email sent successfully for Physical Location: ${record.PhysicalLocation}, Rack: ${record.RackNo}`);
        console.log(`TO: ${message.to}${message.cc ? ', CC: ' + message.cc : ''}${message.bcc ? ', BCC: ' + message.bcc : ''}`);

        await pool.request().query(`
          UPDATE [NonAuthorizedStencilIn]
          SET EmailSend = 1
          WHERE TimeColumn = '${record.TimeColumn.toISOString()}'
            AND PhysicalLocation = '${record.PhysicalLocation}'
            AND RackNo = '${record.RackNo}'
        `);
        console.log(`Updated EmailSend status for NonAuthorized Stencil IN record`);
      } catch (emailError) {
        console.error(`Failed to send NonAuthorized Stencil IN email for Physical Location: ${record.PhysicalLocation}:`, emailError);
      }
    }
  } catch (error) {
    console.error("Error in sendNonAuthorizedStencilInEmails:", error);
  }
}

async function updateEnabledToSendMail() {
  try {
    const pool = await sql.connect(conConfig);

    // Fetch records from NonAuthorizedOut where Enabledtosendmail = 0
    const outResult = await pool.request().query(`
      SELECT TOP (1000) [ID], [TimeColumn], [Physical Location], [StencilID], [BarcodeID], 
        [EmailSend], [RackNo], [PairedPhysicalLocation], [Enabledtosendmail]
      FROM [StencilApplication].[dbo].[NonAuthorizedOut]
      WHERE Enabledtosendmail = 0
    `);
    console.log(`Fetched ${outResult.recordset.length} records from NonAuthorizedOut with Enabledtosendmail = 0`);

    // Fetch records from NonAuthorizedStencilIn where Enabledtosendmail = 0
    const inResult = await pool.request().query(`
      SELECT TOP (1000) [TimeColumn], [PhysicalLocation], [StencilID], [BarcodeID], 
        [EmailSend], [LEDRackStatus], [RackNo], [ID], [PairedPhysicalLocation], [Enabledtosendmail]
      FROM [StencilApplication].[dbo].[NonAuthorizedStencilIn]
      WHERE Enabledtosendmail = 0
    `);
    console.log(`Fetched ${inResult.recordset.length} records from NonAuthorizedStencilIn with Enabledtosendmail = 0`);

    // Combine both result sets for duplicate checking, only including records with Enabledtosendmail = 0
    const allRecords = [
      ...outResult.recordset.map(r => ({
        ID: r.ID,
        TimeColumn: new Date(r.TimeColumn), // Ensure TimeColumn is a Date object
        PhysicalLocation: r['Physical Location'] || r.PhysicalLocation,
        PairedPhysicalLocation: r.PairedPhysicalLocation || null,
        Table: 'NonAuthorizedOut',
        Enabledtosendmail: r.Enabledtosendmail
      })),
      ...inResult.recordset.map(r => ({
        ID: r.ID,
        TimeColumn: new Date(r.TimeColumn), // Ensure TimeColumn is a Date object
        PhysicalLocation: r.PhysicalLocation,
        PairedPhysicalLocation: r.PairedPhysicalLocation || null,
        Table: 'NonAuthorizedStencilIn',
        Enabledtosendmail: r.Enabledtosendmail
      }))
    ];
    console.log(`Total records combined (Enabledtosendmail = 0): ${allRecords.length}`);

    // Find duplicates based on TimeColumn and (PhysicalLocation or PairedPhysicalLocation)
    const duplicates = new Set();
    for (let i = 0; i < allRecords.length; i++) {
      for (let j = i + 1; j < allRecords.length; j++) {
        const record1 = allRecords[i];
        const record2 = allRecords[j];

        if (
          record1.TimeColumn.getTime() === record2.TimeColumn.getTime() &&
          (
            record1.PhysicalLocation === record2.PhysicalLocation ||
            record1.PhysicalLocation === record2.PairedPhysicalLocation ||
            record1.PairedPhysicalLocation === record2.PhysicalLocation ||
            (record1.PairedPhysicalLocation && record2.PairedPhysicalLocation && record1.PairedPhysicalLocation === record2.PairedPhysicalLocation)
          )
        ) {
          duplicates.add(`${record1.ID}-${record1.Table}`);
          duplicates.add(`${record2.ID}-${record2.Table}`);
          console.log(`Duplicate found: ${record1.Table} ID ${record1.ID} and ${record2.Table} ID ${record2.ID}`);
        }
      }
    }
    console.log(`Total duplicates found: ${duplicates.size}`);

    // Update Enabledtosendmail for non-duplicate records
    for (const record of allRecords) {
      if (!duplicates.has(`${record.ID}-${record.Table}`)) {
        const tableName = record.Table;
        console.log(`Attempting to update ${tableName} record ID: ${record.ID}`);
        try {
          const updateResult = await pool.request().query(`
            UPDATE [StencilApplication].[dbo].[${tableName}]
            SET Enabledtosendmail = 1
            WHERE ID = ${record.ID} AND Enabledtosendmail = 0
          `);
          console.log(`Update result for ${tableName} ID ${record.ID}: Rows affected = ${updateResult.rowsAffected}`);
          if (updateResult.rowsAffected[0] > 0) {
            console.log(`Updated Enabledtosendmail to 1 for ${tableName} record ID: ${record.ID}`);
          } else {
            console.log(`No rows updated for ${tableName} ID ${record.ID}. Possible reasons: Enabledtosendmail already 1 or ID not found.`);
          }
        } catch (updateError) {
          console.error(`Failed to update ${tableName} ID ${record.ID}:`, updateError);
        }
      } else {
        console.log(`Skipped update for duplicate ${record.Table} record ID: ${record.ID}`);
      }
    }

    console.log("Enabledtosendmail update process completed");
  } catch (error) {
    console.error("Error in updateEnabledToSendMail:", error);
  }
}

export { sendNonAuthorizedEmails, sendNonAuthorizedStencilInEmails, updateEnabledToSendMail };