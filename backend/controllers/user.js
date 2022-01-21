const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const zxcvbn = require('zxcvbn')
const CryptoJS = require('crypto-js')
require('dotenv').config()

const User = require('../models/User')

exports.signup = (req, res, next) => {
  const cryptemail = CryptoJS.SHA256(req.body.email, process.env.SECRET_KEY).toString()
  const passwordSecure = zxcvbn(req.body.password)
  if(passwordSecure.score >= 2) {
    bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: cryptemail,
        password: hash
      })
      user.save()
        .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
        .catch(error => res.status(400).json({ error, message: 'Cette adresse mail est déjà utilisé' }))
    })
    .catch(error => res.status(500).json({ error }))
  }
  else {
    return res.status(401).json({ message: passwordSecure.feedback.warning + "\n" + passwordSecure.feedback.suggestions })
  }
}

exports.login = (req, res, next) => {
  const cryptemail = CryptoJS.SHA256(req.body.email, process.env.SECRET_KEY).toString()
  User.findOne({ email: cryptemail })
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Utilisateur non trouvé !' })
      }
      bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) {
            return res.status(401).json({ error: 'Mot de passe incorrect !' })
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign(
              { userId: user._id },
              process.env.SECRET_TOKEN,
              { expiresIn: '24h' }
            )
          })
        })
        .catch(error => res.status(500).json({ error }))
    })
    .catch(error => res.status(500).json({ error }))
}