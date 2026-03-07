import { NextResponse } from "next/server";
import { seedSuperAdmin } from "@/lib/firebase-service";

export async function GET() {
  try {
    await seedSuperAdmin();
    return NextResponse.json({ 
      success: true, 
      message: "SuperAdmin account created successfully!",
      credentials: {
        username: "dixitj786",
        password: "dikshit123"
      }
    });
  } catch (error) {
    console.error("Error seeding superadmin:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create SuperAdmin" 
    }, { status: 500 });
  }
}
