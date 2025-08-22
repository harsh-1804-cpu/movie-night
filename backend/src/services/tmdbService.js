const axios = require('axios');
const TMDB_BASE = 'https://api.themoviedb.org/3';
const key = process.env.TMDB_API_KEY;

const searchMovies = async (query, page = 1) => {
  const resp = await axios.get(`${TMDB_BASE}/search/movie`, { params: { api_key: key, query, page }});
  return resp.data;
};

const getMovieDetails = async (id) => {
  const resp = await axios.get(`${TMDB_BASE}/movie/${id}`, { params: { api_key: key }});
  return resp.data;
};

module.exports = { searchMovies, getMovieDetails };
