const db = require('../data/jsonDatabaseService');

class UserRepository {
  findAll() {
    return db.getCollection('users');
  }

  findById(id) {
    const users = this.findAll();
    return users.find(u => u.id === parseInt(id));
  }

  findByEmail(email) {
    const users = this.findAll();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  create(userData) {
    const users = db.getCollection('users');
    const newUser = {
      id: db.generateId('users'),
      ...userData,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    db.save();
    return newUser;
  }

  update(id, userData) {
    const users = db.getCollection('users');
    const index = users.findIndex(u => u.id === parseInt(id));
    if (index === -1) return null;
    
    users[index] = {
      ...users[index],
      ...userData,
      id: users[index].id, // Garder l'ID original
      createdAt: users[index].createdAt, // Garder la date de création
      updatedAt: new Date().toISOString()
    };
    db.save();
    return users[index];
  }

  delete(id) {
    const users = db.getCollection('users');
    const index = users.findIndex(u => u.id === parseInt(id));
    if (index === -1) return false;
    
    users.splice(index, 1);
    db.save();
    return true;
  }

  exists(email) {
    return !!this.findByEmail(email);
  }
}

module.exports = new UserRepository();

