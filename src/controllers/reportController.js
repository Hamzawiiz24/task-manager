module.exports = (reportService) => ({
  get: (req, res) => res.json(reportService.generate(req.query)),
});
