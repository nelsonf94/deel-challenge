
const isClientProfile = async (req, res, next) => {
  const { profile } = req;

  if (profile.type !== 'client') {
    return res.status(403).json({ error: 'Forbidden - Access restricted to client only.' });
  }

  next();
}

module.exports = { isClientProfile }