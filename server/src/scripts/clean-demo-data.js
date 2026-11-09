import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { logger } from '../utils/logger.js';

const DEMO_EMAIL = 'demo@fintrack.app';

async function runCleanup() {
  await connectDB();
  logger.info('Starting cleanup of non-demo or leaked sample data...');

  const demoUser = await User.findOne({ email: DEMO_EMAIL });
  if (!demoUser) {
    logger.warn(`No demo user (${DEMO_EMAIL}) found in database.`);
  }

  const demoUserId = demoUser?._id;

  // Option 1: Clean sample demo transactions that leaked into non-demo accounts
  // (Identified by demo seed notes)
  const demoSeedNotes = [
    'Monthly salary deposit',
    'Apartment rent payment',
    'Electricity and high-speed internet',
    'Supermarket weekly grocery haul',
    'Weekend dinner and drinks',
    'Weekly grocery shopping',
    'Gas station fuel fill-up',
    'Video streaming & music subscriptions',
    'Pharmacy and health supplements',
    'Books and online course',
    'Clothing and personal items',
    'Quarterly stock investment dividend',
    'Web development freelance project',
  ];

  const leakedTxnFilter = {
    note: { $in: demoSeedNotes },
  };
  if (demoUserId) {
    leakedTxnFilter.user = { $ne: demoUserId };
  }

  const leakedTxnResult = await Transaction.deleteMany(leakedTxnFilter);
  logger.info(`Deleted ${leakedTxnResult.deletedCount} leaked sample transactions from non-demo accounts.`);

  // If passed --purge-all-except-demo flag: delete all transactions & budgets not belonging to demo user
  if (process.argv.includes('--purge-all-except-demo')) {
    if (demoUserId) {
      const purgeTxn = await Transaction.deleteMany({ user: { $ne: demoUserId } });
      const purgeBudgets = await Budget.deleteMany({ user: { $ne: demoUserId } });
      logger.info(`Purged all non-demo transactions: ${purgeTxn.deletedCount}`);
      logger.info(`Purged all non-demo budgets: ${purgeBudgets.deletedCount}`);
    }
  }

  logger.info('Cleanup completed successfully.');
  await disconnectDB();
  process.exit(0);
}

runCleanup().catch((err) => {
  logger.error('Cleanup script failed:', err);
  process.exit(1);
});

