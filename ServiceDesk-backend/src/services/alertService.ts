import AlertModel from '../models/Alert';

export const createAlert = async (
  employeeId: string,
  type: 'low_performance' | 'achievement',
  message: string,
  stars: number
) => {
  const alert = new AlertModel({
    employeeId,
    type,
    message,
    stars,
  });

  return await alert.save();
};

export const getEmployeeAlerts = async (employeeId: string) => {
  return await AlertModel.find({ employeeId })
    .populate('employeeId', 'firstName lastName')
    .sort({ createdAt: -1 });
};

export const getAllAlerts = async (page: number = 1, limit: number = 20) => {
  const pageNum = Math.max(1, page);
  const limitNum = Math.min(100, Math.max(1, limit));
  const skip = (pageNum - 1) * limitNum;

  const [alerts, total] = await Promise.all([
    AlertModel.find()
      .populate('employeeId', 'firstName lastName department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AlertModel.countDocuments(),
  ]);

  return {
    data: alerts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
};

export const acknowledgeAlert = async (alertId: string) => {
  return await AlertModel.findByIdAndUpdate(
    alertId,
    {
      acknowledged: true,
      acknowledgedAt: new Date(),
    },
    { new: true }
  );
};

export const createLowPerformanceAlerts = async (month: number, year: number) => {
  const StarRatingModel_import = await import('../models/StarRating').then((m) => m.default);

  const lowPerformers = await StarRatingModel_import.find({
    month,
    year,
    stars: { $lt: 2 },
  });

  for (const rating of lowPerformers) {
    await createAlert(
      rating.employeeId.toString(),
      'low_performance',
      `Your performance rating for ${month}/${year} is ${rating.stars} stars. Please review your performance metrics.`,
      rating.stars
    );
  }
};
