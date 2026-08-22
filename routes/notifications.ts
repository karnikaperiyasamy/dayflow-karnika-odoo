import { Router } from "express";
import { pool } from "../db/pool";
import { AuthRequest, requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// GET /api/notifications
router.get("/", async (req: AuthRequest, res) => {
  const result = await pool.query(
    "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
    [req.user!.userId]
  );
  res.json(result.rows);
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req: AuthRequest, res) => {
  const result = await pool.query(
    "UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *",
    [req.params.id, req.user!.userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Notification not found." });
  res.json(result.rows[0]);
});

export default router;
