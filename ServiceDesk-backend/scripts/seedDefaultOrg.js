const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/servicedesk';

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const adminUserId = '69a60023039ff88fca146e46';

  // Check if org already exists
  const existing = await db.collection('pmorganizations').findOne({ slug: 'servicedesk' });
  if (existing) {
    console.log('Organization already exists:', existing._id.toString());
    process.exit(0);
  }

  // Create default organization
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
    createdBy: new mongoose.Types.ObjectId(adminUserId),
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

  // Verify
  const admin = await db.collection('users').findOne(
    { _id: new mongoose.Types.ObjectId(adminUserId) },
    { projection: { email: 1, organizations: 1 } }
  );
  console.log('Admin user orgs:', JSON.stringify(admin.organizations));

  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
