var userModel = require('../models/userModel.js');

/**
 * userController.js
 *
 * @description :: Server-side logic for managing users.
 */
module.exports = {

    list: function(){
        userModel.find((err, users) => {
            if(err) console.log(err);
            else{
                cb(null, users)
            }
            return cb(users)
        });
    },

    eveningUsers: function(){
        const users = userModel.find({waterDaily: 3}, (err, usersE) => {
            if(err) console.log(err);
            else{
                users = usersE
            }
        })
        return users
    },
    afternoonUsers: function(){
        const users = userModel.find({waterDaily: 2}, (err, usersE) => {
            if(err) console.log(err);
            else{
                users = usersE
            }
        })
        return users
    },
    morningUsers: function(cb){
        userModel.find({waterDaily: 1}, function (err, user) {
            if (err) {
                cb(err);
            }
            if (!user) {
                let message = 'No such user'
                cb(message)
            }else{
                cb(null, user)
            }
        });
        return cb
    },

    /**
     * userController.show()
     */
    show: function (senderID, cb) {
        var id = senderID
        userModel.findOne({senderId: id}, function (err, user) {
            if (err) {
                return cb(err)
            }
            if (!user) {
                return cb(null, true)
            }
            return cb(null, false)
        });
    },

    /**
     * userController.create()
     */
    create: function (sender, cb) {
        var user = new userModel({
			senderId : sender
        });

        user.save(function (err, user) {
            if (err) {
                console.log(err);
            }
            cb(null, user);
        });
    },

    /**
     * userController.update()
     */
    update: function (senderID, waterD, cb) {
        var id = senderID
        userModel.findOne({senderId: id}, function (err, user) {
            if (err) {
                cb(err);
            }
            if (!user) {
                let message = 'No such user'
                cb(message)
            }
            user.waterDaily = waterD;
            user.save(function (err, user) {
                if (err) {
                     cb(err)
                }
                cb(null, user)
            });
        });
        return cb;
    },

    /**
     * userController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;
        userModel.findByIdAndRemove(id, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the user.',
                    error: err
                });
            }
            return res.status(204).json();
        });
    }
};
