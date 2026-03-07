import { NextResponse } from 'next/server';
import { seedPredefinedSubject } from '@/lib/firebase-service';
import { 
  CLASS_9_MATHS, CLASS_9_SCIENCE, CLASS_9_SST,
  CLASS_10_MATHS, CLASS_10_SCIENCE, CLASS_10_SST,
  CLASS_11_PHYSICS, CLASS_11_CHEMISTRY, CLASS_11_MATHS, CLASS_11_BIOLOGY,
  CLASS_11_ACCOUNTANCY, CLASS_11_BUSINESS_STUDIES, CLASS_11_ECONOMICS,
  CLASS_11_HISTORY, CLASS_11_POLITICAL_SCIENCE, CLASS_11_GEOGRAPHY, CLASS_11_PSYCHOLOGY,
  CLASS_12_PHYSICS, CLASS_12_CHEMISTRY, CLASS_12_MATHS, CLASS_12_BIOLOGY,
  CLASS_12_ACCOUNTANCY, CLASS_12_BUSINESS_STUDIES, CLASS_12_ECONOMICS,
  CLASS_12_HISTORY, CLASS_12_POLITICAL_SCIENCE, CLASS_12_GEOGRAPHY, CLASS_12_PSYCHOLOGY,
  PREDEFINED_SYLLABUS 
} from '@/lib/predefined-syllabus';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { classNumber, subject, seedAll } = body;
    
    // Seed all predefined syllabi
    if (seedAll) {
      const results: Record<string, string> = {};
      
      for (const [classNum, subjects] of Object.entries(PREDEFINED_SYLLABUS)) {
        for (const subjectData of subjects) {
          const id = await seedPredefinedSubject(subjectData);
          results[`class${classNum}_${subjectData.name.toLowerCase()}`] = id;
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'All predefined syllabi seeded successfully',
        subjects: results
      });
    }
    
    // Helper function to seed subject
    const seedSubject = async (subjectData: any, subjectName: string, classNum: number) => {
      const id = await seedPredefinedSubject(subjectData);
      return NextResponse.json({ 
        success: true, 
        message: `Class ${classNum} ${subjectName} syllabus seeded`,
        subjectId: id 
      });
    };
    
    // Seed specific class and subject
    if (classNumber && subject) {
      const subjectLower = subject.toLowerCase();
      
      // Class 9 subjects
      if (classNumber === 9) {
        if (subjectLower === 'maths' || subjectLower === 'mathematics') return seedSubject(CLASS_9_MATHS, 'Mathematics', 9);
        if (subjectLower === 'science') return seedSubject(CLASS_9_SCIENCE, 'Science', 9);
        if (subjectLower === 'sst' || subjectLower === 'social science') return seedSubject(CLASS_9_SST, 'Social Science', 9);
      }
      
      // Class 10 subjects
      if (classNumber === 10) {
        if (subjectLower === 'maths' || subjectLower === 'mathematics') return seedSubject(CLASS_10_MATHS, 'Mathematics', 10);
        if (subjectLower === 'science') return seedSubject(CLASS_10_SCIENCE, 'Science', 10);
        if (subjectLower === 'sst' || subjectLower === 'social science') return seedSubject(CLASS_10_SST, 'Social Science', 10);
      }
      
      // Class 11 subjects
      if (classNumber === 11) {
        if (subjectLower === 'physics') return seedSubject(CLASS_11_PHYSICS, 'Physics', 11);
        if (subjectLower === 'chemistry') return seedSubject(CLASS_11_CHEMISTRY, 'Chemistry', 11);
        if (subjectLower === 'maths' || subjectLower === 'mathematics') return seedSubject(CLASS_11_MATHS, 'Mathematics', 11);
        if (subjectLower === 'biology') return seedSubject(CLASS_11_BIOLOGY, 'Biology', 11);
        if (subjectLower === 'accountancy' || subjectLower === 'accounts') return seedSubject(CLASS_11_ACCOUNTANCY, 'Accountancy', 11);
        if (subjectLower === 'business studies' || subjectLower === 'business') return seedSubject(CLASS_11_BUSINESS_STUDIES, 'Business Studies', 11);
        if (subjectLower === 'economics') return seedSubject(CLASS_11_ECONOMICS, 'Economics', 11);
        if (subjectLower === 'history') return seedSubject(CLASS_11_HISTORY, 'History', 11);
        if (subjectLower === 'political science' || subjectLower === 'pol science') return seedSubject(CLASS_11_POLITICAL_SCIENCE, 'Political Science', 11);
        if (subjectLower === 'geography') return seedSubject(CLASS_11_GEOGRAPHY, 'Geography', 11);
        if (subjectLower === 'psychology') return seedSubject(CLASS_11_PSYCHOLOGY, 'Psychology', 11);
      }
      
      // Class 12 subjects
      if (classNumber === 12) {
        if (subjectLower === 'physics') return seedSubject(CLASS_12_PHYSICS, 'Physics', 12);
        if (subjectLower === 'chemistry') return seedSubject(CLASS_12_CHEMISTRY, 'Chemistry', 12);
        if (subjectLower === 'maths' || subjectLower === 'mathematics') return seedSubject(CLASS_12_MATHS, 'Mathematics', 12);
        if (subjectLower === 'biology') return seedSubject(CLASS_12_BIOLOGY, 'Biology', 12);
        if (subjectLower === 'accountancy' || subjectLower === 'accounts') return seedSubject(CLASS_12_ACCOUNTANCY, 'Accountancy', 12);
        if (subjectLower === 'business studies' || subjectLower === 'business') return seedSubject(CLASS_12_BUSINESS_STUDIES, 'Business Studies', 12);
        if (subjectLower === 'economics') return seedSubject(CLASS_12_ECONOMICS, 'Economics', 12);
        if (subjectLower === 'history') return seedSubject(CLASS_12_HISTORY, 'History', 12);
        if (subjectLower === 'political science' || subjectLower === 'pol science') return seedSubject(CLASS_12_POLITICAL_SCIENCE, 'Political Science', 12);
        if (subjectLower === 'geography') return seedSubject(CLASS_12_GEOGRAPHY, 'Geography', 12);
        if (subjectLower === 'psychology') return seedSubject(CLASS_12_PSYCHOLOGY, 'Psychology', 12);
      }
      
      return NextResponse.json({ 
        success: false, 
        message: `Invalid class or subject. Available subjects:
        Class 9: maths, science, sst
        Class 10: maths, science, sst
        Class 11 (Science): physics, chemistry, maths, biology
        Class 11 (Commerce): accountancy, business studies, economics
        Class 11 (Arts): history, political science, geography, psychology
        Class 12 (Science): physics, chemistry, maths, biology
        Class 12 (Commerce): accountancy, business studies, economics
        Class 12 (Arts): history, political science, geography, psychology` 
      }, { status: 400 });
    }
    
    // Seed all subjects for a specific class
    if (classNumber) {
      const classSubjects = PREDEFINED_SYLLABUS[classNumber];
      
      if (!classSubjects) {
        return NextResponse.json({ 
          success: false, 
          message: `No predefined syllabus for class ${classNumber}` 
        }, { status: 400 });
      }
      
      const results: Record<string, string> = {};
      
      for (const subjectData of classSubjects) {
        const id = await seedPredefinedSubject(subjectData);
        results[subjectData.name.toLowerCase()] = id;
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Class ${classNumber} syllabus seeded successfully (${classSubjects.length} subjects)`,
        subjects: results
      });
    }
    
    // Default: seed all classes
    const results: Record<string, string> = {};
    
    for (const [classNum, subjects] of Object.entries(PREDEFINED_SYLLABUS)) {
      for (const subjectData of subjects) {
        const id = await seedPredefinedSubject(subjectData);
        results[`class${classNum}_${subjectData.name.toLowerCase()}`] = id;
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'All predefined syllabi seeded successfully',
      subjects: results
    });
    
  } catch (error: any) {
    console.error('Error seeding syllabus:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  const availableSubjects: Record<number, string[]> = {};
  
  for (const [classNum, subjects] of Object.entries(PREDEFINED_SYLLABUS)) {
    availableSubjects[Number(classNum)] = subjects.map(s => s.name);
  }
  
  return NextResponse.json({
    message: 'Syllabus Seeding API (CBSE 2025-26)',
    usage: {
      'POST /api/seed-syllabus': 'Seed all predefined syllabi',
      'POST { classNumber: 11 }': 'Seed all subjects for class 11',
      'POST { classNumber: 11, subject: "physics" }': 'Seed specific subject',
      'POST { seedAll: true }': 'Seed all predefined syllabi',
    },
    availableClasses: Object.keys(PREDEFINED_SYLLABUS).map(Number),
    availableSubjects,
    streams: {
      11: {
        'Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
        'Commerce': ['Accountancy', 'Business Studies', 'Economics'],
        'Arts/Humanities': ['History', 'Political Science', 'Geography', 'Psychology'],
      },
      12: {
        'Science': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
        'Commerce': ['Accountancy', 'Business Studies', 'Economics'],
        'Arts/Humanities': ['History', 'Political Science', 'Geography', 'Psychology'],
      }
    }
  });
}
