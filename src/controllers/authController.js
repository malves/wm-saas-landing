const authService = require('../services/authService');

exports.getLogin = (req, res) => {
  res.render('pages/auth/login', {
    title: 'Connexion',
    layout: 'layouts/auth',
    errors: req.session.errors || [],
    formData: req.session.formData || {}
  });
  delete req.session.errors;
  delete req.session.formData;
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);
    
    // Stocker l'utilisateur en session
    req.session.user = user;
    
    // Rediriger vers la page demandée ou home
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (error) {
    req.session.errors = [{ msg: error.message }];
    req.session.formData = req.body;
    res.redirect('/auth/login');
  }
};

exports.getRegister = (req, res) => {
  res.render('pages/auth/register', {
    title: 'Créer un compte',
    layout: 'layouts/auth',
    errors: req.session.errors || [],
    formData: req.session.formData || {}
  });
  delete req.session.errors;
  delete req.session.formData;
};

exports.postRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await authService.register({ name, email, password });
    
    // Connecter automatiquement après inscription
    req.session.user = user;
    res.redirect('/');
  } catch (error) {
    req.session.errors = [{ msg: error.message }];
    req.session.formData = req.body;
    res.redirect('/auth/register');
  }
};

exports.getForgot = (req, res) => {
  res.render('pages/auth/forgot', {
    title: 'Mot de passe oublié',
    layout: 'layouts/auth',
    errors: req.session.errors || [],
    formData: req.session.formData || {}
  });
  delete req.session.errors;
  delete req.session.formData;
};

exports.getReset = (req, res) => {
  res.render('pages/auth/reset', {
    title: 'Réinitialiser le mot de passe',
    layout: 'layouts/auth',
    errors: req.session.errors || [],
    formData: req.session.formData || {}
  });
  delete req.session.errors;
  delete req.session.formData;
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erreur logout:', err);
    }
    res.redirect('/auth/login');
  });
};

