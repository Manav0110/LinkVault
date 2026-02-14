const fs = require('fs');
const Content = require('../models/Content');

const getLinkStatus = (content) => {
  if (content.isActive === false) return 'deactivated';
  if (new Date(content.expiresAt) <= new Date()) return 'expired';
  return 'active';
};

const getMyLinks = async (req, res) => {
  try {
    const links = await Content.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = links.map((item) => ({
      uniqueId: item.uniqueId,
      type: item.type,
      fileName: item.fileName,
      fileType: item.fileType,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      isActive: item.isActive,
      deactivatedAt: item.deactivatedAt,
      status: getLinkStatus(item),
      shareLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/view/${item.uniqueId}`
    }));

    const counts = mapped.reduce(
      (acc, link) => {
        acc[link.status] += 1;
        return acc;
      },
      { active: 0, expired: 0, deactivated: 0 }
    );

    return res.status(200).json({
      success: true,
      data: {
        links: mapped,
        counts
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard links',
      error: error.message
    });
  }
};

const deactivateMyLink = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findOne({
      uniqueId: id,
      owner: req.user._id
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }

    if (content.isActive === false) {
      return res.status(200).json({
        success: true,
        message: 'Link is already deactivated'
      });
    }

    content.isActive = false;
    content.deactivatedAt = new Date();

    if (content.type === 'file' && content.filePath) {
      try {
        if (fs.existsSync(content.filePath)) {
          fs.unlinkSync(content.filePath);
        }
      } catch (cleanupError) {
        console.error('Error deleting file during deactivation:', cleanupError);
      }
      content.filePath = null;
    }

    await content.save();

    return res.status(200).json({
      success: true,
      message: 'Link deactivated successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate link',
      error: error.message
    });
  }
};

module.exports = {
  getMyLinks,
  deactivateMyLink
};
