/**
 * Scheduler Utility for Periodic Tasks
 * This file sets up cron jobs for automatic refund status checks and other scheduled tasks
 */

const cron = require('node-cron');
const { updateAllPendingRefunds } = require('./refund.util');

let scheduledTasks = {};

/**
 * Initialize all scheduled tasks
 */
exports.initializeScheduler = () => {
  console.log('🕐 Initializing scheduler for background tasks...');

  // Schedule refund status checks every 30 minutes
  // Format: "0 */30 * * * *" = every 30 minutes
  scheduledTasks.refundCheck = cron.schedule('0 */30 * * * *', async () => {
    console.log('\n⏰ [SCHEDULED TASK] Running periodic refund status check...');
    try {
      const result = await updateAllPendingRefunds();
      console.log('✅ Scheduled refund check completed');
    } catch (err) {
      console.error('❌ Scheduled refund check failed:', err.message);
    }
  });

  console.log('✅ Scheduler initialized');
  console.log('   📋 Refund Status Check: Every 30 minutes');
  console.log('   📋 Next runs at: :00 and :30 of every hour');

  // Run initial check immediately on startup (for testing/monitoring)
  console.log('\n🚀 Running initial refund check on startup...');
  (async () => {
    try {
      const result = await updateAllPendingRefunds();
      console.log('✅ Initial startup refund check completed');
    } catch (err) {
      console.error('❌ Initial startup refund check failed:', err.message);
    }
  })();

  return scheduledTasks;
};

/**
 * Stop all scheduled tasks
 */
exports.stopScheduler = () => {
  console.log('\n🛑 Stopping all scheduled tasks...');

  if (scheduledTasks.refundCheck) {
    scheduledTasks.refundCheck.stop();
    console.log('✅ Refund check task stopped');
  }

  scheduledTasks = {};
  console.log('✅ All scheduled tasks stopped');
};

/**
 * Manually trigger a refund status check
 */
exports.triggerRefundCheck = async () => {
  console.log('\n🔔 Manual trigger: Refund status check initiated');
  try {
    const result = await updateAllPendingRefunds();
    console.log('✅ Manual refund check completed');
    return result;
  } catch (err) {
    console.error('❌ Manual refund check failed:', err.message);
    throw err;
  }
};

/**
 * Get scheduler status
 */
exports.getSchedulerStatus = () => {
  return {
    isActive: Object.keys(scheduledTasks).length > 0,
    tasks: Object.keys(scheduledTasks),
    timestamp: new Date().toISOString(),
  };
};

/**
 * Reschedule specific task (e.g., to change frequency)
 * @param {String} taskName - Name of the task to reschedule
 * @param {String} cronExpression - New cron expression
 */
exports.rescheduleTask = (taskName, cronExpression) => {
  console.log(`\n🔄 Rescheduling task: ${taskName}`);

  if (scheduledTasks[taskName]) {
    scheduledTasks[taskName].stop();
    console.log(`✅ ${taskName} task stopped`);
  }

  switch (taskName) {
    case 'refundCheck':
      scheduledTasks.refundCheck = cron.schedule(cronExpression, async () => {
        console.log('\n⏰ [SCHEDULED TASK] Running refund status check...');
        try {
          const result = await updateAllPendingRefunds();
          console.log('✅ Refund check completed');
        } catch (err) {
          console.error('❌ Refund check failed:', err.message);
        }
      });
      console.log(`✅ ${taskName} rescheduled with expression: ${cronExpression}`);
      break;

    default:
      console.log(`⚠️  Unknown task: ${taskName}`);
  }
};

module.exports = exports;
