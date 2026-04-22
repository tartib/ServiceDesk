const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/servicedesk';

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;

  const existing = await db.collection('pmorganizations').findOne({ slug: 'servicedesk' });
  if (existing) {
    console.log('Organization already exists:', existing._id.toString());
    // Still ensure all users are assigned
    const result = await db.collection('users').updateMany(
      { $or: [{ organizations: { $size: 0 } }, { organizations: { $exists: false } }] },
      { $push: { organizations: { organizationId: existing._id, role: 'admin', joinedAt: new Date() } } }
    );
    console.log('Updated users:', result.modifiedCount);
    process.exit(0);
  }

  // Find actual admin user
  const admin = await db.collection('users').findOne({ email: 'admin@servicedesk.com' });
  if (!admin) {
    console.error('No admin user found. Run seedTestUsers first.');
    process.exit(1);
  }

  const org = await db.collection('pmorganizations').insertOne({
    name: 'ServiceDesk',
    slug: 'servicedesk',
    description: 'Default organization',
    settings: {
      defaultMethodology: 'scrum',
      timezone: 'Asia/Riyadh',
      dateFormat: 'YYYY-MM-DD',
      workingDays: [0, 1, 2, 3, 4],
      workingHours: { start: '08:00', end: '17:00' }
    },
    subscription: {
      plan: 'enterprise',
      limits: { maxProjects: 100, maxUsers: 100, maxStorage: 100 }
    },
    createdBy: admin._id,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const orgId = org.insertedId;
  console.log('Created org:', orgId.toString());

  // Assign all users to this organization
  const result = await db.collection('users').updateMany(
    { $or: [{ organizations: { $size: 0 } }, { organizations: { $exists: false } }] },
    { $push: { organizations: { organizationId: orgId, role: 'admin', joinedAt: new Date() } } }
  );
  console.log('Updated users:', result.modifiedCount);

  // Also create a default site for ITSM
  const siteExists = await db.collection('sites').findOne({ slug: 'default' });
  if (!siteExists) {
    const site = await db.collection('sites').insertOne({
      name: 'ServiceDesk HQ',
      slug: 'default',
      organizationId: orgId,
      createdBy: admin._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Created site:', site.insertedId.toString());

    // Assign site_id to all users
    await db.collection('users').updateMany(
      { $or: [{ site_id: { $exists: false } }, { site_id: null }] },
      { $set: { site_id: site.insertedId } }
    );
    console.log('Assigned site to all users');
  }

  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
