import prisma from "@/lib/prisma";

type ActionType =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "SENT"
  | "APPROVED"
  | "REJECTED"
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "EXPORTED"
  | "UPLOADED";

type EntityType =
  | "Article"
  | "Service"
  | "FAQ"
  | "Review"
  | "TeamMember"
  | "Deadline"
  | "Inquiry"
  | "User"
  | "Campaign"
  | "Setting"
  | "Subscriber"
  | "Appointment"
  | "BookingConfig"
  | "Auth"
  | "Media";

/**
 * Log an activity to the ActivityLog table.
 * Fire-and-forget: errors are silently caught to never block the main operation.
 */
export async function logActivity(
  action: ActionType,
  entity: EntityType,
  details?: string,
  entityId?: string,
  userId?: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entity,
        details: details || `${entity} ${action.toLowerCase()}`,
        entityId: entityId || undefined,
        userId: userId || undefined,
      },
    });
  } catch (error) {
    console.error("Activity log error:", error);
  }
}
