import { Request, Response } from 'express';
import EmployeeModel from '../models/Employee';
import logger from '../utils/logger';

const generateErrorId = () => `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const getAllEmployees = async (req: Request, res: Response) => {
  const errorId = generateErrorId();
  try {
    const { department, status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit))));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, string> = {};
    if (department) filter.department = String(department);
    if (status) filter.status = String(status);

    const [employees, total] = await Promise.all([
      EmployeeModel.find(filter)
        .populate('userId', 'email')
        .populate('manager', 'firstName lastName')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      EmployeeModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: employees,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching employees', {
      errorId,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request',
      errorId,
    });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await EmployeeModel.findById(id)
      .populate('userId', 'email')
      .populate('manager', 'firstName lastName');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const { userId, firstName, lastName, department, position, manager, hireDate } = req.body;

    if (!userId || !firstName || !lastName || !department || !position || !hireDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const employee = new EmployeeModel({
      userId,
      firstName,
      lastName,
      department,
      position,
      manager,
      hireDate,
    });

    await employee.save();

    res.status(201).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, department, position, manager, status } = req.body;

    const employee = await EmployeeModel.findByIdAndUpdate(
      id,
      { firstName, lastName, department, position, manager, status },
      { new: true }
    ).populate('userId', 'email');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await EmployeeModel.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};
