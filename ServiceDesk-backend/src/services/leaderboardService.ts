import LeaderboardModel from '../models/Leaderboard';
import StarRatingModel from '../models/StarRating';

export const generateLeaderboard = async (month: number, year: number) => {
  const ratings = await StarRatingModel.aggregate([
    { $match: { month, year } },
    { $sort: { stars: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'employees',
        localField: 'employeeId',
        foreignField: '_id',
        as: 'employee',
      },
    },
    { $unwind: '$employee' },
    {
      $project: {
        _id: 0,
        employeeId: '$employeeId',
        stars: 1,
        department: '$employee.department',
      },
    },
  ]);

  const rankings = ratings.map((rating, index) => ({
    rank: index + 1,
    employeeId: rating.employeeId,
    stars: rating.stars,
    department: rating.department,
  }));

  const existingLeaderboard = await LeaderboardModel.findOne({ month, year });

  if (existingLeaderboard) {
    return await LeaderboardModel.findByIdAndUpdate(
      existingLeaderboard._id,
      { rankings, generatedAt: new Date() },
      { new: true }
    );
  }

  const leaderboard = new LeaderboardModel({
    month,
    year,
    rankings,
  });

  return await leaderboard.save();
};

export const getLeaderboard = async (month: number, year: number) => {
  return await LeaderboardModel.findOne({ month, year }).populate(
    'rankings.employeeId',
    'firstName lastName department'
  );
};

export const getLeaderboardByDepartment = async (
  month: number,
  year: number,
  department: string
) => {
  const leaderboard = await LeaderboardModel.findOne({ month, year }).populate(
    'rankings.employeeId',
    'firstName lastName department'
  );

  if (!leaderboard) return null;

  const filteredRankings = leaderboard.rankings.filter(
    (ranking) => ranking.department === department
  );

  return {
    ...leaderboard.toObject(),
    rankings: filteredRankings,
  };
};

export const getCurrentLeaderboard = async () => {
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  return await getLeaderboard(month, year);
};
