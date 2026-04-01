import prisma from "@/lib/prisma";

type ActionType = "CREATED" | "UPDATED" | "DELETED" | "SENT" | "APPROVED" | "REJECTED";
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
  | "BookingConfig";

/**
 * Log an activity to the ActivityLog table.
 * Fire-and-forget: errors are silently caught to never block the main operation.
 */
export async function logActivity(
  action: ActionType,
  entity: EntityType,
  details?: string,
  entityId?: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entity,
        details: details || `${entity} ${action.toLowerCase()}`,
        entityId: entityId || undefined,
      },
    });
  } catch (error) {
    // Silently fail — logging should never break the main operation
    console.error("Activity log error:", error);
  }
}
