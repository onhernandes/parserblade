import Joi from "joi";

const userSchema = Joi.object({
  name: Joi.string().min(2).required(),
  age: Joi.number().min(0).max(120).required(),
  email: Joi.string().email().required(),
  isActive: Joi.boolean().default(true),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
  tags: Joi.array().items(Joi.string()).min(1).required(),
});

export default userSchema; 