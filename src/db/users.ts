import { eq } from "drizzle-orm";
import { db, withDbRetry } from "./index.ts";
import { staffInvitations, stations, users } from "./schema.ts";

export async function getOrCreateUser(
  uid: string,
  email: string,
  fullName?: string
) {
  try {
    return await withDbRetry(async () => {
      const normalizedEmail = (email || "").trim().toLowerCase();
      const now = new Date().toISOString();

      // Check if a seeded or pre-created user already exists with this email
      if (normalizedEmail) {
        const existingByEmail = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        if (existingByEmail[0] && existingByEmail[0].uid !== uid) {
          const updated = await db
            .update(users)
            .set({
              uid,
              full_name: existingByEmail[0].full_name || fullName || normalizedEmail.split("@")[0],
              verified: true,
              last_active_at: now,
              updated_date: now,
            })
            .where(eq(users.id, existingByEmail[0].id))
            .returning();
          return updated[0];
        }
      }

      // Check pending staff invitation if this is a brand-new user
      let invitedStaffRole: string | null = null;
      if (normalizedEmail) {
        const invites = await db
          .select()
          .from(staffInvitations)
          .where(eq(staffInvitations.email, normalizedEmail));
        const pending = invites.find((i) => i.status === "PENDING");
        if (pending) {
          invitedStaffRole = pending.staff_role;
          await db
            .update(staffInvitations)
            .set({ status: "ACCEPTED", updated_date: now })
            .where(eq(staffInvitations.id, pending.id));
        }
      }

      const primaryStations = await db.select().from(stations).limit(1);
      const defaultStationId = primaryStations[0]?.id || "stn_rh_01";

      const result = await db
        .insert(users)
        .values({
          id: uid,
          uid,
          email: normalizedEmail,
          password_hash: "",
          full_name: fullName || normalizedEmail.split("@")[0] || "Listener",
          role: invitedStaffRole === "SUPER_ADMIN" ? "admin" : "user",
          staff_role: invitedStaffRole,
          account_status: "ACTIVE",
          station_id: defaultStationId,
          verified: true,
          last_active_at: now,
          created_date: now,
          updated_date: now,
          created_by_id: "firebase",
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email: normalizedEmail,
            last_active_at: now,
            updated_date: now,
          },
        })
        .returning();

      return result[0];
    });
  } catch (error) {
    console.error("Failed to getOrCreateUser:", error);
    throw new Error("Database user synchronization failed. Please try again later.", {
      cause: error,
    });
  }
}

export async function getUsers() {
  try {
    return await withDbRetry(() => db.select().from(users));
  } catch (error) {
    console.error("Database query failed (getUsers):", error);
    throw new Error("Database query failed. Please try again later.", {
      cause: error,
    });
  }
}
