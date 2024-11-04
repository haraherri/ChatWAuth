import { Router } from "express";

import {
  getAllContacts,
  getContactforDMList,
  searchContacts,
} from "../controllers/contactsController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = Router();

router.post("/search", verifyToken, searchContacts);
router.get("/get-contacts-for-dm", verifyToken, getContactforDMList);
router.get("/get-all-contacts", verifyToken, getAllContacts);
export default router;
