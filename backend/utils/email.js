const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email notification using Resend API.
 * All failures are caught and logged — they never crash the server.
 *
 * @param {string} to      - recipient email
 * @param {string} subject - email subject
 * @param {string} html    - HTML email body
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
const sendEmail = async (to, subject, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'TaskMaster <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Resend email error:', error);
      return false;
    }

    console.log(`Email sent successfully via Resend to ${to} (ID: ${data.id})`);
    return true;
  } catch (err) {
    console.error('Resend exception:', err.message);
    return false;
  }
};

/**
 * Helper to generate a standardized email template.
 */
const getBaseTemplate = (title, content, actionUrl, actionText) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
    <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <h2 style="color: #111827; margin-top: 0;">${title}</h2>
      <div style="color: #4b5563; line-height: 1.6; font-size: 16px;">
        ${content}
      </div>
      ${actionUrl ? `
      <div style="margin-top: 30px;">
        <a href="${actionUrl}" style="background-color: #8b5cf6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          ${actionText}
        </a>
      </div>
      ` : ''}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        This is an automated message from Team Task Manager. Please do not reply.
      </p>
    </div>
  </div>
`;

/**
 * Generate HTML for Task Assignment Email
 */
const taskAssignedEmail = ({ userName, taskTitle, projectName, deadline }) => {
  const isUrgent = new Date(deadline).getTime() - Date.now() < 24 * 60 * 60 * 1000;
  
  const content = `
    <p>Hi <strong>${userName}</strong>,</p>
    <p>You have been assigned a new task: <strong style="color: #3b82f6;">${taskTitle}</strong></p>
    ${projectName ? `<p>Project: <strong>${projectName}</strong></p>` : ''}
    <p>Deadline: <strong style="${isUrgent ? 'color: #ef4444;' : ''}">${new Date(deadline).toLocaleString()}</strong></p>
    ${isUrgent ? `<p style="color: #ef4444; font-weight: bold;">⚠️ This task is due soon!</p>` : ''}
  `;

  return {
    subject: `New Task Assigned: ${taskTitle}`,
    html: getBaseTemplate('New Task Assignment', content, `${process.env.FRONTEND_URL}/tasks`, 'View Task')
  };
};

/**
 * Generate HTML for Project Addition Email
 */
const projectAddedEmail = ({ userName, projectName, adminName }) => {
  const content = `
    <p>Hi <strong>${userName}</strong>,</p>
    <p><strong>${adminName}</strong> has added you to the project: <strong style="color: #8b5cf6;">${projectName}</strong>.</p>
    <p>You can now view and manage tasks within this project.</p>
  `;

  return {
    subject: `Added to Project: ${projectName}`,
    html: getBaseTemplate('Welcome to the Project', content, `${process.env.FRONTEND_URL}/projects`, 'View Project')
  };
};

/**
 * Generate HTML for Deadline Reminder Email
 */
const deadlineAlertEmail = ({ userName, taskTitle, projectName, deadline }) => {
  const content = `
    <p>Hi <strong>${userName}</strong>,</p>
    <p>This is a reminder that your assigned task <strong style="color: #ef4444;">${taskTitle}</strong> is due in less than 24 hours.</p>
    ${projectName ? `<p>Project: <strong>${projectName}</strong></p>` : ''}
    <p>Deadline: <strong>${new Date(deadline).toLocaleString()}</strong></p>
    <p>Please ensure you update the task status before the deadline.</p>
  `;

  return {
    subject: `⚠️ Urgent: Task Due Soon - ${taskTitle}`,
    html: getBaseTemplate('Upcoming Deadline Reminder', content, `${process.env.FRONTEND_URL}/tasks`, 'Update Task Status')
  };
};

module.exports = {
  sendEmail,
  taskAssignedEmail,
  projectAddedEmail,
  deadlineAlertEmail,
  getBaseTemplate
};
