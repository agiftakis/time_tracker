import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertUserSchema, insertTimeEntrySchema, updateUserSchema, updateTimeEntrySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.put('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = updateUserSchema.parse(req.body);
      const user = await storage.updateUser(userId, validatedData);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Time entry routes
  app.post('/api/time-entries/clock-in', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user already has an active session
      const activeEntry = await storage.getActiveTimeEntry(userId);
      if (activeEntry) {
        return res.status(400).json({ message: "User is already clocked in" });
      }

      const timeEntry = await storage.createTimeEntry({
        userId,
        clockInTime: new Date(),
        status: "active"
      });
      
      res.json(timeEntry);
    } catch (error) {
      console.error("Error clocking in:", error);
      res.status(500).json({ message: "Failed to clock in" });
    }
  });

  app.put('/api/time-entries/:id/clock-out', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { employeeSignature, supervisorSignature } = req.body;

      const timeEntry = await storage.getTimeEntry(id);
      if (!timeEntry || timeEntry.userId !== userId) {
        return res.status(404).json({ message: "Time entry not found" });
      }

      const clockOutTime = new Date();
      const totalMinutes = Math.floor((clockOutTime.getTime() - timeEntry.clockInTime.getTime()) / (1000 * 60));

      const updatedEntry = await storage.updateTimeEntry(id, {
        clockOutTime,
        totalHours: totalMinutes,
        employeeSignature,
        supervisorSignature,
        status: "completed"
      });

      res.json(updatedEntry);
    } catch (error) {
      console.error("Error clocking out:", error);
      res.status(500).json({ message: "Failed to clock out" });
    }
  });

  app.get('/api/time-entries/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activeEntry = await storage.getActiveTimeEntry(userId);
      res.json(activeEntry);
    } catch (error) {
      console.error("Error fetching active entry:", error);
      res.status(500).json({ message: "Failed to fetch active entry" });
    }
  });

  app.get('/api/time-entries/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const entries = await storage.getUserTimeEntries(userId, limit);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.get('/api/time-entries', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const entries = await storage.getAllTimeEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching all time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/user-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const weeklyHours = await storage.getUserWeeklyHours(userId);
      const monthlyHours = await storage.getUserMonthlyHours(userId);
      
      res.json({
        weeklyHours: Math.floor(weeklyHours / 60), // Convert to hours
        monthlyHours: Math.floor(monthlyHours / 60),
        weeklyMinutes: weeklyHours % 60,
        monthlyMinutes: monthlyHours % 60
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get('/api/analytics/system-stats', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const stats = await storage.getSystemStats();
      res.json({
        ...stats,
        weeklyHours: Math.floor(stats.weeklyHours / 60),
        avgHours: Math.floor(stats.avgHours / 60)
      });
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Failed to fetch system stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
