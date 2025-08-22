const tmdb = require('../services/tmdbService');

exports.search = async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ msg: 'Query q required' });
  const data = await tmdb.searchMovies(q, req.query.page || 1);
  res.json(data);
};

exports.details = async (req, res) => {
  const id = req.params.id;
  const data = await tmdb.getMovieDetails(id);
  res.json(data);
};
