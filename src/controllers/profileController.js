const userRepository = require('../repositories/userRepository');
const authService = require('../services/authService');
const { validateRegister, checkValidation } = require('../middlewares/validation');

exports.getProfile = (req, res) => {
  const userId = req.session.user?.id;
  const user = userRepository.findById(userId);

  const formData = req.session.formData || user || {};

  res.render('pages/profile/edit', {
    title: 'Mon profil',
    user,
    formData,
    errors: req.session.errors || [],
    flash: req.session.flash
  });

  delete req.session.errors;
  delete req.session.flash;
  delete req.session.formData;
};

exports.postProfile = (req, res) => {
  const userId = req.session.user?.id;
  const user = userRepository.findById(userId);

  if (!user) {
    req.session.flash = { type: 'danger', message: 'Utilisateur introuvable.' };
    return res.redirect('/profile');
  }

  const updated = userRepository.update(userId, {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    street: req.body.street,
    apt: req.body.apt,
    city: req.body.city,
    state: req.body.state
  });

  // Mettre à jour la session pour refléter les nouvelles infos affichées
  req.session.user = {
    ...req.session.user,
    name: updated.name,
    email: updated.email
  };

  req.session.flash = { type: 'success', message: 'Profil mis à jour avec succès.' };
  res.redirect('/profile');
};

// User management methods
exports.getUsers = (req, res) => {
  const users = userRepository.findAll();

  res.render('pages/profile/users', {
    title: 'Gestion des utilisateurs',
    users,
    errors: req.session.errors || [],
    flash: req.session.flash
  });

  delete req.session.errors;
  delete req.session.flash;
};

exports.getCreateUser = (req, res) => {
  res.render('pages/profile/create-user', {
    title: 'Créer un utilisateur',
    formData: req.session.formData || {},
    errors: req.session.errors || []
  });

  delete req.session.errors;
  delete req.session.formData;
};

exports.postCreateUser = [
  validateRegister,
  checkValidation,
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      const user = await authService.register({
        name,
        email,
        password,
        role: role || 'user'
      });

      req.session.flash = { type: 'success', message: 'Utilisateur créé avec succès.' };
      res.redirect('/profile/users');
    } catch (error) {
      req.session.errors = [{ msg: error.message }];
      req.session.formData = req.body;
      res.redirect('/profile/users/create');
    }
  }
];

// Edit user methods
exports.getEditUser = (req, res) => {
  const userId = req.params.id;
  const editUser = userRepository.findById(parseInt(userId));

  if (!editUser) {
    req.session.flash = { type: 'danger', message: 'Utilisateur introuvable.' };
    return res.redirect('/profile/users');
  }

  const formData = req.session.formData || editUser || {};

  res.render('pages/profile/edit-user', {
    title: 'Modifier l\'utilisateur',
    user: req.session.user,
    editUser,
    formData,
    errors: req.session.errors || [],
    flash: req.session.flash
  });

  delete req.session.errors;
  delete req.session.flash;
  delete req.session.formData;
};

exports.postEditUser = (req, res) => {
  const userId = parseInt(req.params.id);
  const editUser = userRepository.findById(userId);

  if (!editUser) {
    req.session.flash = { type: 'danger', message: 'Utilisateur introuvable.' };
    return res.redirect('/profile/users');
  }

  const updated = userRepository.update(userId, {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    street: req.body.street,
    apt: req.body.apt,
    city: req.body.city,
    state: req.body.state,
    role: req.body.role
  });

  req.session.flash = { type: 'success', message: 'Utilisateur mis à jour avec succès.' };
  res.redirect('/profile/users');
};
