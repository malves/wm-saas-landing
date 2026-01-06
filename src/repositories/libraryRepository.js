const db = require('../data/jsonDatabaseService');

class LibraryRepository {
  findAll() {
    return db.getCollection('libraries');
  }

  findById(id) {
    const libraries = this.findAll();
    return libraries.find(l => l.id === parseInt(id));
  }

  findByUserId(userId) {
    const libraries = this.findAll();
    return libraries.filter(l => l.userId === parseInt(userId));
  }

  findBy(criteria) {
    const libraries = this.findAll();
    return libraries.filter(library => {
      return Object.keys(criteria).every(key => 
        library[key] === criteria[key]
      );
    });
  }

  create(libraryData) {
    const libraries = db.getCollection('libraries');
    const newLibrary = {
      id: db.generateId('libraries'),
      ...libraryData,
      files: libraryData.files || [], // HTML, CSS, JS, images
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    libraries.push(newLibrary);
    db.save();
    return newLibrary;
  }

  update(id, libraryData) {
    const libraries = db.getCollection('libraries');
    const index = libraries.findIndex(l => l.id === parseInt(id));
    if (index === -1) return null;
    
    libraries[index] = {
      ...libraries[index],
      ...libraryData,
      id: libraries[index].id,
      createdAt: libraries[index].createdAt,
      updatedAt: new Date().toISOString()
    };
    db.save();
    return libraries[index];
  }

  delete(id) {
    const libraries = db.getCollection('libraries');
    const index = libraries.findIndex(l => l.id === parseInt(id));
    if (index === -1) return false;
    
    libraries.splice(index, 1);
    db.save();
    return true;
  }
}

module.exports = new LibraryRepository();
