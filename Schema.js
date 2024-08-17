const Joi =require("joi");
const { comment } = require("postcss");

    const listingSchema=Joi.object({
        listing:Joi.object({
            title:Joi.string().required(),
            description:Joi.string().required(),
            location:Joi.string().required(),
            country:Joi.string().required(),
            price:Joi.number().required().min(0),
            image:Joi.string().allow("",null)
        }).required()
    })

    module.exports=listingSchema;

   const reviewSchema=Joi.object({
        review:Joi.object({
            rating:Joi.number().required().min(1).max(5),
            comment:Joi.string().required(),
        }).required()

    })

    module.exports=reviewSchema;