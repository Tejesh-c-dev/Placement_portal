/**
 * @file BaseRepository.js
 * @description Abstract base repository class implementing common CRUD operations.
 * Provides reusable methods for create, read, update, delete operations,
 * pagination, population, and aggregation that can be extended by specific repositories.
 */

/**
 * Base Repository class with common CRUD operations.
 * Serves as a parent class for all entity-specific repositories.
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    const doc = new this.model(data);
    return doc.save();
  }

  async findById(id, populate = []) {
    let query = this.model.findById(id);
    populate.forEach((p) => {
      query = query.populate(p);
    });
    return query.exec();
  }

  async findOne(filter, populate = []) {
    let query = this.model.findOne(filter);
    populate.forEach((p) => {
      query = query.populate(p);
    });
    return query.exec();
  }

  async findAll(filter = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      populate = [],
      select = '',
    } = options;

    const skip = (page - 1) * limit;

    let query = this.model.find(filter);

    if (select) {
      query = query.select(select);
    }

    populate.forEach((p) => {
      query = query.populate(p);
    });

    const [data, total] = await Promise.all([
      query.sort(sort).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async updateById(id, data) {
    return this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async updateOne(filter, data) {
    return this.model.findOneAndUpdate(filter, data, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  async deleteOne(filter) {
    return this.model.findOneAndDelete(filter);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async exists(filter) {
    return this.model.exists(filter);
  }

  async aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }
}

module.exports = BaseRepository;
