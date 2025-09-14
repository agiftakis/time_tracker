import multer from "multer";
import fs from "fs";
import { uploadProfileImage } from "./cloudinary";
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTimeEntrySchema, updateUserSchema, updateTimeEntrySchema } from "@shared/schema";
import { z } from "zod";

// Multer setup for image uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (_req: Request, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      // TypeScript expects "null" for the first param, but Error for the second for a failed check
      cb(null, false);
    }
  }
});

// Validation schema for clock-out signatures
const clockOutSchema = z.object({
  employeeSignature: z.string().min(1, "Employee signature is required").refine(
    (sig) => sig.startsWith("data:image/") && sig.includes("base64,"),
    "Employee signature must be a valid base64 image"
  ),
  supervisorSignature: z.string().min(1, "Supervisor signature is required").refine(
    (sig) => sig.startsWith("data:image/") && sig.includes("base64,"),
    "Supervisor signature must be a valid base64 image"
  ),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Profile Image Upload Endpoint
  app.post("/api/profile/upload", upload.single("image"), async (req: Request, res: Response) => {
    try {
      const file = (req as any).file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      // Upload to Cloudinary using helper, Multer saves file locally first
      const cloudUrl = await uploadProfileImage({ tempFilePath: file.path });

      // Remove temp file from /uploads
      fs.unlink(file.path, () => {});

      // (Optional) Update user record here if user info available

      res.json({ url: cloudUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to upload image" });
    }
  });

  // All other endpoints: explicit types
  app.get('/api/auth/user', async (_req: Request, res: Response) => { res.status(501).json({ message: "Auth not set up yet" }); });
  app.put('/api/users/profile', async (_req: Request, res: Response) => { res.status(501).json({ message: "Auth not set up yet" }); });
  app.get('/api/users', async (_req: Request, res: Response) => { res.status(501).json({ message: "Auth not set up yet" }); });
  app.post('/api/time-entries/clock-in', async (_req: Request, res: Response) => { res.status(501).json({ message: "Auth not set up yet" }); });
  app.put('/api/time-entries/:id/clock-out', async (_req: Request, res: Response) => { res.status(501).json({ message: "Auth not set up yet" }); });
  app.get('/api/time-entries/active', async (_req: Request, res: Response) => { res.status(501).json({ message: "Auth not set up yet" }); });
  app.get('/api/time-entries/user', async (_req: Request, res: Response) => { res.status(501).json({ message: "Auth not set up yet" }); });
  app.get('/api/time-entries', async (_req: Request, res: Response) => { res.status(501).json({ message: "Auth not set up yet" }); });
  app.get('/api/analytics/user-stats', async (_req: Request, res: Response) => { res.status(501).json({ message: "Auth not set up yet" }); });
  app.get('/api/analytics/system-stats', async (_req: Request, res: Response) => { res.status(501).json({ message: "Auth not set up yet" }); });

  const httpServer = createServer(app);
  return httpServer;
}
