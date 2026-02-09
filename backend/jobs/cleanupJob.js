const cron = require('node-cron');
const Content = require('../models/Content');
const fs = require('fs');

// Run cleanup every 5 minutes
const cleanupJob = cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('Running cleanup job for expired content...');
    
    const expiredContent = await Content.find({
      expiresAt: { $lt: new Date() }
    });

    if (expiredContent.length === 0) {
      console.log('No expired content found');
      return;
    }

    console.log(`Found ${expiredContent.length} expired items`);

    for (const content of expiredContent) {
      if (content.type === 'file' && content.filePath) {
        try {
          if (fs.existsSync(content.filePath)) {
            fs.unlinkSync(content.filePath);
            console.log(`Deleted file: ${content.filePath}`);
          }
        } catch (err) {
          console.error(`Error deleting file ${content.filePath}:`, err);
        }
      }
      await Content.deleteOne({ _id: content._id });
    }

    console.log(`Cleanup completed. Removed ${expiredContent.length} expired items`);

  } catch (error) {
    console.error('Cleanup job error:', error);
  }
});

module.exports = cleanupJob;