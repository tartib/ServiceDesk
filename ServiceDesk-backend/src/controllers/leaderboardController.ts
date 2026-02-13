import { Request, Response } from 'express';
import LeaderboardModel from '../models/Leaderboard';

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const leaderboard = await LeaderboardModel.findOne({ month, year }).populate(
      'rankings.employeeId',
      'firstName lastName department'
    );

    if (!leaderboard) {
      return res.status(404).json({
        success: false,
        error: 'Leaderboard not found for current month',
      });
    }

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};

export const getLeaderboardByMonth = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.params;

    const leaderboard = await LeaderboardModel.findOne({
      month: parseInt(month),
      year: parseInt(year),
    }).populate('rankings.employeeId', 'firstName lastName department');

    if (!leaderboard) {
      return res.status(404).json({
        success: false,
        error: 'Leaderboard not found for specified month',
      });
    }

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};

export const getLeaderboardByDepartment = async (req: Request, res: Response) => {
  try {
    const { department } = req.params;
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const leaderboard = await LeaderboardModel.findOne({ month, year });

    if (!leaderboard) {
      return res.status(404).json({
        success: false,
        error: 'Leaderboard not found',
      });
    }

    const filteredRankings = leaderboard.rankings.filter(
      (ranking) => ranking.department === department
    );

    res.status(200).json({
      success: true,
      data: {
        ...leaderboard.toObject(),
        rankings: filteredRankings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
};
