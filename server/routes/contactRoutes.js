import { Router } from "express";

import { searchContacts } from "../controllers/contactsController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = Router();

router.post("/search", verifyToken, searchContacts);

export default router;
