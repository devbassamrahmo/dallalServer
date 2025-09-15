const express = require("express");
const router = express.Router();
const {
  createRequest,
  listRequests,
  adminListRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  listMyRequests,
} = require("../controllers/requestController");

const { protect, isAdmin } = require("../middlewares/authMiddleware"); // ملفك المذكور

// عام: استعراض الطلبات (فلاتر اختيارية)
router.get("/", listRequests);

// أدمن فقط: استعراض شامل بفلاتر
router.get("/admin", protect, isAdmin, adminListRequests);

// طلباتي (يتطلب تسجيل دخول)
router.get("/mine", protect, listMyRequests);

// إنشاء (يتطلب تسجيل دخول)
router.post("/", protect, createRequest);

// مفرد (عام أو خليه محمي حسب رغبتك)
router.get("/:id", getRequestById);

// تحديث/حذف (صاحب الطلب أو أدمن)
router.patch("/:id", protect, updateRequest);
router.delete("/:id", protect, deleteRequest);

module.exports = router;
