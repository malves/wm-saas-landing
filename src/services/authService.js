const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');

class AuthService {
  async register(userData) {
    // Vérifier si l'email existe déjà
    if (userRepository.exists(userData.email)) {
      throw new Error('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Créer l'utilisateur
    const user = userRepository.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'user' // Par défaut "user", sauf si spécifié
    });

    // Ne pas retourner le mot de passe
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(email, password) {
    // Trouver l'utilisateur
    const user = userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = userRepository.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      throw new Error('Ancien mot de passe incorrect');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour
    userRepository.update(userId, { password: hashedPassword });
    return true;
  }

  getUserById(userId) {
    const user = userRepository.findById(userId);
    if (!user) return null;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = new AuthService();

