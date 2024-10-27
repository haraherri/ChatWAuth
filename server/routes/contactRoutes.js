import { Router } from "express";
import verifyToken from "../middlewares/verifyToken.js";
import { searchContacts } from "../controllers/contactsController.js";

const router = Router();

router.post("/search", verifyToken, searchContacts);

export default router;
