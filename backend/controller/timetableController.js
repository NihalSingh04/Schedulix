import Teacher from "../models/Teacher.js";
import Subject from "../models/Subject.js";
import Room from "../models/Rooms.js";
import Constraint from "../models/Constraint.js";
import Timetable from "../models/Timetable.js";

import { generateTimetablePDF } from "../utils/pdf_export.js";
import { inngest } from "../inngest/client.js";

import { getIO } from "../socketServer.js";

/* =========================================
   GENERATE TIMETABLE (INNGEST TRIGGER)
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

    const semesterNum = parseInt(semester, 10);

    if (isNaN(semesterNum)) {
      return res.status(400).json({
        success: false,
        message: "Semester must be a valid number",
      });
    }

    const io = getIO();

    // 🔥 START EVENT
    io.emit("timetableProgress", {
      status: "started",
      message: "Timetable generation started...",
    });

    await inngest.send({
      name: "timetable/generate",
      data: {
        department: department.toUpperCase(),
        semester: semesterNum,
        section: section.toUpperCase(),
        academicYear,
      },
    });

    res.json({
      success: true,
      message: "Timetable generation started in background",
    });

  } catch (error) {
    console.error("Error starting timetable generation:", error);

    const io = getIO();

    io.emit("timetableProgress", {
      status: "error",
      message: "Failed to start timetable",
    });

    res.status(500).json({
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
        message:
          "Department, semester, section, and academicYear are required",
      });
    }

    const semesterNum = parseInt(semester, 10);

    const timetable = await Timetable.findOne({
      department: department.toUpperCase(),
      semester: semesterNum,
      section: section.toUpperCase(),
      academicYear,
      isActive: true,
    })
      .populate("data.teacherId", "name")
      .populate("data.roomId", "name")
      .populate("data.subjectId", "name code");

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    res.json({
      success: true,
      data: timetable,
    });

  } catch (error) {
    console.error("Error fetching timetable:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/* =========================================
   EXPORT TIMETABLE AS PDF
========================================= */
export const exportTimetablePDF = async (req, res) => {
  try {
    const { department, semester, section, academicYear } = req.query;

    if (!department || !semester || !section || !academicYear) {
      return res.status(400).json({
        success: false,
        message:
          "Department, semester, section, and academicYear are required",
      });
    }

    const semesterNum = parseInt(semester, 10);

    const timetable = await Timetable.findOne({
      department: department.toUpperCase(),
      semester: semesterNum,
      section: section.toUpperCase(),
      academicYear,
      isActive: true,
    })
      .populate("data.teacherId", "name")
      .populate("data.roomId", "name")
      .populate("data.subjectId", "name code");

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    generateTimetablePDF(timetable.data, res);

  } catch (error) {
    console.error("Error exporting timetable PDF:", error);

    res.status(500).json({
      success: false,
      message: "Failed to export timetable PDF",
      error: error.message,
    });
  }
};

/* =========================================
   GET TIMETABLE BY TEACHER
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
        message: "No timetables found for this teacher",
      });
    }

    const organized = timetables.map((t) => ({
      department: t.department,
      semester: t.semester,
      section: t.section,
      academicYear: t.academicYear,
      classes: t.data.filter(
        (entry) =>
          entry.teacherId &&
          entry.teacherId.toString() === teacherId.toString()
      ),
    }));

    res.json({
      success: true,
      data: organized,
    });

  } catch (error) {
    console.error("Error fetching teacher timetable:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/* =========================================
   UPDATE SINGLE TIMETABLE ENTRY
========================================= */
export const updateTimetableEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, slot, subjectId, teacherId, roomId } = req.body;

    const timetable = await Timetable.findOne({ "data._id": id });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable entry not found",
      });
    }

    const entry = timetable.data.id(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Entry not found",
      });
    }

    if (day) entry.day = day;
    if (slot !== undefined) entry.slot = slot;
    if (subjectId) entry.subjectId = subjectId;
    if (teacherId) entry.teacherId = teacherId;
    if (roomId) entry.roomId = roomId;

    await timetable.save();

    const updated = await Timetable.findById(timetable._id)
      .populate("data.teacherId", "name")
      .populate("data.roomId", "name")
      .populate("data.subjectId", "name code");

    res.json({
      success: true,
      message: "Timetable entry updated successfully",
      data: updated.data.id(id),
    });

  } catch (error) {
    console.error("Error updating timetable entry:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
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

    if (!department || !semester || !section || !academicYear) {
      return res.status(400).json({
        success: false,
        message:
          "Department, semester, section, and academicYear are required",
      });
    }

    const semesterNum = parseInt(semester, 10);

    const timetable = await Timetable.findOneAndDelete({
      department: department.toUpperCase(),
      semester: semesterNum,
      section: section.toUpperCase(),
      academicYear,
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    res.json({
      success: true,
      message: "Timetable deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting timetable:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};