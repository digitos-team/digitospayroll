import express from "express"
import {  fetchDetails, registerAdmin, updateCompany } from "../controller/AdminController.js"



let Adminroutes = express.Router()



Adminroutes.get("/fetchdetails",  fetchDetails)
Adminroutes.post("/registeradmin", registerAdmin)
Adminroutes.put("/updatecompany/:id", updateCompany)
// Adminroutes.post("/adminlogin", adminLogin)

export {Adminroutes}