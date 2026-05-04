const express = require('express');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');
const { sendEmail, projectAddedEmail } = require('../utils/email');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const query = { organizationId: req.user.organizationId };
    
    // Members only see projects they are assigned to (or created)
    if (req.user.role !== 'Admin') {
      query.$or = [{ admin: req.user._id }, { members: req.user._id }];
    }

    const projects = await Project.find(query)
      .populate('admin', 'name email')
      .populate('members', 'name email');
      
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', [auth, roleCheck(['Admin'])], async (req, res) => {
  try {
    const { name, description, members, attachments } = req.body;
    const project = new Project({
      name,
      description,
      admin: req.user._id,
      organizationId: req.user.organizationId,
      members: members || [],
      attachments: attachments || []
    });
    await project.save();

    if (members && members.length > 0) {
      const memberUsers = await User.find({ _id: { $in: members } }, 'name email');

      Promise.all(memberUsers.map(async (member) => {
        // 1. In-app notification
        const notif = await Notification.create({
          userId: member._id,
          message: `📁 You have been added to project: "${name}"`,
          type: 'project_added',
          relatedId: project._id,
          read: false,
          emailSent: false
        }).catch(() => null);

        // 2. Send email
        if (notif) {
          const { subject, html } = projectAddedEmail({
            userName: member.name,
            projectName: name,
            adminName: req.user.name
          });
          const sent = await sendEmail(member.email, subject, html);
          if (sent) await Notification.findByIdAndUpdate(notif._id, { emailSent: true });
        }
      }));
    }

    // Create group chat for this project (includes admin + members)
    const allMembers = [req.user._id, ...(members || [])].map(String);
    const uniqueMembers = [...new Set(allMembers)];
    await Chat.create({
      projectId: project._id,
      isGroup: true,
      name: name,
      members: uniqueMembers,
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members', 'name email');
      
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    // Ensure the project belongs to the user's organization
    if (project.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Members can only access projects they belong to (or created)
    if (req.user.role !== 'Admin') {
      const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
      const isAdmin = project.admin._id.toString() === req.user._id.toString();
      if (!isMember && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', [auth, roleCheck(['Admin'])], async (req, res) => {
  try {
    const oldProject = await Project.findById(req.params.id);
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('admin', 'name email')
      .populate('members', 'name email');
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Notify only newly added members
    if (req.body.members && oldProject) {
      const oldMemberIds = oldProject.members.map(m => m.toString());
      const newMemberIds = req.body.members.filter(id => !oldMemberIds.includes(id.toString()));

      if (newMemberIds.length > 0) {
        const newMemberUsers = await User.find({ _id: { $in: newMemberIds } }, 'name email');

        Promise.all(newMemberUsers.map(async (member) => {
          const notif = await Notification.create({
            userId: member._id,
            message: `📁 You have been added to project: "${project.name}"`,
            type: 'project_added',
            relatedId: project._id,
            read: false,
            emailSent: false
          }).catch(() => null);

          if (notif) {
            const { subject, html } = projectAddedEmail({
              userName: member.name,
              projectName: project.name,
              adminName: req.user.name
            });
            const sent = await sendEmail(member.email, subject, html);
            if (sent) await Notification.findByIdAndUpdate(notif._id, { emailSent: true });
          }
        }));
      }
    }

    // Sync group chat members
    if (req.body.members !== undefined) {
      const allMembers = [project.admin._id.toString(), ...req.body.members.map(String)];
      const uniqueMembers = [...new Set(allMembers)];
      await Chat.findOneAndUpdate(
        { projectId: project._id, isGroup: true },
        { members: uniqueMembers, name: project.name },
        { upsert: true }
      );
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', [auth, roleCheck(['Admin'])], async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
