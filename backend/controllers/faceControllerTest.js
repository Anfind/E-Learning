// Test dummy controller
const verifyFace = (req, res) => {
  res.json({ message: 'verify face test' });
};

const getFaceStatus = (req, res) => {
  res.json({ message: 'get status test' });
};

module.exports = {
  verifyFace,
  getFaceStatus
};
