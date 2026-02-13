import PerformanceModel from '../models/Performance';
import StarRatingModel from '../models/StarRating';
import { IKPI } from '../models/KPI';

export const calculateStarRating = async (performanceId: string): Promise<number> => {
  const performance = await PerformanceModel.findById(performanceId).populate('kpiScores.kpiId');

  if (!performance) {
    throw new Error('Performance record not found');
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const kpiScore of performance.kpiScores) {
    const kpi = kpiScore.kpiId as unknown as IKPI;
    const weight = kpi.weight || 0;

    const normalizedScore = normalizeKPIValue(
      kpiScore.value,
      kpi.minValue,
      kpi.maxValue
    );

    totalWeightedScore += normalizedScore * weight;
    totalWeight += weight;
  }

  const averageScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  const stars = Math.round(averageScore * 5) || 1;

  return Math.min(Math.max(stars, 1), 5);
};

export const validateKPIValue = (value: number, min: number, max: number): boolean => {
  return (
    typeof value === 'number' &&
    !isNaN(value) &&
    isFinite(value) &&
    typeof min === 'number' &&
    typeof max === 'number' &&
    isFinite(min) &&
    isFinite(max) &&
    min < max
  );
};

export const normalizeKPIValue = (value: number, min: number, max: number): number => {
  if (!validateKPIValue(value, min, max)) {
    throw new Error('Invalid KPI value or range');
  }
  if (max === min) return 1;
  const normalized = (value - min) / (max - min);
  return Math.min(Math.max(normalized, 0), 1);
};

export const saveStarRating = async (
  employeeId: string,
  month: number,
  year: number,
  stars: number,
  performanceId: string
) => {
  const existingRating = await StarRatingModel.findOne({
    employeeId,
    month,
    year,
  });

  if (existingRating) {
    return await StarRatingModel.findByIdAndUpdate(
      existingRating._id,
      { stars, performanceId, calculatedAt: new Date() },
      { new: true }
    );
  }

  const starRating = new StarRatingModel({
    employeeId,
    month,
    year,
    stars,
    performanceId,
  });

  return await starRating.save();
};

export const getEmployeeRatingHistory = async (employeeId: string) => {
  return await StarRatingModel.find({ employeeId })
    .populate('employeeId', 'firstName lastName')
    .sort({ year: -1, month: -1 });
};

export const getCurrentMonthRating = async (employeeId: string) => {
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  return await StarRatingModel.findOne({
    employeeId,
    month,
    year,
  }).populate('employeeId', 'firstName lastName');
};
