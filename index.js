"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// index.ts
const app_1 = require("./app");
const db_1 = require("./db");
const config_1 = require("./config");
(0, db_1.connectDB)();
app_1.server.listen(config_1.PORT, () => {
    console.log(`Server is running on port ${config_1.PORT}`);
});
