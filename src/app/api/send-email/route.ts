import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { CredentialsEmail } from '@/emails/credentials-email';
import { render } from '@react-email/components';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendEmailRequest {
  to: string;
  userName: string;
  email: string;
  username: string;
  password: string;
  role: 'student' | 'teacher' | 'independent_teacher' | 'institute_owner';
  instituteName?: string;
  referralCode?: string;
  teacherReferralCode?: string;
  studentReferralCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Resend is configured
    if (!resend) {
      console.error('Resend API key not configured');
      return NextResponse.json(
        { error: 'Email service not configured. Please add RESEND_API_KEY environment variable.' },
        { status: 503 }
      );
    }
    
    const body: SendEmailRequest = await request.json();

    const {
      to,
      userName,
      email,
      username,
      password,
      role,
      instituteName,
      referralCode,
      teacherReferralCode,
      studentReferralCode,
    } = body;

    // Validate required fields
    if (!to || !userName || !email || !username || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Render the email component to HTML
    const emailHtml = await render(
      CredentialsEmail({
        userName,
        email,
        username,
        password,
        role,
        instituteName,
        referralCode,
        teacherReferralCode,
        studentReferralCode,
      })
    );

    // Get role-specific subject
    const subjects = {
      student: '🎓 Welcome to ChemClass Pro - Your Student Account',
      teacher: '👨‍🏫 Your ChemClass Pro Teacher Account is Ready!',
      independent_teacher: '🎓 Your ChemClass Pro Teacher Account is Ready!',
      institute_owner: '🏫 Your ChemClass Pro Institute Account is Ready!',
    };

    // Send email using Resend
    const { data, error } = await resend!.emails.send({
      from: 'ChemClass Pro <onboarding@resend.dev>',
      to: [to],
      subject: subjects[role],
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    });

  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
