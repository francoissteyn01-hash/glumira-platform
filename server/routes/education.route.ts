import { Router, Request, Response } from "express";

const router = Router();

// List all topics with optional user progress
router.get("/api/education/topics", async (req: Request, res: Response) => {
  try {
    // In production: join with education_progress table for user
    res.json({ totalTopics: 100, message: "Topics served from client-side data" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Single topic content
router.get("/api/education/topics/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    res.json({
      id: parseInt(id),
      content: "Content coming soon — this topic is being written by our clinical education team.",
      keyTakeaways: ["Coming soon"],
      lastUpdated: null,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Mark topic as read
router.post("/api/education/topics/:id/read", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    // In production: upsert into education_progress
    res.json({ topicId: parseInt(id), userId, readAt: new Date().toISOString() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Beta vote for topic
router.post("/api/education/topics/:id/vote", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    res.json({ topicId: parseInt(id), userId, votedAt: new Date().toISOString() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// User reading progress
router.get("/api/education/progress/:userId", async (req: Request, res: Response) => {
  try {
    res.json({ userId: req.params.userId, topicsRead: 0, totalTopics: 100, percentage: 0 });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
