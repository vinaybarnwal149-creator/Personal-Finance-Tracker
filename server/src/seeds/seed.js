import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { seedDefaultCategoriesForUser } from './defaultCategories.js';
import { generateDemoData } from './demoData.js';
import { logger } from '../utils/logger.js';

const DEMO_EMAIL = 'demo@fintrack.app';
const DEMO_PASSWORD = 'Demo@1234';

async function runSeed() {
  const isForce = process.argv.includes('--force');
  const isReset = process.argv.includes('--reset');

  if (env.NODE_ENV === 'production' && !isForce) {
    logger.error('Refusing to seed in production without --force flag');
    process.exit(1);
  }

  await connectDB();

  logger.info(`Checking demo user: ${DEMO_EMAIL}...`);
  const existingUser = await User.findOne({ email: DEMO_EMAIL });

  if (existingUser) {
    if (isReset) {
      logger.info('Resetting existing demo user data...');
      await Promise.all([
        Transaction.deleteMany({ user: existingUser._id }),
        Category.deleteMany({ user: existingUser._id }),
        Budget.deleteMany({ user: existingUser._id }),
        RefreshToken.deleteMany({ user: existingUser._id }),
        User.deleteOne({ _id: existingUser._id }),
      ]);
    } else {
      logger.info('Demo user already exists. Use --reset to re-seed.');
      await disconnectDB();
      process.exit(0);
    }
  }

  const passwordHash = await User.hashPassword(DEMO_PASSWORD);
  const demoUser = await User.create({
    name: 'Demo User',
    email: DEMO_EMAIL,
    passwordHash,
    currency: process.env.DEMO_CURRENCY || 'USD',
    timezone: 'UTC',
    locale: 'en-US',
  });

  logger.info(`Seeding default categories for demo user...`);
  await seedDefaultCategoriesForUser(demoUser._id);

  logger.info(`Generating ~6 months of realistic transactions and budgets...`);
  await generateDemoData(demoUser._id);

  logger.info(`✅ Demo account seeded successfully!`);
  logger.info(`Credentials: Email: ${DEMO_EMAIL} | Password: ${DEMO_PASSWORD}`);

  await disconnectDB();
  process.exit(0);
}

runSeed().catch((err) => {
  logger.error('Seed script failed:', { error: err.message, stack: err.stack });
  process.exit(1);
});

