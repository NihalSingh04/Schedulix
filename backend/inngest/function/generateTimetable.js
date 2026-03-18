import { inngest } from "../client.js";
import connectDB from "../../config/db.js";

import Teacher from "../../models/Teacher.js";
import Subject from "../../models/Subject.js";
import Room from "../../models/Rooms.js";
import Constraint from "../../models/Constraint.js";
import Timetable from "../../models/Timetable.js";

import { generateTimetableWithCPSAT } from "../../service/timetableService.js";
import { sendEmail } from "../../utils/sendEmail.js";

import { getIO } from "../../socket/socketServer.js";

export const generateTimetableJob = inngest.createFunction(
  { id: "generate-timetable-job" },
  { event: "timetable/generate" },

  async ({ event }) => {
    console.log("🔥 INNGEST FUNCTION STARTED");

    const io = getIO();

    try {
      await connectDB();

      const { department, semester, section, academicYear } = event.data;
      const semesterNum = Number(semester);

      // 🔥 PROGRESS
      io.emit("timetableProgress", {
        status: "processing",
        message: "Running CP-SAT solver...",
      });

      const teachers = await Teacher.find({ department });
      const subjects = await Subject.find({ department, semester: semesterNum });
      const rooms = await Room.find({ department });
      const constraints = await Constraint.find({});

      const result = await generateTimetableWithCPSAT({
        teachers,
        subjects,
        rooms,
        constraints,
        semester: semesterNum,
        section,
      });

      if (!result?.success) {
        throw new Error(result?.error || "Solver failed");
      }

      const saved = await Timetable.findOneAndUpdate(
        {
          department,
          semester: semesterNum,
          section,
          academicYear,
          isActive: true,
        },
        {
          department,
          semester: semesterNum,
          section,
          academicYear,
          data: result.data,
          conflicts: result.conflicts,
          score: result.score,
          generatedBy: "CP-SAT",
          generatedAt: new Date(),
          isActive: true,
        },
        { upsert: true, returnDocument: "after" }
      );

      console.log("✅ Timetable saved:", saved?._id);

      // 🔥 SUCCESS
      io.emit("timetableGenerated", {
        department,
        semester: semesterNum,
        section,
        academicYear,
      });

      io.emit("timetableProgress", {
        status: "completed",
        message: "Timetable generated 🎉",
      });

      // 📧 EMAIL (safe)
      if (process.env.EMAIL_USER) {
        await sendEmail({
          to: process.env.EMAIL_USER,
          subject: "Timetable Generated",
          text: `Generated for ${department} Sem ${semester}`,
        });
      }

      return { success: true };

    } catch (error) {
      console.error("❌ INNGEST ERROR:", error);

      io.emit("timetableProgress", {
        status: "error",
        message: "Generation failed ❌",
      });

      throw error;
    }
  }
);