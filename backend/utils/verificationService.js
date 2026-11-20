const { Op } = require('sequelize');
const UserVerification = require('../models/UserVerification');

const toPlain = (record) => (record && typeof record.toJSON === 'function' ? record.toJSON() : record);

const getLatestVerificationMap = async (userIds) => {
  const ids = [...new Set(userIds.filter(Boolean))];
  const latestByUserId = new Map();

  if (ids.length === 0) {
    return latestByUserId;
  }

  const verifications = await UserVerification.findAll({
    where: { user_id: { [Op.in]: ids } },
    order: [['createdAt', 'DESC'], ['id', 'DESC']]
  });

  verifications.forEach((verification) => {
    if (!latestByUserId.has(verification.user_id)) {
      latestByUserId.set(verification.user_id, verification);
    }
  });

  return latestByUserId;
};

const applyVerificationState = (user, verification) => {
  if (!user) {
    return user;
  }

  const data = toPlain(user);
  const plainVerification = toPlain(verification);
  const verificationStatus = plainVerification ? plainVerification.status : 'unsubmitted';
  const verificationSummary = plainVerification
    ? {
        id: plainVerification.id,
        status: plainVerification.status,
        verified_by: plainVerification.verified_by,
        verified_at: plainVerification.verified_at,
        rejection_reason: plainVerification.rejection_reason,
        createdAt: plainVerification.createdAt,
        updatedAt: plainVerification.updatedAt
      }
    : null;

  return {
    ...data,
    is_verified: verificationStatus === 'approved',
    verification_status: verificationStatus,
    verification: verificationSummary
  };
};

const attachVerificationState = async (users) => {
  const isArray = Array.isArray(users);
  const list = isArray ? users : [users];
  const plainUsers = list.filter(Boolean).map(toPlain);
  const latestByUserId = await getLatestVerificationMap(plainUsers.map((user) => user.id));
  const enriched = plainUsers.map((user) => applyVerificationState(user, latestByUserId.get(user.id)));

  return isArray ? enriched : enriched[0];
};

const attachNestedVerificationState = async (records, key) => {
  const isArray = Array.isArray(records);
  const list = isArray ? records : [records];
  const plainRecords = list.filter(Boolean).map(toPlain);
  const nestedUsers = plainRecords.map((record) => record[key]).filter(Boolean);
  const enrichedUsers = await attachVerificationState(nestedUsers);
  const enrichedById = new Map(enrichedUsers.map((user) => [user.id, user]));

  const enrichedRecords = plainRecords.map((record) => ({
    ...record,
    [key]: record[key] ? enrichedById.get(record[key].id) || record[key] : record[key]
  }));

  return isArray ? enrichedRecords : enrichedRecords[0];
};

const hasApprovedVerification = async (userId) => {
  const latestByUserId = await getLatestVerificationMap([userId]);
  const verification = latestByUserId.get(userId);
  return verification ? verification.status === 'approved' : false;
};

module.exports = {
  attachVerificationState,
  attachNestedVerificationState,
  hasApprovedVerification
};
