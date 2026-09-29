const StudyGroup = require('../models/StudyGroup');

const verifyGroupRole = (allowedRoles = []) => async (req, res, next) => {
  try {
    const { groupId, id } = req.params;
    const groupIdToUse = groupId || id;

    const group = await StudyGroup.findById(groupIdToUse);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const member = group.members.find(
      (currentMember) => currentMember.user.toString() === req.user._id.toString()
    );

    if (!member) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    if (!allowedRoles.includes(member.role)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action',
      });
    }

    req.group = group;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyGroupRole };
