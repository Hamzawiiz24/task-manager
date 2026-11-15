module.exports = (notificationService) => ({
  list: (req, res) => res.json(notificationService.list(req.user.id)),
  markRead: (req, res) => res.json(notificationService.markAsRead(req.user.id, Number(req.params.id))),
});
