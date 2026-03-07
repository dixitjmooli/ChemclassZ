import { Resend } from 'resend';
import { render } from '@react-email/components';
import CredentialsEmail from '@/emails/credentials-email';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendCredentialsEmailParams {
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

/**
 * Send credentials email to a newly registered user
 * Can be called from server-side code only (uses RESEND_API_KEY)
 */
export async function sendCredentialsEmail(params: SendCredentialsEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if Resend is configured
    if (!resend) {
      console.warn('Resend API key not configured - email not sent');
      return { success: false, error: 'Email service not configured' };
    }
    
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
    } = params;

    // Get role-specific subject
    const subjects = {
      student: '🎓 Welcome to ChemClass Pro - Your Student Account',
      teacher: '👨‍🏫 Your ChemClass Pro Teacher Account is Ready!',
      independent_teacher: '🎓 Your ChemClass Pro Teacher Account is Ready!',
      institute_owner: '🏫 Your ChemClass Pro Institute Account is Ready!',
    };

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

    // Send email using Resend
    const { data, error } = await resend!.emails.send({
      from: 'ChemClass Pro <onboarding@resend.dev>',
      to: [to],
      subject: subjects[role],
      html: emailHtml,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data?.id);
    return { success: true };

  } catch (error: any) {
    console.error('Email send exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test email sending (sends to your own email)
 */
export async function testEmail(toEmail: string): Promise<{ success: boolean; error?: string }> {
  return sendCredentialsEmail({
    to: toEmail,
    userName: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    password: 'testpass123',
    role: 'student',
    instituteName: 'Test Institute',
  });
}
