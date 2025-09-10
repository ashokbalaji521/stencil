import swaggerUi from "swagger-ui-express";
import swaggerAutogen from "swagger-autogen";
import fs from "fs";

export const swaggerDocs = async (app) => {
  const doc = {
    info: {
      title: "STENCIL MANAGEMENT SYSTEM",
      description: "API Documentation for Stencil Management System",
      version: "1.0.0",
    },
    externalDocs: {
      description: "swagger.json",
      url: "/Stencil_Management/swagger.json",
    },
    host: "localhost:4000",
    basePath: "/",
    schemes: ["http"],
    consumes: ["application/json"],
    produces: ["application/json"],
    tags: [
      {
        name: "Stencil Management",
        description: "Operations related to stencil management",
      },
    ],
    definitions: {
      Stencil: {
        type: "object",
        properties: {
          StencilID: {
            type: "string",
            description: "Unique identifier for the stencil",
          },
          BarcodeID: {
            type: "string",
            description: "Barcode identifier for the stencil",
          },
          RackID: {
            type: "string",
            description: "Rack identifier where stencil is located",
          },
          Status: {
            type: "integer",
            description: "Status of the stencil (0 = out, 1 = in)",
          },
        },
      },
      NonAuthorizedOut: {
        type: "object",
        properties: {
          ID: {
            type: "integer",
            description: "Unique identifier for the record",
          },
          TimeColumn: {
            type: "string",
            format: "date-time",
            description: "Timestamp of the unauthorized out event",
          },
          PhysicalLocation: {
            type: "string",
            description: "Physical location of the stencil",
          },
          StencilID: {
            type: "string",
            description: "Stencil identifier",
          },
          BarcodeID: {
            type: "string",
            description: "Barcode identifier",
          },
          RackNo: {
            type: "string",
            description: "Rack number",
          },
          EmailSend: {
            type: "integer",
            description: "Email sent status (0 = not sent, 1 = sent)",
          },
        },
      },
    },
  };

  const outputFile = "./swagger-api.json";
  const endpointsFiles = ["./server.js", "./routes.js"];

  try {
    // Wait for autogen to finish
    await swaggerAutogen()(outputFile, endpointsFiles, doc);

    // Now the file exists, read it
    const file = JSON.parse(fs.readFileSync(outputFile, "utf8"));

    // Setup Swagger UI
    app.use("/Stencil_Management/docs", swaggerUi.serve, swaggerUi.setup(file, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: "Stencil Management API Documentation"
    }));

    // Documentation in JSON format
    app.get("/Stencil_Management/swagger.json", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(file);
    });

    console.log("Swagger documentation setup completed successfully");
  } catch (error) {
    console.error("Error setting up Swagger documentation:", error);
  }
};