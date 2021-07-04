'use strict';

  const _ = require('lodash');

  // function to generate random number to generate random user and comments for blogs
  function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  const isStatic = true;

module.exports = function(Comment) {
Comment.disableRemoteMethodByName('create', isStatic);    
Comment.disableRemoteMethodByName('replaceOrCreate', isStatic);
Comment.disableRemoteMethodByName('patchOrCreate', isStatic);
Comment.disableRemoteMethodByName('exists', isStatic);
Comment.disableRemoteMethodByName('findOne', isStatic);
Comment.disableRemoteMethodByName('deleteById', isStatic);
Comment.disableRemoteMethodByName('count', isStatic);
Comment.disableRemoteMethodByName('prototype.patchComments', isStatic);
Comment.disableRemoteMethodByName('createChangeStream', isStatic);
Comment.disableRemoteMethodByName('updateAll', isStatic);
Comment.disableRemoteMethodByName('replaceById__post', isStatic);
Comment.disableRemoteMethodByName('replaceById', isStatic);
Comment.disableRemoteMethodByName('upsertWithWhere', isStatic);
Comment.disableRemoteMethodByName('patchById', isStatic);

// this is to add the friends relationship model
let beforeComment =  async (userId, blogId) => {
    try {
        let blogExist = await Comment.findOne({"where": {userId: userId, blogId: blogId}});
        if(blogExist == null) {
            let usersAtBlog = await Comment.find({"where": {blogId: blogId}, fields: {userId: true}});
            let userIds = _.map(usersAtBlog, 'userId');
            let createObject = [];
            let existingFriends = await Comment.app.models.Friends.find({where: {user1: userId}, fields: {user2: true}});
            existingFriends = _.map(existingFriends, "user2");
            // this is a custom validation logic that I added to check that 
            // no duplicates are added to the followers table
            userIds = _.pullAll(userIds, existingFriends);
            if(userIds.length >= 1) {
                _.forEach(userIds, function(value) {
                    let obj1 = {};
                    let obj2 = {};
                    obj1.user1 = userId;
                    obj1.user2 = value;
                    obj2.user1 = value;
                    obj2.user2 = userId;
                    createObject.push(obj1);
                    createObject.push(obj2);
                });
            // create the 1st level relationship in friends
            await Comment.app.models.Friends.create(createObject);
            return;
            } else {
                return;
            }
        } else {
            return;
        }
    } catch (error) {
        console.log(`Error ${JSON.stringify(error)}`)
        throw error;
    }
  };
// this function appends the user if not already present into the users array of the blog,
// this users array will help me to get the blogs associated with all the users at that level
 const afterComment = async (userId, blogId) => {
    try {
            let blog = await Comment.app.models.Blogs.findOne({"where": {"blogId": blogId}});
            if(blog.users == null)
                blog.users = [userId];
            else {
                blog.users.push(userId);
                blog.users = _.uniq(blog.users);
            }
            await Comment.app.models.Blogs.replaceById(blog.id, blog);
            return;
      } catch (error) {
          console.log("error adding after hook" + JSON.stringify(error));
          throw error;
      }
  };


Comment.commentToBlog = async (userId, blogId) => {
    try {
        let user = await Comment.app.models.Users.findOne({where: {userId: userId}});
        if(user == null)
            return "user does not exists";
        let blog = await Comment.app.models.Blogs.findOne({where: {blogId: blogId}});
        if(blog == null)
            return "that blog that you want to comment on is absent";
        
        await beforeComment(userId, blogId);
        let comment = await Comment.findOne({where: {userId: userId, blogId: blogId}});
        if(comment == null) {
            await Comment.create({userId: userId, blogId: blogId});
            await afterComment(userId, blogId);
            return "Comment added"; 
        } else {
            return "Comment added to the same blog by the same user again";
        }
    } catch(err) {
        console.log(err);
        throw err;
    }
};

  Comment.remoteMethod(
    'commentToBlog', {
        http: {
            path: '/',
            verb: 'post'
        },
        accepts: [
            {arg: 'userId', type: 'number',http: {source: "query"}, required: true},
            {arg: 'blogId', type: 'number',http: {source: "query"}, required: true},
        ],
        returns: {
            type: 'string',
            root: true
        }   
    }
  );
  
  // this is to add bulk comments depending on the input sent from the user
  Comment.bulkComments = async (comments) => {
    for(let i=1; i<=comments; i++){
        let userId = getRandomInt(50000) + 1;
        let blogId = getRandomInt(30000) + 1;
         
        try {
            await Comment.commentToBlog(userId, blogId);
        } catch (error) {
            console.log('failed to load comment for', userId, ' ', 'error is' , JSON.stringify(error));
        }
    }
    return "Comments added successfully";
}
Comment.remoteMethod(
    'bulkComments', {
        http: {
            path: '/bulkComments',
            verb: 'post'
        },
        accepts: {
            arg: 'numberOfComments', type: 'number', required: true
        },
        returns: {
            type: 'string',
            root: true
        }   
    }
)
};