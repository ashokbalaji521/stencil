import { conConfig } from "../db.js";
import sql from "mssql";
 
// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const pool = await sql.connect(conConfig);
        const result = await pool.request().query("SELECT * FROM dbo.Users");
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(400).json({ error: error.message });
    }
};

// Add a new user
export const addUser = async (req, res) => {
    const { Username, Password, Role } = req.body;
    if (!Username || !Password || !Role) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const pool = await sql.connect(conConfig);
        await pool
            .request()
            .input("Username", sql.VarChar, Username)
            .input("Password", sql.VarChar, Password)
            .input("Role", sql.VarChar, Role)
            .query(
                "INSERT INTO dbo.Users (Username, Password, Role, UpdatedDateTime) VALUES (@Username, @Password, @Role, GETDATE())"
            );
        res.status(201).json({ message: "User added successfully." });
    } catch (error) {
        console.error("Error adding user:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// Update an existing user
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { Username, Password, Role } = req.body;
    if (!id || !Username || !Password || !Role) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const pool = await sql.connect(conConfig);
        await pool
            .request()
            .input("ID", sql.Int, id)
            .input("Username", sql.VarChar, Username)
            .input("Password", sql.VarChar, Password)
            .input("Role", sql.VarChar, Role)
            .query(
                "UPDATE dbo.Users SET Username = @Username, Password = @Password, Role = @Role, UpdatedDateTime = GETDATE() WHERE ID = @ID"
            );
        res.status(200).json({ message: "User updated successfully." });
    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(500).json({ error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const pool = await sql.connect(conConfig);
        
        // First check if user exists
        const checkUser = await pool.request()
            .input('id', sql.Int, id)
            .query("SELECT * FROM dbo.Users WHERE ID = @id");
        
        if (checkUser.recordset.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete the user
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query("DELETE FROM dbo.Users WHERE ID = @id");
        
        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ 
                message: "User deleted successfully", 
                deletedUserId: id 
            });
        } else {
            res.status(400).json({ error: "Failed to delete user" });
        }
    } catch (error) {
        console.error("Error deleting user:", error.message);
        res.status(500).json({ error: error.message });
    }
};