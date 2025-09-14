import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTimeEntrySchema, updateUserSchema, updateTimeEntrySchema } from "@shared/schema";
import { z } from "zod";

// Validation schema for clock-out signatures
const clockOutSchema = z.object({
  employeeSignature: z.string().min(1, "Employee signature is required").refine(
    (sig) => sig.startsWith('data:image/') && sig.includes('base64,'),
    "Employee signature must be a valid base64 image"
  ),
  supervisorSignature: z.string().min(1, "Supervisor signature is required").refine(
    (sig) => sig.startsWith('data:image/') && sig.includes('base64,'),
    "Supervisor signature must be a valid base64 image"
  ),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes (UNPROTECTED for now)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // TODO: Replace with new auth/session user lookup
      res.status(501).json({ message: "Auth not set up yet" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.put('/api/users/profile', async (req: any, res) => {
    try {
      // TODO: Replace with new auth/session user lookup
      res.status(501).json({ message: "Auth not set up yet" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/users', async (req: any, res) => {
    try {
      // TODO: Add admin/user session verification
      res.status(501).json({ message: "Auth not set up yet" });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Time entry routes
  app.post('/api/time-entries/clock-in', async (req: any, res) => {
    try {
      // TODO: Add user session check
      res.status(501).json({ message: "Auth not set up yet" });
    } catch (error) {
      console.error("Error clocking in:", error);
      res.status(500).json({ message: "Failed to clock in" });
    }
  });

  app.put('/api/time-entries/:id/clock-out', async (req: any, res) => {
    try {
      // TODO: Add user/session lookup
      res.status(501).json({ message: "Auth not set up yet" });
    } catch (error) {
      console.error("Error clocking out:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => e.message) 
        });
      }
      res.status(500).json({ message: "Failed to clock out" });
    }
  });

  app.get('/api/time-entries/active', async (req: any, res) => {
    try {
      // TODO: Add user/session lookup
      res.status(501).json({ message: "Auth not set up yet" });
    } catch (error) {
      console.error("Error fetching active entry:", error);
      res.status(500).json({ message: "Failed to fetch active entry" });
    }
  });

  app.get('/api/time-entries/user', async (req: any, res) => {
    try {
      // TODO: Add user/session lookup
      res.status(501).json({ message: "Auth not set up yet" });
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.get('/api/time-entries', async (req: any, res) => {
    try {
      // TODO: Add admin/session check
      res.status(501).json({ message: "Auth not set up yet" });
    } catch (error) {
      console.error("Error fetching all time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/user-stats', async (req: any, res) => {
    try {
      // TODO: Add user/session lookup
      res.status(501).json({ message: "Auth not set up yet" });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get('/api/analytics/system-stats', async (req: any, res) => {
    try {
      // TODO: Add admin/session check
      res.status(501).json({ message: "Auth not set up yet" });
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Failed to fetch system stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
