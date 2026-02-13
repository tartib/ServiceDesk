import { Request, Response } from 'express';
import AlertModel from '../models/Alert';

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const alerts = await AlertModel.find({ employeeId: userId })
      .populate('employeeId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};

export const getAllAlerts = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit))));

    const result = await AlertModel.find()
      .populate('employeeId', 'firstName lastName department')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const count = await AlertModel.countDocuments();

    res.status(200).json({
      success: true,
      data: result,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
        totalItems: count,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};

export const acknowledgeAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const alert = await AlertModel.findByIdAndUpdate(
      id,
      {
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};

export const getAlertsByEmployee = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const alerts = await AlertModel.find({ employeeId })
      .populate('employeeId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};
