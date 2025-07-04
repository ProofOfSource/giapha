const admin = require('firebase-admin');
const db = admin.firestore();

// Migration script to update the database schema
const migrateData = async () => {
  console.log('Starting data migration...');

  // 1. Update 'persons' collection
  console.log("Updating 'persons' collection...");
  const personsSnapshot = await db.collection('persons').get();
  const personPromises = [];
  personsSnapshot.forEach(doc => {
    const personData = doc.data();
    const updateData = {
      gender: personData.gender || 'other', // Default to 'other'
      isDeceased: !!personData.deathDate,
      profilePictureUrl: personData.profilePictureUrl || '',
      biography: personData.biography || '',
      generation: personData.generation || null,
      contactInfo: personData.contactInfo || {
        address: '',
        phone: '',
        personalEmail: ''
      },
      burialPlace: personData.burialPlace || ''
    };
    personPromises.push(doc.ref.set(updateData, { merge: true }));
  });
  await Promise.all(personPromises);
  console.log(`'persons' collection updated for ${personsSnapshot.size} documents.`);

  // 2. Rename 'posts' to 'stories'
  console.log("Migrating 'posts' to 'stories'...");
  const postsSnapshot = await db.collection('posts').get();
  if (postsSnapshot.size > 0) {
    const storyPromises = [];
    postsSnapshot.forEach(doc => {
      const postData = doc.data();
      const storyData = {
        title: postData.title,
        content: postData.content,
        authorId: postData.authorId,
        createdAt: postData.createdAt,
        coverImageUrl: '',
        taggedPersons: []
      };
      storyPromises.push(db.collection('stories').add(storyData));
      storyPromises.push(doc.ref.delete()); // Delete the old post
    });
    await Promise.all(storyPromises);
    console.log(`Migrated ${postsSnapshot.size} documents from 'posts' to 'stories'.`);
  } else {
    console.log("'posts' collection is empty. Nothing to migrate.");
  }

  // 3. Update 'users' collection
  console.log("Updating 'users' collection...");
  const usersSnapshot = await db.collection('users').get();
  const userPromises = [];
  usersSnapshot.forEach(doc => {
    const userData = doc.data();
    const updateData = {
      personId: userData.personId || null,
      notificationSettings: userData.notificationSettings || {}
    };
    userPromises.push(doc.ref.set(updateData, { merge: true }));
  });
  await Promise.all(userPromises);
  console.log(`'users' collection updated for ${usersSnapshot.size} documents.`);

  console.log('Data migration completed successfully!');
};

// To run this script, use the Firebase Functions shell:
// 1. `firebase functions:shell`
// 2. `const migrate = require('./migration.js')`
// 3. `migrate.migrateData()`

module.exports = { migrateData };
