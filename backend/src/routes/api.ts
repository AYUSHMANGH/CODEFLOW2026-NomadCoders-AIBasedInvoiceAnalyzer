import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import {
  uploadInvoice,
  extractInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  reprocessInvoice,
  getDashboardStats,
  getAnalyticsStats,
  getInsightsStats,
  triggerCustomSummary,
  getBudgetSettings,
  updateBudgetSettings,
  getAdvisorChat
} from '../controllers/apiController';

const router = Router();

// Setup Multer for secure file parsing (creating uploads folder inside workspace!)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max limit as requested
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, JPG, and PNG documents are supported.'));
  }
});

// Mapping Routes
router.post('/upload', upload.single('file'), uploadInvoice);
router.post('/extract', extractInvoice);

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalyticsStats);
router.get('/insights', getInsightsStats);
router.post('/insights/summary', triggerSummaryMiddleware, triggerCustomSummary);

router.get('/budget', getBudgetSettings);
router.post('/budget', updateBudgetSettings);

router.get('/invoices', getInvoices);
router.get('/invoices/:id', getInvoiceById);
router.put('/invoices/:id', updateInvoice);
router.post('/invoices/:id/reprocess', reprocessInvoice);
router.delete('/invoices/:id', deleteInvoice);

router.post('/advisor/chat', getAdvisorChat);

// Middleware helpers
function triggerSummaryMiddleware(req: any, res: any, next: any) {
  next();
}

export default router;
