const fs = require('fs')
const Sauce = require('../models/sauce')
const jwt = require('jsonwebtoken')

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce)
  delete sauceObject._id
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  })
  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce enregistrée !' }))
    .catch(error => res.status(400).json({ error }))
}

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce)
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      })
    }
  )
}

exports.modifySauce = async (req, res, next) => {
  if (await isCreator(req, res) == false) {
    return
  }
  const sauceObject = req.file ?
    {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body }
  Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
    .catch(error => res.status(400).json({ error }))
}

exports.deleteSauce = async (req, res, next) => {
  if (await isCreator(req, res) == false) {
    return
  }
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1]
      Sauce.deleteOne({ _id: req.params.id })
        .then(() => {
          fs.unlink(`images/${filename}`, error => {
            if (error) return res.status(200).json({ message: 'Sauce supprimée' })
            res.status(200).json({ message: 'Sauce supprimée !' })
          })
        })
        .catch(error => res.status(400).json({ error }))
    })
    .catch(error => res.status(500).json({ error }))
}

exports.getAllSauce = (req, res, next) => {
  Sauce.find().then(
    (sauces) => {
      res.status(200).json(sauces)
    })
    .catch(
      (error) => {
        res.status(400).json({
          error: error
        })
      }
    )
}

exports.likeDislike = async (req, res, next) => {
  const like = req.body.like
  const userId = req.body.userId
  const sauceId = req.params.id
  try {
    var sauceFound = await Sauce.findOne(
      { _id: sauceId })
    if(!sauceFound){
      return res.status(404).json({ message: "Sauce inexistante" })
    }
  }
  catch (error) {
    return res.status(500).json({ error })
  }

  switch (like) {
    case 1: {
      if (!sauceFound.usersLiked.includes(userId)) {
        Sauce.updateOne(
          { _id: sauceId },
          {
            $inc: { likes: 1 },
            $push: { usersLiked: userId }
          })
          .then(() => res.status(200).json({ message: 'Like ajouté !' }))
          .catch((error) => res.status(400).json({ error }))
        break
      }
      break
    }

    case -1: {
      if (!sauceFound.usersDisliked.includes(userId)) {
        Sauce.updateOne(
          { _id: sauceId },
          {
            $inc: { dislikes: 1 },
            $push: { usersDisliked: userId }
          })
          .then(() => res.status(200).json({ message: "Dislike ajouté !" }))
          .catch((error) => res.status(400).json({ error }))
        break
      }
      break
    }

    case 0: {
      if (sauceFound.usersLiked.includes(userId)) {
        Sauce.updateOne(
          { _id: sauceId },
          {
            $inc: { likes: -1 },
            $pull: { usersLiked: userId }
          })
          .then(() => res.status(200).json({ message: 'Like retiré !' }))
          .catch((error) => res.status(400).json({ error }))
      }
      if (sauceFound.usersDisliked.includes(userId)) {
        Sauce.updateOne(
          { _id: sauceId },
          {
            $inc: { dislikes: -1 },
            $pull: { usersDisliked: userId }
          })
          .then(() => res.status(200).json({ message: 'Dislike retiré !' }))
          .catch((error) => res.status(400).json({ error }))
      }
      break
    }
  }
}

const isCreator = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1]
    const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET')
    var userId = decodedToken.userId
  }
  catch{
    res.status(401).json({ message : "Invalid request!" })
    return false
  }
  try {
    const sauceId = req.params.id
    var sauceFound = await Sauce.findOne(
      { _id: sauceId })
    if(!sauceFound){
      res.status(404).json({ message: "Sauce inexistante" })
      return false
    }
  }
  catch (error) {
    res.status(500).json({ error: error.message })
    return false
  }
  if (sauceFound.userId !== userId) {
    res.status(403).json({ message: "Vous n'êtes pas le créateur de cette sauce" })
    return false
  }
  return true
}