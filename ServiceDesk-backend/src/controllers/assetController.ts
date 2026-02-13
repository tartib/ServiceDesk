import { Request, Response } from 'express';
import { Asset, AssetStatus } from '../models/Asset';

export const assetController = {
  /**
   * إنشاء أصل جديد
   */
  async create(req: Request, res: Response) {
    try {
      const asset = new Asset(req.body);
      await asset.save();
      
      res.status(201).json({
        success: true,
        data: asset,
        message: 'Asset created successfully',
      });
    } catch (error) {
      console.error('Error creating asset:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating asset',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * الحصول على قائمة الأصول
   */
  async getAll(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        category_id,
        department,
        search,
        sort_by = 'created_at',
        sort_order = 'desc',
      } = req.query;

      const query: Record<string, unknown> = {};

      if (type) query.type = type;
      if (status) query.status = status;
      if (category_id) query.category_id = category_id;
      if (department) query['assigned_to.department'] = department;

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { asset_id: { $regex: search, $options: 'i' } },
          { serial_number: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const sortObj: Record<string, 1 | -1> = {
        [sort_by as string]: sort_order === 'asc' ? 1 : -1,
      };

      const [assets, total] = await Promise.all([
        Asset.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(Number(limit)),
        Asset.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: assets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching assets',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * الحصول على أصل بواسطة المعرف
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const asset = await Asset.findOne({
        $or: [{ _id: id }, { asset_id: id }],
      });

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found',
        });
      }

      res.json({
        success: true,
        data: asset,
      });
    } catch (error) {
      console.error('Error fetching asset:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching asset',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * تحديث أصل
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const asset = await Asset.findOneAndUpdate(
        { $or: [{ _id: id }, { asset_id: id }] },
        { ...req.body, updated_by: req.body.updated_by || 'system' },
        { new: true, runValidators: true }
      );

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found',
        });
      }

      res.json({
        success: true,
        data: asset,
        message: 'Asset updated successfully',
      });
    } catch (error) {
      console.error('Error updating asset:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating asset',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * حذف أصل
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const asset = await Asset.findOneAndDelete({
        $or: [{ _id: id }, { asset_id: id }],
      });

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found',
        });
      }

      res.json({
        success: true,
        message: 'Asset deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting asset',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * تعيين أصل لمستخدم
   */
  async assign(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user_id, user_name, department } = req.body;

      const asset = await Asset.findOneAndUpdate(
        { $or: [{ _id: id }, { asset_id: id }] },
        {
          assigned_to: {
            user_id,
            user_name,
            department,
            assigned_date: new Date(),
          },
          status: AssetStatus.ACTIVE,
        },
        { new: true }
      );

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found',
        });
      }

      res.json({
        success: true,
        data: asset,
        message: 'Asset assigned successfully',
      });
    } catch (error) {
      console.error('Error assigning asset:', error);
      res.status(500).json({
        success: false,
        message: 'Error assigning asset',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * إلغاء تعيين أصل
   */
  async unassign(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const asset = await Asset.findOneAndUpdate(
        { $or: [{ _id: id }, { asset_id: id }] },
        {
          $unset: { assigned_to: 1 },
          status: AssetStatus.IN_STOCK,
        },
        { new: true }
      );

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found',
        });
      }

      res.json({
        success: true,
        data: asset,
        message: 'Asset unassigned successfully',
      });
    } catch (error) {
      console.error('Error unassigning asset:', error);
      res.status(500).json({
        success: false,
        message: 'Error unassigning asset',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * تغيير حالة الأصل
   */
  async changeStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!Object.values(AssetStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
        });
      }

      const asset = await Asset.findOneAndUpdate(
        { $or: [{ _id: id }, { asset_id: id }] },
        { status },
        { new: true }
      );

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found',
        });
      }

      res.json({
        success: true,
        data: asset,
        message: 'Asset status updated successfully',
      });
    } catch (error) {
      console.error('Error changing asset status:', error);
      res.status(500).json({
        success: false,
        message: 'Error changing asset status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * الحصول على إحصائيات الأصول
   */
  async getStats(req: Request, res: Response) {
    try {
      const [
        totalAssets,
        byType,
        byStatus,
        byDepartment,
        recentAssets,
        warrantyExpiring,
      ] = await Promise.all([
        Asset.countDocuments(),
        Asset.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        Asset.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Asset.aggregate([
          { $match: { 'assigned_to.department': { $exists: true, $ne: null } } },
          { $group: { _id: '$assigned_to.department', count: { $sum: 1 } } },
        ]),
        Asset.find().sort({ created_at: -1 }).limit(5),
        Asset.countDocuments({
          'warranty.end_date': {
            $gte: new Date(),
            $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        }),
      ]);

      const typeStats: Record<string, number> = {};
      byType.forEach((item: { _id: string; count: number }) => {
        typeStats[item._id] = item.count;
      });

      const statusStats: Record<string, number> = {};
      byStatus.forEach((item: { _id: string; count: number }) => {
        statusStats[item._id] = item.count;
      });

      const departmentStats: Record<string, number> = {};
      byDepartment.forEach((item: { _id: string; count: number }) => {
        departmentStats[item._id] = item.count;
      });

      res.json({
        success: true,
        data: {
          total_assets: totalAssets,
          by_type: typeStats,
          by_status: statusStats,
          by_department: departmentStats,
          recent_assets: recentAssets,
          warranty_expiring_soon: warrantyExpiring,
        },
      });
    } catch (error) {
      console.error('Error fetching asset stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching asset stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * الحصول على أصول المستخدم
   */
  async getByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const assets = await Asset.find({
        'assigned_to.user_id': userId,
      }).sort({ 'assigned_to.assigned_date': -1 });

      res.json({
        success: true,
        data: assets,
      });
    } catch (error) {
      console.error('Error fetching user assets:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user assets',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * ربط أصل بحادثة
   */
  async linkIncident(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { incident_id } = req.body;

      const asset = await Asset.findOneAndUpdate(
        { $or: [{ _id: id }, { asset_id: id }] },
        { $addToSet: { linked_incidents: incident_id } },
        { new: true }
      );

      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found',
        });
      }

      res.json({
        success: true,
        data: asset,
        message: 'Incident linked successfully',
      });
    } catch (error) {
      console.error('Error linking incident:', error);
      res.status(500).json({
        success: false,
        message: 'Error linking incident',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
};
