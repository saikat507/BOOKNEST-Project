const { AdminSetting } = require('../models');

const defaults = {
  signup_bonus: 50,
  donation_reward: 20,
  adopt_reward: 5,
  exchange_reward: 15
};

const getNumericSetting = async (key) => {
  const setting = await AdminSetting.findOne({ where: { key } });
  const parsed = parseInt(setting?.value, 10);
  return Number.isFinite(parsed) ? parsed : defaults[key];
};

module.exports = {
  defaults,
  getNumericSetting
};
