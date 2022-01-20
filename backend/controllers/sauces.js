const fs = require('fs')
const Sauce = require('../models/sauce')

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

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ?
    {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body }
  Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
    .catch(error => res.status(400).json({ error }))
}

exports.deleteSauce = (req, res, next) => {
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

exports.likeDislike = (req, res, next) => {
  const like = req.body.like
  const userId = req.body.userId
  const sauceId = req.params.id

  switch (like) {

    case 1 : {
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

    case -1 : {
      Sauce.updateOne(
      { _id: sauceId },
      { 
        $inc: { likes: -1 },
        $push: { usersDisliked: userId }
      })
      .then(() => res.status(200).json({ message: "Dislike ajouté !" }))
      .catch((error) => res.status(400).json({ error }))
      break
    }

    case 0 : {
      Sauce.findOne(
        { _id: sauceId })
        .then((sauce) => {
          if(sauce.usersLiked.includes(userId)) {
            Sauce.updateOne(
              { _id: sauceId },
              { 
                $inc: { likes: -1 },
                $pull: { usersLiked: userId } 
              })
          .then(() => res.status(200).json({ message: 'Like retiré !' }))
          .catch((error) => res.status(400).json({ error }))
          }
          if(sauce.usersDisliked.includes(userId)) {
            Sauce.updateOne(
              { _id: sauceId },
              { 
                $inc: { dislikes: -1 },
                $pull: { usersDisliked: userId }
              })
              .then(() => res.status(200).json({ message: 'Dislike retiré !'}))
              .catch((error) => res.status(400).json({ error }))
          }
        })
        .catch((error) => res.status(400).json({ error }))
        break
      }
  }
}