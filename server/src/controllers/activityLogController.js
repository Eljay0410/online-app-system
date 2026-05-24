import pool from "../config/db.js";
import { mapActivityLog } from "../services/activityLogService.js";

const defaultActivityLogLimit = 10;

function getPagination(query = {}) {
  const limit = Number.parseInt(query.limit || String(defaultActivityLogLimit), 10);
  const offset = Number.parseInt(query.offset || "0", 10);

  return {
    limit: Number.isInteger(limit)
      ? Math.min(Math.max(limit, 1), 100)
      : defaultActivityLogLimit,
    offset: Number.isInteger(offset) ? Math.max(offset, 0) : 0,
  };
}

export async function listActivityLogs(req, res) {
  try {
    const { limit, offset } = getPagination(req.query);
    const [result, countResult] = await Promise.all([
      pool.query(
      `SELECT
         al.id,
         al.actor_user_id,
         al.actor_role,
         al.action,
         al.entity_type,
         al.entity_id,
         al.entity_label,
         al.metadata,
         al.created_at,
         u.email AS actor_email,
         u.first_name AS actor_first_name,
         u.last_name AS actor_last_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.actor_user_id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query("SELECT COUNT(*)::int AS total FROM activity_logs"),
    ]);

    return res.json({
      success: true,
      logs: result.rows.map(mapActivityLog),
      pagination: {
        limit,
        offset,
        total: countResult.rows[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs.",
    });
  }
}
