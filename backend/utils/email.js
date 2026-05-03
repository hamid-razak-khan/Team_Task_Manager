const { TransactionalEmailsApi, SendSmtpEmail, ApiClient } = require('@getbrevo/brevo');

// Initialize Brevo TransactionalEmailsApi with API key
const apiInstance = new TransactionalEmailsApi();
apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

/**
 * Send a transactional email via Brevo.
 * All failures are caught and logged — they never crash the server.
 *
 * @param {string} to      - recipient email
 * @param {string} subject - email subject
 * @param {string} html    - HTML email body
 * @returns {boolean}      - true on success, false on failure
 */
const sendEmail = async (to, subject, html) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[Email] Skipped — BREVO_API_KEY not set in environment');
    return false;
  }

  try {
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.sender = { name: 'TaskMaster', email: process.env.EMAIL_USER || 'noreply@taskmaster.app' };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Email] ✅ Sent to ${to} via Brevo — "${subject}" (ID: ${result?.body?.messageId || 'N/A'})`);
    return true;
  } catch (err) {
    const errMsg = err?.response?.body?.message || err.message;
    console.error(`[Email] ❌ Brevo failed to send to ${to}:`, errMsg);
    return false;
  }
};

// ─────────────────────────────────────────────
// Email Templates
// ─────────────────────────────────────────────

const taskAssignedEmail = ({ userName, taskTitle, projectName, deadline }) => ({
  subject: `📋 New Task Assigned: ${taskTitle}`,
  html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0F19; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #7c3aed, #3b82f6); padding: 32px 40px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #fff;">✅ TaskMaster</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Team Task Manager</p>
      </div>
      <div style="padding: 36px 40px;">
        <h2 style="color: #a78bfa; margin: 0 0 8px;">New Task Assigned</h2>
        <p style="color: #94a3b8; margin: 0 0 28px;">Hello <strong style="color: #e2e8f0;">${userName}</strong>, a new task has been assigned to you.</p>

        <div style="background: #1F2937; border: 1px solid #374151; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
          <table style="width:100%; border-collapse: collapse;">
            <tr>
              <td style="color: #6b7280; font-size: 13px; padding: 6px 0; width: 110px;">Task</td>
              <td style="color: #f1f5f9; font-weight: 600; font-size: 15px; padding: 6px 0;">${taskTitle}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Project</td>
              <td style="color: #f1f5f9; padding: 6px 0;">${projectName || 'N/A'}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Deadline</td>
              <td style="color: ${deadline ? '#fbbf24' : '#6b7280'}; font-weight: 600; padding: 6px 0;">${deadline ? new Date(deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'No deadline set'}</td>
            </tr>
          </table>
        </div>

        <p style="color: #64748b; font-size: 13px; margin: 0;">Please log in to TaskMaster to view the full details and update your progress.</p>
      </div>
      <div style="background: #111827; padding: 20px 40px; text-align: center; border-top: 1px solid #1F2937;">
        <p style="margin: 0; color: #4b5563; font-size: 12px;">This is an automated notification from TaskMaster. Do not reply.</p>
      </div>
    </div>
  `
});

const projectAddedEmail = ({ userName, projectName, adminName }) => ({
  subject: `📁 Added to Project: ${projectName}`,
  html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0F19; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0d9488, #3b82f6); padding: 32px 40px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #fff;">✅ TaskMaster</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Team Task Manager</p>
      </div>
      <div style="padding: 36px 40px;">
        <h2 style="color: #2dd4bf; margin: 0 0 8px;">You've Been Added to a Project</h2>
        <p style="color: #94a3b8; margin: 0 0 28px;">Hello <strong style="color: #e2e8f0;">${userName}</strong>, you have been added to a new project.</p>

        <div style="background: #1F2937; border: 1px solid #374151; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
          <table style="width:100%; border-collapse: collapse;">
            <tr>
              <td style="color: #6b7280; font-size: 13px; padding: 6px 0; width: 110px;">Project</td>
              <td style="color: #f1f5f9; font-weight: 600; font-size: 15px; padding: 6px 0;">${projectName}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Added by</td>
              <td style="color: #f1f5f9; padding: 6px 0;">${adminName || 'Admin'}</td>
            </tr>
          </table>
        </div>

        <p style="color: #64748b; font-size: 13px; margin: 0;">Log in to TaskMaster to collaborate with your team on this project.</p>
      </div>
      <div style="background: #111827; padding: 20px 40px; text-align: center; border-top: 1px solid #1F2937;">
        <p style="margin: 0; color: #4b5563; font-size: 12px;">This is an automated notification from TaskMaster. Do not reply.</p>
      </div>
    </div>
  `
});

const deadlineAlertEmail = ({ userName, taskTitle, projectName, deadline }) => ({
  subject: `⚠️ Deadline Alert: "${taskTitle}" is due soon!`,
  html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0F19; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #b45309, #ef4444); padding: 32px 40px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #fff;">✅ TaskMaster</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Team Task Manager</p>
      </div>
      <div style="padding: 36px 40px;">
        <h2 style="color: #fbbf24; margin: 0 0 8px;">⚠️ Deadline Alert</h2>
        <p style="color: #94a3b8; margin: 0 0 28px;">Hello <strong style="color: #e2e8f0;">${userName}</strong>, a task assigned to you is due in <strong style="color: #f87171;">less than 24 hours!</strong></p>

        <div style="background: #1F2937; border: 1px solid #f87171; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
          <table style="width:100%; border-collapse: collapse;">
            <tr>
              <td style="color: #6b7280; font-size: 13px; padding: 6px 0; width: 110px;">Task</td>
              <td style="color: #f1f5f9; font-weight: 600; font-size: 15px; padding: 6px 0;">${taskTitle}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Project</td>
              <td style="color: #f1f5f9; padding: 6px 0;">${projectName || 'N/A'}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; font-size: 13px; padding: 6px 0;">Due by</td>
              <td style="color: #f87171; font-weight: 700; font-size: 15px; padding: 6px 0;">${new Date(deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
            </tr>
          </table>
        </div>

        <p style="color: #64748b; font-size: 13px; margin: 0;">Please complete or update the status of this task as soon as possible.</p>
      </div>
      <div style="background: #111827; padding: 20px 40px; text-align: center; border-top: 1px solid #1F2937;">
        <p style="margin: 0; color: #4b5563; font-size: 12px;">This is an automated notification from TaskMaster. Do not reply.</p>
      </div>
    </div>
  `
});

module.exports = { sendEmail, taskAssignedEmail, projectAddedEmail, deadlineAlertEmail };
