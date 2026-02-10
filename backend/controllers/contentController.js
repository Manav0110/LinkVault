const Content = require('../models/Content');
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Upload content (text or file)
const uploadContent = async (req, res) => {
  try {
    const { text, expiryMinutes, password, oneTimeView, maxViews } = req.body;
    const file = req.file;

    // Validation
    if (!text && !file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Either text or file must be provided' 
      });
    }

    if (text && file) {
      // Clean up uploaded file if both provided
      if (file && file.path) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ 
        success: false, 
        message: 'Only one of text or file can be uploaded at a time' 
      });
    }

    // Generate unique ID
    const uniqueId = nanoid(10);

    // Calculate expiry time
    const expiryTime = parseInt(expiryMinutes) || 10; // Default 10 minutes
    const expiresAt = new Date(Date.now() + expiryTime * 60 * 1000);

    // Prepare content data
    const contentData = {
      uniqueId,
      expiresAt,
      oneTimeView: oneTimeView === 'true' || oneTimeView === true,
      maxViews: maxViews ? parseInt(maxViews) : null
    };

    // Hash password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      contentData.password = await bcrypt.hash(password, salt);
    }

    // Handle text content
    if (text) {
      contentData.type = 'text';
      contentData.textContent = text;
    }

    // Handle file content
    if (file) {
      contentData.type = 'file';
      contentData.fileName = file.originalname;
      contentData.fileSize = file.size;
      contentData.fileType = file.mimetype;
      contentData.filePath = file.path;
    }

    // Create content in database
    const content = await Content.create(contentData);

    // Generate shareable link
    const shareLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/view/${uniqueId}`;

    res.status(201).json({
      success: true,
      message: 'Content uploaded successfully',
      data: {
        uniqueId: content.uniqueId,
        shareLink,
        expiresAt: content.expiresAt,
        type: content.type
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file if upload failed
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload content',
      error: error.message 
    });
  }
};

// Get content by unique ID
const getContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Find content
    const content = await Content.findOne({ uniqueId: id });

    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content not found or has expired' 
      });
    }

    // Check if expired
    if (new Date() > content.expiresAt) {
      // Delete expired content
      await Content.deleteOne({ _id: content._id });
      
      // Delete file if exists
      if (content.type === 'file' && content.filePath) {
        try {
          fs.unlinkSync(content.filePath);
        } catch (err) {
          console.error('Error deleting expired file:', err);
        }
      }

      return res.status(410).json({ 
        success: false, 
        message: 'Content has expired' 
      });
    }

    // Check password if set
    if (content.password) {
      if (!password) {
        return res.status(401).json({ 
          success: false, 
          message: 'Password required',
          requiresPassword: true 
        });
      }

      const isPasswordValid = await bcrypt.compare(password, content.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Incorrect password' 
        });
      }
    }

    // Check max views
    if (content.maxViews && content.viewCount >= content.maxViews) {
      return res.status(403).json({ 
        success: false, 
        message: 'Maximum view count reached' 
      });
    }

    // Enforce one-time view for files before incrementing
    if (content.oneTimeView && content.type === 'file' && content.viewCount >= 1) {
      return res.status(403).json({
        success: false,
        message: 'Content has already been viewed'
      });
    }

    // Increment view count
    content.viewCount += 1;

    // If one-time view, delete after showing
    if (content.oneTimeView && content.viewCount >= 1) {
      if (content.type === 'file') {
        // Keep record until download completes
        await content.save();
        return res.status(200).json({
          success: true,
          data: {
            type: content.type,
            fileName: content.fileName,
            fileType: content.fileType,
            expiresAt: content.expiresAt,
            viewCount: content.viewCount,
            maxViews: content.maxViews
          },
          oneTimeView: true
        });
      }

      const contentData = {
        type: content.type,
        textContent: content.textContent,
        fileName: content.fileName,
        fileType: content.fileType,
        filePath: content.filePath
      };

      // Delete from database
      await Content.deleteOne({ _id: content._id });

      // Don't delete file yet, let download handle it
      return res.status(200).json({
        success: true,
        data: contentData,
        oneTimeView: true
      });
    }

    await content.save();

    // Return content data
    const responseData = {
      type: content.type,
      textContent: content.textContent,
      fileName: content.fileName,
      fileType: content.fileType,
      expiresAt: content.expiresAt,
      viewCount: content.viewCount,
      maxViews: content.maxViews
    };

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve content',
      error: error.message 
    });
  }
};

// Download file
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.query;

    const content = await Content.findOne({ uniqueId: id });

    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found or has expired' 
      });
    }

    // Check if expired
    if (new Date() > content.expiresAt) {
      await Content.deleteOne({ _id: content._id });
      if (content.filePath) {
        try {
          fs.unlinkSync(content.filePath);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
      return res.status(410).json({ 
        success: false, 
        message: 'File has expired' 
      });
    }

    // Check password
    if (content.password) {
      if (!password) {
        return res.status(401).json({ 
          success: false, 
          message: 'Password required' 
        });
      }

      const isPasswordValid = await bcrypt.compare(password, content.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Incorrect password' 
        });
      }
    }

    if (content.type !== 'file') {
      return res.status(400).json({ 
        success: false, 
        message: 'Content is not a file' 
      });
    }

    // Send file
    res.download(content.filePath, content.fileName, async (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false, 
            message: 'Failed to download file' 
          });
        }
        return;
      }

      // Delete one-time view content after successful download
      if (content.oneTimeView) {
        try {
          await Content.deleteOne({ _id: content._id });
          if (content.filePath) {
            fs.unlinkSync(content.filePath);
          }
        } catch (cleanupErr) {
          console.error('Error deleting one-time file:', cleanupErr);
        }
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to download file',
      error: error.message 
    });
  }
};

// Delete content manually
const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findOne({ uniqueId: id });

    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content not found' 
      });
    }

    // Delete file if exists
    if (content.type === 'file' && content.filePath) {
      try {
        fs.unlinkSync(content.filePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    // Delete from database
    await Content.deleteOne({ _id: content._id });

    res.status(200).json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete content',
      error: error.message 
    });
  }
};

module.exports = { uploadContent, getContent, downloadFile, deleteContent };
