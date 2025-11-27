import express from "express";

import {
  addDesignation,
  deleteDesignation,
  getDesignationsByCompany,
} from "../controller/DesignationController.js";

let DesignationRoutes = express.Router();

// Accept both forms:
// 1) DELETE /deletedesignation/:id
// 2) DELETE /deletedesignation?id=...  (some frontends omit path param)
DesignationRoutes.delete("/deletedesignation/:id", deleteDesignation);
DesignationRoutes.delete("/deletedesignation", deleteDesignation);
DesignationRoutes.post("/getdesignationbycompany", getDesignationsByCompany);

DesignationRoutes.post("/add-designation", addDesignation);

export { DesignationRoutes };
