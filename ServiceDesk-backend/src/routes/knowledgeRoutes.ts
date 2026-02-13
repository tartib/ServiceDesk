/**
 * Knowledge Routes - مسارات قاعدة المعرفة
 * Knowledge Base API Routes
 */

import { Router } from 'express';
import {
  createArticle,
  getArticles,
  searchArticles,
  getArticleById,
  updateArticle,
  publishArticle,
  archiveArticle,
  deleteArticle,
  submitFeedback,
  linkIncident,
  getFeaturedArticles,
  getPopularArticles,
  getKnowledgeStats,
} from '../controllers/knowledgeController';

const router = Router();

/**
 * @swagger
 * /api/v1/knowledge/stats:
 *   get:
 *     summary: الحصول على إحصائيات قاعدة المعرفة
 *     description: استرجاع إحصائيات حول مقالات قاعدة المعرفة
 *     tags:
 *       - Knowledge Base
 *     responses:
 *       200:
 *         description: إحصائيات قاعدة المعرفة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب الإحصائيات بنجاح
 *               data:
 *                 totalArticles: 250
 *                 publishedArticles: 200
 *                 draftArticles: 50
 *                 totalViews: 15000
 *                 avgRating: 4.5
 */
router.get('/stats', getKnowledgeStats);

/**
 * @swagger
 * /api/v1/knowledge/search:
 *   get:
 *     summary: البحث عن المقالات
 *     description: البحث في مقالات قاعدة المعرفة باستخدام كلمات مفتاحية
 *     tags:
 *       - Knowledge Base
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: كلمة البحث
 *         example: كيفية إعادة تعيين كلمة المرور
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: الحد الأقصى للنتائج
 *     responses:
 *       200:
 *         description: نتائج البحث
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم البحث بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   title: كيفية إعادة تعيين كلمة المرور
 *                   content: خطوات إعادة تعيين كلمة المرور...
 *                   views: 1250
 *                   rating: 4.8
 */
router.get('/search', searchArticles);

/**
 * @swagger
 * /api/v1/knowledge/featured:
 *   get:
 *     summary: الحصول على المقالات المميزة
 *     description: استرجاع مقالات قاعدة المعرفة المميزة
 *     tags:
 *       - Knowledge Base
 *     responses:
 *       200:
 *         description: المقالات المميزة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب المقالات المميزة بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   title: أفضل الممارسات الأمنية
 *                   views: 5000
 *                   rating: 4.9
 */
router.get('/featured', getFeaturedArticles);

/**
 * @swagger
 * /api/v1/knowledge/popular:
 *   get:
 *     summary: الحصول على المقالات الشهيرة
 *     description: استرجاع أكثر مقالات قاعدة المعرفة شهرة
 *     tags:
 *       - Knowledge Base
 *     responses:
 *       200:
 *         description: المقالات الشهيرة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: تم جلب المقالات الشهيرة بنجاح
 *               data:
 *                 - _id: 507f1f77bcf86cd799439012
 *                   title: حل المشاكل الشائعة
 *                   views: 8500
 *                   rating: 4.7
 */
router.get('/popular', getPopularArticles);

/**
 * @swagger
 * /api/v1/knowledge:
 *   post:
 *     summary: إنشاء مقالة
 *     description: إنشاء مقالة جديدة في قاعدة المعرفة
 *     tags:
 *       - Knowledge Base
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Article created
 */
router.post('/', createArticle);

/**
 * @swagger
 * /api/v1/knowledge:
 *   get:
 *     summary: Get all articles
 *     description: Retrieve all knowledge base articles
 *     tags:
 *       - Knowledge Base
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of articles
 */
router.get('/', getArticles);

/**
 * @swagger
 * /api/v1/knowledge/{id}:
 *   get:
 *     summary: Get article by ID
 *     description: Retrieve a specific article
 *     tags:
 *       - Knowledge Base
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article details
 *       404:
 *         description: Article not found
 */
router.get('/:id', getArticleById);

/**
 * @swagger
 * /api/v1/knowledge/{id}:
 *   put:
 *     summary: Update article
 *     description: Update a knowledge base article
 *     tags:
 *       - Knowledge Base
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Article updated
 *       404:
 *         description: Article not found
 */
router.put('/:id', updateArticle);

/**
 * @swagger
 * /api/v1/knowledge/{id}:
 *   delete:
 *     summary: Delete article
 *     description: Delete a knowledge base article
 *     tags:
 *       - Knowledge Base
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article deleted
 *       404:
 *         description: Article not found
 */
router.delete('/:id', deleteArticle);

/**
 * @swagger
 * /api/v1/knowledge/{id}/publish:
 *   post:
 *     summary: Publish article
 *     description: Publish a knowledge base article
 *     tags:
 *       - Knowledge Base
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article published
 *       404:
 *         description: Article not found
 */
router.post('/:id/publish', publishArticle);

/**
 * @swagger
 * /api/v1/knowledge/{id}/archive:
 *   post:
 *     summary: Archive article
 *     description: Archive a knowledge base article
 *     tags:
 *       - Knowledge Base
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article archived
 *       404:
 *         description: Article not found
 */
router.post('/:id/archive', archiveArticle);

/**
 * @swagger
 * /api/v1/knowledge/{id}/feedback:
 *   post:
 *     summary: Submit article feedback
 *     description: Submit feedback for a knowledge base article
 *     tags:
 *       - Knowledge Base
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback submitted
 *       404:
 *         description: Article not found
 */
router.post('/:id/feedback', submitFeedback);

/**
 * @swagger
 * /api/v1/knowledge/{id}/link-incident:
 *   post:
 *     summary: Link article to incident
 *     description: Link a knowledge base article to an incident
 *     tags:
 *       - Knowledge Base
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - incidentId
 *             properties:
 *               incidentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Article linked to incident
 *       404:
 *         description: Article or incident not found
 */
router.post('/:id/link-incident', linkIncident);

export default router;
