const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/analytics — Admin only
router.get('/', [auth, roleCheck(['Admin'])], async (req, res) => {
  try {
    const now = new Date();
    const orgId = new mongoose.Types.ObjectId(req.user.organizationId);

    const userStats = await Task.aggregate([
      { $match: { organizationId: orgId } },
      { $unwind: "$assignedTo" },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },
      {
        $group: {
          _id: "$userInfo.name",
          completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          onTime: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$status", "Completed"] },
                    { $ne: ["$deadline", null] },
                    { $lte: ["$completedAt", "$deadline"] }
                  ]
                }, 1, 0
              ]
            }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $and: [{ $ne: ["$status", "Completed"] }, { $ne: ["$deadline", null] }, { $lt: ["$deadline", now] }] },
                    { $and: [{ $eq: ["$status", "Completed"] }, { $ne: ["$deadline", null] }, { $gt: ["$completedAt", "$deadline"] }] }
                  ]
                }, 1, 0
              ]
            }
          },
          delayMs: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$status", "Completed"] }, { $ne: ["$deadline", null] }, { $gt: ["$completedAt", "$deadline"] }] },
                { $subtract: ["$completedAt", "$deadline"] },
                {
                  $cond: [
                    { $and: [{ $ne: ["$status", "Completed"] }, { $ne: ["$deadline", null] }, { $lt: ["$deadline", now] }] },
                    { $subtract: [now, "$deadline"] },
                    0
                  ]
                }
              ]
            }
          },
          avgCompletionTimeMs: {
            $avg: {
              $cond: [
                { $and: [{ $eq: ["$status", "Completed"] }, { $ne: ["$completedAt", null] }] },
                { $subtract: ["$completedAt", { $ifNull: ["$assignedAt", "$createdAt"] }] },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          name: "$_id",
          completed: 1,
          onTime: 1,
          overdue: 1,
          delayHours: { $round: [{ $divide: ["$delayMs", 1000 * 60 * 60] }, 1] },
          avgTime: { $round: [{ $divide: ["$avgCompletionTimeMs", 1000 * 60 * 60] }, 1] }
        }
      },
      {
        $project: {
          name: 1,
          completed: 1,
          onTime: 1,
          overdue: 1,
          delayHours: 1,
          avgTime: 1,
          score: {
            $subtract: [
              { $add: [{ $multiply: ["$completed", 2] }, { $multiply: ["$onTime", 3] }] },
              { $add: [{ $multiply: ["$overdue", 2] }, { $multiply: ["$delayHours", 0.5] }] }
            ]
          }
        }
      }
    ]);

    let maxScore = 0;
    userStats.forEach(u => {
      if (u.score > maxScore) maxScore = u.score;
    });
    maxScore = Math.max(maxScore, 1);

    const productivity = userStats.map(u => ({
      name: u.name,
      score: u.score,
      onTime: u.onTime,
      overdue: u.overdue,
      delayHours: u.delayHours,
      percentage: Math.round((Math.max(u.score, 0) / maxScore) * 100),
      avgTime: u.avgTime || 0,
      completed: u.completed
    })).sort((a, b) => b.score - a.score);

    const tasksPerUser = productivity.map(u => ({ name: u.name, completed: u.completed }));
    const avgCompletionTime = productivity.map(u => ({ name: u.name, avgTime: u.avgTime }));
    const percentage = productivity.map(u => ({ name: u.name, percentage: u.percentage }));

    // Global stats
    const globalStats = await Task.aggregate([
      { $match: { organizationId: orgId } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          pendingTasks: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          inProgressTasks: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      tasksPerUser,
      productivity,
      avgCompletionTime,
      percentage,
      globalStats: globalStats[0] || {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
