import {
  users,
  timeEntries,
  type User,
  type UpsertUser,
  type InsertUser,
  type UpdateUser,
  type TimeEntry,
  type InsertTimeEntry,
  type UpdateTimeEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Additional user operations
  updateUser(id: string, user: UpdateUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Time entry operations
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, timeEntry: UpdateTimeEntry): Promise<TimeEntry>;
  getTimeEntry(id: string): Promise<TimeEntry | undefined>;
  getUserTimeEntries(userId: string, limit?: number): Promise<TimeEntry[]>;
  getAllTimeEntries(): Promise<TimeEntry[]>;
  getActiveTimeEntry(userId: string): Promise<TimeEntry | undefined>;
  
  // Analytics operations
  getUserWeeklyHours(userId: string): Promise<number>;
  getUserMonthlyHours(userId: string): Promise<number>;
  getSystemStats(): Promise<{
    totalEmployees: number;
    activeSessions: number;
    weeklyHours: number;
    avgHours: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Additional user operations
  async updateUser(id: string, userData: UpdateUser): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  // Time entry operations
  async createTimeEntry(timeEntryData: InsertTimeEntry): Promise<TimeEntry> {
    const [timeEntry] = await db
      .insert(timeEntries)
      .values(timeEntryData)
      .returning();
    return timeEntry;
  }

  async updateTimeEntry(id: string, timeEntryData: UpdateTimeEntry): Promise<TimeEntry> {
    const [timeEntry] = await db
      .update(timeEntries)
      .set({ ...timeEntryData, updatedAt: new Date() })
      .where(eq(timeEntries.id, id))
      .returning();
    return timeEntry;
  }

  async getTimeEntry(id: string): Promise<TimeEntry | undefined> {
    const [timeEntry] = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    return timeEntry;
  }

  async getUserTimeEntries(userId: string, limit: number = 50): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.userId, userId))
      .orderBy(desc(timeEntries.createdAt))
      .limit(limit);
  }

  async getAllTimeEntries(): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .orderBy(desc(timeEntries.createdAt));
  }

  async getActiveTimeEntry(userId: string): Promise<TimeEntry | undefined> {
    const [activeEntry] = await db
      .select()
      .from(timeEntries)
      .where(and(
        eq(timeEntries.userId, userId),
        eq(timeEntries.status, "active")
      ))
      .orderBy(desc(timeEntries.clockInTime))
      .limit(1);
    return activeEntry;
  }

  // Analytics operations
  async getUserWeeklyHours(userId: string): Promise<number> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const result = await db
      .select({
        totalMinutes: sql<number>`COALESCE(SUM(${timeEntries.totalHours}), 0)`
      })
      .from(timeEntries)
      .where(and(
        eq(timeEntries.userId, userId),
        gte(timeEntries.clockInTime, weekStart)
      ));

    return result[0]?.totalMinutes || 0;
  }

  async getUserMonthlyHours(userId: string): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const result = await db
      .select({
        totalMinutes: sql<number>`COALESCE(SUM(${timeEntries.totalHours}), 0)`
      })
      .from(timeEntries)
      .where(and(
        eq(timeEntries.userId, userId),
        gte(timeEntries.clockInTime, monthStart)
      ));

    return result[0]?.totalMinutes || 0;
  }

  async getSystemStats(): Promise<{
    totalEmployees: number;
    activeSessions: number;
    weeklyHours: number;
    avgHours: number;
  }> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [totalEmployees] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    const [activeSessions] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(timeEntries)
      .where(eq(timeEntries.status, "active"));

    const [weeklyStats] = await db
      .select({
        totalHours: sql<number>`COALESCE(SUM(${timeEntries.totalHours}), 0)`,
        entryCount: sql<number>`COUNT(*)`
      })
      .from(timeEntries)
      .where(gte(timeEntries.clockInTime, weekStart));

    return {
      totalEmployees: totalEmployees?.count || 0,
      activeSessions: activeSessions?.count || 0,
      weeklyHours: weeklyStats?.totalHours || 0,
      avgHours: weeklyStats?.entryCount > 0 ? (weeklyStats.totalHours / weeklyStats.entryCount) : 0,
    };
  }
}

export const storage = new DatabaseStorage();
