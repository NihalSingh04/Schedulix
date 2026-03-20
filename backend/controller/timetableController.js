import Timetable from "../models/Timetable.js";
import { generateTimetablePDF } from "../utils/pdf_export.js";

import { inngest } from "../inngest/client.js";
import { getIO } from "../socket/socketServer.js";

/* =========================================
   GENERATE TIMETABLE
========================================= */
export const generateTimetable = async (req, res) => {
  try {
    const { department, semester, section, academicYear } = req.body;

    if (!department || !semester || !section || !academicYear) {
      return res.status(400).json({
        success: false,
        message:
          "Department, semester, section, and academicYear are required",
      });
    }

    const dept = department.toUpperCase();
    const sec = section.toUpperCase();
    const semesterNum = Number(semester);

    if (isNaN(semesterNum)) {
      return res.status(400).json({
        success: false,
        message: "Semester must be a valid number",
      });
    }

    /* SOCKET START EVENT */
    let io;
    try {
      io = getIO();
    } catch {}

    io?.emit("timetableProgress", {
      status: "started",
      message: "Timetable generation started...",
    });

    /* TRIGGER INNGEST */
    await inngest.send({
      name: "timetable/generate",
      data: {
        department: dept,
        semester: semesterNum,
        section: sec,
        academicYear,
      },
    });

    return res.json({
      success: true,
      message: "Timetable generation started in background",
    });

  } catch (error) {
    console.error("❌ ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to start timetable generation",
      error: error.message,
    });
  }
};

/* =========================================
   GET TIMETABLE
========================================= */
export const getTimetable = async (req, res) => {
  try {
    const { department, semester, section, academicYear } = req.query;

    if (!department || !semester || !section || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "Missing query parameters",
      });
    }

    const dept = department.toUpperCase();
    const sec = section.toUpperCase();
    const semesterNum = Number(semester);

    console.log("Searching timetable:", {
      dept,
      semesterNum,
      sec,
      academicYear
    });

    const timetable = await Timetable.findOne({
      department: dept,
      semester: semesterNum,
      section: sec,
      academicYear,
      isActive: true,
    })
      .populate("data.teacherId", "name")
      .populate("data.roomId", "name")
      .populate("data.subjectId", "name code");

    if (!timetable) {
      console.log("No timetable found");

      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    return res.json({
      success: true,
      data: timetable,
    });

  } catch (error) {
    console.error("❌ GET TIMETABLE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =========================================
   EXPORT PDF
========================================= */
export const exportTimetablePDF = async (req, res) => {
  try {
    const { department, semester, section, academicYear } = req.query;

    const timetable = await Timetable.findOne({
      department: department.toUpperCase(),
      semester: Number(semester),
      section: section.toUpperCase(),
      academicYear,
      isActive: true,
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    generateTimetablePDF(timetable.data, res);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =========================================
   GET BY TEACHER
========================================= */
export const getTimetableByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const timetables = await Timetable.find({
      "data.teacherId": teacherId,
      isActive: true,
    });

    if (!timetables.length) {
      return res.status(404).json({
        success: false,
        message: "No timetables found",
      });
    }

    return res.json({
      success: true,
      data: timetables,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =========================================
   UPDATE ENTRY
========================================= */
export const updateTimetableEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findOne({
      "data._id": id,
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Entry not found",
      });
    }

    const entry = timetable.data.id(id);

    Object.assign(entry, req.body);

    await timetable.save();

    return res.json({
      success: true,
      message: "Entry updated successfully",
      data: entry,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =========================================
   DELETE TIMETABLE
========================================= */
export const deleteTimetable = async (req, res) => {
  try {
    const { department, semester, section, academicYear } = req.body;

    const timetable = await Timetable.findOneAndDelete({
      department: department.toUpperCase(),
      semester: Number(semester),
      section: section.toUpperCase(),
      academicYear,
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    return res.json({
      success: true,
      message: "Timetable deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};