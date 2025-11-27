import mongoose from "mongoose";
import { SalarySettings } from "../models/SalarySettingSchema.js";

// ➤ Add or Update Salary Setting
const addOrUpdateSalarySetting = async (req, res) => {
  try {
    const { CompanyId, EmployeeID, EffectFrom, SalaryHeads, isTaxApplicable } =
      req.body;

    let existingSetting = await SalarySettings.findOne({
      CompanyId,
      EmployeeID,
    });

    if (existingSetting) {
      existingSetting.SalaryHeads = SalaryHeads;
      existingSetting.EffectFrom = EffectFrom || existingSetting.EffectFrom;
      existingSetting.isTaxApplicable = isTaxApplicable;
      await existingSetting.save();

      return res.status(200).json({
        message: "Salary setting updated successfully",
        data: existingSetting,
      });
    }

    const newSetting = await SalarySettings.create({
      CompanyId,
      EmployeeID,
      EffectFrom,
      SalaryHeads,
      isTaxApplicable,
    });

    res.status(201).json({
      message: "Salary setting created successfully",
      data: newSetting,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving salary setting",
      error: error.message,
    });
  }
};

const getSalarySettingsByCompany = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: "Invalid Company ID format" });
    }

    const settings = await SalarySettings.find({
      CompanyId: new mongoose.Types.ObjectId(companyId),
    })
      .populate("EmployeeID", "EmployeeName EmployeeCode")
      .populate("SalaryHeads.SalaryHeadId", "HeadName HeadType");

    if (settings.length === 0) {
      console.log("No records found for CompanyId:", companyId);
      const all = await SalarySettings.find();
      console.log("All records:", all); // 🔍 debug to see actual CompanyIds
      return res.status(404).json({ message: "No salary settings found" });
    }

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching salary settings",
      error: error.message,
    });
  }
};
// ➤ Delete Salary Setting
const deleteSalarySetting = async (req, res) => {
  try {
    const { id } = req.params;
    await SalarySettings.findByIdAndDelete(id);
    res.status(200).json({ message: "Salary setting deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting salary setting",
      error: error.message,
    });
  }
};
export {
  addOrUpdateSalarySetting,
  getSalarySettingsByCompany,
  deleteSalarySetting,
};
