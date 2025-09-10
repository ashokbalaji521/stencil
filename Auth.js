import { conConfig } from "./db.js";
import sql from "mssql";
//import { SMTPClient } from "emailjs";
import requestIp from "request-ip";
import jwt from "jsonwebtoken";
//import si from "systeminformation";
//router.use(requestIp.mw());
// const client = new SMTPClient({
//   host: "mailrelay.int.nokia.com",
// });
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
const jwtSecret = "TMS";

import crypto from "crypto";

export const GetData = async (req, res) => {
  console.log("executing");
  const Partnumber = req.body.Partnumber;
  const pool = await sql.connect(conConfig);
  try {
    const getquery = await pool
      .request()
      .query(
        `SELECT * FROM [dummytable_10] where [Partnumber ] = '${Partnumber}'`
      );
    const result = getquery.recordset;
    console.log(result);
    return res.status(200).send(result);
  } catch (error) {
    return res.status(500).send({ err: "No record found" });
  }
};

export const InsertData = async (req, res) => {
  console.log("executing");

  // Extracting data from request body
  const {
    product,
    side,
    partnumber,
    supplierPartnumber,
    DateOfManufacturing,
    StencilThickness,
    StencilID,
    BarcodeID,
    ModuleCode,
  } = req.body[0];
  //console.log(product,side,partnumber,supplierPartnumber)
  const aray = req.body[0].product;
  console.log("body", aray);
  try {
    const pool = await sql.connect(conConfig);
    const result = await pool
      .request()
      // .input('SLNo', sql.Int, SLNo)
      .input("Product", sql.NVarChar, product)
      .input("Side", sql.NVarChar, side)
      .input("Partnumber", sql.NVarChar, partnumber)
      .input("SupplierPartnumber", sql.NVarChar, supplierPartnumber)
      .input("DateOfManufacturing", sql.Date, DateOfManufacturing)
      .input("StencilThickness", sql.Decimal(5, 2), StencilThickness)
      .input("StencilID", sql.NVarChar, StencilID)
      .input("BarcodeID", sql.NVarChar, BarcodeID)
      .input("ModuleCode", sql.NVarChar, ModuleCode)
      .query(`INSERT INTO [dummytable_10] (
        [Product], [Side], [Partnumber], [SupplierPartnumber], 
        [DateOfManufacturing], [StencilThickness], [StencilID], 
        [BarcodeID], [ModuleCode])
        VALUES (
        @Product, @Side, @Partnumber, @SupplierPartnumber, 
        @DateOfManufacturing, @StencilThickness, @StencilID, 
        @BarcodeID, @ModuleCode);
      `);

    console.log(result);
    return res.status(200).send(result);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ err: "Failed to insert record" });
  }
};

export const Login = async (req, res) => {
  console.log("Verifying data");

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .send({ error: "Both username and password are required" });
    }

    const pool = await sql.connect(conConfig);

    const result = await pool
      .request()
      .input("username", sql.NVarChar, username)
      .input("password", sql.NVarChar, password)
      .query(
        "SELECT * FROM [Users] WHERE Username = @username and Password = @password"
      );

    const user = result.recordset[0];

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.UserID, // Include any user info you need
        role: user.Role,
      },
      jwtSecret,
      { expiresIn: "2h" } // Token expiration time
    );

    return res.status(200).json({ token, role: user.Role });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send({ error: "Internal server error" });
  }
};