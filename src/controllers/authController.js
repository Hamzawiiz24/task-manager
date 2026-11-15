module.exports = (userService) => ({
  register: (req, res) => res.status(201).json(userService.register(req.body)),
  login: (req, res) => res.json(userService.login(req.body)),
  list: (req, res) => res.json(userService.listUsers()),
});
