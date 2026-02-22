import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const chaptersData = [
  {
    chapterNo: 1,
    name: "Solutions",
    topics: [
      { topicNo: 1, name: "Types of Solutions" },
      { topicNo: 2, name: "Solubility" },
      { topicNo: 3, name: "Raoult's Law" },
      { topicNo: 4, name: "Colligative Properties" },
      { topicNo: 5, name: "Abnormal Molar Masses" }
    ]
  },
  {
    chapterNo: 2,
    name: "Electrochemistry",
    topics: [
      { topicNo: 1, name: "Electrochemical Cells" },
      { topicNo: 2, name: "Nernst Equation" },
      { topicNo: 3, name: "Conductance" },
      { topicNo: 4, name: "Electrolytic Cells" },
      { topicNo: 5, name: "Batteries" }
    ]
  },
  {
    chapterNo: 3,
    name: "Chemical Kinetics",
    topics: [
      { topicNo: 1, name: "Rate of Reaction" },
      { topicNo: 2, name: "Factors Affecting Rate" },
      { topicNo: 3, name: "Integrated Rate Laws" },
      { topicNo: 4, name: "Collision Theory" }
    ]
  },
  {
    chapterNo: 4,
    name: "The d and f Block Elements",
    topics: [
      { topicNo: 1, name: "d-Block Elements" },
      { topicNo: 2, name: "f-Block Elements" },
      { topicNo: 3, name: "Properties" },
      { topicNo: 4, name: "Compounds" }
    ]
  },
  {
    chapterNo: 5,
    name: "Coordination Compounds",
    topics: [
      { topicNo: 1, name: "Nomenclature" },
      { topicNo: 2, name: "Isomerism" },
      { topicNo: 3, name: "Bonding" },
      { topicNo: 4, name: "Stability" },
      { topicNo: 5, name: "Applications" }
    ]
  },
  {
    chapterNo: 6,
    name: "Haloalkanes and Haloarenes",
    topics: [
      { topicNo: 1, name: "Classification" },
      { topicNo: 2, name: "Nomenclature" },
      { topicNo: 3, name: "Preparation" },
      { topicNo: 4, name: "Properties" },
      { topicNo: 5, name: "Reactions" }
    ]
  },
  {
    chapterNo: 7,
    name: "Alcohols, Phenols and Ethers",
    topics: [
      { topicNo: 1, name: "Alcohols" },
      { topicNo: 2, name: "Phenols" },
      { topicNo: 3, name: "Ethers" },
      { topicNo: 4, name: "Preparation" },
      { topicNo: 5, name: "Properties" }
    ]
  },
  {
    chapterNo: 8,
    name: "Aldehydes, Ketones and Carboxylic Acids",
    topics: [
      { topicNo: 1, name: "Aldehydes" },
      { topicNo: 2, name: "Ketones" },
      { topicNo: 3, name: "Carboxylic Acids" },
      { topicNo: 4, name: "Reactions" }
    ]
  },
  {
    chapterNo: 9,
    name: "Amines",
    topics: [
      { topicNo: 1, name: "Classification" },
      { topicNo: 2, name: "Nomenclature" },
      { topicNo: 3, name: "Preparation" },
      { topicNo: 4, name: "Properties" },
      { topicNo: 5, name: "Reactions" }
    ]
  },
  {
    chapterNo: 10,
    name: "Biomolecules",
    topics: [
      { topicNo: 1, name: "Carbohydrates" },
      { topicNo: 2, name: "Proteins" },
      { topicNo: 3, name: "Enzymes" },
      { topicNo: 4, name: "Vitamins" },
      { topicNo: 5, name: "Nucleic Acids" }
    ]
  }
];

async function seedDatabase() {
  console.log('Starting database seed...');
  
  try {
    // Create admin user
    const adminDoc = await getDoc(doc(db, 'users', 'admin'));
    if (!adminDoc.exists()) {
      await setDoc(doc(db, 'users', 'admin'), {
        name: 'Admin',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        school: 'ChemClass Pro',
        createdAt: Timestamp.now()
      });
      console.log('✓ Admin user created');
    } else {
      console.log('✓ Admin user already exists');
    }

    // Create chapters and topics
    for (const chapterData of chaptersData) {
      const chapterId = `chapter_${chapterData.chapterNo}`;
      const chapterDoc = await getDoc(doc(db, 'chapters', chapterId));
      
      if (!chapterDoc.exists()) {
        await setDoc(doc(db, 'chapters', chapterId), {
          chapterNo: chapterData.chapterNo,
          name: chapterData.name
        });

        for (const topicData of chapterData.topics) {
          const topicId = `topic_${chapterData.chapterNo}_${topicData.topicNo}`;
          await setDoc(doc(db, 'topics', topicId), {
            chapterId,
            topicNo: topicData.topicNo,
            name: topicData.name
          });
        }
        
        console.log(`✓ Chapter ${chapterData.chapterNo}: ${chapterData.name} created with ${chapterData.topics.length} topics`);
      } else {
        console.log(`✓ Chapter ${chapterData.chapterNo}: ${chapterData.name} already exists`);
      }
    }
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('  Admin: admin / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed
seedDatabase();
