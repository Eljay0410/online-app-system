export function mapActivityLog(row = {}) {
  return {
    id: row.id,
    action: row.action || "",
    entityType: row.entity_type || "",
    entityId: row.entity_id || null,
    entityLabel: row.entity_label || "",
    actorUserId: row.actor_user_id || null,
    actorName:
      [row.actor_first_name, row.actor_last_name].filter(Boolean).join(" ") ||
      row.actor_email ||
      "System",
    actorEmail: row.actor_email || "",
    actorRole: row.actor_role || "",
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

export async function recordActivityLog(db, activity = {}) {
  try {
    const actor = activity.actor || {};

    await db.query(
      `INSERT INTO activity_logs
        (actor_user_id, actor_role, action, entity_type, entity_id, entity_label, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        actor.id || null,
        actor.role || "",
        activity.action || "",
        activity.entityType || "",
        activity.entityId || null,
        activity.entityLabel || "",
        JSON.stringify(activity.metadata || {}),
      ]
    );
  } catch (error) {
    console.error("Activity log write failed:", error?.message || error);
  }
}
