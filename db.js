export const conConfig = {
  user: "sa",
  password: "Iotserver@1",
  server: "10.131.213.169",
  database: "StencilApplication",
  //database: "TTA",
  options: {
    encrypt: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 60000, // Increase  request timeout to 60 seconds
  connectionTimeout: 30000,
};
