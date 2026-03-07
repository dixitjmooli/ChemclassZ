import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Button,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface CredentialsEmailProps {
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

export function CredentialsEmail({
  userName,
  email,
  username,
  password,
  role,
  instituteName,
  referralCode,
  teacherReferralCode,
  studentReferralCode,
}: CredentialsEmailProps) {
  const roleLabels = {
    student: 'Student',
    teacher: 'Teacher',
    independent_teacher: 'Independent Teacher',
    institute_owner: 'Institute Owner',
  };

  const getRoleSpecificContent = () => {
    if (role === 'student') {
      return (
        <Section style={infoBox}>
          <Text style={infoTitle}>📚 Your Learning Journey Starts Here!</Text>
          <Text style={infoText}>
            Track your chemistry progress, complete chapters, earn badges, and climb the leaderboard!
          </Text>
          {instituteName && (
            <Text style={infoText}>
              <strong>Institute:</strong> {instituteName}
            </Text>
          )}
        </Section>
      );
    }

    if (role === 'independent_teacher') {
      return (
        <Section style={infoBox}>
          <Text style={infoTitle}>🎓 Your Teacher Referral Code</Text>
          <Text style={codeStyle}>{referralCode}</Text>
          <Text style={infoText}>
            Share this code with your students. They'll use it during registration to join your class!
          </Text>
        </Section>
      );
    }

    if (role === 'institute_owner') {
      return (
        <Section style={infoBox}>
          <Text style={infoTitle}>🏫 Your Institute Referral Codes</Text>
          <Hr style={hrStyle} />
          <Text style={infoText}>
            <strong>👨‍🏫 Teacher Referral Code:</strong>
          </Text>
          <Text style={codeStyle}>{teacherReferralCode}</Text>
          <Text style={infoText}>
            <strong>👨‍🎓 Student Referral Code:</strong>
          </Text>
          <Text style={codeStyle}>{studentReferralCode}</Text>
          <Text style={infoText}>
            Share these codes to onboard teachers and students to your institute!
          </Text>
        </Section>
      );
    }

    return null;
  };

  return (
    <Html>
      <Head />
      <Preview>Welcome to ChemClass Pro - Your login credentials</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={heading}>ChemClass Pro</Heading>
            <Text style={subheading}>
              Welcome, {userName}! 🎉
            </Text>
          </Section>

          {/* Role Badge */}
          <Section style={roleSection}>
            <Text style={roleText}>
              Your account has been created as: <strong>{roleLabels[role]}</strong>
            </Text>
          </Section>

          {/* Credentials Box */}
          <Section style={credentialsBox}>
            <Text style={credentialsTitle}>🔐 Your Login Credentials</Text>
            <Hr style={hrStyle} />
            <Text style={credentialItem}>
              <strong>📧 Email:</strong> {email}
            </Text>
            <Text style={credentialItem}>
              <strong>👤 Username:</strong> {username}
            </Text>
            <Text style={credentialItem}>
              <strong>🔑 Password:</strong> {password}
            </Text>
          </Section>

          {/* Role Specific Content */}
          {getRoleSpecificContent()}

          {/* Login Button */}
          <Section style={buttonSection}>
            <Button style={button} href="https://chemclass.pro">
              Login to Your Account →
            </Button>
          </Section>

          {/* Warning */}
          <Section style={warningBox}>
            <Text style={warningText}>
              ⚠️ Please save your credentials securely. We recommend changing your password after first login.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hrStyle} />
          <Section style={footer}>
            <Text style={footerText}>
              © 2025 ChemClass Pro - CBSE Class 12 Chemistry Progress Tracker
            </Text>
            <Text style={footerText}>
              Need help? Contact us at support@chemclass.pro
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '580px',
};

const header = {
  padding: '32px 48px',
  textAlign: 'center' as const,
  backgroundColor: '#7c3aed',
  borderRadius: '8px 8px 0 0',
};

const heading = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
};

const subheading = {
  color: '#e9d5ff',
  fontSize: '18px',
  margin: '8px 0 0',
};

const roleSection = {
  padding: '20px 48px',
  textAlign: 'center' as const,
};

const roleText = {
  fontSize: '16px',
  color: '#6b7280',
};

const credentialsBox = {
  margin: '0 48px',
  padding: '24px',
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  border: '1px solid #86efac',
};

const credentialsTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#166534',
  margin: '0 0 16px',
};

const credentialItem = {
  fontSize: '16px',
  color: '#374151',
  margin: '8px 0',
};

const infoBox = {
  margin: '24px 48px',
  padding: '24px',
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  border: '1px solid #93c5fd',
};

const infoTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1e40af',
  margin: '0 0 12px',
};

const infoText = {
  fontSize: '14px',
  color: '#374151',
  margin: '8px 0',
};

const codeStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#7c3aed',
  letterSpacing: '4px',
  textAlign: 'center' as const,
  margin: '12px 0',
  padding: '8px',
  backgroundColor: '#faf5ff',
  borderRadius: '4px',
};

const buttonSection = {
  margin: '32px 48px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const warningBox = {
  margin: '24px 48px',
  padding: '16px',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  border: '1px solid #fcd34d',
};

const warningText = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0',
};

const hrStyle = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const footer = {
  padding: '24px 48px 0',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '4px 0',
};

export default CredentialsEmail;
