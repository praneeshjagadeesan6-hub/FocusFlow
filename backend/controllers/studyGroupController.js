const StudyGroup = require('../models/StudyGroup');

const getGroups = async (req, res, next) => {
  try {
    const groups = await StudyGroup.find({
      'members.user': req.user._id,
    }).populate('members.user', 'name email');

    res.json(groups);
  } catch (error) {
    next(error);
  }
};

const createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const group = await StudyGroup.create({
      name,
      description,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'admin',
        },
      ],
    });

    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
};

const updateGroup = async (req, res, next) => {
  try {
    const group = await StudyGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const member = group.members.find(
      (currentMember) => currentMember.user.toString() === req.user._id.toString()
    );

    if (!member || !['admin', 'moderator'].includes(member.role)) {
      return res.status(403).json({ message: 'You do not have permission to update this group' });
    }

    Object.assign(group, req.body);
    await group.save();
    res.json(group);
  } catch (error) {
    next(error);
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const group = await StudyGroup.findByIdAndDelete(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;

    const group = await StudyGroup.findById(id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const memberExists = group.members.some(
      (currentMember) => currentMember.user.toString() === memberId
    );

    if (!memberExists) {
      return res.status(404).json({ message: 'Member not found in this group' });
    }

    group.members = group.members.filter(
      (currentMember) => currentMember.user.toString() !== memberId
    );

    await group.save();

    res.json({ message: 'Member removed from group' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGroups, createGroup, updateGroup, deleteGroup, removeMember };
